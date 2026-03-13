const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Track boot status
let bootStatus = 'starting';
let bootError = null;

// Health check — registered FIRST, always works even if DB fails
app.get('/api/health', (req, res) => {
  res.json({
    status: bootStatus,
    error: bootError,
    time: new Date().toISOString(),
    version: '3.0',
    node: process.version,
    env: process.env.NODE_ENV || 'development',
  });
});

// Start the server immediately so Render sees it as alive
const server = app.listen(PORT, () => {
  console.log(`[BOOT] Server listening on port ${PORT}`);
  initApp();
});

async function initApp() {
  try {
    console.log('[BOOT] Initializing database...');
    const { getDb } = require('./db');
    await getDb();
    console.log('[BOOT] Database initialized successfully');
    bootStatus = 'db_ready';

    console.log('[BOOT] Loading routes...');
    const authRoutes = require('./routes/auth');
    const manuscriptRoutes = require('./routes/manuscripts');
    const adminRoutes = require('./routes/admin');

    app.use('/api/auth', authRoutes);
    app.use('/api/manuscripts', manuscriptRoutes);
    app.use('/api/admin', adminRoutes);
    console.log('[BOOT] All routes loaded');
    bootStatus = 'routes_ready';

    if (process.env.NODE_ENV === 'production') {
      const distPath = path.join(__dirname, '..', 'client', 'dist');
      const indexPath = path.join(distPath, 'index.html');
      console.log(`[BOOT] Static path: ${distPath}`);
      console.log(`[BOOT] index.html exists: ${fs.existsSync(indexPath)}`);

      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        if (req.path.startsWith('/api/')) {
          return res.status(404).json({ error: 'Not found' });
        }
        res.sendFile(indexPath);
      });
      console.log('[BOOT] Static serving configured');
    }

    bootStatus = 'ready';
    console.log('[BOOT] Server fully initialized');
  } catch (err) {
    bootStatus = 'error';
    bootError = err.message;
    console.error('[BOOT] Initialization failed:', err);
  }
}
