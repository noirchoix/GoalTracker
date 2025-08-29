import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import { patchTask, deleteTask } from '$lib/server/tasks';

export const PATCH: RequestHandler = async ({ locals, params, request }) => {
  if (!locals.user) throw error(401, 'Unauthorized');
  const body = await request.json();
  const ok = patchTask(locals.user.id, params.id, body);
  if (!ok) throw error(404, 'Not found');
  return json({ ok: true });
};

export const DELETE: RequestHandler = ({ locals, params }) => {
  if (!locals.user) throw error(401, 'Unauthorized');
  deleteTask(locals.user.id, params.id);
  return json({ ok: true });
};
