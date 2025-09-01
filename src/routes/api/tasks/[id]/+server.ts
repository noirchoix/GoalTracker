import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import { patchTask, deleteTask } from '$lib/server/tasks';

// Keep PATCH if you want backward-compat; otherwise you can remove it.
export const PUT: RequestHandler = async ({ locals, params, request }) => {
  if (!locals.user) throw error(401, 'Unauthorized');

  const body = await request.json();
  // Expect a "full" resource for PUT (send all fields you want to keep)
  const ok = await patchTask(locals.user.id, params.id, {
    title: body.title,
    due_date: body.due_date ?? null,
    duration_hours: body.duration_hours ?? 0,
    completed: body.completed ?? 0,
    completed_at: body.completed_at ?? null,
    notes: body.notes ?? ''
  });
  if (!ok) throw error(404, 'Not found');
  return json({ ok: true });
};

export const DELETE: RequestHandler = async ({ locals, params }) => {
  if (!locals.user) throw error(401, 'Unauthorized');
  await deleteTask(locals.user.id, params.id);
  return json({ ok: true });
};
