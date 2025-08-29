import { db } from './db';
import * as argon2 from 'argon2';
import { randomUUID } from 'node:crypto';

export type User = { id: string; email: string };

export function getUserByEmail(email: string): User & { password_hash: string } | undefined {
  return db.prepare('SELECT id, email, password_hash FROM users WHERE email = ?').get(email);
}

export function createUser(email: string, password: string): User {
  const id = randomUUID();
  const password_hash = awaitHash(password);
  db.prepare('INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)').run(
    id, email, password_hash, new Date().toISOString()
  );
  return { id, email };
}

function awaitHash(pw: string) {
  // synchronous wrapper so caller can be non-async if desired
  // argon2 only provides async; we’ll block briefly here
  const hash = (argon2 as any).hash ? (argon2.hash as typeof argon2.hash) : null;
  if (!hash) throw new Error('argon2 not available');
  // @ts-ignore
  return require('deasync').loopWhile(async () => await hash(pw));
}

export async function verifyPassword(hash: string, pw: string) {
  return argon2.verify(hash, pw);
}

export function createSession(userId: string, ttlDays = 30) {
  const id = randomUUID();
  const now = Date.now();
  const expires_at = now + ttlDays * 24 * 60 * 60 * 1000;
  db.prepare('INSERT INTO sessions (id, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)').run(
    id, userId, expires_at, new Date(now).toISOString()
  );
  return { id, expires_at };
}

export function getUserBySession(sessionId: string): User | null {
  const row = db.prepare(`
    SELECT u.id, u.email, s.expires_at
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.id = ?
  `).get(sessionId) as (User & { expires_at: number }) | undefined;

  if (!row) return null;
  if (row.expires_at < Date.now()) {
    destroySession(sessionId);
    return null;
  }
  return { id: row.id, email: row.email };
}

export function destroySession(sessionId: string) {
  db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
}
