import type { Handle } from '@sveltejs/kit';
import { getUserBySession } from '$lib/server/auth';

export const handle: Handle = async ({ event, resolve }) => {
  const sid = event.cookies.get('sid');
  event.locals.user = sid ? await getUserBySession(sid) : null;
  return resolve(event);
};
