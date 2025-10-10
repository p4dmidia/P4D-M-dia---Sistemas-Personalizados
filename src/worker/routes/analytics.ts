import { Hono } from 'hono';
import { SupabaseClient } from '@supabase/supabase-js';

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

const analytics = new Hono<{ Bindings: Bindings, Variables: Variables }>();

// Middleware para obter o usuário e a função da sessão Supabase
analytics.use('*', async (c, next) => {
  const supabaseAdmin = c.get('supabaseAdmin');
  const authHeader = c.req.header('Authorization');
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error) {
      console.error('Analytics Middleware: Supabase auth error:', error);
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
        console.error('Analytics Middleware: Error fetching user role:', profileError);
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

// Endpoint para obter um resumo dos dados de análise
analytics.get('/summary', adminOnly, async (c) => {
  const supabaseAdmin = c.get('supabaseAdmin');
  try {
    // Total de Usuários
    const { count: totalUsers, error: usersError } = await supabaseAdmin
      .from('profiles')
      .select('id', { count: 'exact' });
    if (usersError) throw usersError;

    // Total de Projetos
    const { count: totalProjects, error: projectsError } = await supabaseAdmin
      .from('projects')
      .select('id', { count: 'exact' });
    if (projectsError) throw projectsError;

    // Assinaturas Ativas
    const { count: activeSubscriptions, error: subscriptionsError } = await supabaseAdmin
      .from('subscriptions')
      .select('id', { count: 'exact' })
      .eq('status', 'active');
    if (subscriptionsError) throw subscriptionsError;

    // Projetos por Status
    const { data: projectsByStatus, error: statusError } = await supabaseAdmin
      .from('projects')
      .select('status, count')
      .rollup('count')
      .group('status');
    if (statusError) throw statusError;

    return c.json({
      totalUsers,
      totalProjects,
      activeSubscriptions,
      projectsByStatus: projectsByStatus || [],
    }, 200);

  } catch (error) {
    console.error('Error fetching analytics summary:', error);
    return c.json({ error: 'Failed to fetch analytics summary' }, 500);
  }
});

export default analytics;