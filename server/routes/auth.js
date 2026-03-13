const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { queryOne, queryAll, runSql } = require('../db');
const { JWT_SECRET, authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Register a new lab
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
    { labId: result.lastInsertRowid, labName: lab_name, isAdmin: false },
    JWT_SECRET,
    { expiresIn: '30d' }
  );

  res.status(201).json({ token, lab_name, lab_id: result.lastInsertRowid, is_admin: false });
});

// Register an admin account (requires ADMIN_SECRET env var)
router.post('/register-admin', (req, res) => {
  const { lab_name, password, admin_secret } = req.body;
  const ADMIN_SECRET = process.env.ADMIN_SECRET;

  if (!ADMIN_SECRET) {
    return res.status(500).json({ error: 'Admin registration not configured' });
  }
  if (!admin_secret || admin_secret !== ADMIN_SECRET) {
    return res.status(403).json({ error: 'Invalid admin secret' });
  }
  if (!lab_name || !password) {
    return res.status(400).json({ error: 'Name and password are required' });
  }

  const existing = queryOne('SELECT id FROM labs WHERE lab_name = ?', [lab_name]);
  if (existing) {
    return res.status(409).json({ error: 'Name already exists' });
  }

  const password_hash = bcrypt.hashSync(password, 10);
  const result = runSql(
    'INSERT INTO labs (lab_name, password_hash, is_admin) VALUES (?, ?, 1)',
    [lab_name, password_hash]
  );

  const token = jwt.sign(
    { labId: result.lastInsertRowid, labName: lab_name, isAdmin: true },
    JWT_SECRET,
    { expiresIn: '30d' }
  );

  res.status(201).json({ token, lab_name, lab_id: result.lastInsertRowid, is_admin: true });
});

// Login
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
    { labId: lab.id, labName: lab.lab_name, isAdmin: !!lab.is_admin },
    JWT_SECRET,
    { expiresIn: '30d' }
  );

  res.json({ token, lab_name: lab.lab_name, lab_id: lab.id, is_admin: !!lab.is_admin });
});

// Get lab settings / profile
router.get('/settings', authMiddleware, (req, res) => {
  const lab = queryOne(
    'SELECT id, lab_name, stale_threshold_days, pi_name, institution, department, website_url, is_admin, created_at FROM labs WHERE id = ?',
    [req.labId]
  );
  if (!lab) return res.status(404).json({ error: 'Lab not found' });
  res.json(lab);
});

// Update lab settings / profile
router.put('/settings', authMiddleware, (req, res) => {
  const { stale_threshold_days, lab_name, password, pi_name, institution, department, website_url } = req.body;

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
  if (pi_name !== undefined) runSql('UPDATE labs SET pi_name = ? WHERE id = ?', [pi_name, req.labId]);
  if (institution !== undefined) runSql('UPDATE labs SET institution = ? WHERE id = ?', [institution, req.labId]);
  if (department !== undefined) runSql('UPDATE labs SET department = ? WHERE id = ?', [department, req.labId]);
  if (website_url !== undefined) runSql('UPDATE labs SET website_url = ? WHERE id = ?', [website_url, req.labId]);

  const lab = queryOne(
    'SELECT id, lab_name, stale_threshold_days, pi_name, institution, department, website_url, created_at FROM labs WHERE id = ?',
    [req.labId]
  );
  res.json(lab);
});

// ---- Lab Members CRUD ----

router.get('/members', authMiddleware, (req, res) => {
  const members = queryAll('SELECT * FROM lab_members WHERE lab_id = ? ORDER BY created_at ASC', [req.labId]);
  res.json(members);
});

router.post('/members', authMiddleware, (req, res) => {
  const { name, role, email } = req.body;
  if (!name) return res.status(400).json({ error: 'Member name is required' });

  const result = runSql(
    'INSERT INTO lab_members (lab_id, name, role, email) VALUES (?, ?, ?, ?)',
    [req.labId, name, role || '', email || '']
  );

  const member = queryOne('SELECT * FROM lab_members WHERE id = ?', [result.lastInsertRowid]);
  res.status(201).json(member);
});

router.put('/members/:id', authMiddleware, (req, res) => {
  const member = queryOne('SELECT * FROM lab_members WHERE id = ? AND lab_id = ?', [req.params.id, req.labId]);
  if (!member) return res.status(404).json({ error: 'Member not found' });

  const { name, role, email } = req.body;
  runSql(
    'UPDATE lab_members SET name = COALESCE(?, name), role = COALESCE(?, role), email = COALESCE(?, email) WHERE id = ?',
    [name, role, email, req.params.id]
  );

  const updated = queryOne('SELECT * FROM lab_members WHERE id = ?', [req.params.id]);
  res.json(updated);
});

router.delete('/members/:id', authMiddleware, (req, res) => {
  const member = queryOne('SELECT * FROM lab_members WHERE id = ? AND lab_id = ?', [req.params.id, req.labId]);
  if (!member) return res.status(404).json({ error: 'Member not found' });

  runSql('DELETE FROM lab_members WHERE id = ?', [req.params.id]);
  res.json({ success: true });
});

module.exports = router;
