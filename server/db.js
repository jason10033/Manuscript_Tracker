const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'manuscripts.db');

let db;

async function getDb() {
  if (db) return db;

  const SQL = await initSqlJs();

  // Load existing database or create new
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS labs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lab_name TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      stale_threshold_days INTEGER DEFAULT 30,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS manuscripts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lab_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      authors TEXT DEFAULT '',
      contact_person TEXT DEFAULT '',
      contact_email TEXT DEFAULT '',
      current_status TEXT DEFAULT 'IDEA',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (lab_id) REFERENCES labs(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS status_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      manuscript_id INTEGER NOT NULL,
      status TEXT NOT NULL,
      date DATETIME DEFAULT CURRENT_TIMESTAMP,
      journal TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      round_number INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (manuscript_id) REFERENCES manuscripts(id) ON DELETE CASCADE
    )
  `);

  // Migrations — add new columns to labs (idempotent via try/catch)
  const labMigrations = [
    "ALTER TABLE labs ADD COLUMN pi_name TEXT DEFAULT ''",
    "ALTER TABLE labs ADD COLUMN institution TEXT DEFAULT ''",
    "ALTER TABLE labs ADD COLUMN department TEXT DEFAULT ''",
    "ALTER TABLE labs ADD COLUMN website_url TEXT DEFAULT ''",
    "ALTER TABLE labs ADD COLUMN is_admin INTEGER DEFAULT 0",
  ];
  for (const sql of labMigrations) {
    try { db.run(sql); } catch (e) { /* column already exists */ }
  }

  // Lab members table
  db.run(`
    CREATE TABLE IF NOT EXISTS lab_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lab_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      role TEXT DEFAULT '',
      email TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (lab_id) REFERENCES labs(id) ON DELETE CASCADE
    )
  `);

  db.run('CREATE INDEX IF NOT EXISTS idx_manuscripts_lab ON manuscripts(lab_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_events_manuscript ON status_events(manuscript_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_lab_members_lab ON lab_members(lab_id)');

  saveDb();
  return db;
}

function saveDb() {
  if (!db) return;
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const data = db.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
}

// Helper to run queries and return results as objects
function queryAll(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

function queryOne(sql, params = []) {
  const results = queryAll(sql, params);
  return results[0] || null;
}

function runSql(sql, params = []) {
  db.run(sql, params);
  saveDb();
  return { lastInsertRowid: db.exec("SELECT last_insert_rowid()")[0]?.values[0][0] };
}

module.exports = { getDb, saveDb, queryAll, queryOne, runSql };
