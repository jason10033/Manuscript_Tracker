const express = require('express');
const { queryAll } = require('../db');
const { adminMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(adminMiddleware);

// Get all labs with usage stats
router.get('/labs', (req, res) => {
  const labs = queryAll(`
    SELECT
      l.id, l.lab_name, l.pi_name, l.institution, l.department, l.website_url, l.created_at,
      COUNT(DISTINCT m.id) as manuscript_count,
      SUM(CASE WHEN m.current_status = 'IDEA' THEN 1 ELSE 0 END) as idea_count,
      SUM(CASE WHEN m.current_status = 'DRAFT_IN_PROGRESS' THEN 1 ELSE 0 END) as draft_count,
      SUM(CASE WHEN m.current_status = 'DRAFT_CIRCULATED' THEN 1 ELSE 0 END) as circulated_count,
      SUM(CASE WHEN m.current_status = 'SUBMITTED' THEN 1 ELSE 0 END) as submitted_count,
      SUM(CASE WHEN m.current_status = 'REVISE_RESUBMIT' THEN 1 ELSE 0 END) as rr_count,
      SUM(CASE WHEN m.current_status = 'REJECTED' THEN 1 ELSE 0 END) as rejected_count,
      SUM(CASE WHEN m.current_status = 'ACCEPTED' THEN 1 ELSE 0 END) as accepted_count,
      MAX(m.updated_at) as last_activity,
      (SELECT COUNT(*) FROM lab_members lm WHERE lm.lab_id = l.id) as member_count
    FROM labs l
    LEFT JOIN manuscripts m ON m.lab_id = l.id
    WHERE l.is_admin = 0
    GROUP BY l.id
    ORDER BY l.created_at DESC
  `);

  res.json(labs);
});

module.exports = router;
