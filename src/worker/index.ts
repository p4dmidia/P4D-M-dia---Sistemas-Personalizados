import { Hono } from "hono";
import auth from "./routes/auth";
import funnel from "./routes/funnel";
import asaas from "./routes/asaas";
import projects from "./routes/projects";
import subscriptions from "./routes/subscriptions"; // Import the new subscriptions route
import internalDocuments from "./routes/internalDocuments"; // Import the new internalDocuments route
import tasks from "./routes/tasks"; // Import the new tasks route
import { createWorkerSupabaseClient } from '@/integrations/supabase/workerClient'; // Import worker client factory
import { SupabaseClient } from '@supabase/supabase-js'; // Import SupabaseClient type

// Extend the Env interface to include Supabase environment variables and the Supabase client itself
type Bindings = {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  JWT_SECRET: string; // Still needed if Hono JWT is used for other purposes
  ASAAS_API_KEY: string; // Add Asaas API Key to bindings
  SUPABASE_SERVICE_ROLE_KEY: string; // Add service role key
};

// Extend the ContextVariableMap to include the Supabase client
type Variables = {
  supabase: SupabaseClient;
  supabaseAdmin: SupabaseClient; // Add admin client
  userId?: string; // Add userId to variables for middleware
  userRole?: string; // Add userRole to variables for middleware
};

const app = new Hono<{ Bindings: Bindings, Variables: Variables }>();

// Middleware to initialize Supabase clients and make them available in context
app.use('*', async (c, next) => {
  const supabase = createWorkerSupabaseClient(c.env.SUPABASE_URL, c.env.SUPABASE_ANON_KEY);
  c.set('supabase', supabase);

  // Create and set the admin client
  const supabaseAdmin = createWorkerSupabaseClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);
  c.set('supabaseAdmin', supabaseAdmin);

  await next();
});

// Add routes
app.route('/api/auth', auth);
app.route('/api/funnel', funnel);
app.route('/api/asaas', asaas);
app.route('/api/projects', projects);
app.route('/api/subscriptions', subscriptions); // Add the new subscriptions route
app.route('/api/internal-documents', internalDocuments); // Add the new internalDocuments route
app.route('/api/tasks', tasks); // Add the new tasks route

// Basic root route for testing
app.get('/', (c) => {
  return c.text('P4D Mídia API is running!');
});

export default app;