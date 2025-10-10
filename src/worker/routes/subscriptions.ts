import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { SubscriptionSchema } from '@/shared/types';
import { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';

type Bindings = {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
};

type Variables = {
  supabase: SupabaseClient;
  supabaseAdmin: SupabaseClient;
  userId?: string;
  userRole?: string;
};

const subscriptions = new Hono<{ Bindings: Bindings, Variables: Variables }>();

// Middleware to get user and role from Supabase session
subscriptions.use('*', async (c, next) => {
  const supabaseAdmin = c.get('supabaseAdmin');
  const authHeader = c.req.header('Authorization');
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error) {
      console.error('Subscriptions Middleware: Supabase auth error:', error);
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    if (user) {
      c.set('userId', user.id);
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Subscriptions Middleware: Error fetching user role:', profileError);
        return c.json({ error: 'Failed to fetch user profile' }, 500);
      }
      c.set('userRole', profile?.role || 'client');
    }
  } else {
    return c.json({ error: 'Authorization header missing' }, 401);
  }
  await next();
});

// Admin-only middleware
const adminOnly = async (c: any, next: any) => {
  const userRole = c.get('userRole');
  if (userRole !== 'admin') {
    return c.json({ error: 'Forbidden: Admin access required' }, 403);
  }
  await next();
};

// Create a new subscription (typically handled by Asaas webhook, but admin might manually create)
subscriptions.post(
  '/',
  adminOnly, // Only admins can manually create subscriptions via API
  zValidator('json', SubscriptionSchema.omit({ id: true, created_at: true, updated_at: true })),
  async (c) => {
    const subscriptionData = c.req.valid('json');
    const supabaseAdmin = c.get('supabaseAdmin');

    try {
      const { data, error } = await supabaseAdmin
        .from('subscriptions')
        .insert(subscriptionData)
        .select()
        .single();

      if (error) {
        console.error('Supabase insert subscription error:', error);
        return c.json({ error: 'Failed to create subscription' }, 500);
      }
      return c.json(data, 201);
    } catch (error) {
      console.error('Error creating subscription:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  }
);

// Get all subscriptions (Admin only)
subscriptions.get('/', adminOnly, async (c) => {
  const supabaseAdmin = c.get('supabaseAdmin');
  try {
    const { data, error } = await supabaseAdmin
      .from('subscriptions')
      .select('*');

    if (error) {
      console.error('Supabase fetch all subscriptions error:', error);
      return c.json({ error: 'Failed to fetch subscriptions' }, 500);
    }
    return c.json(data, 200);
  } catch (error) {
    console.error('Error fetching all subscriptions:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get a single subscription by ID (Admin or subscription owner)
subscriptions.get('/:id', async (c) => {
  const subscriptionId = c.req.param('id');
  const userId = c.get('userId');
  const userRole = c.get('userRole');
  const supabase = c.get('supabase'); // Use anon client for RLS

  try {
    let query = supabase.from('subscriptions').select('*').eq('id', subscriptionId);

    if (userRole !== 'admin') {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query.single();

    if (error && error.code !== 'PGRST116') {
      console.error('Supabase fetch subscription error:', error);
      return c.json({ error: 'Failed to fetch subscription' }, 500);
    }
    if (!data) {
      return c.json({ error: 'Subscription not found or unauthorized' }, 404);
    }
    return c.json(data, 200);
  } catch (error) {
    console.error('Error fetching subscription by ID:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Update a subscription (Admin only, or limited fields for owner)
subscriptions.put(
  '/:id',
  adminOnly, // For full updates, require admin
  zValidator('json', SubscriptionSchema.partial().omit({ id: true, user_id: true, created_at: true })),
  async (c) => {
    const subscriptionId = c.req.param('id');
    const updateData = c.req.valid('json');
    const supabaseAdmin = c.get('supabaseAdmin');

    try {
      const { data, error } = await supabaseAdmin
        .from('subscriptions')
        .update({ ...updateData, updated_at: new Date().toISOString() })
        .eq('id', subscriptionId)
        .select()
        .single();

      if (error) {
        console.error('Supabase update subscription error:', error);
        return c.json({ error: 'Failed to update subscription' }, 500);
      }
      if (!data) {
        return c.json({ error: 'Subscription not found' }, 404);
      }
      return c.json(data, 200);
    } catch (error) {
      console.error('Error updating subscription:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  }
);

// Delete a subscription (Admin only)
subscriptions.delete('/:id', adminOnly, async (c) => {
  const subscriptionId = c.req.param('id');
  const supabaseAdmin = c.get('supabaseAdmin');

  try {
    const { error } = await supabaseAdmin
      .from('subscriptions')
      .delete()
      .eq('id', subscriptionId);

    if (error) {
      console.error('Supabase delete subscription error:', error);
      return c.json({ error: 'Failed to delete subscription' }, 500);
    }
    return c.json({ message: 'Subscription deleted successfully' }, 204);
  } catch (error) {
    console.error('Error deleting subscription:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default subscriptions;