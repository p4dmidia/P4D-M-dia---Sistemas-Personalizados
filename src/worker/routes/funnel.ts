import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { FunnelResponseSchema } from '@/shared/types';
import { z } from 'zod';
import { SupabaseClient } from '@supabase/supabase-js'; // Import SupabaseClient type

type Bindings = {
  JWT_SECRET: string;
  SUPABASE_URL: string; // Add these to Bindings
  SUPABASE_ANON_KEY: string; // Add these to Bindings
};

type Variables = {
  supabase: SupabaseClient; // Define supabase in Variables
};

const funnel = new Hono<{ Bindings: Bindings, Variables: Variables }>();

// Middleware to get user from Supabase session if available
funnel.use('*', async (c, next) => {
  const supabase = c.get('supabase'); // Get Supabase client from context
  const authHeader = c.req.header('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error) {
      console.error('Supabase auth error in funnel middleware:', error);
      // Don't block if auth fails, allow anonymous funnel progression
    }
    if (user) {
      c.set('userId', user.id);
    }
  }
  await next();
});

// Save or update funnel responses (autosave)
funnel.post(
  '/save',
  zValidator('json', FunnelResponseSchema.pick({ step_data: true, current_step: true, completed: true, user_id: true }).partial().extend({
    funnel_id: z.string().uuid().nullable().optional(),
  })),
  async (c) => {
    const { step_data, current_step, completed, funnel_id } = c.req.valid('json');
    const userIdFromContext = c.get('userId'); // Get user ID from middleware if authenticated
    const supabase = c.get('supabase'); // Get Supabase client from context

    const actualUserId = userIdFromContext || null; // Prioritize authenticated user, otherwise null for anonymous

    try {
      let responseId = funnel_id;
      let existingFunnel;

      if (responseId) {
        const { data, error } = await supabase
          .from('funnel_responses')
          .select('*')
          .eq('id', responseId)
          .single();
        if (error && error.code !== 'PGRST116') { // PGRST116 means "no rows found"
          console.error('Supabase fetch existing funnel error:', error);
          return c.json({ error: 'Failed to fetch existing funnel response' }, 500);
        }
        existingFunnel = data;
      } else if (actualUserId) {
        // Try to find an incomplete funnel for the user
        const { data, error } = await supabase
          .from('funnel_responses')
          .select('*')
          .eq('user_id', actualUserId)
          .eq('completed', false)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        if (error && error.code !== 'PGRST116') {
          console.error('Supabase fetch user funnel error:', error);
          return c.json({ error: 'Failed to fetch user funnel response' }, 500);
        }
        existingFunnel = data;
        if (existingFunnel) {
          responseId = existingFunnel.id;
        }
      }

      if (existingFunnel) {
        // Update existing funnel response
        const { data, error } = await supabase
          .from('funnel_responses')
          .update({
            step_data: step_data, // Supabase handles JSONB directly
            current_step: current_step !== undefined ? current_step : existingFunnel.current_step,
            completed: completed !== undefined ? completed : existingFunnel.completed,
            user_id: actualUserId, // Update user_id if it becomes known (e.g., user logs in mid-funnel)
            updated_at: new Date().toISOString(),
          })
          .eq('id', responseId)
          .select()
          .single();

        if (error) {
          console.error('Supabase update funnel error:', error);
          return c.json({ error: 'Failed to update funnel response' }, 500);
        }
        return c.json({ message: 'Funnel response saved successfully', funnelId: data.id }, 200);
      } else {
        // Insert new funnel response
        const { data, error } = await supabase
          .from('funnel_responses')
          .insert({
            id: responseId || undefined, // Let Supabase generate if not provided
            user_id: actualUserId,
            step_data: step_data,
            current_step: current_step,
            completed: completed,
          })
          .select()
          .single();

        if (error) {
          console.error('Supabase insert funnel error:', error);
          return c.json({ error: 'Failed to insert funnel response' }, 500);
        }
        return c.json({ message: 'Funnel response saved successfully', funnelId: data.id }, 200);
      }
    } catch (error) {
      console.error('Error saving funnel response:', error);
      return c.json({ error: 'Failed to save funnel response' }, 500);
    }
  }
);

// Get latest funnel response for a user (or by funnel_id)
funnel.get('/latest', async (c) => {
  const funnelId = c.req.query('funnel_id');
  const userIdFromContext = c.get('userId'); // Get user ID from middleware if authenticated
  const supabase = c.get('supabase'); // Get Supabase client from context

  if (!userIdFromContext && !funnelId) {
    return c.json({ error: 'User ID or Funnel ID is required' }, 400);
  }

  try {
    let query = supabase.from('funnel_responses').select('*');

    if (funnelId) {
      query = query.eq('id', funnelId);
    } else if (userIdFromContext) {
      query = query.eq('user_id', userIdFromContext).order('updated_at', { ascending: false }).limit(1);
    }

    const { data: funnelResponse, error } = await query.single();

    if (error && error.code !== 'PGRST116') { // PGRST116 means "no rows found"
      console.error('Supabase fetch funnel error:', error);
      return c.json({ error: 'Failed to fetch funnel response' }, 500);
    }

    if (!funnelResponse) {
      return c.json({ message: 'No funnel response found' }, 404);
    }

    return c.json(funnelResponse, 200);
  } catch (error) {
    console.error('Error fetching funnel response:', error);
    return c.json({ error: 'Failed to fetch funnel response' }, 500);
  }
});

export default funnel;