import { db } from './db';

export type TaskRow = {
  id: string; user_id: string; title: string;
  due_date: string | null; created_at: string;
  duration_hours: number; completed: number;
  completed_at: string | null; status: 'pending'|'completed'|'failed';
  notes: string;
};

export function getTasks(userId: string): TaskRow[] {
  return db.prepare('SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC').all(userId);
}

export function computeStatus(row: TaskRow, now = Date.now()): 'pending'|'completed'|'failed' {
  if (row.completed) return 'completed';
  const created = new Date(row.created_at).getTime();
  const elapsedHours = (now - created) / 36e5;
  return elapsedHours > row.duration_hours ? 'failed' : 'pending';
}

export function insertTask(userId: string, t: {
  id: string; title: string; due_date: string | null;
  duration_hours: number; notes?: string;
}) {
  const created_at = new Date().toISOString();
  db.prepare(`
    INSERT INTO tasks (id, user_id, title, due_date, created_at, duration_hours, completed, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, 0, 'pending', ?)
  `).run(t.id, userId, t.title, t.due_date, created_at, t.duration_hours, t.notes ?? '');
}

export function patchTask(userId: string, id: string, fields: Partial<TaskRow>) {
  const row = db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?').get(id, userId) as TaskRow | undefined;
  if (!row) return false;

  const next = { ...row, ...fields } as TaskRow;
  next.status = computeStatus(next);
  db.prepare(`
    UPDATE tasks SET
      title = ?, due_date = ?, duration_hours = ?, completed = ?, completed_at = ?, status = ?, notes = ?
    WHERE id = ? AND user_id = ?
  `).run(
    next.title, next.due_date, next.duration_hours, next.completed, next.completed_at, next.status, next.notes,
    id, userId
  );
  return true;
}

export function deleteTask(userId: string, id: string) {
  db.prepare('DELETE FROM tasks WHERE id = ? AND user_id = ?').run(id, userId);
}

export function auditAll(userId: string) {
  const rows = getTasks(userId);
  const now = Date.now();
  const upd = db.prepare('UPDATE tasks SET status = ? WHERE id = ? AND user_id = ?');
  let changed = 0;
  for (const r of rows) {
    const s = computeStatus(r, now);
    if (s !== r.status) { upd.run(s, r.id, userId); changed++; }
  }
  return changed;
}
