import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { ProjectSchema } from '@/shared/types';
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
  userRole?: string; // Add userRole to variables
};

const projects = new Hono<{ Bindings: Bindings, Variables: Variables }>();

// Middleware to get user and role from Supabase session
projects.use('*', async (c, next) => {
  const supabaseAdmin = c.get('supabaseAdmin');
  const authHeader = c.req.header('Authorization');
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error) {
      console.error('Projects Middleware: Supabase auth error:', error);
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    if (user) {
      c.set('userId', user.id);
      // Fetch user role from profiles table
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Projects Middleware: Error fetching user role:', profileError);
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

// Create a new project (can be called by authenticated users, but admin might have more privileges)
projects.post(
  '/',
  zValidator('json', ProjectSchema.omit({ id: true, user_id: true, created_at: true, updated_at: true })),
  async (c) => {
    const projectData = c.req.valid('json');
    const userId = c.get('userId');
    const supabase = c.get('supabase'); // Use anon client for RLS

    if (!userId) {
      return c.json({ error: 'User not authenticated' }, 401);
    }

    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({ ...projectData, user_id: userId })
        .select()
        .single();

      if (error) {
        console.error('Supabase insert project error:', error);
        return c.json({ error: 'Failed to create project' }, 500);
      }
      return c.json(data, 201);
    } catch (error) {
      console.error('Error creating project:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  }
);

// Get all projects (Admin only)
projects.get('/', adminOnly, async (c) => {
  const supabaseAdmin = c.get('supabaseAdmin'); // Use admin client to bypass RLS for admin view
  try {
    const { data, error } = await supabaseAdmin
      .from('projects')
      .select('*');

    if (error) {
      console.error('Supabase fetch all projects error:', error);
      return c.json({ error: 'Failed to fetch projects' }, 500);
    }
    return c.json(data, 200);
  } catch (error) {
    console.error('Error fetching all projects:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get a single project by ID (Admin or project owner)
projects.get('/:id', async (c) => {
  const projectId = c.req.param('id');
  const userId = c.get('userId');
  const userRole = c.get('userRole');
  const supabase = c.get('supabase'); // Use anon client for RLS

  try {
    let query = supabase.from('projects').select('*').eq('id', projectId);

    // If not admin, ensure user is the owner
    if (userRole !== 'admin') {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query.single();

    if (error && error.code !== 'PGRST116') {
      console.error('Supabase fetch project error:', error);
      return c.json({ error: 'Failed to fetch project' }, 500);
    }
    if (!data) {
      return c.json({ error: 'Project not found or unauthorized' }, 404);
    }
    return c.json(data, 200);
  } catch (error) {
    console.error('Error fetching project by ID:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Update a project (Admin or project owner)
projects.put(
  '/:id',
  zValidator('json', ProjectSchema.partial().omit({ id: true, user_id: true, created_at: true })),
  async (c) => {
    const projectId = c.req.param('id');
    const updateData = c.req.valid('json');
    const userId = c.get('userId');
    const userRole = c.get('userRole');
    const supabase = c.get('supabase'); // Use anon client for RLS

    if (!userId) {
      return c.json({ error: 'User not authenticated' }, 401);
    }

    try {
      let query = supabase.from('projects').update({ ...updateData, updated_at: new Date().toISOString() }).eq('id', projectId);

      // If not admin, ensure user is the owner
      if (userRole !== 'admin') {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query.select().single();

      if (error && error.code !== 'PGRST116') {
        console.error('Supabase update project error:', error);
        return c.json({ error: 'Failed to update project' }, 500);
      }
      if (!data) {
        return c.json({ error: 'Project not found or unauthorized to update' }, 404);
      }
      return c.json(data, 200);
    } catch (error) {
      console.error('Error updating project:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  }
);

// Delete a project (Admin only)
projects.delete('/:id', adminOnly, async (c) => {
  const projectId = c.req.param('id');
  const supabaseAdmin = c.get('supabaseAdmin'); // Use admin client to bypass RLS for admin delete

  try {
    const { error } = await supabaseAdmin
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (error) {
      console.error('Supabase delete project error:', error);
      return c.json({ error: error.message || 'Failed to delete project' }, 500);
    }
    return c.json({ message: 'Project deleted successfully' }, 204);
  } catch (error: any) {
    console.error('Error deleting project:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default projects;