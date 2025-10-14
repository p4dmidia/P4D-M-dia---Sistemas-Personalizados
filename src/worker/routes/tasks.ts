import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { TaskSchema } from '@/shared/types';
import { SupabaseClient } from '@supabase/supabase-js';
// import { z } from 'zod'; // Removido importação não utilizada

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

const tasks = new Hono<{ Bindings: Bindings, Variables: Variables }>();

// Middleware to get user and role from Supabase session
tasks.use('*', async (c, next) => {
  const supabaseAdmin = c.get('supabaseAdmin');
  const authHeader = c.req.header('Authorization');
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error) {
      console.error('Tasks Middleware: Supabase auth error:', error);
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
        console.error('Tasks Middleware: Error fetching user role:', profileError);
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

// Create a new task (Admin only)
tasks.post(
  '/',
  adminOnly,
  zValidator('json', TaskSchema.omit({ id: true, created_at: true, updated_at: true })),
  async (c) => {
    const taskData = c.req.valid('json');
    const supabaseAdmin = c.get('supabaseAdmin');

    try {
      const { data, error } = await supabaseAdmin
        .from('tasks')
        .insert(taskData)
        .select()
        .single();

      if (error) {
        console.error('Supabase insert task error:', error);
        return c.json({ error: 'Failed to create task' }, 500);
      }
      return c.json(data, 201);
    } catch (error) {
      console.error('Error creating task:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  }
);

// Get all tasks (Admin only)
tasks.get('/', adminOnly, async (c) => {
  const supabaseAdmin = c.get('supabaseAdmin');
  try {
    const { data, error } = await supabaseAdmin
      .from('tasks')
      .select('*');

    if (error) {
      console.error('Supabase fetch all tasks error:', error);
      return c.json({ error: 'Failed to fetch tasks' }, 500);
    }
    return c.json(data, 200);
  } catch (error) {
    console.error('Error fetching all tasks:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get a single task by ID (Admin or project owner)
tasks.get('/:id', async (c) => {
  const taskId = c.req.param('id');
  const userId = c.get('userId');
  const userRole = c.get('userRole');
  const supabase = c.get('supabase'); // Use anon client for RLS

  try {
    let query = supabase.from('tasks').select('*, projects(user_id)').eq('id', taskId);

    const { data, error } = await query.single();

    if (error && error.code !== 'PGRST116') {
      console.error('Supabase fetch task error:', error);
      return c.json({ error: 'Failed to fetch task' }, 500);
    }
    if (!data) {
      return c.json({ error: 'Task not found or unauthorized' }, 404);
    }

    // Check RLS for project owner if not admin
    if (userRole !== 'admin' && data.projects?.user_id !== userId) {
      return c.json({ error: 'Forbidden: You do not own this project\'s tasks' }, 403);
    }

    return c.json(data, 200);
  } catch (error) {
    console.error('Error fetching task by ID:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Update a task (Admin only, or project owner with specific RLS)
tasks.put(
  '/:id',
  zValidator('json', TaskSchema.partial().omit({ id: true, created_at: true })),
  async (c) => {
    const taskId = c.req.param('id');
    const updateData = c.req.valid('json');
    const userId = c.get('userId');
    const userRole = c.get('userRole');
    const supabase = c.get('supabase'); // Use anon client for RLS

    if (!userId) {
      return c.json({ error: 'User not authenticated' }, 401);
    }

    try {
      let query = supabase.from('tasks').update({ ...updateData, updated_at: new Date().toISOString() }).eq('id', taskId);

      // RLS for tasks already checks project owner, so we can rely on that
      // If admin, bypass RLS by using supabaseAdmin
      if (userRole === 'admin') {
        query = c.get('supabaseAdmin').from('tasks').update({ ...updateData, updated_at: new Date().toISOString() }).eq('id', taskId);
      }

      const { data, error } = await query.select().single();

      if (error && error.code !== 'PGRST116') {
        console.error('Supabase update task error:', error);
        return c.json({ error: 'Failed to update task' }, 500);
      }
      if (!data) {
        return c.json({ error: 'Task not found or unauthorized to update' }, 404);
      }
      return c.json(data, 200);
    } catch (error) {
      console.error('Error updating task:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  }
);

// Delete a task (Admin only)
tasks.delete('/:id', adminOnly, async (c) => {
  const taskId = c.req.param('id');
  const supabaseAdmin = c.get('supabaseAdmin');

  try {
    const { error } = await supabaseAdmin
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) {
      console.error('Supabase delete task error:', error);
      return c.json({ error: error.message || 'Failed to delete task' }, 500);
    }
    return c.json({ message: 'Task deleted successfully' }, 204);
  } catch (error) {
    console.error('Error deleting task:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default tasks;