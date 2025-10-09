import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { SupabaseClient } from '@supabase/supabase-js';

type Bindings = {
  ASAAS_API_KEY: string; // Asaas API Key
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string; // Adicione a chave de service role aqui
};

type Variables = {
  supabase: SupabaseClient; // Cliente anônimo
  supabaseAdmin: SupabaseClient; // Cliente admin
  userId?: string; // Optional userId from auth middleware
};

const asaas = new Hono<{ Bindings: Bindings, Variables: Variables }>();

// Middleware to get user from Supabase session if available
asaas.use('*', async (c, next) => {
  const supabaseAdmin = c.get('supabaseAdmin'); // Use o cliente admin para verificar o token
  const authHeader = c.req.header('Authorization');
  
  console.log('ASAAS Middleware: Authorization Header:', authHeader); // Log header

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    console.log('ASAAS Middleware: Token:', token); // Log token

    // Use the admin client to get the user from the token
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error) {
      console.error('ASAAS Middleware: Supabase auth error:', error);
    }
    
    console.log('ASAAS Middleware: User from token:', user); // Log user object

    if (user) {
      c.set('userId', user.id);
      console.log('ASAAS Middleware: userId set:', user.id);
    } else {
      console.log('ASAAS Middleware: User not found for token.');
    }
  } else {
    console.log('ASAAS Middleware: No valid Authorization header found.');
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
    const supabase = c.get('supabase'); // Cliente anônimo para operações de DB com RLS
    const supabaseAdmin = c.get('supabaseAdmin'); // Cliente admin para operações auth.admin
    const asaasApiKey = c.env.ASAAS_API_KEY;

    // --- Adição de verificação da chave Asaas ---
    if (!asaasApiKey) {
      console.error('ASAAS_API_KEY não está definida nas variáveis de ambiente do worker.');
      return c.json({ error: 'Chave da API Asaas está faltando na configuração do servidor.' }, 500);
    }
    // --- NOVO LOG AQUI ---
    console.log('ASAAS: Chave da API Asaas sendo usada (primeiros 10 caracteres):', asaasApiKey.substring(0, 10) + '...');
    // --- Fim do NOVO LOG ---

    if (!userId) {
      console.error('ASAAS: Usuário não autenticado para criação de assinatura.');
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
        console.error('ASAAS: Erro ao buscar perfil para Asaas customer ID:', profileError);
        return c.json({ error: 'Failed to fetch user profile' }, 500);
      }

      if (existingProfile?.asaas_customer_id) {
        asaasCustomerId = existingProfile.asaas_customer_id;
        console.log(`ASAAS: Cliente Asaas existente encontrado: ${asaasCustomerId}`);
      } else {
        // Fetch user email and name to create Asaas customer using the ADMIN client
        console.log(`ASAAS: Tentando buscar dados do usuário para userId: ${userId} usando cliente admin.`);
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
        
        if (userError) {
          console.error('ASAAS: Erro ao buscar dados do usuário com cliente de service role:', userError);
          return c.json({ error: `Failed to fetch user data for Asaas: ${userError.message}` }, 500);
        }
        if (!userData.user) {
          console.error('ASAAS: Nenhum dado de usuário retornado do cliente de service role para userId:', userId);
          return c.json({ error: 'Failed to fetch user data for Asaas: User not found or invalid response' }, 500);
        }
        
        const userEmail = userData.user.email;
        const userName = userData.user.user_metadata.first_name || userEmail?.split('@')[0];
        console.log(`ASAAS: Dados do usuário buscados. Email: ${userEmail}, Nome: ${userName}`);

        console.log('ASAAS: Criando cliente Asaas...');
        const asaasCustomerResponse = await fetch('https://api.asaas.com/v3/customers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'access_token': asaasApiKey,
          },
          body: JSON.stringify({
            name: userName,
            email: userEmail,
            // Você pode adicionar CPF/CNPJ, telefone, endereço aqui se coletado no funil
          }),
        });

        if (!asaasCustomerResponse.ok) {
          const errorData = await asaasCustomerResponse.json();
          console.error('ASAAS: Falha na criação do cliente Asaas:', errorData);
          return c.json({ error: 'Failed to create Asaas customer', details: errorData }, 500);
        }
        const newAsaasCustomer = await asaasCustomerResponse.json();
        asaasCustomerId = newAsaasCustomer.id;
        console.log(`ASAAS: Cliente Asaas criado com ID: ${asaasCustomerId}`);

        // Update profile with Asaas customer ID using the ANON client (as profiles table has RLS)
        const { error: updateProfileError } = await supabase
          .from('profiles')
          .update({ asaas_customer_id: asaasCustomerId, updated_at: new Date().toISOString() })
          .eq('id', userId);
        
        if (updateProfileError) {
          console.error('ASAAS: Erro ao atualizar perfil do usuário com Asaas customer ID:', updateProfileError);
          // Não bloqueie o fluxo inteiro, mas registre o erro
        }
      }
      console.log(`ASAAS: Usando Asaas customer ID: ${asaasCustomerId}`);

      // 2. Create Subscription in Asaas
      const subscriptionPayload = {
        customer: asaasCustomerId,
        billingType: 'CREDIT_CARD', // Ou 'BOLETO', 'PIX' - depende da sua configuração
        value: amount,
        nextDueDate: new Date().toISOString().split('T')[0], // Começa hoje
        cycle: 'MONTHLY', // Ou 'WEEKLY', 'QUARTERLY', 'SEMIANNUALLY', 'YEARLY'
        description: `Assinatura do plano: ${plan_name}`,
        externalReference: userId, // Link para seu ID de usuário interno
        // Você pode adicionar mais detalhes como desconto, multa, juros, etc.
      };
      console.log('ASAAS: Criando assinatura com payload:', subscriptionPayload);

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
        console.error('ASAAS: Falha na criação da assinatura Asaas:', errorData);
        return c.json({ error: 'Failed to create Asaas subscription', details: errorData }, 500);
      }
      const newAsaasSubscription = await asaasSubscriptionResponse.json();
      console.log('ASAAS: Assinatura Asaas criada:', newAsaasSubscription);

      // 3. Save subscription details to your Supabase 'subscriptions' table using the ANON client
      const { data: newSubscription, error: dbInsertError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          asaas_subscription_id: newAsaasSubscription.id,
          plan_name: plan_name,
          amount: amount,
          status: 'pending', // Será atualizado para 'active' pelo webhook
          next_due_date: newAsaasSubscription.nextDueDate,
          funnel_response_id: funnel_response_id, // Link para a resposta do funil
        })
        .select()
        .single();

      if (dbInsertError) {
        console.error('ASAAS: Erro ao salvar assinatura no DB:', dbInsertError);
        return c.json({ error: 'Failed to save subscription details' }, 500);
      }
      console.log('ASAAS: Assinatura salva no DB:', newSubscription);

      // 4. Get checkout URL for the first invoice of the subscription
      const firstInvoiceId = newAsaasSubscription.invoiceId; // Asaas retorna invoiceId com assinatura
      if (!firstInvoiceId) {
        console.error('ASAAS: Nenhum ID de fatura retornado para a nova assinatura');
        return c.json({ error: 'Failed to get invoice for checkout' }, 500);
      }

      const checkoutUrl = `https://www.asaas.com/c/${firstInvoiceId}`; // Formato da URL de checkout Asaas
      console.log('ASAAS: URL de checkout gerada:', checkoutUrl);

      return c.json({ checkoutUrl, subscriptionId: newSubscription.id }, 200);

    } catch (error) {
      console.error('ASAAS: Erro no endpoint create-subscription:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  }
);

// Endpoint for Asaas Webhook notifications
asaas.post('/webhook', async (c) => {
  const asaasApiKey = c.env.ASAAS_API_KEY;
  const supabase = c.get('supabase'); // Use anon client for DB operations
  const payload = await c.req.json();

  // Basic webhook verification (Asaas recommends checking the event type and payload)
  // For production, you should implement a more robust verification, e.g., checking a signature if Asaas provides one.
  // For now, we'll just check if it's a payment or subscription event.

  console.log('Asaas Webhook recebido:', payload);

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
          console.error('ASAAS Webhook: Erro ao buscar assinatura interna:', fetchError);
          return c.json({ message: 'Error processing webhook', details: fetchError.message }, 500);
        }

        if (dbSubscription) {
          // Update internal subscription status
          const { error: updateError } = await supabase
            .from('subscriptions')
            .update({
              status: 'active', // Ou 'paid', dependendo do seu estado desejado
              next_due_date: payment.dueDate, // Atualiza a próxima data de vencimento do Asaas
              updated_at: new Date().toISOString(),
            })
            .eq('id', dbSubscription.id);

          if (updateError) {
            console.error('ASAAS Webhook: Erro ao atualizar status da assinatura interna:', updateError);
            return c.json({ message: 'Error updating subscription status', details: updateError.message }, 500);
          }
          console.log(`ASAAS Webhook: Assinatura ${dbSubscription.id} atualizada para ativa.`);
        } else {
          console.warn(`ASAAS Webhook: Nenhuma assinatura interna encontrada para o ID Asaas: ${subscriptionId}`);
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
          console.error('ASAAS Webhook: Erro ao buscar assinatura interna para cancelamento:', fetchError);
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
            console.error('ASAAS Webhook: Erro ao atualizar status da assinatura interna para cancelada:', updateError);
            return c.json({ message: 'Error updating subscription status to canceled', details: updateError.message }, 500);
          }
          console.log(`ASAAS Webhook: Assinatura ${dbSubscription.id} atualizada para cancelada.`);
        } else {
          console.warn(`ASAAS Webhook: Nenhuma assinatura interna encontrada para o ID Asaas: ${subscriptionId} para cancelamento.`);
        }
      }
    }
    // Lide com outros eventos Asaas conforme necessário (ex: PAYMENT_OVERDUE, PAYMENT_REFUNDED, etc.)

    return c.json({ message: 'Webhook recebido e processado' }, 200);
  } catch (error) {
    console.error('ASAAS Webhook: Erro ao processar webhook Asaas:', error);
    return c.json({ error: 'Internal server error processing webhook' }, 500);
  }
});

export default asaas;