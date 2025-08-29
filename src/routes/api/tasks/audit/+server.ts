import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import { auditAll } from '$lib/server/tasks';

export const POST: RequestHandler = ({ locals }) => {
  if (!locals.user) throw error(401, 'Unauthorized');
  const changed = auditAll(locals.user.id);
  return json({ ok: true, changed });
};
