import { Hono } from "hono";
import auth from "./routes/auth";
import funnel from "./routes/funnel";
import projects from "./routes/projects";
import subscriptions from "./routes/subscriptions";
import internalDocuments from "./routes/internalDocuments";
import tasks from "./routes/tasks";
import profiles from "./routes/profiles";
import settings from "./routes/settings";
import analytics from "./routes/analytics";
import contact from "./routes/contact";
import stripeRoute from "./routes/stripe"; // Importando a nova rota do Stripe
import { createWorkerSupabaseClient } from '@/integrations/supabase/workerClient';
import { SupabaseClient } from '@supabase/supabase-js';

type Bindings = {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  JWT_SECRET: string;
  STRIPE_SECRET_KEY: string; // Mantendo a chave do Stripe
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
app.route('/api/projects', projects);
app.route('/api/subscriptions', subscriptions);
app.route('/api/internal-documents', internalDocuments);
app.route('/api/tasks', tasks);
app.route('/api/profiles', profiles);
app.route('/api/settings', settings);
app.route('/api/analytics', analytics);
app.route('/api/contact', contact);
app.route('/api/stripe', stripeRoute); // Adicionando a nova rota do Stripe

app.get('/', (c) => {
  return c.text('P4D Mídia API is running!');
});

export default app;