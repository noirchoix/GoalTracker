import { fail, redirect, type Actions } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { getUserByEmail, createSession, destroySession } from '$lib/server/auth';
import * as argon2 from 'argon2';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export const actions: Actions = {
  login: async ({ request, cookies }) => {
    const form = Object.fromEntries(await request.formData());
    const parse = loginSchema.safeParse(form);
    if (!parse.success) return fail(400, { message: 'Invalid credentials input' });

    const { email, password } = parse.data;
    const user = getUserByEmail(email);
    if (!user) return fail(400, { message: 'Email or password is incorrect' });

    const ok = await argon2.verify(user.password_hash, password);
    if (!ok) return fail(400, { message: 'Email or password is incorrect' });

    const session = createSession(user.id);
    cookies.set('sid', session.id, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30
    });

    throw redirect(303, '/note');
  },

  register: async ({ request, cookies }) => {
    const form = Object.fromEntries(await request.formData());
    const parse = registerSchema.safeParse(form);
    if (!parse.success) return fail(400, { message: 'Invalid registration input' });

    const { email, password } = parse.data;
    if (getUserByEmail(email)) return fail(400, { message: 'Email already registered' });

    const id = randomUUID();
    const password_hash = await argon2.hash(password);

    db.prepare(
      'INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)'
    ).run(id, email, password_hash, new Date().toISOString());

    const session = createSession(id);
    cookies.set('sid', session.id, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30
    });

    throw redirect(303, '/note');
  },

  logout: async ({ cookies }) => {
    const sid = cookies.get('sid');
    if (sid) destroySession(sid);
    cookies.delete('sid', { path: '/' });
    throw redirect(303, '/');
  }
};
