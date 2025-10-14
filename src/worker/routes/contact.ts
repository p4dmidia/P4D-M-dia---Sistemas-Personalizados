import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { SupabaseClient } from '@supabase/supabase-js';
import { Resend } from 'npm:resend'; // Removido o sufixo de versão para usar a versão do package.json

// Define o schema para validação dos dados do formulário de contato
const ContactFormSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  company: z.string().optional(),
  message: z.string().min(1, 'Mensagem é obrigatória'),
  recipientEmail: z.string().email(), // O email para onde a mensagem será enviada
});

type Bindings = {
  RESEND_API_KEY: string; // Adicionado a chave da API do Resend
};

type Variables = {
  supabase: SupabaseClient;
  supabaseAdmin: SupabaseClient;
  userId?: string;
  userRole?: string;
};

const contact = new Hono<{ Bindings: Bindings, Variables: Variables }>();

contact.post(
  '/',
  zValidator('json', ContactFormSchema),
  async (c) => {
    const { name, email, phone, company, message, recipientEmail } = c.req.valid('json');

    const resendApiKey = c.env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.error('RESEND_API_KEY não está configurada.');
      return c.json({ error: 'Serviço de e-mail não configurado' }, 500);
    }

    const resend = new Resend(resendApiKey);

    try {
      const { data, error } = await resend.emails.send({
        from: 'P4D Mídia <onboarding@resend.dev>', // IMPORTANTE: Substitua por um e-mail verificado no Resend!
        to: [recipientEmail],
        subject: `Nova Mensagem de Contato de ${name} - P4D Mídia`,
        html: `
          <p><strong>Nome:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Telefone:</strong> ${phone || 'N/A'}</p>
          <p><strong>Empresa:</strong> ${company || 'N/A'}</p>
          <p><strong>Mensagem:</strong></p>
          <p>${message.replace(/\n/g, '<br>')}</p>
        `,
      });

      if (error) {
        console.error('Falha ao enviar e-mail com Resend:', error);
        return c.json({ error: 'Falha ao enviar e-mail', details: error.message }, 500);
      }

      console.log('E-mail enviado com sucesso via Resend:', data);
      return c.json({ message: 'Mensagem enviada com sucesso!' }, 200);
    } catch (error) {
      console.error('Erro inesperado ao enviar e-mail:', error);
      return c.json({ error: 'Erro interno do servidor ao enviar e-mail' }, 500);
    }
  }
);

export default contact;