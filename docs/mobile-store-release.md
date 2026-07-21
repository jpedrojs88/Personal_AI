# Preparacao para Play Store e App Store

Este guia deixa o Personal IA pronto para virar app Android e iOS usando Capacitor, reaproveitando o frontend React + Vite.

## Decisao tecnica

- Empacotamento mobile: Capacitor.
- App ID inicial: `br.com.novapride.personalia`.
- Nome do app: `Personal IA`.
- Fonte do app mobile: `apps/web/dist`.
- Projeto Android nativo: `apps/web/android`.
- Backend: continua sendo o Render.
- Banco: continua sendo Supabase PostgreSQL.

## Ponto critico sobre pagamentos

Para web, o Stripe continua correto.

Para Play Store e App Store, assinatura Premium que libera recursos digitais do app normalmente precisa usar as assinaturas nativas da loja. Por isso existe a flag:

```env
VITE_APP_STORE_BUILD="true"
```

Quando essa flag esta ativa, a tela de planos usa Apple IAP ou Google Play Billing no app instalado. No navegador, ela apenas mostra o aviso de que as compras nativas ficam disponiveis no build da loja.

Fluxo recomendado:

1. Publicar web com Stripe normalmente.
2. Criar os produtos de assinatura no App Store Connect e Play Console.
3. Configurar as variaveis de IAP/Billing no Render e no build mobile.
4. Testar compras sandbox/TestFlight e teste fechado do Google Play antes de enviar para revisao.

## Produtos de assinatura

Use os mesmos IDs no App Store Connect, Play Console, backend e frontend:

```text
personalia.premium.monthly
personalia.premium.3m
personalia.premium.6m
personalia.premium.12m
```

Valores atuais sugeridos:

```text
1 mes: R$ 9,90
3 meses: R$ 27,90
6 meses: R$ 53,90
12 meses: R$ 99,90
```

## Variaveis backend para Render

```env
APPLE_IAP_BUNDLE_ID="br.com.novapride.personalia"
APPLE_IAP_ENVIRONMENT="production"
APPLE_IAP_KEY_ID=""
APPLE_IAP_ISSUER_ID=""
APPLE_IAP_PRIVATE_KEY=""
APPLE_IAP_PRODUCT_ID_PREMIUM_MONTHLY="personalia.premium.monthly"
APPLE_IAP_PRODUCT_ID_PREMIUM_3M="personalia.premium.3m"
APPLE_IAP_PRODUCT_ID_PREMIUM_6M="personalia.premium.6m"
APPLE_IAP_PRODUCT_ID_PREMIUM_12M="personalia.premium.12m"
GOOGLE_PLAY_PACKAGE_NAME="br.com.novapride.personalia"
GOOGLE_PLAY_SERVICE_ACCOUNT_JSON=""
GOOGLE_PLAY_PRODUCT_ID_PREMIUM_MONTHLY="personalia.premium.monthly"
GOOGLE_PLAY_PRODUCT_ID_PREMIUM_3M="personalia.premium.3m"
GOOGLE_PLAY_PRODUCT_ID_PREMIUM_6M="personalia.premium.6m"
GOOGLE_PLAY_PRODUCT_ID_PREMIUM_12M="personalia.premium.12m"
```

Observacoes:

- `APPLE_IAP_PRIVATE_KEY` deve conter a chave privada da App Store Server API. Se colar em uma linha, substitua quebras de linha por `\n`.
- `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` deve ser o JSON da service account com permissao para Android Publisher API.
- Para sandbox Apple, use `APPLE_IAP_ENVIRONMENT="sandbox"`.

## Variaveis frontend para build mobile

```env
VITE_APP_STORE_BUILD="true"
VITE_APPLE_IAP_PRODUCT_ID_PREMIUM_MONTHLY="personalia.premium.monthly"
VITE_APPLE_IAP_PRODUCT_ID_PREMIUM_3M="personalia.premium.3m"
VITE_APPLE_IAP_PRODUCT_ID_PREMIUM_6M="personalia.premium.6m"
VITE_APPLE_IAP_PRODUCT_ID_PREMIUM_12M="personalia.premium.12m"
VITE_GOOGLE_PLAY_PRODUCT_ID_PREMIUM_MONTHLY="personalia.premium.monthly"
VITE_GOOGLE_PLAY_PRODUCT_ID_PREMIUM_3M="personalia.premium.3m"
VITE_GOOGLE_PLAY_PRODUCT_ID_PREMIUM_6M="personalia.premium.6m"
VITE_GOOGLE_PLAY_PRODUCT_ID_PREMIUM_12M="personalia.premium.12m"
```

## Backend de validacao

O app envia recibos para:

```text
POST /billing/mobile/verify
```

O backend valida:

- Apple: App Store Server API, endpoint de transacao.
- Google: Android Publisher API `purchases.subscriptionsv2.get`.

Depois de validado, o backend salva a assinatura como `APPLE_IAP` ou `GOOGLE_PLAY` e libera Premium usando a mesma tabela `subscriptions`.

## Comandos

Instalar dependencias:

```bash
npm install --legacy-peer-deps
```

Build web para mobile:

```bash
npm --workspace apps/web run mobile:sync
```

O Android ja foi adicionado ao repositorio. Se precisar recriar do zero:

```bash
npm --workspace apps/web run mobile:add:android
```

Abrir no Android Studio:

```bash
npm --workspace apps/web run mobile:open:android
```

Adicionar iOS, apenas em macOS com Xcode:

```bash
npm --workspace apps/web run mobile:add:ios
```

Abrir no Xcode:

```bash
npm --workspace apps/web run mobile:open:ios
```

Gerar icones e splash depois que os arquivos PNG estiverem em `apps/web/assets`:

```bash
npm --workspace apps/web run mobile:assets
```

## Assets necessarios

O Capacitor Assets espera estes arquivos em `apps/web/assets`:

```text
apps/web/assets/
  icon-only.png
  icon-foreground.png
  icon-background.png
  splash.png
  splash-dark.png
```

Tamanhos recomendados:

- Icones: 1024x1024 PNG.
- Splash: 2732x2732 PNG.
- Fundo escuro: `#07090d`.
- Cor principal: `#21d2ad`.

## Checklist Play Store

- Criar conta Google Play Console.
- Criar app com nome `Personal IA`.
- Categoria sugerida: Saude e fitness.
- Publico-alvo: adultos ou publico geral, conforme decisao de negocio.
- Enviar politica de privacidade: `https://seu-dominio/privacidade`.
- Preencher formulario de seguranca de dados.
- O projeto gerado pelo Capacitor esta com `targetSdkVersion = 36`.
- Criar assinatura Premium com os quatro produtos listados acima.
- Configurar conta de servico com Android Publisher API e acesso ao app no Play Console.
- Gerar Android App Bundle (`.aab`) no Android Studio.
- Testar login, cadastro, treino, chat, planos e links legais em aparelho real.

## Checklist App Store

- Criar conta Apple Developer.
- Criar Bundle ID igual ao `appId` ou ajustar `capacitor.config.ts` antes de gerar o projeto.
- Criar app no App Store Connect.
- Categoria sugerida: Health & Fitness.
- Informar URL de politica de privacidade.
- Preencher App Privacy com dados coletados pelo app.
- Criar grupo de assinaturas Premium com os quatro produtos listados acima.
- Criar chave da App Store Server API para validar transacoes no backend.
- Testar em TestFlight antes da revisao.
- Se liberar Premium no app iOS, usar auto-renewable subscriptions da Apple.

## Dados provaveis de privacidade

O app pode coletar:

- Nome e e-mail.
- Dados de perfil de treino: idade, sexo, altura, peso, objetivo e experiencia.
- Dados de saude/fitness informados pelo usuario: peso corporal, cargas e historico de treino.
- Conteudo de mensagens enviadas ao coach de IA.
- Dados de compra/assinatura quando o Premium estiver ativo.

O app nao deve prometer resultado fisico, diagnosticar condicoes medicas ou substituir profissional de saude.

## Textos iniciais para cadastro nas lojas

Nome:

```text
Personal IA
```

Descricao curta:

```text
Treinos personalizados com IA, historico de evolucao e coach para adaptar sua rotina.
```

Descricao completa:

```text
O Personal IA ajuda voce a montar treinos personalizados, acompanhar sua evolucao e conversar com um coach de IA para adaptar sua rotina.

Responda um questionario inicial, receba uma divisao semanal de treino, registre exercicios concluidos, acompanhe cargas e veja seu historico de progresso.

O aplicativo oferece orientacoes educacionais sobre treino e nao substitui avaliacao medica, diagnostico, acompanhamento presencial ou orientacao de um profissional habilitado.
```

Palavras-chave:

```text
treino, academia, fitness, personal trainer, musculacao, IA, evolucao, cargas
```

## Referencias oficiais

- Capacitor config: https://capacitorjs.com/docs/config
- Capacitor icones e splash: https://capacitorjs.com/docs/guides/splash-screens-and-icons
- Google Play target API: https://developer.android.com/google/play/requirements/target-sdk
- Apple App Privacy: https://developer.apple.com/app-store/app-privacy-details/
- Apple Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
