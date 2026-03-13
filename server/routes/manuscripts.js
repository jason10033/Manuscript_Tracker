const express = require('express');
const { queryAll, queryOne, runSql } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// List all manuscripts for this lab
router.get('/', (req, res) => {
  const manuscripts = queryAll(
    'SELECT * FROM manuscripts WHERE lab_id = ? ORDER BY updated_at DESC',
    [req.labId]
  );

  // Attach events to each manuscript
  manuscripts.forEach(m => {
    m.events = queryAll(
      'SELECT * FROM status_events WHERE manuscript_id = ? ORDER BY date ASC, id ASC',
      [m.id]
    );
  });

  res.json(manuscripts);
});

// Get single manuscript with events
router.get('/:id', (req, res) => {
  const manuscript = queryOne(
    'SELECT * FROM manuscripts WHERE id = ? AND lab_id = ?',
    [req.params.id, req.labId]
  );
  if (!manuscript) return res.status(404).json({ error: 'Manuscript not found' });

  manuscript.events = queryAll(
    'SELECT * FROM status_events WHERE manuscript_id = ? ORDER BY date ASC, id ASC',
    [req.params.id]
  );

  res.json(manuscript);
});

// Create manuscript
router.post('/', (req, res) => {
  const { title, authors, contact_person, contact_email, current_status } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });

  const status = current_status || 'IDEA';
  const result = runSql(
    'INSERT INTO manuscripts (lab_id, title, authors, contact_person, contact_email, current_status) VALUES (?, ?, ?, ?, ?, ?)',
    [req.labId, title, authors || '', contact_person || '', contact_email || '', status]
  );

  runSql(
    "INSERT INTO status_events (manuscript_id, status, notes) VALUES (?, ?, 'Manuscript created')",
    [result.lastInsertRowid, status]
  );

  const manuscript = queryOne('SELECT * FROM manuscripts WHERE id = ?', [result.lastInsertRowid]);
  manuscript.events = queryAll('SELECT * FROM status_events WHERE manuscript_id = ?', [result.lastInsertRowid]);
  res.status(201).json(manuscript);
});

// Update manuscript metadata
router.put('/:id', (req, res) => {
  const manuscript = queryOne(
    'SELECT * FROM manuscripts WHERE id = ? AND lab_id = ?',
    [req.params.id, req.labId]
  );
  if (!manuscript) return res.status(404).json({ error: 'Manuscript not found' });

  const { title, authors, contact_person, contact_email } = req.body;
  runSql(
    'UPDATE manuscripts SET title = COALESCE(?, title), authors = COALESCE(?, authors), contact_person = COALESCE(?, contact_person), contact_email = COALESCE(?, contact_email), updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [title, authors, contact_person, contact_email, req.params.id]
  );

  const updated = queryOne('SELECT * FROM manuscripts WHERE id = ?', [req.params.id]);
  res.json(updated);
});

// Delete manuscript
router.delete('/:id', (req, res) => {
  const manuscript = queryOne(
    'SELECT * FROM manuscripts WHERE id = ? AND lab_id = ?',
    [req.params.id, req.labId]
  );
  if (!manuscript) return res.status(404).json({ error: 'Manuscript not found' });

  runSql('DELETE FROM status_events WHERE manuscript_id = ?', [req.params.id]);
  runSql('DELETE FROM manuscripts WHERE id = ?', [req.params.id]);
  res.json({ success: true });
});

// Add status change event
router.post('/:id/events', (req, res) => {
  const manuscript = queryOne(
    'SELECT * FROM manuscripts WHERE id = ? AND lab_id = ?',
    [req.params.id, req.labId]
  );
  if (!manuscript) return res.status(404).json({ error: 'Manuscript not found' });

  const { status, date, journal, notes, round_number } = req.body;
  if (!status) return res.status(400).json({ error: 'Status is required' });

  let roundNum = round_number || 0;
  if (status === 'SUBMITTED' && !round_number) {
    const lastRound = queryOne(
      "SELECT MAX(round_number) as max_round FROM status_events WHERE manuscript_id = ? AND status = 'SUBMITTED'",
      [req.params.id]
    );
    roundNum = (lastRound?.max_round || 0) + 1;
  }

  runSql(
    'INSERT INTO status_events (manuscript_id, status, date, journal, notes, round_number) VALUES (?, ?, COALESCE(?, CURRENT_TIMESTAMP), ?, ?, ?)',
    [req.params.id, status, date || null, journal || '', notes || '', roundNum]
  );

  runSql(
    'UPDATE manuscripts SET current_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [status, req.params.id]
  );

  const updated = queryOne('SELECT * FROM manuscripts WHERE id = ?', [req.params.id]);
  updated.events = queryAll(
    'SELECT * FROM status_events WHERE manuscript_id = ? ORDER BY date ASC, id ASC',
    [req.params.id]
  );
  res.status(201).json(updated);
});

// Dashboard stats
router.get('/stats/summary', (req, res) => {
  const statusCounts = queryAll(
    'SELECT current_status, COUNT(*) as count FROM manuscripts WHERE lab_id = ? GROUP BY current_status',
    [req.labId]
  );

  const lab = queryOne('SELECT stale_threshold_days FROM labs WHERE id = ?', [req.labId]);
  const threshold = lab?.stale_threshold_days || 30;

  const staleManuscripts = queryAll(
    `SELECT *, CAST((julianday('now') - julianday(updated_at)) AS INTEGER) as days_in_stage
     FROM manuscripts
     WHERE lab_id = ?
       AND current_status NOT IN ('ACCEPTED', 'REJECTED')
       AND CAST((julianday('now') - julianday(updated_at)) AS INTEGER) >= ?
     ORDER BY days_in_stage DESC`,
    [req.labId, threshold]
  );

  const totalManuscripts = queryOne(
    'SELECT COUNT(*) as count FROM manuscripts WHERE lab_id = ?',
    [req.labId]
  );

  const avgDaysPerStatus = queryAll(
    `SELECT e.status,
      ROUND(AVG(CAST((julianday(COALESCE(next_e.date, datetime('now'))) - julianday(e.date)) AS REAL)), 1) as avg_days
    FROM status_events e
    JOIN manuscripts m ON e.manuscript_id = m.id
    LEFT JOIN status_events next_e ON next_e.manuscript_id = e.manuscript_id
      AND next_e.id = (SELECT MIN(id) FROM status_events WHERE manuscript_id = e.manuscript_id AND id > e.id)
    WHERE m.lab_id = ?
    GROUP BY e.status`,
    [req.labId]
  );

  res.json({
    statusCounts,
    staleManuscripts,
    totalManuscripts: totalManuscripts?.count || 0,
    avgDaysPerStatus,
    staleThreshold: threshold
  });
});

module.exports = router;
