const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'manuscript-tracker-secret-change-in-production';

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.labId = decoded.labId;
    req.labName = decoded.labName;
    req.isAdmin = decoded.isAdmin || false;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function adminMiddleware(req, res, next) {
  authMiddleware(req, res, () => {
    const { queryOne } = require('../db');
    const lab = queryOne('SELECT is_admin FROM labs WHERE id = ?', [req.labId]);
    if (!lab || !lab.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  });
}

module.exports = { authMiddleware, adminMiddleware, JWT_SECRET };
