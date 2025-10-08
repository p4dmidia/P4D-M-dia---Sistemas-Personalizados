import { Hono } from "hono";
import auth from "./routes/auth";
import funnel from "./routes/funnel";
import { createWorkerSupabaseClient } from '@/integrations/supabase/workerClient'; // Import worker client factory
import { SupabaseClient } from '@supabase/supabase-js'; // Import SupabaseClient type

// Extend the Env interface to include Supabase environment variables and the Supabase client itself
type Bindings = {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  JWT_SECRET: string; // Still needed if Hono JWT is used for other purposes
};

// Extend the ContextVariableMap to include the Supabase client
type Variables = {
  supabase: SupabaseClient;
};

const app = new Hono<{ Bindings: Bindings, Variables: Variables }>();

// Middleware to initialize Supabase client and make it available in context
app.use('*', async (c, next) => {
  const supabase = createWorkerSupabaseClient(c.env.SUPABASE_URL, c.env.SUPABASE_ANON_KEY);
  c.set('supabase', supabase);
  await next();
});

// Add routes
app.route('/api/auth', auth);
app.route('/api/funnel', funnel);

// Basic root route for testing
app.get('/', (c) => {
  return c.text('P4D Mídia API is running!');
});

export default app;