# Personal IA

MVP full-stack de um personal trainer virtual com IA para usuarios comuns de academia. O app gera treino inicial, acompanha evolucao, oferece chat com IA e diferencia experiencias Gratuito e Premium, sempre com postura educacional e sem diagnosticos medicos.

## Stack

- Frontend: React + Vite
- Backend: Node.js + NestJS
- Banco: PostgreSQL via Supabase
- ORM: Prisma
- IA: Gemini API com fallback mock
- Publicacao sugerida:
  - Frontend: Vercel
  - Backend: Render Free
  - Banco: Supabase Free

## Escolha de deploy

Para este projeto, a opcao mais simples de backend gratuito hoje e o Render.

- O Render ainda documenta web services gratuitos, com health checks, deploy por Git e suporte a monorepo.
- O Railway hoje opera com free trial e credito mensal pequeno, o que deixa o fluxo menos previsivel para um MVP publico.

## Estrutura

```text
apps/
  api/   -> NestJS + Prisma
  web/   -> React + Vite
packages/
  shared/ -> tipos compartilhados
render.yaml
```

## Funcionalidades do MVP

- Cadastro e login com JWT
- Onboarding com idade, sexo, peso, altura, objetivo, nivel, dias disponiveis e local de treino
- Geracao de treino com Gemini ou fallback mock
- Visualizacao do treino diario
- Guias visuais animados para exercicios com fallback local
- Marcacao de exercicios concluidos
- Registro de peso corporal
- Registro de cargas
- Historico de evolucao
- Chat com IA para adaptacoes e duvidas basicas
- Estrutura de monetizacao Gratuito e Premium
- Paginas publicas de politica de privacidade, termos de uso e contato

## Arquivos de producao

- `render.yaml`: configuracao do backend no Render
- `apps/web/vercel.json`: fallback SPA para Vercel
- `apps/api/src/modules/health/health.controller.ts`: endpoint `GET /health`
- `.env.example`: referencia geral
- `.env.development.example`: desenvolvimento
- `.env.production.example`: producao
- `STRIPE_SETUP.md`: passos exatos para ativar o Stripe real

## Variaveis de ambiente

### Obrigatorias

- `DATABASE_URL`: conexao PostgreSQL do Supabase
- `JWT_SECRET`: segredo do JWT
- `GEMINI_API_KEY`: chave da Gemini API
- `FRONTEND_URL`: URL publica do frontend
- `BACKEND_URL`: URL publica do backend
- `VITE_API_URL`: URL do backend consumida pelo frontend
- `CORS_ALLOWED_ORIGIN_PATTERNS`: padroes extras de origem liberada, como previews da Vercel
- `VITE_LEGAL_BUSINESS_NAME`: nome exibido nas paginas legais
- `VITE_CONTACT_EMAIL`: e-mail publico de suporte
- `VITE_CONTACT_PHONE`: telefone publico de atendimento
- `VITE_CONTACT_WHATSAPP`: WhatsApp publico de atendimento
- `VITE_CONTACT_INSTAGRAM`: perfil publico para relacionamento
- `VITE_CONTACT_ADDRESS`: endereco comercial exibido no site
- `VITE_CONTACT_SUPPORT_HOURS`: horario de atendimento exibido no site

### Backend

```env
NODE_ENV="production"
DATABASE_URL=postgresql://postgres.PROJECT_REF:PASSWORD@DB_REGION.pooler.supabase.com:5432/postgres
JWT_SECRET="strong-secret"
JWT_EXPIRES_IN="7d"
PORT=10000
FRONTEND_URL="https://your-frontend.vercel.app"
BACKEND_URL="https://your-backend.onrender.com"
CORS_ALLOWED_ORIGINS="https://your-frontend.vercel.app"
CORS_ALLOWED_ORIGIN_PATTERNS="https://*.vercel.app"
GEMINI_API_KEY=""
GEMINI_MODEL="gemini-2.5-flash"
PAYMENT_PROVIDER="mock"
STRIPE_SECRET_KEY=""
STRIPE_PRICE_ID_PREMIUM_MONTHLY=""
STRIPE_PRICE_ID_PREMIUM_3M=""
STRIPE_PRICE_ID_PREMIUM_6M=""
STRIPE_PRICE_ID_PREMIUM_12M=""
STRIPE_WEBHOOK_SECRET=""
```

### Frontend

```env
VITE_API_URL="https://your-backend.onrender.com"
VITE_LEGAL_BUSINESS_NAME="Personal IA"
VITE_CONTACT_EMAIL="suporte.novapride@gmail.com"
VITE_CONTACT_PHONE="(83) 9 9807-1877"
VITE_CONTACT_WHATSAPP="(83) 9 9807-1877"
VITE_CONTACT_INSTAGRAM="@personalia.app"
VITE_CONTACT_ADDRESS="Rua Exemplo, 123 - Cidade/UF"
VITE_CONTACT_SUPPORT_HOURS="Segunda a sexta, das 9h as 18h"
```

## Desenvolvimento local

1. Copie `.env.development.example` para `.env`.
2. Instale dependencias.
3. Gere o client Prisma.
4. Rode migrations e seed se quiser dados de teste.
5. Suba API e frontend.

```bash
npm install --legacy-peer-deps
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev:api
npm run dev:web
```

## Scripts uteis

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
npm --workspace apps/api run prisma:migrate:deploy
npm --workspace apps/api run build
npm --workspace apps/api run start:prod
npm --workspace apps/web run build
```

## Banco com Supabase

1. Crie um projeto no Supabase Free.
2. Pegue a connection string Postgres do pooler.
3. Configure `DATABASE_URL` com a URL real completa, sem colchetes, sem placeholders e sem aspas extras do painel.
4. Rode as migrations.
5. Rode o seed apenas se quiser uma conta demo.

### Migrations no Supabase

Para aplicar migrations manualmente a partir da sua maquina:

```bash
npm run db:generate
npm --workspace apps/api run prisma:migrate:deploy
```

### Seed opcional

```bash
npm run db:seed
```

### Observacao importante sobre Supabase

Este projeto usa Prisma com conexao direta ao Postgres, nao `supabase-js` nem Data API. Entao a mudanca recente de grants automaticos em novas tabelas do `public` schema nao afeta o funcionamento atual do app enquanto ele continuar acessando o banco pelo ORM.

Para reforcar a seguranca no Supabase e eliminar alertas do Security Advisor, as tabelas publicas do projeto tambem recebem RLS habilitado por migration, com revogacao de acesso direto para os papeis `anon` e `authenticated`. Isso nao interfere no backend atual, porque o app acessa o banco pelo servidor com Prisma.

## Publicar o frontend na Vercel

1. Faça push do repositorio para GitHub.
2. Na Vercel, crie um novo projeto apontando para este repositorio.
3. Defina `Root Directory` como `apps/web`.
4. Confirme que o framework detectado e `Vite`.
5. Configure a variavel `VITE_API_URL` com a URL publica do backend.
6. Deploy.

### Observacoes do frontend

- O app usa `BrowserRouter`, por isso o arquivo `apps/web/vercel.json` faz rewrite de qualquer rota para `index.html`.
- O frontend ja consome `VITE_API_URL` em `apps/web/src/lib/api.ts`.
- As rotas publicas `/privacidade`, `/termos` e `/contato` ficam acessiveis sem login.

## Publicar o backend no Render

1. Faça push do repositorio para GitHub.
2. No Render, crie um novo `Blueprint` ou `Web Service` a partir do repositorio.
3. Se usar Blueprint, o arquivo `render.yaml` ja deixa a base pronta.
4. Configure as variaveis:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `GEMINI_API_KEY`
   - `FRONTEND_URL`
   - `BACKEND_URL`
   - `CORS_ALLOWED_ORIGIN_PATTERNS`
   - `PAYMENT_PROVIDER`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_PRICE_ID_PREMIUM_MONTHLY`
   - `STRIPE_PRICE_ID_PREMIUM_3M`
   - `STRIPE_PRICE_ID_PREMIUM_6M`
   - `STRIPE_PRICE_ID_PREMIUM_12M`
   - `STRIPE_WEBHOOK_SECRET`
5. Faça o primeiro deploy.
6. Verifique `GET /health`.

### O que o backend ja esta pronto para fazer

- Build de producao com Prisma generate antes do TypeScript
- Start de producao com `npm --workspace apps/api run start:prod`
- Health check em `GET /health`
- CORS baseado em `FRONTEND_URL` e `CORS_ALLOWED_ORIGINS`
- Suporte a previews da Vercel via `CORS_ALLOWED_ORIGIN_PATTERNS` e inferencia automatica quando `FRONTEND_URL` usa `*.vercel.app`
- Compatibilidade com Render Free sem `preDeployCommand`
- Build do Render com `--include=dev` para garantir o Prisma CLI durante a compilacao
- Checkout recorrente com Stripe Checkout em `mode: subscription`
- Webhook publico em `POST /payments/stripe/webhook`
- Portal do cliente Stripe em `POST /billing/customer-portal`

### Migration no Render Free

Como o plano Free do Render nao aceita `preDeployCommand`, aplique a migration manualmente antes do primeiro deploy em producao:

```bash
npm --workspace apps/api run prisma:migrate:deploy
```

Depois disso, o serviço no Render pode subir normalmente com o `startCommand`.

## Credenciais demo

- Email: `demo@personalia.app`
- Senha: `123456`

## Endpoints principais

- `GET /health`
- `POST /auth/register`
- `POST /auth/login`
- `GET /billing/status`
- `POST /billing/checkout-session`
- `POST /billing/customer-portal`
- `POST /billing/mock/activate-premium`
- `POST /billing/mock/reset-free`
- `POST /payments/stripe/webhook`
- `GET /profile/me`
- `PUT /profile/me`
- `POST /workouts/generate`
- `GET /workouts/today`
- `POST /workouts/complete-exercise`
- `POST /progress/weight`
- `POST /progress/load`
- `GET /progress/history`
- `GET /chat/messages`
- `POST /chat`

## Checklist final de publicacao

- [ ] Cadastro funcionando
- [ ] Login funcionando
- [ ] Questionario inicial funcionando
- [ ] Geracao de treino funcionando
- [ ] Chat IA funcionando
- [ ] Tela de planos funcionando
- [ ] Limites Gratuito/Premium funcionando
- [ ] `GET /health` respondendo `status: ok`
- [ ] `VITE_API_URL` apontando para o backend publicado
- [ ] `FRONTEND_URL` configurado no backend publicado
- [ ] Migrations aplicadas no Supabase

## Observacoes

- O app foi preparado para publicacao gratuita, mas o backend no Render Free pode entrar em idle e demorar para responder no primeiro acesso.
- O banco recomendado continua sendo o Supabase Free, nao o Postgres gratuito do Render, porque o Postgres Free do Render expira.
- O projeto foi fixado em Node `20.x` para evitar comportamento imprevisivel em majors futuras no Vercel e no Render.
- A resposta da IA deve ser entendida como apoio educacional, nao como prescricao clinica.
- Se `GEMINI_API_KEY` nao estiver presente, o backend usa respostas mockadas para treino e chat.
- Os guias visuais animados usam exemplos publicos do Free Exercise DB quando houver correspondencia de movimento.
- Para ativar Stripe real, use `PAYMENT_PROVIDER="stripe"` e configure os Price IDs dos ciclos de 1, 3, 6 e 12 meses.
- No painel do Stripe, aponte o webhook para `https://seu-backend.onrender.com/payments/stripe/webhook`.
- O plano Gratuito limita mensagens mensais com IA, historico avancado e adaptacoes ilimitadas.
- O plano Premium libera historico completo, comparativos, mais uso do chat e expansoes futuras.
- O Premium oferece ciclos de 1, 3, 6 e 12 meses, com valores arredondados e desconto progressivo para os planos mais longos.
- Para testar sem gateway real, entre em `/app/plans` e use `Ativar Premium para teste`.
- Para revisao de conta no Stripe, publique dados reais de contato nas variaveis `VITE_CONTACT_*` e mantenha as paginas `/privacidade`, `/termos` e `/contato` acessiveis.
- Para reduzir risco na revisao do Stripe, publique pelo menos dois canais diretos de atendimento no site, como email e telefone ou WhatsApp.

## Fontes oficiais consultadas

- [Render Free web services](https://render.com/docs/free)
- [Render Blueprint YAML reference](https://render.com/docs/blueprint-spec)
- [Railway free trial](https://docs.railway.com/pricing/free-trial)
- [Vercel project configuration](https://vercel.com/docs/project-configuration)
- [Vercel Vite docs](https://vercel.com/docs/frameworks/frontend/vite)
- [Supabase Prisma guide](https://supabase.com/docs/guides/database/prisma)
- [Supabase changelog](https://supabase.com/changelog)
- [Free Exercise DB](https://github.com/yuhonas/free-exercise-db)
