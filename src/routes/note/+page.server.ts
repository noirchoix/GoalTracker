import { redirect } from '@sveltejs/kit';
import { getTasks } from '$lib/server/tasks';

export const load = ({ locals }) => {
  if (!locals.user) throw redirect(303, '/?tab=login');
  return { tasks: getTasks(locals.user.id) };
};
