# Deploy na Vercel

## ✅ Configuração Corrigida

O erro do Cloudflare foi resolvido! O build agora usa apenas o Vite puro sem dependências do Cloudflare.

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
- Build output: `dist/client`
- Configuração limpa: Sem Cloudflare Workers

### 4. Rotas
- SPA: Todas as rotas são redirecionadas para `index.html`
- Frontend apenas: APIs serão tratadas separadamente

## Arquivos de Configuração

- `vercel.json` - Configuração do Vercel
- `vite.config.prod.ts` - Configuração limpa do Vite para produção
- `.env.example` - Exemplo de variáveis de ambiente

## Build Testado ✅

O build foi testado localmente e funcionou sem erros:
```
vite v7.1.9 building for production...
✓ 1752 modules transformed.
dist/client/assets/...
✓ built in 5.55s
```

## Notas Importantes

1. **Frontend Only**: Este deploy é apenas para o frontend React
2. **Backend**: O backend original em Cloudflare Workers deve ser mantido separado
3. **Supabase**: Certifique-se de configurar as políticas RLS no Supabase para produção
4. **APIs**: Configure CORS no Supabase para aceitar requisições do domínio Vercel

## Deploy

1. Conecte seu repositório no painel da Vercel
2. Configure as variáveis de ambiente
3. O build será executado automaticamente