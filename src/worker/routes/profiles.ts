import { Hono } from 'hono';
import { SupabaseClient } from '@supabase/supabase-js';
import { zValidator } from '@hono/zod-validator';
import { UserSchema } from '@/shared/types'; // Reutilizando UserSchema para validação de perfil
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
    const { data: profilesData, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, first_name, last_name, avatar_url, role, updated_at, stripe_customer_id'); // Removido asaas_customer_id

    if (profilesError) {
      console.error('Supabase fetch all profiles error:', profilesError);
      return c.json({ error: 'Failed to fetch profiles' }, 500);
    }

    // Para cada perfil, busca os dados do usuário (email, created_at, banned_until) da tabela auth.users
    const usersWithAuthDetails = await Promise.all(profilesData.map(async (profile) => {
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(profile.id);
      if (userError) {
        console.error(`Error fetching auth user for profile ${profile.id}:`, userError);
        // Retorna um fallback se não conseguir buscar os dados de autenticação
        return { ...profile, auth_users: { email: 'N/A', created_at: 'N/A', banned_until: null } };
      }
      return {
        ...profile,
        auth_users: {
          email: userData.user?.email || 'N/A',
          created_at: userData.user?.created_at || 'N/A',
          banned_until: userData.user?.banned_until || null,
        },
      };
    }));

    return c.json(usersWithAuthDetails, 200);
  } catch (error) {
    console.error('Error fetching all profiles:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Criar um novo usuário (apenas para administradores)
profiles.post(
  '/',
  adminOnly,
  zValidator('json', UserSchema.pick({ email: true, password: true, name: true, role: true })), // Adicionado role
  async (c) => {
    const { email, password, name, role } = c.req.valid('json');
    const supabaseAdmin = c.get('supabaseAdmin');

    if (!password) {
      return c.json({ error: 'Password is required' }, 400);
    }

    try {
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Confirma o email automaticamente para admin-created users
        user_metadata: { first_name: name },
      });

      if (error) {
        console.error('Supabase admin create user error:', error);
        return c.json({ error: error.message || 'Failed to create user' }, 400);
      }

      // Atualiza o perfil para definir o role
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({ first_name: name, role: role || 'client', updated_at: new Date().toISOString() })
        .eq('id', data.user.id);

      if (profileError) {
        console.error('Supabase update profile role error:', profileError);
        // Se falhar ao atualizar o perfil, ainda assim o usuário foi criado no auth.users
        return c.json({ error: 'User created, but failed to set profile role' }, 500);
      }

      return c.json({ message: 'User created successfully', userId: data.user.id }, 201);
    } catch (error) {
      console.error('Error creating user:', error);
      return c.json({ error: 'Failed to create user' }, 500);
    }
  }
);

// Atualizar um perfil (apenas para administradores)
profiles.put(
  '/:id',
  adminOnly,
  zValidator('json', z.object({
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    email: z.string().email().optional(),
    role: z.enum(['client', 'admin']).optional(),
    is_banned: z.boolean().optional(), // Para bloquear/desbloquear
  })),
  async (c) => {
    const profileId = c.req.param('id');
    const updateData = c.req.valid('json');
    const supabaseAdmin = c.get('supabaseAdmin');

    try {
      // 1. Atualizar a tabela 'profiles'
      const profileUpdatePayload: { first_name?: string; last_name?: string; role?: 'client' | 'admin'; updated_at: string } = {
        updated_at: new Date().toISOString(),
      };
      if (updateData.first_name !== undefined) profileUpdatePayload.first_name = updateData.first_name;
      if (updateData.last_name !== undefined) profileUpdatePayload.last_name = updateData.last_name;
      if (updateData.role !== undefined) profileUpdatePayload.role = updateData.role;

      const { data: updatedProfile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .update(profileUpdatePayload)
        .eq('id', profileId)
        .select()
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Supabase update profile error:', profileError);
        return c.json({ error: 'Failed to update profile' }, 500);
      }

      // 2. Atualizar a tabela 'auth.users'
      const userUpdatePayload: { email?: string; banned_until?: string | null; user_metadata?: { first_name?: string } } = {};
      if (updateData.email !== undefined) userUpdatePayload.email = updateData.email;
      if (updateData.is_banned !== undefined) {
        userUpdatePayload.banned_until = updateData.is_banned ? new Date(8640000000000000).toISOString() : null; // Bloqueia indefinidamente ou desbloqueia
      }
      if (updateData.first_name !== undefined) { // Atualiza user_metadata também
        userUpdatePayload.user_metadata = { first_name: updateData.first_name };
      }

      const { data: updatedUserAuth, error: userAuthError } = await supabaseAdmin.auth.admin.updateUserById(
        profileId,
        userUpdatePayload
      );

      if (userAuthError) {
        console.error('Supabase update auth user error:', userAuthError);
        // Se a atualização do auth.users falhar, ainda retornamos o perfil atualizado se ele foi bem-sucedido
        return c.json({ error: 'Failed to update user authentication data', profile: updatedProfile }, 500);
      }

      // Retorna o perfil atualizado e os dados de autenticação
      return c.json({ ...updatedProfile, auth_users: { email: updatedUserAuth.user?.email, banned_until: updatedUserAuth.user?.banned_until } }, 200);
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
    const { error } = await supabaseAdmin.auth.admin.deleteUser(profileId);

    if (error) {
      console.error('Supabase delete user error:', error);
      return c.json({ error: error.message || 'Failed to delete user' }, 500);
    }
    return c.json({ message: 'User deleted successfully' }, 204);
  } catch (error) {
    console.error('Error deleting user:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default profiles;