const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { queryOne, runSql } = require('../db');
const { JWT_SECRET, authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.post('/register', (req, res) => {
  const { lab_name, password } = req.body;
  if (!lab_name || !password) {
    return res.status(400).json({ error: 'Lab name and password are required' });
  }
  if (password.length < 4) {
    return res.status(400).json({ error: 'Password must be at least 4 characters' });
  }

  const existing = queryOne('SELECT id FROM labs WHERE lab_name = ?', [lab_name]);
  if (existing) {
    return res.status(409).json({ error: 'Lab name already exists' });
  }

  const password_hash = bcrypt.hashSync(password, 10);
  const result = runSql(
    'INSERT INTO labs (lab_name, password_hash) VALUES (?, ?)',
    [lab_name, password_hash]
  );

  const token = jwt.sign(
    { labId: result.lastInsertRowid, labName: lab_name },
    JWT_SECRET,
    { expiresIn: '30d' }
  );

  res.status(201).json({ token, lab_name, lab_id: result.lastInsertRowid });
});

router.post('/login', (req, res) => {
  const { lab_name, password } = req.body;
  if (!lab_name || !password) {
    return res.status(400).json({ error: 'Lab name and password are required' });
  }

  const lab = queryOne('SELECT * FROM labs WHERE lab_name = ?', [lab_name]);
  if (!lab || !bcrypt.compareSync(password, lab.password_hash)) {
    return res.status(401).json({ error: 'Invalid lab name or password' });
  }

  const token = jwt.sign(
    { labId: lab.id, labName: lab.lab_name },
    JWT_SECRET,
    { expiresIn: '30d' }
  );

  res.json({ token, lab_name: lab.lab_name, lab_id: lab.id });
});

router.get('/settings', authMiddleware, (req, res) => {
  const lab = queryOne('SELECT id, lab_name, stale_threshold_days, created_at FROM labs WHERE id = ?', [req.labId]);
  if (!lab) return res.status(404).json({ error: 'Lab not found' });
  res.json(lab);
});

router.put('/settings', authMiddleware, (req, res) => {
  const { stale_threshold_days, lab_name, password } = req.body;

  if (stale_threshold_days !== undefined) {
    runSql('UPDATE labs SET stale_threshold_days = ? WHERE id = ?', [stale_threshold_days, req.labId]);
  }
  if (lab_name) {
    const existing = queryOne('SELECT id FROM labs WHERE lab_name = ? AND id != ?', [lab_name, req.labId]);
    if (existing) return res.status(409).json({ error: 'Lab name already taken' });
    runSql('UPDATE labs SET lab_name = ? WHERE id = ?', [lab_name, req.labId]);
  }
  if (password) {
    const hash = bcrypt.hashSync(password, 10);
    runSql('UPDATE labs SET password_hash = ? WHERE id = ?', [hash, req.labId]);
  }

  const lab = queryOne('SELECT id, lab_name, stale_threshold_days, created_at FROM labs WHERE id = ?', [req.labId]);
  res.json(lab);
});

module.exports = router;
