import { Hono } from "hono";
import auth from "./routes/auth";
import funnel from "./routes/funnel";

// Extend the Env interface to include D1 and JWT_SECRET
type Bindings = {
  DB: D1Database;
  JWT_SECRET: string; // Make sure to set this in your .dev.vars and Cloudflare Workers environment
};

const app = new Hono<{ Bindings: Bindings }>();

// Add routes
app.route('/api/auth', auth);
app.route('/api/funnel', funnel);

// Basic root route for testing
app.get('/', (c) => {
  return c.text('P4D Mídia API is running!');
});

export default app;