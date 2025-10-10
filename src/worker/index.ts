import { Hono } from "hono";
import auth from "./routes/auth";
import funnel from "./routes/funnel";
import asaas from "./routes/asaas";
import projects from "./routes/projects";
import subscriptions from "./routes/subscriptions";
import internalDocuments from "./routes/internalDocuments";
import tasks from "./routes/tasks";
import profiles from "./routes/profiles";
import settings from "./routes/settings";
import analytics from "./routes/analytics"; // Importando a nova rota de análise
import { createWorkerSupabaseClient } from '@/integrations/supabase/workerClient';
import { SupabaseClient } from '@supabase/supabase-js';

type Bindings = {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  JWT_SECRET: string;
  ASAAS_API_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
};

type Variables = {
  supabase: SupabaseClient;
  supabaseAdmin: SupabaseClient;
  userId?: string;
  userRole?: string;
};

const app = new Hono<{ Bindings: Bindings, Variables: Variables }>();

app.use('*', async (c, next) => {
  const supabase = createWorkerSupabaseClient(c.env.SUPABASE_URL, c.env.SUPABASE_ANON_KEY);
  c.set('supabase', supabase);

  const supabaseAdmin = createWorkerSupabaseClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);
  c.set('supabaseAdmin', supabaseAdmin);

  await next();
});

app.route('/api/auth', auth);
app.route('/api/funnel', funnel);
app.route('/api/asaas', asaas);
app.route('/api/projects', projects);
app.route('/api/subscriptions', subscriptions);
app.route('/api/internal-documents', internalDocuments);
app.route('/api/tasks', tasks);
app.route('/api/profiles', profiles);
app.route('/api/settings', settings);
app.route('/api/analytics', analytics); // Adicionando a nova rota de análise

app.get('/', (c) => {
  return c.text('P4D Mídia API is running!');
});

export default app;