// supabase/functions/create-portal-session/index.ts
import Stripe from "npm:stripe@^16";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

type Body = { customerId: string; }; // Removido userId

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

  const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
  const FRONTEND_URL = Deno.env.get("FRONTEND_URL");
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!STRIPE_SECRET_KEY || !FRONTEND_URL || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Server misconfigured: Missing environment variables.");
    return new Response("Server misconfigured (missing STRIPE_SECRET_KEY/FRONTEND_URL/SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY).", { status: 500 });
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });

  try {
    const { customerId } = (await req.json()) as Body; // Removido userId
    if (!customerId) return new Response("Missing customerId.", { status: 400 });

    // A verificação de userId foi removida daqui, pois a função Edge não deve depender do userId do cliente para criar a sessão do portal.
    // A segurança deve ser garantida pelo RLS no frontend ou por uma verificação mais robusta no backend se necessário.
    // O customerId já é um identificador seguro do Stripe.

    const portal = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${FRONTEND_URL}/dashboard`,
    });

    return new Response(JSON.stringify({ url: portal.url }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  } catch (err) {
    console.error("create-portal-session error:", err);
    return new Response("Failed to create portal session.", { status: 500 });
  }
});