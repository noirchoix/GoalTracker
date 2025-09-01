import initSqlJs, { type Database as SqlDB, type SqlJsStatic } from 'sql.js';
import { promises as fs } from 'node:fs';
import { join, dirname } from 'node:path';
import { dev } from '$app/environment';

const dataDir = 'data';
const dbFile = dev ? join(dataDir, 'dev.sqlite') : join(dataDir, 'prod.sqlite');

let SQL: SqlJsStatic;
let db: SqlDB;
let initialized = false;

async function save() {
  const bytes = db.export();
  await fs.writeFile(dbFile, Buffer.from(bytes));
}

async function ensureInit() {
  if (initialized) return;
  const wasmPath = join(process.cwd(), 'node_modules/sql.js/dist/sql-wasm.wasm');
  SQL = await initSqlJs({ locateFile: () => wasmPath });

  await fs.mkdir(dirname(dbFile), { recursive: true }).catch(() => {});
  let buf: Uint8Array | undefined;
  try {
    buf = new Uint8Array(await fs.readFile(dbFile));
  } catch {
    buf = undefined;
  }
  db = buf ? new SQL.Database(buf) : new SQL.Database();

  // Schema
  db.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      due_date TEXT,
      created_at TEXT NOT NULL,
      duration_hours INTEGER NOT NULL DEFAULT 0,
      completed INTEGER NOT NULL DEFAULT 0,
      completed_at TEXT,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','completed','failed')),
      notes TEXT NOT NULL DEFAULT '',
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_tasks_user ON tasks(user_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_user_created ON tasks(user_id, created_at DESC);
  `);

  await save();
  initialized = true;
}

/** SELECT many */
export async function all<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  await ensureInit();
  const stmt = db.prepare(sql);
  try {
    stmt.bind(params);
    const rows: any[] = [];
    while (stmt.step()) rows.push(stmt.getAsObject());
    return rows as T[];
  } finally {
    stmt.free();
  }
}

/** SELECT one (or undefined) */
export async function get<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
  const rows = await all<T>(sql, params);
  return rows[0];
}

/** INSERT/UPDATE/DELETE (persists to disk) */
export async function run(sql: string, params: any[] = []): Promise<void> {
  await ensureInit();
  const stmt = db.prepare(sql);
  try {
    stmt.bind(params);
    // advance once; for DML it’s enough to evaluate
    stmt.step();
  } finally {
    stmt.free();
  }
  await save();
}
