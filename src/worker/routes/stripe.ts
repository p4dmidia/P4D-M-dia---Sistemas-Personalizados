import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { SupabaseClient } from '@supabase/supabase-js';
import Stripe from 'https://esm.sh/stripe@19.1.0?target=deno'; // Import Stripe via esm.sh

type Bindings = {
  STRIPE_SECRET_KEY: string; // Stripe Secret Key
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
};

type Variables = {
  supabase: SupabaseClient; // Anonymous client
  supabaseAdmin: SupabaseClient; // Admin client
  userId?: string; // Optional userId from auth middleware
};

const stripeRoute = new Hono<{ Bindings: Bindings, Variables: Variables }>();

// Middleware to get user from Supabase session if available
stripeRoute.use('*', async (c, next) => {
  const supabaseAdmin = c.get('supabaseAdmin'); // Use admin client to verify token
  const authHeader = c.req.header('Authorization');
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error) {
      console.error('Stripe Middleware: Supabase auth error:', error);
    }
    
    if (user) {
      c.set('userId', user.id);
    }
  }
  await next();
});

// Schema for creating a Stripe Checkout Session
const CreateCheckoutSessionSchema = z.object({
  plan_name: z.string(),
  stripe_price_id: z.string(), // Stripe Price ID
  funnel_response_id: z.string().uuid().nullable().optional(), // Link to funnel response
});

// Endpoint to create a Stripe Checkout Session
stripeRoute.post(
  '/create-checkout-session',
  zValidator('json', CreateCheckoutSessionSchema),
  async (c) => {
    const { plan_name, stripe_price_id, funnel_response_id } = c.req.valid('json');
    const userId = c.get('userId');
    const supabase = c.get('supabase'); // Anonymous client for DB operations
    const supabaseAdmin = c.get('supabaseAdmin'); // Admin client for auth.admin operations
    const stripeSecretKey = c.env.STRIPE_SECRET_KEY;

    if (!stripeSecretKey) {
      console.error('STRIPE_SECRET_KEY is not defined in worker environment variables.');
      return c.json({ error: 'Stripe API key is missing in server configuration.' }, 500);
    }

    if (!userId) {
      console.error('Stripe: User not authenticated for checkout session creation.');
      return c.json({ error: 'User not authenticated' }, 401);
    }

    try {
      const stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2024-06-20',
        httpClient: Stripe.HonoFetchHttpClient,
      });

      // 1. Get or Create Stripe Customer
      let stripeCustomerId: string | null = null;
      const { data: existingProfile, error: profileError } = await supabase
        .from('profiles')
        .select('stripe_customer_id')
        .eq('id', userId)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Stripe: Error fetching profile for Stripe customer ID:', profileError);
        return c.json({ error: 'Failed to fetch user profile' }, 500);
      }

      if (existingProfile?.stripe_customer_id) {
        stripeCustomerId = existingProfile.stripe_customer_id;
        console.log('Stripe: Existing Stripe customer found:', stripeCustomerId);
      } else {
        // Fetch user email and name to create Stripe customer using the ADMIN client
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
        
        if (userError) {
          console.error('Stripe: Error fetching user data with service role client:', userError);
          return c.json({ error: `Failed to fetch user data for Stripe: ${userError.message}` }, 500);
        }
        if (!userData.user) {
          console.error('Stripe: No user data returned from service role client for userId:', userId);
          return c.json({ error: 'Failed to fetch user data for Stripe: User not found or invalid response' }, 500);
        }
        
        const userEmail = userData.user.email;
        const userName = userData.user.user_metadata.first_name || userEmail?.split('@')[0];

        console.log('Stripe: Attempting to create Stripe customer with:', { name: userName, email: userEmail });

        const customer = await stripe.customers.create({
          email: userEmail,
          name: userName,
          metadata: { supabase_user_id: userId },
        });
        stripeCustomerId = customer.id;
        console.log('Stripe: Customer created successfully:', stripeCustomerId);

        // Update profile with Stripe customer ID using the ANON client (as profiles table has RLS)
        const { error: updateProfileError } = await supabase
          .from('profiles')
          .update({ stripe_customer_id: stripeCustomerId, updated_at: new Date().toISOString() })
          .eq('id', userId);
        
        if (updateProfileError) {
          console.error('Stripe: Error updating user profile with Stripe customer ID:', updateProfileError);
          // Don't block the entire flow, but log the error
        }
      }

      // 2. Create a pending subscription in your Supabase 'subscriptions' table
      // This will be updated to 'active' by the webhook after successful payment
      const { data: newSubscription, error: dbInsertError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          plan_name: plan_name,
          amount: 0, // Amount will be updated by webhook
          status: 'pending',
          stripe_price_id: stripe_price_id, // Store Stripe Price ID
          funnel_response_id: funnel_response_id,
        })
        .select()
        .single();

      if (dbInsertError) {
        console.error('Stripe: Error saving pending subscription to DB:', dbInsertError);
        return c.json({ error: 'Failed to save pending subscription details' }, 500);
      }
      console.log('Stripe: Pending subscription saved to Supabase:', newSubscription.id);

      // 3. Create Stripe Checkout Session
      const checkoutSession = await stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        mode: 'subscription',
        line_items: [
          {
            price: stripe_price_id,
            quantity: 1,
          },
        ],
        success_url: `${c.req.url.split('/api')[0]}/dashboard?success=true`, // Redirect to dashboard on success
        cancel_url: `${c.req.url.split('/api')[0]}/funnel/summary?canceled=true`, // Redirect to funnel summary on cancel
        metadata: {
          supabase_user_id: userId,
          supabase_subscription_id: newSubscription.id, // Pass your internal subscription ID
          funnel_response_id: funnel_response_id || '', // Pass funnel ID if available
        },
        subscription_data: {
          metadata: {
            supabase_user_id: userId,
            supabase_subscription_id: newSubscription.id,
          },
        },
      });

      if (!checkoutSession.url) {
        console.error('Stripe: Checkout session URL not returned.');
        return c.json({ error: 'Failed to create Stripe checkout session URL' }, 500);
      }

      return c.json({ checkoutUrl: checkoutSession.url }, 200);

    } catch (error) {
      console.error('Stripe: Error in create-checkout-session endpoint:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  }
);

// Schema for creating a Customer Portal Session
const CreateCustomerPortalSessionSchema = z.object({
  customer_id: z.string(),
  return_url: z.string().url(),
});

// Endpoint to create a Stripe Customer Portal Session
stripeRoute.post(
  '/create-customer-portal-session',
  zValidator('json', CreateCustomerPortalSessionSchema),
  async (c) => {
    const { customer_id, return_url } = c.req.valid('json');
    const userId = c.get('userId');
    const supabase = c.get('supabase');
    const stripeSecretKey = c.env.STRIPE_SECRET_KEY;

    if (!stripeSecretKey) {
      console.error('STRIPE_SECRET_KEY is not defined.');
      return c.json({ error: 'Stripe API key is missing.' }, 500);
    }
    if (!userId) {
      return c.json({ error: 'User not authenticated' }, 401);
    }

    try {
      const stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2024-06-20',
        httpClient: Stripe.HonoFetchHttpClient,
      });

      // Verify that the customer_id belongs to the authenticated user
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('stripe_customer_id')
        .eq('id', userId)
        .single();

      if (profileError || profile?.stripe_customer_id !== customer_id) {
        console.error('Stripe: Unauthorized attempt to access customer portal for different customer_id.');
        return c.json({ error: 'Unauthorized access to customer portal' }, 403);
      }

      const portalSession = await stripe.billingPortal.sessions.create({
        customer: customer_id,
        return_url: return_url,
      });

      return c.json({ portalUrl: portalSession.url }, 200);

    } catch (error) {
      console.error('Stripe: Error creating customer portal session:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  }
);

// Schema for canceling a Stripe Subscription
const CancelSubscriptionSchema = z.object({
  stripe_subscription_id: z.string(),
});

// Endpoint to cancel a Stripe Subscription
stripeRoute.post(
  '/cancel-subscription',
  zValidator('json', CancelSubscriptionSchema),
  async (c) => {
    const { stripe_subscription_id } = c.req.valid('json');
    const userId = c.get('userId');
    const supabase = c.get('supabase');
    const stripeSecretKey = c.env.STRIPE_SECRET_KEY;

    if (!stripeSecretKey) {
      console.error('STRIPE_SECRET_KEY is not defined.');
      return c.json({ error: 'Stripe API key is missing.' }, 500);
    }
    if (!userId) {
      return c.json({ error: 'User not authenticated' }, 401);
    }

    try {
      const stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2024-06-20',
        httpClient: Stripe.HonoFetchHttpClient,
      });

      // Verify that the subscription belongs to the authenticated user
      const { data: subscription, error: subError } = await supabase
        .from('subscriptions')
        .select('id, user_id, stripe_subscription_id')
        .eq('user_id', userId)
        .eq('stripe_subscription_id', stripe_subscription_id)
        .single();

      if (subError || !subscription) {
        console.error('Stripe: Unauthorized attempt to cancel subscription or subscription not found.');
        return c.json({ error: 'Subscription not found or unauthorized' }, 403);
      }

      const canceledSubscription = await stripe.subscriptions.cancel(stripe_subscription_id);

      // The webhook will handle updating the status in Supabase,
      // but we can return a success message immediately.
      return c.json({ message: 'Subscription cancellation initiated', status: canceledSubscription.status }, 200);

    } catch (error) {
      console.error('Stripe: Error canceling subscription:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  }
);

export default stripeRoute;