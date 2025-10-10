import { Hono } from 'hono';
import { SupabaseClient } from '@supabase/supabase-js';
import { zValidator } from '@hono/zod-validator';
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

const settings = new Hono<{ Bindings: Bindings, Variables: Variables }>();

// Middleware para obter o usuário e a função da sessão Supabase
settings.use('*', async (c, next) => {
  const supabaseAdmin = c.get('supabaseAdmin');
  const authHeader = c.req.header('Authorization');
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error) {
      console.error('Settings Middleware: Supabase auth error:', error);
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
        console.error('Settings Middleware: Error fetching user role:', profileError);
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

// Schema para validação das configurações
const SettingsSchema = z.record(z.string()); // Espera um objeto onde as chaves são strings e os valores são strings

// Obter todas as configurações (apenas para administradores)
settings.get('/', adminOnly, async (c) => {
  const supabaseAdmin = c.get('supabaseAdmin');
  try {
    const { data, error } = await supabaseAdmin
      .from('settings')
      .select('key, value');

    if (error) {
      console.error('Supabase fetch settings error:', error);
      return c.json({ error: 'Failed to fetch settings' }, 500);
    }

    // Transforma o array de { key, value } em um objeto { key: value }
    const settingsObject = data.reduce((acc, item) => {
      acc[item.key] = item.value;
      return acc;
    }, {} as Record<string, string>);

    return c.json(settingsObject, 200);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Atualizar configurações (apenas para administradores)
settings.put(
  '/',
  adminOnly,
  zValidator('json', SettingsSchema),
  async (c) => {
    const updatedSettings = c.req.valid('json');
    const supabaseAdmin = c.get('supabaseAdmin');

    try {
      const updates = Object.entries(updatedSettings).map(([key, value]) => ({
        key,
        value,
        updated_at: new Date().toISOString(),
      }));

      // Upsert (insert or update) settings
      const { error } = await supabaseAdmin
        .from('settings')
        .upsert(updates, { onConflict: 'key' });

      if (error) {
        console.error('Supabase update settings error:', error);
        return c.json({ error: 'Failed to update settings' }, 500);
      }

      return c.json({ message: 'Settings updated successfully' }, 200);
    } catch (error) {
      console.error('Error updating settings:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  }
);

export default settings;