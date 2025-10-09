import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { SupabaseClient } from '@supabase/supabase-js';

type Bindings = {
  ASAAS_API_KEY: string; // Asaas API Key
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
};

type Variables = {
  supabase: SupabaseClient;
  userId?: string; // Optional userId from auth middleware
};

const asaas = new Hono<{ Bindings: Bindings, Variables: Variables }>();

// Middleware to get user from Supabase session if available
asaas.use('*', async (c, next) => {
  const supabase = c.get('supabase');
  const authHeader = c.req.header('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error) {
      console.error('Supabase auth error in asaas middleware:', error);
    }
    if (user) {
      c.set('userId', user.id);
    }
  }
  await next();
});

// Schema for creating a subscription
const CreateSubscriptionSchema = z.object({
  plan_name: z.string(),
  amount: z.number(),
  asaas_plan_id: z.string(), // Asaas product/plan ID
  funnel_response_id: z.string().uuid().optional(), // Link to funnel response
});

// Endpoint to create an Asaas subscription and return checkout URL
asaas.post(
  '/create-subscription',
  zValidator('json', CreateSubscriptionSchema),
  async (c) => {
    const { plan_name, amount, asaas_plan_id, funnel_response_id } = c.req.valid('json');
    const userId = c.get('userId');
    const supabase = c.get('supabase');
    const asaasApiKey = c.env.ASAAS_API_KEY;

    if (!userId) {
      return c.json({ error: 'User not authenticated' }, 401);
    }

    try {
      // 1. Get or Create Asaas Customer
      let asaasCustomerId: string | null = null;
      const { data: existingProfile, error: profileError } = await supabase
        .from('profiles')
        .select('asaas_customer_id')
        .eq('id', userId)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error fetching profile for Asaas customer ID:', profileError);
        return c.json({ error: 'Failed to fetch user profile' }, 500);
      }

      if (existingProfile?.asaas_customer_id) {
        asaasCustomerId = existingProfile.asaas_customer_id;
      } else {
        // Fetch user email and name to create Asaas customer
        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
        if (userError || !userData.user) {
          console.error('Error fetching user data for Asaas customer creation:', userError);
          return c.json({ error: 'Failed to fetch user data for Asaas' }, 500);
        }
        const userEmail = userData.user.email;
        const userName = userData.user.user_metadata.first_name || userEmail?.split('@')[0];

        const asaasCustomerResponse = await fetch('https://api.asaas.com/v3/customers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'access_token': asaasApiKey,
          },
          body: JSON.stringify({
            name: userName,
            email: userEmail,
            // You might want to add CPF/CNPJ, phone, address here if collected in funnel
          }),
        });

        if (!asaasCustomerResponse.ok) {
          const errorData = await asaasCustomerResponse.json();
          console.error('Asaas customer creation failed:', errorData);
          return c.json({ error: 'Failed to create Asaas customer', details: errorData }, 500);
        }
        const newAsaasCustomer = await asaasCustomerResponse.json();
        asaasCustomerId = newAsaasCustomer.id;

        // Update profile with Asaas customer ID
        await supabase
          .from('profiles')
          .update({ asaas_customer_id: asaasCustomerId, updated_at: new Date().toISOString() })
          .eq('id', userId);
      }

      // 2. Create Subscription in Asaas
      const subscriptionPayload = {
        customer: asaasCustomerId,
        billingType: 'CREDIT_CARD', // Or 'BOLETO', 'PIX' - depends on your setup
        value: amount,
        nextDueDate: new Date().toISOString().split('T')[0], // Start today
        cycle: 'MONTHLY', // Or 'WEEKLY', 'QUARTERLY', 'SEMIANNUALLY', 'YEARLY'
        description: `Assinatura do plano: ${plan_name}`,
        externalReference: userId, // Link to your internal user ID
        // You can add more details like discount, fine, interest, etc.
      };

      const asaasSubscriptionResponse = await fetch('https://api.asaas.com/v3/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access_token': asaasApiKey,
        },
        body: JSON.stringify(subscriptionPayload),
      });

      if (!asaasSubscriptionResponse.ok) {
        const errorData = await asaasSubscriptionResponse.json();
        console.error('Asaas subscription creation failed:', errorData);
        return c.json({ error: 'Failed to create Asaas subscription', details: errorData }, 500);
      }
      const newAsaasSubscription = await asaasSubscriptionResponse.json();

      // 3. Save subscription details to your Supabase 'subscriptions' table
      const { data: newSubscription, error: dbInsertError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          asaas_subscription_id: newAsaasSubscription.id,
          plan_name: plan_name,
          amount: amount,
          status: 'pending', // Will be updated to 'active' by webhook
          next_due_date: newAsaasSubscription.nextDueDate,
          // You might want to link to funnel_response_id here as well
        })
        .select()
        .single();

      if (dbInsertError) {
        console.error('Error saving subscription to DB:', dbInsertError);
        return c.json({ error: 'Failed to save subscription details' }, 500);
      }

      // 4. Get checkout URL for the first invoice of the subscription
      const firstInvoiceId = newAsaasSubscription.invoiceId; // Asaas returns invoiceId with subscription
      if (!firstInvoiceId) {
        console.error('No invoice ID returned for new subscription');
        return c.json({ error: 'Failed to get invoice for checkout' }, 500);
      }

      const checkoutUrl = `https://www.asaas.com/c/${firstInvoiceId}`; // Asaas checkout URL format

      return c.json({ checkoutUrl, subscriptionId: newSubscription.id }, 200);

    } catch (error) {
      console.error('Error in create-subscription endpoint:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  }
);

// Endpoint for Asaas Webhook notifications
asaas.post('/webhook', async (c) => {
  const asaasApiKey = c.env.ASAAS_API_KEY;
  const supabase = c.get('supabase');
  const payload = await c.req.json();

  // Basic webhook verification (Asaas recommends checking the event type and payload)
  // For production, you should implement a more robust verification, e.g., checking a signature if Asaas provides one.
  // For now, we'll just check if it's a payment or subscription event.

  console.log('Asaas Webhook received:', payload);

  try {
    if (payload.event === 'PAYMENT_RECEIVED' || payload.event === 'PAYMENT_CONFIRMED') {
      const payment = payload.payment;
      const subscriptionId = payment.subscription; // Asaas subscription ID

      if (subscriptionId) {
        // Find your internal subscription record by asaas_subscription_id
        const { data: dbSubscription, error: fetchError } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('asaas_subscription_id', subscriptionId)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          console.error('Error fetching internal subscription for webhook:', fetchError);
          return c.json({ message: 'Error processing webhook', details: fetchError.message }, 500);
        }

        if (dbSubscription) {
          // Update internal subscription status
          const { error: updateError } = await supabase
            .from('subscriptions')
            .update({
              status: 'active', // Or 'paid', depending on your desired state
              next_due_date: payment.dueDate, // Update next due date from Asaas
              updated_at: new Date().toISOString(),
            })
            .eq('id', dbSubscription.id);

          if (updateError) {
            console.error('Error updating internal subscription status:', updateError);
            return c.json({ message: 'Error updating subscription status', details: updateError.message }, 500);
          }
          console.log(`Subscription ${dbSubscription.id} updated to active.`);
        } else {
          console.warn(`No internal subscription found for Asaas ID: ${subscriptionId}`);
        }
      }
    } else if (payload.event === 'SUBSCRIPTION_CANCELED') {
      const subscription = payload.subscription;
      const subscriptionId = subscription.id; // Asaas subscription ID

      if (subscriptionId) {
        const { data: dbSubscription, error: fetchError } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('asaas_subscription_id', subscriptionId)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          console.error('Error fetching internal subscription for webhook cancellation:', fetchError);
          return c.json({ message: 'Error processing webhook', details: fetchError.message }, 500);
        }

        if (dbSubscription) {
          const { error: updateError } = await supabase
            .from('subscriptions')
            .update({
              status: 'canceled',
              updated_at: new Date().toISOString(),
            })
            .eq('id', dbSubscription.id);

          if (updateError) {
            console.error('Error updating internal subscription status to canceled:', updateError);
            return c.json({ message: 'Error updating subscription status to canceled', details: updateError.message }, 500);
          }
          console.log(`Subscription ${dbSubscription.id} updated to canceled.`);
        } else {
          console.warn(`No internal subscription found for Asaas ID: ${subscriptionId} for cancellation.`);
        }
      }
    }
    // Handle other Asaas events as needed (e.g., PAYMENT_OVERDUE, PAYMENT_REFUNDED, etc.)

    return c.json({ message: 'Webhook received and processed' }, 200);
  } catch (error) {
    console.error('Error processing Asaas webhook:', error);
    return c.json({ error: 'Internal server error processing webhook' }, 500);
  }
});

export default asaas;