import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { getTasks } from '$lib/server/tasks';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) throw redirect(303, '/?tab=login');
  return { tasks: await getTasks(locals.user.id) };
};
