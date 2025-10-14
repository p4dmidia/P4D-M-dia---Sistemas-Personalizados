import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { Resend } from 'resend';

type Bindings = {
  RESEND_API_KEY: string; // Resend API key
};

type Variables = {};

const contact = new Hono<{ Bindings: Bindings, Variables: Variables }>();

// Define o schema para validação do formulário de contato
const ContactFormSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  message: z.string().min(1, "Mensagem é obrigatória"),
});

// Cabeçalhos CORS para permitir requisições do frontend
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Lida com requisições OPTIONS (preflight)
contact.options('/', (c) => {
  return c.json({}, 200, corsHeaders);
});

// Rota POST para enviar mensagens de contato
contact.post(
  '/',
  zValidator('json', ContactFormSchema),
  async (c) => {
    const { name, email, message } = c.req.valid('json');
    const resendApiKey = c.env.RESEND_API_KEY;

    if (!resendApiKey) {
      console.error('RESEND_API_KEY não está configurada.');
      return c.json({ error: 'Erro de configuração do servidor: RESEND_API_KEY ausente.' }, 500, corsHeaders);
    }

    const resend = new Resend(resendApiKey);

    try {
      // Envia o email usando o Resend
      const { data, error } = await resend.emails.send({
        from: 'P4D Mídia <onboarding@p4dmidia.com>', // Substitua pelo seu domínio de remetente verificado
        to: 'contato@p4dmidia.com.br', // Substitua pelo email do destinatário real
        subject: `Nova Mensagem de Contato de ${name}`,
        html: `
          <p><strong>Nome:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Mensagem:</strong></p>
          <p>${message}</p>
        `,
      });

      if (error) {
        console.error('Erro ao enviar email com Resend:', error);
        return c.json({ error: error.message || 'Falha ao enviar email' }, 500, corsHeaders);
      }

      console.log('Email enviado com sucesso:', data);
      return c.json({ message: 'Mensagem enviada com sucesso!' }, 200, corsHeaders);
    } catch (error) {
      console.error('Erro ao enviar email de contato:', error);
      return c.json({ error: 'Erro interno do servidor' }, 500, corsHeaders);
    }
  }
);

export default contact;