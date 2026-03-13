const express = require('express');
const cors = require('cors');
const path = require('path');
const { getDb } = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Log every request for debugging
app.use((req, res, next) => {
  console.log(`[REQ] ${req.method} ${req.path}`);
  next();
});

async function start() {
  console.log('[BOOT] Initializing database...');
  await getDb();
  console.log('[BOOT] Database initialized successfully');

  try {
    console.log('[BOOT] Loading auth routes...');
    const authRoutes = require('./routes/auth');
    app.use('/api/auth', authRoutes);
    console.log('[BOOT] Auth routes loaded');

    console.log('[BOOT] Loading manuscript routes...');
    const manuscriptRoutes = require('./routes/manuscripts');
    app.use('/api/manuscripts', manuscriptRoutes);
    console.log('[BOOT] Manuscript routes loaded');

    console.log('[BOOT] Loading admin routes...');
    const adminRoutes = require('./routes/admin');
    app.use('/api/admin', adminRoutes);
    console.log('[BOOT] Admin routes loaded');
  } catch (err) {
    console.error('[BOOT] FAILED to load routes:', err);
  }

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString(), version: '2.0' });
  });
  console.log('[BOOT] Health check registered');

  // Log all registered routes
  console.log('[BOOT] Registered routes:');
  app._router.stack.forEach((layer) => {
    if (layer.route) {
      console.log(`  ${Object.keys(layer.route.methods).join(',').toUpperCase()} ${layer.route.path}`);
    } else if (layer.name === 'router') {
      const prefix = layer.regexp.source
        .replace('\\/?', '')
        .replace('(?=\\/|$)', '')
        .replace(/\\\//g, '/')
        .replace('^', '')
        .replace(/\(\?:.*?\)/g, '');
      console.log(`  ROUTER mounted at pattern: ${layer.regexp}`);
    }
  });

  if (process.env.NODE_ENV === 'production') {
    const distPath = path.join(__dirname, '..', 'client', 'dist');
    const indexPath = path.join(distPath, 'index.html');
    console.log(`[BOOT] Production mode — static path: ${distPath}`);
    console.log(`[BOOT] index.html exists: ${require('fs').existsSync(indexPath)}`);

    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      // Don't serve index.html for API routes — return 404 instead
      if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'Not found' });
      }
      res.sendFile(indexPath);
    });
  }

  app.listen(PORT, () => {
    console.log(`[BOOT] Server running on http://localhost:${PORT}`);
  });
}

start().catch(err => {
  console.error('[BOOT] Failed to start server:', err);
  process.exit(1);
});
