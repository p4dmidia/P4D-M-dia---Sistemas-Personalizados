import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { UserSchema } from '@/shared/types';
import { SupabaseClient } from '@supabase/supabase-js'; // Import SupabaseClient type

type Bindings = {
  JWT_SECRET: string;
  SUPABASE_URL: string; // Add these to Bindings
  SUPABASE_ANON_KEY: string; // Add these to Bindings
};

type Variables = {
  supabase: SupabaseClient; // Define supabase in Variables
};

const auth = new Hono<{ Bindings: Bindings, Variables: Variables }>();

// Register a new user with Supabase Auth
auth.post(
  '/register',
  zValidator('json', UserSchema.pick({ email: true, password: true, name: true })),
  async (c) => {
    const { email, password, name } = c.req.valid('json');
    const supabase = c.get('supabase'); // Get Supabase client from context

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
    const supabase = c.get('supabase'); // Get Supabase client from context

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

      return c.json({ message: 'Login successful', user: data.user, session: data.session }, 200);
    } catch (error) {
      console.error('Login error:', error);
      return c.json({ error: 'Failed to login' }, 500);
    }
  }
);

export default auth;