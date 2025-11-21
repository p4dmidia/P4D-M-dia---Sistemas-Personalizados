# Deploy na Vercel

## Configuração

### 1. Variáveis de Ambiente
Configure as seguintes variáveis no painel da Vercel:

- `vite_supabase_url`: URL do seu projeto Supabase
- `vite_supabase_anon_key`: Chave anônima do Supabase
- `vite_stripe_public_key`: Chave pública do Stripe (se usar pagamentos)

### 2. Build
O projeto usa Vite com React. O comando de build é:
```bash
npm run build:vercel
```

### 3. Estrutura
- Frontend: React + TypeScript + Vite
- Backend: Cloudflare Workers (será adaptado para Vercel Functions)
- Build output: `dist/client`

### 4. Rotas
- SPA: Todas as rotas são redirecionadas para `index.html`
- API: Rotas `/api/*` serão processadas por Vercel Functions

## Notas Importantes

1. **Backend**: Este projeto foi originalmente configurado para Cloudflare Workers. Para deploy na Vercel, você pode:
   - Usar Vercel Functions (recomendado)
   - Manter Cloudflare Workers como backend separado
   - Migrar para serverless functions da Vercel

2. **Supabase**: Certifique-se de configurar as políticas RLS no Supabase para produção

3. **Stripe**: Configure os webhooks apropriados para o ambiente de produção