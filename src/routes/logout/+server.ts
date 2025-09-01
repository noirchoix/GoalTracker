import { redirect, type RequestHandler } from '@sveltejs/kit';
import { destroySession } from '$lib/server/auth';

export const POST: RequestHandler = async ({ cookies }) => {
  const sid = cookies.get('sid');
  if (sid) await destroySession(sid);
  cookies.delete('sid', { path: '/' });
  throw redirect(303, '/');
};
