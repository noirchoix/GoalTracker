import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import { patchTask, deleteTask, type TaskRow } from '$lib/server/tasks';

export const PATCH: RequestHandler = async ({ locals, params, request }) => {
  if (!locals.user) throw error(401, 'Unauthorized');

  const body = await request.json();
  const fields: Partial<TaskRow> = {};

  if ('title' in body) fields.title = String(body.title ?? '').trim();
  if ('due_date' in body) fields.due_date = body.due_date || null;
  if ('duration_hours' in body) fields.duration_hours = Math.max(0, Number(body.duration_hours) || 0);
  if ('completed' in body) fields.completed = body.completed ? 1 : 0;
  if ('completed_at' in body) fields.completed_at = body.completed_at || null;
  if ('notes' in body) fields.notes = String(body.notes ?? '');

  if (fields.title === '') throw error(400, 'Title required');

  const ok = await patchTask(locals.user.id, params.id, fields);
  if (!ok) throw error(404, 'Not found');
  return json({ ok: true });
};

export const PUT: RequestHandler = async ({ locals, params, request }) => {
  if (!locals.user) throw error(401, 'Unauthorized');

  const body = await request.json();
  const title = String(body.title ?? '').trim();
  if (!title) throw error(400, 'Title required');

  // Expect a "full" resource for PUT (send all fields you want to keep)
  const ok = await patchTask(locals.user.id, params.id, {
    title,
    due_date: body.due_date ?? null,
    duration_hours: Math.max(0, Number(body.duration_hours) || 0),
    completed: body.completed ? 1 : 0,
    completed_at: body.completed_at ?? null,
    notes: String(body.notes ?? '')
  });
  if (!ok) throw error(404, 'Not found');
  return json({ ok: true });
};

export const DELETE: RequestHandler = async ({ locals, params }) => {
  if (!locals.user) throw error(401, 'Unauthorized');
  await deleteTask(locals.user.id, params.id);
  return json({ ok: true });
};
