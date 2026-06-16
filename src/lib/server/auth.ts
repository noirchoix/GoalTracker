import { run, get } from './db';
import { randomUUID } from 'node:crypto';
import { scrypt as _scrypt, randomBytes, timingSafeEqual, type ScryptOptions } from 'node:crypto';
import { promisify } from 'node:util';

export type User = { id: string; email: string };

// ---- scrypt config
const N = 16384, r = 8, p = 1;
const KEYLEN = 64;
const SALT_BYTES = 16;

// Promisified scrypt with explicit typing (preserves options param)
const scrypt = promisify(_scrypt) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
  options?: ScryptOptions
) => Promise<Buffer>;

// Format: scrypt$N=16384$r=8$p=1$<saltB64>$<hashB64>
function encode(hash: Buffer, salt: Buffer) {
  return `scrypt$N=${N}$r=${r}$p=${p}$${salt.toString('base64')}$${hash.toString('base64')}`;
}
function decode(stored: string) {
  const parts = stored.split('$');
  // ["scrypt", "N=16384", "r=8", "p=1", "<saltB64>", "<hashB64>"]
  if (parts.length !== 6 || parts[0] !== 'scrypt') throw new Error('bad hash format');
  const n = Number(parts[1].split('=')[1]);
  const rr = Number(parts[2].split('=')[1]);
  const pp = Number(parts[3].split('=')[1]);
  const salt = Buffer.from(parts[4], 'base64');
  const hash = Buffer.from(parts[5], 'base64');
  return { N: n, r: rr, p: pp, salt, hash };
}

export async function hashPassword(password: string) {
  const salt = randomBytes(SALT_BYTES);
  const buf = await scrypt(password, salt, KEYLEN, { N, r, p });
  return encode(buf, salt);
}
export async function verifyPassword(stored: string, password: string) {
  const { N: n2, r: r2, p: p2, salt, hash } = decode(stored);
  const buf = await scrypt(password, salt, hash.length, { N: n2, r: r2, p: p2 });
  return buf.length === hash.length && timingSafeEqual(buf, hash);
}

// -------- user/session helpers (unchanged API)
export async function getUserByEmail(email: string):
  Promise<(User & { password_hash: string }) | undefined> {
  return await get('SELECT id, email, password_hash FROM users WHERE email = ?', [email]);
}
export async function createUser(email: string, password: string): Promise<User> {
  const id = randomUUID();
  const password_hash = await hashPassword(password);
  await run(
    'INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)',
    [id, email, password_hash, new Date().toISOString()]
  );
  return { id, email };
}
export async function createSession(userId: string, ttlDays = 30) {
  const id = randomUUID();
  const now = Date.now();
  const expires_at = now + ttlDays * 86_400_000;
  await run(
    'INSERT INTO sessions (id, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)',
    [id, userId, expires_at, new Date(now).toISOString()]
  );
  return { id, expires_at };
}
export async function getUserBySession(sessionId: string): Promise<User | null> {
  const row = await get<{ id: string; email: string; expires_at: number }>(
    `SELECT u.id, u.email, s.expires_at
     FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.id = ?`,
    [sessionId]
  );
  if (!row) return null;
  if (row.expires_at < Date.now()) {
    await destroySession(sessionId);
    return null;
  }
  return { id: row.id, email: row.email };
}
export async function destroySession(sessionId: string) {
  await run('DELETE FROM sessions WHERE id = ?', [sessionId]);
}
