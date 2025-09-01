import { all, get, run } from './db';

export type TaskRow = {
  id: string; user_id: string; title: string;
  due_date: string | null; created_at: string;
  duration_hours: number; completed: number;
  completed_at: string | null; status: 'pending'|'completed'|'failed';
  notes: string;
};

export function computeStatus(row: TaskRow, now = Date.now()): 'pending'|'completed'|'failed' {
  if (row.completed) return 'completed';
  const created = new Date(row.created_at).getTime();
  const elapsedHours = (now - created) / 36e5;
  return elapsedHours > row.duration_hours ? 'failed' : 'pending';
}

export async function getTasks(userId: string) {
  return await all<TaskRow>(
    'SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC',
    [userId]
  );
}

export async function insertTask(userId: string, t: {
  id: string; title: string; due_date: string | null; duration_hours: number; notes?: string;
}) {
  await run(
    `INSERT INTO tasks (id, user_id, title, due_date, created_at, duration_hours, completed, status, notes)
     VALUES (?, ?, ?, ?, ?, ?, 0, 'pending', ?)`,
    [t.id, userId, t.title, t.due_date, new Date().toISOString(), t.duration_hours, t.notes ?? '']
  );
}

export async function patchTask(userId: string, id: string, fields: Partial<TaskRow>) {
  const row = await get<TaskRow>('SELECT * FROM tasks WHERE id = ? AND user_id = ?', [id, userId]);
  if (!row) return false;

  const next: TaskRow = { ...row, ...fields } as TaskRow;
  next.status = computeStatus(next);

  await run(
    `UPDATE tasks SET
       title = ?, due_date = ?, duration_hours = ?, completed = ?, completed_at = ?, status = ?, notes = ?
     WHERE id = ? AND user_id = ?`,
    [
      next.title, next.due_date, next.duration_hours, next.completed, next.completed_at, next.status, next.notes,
      id, userId
    ]
  );
  return true;
}

export async function deleteTask(userId: string, id: string) {
  await run('DELETE FROM tasks WHERE id = ? AND user_id = ?', [id, userId]);
}

export async function auditAll(userId: string) {
  const rows = await getTasks(userId);
  const now = Date.now();
  let changed = 0;
  for (const r of rows) {
    const s = computeStatus(r, now);
    if (s !== r.status) {
      await run('UPDATE tasks SET status = ? WHERE id = ? AND user_id = ?', [s, r.id, userId]);
      changed++;
    }
  }
  return changed;
}
