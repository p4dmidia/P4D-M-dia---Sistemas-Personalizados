import { Hono } from 'hono';
import { SupabaseClient } from '@supabase/supabase-js';
import { zValidator } from '@hono/zod-validator';
import { UserSchema } from '@/shared/types'; // Reutilizando UserSchema para validação de perfil

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

const profiles = new Hono<{ Bindings: Bindings, Variables: Variables }>();

// Middleware para obter o usuário e a função da sessão Supabase
profiles.use('*', async (c, next) => {
  const supabaseAdmin = c.get('supabaseAdmin');
  const authHeader = c.req.header('Authorization');
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error) {
      console.error('Profiles Middleware: Supabase auth error:', error);
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    if (user) {
      c.set('userId', user.id);
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') { // PGRST116 significa "nenhuma linha encontrada"
        console.error('Profiles Middleware: Error fetching user role:', profileError);
        return c.json({ error: 'Failed to fetch user profile' }, 500);
      }
      c.set('userRole', profile?.role || 'client');
    }
  } else {
    return c.json({ error: 'Authorization header missing' }, 401);
  }
  await next();
});

// Middleware para restringir acesso apenas a administradores
const adminOnly = async (c: any, next: any) => {
  const userRole = c.get('userRole');
  if (userRole !== 'admin') {
    return c.json({ error: 'Forbidden: Admin access required' }, 403);
  }
  await next();
};

// Obter todos os perfis (apenas para administradores)
profiles.get('/', adminOnly, async (c) => {
  const supabaseAdmin = c.get('supabaseAdmin');
  try {
    // Seleciona dados do perfil e faz um join com a tabela auth.users para obter o email
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('id, first_name, last_name, avatar_url, role, updated_at, asaas_customer_id, auth_users(email, created_at)');

    if (error) {
      console.error('Supabase fetch all profiles error:', error);
      return c.json({ error: 'Failed to fetch profiles' }, 500);
    }
    return c.json(data, 200);
  } catch (error) {
    console.error('Error fetching all profiles:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Atualizar um perfil (apenas para administradores)
profiles.put(
  '/:id',
  adminOnly,
  zValidator('json', UserSchema.partial().omit({ id: true, created_at: true, password: true, password_hash: true })),
  async (c) => {
    const profileId = c.req.param('id');
    const updateData = c.req.valid('json');
    const supabaseAdmin = c.get('supabaseAdmin');

    try {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .update({ ...updateData, updated_at: new Date().toISOString() })
        .eq('id', profileId)
        .select()
        .single();

      if (error) {
        console.error('Supabase update profile error:', error);
        return c.json({ error: 'Failed to update profile' }, 500);
      }
      if (!data) {
        return c.json({ error: 'Profile not found' }, 404);
      }
      return c.json(data, 200);
    } catch (error) {
      console.error('Error updating profile:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  }
);

// Deletar um perfil (apenas para administradores)
profiles.delete('/:id', adminOnly, async (c) => {
  const profileId = c.req.param('id');
  const supabaseAdmin = c.get('supabaseAdmin');

  try {
    const { error } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', profileId);

    if (error) {
      console.error('Supabase delete profile error:', error);
      return c.json({ error: 'Failed to delete profile' }, 500);
    }
    return c.json({ message: 'Profile deleted successfully' }, 204);
  } catch (error) {
    console.error('Error deleting profile:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default profiles;