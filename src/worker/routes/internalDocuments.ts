import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { InternalDocumentSchema } from '@/shared/types';
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

const internalDocuments = new Hono<{ Bindings: Bindings, Variables: Variables }>();

// Middleware to get user and role from Supabase session
internalDocuments.use('*', async (c, next) => {
  const supabaseAdmin = c.get('supabaseAdmin');
  const authHeader = c.req.header('Authorization');
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error) {
      console.error('InternalDocuments Middleware: Supabase auth error:', error);
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
        console.error('InternalDocuments Middleware: Error fetching user role:', profileError);
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

// Create a new internal document (Admin only)
internalDocuments.post(
  '/',
  adminOnly,
  zValidator('json', InternalDocumentSchema.omit({ id: true, created_at: true, updated_at: true })),
  async (c) => {
    const documentData = c.req.valid('json');
    const supabaseAdmin = c.get('supabaseAdmin');

    try {
      const { data, error } = await supabaseAdmin
        .from('internal_documents')
        .insert(documentData)
        .select()
        .single();

      if (error) {
        console.error('Supabase insert internal document error:', error);
        return c.json({ error: 'Failed to create internal document' }, 500);
      }
      return c.json(data, 201);
    } catch (error) {
      console.error('Error creating internal document:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  }
);

// Get all internal documents (Admin only)
internalDocuments.get('/', adminOnly, async (c) => {
  const supabaseAdmin = c.get('supabaseAdmin');
  try {
    const { data, error } = await supabaseAdmin
      .from('internal_documents')
      .select('*');

    if (error) {
      console.error('Supabase fetch all internal documents error:', error);
      return c.json({ error: 'Failed to fetch internal documents' }, 500);
    }
    return c.json(data, 200);
  } catch (error) {
    console.error('Error fetching all internal documents:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get a single internal document by ID (Admin or project owner)
internalDocuments.get('/:id', async (c) => {
  const documentId = c.req.param('id');
  const userId = c.get('userId');
  const userRole = c.get('userRole');
  const supabase = c.get('supabase'); // Use anon client for RLS

  try {
    let query = supabase.from('internal_documents').select('*, projects(user_id)').eq('id', documentId);

    const { data, error } = await query.single();

    if (error && error.code !== 'PGRST116') {
      console.error('Supabase fetch internal document error:', error);
      return c.json({ error: 'Failed to fetch internal document' }, 500);
    }
    if (!data) {
      return c.json({ error: 'Internal document not found or unauthorized' }, 404);
    }

    // Check RLS for project owner if not admin
    if (userRole !== 'admin' && data.projects?.user_id !== userId) {
      return c.json({ error: 'Forbidden: You do not own this project\'s documents' }, 403);
    }

    return c.json(data, 200);
  } catch (error) {
    console.error('Error fetching internal document by ID:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Update an internal document (Admin only, or project owner with specific RLS)
internalDocuments.put(
  '/:id',
  zValidator('json', InternalDocumentSchema.partial().omit({ id: true, created_at: true })),
  async (c) => {
    const documentId = c.req.param('id');
    const updateData = c.req.valid('json');
    const userId = c.get('userId');
    const userRole = c.get('userRole');
    const supabase = c.get('supabase'); // Use anon client for RLS

    if (!userId) {
      return c.json({ error: 'User not authenticated' }, 401);
    }

    try {
      let query = supabase.from('internal_documents').update({ ...updateData, updated_at: new Date().toISOString() }).eq('id', documentId);

      // If admin, bypass RLS by using supabaseAdmin
      if (userRole === 'admin') {
        query = c.get('supabaseAdmin').from('internal_documents').update({ ...updateData, updated_at: new Date().toISOString() }).eq('id', documentId);
      }

      const { data, error } = await query.select().single();

      if (error && error.code !== 'PGRST116') {
        console.error('Supabase update internal document error:', error);
        return c.json({ error: 'Failed to update internal document' }, 500);
      }
      if (!data) {
        return c.json({ error: 'Internal document not found or unauthorized to update' }, 404);
      }
      return c.json(data, 200);
    } catch (error) {
      console.error('Error updating internal document:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  }
);

// Delete an internal document (Admin only)
internalDocuments.delete('/:id', adminOnly, async (c) => {
  const documentId = c.req.param('id');
  const supabaseAdmin = c.get('supabaseAdmin');

  try {
    const { error } = await supabaseAdmin
      .from('internal_documents')
      .delete()
      .eq('id', documentId);

    if (error) {
      console.error('Supabase delete internal document error:', error);
      return c.json({ error: error.message || 'Failed to delete internal document' }, 500);
    }
    return c.body(null, 204); // Corrigido aqui: Usar c.body(null, 204) para 204 No Content
  } catch (error) {
    console.error('Error deleting internal document:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default internalDocuments;