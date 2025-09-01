import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import { getTasks, insertTask } from '$lib/server/tasks';
import { randomUUID } from 'node:crypto';

export const GET: RequestHandler = async ({ locals }) => {
  if (!locals.user) throw error(401, 'Unauthorized');
  return json(await getTasks(locals.user.id));
};

export const POST: RequestHandler = async ({ locals, request }) => {
  if (!locals.user) throw error(401, 'Unauthorized');
  const { title, due_date, duration_hours, notes } = await request.json();
  if (!title) throw error(400, 'Title required');

  await insertTask(locals.user.id, {
    id: randomUUID(),
    title: String(title),
    due_date: due_date ?? null,
    duration_hours: Math.max(0, Number(duration_hours) || 0),
    notes: notes ?? ''
  });
  return json({ ok: true });
};
