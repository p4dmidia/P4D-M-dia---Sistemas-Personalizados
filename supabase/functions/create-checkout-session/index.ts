// supabase/functions/create-checkout-session/index.ts
// Deno + Supabase Edge Functions
import Stripe from "npm:stripe@^16";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

// Definir os cabeçalhos CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Permite qualquer origem. Em produção, você pode querer restringir a domínios específicos.
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type Body = {
  userId: string;        // id do usuário (profiles.id)
  email: string;         // e-mail do usuário
  priceId: string;       // ex.: "price_123..."
  planName: string;      // nome do plano
  amount: number;        // valor do plano
  funnelResponseId?: string; // ID da resposta do funil, opcional
};

Deno.serve(async (req) => {
  // Lidar com requisições OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });

  const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
  const FRONTEND_URL = Deno.env.get("FRONTEND_URL");
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!STRIPE_SECRET_KEY || !FRONTEND_URL || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Server misconfigured: Missing environment variables.");
    return new Response("Server misconfigured (missing STRIPE_SECRET_KEY/FRONTEND_URL/SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY).", { status: 500, headers: corsHeaders });
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });

  try {
    const { userId, email, priceId, planName, amount, funnelResponseId } = (await req.json()) as Body;
    if (!userId || !email || !priceId || !planName || amount === undefined) return new Response("Invalid body.", { status: 400, headers: corsHeaders });

    // 1. Obter ou Criar Stripe Customer
    let stripeCustomerId: string | null = null;
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", userId)
      .single();

    if (profileError && profileError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error("Error fetching profile for Stripe customer ID:", profileError);
      return new Response("Failed to fetch user profile.", { status: 500, headers: corsHeaders });
    }

    if (profileData?.stripe_customer_id) {
      stripeCustomerId = profileData.stripe_customer_id;
      console.log("Existing Stripe customer found:", stripeCustomerId);
    } else {
      console.log("Creating new Stripe customer for email:", email);
      const customer = await stripe.customers.create({ email, metadata: { supabase_user_id: userId } });
      stripeCustomerId = customer.id;
      console.log("Stripe customer created:", stripeCustomerId);

      // Persistir customer.id em profiles.stripe_customer_id
      const { error: updateProfileError } = await supabaseAdmin
        .from("profiles")
        .update({ stripe_customer_id: stripeCustomerId, updated_at: new Date().toISOString() })
        .eq("id", userId);

      if (updateProfileError) {
        console.error("Error updating user profile with Stripe customer ID:", updateProfileError);
        // Não bloqueia o fluxo, mas loga o erro
      }
    }

    // 2. Criar uma assinatura pendente no Supabase
    const { data: newSubscription, error: dbInsertError } = await supabaseAdmin
      .from('subscriptions')
      .insert({
        user_id: userId,
        plan_name: planName,
        amount: amount,
        status: 'pending',
        stripe_price_id: priceId,
      })
      .select()
      .single();

    if (dbInsertError) {
      console.error('Error saving pending subscription to DB:', dbInsertError);
      return new Response('Failed to save pending subscription details.', { status: 500, headers: corsHeaders });
    }
    console.log('Pending subscription saved to Supabase:', newSubscription.id);

    // 3. Criar sessão de checkout do Stripe
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: stripeCustomerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${FRONTEND_URL}/dashboard?success=true`,
      cancel_url: `${FRONTEND_URL}/funnel/summary?canceled=true`,
      allow_promotion_codes: true,
      metadata: {
        supabase_user_id: userId,
        supabase_subscription_id: newSubscription.id,
        funnel_response_id: funnelResponseId || '',
      },
      subscription_data: {
        metadata: {
          supabase_user_id: userId,
          supabase_subscription_id: newSubscription.id,
        },
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  } catch (err) {
    console.error("create-checkout-session error:", err);
    return new Response("Failed to create checkout session.", { status: 500, headers: corsHeaders });
  }
});