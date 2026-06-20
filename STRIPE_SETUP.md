# Stripe Setup

Guia rapido para ativar o Stripe real no Personal IA.

## Produto

Crie um produto no Stripe com:

- Nome: `Personal IA Premium`
- Descricao: `Assinatura Premium do Personal IA com treinos ilimitados, chat ampliado e historico completo.`

## Prices

Crie 4 prices recorrentes em `BRL` para o mesmo produto.

### Price 1

- Ciclo: `1 mes`
- Tipo: `Recurring`
- Intervalo: `Month`
- Interval count: `1`
- Valor: `R$ 9,90`
- `unit_amount`: `990`
- Variavel: `STRIPE_PRICE_ID_PREMIUM_MONTHLY`

### Price 2

- Ciclo: `3 meses`
- Tipo: `Recurring`
- Intervalo: `Month`
- Interval count: `3`
- Valor: `R$ 27,90`
- `unit_amount`: `2790`
- Variavel: `STRIPE_PRICE_ID_PREMIUM_3M`

### Price 3

- Ciclo: `6 meses`
- Tipo: `Recurring`
- Intervalo: `Month`
- Interval count: `6`
- Valor: `R$ 53,90`
- `unit_amount`: `5390`
- Variavel: `STRIPE_PRICE_ID_PREMIUM_6M`

### Price 4

- Ciclo: `12 meses`
- Tipo: `Recurring`
- Intervalo: `Month`
- Interval count: `12`
- Valor: `R$ 99,90`
- `unit_amount`: `9990`
- Variavel: `STRIPE_PRICE_ID_PREMIUM_12M`

## Variaveis no Render

Configure no backend:

```env
PAYMENT_PROVIDER=stripe
STRIPE_SECRET_KEY=sk_live_ou_sk_test...
STRIPE_PRICE_ID_PREMIUM_MONTHLY=price_...
STRIPE_PRICE_ID_PREMIUM_3M=price_...
STRIPE_PRICE_ID_PREMIUM_6M=price_...
STRIPE_PRICE_ID_PREMIUM_12M=price_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

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

## Teste rapido

1. Configure as variaveis no Render.
2. Faça um deploy novo do backend.
3. Abra `/app/plans`.
4. Clique em `Assinar Premium`.
5. Conclua um pagamento de teste no Stripe.
6. Confirme se `GET /billing/status` retorna `effectivePlan: PREMIUM`.
