import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { UserSchema } from '@/shared/types';
import { supabase } from '@/integrations/supabase/client'; // Import Supabase client

type Bindings = {
  // DB: D1Database; // No longer needed for Supabase
  JWT_SECRET: string; // Still needed if Hono JWT is used for other purposes, but Supabase handles user JWTs
};

const auth = new Hono<{ Bindings: Bindings }>();

// Register a new user with Supabase Auth
auth.post(
  '/register',
  zValidator('json', UserSchema.pick({ email: true, password: true, name: true })),
  async (c) => {
    const { email, password, name } = c.req.valid('json');

    if (!password) {
      return c.json({ error: 'Password is required' }, 400);
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: name, // Pass name to profile creation trigger
          },
        },
      });

      if (error) {
        console.error('Supabase registration error:', error);
        return c.json({ error: error.message || 'Failed to register user' }, 400);
      }

      // Supabase automatically handles session and JWT for the client
      // For server-side, we might want to return a session or user info
      return c.json({ message: 'User registered successfully. Please check your email to verify your account.', userId: data.user?.id }, 201);
    } catch (error) {
      console.error('Registration error:', error);
      return c.json({ error: 'Failed to register user' }, 500);
    }
  }
);

// Login user with Supabase Auth
auth.post(
  '/login',
  zValidator('json', UserSchema.pick({ email: true, password: true })),
  async (c) => {
    const { email, password } = c.req.valid('json');

    if (!password) {
      return c.json({ error: 'Password is required' }, 400);
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Supabase login error:', error);
        return c.json({ error: error.message || 'Invalid credentials' }, 401);
      }

      // Supabase returns session and user data directly
      // The client will receive the session and can extract the JWT from it
      return c.json({ message: 'Login successful', user: data.user, session: data.session }, 200);
    } catch (error) {
      console.error('Login error:', error);
      return c.json({ error: 'Failed to login' }, 500);
    }
  }
);

export default auth;