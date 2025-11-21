# Deploy na Vercel

## ✅ Configuração Corrigida

O erro do Cloudflare foi resolvido! O build agora usa apenas o Vite puro sem dependências do Cloudflare.

## Configuração

### 1. Variáveis de Ambiente ⚠️ IMPORTANTE
**NÃO use o símbolo @ nas variáveis!** Configure diretamente os valores:

No painel da Vercel, vá em Settings → Environment Variables e adicione:

- `VITE_SUPABASE_URL`: `https://vmhqgniynjkiyuuqfdzb.supabase.co`
- `VITE_SUPABASE_ANON_KEY`: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtaHFnbml5bmpraXl1dXFmZHpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2ODI4MTIsImV4cCI6MjA3OTI1ODgxMn0.Vh-39UY-LwJiXbt3Ip6INledlB-A3bF_IXcuRQmp7LY`
- `VITE_STRIPE_PUBLIC_KEY`: `pk_live_51RinlxJ3MwT8QUClSzFDP118N8DJqQXm0MQrM2qUyqBCCartnZ3hEjbii8GYWU6REaprd4obtBk8FZcwFORLxUqs00ZMmfWLvS`

**❌ ERRADO**: Usar `@vite_supabase_url` (com @)
**✅ CERTO**: Colocar o valor direto (sem @)

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