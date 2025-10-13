// supabase/functions/stripe-webhook/index.ts
import Stripe from "npm:stripe@^16";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

  const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
  const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Server misconfigured: Missing environment variables.");
    return new Response("Server misconfigured (missing STRIPE_SECRET_KEY/STRIPE_WEBHOOK_SECRET/SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY).", { status: 500 });
  }

  const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });
  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const payload = await req.text();
  const sig = req.headers.get("stripe-signature") ?? "";

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(payload, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return new Response(`Invalid signature: ${err.message}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case "product.created":
      case "product.updated": {
        const product = event.data.object as Stripe.Product;
        console.log(`Processing product event: ${event.type} for product ${product.id}`);

        const { error: upsertError } = await supabaseAdmin
          .from('products')
          .upsert({
            stripe_product_id: product.id,
            name: product.name,
            description: product.description,
            active: product.active,
            metadata: product.metadata,
            updated_at: new Date().toISOString(),
            // created_at will be set by default on insert, or remain unchanged on update
          }, { onConflict: 'stripe_product_id' });

        if (upsertError) {
          console.error(`Error upserting product ${product.id}:`, upsertError);
          return new Response(`Failed to upsert product: ${upsertError.message}`, { status: 500 });
        }
        console.log(`Product ${product.id} (${product.name}) upserted successfully.`);
        break;
      }

      case "price.created":
      case "price.updated": {
        const price = event.data.object as Stripe.Price;
        console.log(`Processing price event: ${event.type} for price ${price.id}`);

        // Garante que o produto associado exista no nosso DB primeiro
        let productData;
        const { data: existingProduct, error: fetchProductError } = await supabaseAdmin
          .from('products')
          .select('id')
          .eq('stripe_product_id', price.product as string)
          .single();

        if (fetchProductError && fetchProductError.code !== 'PGRST116') {
          console.error(`Error checking for existing product ${price.product}:`, fetchProductError);
          return new Response(`Failed to check for existing product for price ${price.id}`, { status: 500 });
        }

        if (!existingProduct) {
          console.log(`Product ${price.product} not found in DB, fetching from Stripe and upserting.`);
          const stripeProduct = await stripe.products.retrieve(price.product as string);
          const { data: newProductData, error: upsertProductError } = await supabaseAdmin
            .from('products')
            .upsert({
              stripe_product_id: stripeProduct.id,
              name: stripeProduct.name,
              description: stripeProduct.description,
              active: stripeProduct.active,
              metadata: stripeProduct.metadata,
              updated_at: new Date().toISOString(),
            }, { onConflict: 'stripe_product_id' })
            .select('id')
            .single();

          if (upsertProductError || !newProductData) {
            console.error(`Error upserting product ${stripeProduct.id} during price processing:`, upsertProductError);
            return new Response(`Failed to upsert product for price ${price.id}`, { status: 500 });
          }
          productData = newProductData;
          console.log(`Product ${stripeProduct.id} upserted successfully during price processing.`);
        } else {
          productData = existingProduct;
          console.log(`Product ${price.product} already exists in DB.`);
        }

        // Agora que temos o productData.id, podemos prosseguir com o upsert do preço
        const { error: upsertPriceError } = await supabaseAdmin
          .from('prices')
          .upsert({
            stripe_price_id: price.id,
            product_id: productData.id, // Usa o UUID interno
            active: price.active,
            unit_amount: price.unit_amount ? price.unit_amount / 100 : 0, // Converte centavos para reais
            currency: price.currency,
            type: price.type,
            interval: price.recurring?.interval || null,
            interval_count: price.recurring?.interval_count || null,
            metadata: price.metadata,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'stripe_price_id' });

        if (upsertPriceError) {
          console.error(`Error upserting price ${price.id}:`, upsertPriceError);
          return new Response(`Failed to upsert price: ${upsertPriceError.message}`, { status: 500 });
        }
        console.log(`Price ${price.id} upserted successfully.`);
        break;
      }

      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;
        const supabaseUserId = session.metadata?.supabase_user_id;
        const supabaseSubscriptionId = session.metadata?.supabase_subscription_id;
        const funnelResponseId = session.metadata?.funnel_response_id;

        if (!supabaseUserId || !supabaseSubscriptionId) {
          console.error("Missing metadata for checkout.session.completed:", session.metadata);
          return new Response("Missing metadata for Supabase user/subscription ID.", { status: 400 });
        }

        // 1) Salvar customerId em profiles.stripe_customer_id (se ainda não salvo)
        const { error: updateProfileError } = await supabaseAdmin
          .from("profiles")
          .update({ stripe_customer_id: customerId, updated_at: new Date().toISOString() })
          .eq("id", supabaseUserId);

        if (updateProfileError) {
          console.error("Error updating profile with Stripe customer ID:", updateProfileError);
        } else {
          console.log(`Profile ${supabaseUserId} updated with Stripe customer ID: ${customerId}`);
        }

        // 2) Buscar subscription no Stripe para capturar current_period_end e status
        const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
        const price = await stripe.prices.retrieve(stripeSubscription.items.data[0].price.id);
        const product = await stripe.products.retrieve(price.product as string);

        // 3) Upsert em subscriptions
        const { data: updatedSubscription, error: updateSubscriptionError } = await supabaseAdmin
          .from("subscriptions")
          .update({
            stripe_subscription_id: subscriptionId,
            stripe_price_id: price.id,
            plan_name: product.name,
            amount: price.unit_amount ? price.unit_amount / 100 : 0, // Converte centavos para reais
            status: stripeSubscription.status,
            next_due_date: stripeSubscription.current_period_end ? new Date(stripeSubscription.current_period_end * 1000).toISOString() : null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", supabaseSubscriptionId)
          .select()
          .single();

        if (updateSubscriptionError) {
          console.error("Error updating subscription on checkout.session.completed:", updateSubscriptionError);
          return new Response("Failed to update subscription.", { status: 500 });
        }
        console.log("Subscription updated to active:", updatedSubscription?.id);

        // Opcional: Criar um projeto se houver funnelResponseId
        if (funnelResponseId) {
          const { data: funnelData, error: funnelError } = await supabaseAdmin
            .from('funnel_responses')
            .select('step_data')
            .eq('id', funnelResponseId)
            .single();

          if (funnelError && funnelError.code !== 'PGRST116') {
            console.error('Stripe Webhook: Error fetching funnel response:', funnelError);
          } else if (funnelData) {
            const planName = updatedSubscription?.plan_name || 'Plano Desconhecido';
            const businessType = funnelData.step_data.business_type || 'N/A';
            const systemGoal = Array.isArray(funnelData.step_data.system_goal) ? funnelData.step_data.system_goal.join(', ') : 'N/A';
            const projectSummary = `Projeto gerado a partir do funil. Tipo de negócio: ${businessType}. Objetivos: ${systemGoal}.`;

            const { data: newProject, error: projectError } = await supabaseAdmin
              .from('projects')
              .insert({
                user_id: supabaseUserId,
                funnel_response_id: funnelResponseId,
                plan_name: planName,
                status: 'briefing_received',
                summary: projectSummary,
                estimated_delivery: '7 dias úteis', // Estimativa padrão
              })
              .select()
              .single();

            if (projectError) {
              console.error('Stripe Webhook: Error creating project:', projectError);
            } else {
              console.log('Stripe Webhook: Project created:', newProject?.id);
            }
          }
        }
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted":
      case "customer.subscription.created": {
        const sub = event.data.object as Stripe.Subscription;
        const status = sub.status;
        const priceId = (sub.items?.data?.[0]?.price?.id) || "";
        const currentPeriodEnd = new Date(sub.current_period_end * 1000).toISOString();
        const subscriptionId = sub.id;
        const customerId = sub.customer as string;

        // Atualizar subscriptions (status/price/current_period_end)
        const { error: updateError } = await supabaseAdmin
          .from("subscriptions")
          .update({
            status: status,
            stripe_price_id: priceId,
            next_due_date: currentPeriodEnd,
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscriptionId);

        if (updateError) {
          console.error("Error updating subscription on customer.subscription event:", updateError);
          return new Response("Failed to update subscription.", { status: 500 });
        }
        console.log(`Subscription ${subscriptionId} status updated to ${status}.`);
        break;
      }

      default:
        console.log(`Unhandled event type ${event.type}`);
        break;
    }

    return new Response("ok", { status: 200 });
  } catch (err) {
    console.error("stripe-webhook handler error:", err);
    return new Response("Webhook processing error.", { status: 500 });
  }
});