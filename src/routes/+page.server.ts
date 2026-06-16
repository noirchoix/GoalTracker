import { fail, redirect, type Actions } from '@sveltejs/kit';
import { z } from 'zod';
import {
  createSession, destroySession, getUserByEmail, createUser,
  verifyPassword, hashPassword
} from '$lib/server/auth';

// register: use hashPassword
// login: use verifyPassword(storedHash, inputPassword)


const loginSchema = z.object({ email: z.string().email(), password: z.string().min(6) });
const registerSchema = z.object({ email: z.string().email(), password: z.string().min(6) });

export const actions: Actions = {
  login: async ({ request, cookies }) => {
    const form = Object.fromEntries(await request.formData());
    const p = loginSchema.safeParse(form);
    if (!p.success) return fail(400, { message: 'Invalid credentials input' });

    const { email, password } = p.data;
    const user = await getUserByEmail(email);
    if (!user) return fail(400, { message: 'Email or password is incorrect' });

    const ok = await verifyPassword(user.password_hash, password);
    if (!ok) return fail(400, { message: 'Email or password is incorrect' });

    const session = await createSession(user.id);
    cookies.set('sid', session.id, {
      path: '/', httpOnly: true, sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30
    });
    throw redirect(303, '/note');
  },

  register: async ({ request, cookies }) => {
    const form = Object.fromEntries(await request.formData());
    const p = registerSchema.safeParse(form);
    if (!p.success) return fail(400, { message: 'Invalid registration input' });

    const { email, password } = p.data;
    const existing = await getUserByEmail(email);
    if (existing) return fail(400, { message: 'Email already registered' });

    const { id } = await createUser(email, password);
    const session = await createSession(id);
    cookies.set('sid', session.id, {
      path: '/', httpOnly: true, sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30
    });
    throw redirect(303, '/note');
  },

  logout: async ({ cookies }) => {
    const sid = cookies.get('sid');
    if (sid) await destroySession(sid);
    cookies.delete('sid', { path: '/' });
    throw redirect(303, '/');
  }
};
