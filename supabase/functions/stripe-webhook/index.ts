import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import Stripe from 'https://esm.sh/stripe@16.2.0?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
      apiVersion: '2024-06-20',
    });
    const signature = req.headers.get('stripe-signature');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    if (!signature || !webhookSecret) {
      console.error('Stripe Webhook: Missing signature or webhook secret.');
      return new Response('Missing Stripe-Signature or Webhook Secret', { status: 400, headers: corsHeaders });
    }

    const rawBody = await req.text();
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err: any) {
      console.error(`Stripe Webhook: Webhook signature verification failed: ${err.message}`);
      return new Response(`Webhook Error: ${err.message}`, { status: 400, headers: corsHeaders });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    console.log(`Stripe Webhook: Event received: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed':
        const checkoutSession = event.data.object as Stripe.Checkout.Session;
        const subscriptionId = checkoutSession.subscription as string;
        const customerId = checkoutSession.customer as string;
        const supabaseSubscriptionId = checkoutSession.metadata?.supabase_subscription_id;
        const supabaseUserId = checkoutSession.metadata?.supabase_user_id;
        const funnelResponseId = checkoutSession.metadata?.funnel_response_id;

        if (!supabaseSubscriptionId || !supabaseUserId) {
          console.error('Stripe Webhook: Missing metadata for checkout.session.completed');
          return new Response('Missing metadata', { status: 400, headers: corsHeaders });
        }

        // Fetch the subscription from Stripe to get details like current_period_end
        const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
        const price = await stripe.prices.retrieve(stripeSubscription.items.data[0].price.id);
        const product = await stripe.products.retrieve(price.product as string);

        // Update the pending subscription in Supabase
        const { data: updatedSubscription, error: updateError } = await supabaseAdmin
          .from('subscriptions')
          .update({
            stripe_subscription_id: subscriptionId,
            stripe_price_id: price.id,
            plan_name: product.name,
            amount: price.unit_amount ? price.unit_amount / 100 : 0, // Convert cents to dollars
            status: 'active',
            next_due_date: stripeSubscription.current_period_end ? new Date(stripeSubscription.current_period_end * 1000).toISOString() : null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', supabaseSubscriptionId)
          .select()
          .single();

        if (updateError) {
          console.error('Stripe Webhook: Error updating subscription on checkout.session.completed:', updateError);
          return new Response('Failed to update subscription', { status: 500, headers: corsHeaders });
        }
        console.log('Stripe Webhook: Subscription updated to active:', updatedSubscription?.id);

        // Create a project entry if funnel_response_id is available
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
            const projectSummary = `Projeto gerado a partir do funil. Tipo de negócio: ${funnelData.step_data.business_type || 'N/A'}. Objetivos: ${funnelData.step_data.system_goal?.join(', ') || 'N/A'}.`;

            const { data: newProject, error: projectError } = await supabaseAdmin
              .from('projects')
              .insert({
                user_id: supabaseUserId,
                funnel_response_id: funnelResponseId,
                plan_name: planName,
                status: 'briefing_received',
                summary: projectSummary,
                estimated_delivery: '7 dias úteis', // Default estimate
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

      case 'customer.subscription.updated':
        const updatedStripeSubscription = event.data.object as Stripe.Subscription;
        const updatedPrice = await stripe.prices.retrieve(updatedStripeSubscription.items.data[0].price.id);
        const updatedProduct = await stripe.products.retrieve(updatedPrice.product as string);

        const { error: subUpdateError } = await supabaseAdmin
          .from('subscriptions')
          .update({
            plan_name: updatedProduct.name,
            amount: updatedPrice.unit_amount ? updatedPrice.unit_amount / 100 : 0,
            status: updatedStripeSubscription.status,
            next_due_date: updatedStripeSubscription.current_period_end ? new Date(updatedStripeSubscription.current_period_end * 1000).toISOString() : null,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', updatedStripeSubscription.id);

        if (subUpdateError) {
          console.error('Stripe Webhook: Error updating subscription on customer.subscription.updated:', subUpdateError);
          return new Response('Failed to update subscription', { status: 500, headers: corsHeaders });
        }
        console.log('Stripe Webhook: Subscription status updated:', updatedStripeSubscription.id);
        break;

      case 'customer.subscription.deleted':
        const deletedStripeSubscription = event.data.object as Stripe.Subscription;
        const { error: subDeleteError } = await supabaseAdmin
          .from('subscriptions')
          .update({
            status: 'canceled',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', deletedStripeSubscription.id);

        if (subDeleteError) {
          console.error('Stripe Webhook: Error updating subscription on customer.subscription.deleted:', subDeleteError);
          return new Response('Failed to update subscription', { status: 500, headers: corsHeaders });
        }
        console.log('Stripe Webhook: Subscription status set to canceled:', deletedStripeSubscription.id);
        break;

      // Adicione outros eventos do Stripe que você deseja processar
      default:
        console.log(`Stripe Webhook: Unhandled event type ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    console.error('Stripe Webhook: General error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});