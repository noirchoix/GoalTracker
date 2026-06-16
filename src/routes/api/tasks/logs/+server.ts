import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import { getTaskLogs } from '$lib/server/tasks';

export const GET: RequestHandler = async ({ locals }) => {
  if (!locals.user) throw error(401, 'Unauthorized');
  return json(await getTaskLogs(locals.user.id));
};
