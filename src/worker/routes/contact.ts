import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

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
  // Se você for usar um serviço de e-mail real (ex: SendGrid, Mailgun),
  // a chave da API seria configurada aqui nas variáveis de ambiente do worker.
  // Ex: EMAIL_SERVICE_API_KEY?: string;
};

const contact = new Hono<{ Bindings: Bindings }>();

contact.post(
  '/',
  zValidator('json', ContactFormSchema),
  async (c) => {
    const { name, email, phone, company, message, recipientEmail } = c.req.valid('json');

    // Em uma aplicação real, você integraria com um serviço de envio de e-mail aqui.
    // Por enquanto, vamos apenas registrar o conteúdo do e-mail no console do worker.
    console.log('--- NOVA SUBMISSÃO DE FORMULÁRIO DE CONTATO ---');
    console.log(`Destinatário: ${recipientEmail}`);
    console.log(`De: ${name} <${email}>`);
    console.log(`Telefone: ${phone || 'N/A'}`);
    console.log(`Empresa: ${company || 'N/A'}`);
    console.log(`Mensagem:\n${message}`);
    console.log('-----------------------------------------------');

    // Exemplo conceitual de como você faria uma chamada a um serviço de e-mail externo:
    /*
    const emailServiceApiKey = c.env.EMAIL_SERVICE_API_KEY;
    if (!emailServiceApiKey) {
      console.error('EMAIL_SERVICE_API_KEY não está configurada.');
      return c.json({ error: 'Serviço de e-mail não configurado' }, 500);
    }

    const sendEmailResponse = await fetch('https://api.emailservice.com/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${emailServiceApiKey}`,
      },
      body: JSON.stringify({
        to: recipientEmail,
        from: 'noreply@seusite.com', // Substitua pelo seu e-mail de remetente verificado
        subject: `Nova Mensagem de Contato de ${name}`,
        text: `Nome: ${name}\nEmail: ${email}\nTelefone: ${phone || 'N/A'}\nEmpresa: ${company || 'N/A'}\nMensagem:\n${message}`,
        html: `<p><strong>Nome:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p><strong>Telefone:</strong> ${phone || 'N/A'}</p><p><strong>Empresa:</strong> ${company || 'N/A'}</p><p><strong>Mensagem:</strong></p><p>${message.replace(/\n/g, '<br>')}</p>`,
      }),
    });

    if (!sendEmailResponse.ok) {
      const errorData = await sendEmailResponse.json();
      console.error('Falha ao enviar e-mail:', errorData);
      return c.json({ error: 'Falha ao enviar e-mail', details: errorData }, 500);
    }
    */

    return c.json({ message: 'Mensagem enviada com sucesso!' }, 200);
  }
);

export default contact;