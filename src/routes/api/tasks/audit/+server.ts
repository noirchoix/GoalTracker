import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import { auditAll } from '$lib/server/tasks';

export const POST: RequestHandler = async ({ locals }) => {
  if (!locals.user) throw error(401, 'Unauthorized');
  const changed = await auditAll(locals.user.id);
  return json({ ok: true, changed });
};
