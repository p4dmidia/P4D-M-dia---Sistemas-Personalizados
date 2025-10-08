import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { UserSchema } from '@/shared/types';
import { sign } from 'hono/jwt';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

type Bindings = {
  DB: D1Database;
  JWT_SECRET: string;
};

const auth = new Hono<{ Bindings: Bindings }>();

// Register a new user
auth.post(
  '/register',
  zValidator('json', UserSchema.pick({ email: true, password: true, name: true })),
  async (c) => {
    const { email, password, name } = c.req.valid('json');

    if (!password) {
      return c.json({ error: 'Password is required' }, 400);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    try {
      await c.env.DB.prepare(
        'INSERT INTO users (id, email, password_hash, name, role) VALUES (?, ?, ?, ?, ?)'
      )
        .bind(userId, email, hashedPassword, name || null, 'client')
        .run();

      const token = await sign({ userId, email, role: 'client' }, c.env.JWT_SECRET);
      return c.json({ message: 'User registered successfully', token, userId }, 201);
    } catch (error: any) {
      if (error.message.includes('UNIQUE constraint failed')) {
        return c.json({ error: 'Email already registered' }, 409);
      }
      console.error('Registration error:', error);
      return c.json({ error: 'Failed to register user' }, 500);
    }
  }
);

// Login user
auth.post(
  '/login',
  zValidator('json', UserSchema.pick({ email: true, password: true })),
  async (c) => {
    const { email, password } = c.req.valid('json');

    if (!password) {
      return c.json({ error: 'Password is required' }, 400);
    }

    try {
      const user = await c.env.DB.prepare('SELECT * FROM users WHERE email = ?')
        .bind(email)
        .first<User>();

      if (!user || !user.password_hash) {
        return c.json({ error: 'Invalid credentials' }, 401);
      }

      const passwordMatch = await bcrypt.compare(password, user.password_hash);

      if (!passwordMatch) {
        return c.json({ error: 'Invalid credentials' }, 401);
      }

      const token = await sign({ userId: user.id, email: user.email, role: user.role }, c.env.JWT_SECRET);
      return c.json({ message: 'Login successful', token, userId: user.id, role: user.role }, 200);
    } catch (error) {
      console.error('Login error:', error);
      return c.json({ error: 'Failed to login' }, 500);
    }
  }
);

export default auth;