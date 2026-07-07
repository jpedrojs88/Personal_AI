# Configuracao do Stripe

Guia rapido para ativar o Stripe em modo real no Personal IA.

## Produto

Crie um produto no Stripe com:

- Nome: `Personal IA Premium`
- Descricao: `Assinatura Premium do Personal IA com treinos ilimitados, chat ampliado e historico completo.`

## Precos

Crie 4 precos recorrentes em `BRL` para o mesmo produto.

### Preco 1

- Ciclo: `1 mes`
- Tipo: `Recorrente`
- Intervalo: `Mensal`
- Quantidade de intervalos: `1`
- Valor: `R$ 9,90`
- `unit_amount`: `990`
- Variavel: `STRIPE_PRICE_ID_PREMIUM_MONTHLY`

### Preco 2

- Ciclo: `3 meses`
- Tipo: `Recorrente`
- Intervalo: `Mensal`
- Quantidade de intervalos: `3`
- Valor: `R$ 27,90`
- `unit_amount`: `2790`
- Variavel: `STRIPE_PRICE_ID_PREMIUM_3M`

### Preco 3

- Ciclo: `6 meses`
- Tipo: `Recorrente`
- Intervalo: `Mensal`
- Quantidade de intervalos: `6`
- Valor: `R$ 53,90`
- `unit_amount`: `5390`
- Variavel: `STRIPE_PRICE_ID_PREMIUM_6M`

### Preco 4

- Ciclo: `12 meses`
- Tipo: `Recorrente`
- Intervalo: `Mensal`
- Quantidade de intervalos: `12`
- Valor: `R$ 99,90`
- `unit_amount`: `9990`
- Variavel: `STRIPE_PRICE_ID_PREMIUM_12M`

## Variaveis no Render para conta real

Configure no backend:

```env
PAYMENT_PROVIDER=stripe
ALLOW_MOCK_BILLING_ACTIONS=false
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PRICE_ID_PREMIUM_MONTHLY=price_...
STRIPE_PRICE_ID_PREMIUM_3M=price_...
STRIPE_PRICE_ID_PREMIUM_6M=price_...
STRIPE_PRICE_ID_PREMIUM_12M=price_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Antes de publicar em modo real

1. No painel do Stripe, troque da area de teste para a conta de producao.
2. Confirme que os `price_...` usados nas variaveis sao os da conta real, nao os de teste.
3. Use uma chave `sk_live_...` em `STRIPE_SECRET_KEY`.
4. Gere um novo `STRIPE_WEBHOOK_SECRET` a partir do webhook da conta real.
5. Mantenha `ALLOW_MOCK_BILLING_ACTIONS=false` para impedir ativacoes simuladas em producao.
6. Faça um novo deploy do backend no Render apos salvar as variaveis.

## Conferencia rapida no Render

Antes do deploy final, confirme que o backend esta com:

```env
PAYMENT_PROVIDER=stripe
ALLOW_MOCK_BILLING_ACTIONS=false
FRONTEND_URL=https://seu-dominio-ou-vercel.app
CORS_ALLOWED_ORIGINS=https://seu-dominio-ou-vercel.app
CORS_ALLOWED_ORIGIN_PATTERNS=https://*.vercel.app
```

Se `PAYMENT_PROVIDER` ficar como `mock`, o checkout real nao sera criado. Se
`ALLOW_MOCK_BILLING_ACTIONS` ficar como `true`, as rotas de teste continuam
liberadas.

## Webhook

No painel do Stripe, crie um webhook para:

```text
https://personal-ia-api.onrender.com/payments/stripe/webhook
```

Eventos recomendados:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

Depois de criar o webhook, copie o secret para `STRIPE_WEBHOOK_SECRET`.

## Fluxo esperado

1. O usuario toca em `Assinar Premium`.
2. O frontend chama `POST /billing/checkout-session`.
3. O backend cria uma Stripe Checkout Session em `mode=subscription`.
4. O frontend redireciona o usuario para o Stripe.
5. O Stripe envia o webhook para o backend.
6. O backend atualiza a assinatura no banco e libera o Premium.
7. O usuario pode depois abrir `Gerenciar assinatura` para acessar o portal do cliente.

## Validacao em producao

1. Configure as variaveis no Render.
2. Faça um deploy novo do backend.
3. Abra `/app/plans`.
4. Clique em `Assinar Premium`.
5. Conclua um pagamento real no Stripe.
6. Confirme se `GET /billing/status` retorna `effectivePlan: PREMIUM`.
