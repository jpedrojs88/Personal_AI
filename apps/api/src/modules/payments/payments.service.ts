import { randomUUID } from "node:crypto";
import { HttpException, Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { GoogleAuth } from "google-auth-library";
import { decodeJwt, importPKCS8, SignJWT } from "jose";
import {
  PaymentProvider,
  SubscriptionPlan,
  SubscriptionStatus,
} from "@prisma/client";
import Stripe from "stripe";
import {
  FREE_MONTHLY_MESSAGE_LIMIT,
  getPremiumOfferForMonths,
  normalizeBillingCycleMonths,
  PREMIUM_MONTHLY_MESSAGE_LIMIT,
} from "../billing/billing.constants";
import type { MobilePurchaseValidationDto } from "../billing/dto/mobile-purchase-validation.dto";
import { PrismaService } from "../prisma/prisma.service";

type StripeSubscriptionStatus =
  | "active"
  | "canceled"
  | "incomplete"
  | "incomplete_expired"
  | "past_due"
  | "paused"
  | "trialing"
  | "unpaid";

type MobilePaymentProvider = Extract<PaymentProvider, "APPLE_IAP" | "GOOGLE_PLAY">;

type MobileStoreVerification = {
  paymentProvider: MobilePaymentProvider;
  providerCustomerId: string | null;
  providerSubscriptionId: string;
  productId: string;
  billingCycleMonths: number;
  startedAt: Date;
  expiresAt: Date | null;
  active: boolean;
};

type AppleTransactionPayload = {
  transactionId?: string;
  originalTransactionId?: string;
  productId?: string;
  bundleId?: string;
  purchaseDate?: number;
  expiresDate?: number;
  revocationDate?: number;
  environment?: string;
};

type GoogleSubscriptionPurchaseV2 = {
  latestOrderId?: string;
  startTime?: string;
  subscriptionState?: string;
  lineItems?: Array<{
    productId?: string;
    expiryTime?: string;
  }>;
};

@Injectable()
export class PaymentsService {
  private stripeClient: Stripe | null | undefined;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  getConfiguredProvider() {
    const provider = this.configService.get<string>("PAYMENT_PROVIDER")?.toUpperCase();

    if (provider === PaymentProvider.STRIPE) {
      return PaymentProvider.STRIPE;
    }

    if (provider === PaymentProvider.MERCADO_PAGO) {
      return PaymentProvider.MERCADO_PAGO;
    }

    if (provider === PaymentProvider.APPLE_IAP) {
      return PaymentProvider.APPLE_IAP;
    }

    if (provider === PaymentProvider.GOOGLE_PLAY) {
      return PaymentProvider.GOOGLE_PLAY;
    }

    return PaymentProvider.MOCK;
  }

  isCheckoutReady() {
    if (this.getConfiguredProvider() === PaymentProvider.STRIPE) {
      return this.hasStripeCheckoutConfig();
    }

    return false;
  }

  isCustomerPortalReady() {
    return this.getConfiguredProvider() === PaymentProvider.STRIPE && this.hasStripeBaseConfig();
  }

  getProviderMode() {
    if (this.getConfiguredProvider() !== PaymentProvider.STRIPE) {
      return "MOCK" as const;
    }

    const secretKey = this.configService.get<string>("STRIPE_SECRET_KEY")?.trim();

    if (secretKey?.startsWith("sk_live_")) {
      return "LIVE" as const;
    }

    return "TEST" as const;
  }

  isMockBillingActionsEnabled() {
    const explicit = this.configService
      .get<string>("ALLOW_MOCK_BILLING_ACTIONS")
      ?.trim()
      .toLowerCase();

    if (explicit === "true") {
      return true;
    }

    if (explicit === "false") {
      return false;
    }

    return this.getConfiguredProvider() === PaymentProvider.MOCK;
  }

  async createPremiumCheckoutSession(userId: string, billingCycleMonths?: number) {
    const offer = getPremiumOfferForMonths(billingCycleMonths);

    if (this.getConfiguredProvider() !== PaymentProvider.STRIPE || !this.hasStripeCheckoutConfig()) {
      return {
        provider: this.getConfiguredProvider(),
        checkoutReady: this.isCheckoutReady(),
        customerPortalReady: this.isCustomerPortalReady(),
        mockMode: true,
        checkoutUrl: null,
        billingCycleMonths: offer.billingCycleMonths,
        offer,
        message:
          "Gateway de pagamento ainda nao configurado. Use a ativacao Premium para teste enquanto Stripe ou Mercado Pago nao forem conectados.",
        userId,
      };
    }

    const stripe = this.getStripeClient();

    if (!stripe) {
      throw new HttpException("Stripe nao configurado no servidor.", 503);
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscription: true,
      },
    });

    if (!user) {
      throw new NotFoundException("Usuario nao encontrado.");
    }

    const priceId = this.getStripePriceId(offer.billingCycleMonths);

    if (!priceId) {
      throw new HttpException(
        `Preco do Stripe nao configurado para ${offer.billingCycleMonths} mes(es).`,
        503,
      );
    }

    const frontendUrl = this.getFrontendUrl();
    const existingCustomerId =
      user.subscription?.paymentProvider === PaymentProvider.STRIPE &&
      user.subscription.providerCustomerId?.startsWith("cus_")
        ? user.subscription.providerCustomerId
        : undefined;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      success_url: `${frontendUrl}/app/plans?checkout=success`,
      cancel_url: `${frontendUrl}/app/plans?checkout=cancelled`,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      allow_promotion_codes: true,
      client_reference_id: user.id,
      customer: existingCustomerId,
      customer_email: existingCustomerId ? undefined : user.email,
      locale: "pt-BR",
      metadata: {
        userId: user.id,
        billingCycleMonths: String(offer.billingCycleMonths),
      },
      subscription_data: {
        metadata: {
          userId: user.id,
          billingCycleMonths: String(offer.billingCycleMonths),
        },
      },
    });

    return {
      provider: PaymentProvider.STRIPE,
      checkoutReady: true,
      customerPortalReady: this.isCustomerPortalReady(),
      mockMode: false,
      checkoutUrl: session.url,
      billingCycleMonths: offer.billingCycleMonths,
      offer,
      message: "Checkout do Stripe criado com sucesso.",
      userId,
    };
  }

  async createCustomerPortalSession(userId: string) {
    if (!this.isCustomerPortalReady()) {
      throw new HttpException("Portal do cliente Stripe ainda nao configurado.", 503);
    }

    const stripe = this.getStripeClient();

    if (!stripe) {
      throw new HttpException("Stripe nao configurado no servidor.", 503);
    }

    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    const customerId =
      subscription?.paymentProvider === PaymentProvider.STRIPE &&
      subscription.providerCustomerId?.startsWith("cus_")
        ? subscription.providerCustomerId
        : null;

    if (!customerId) {
      throw new HttpException(
        "Nenhum cliente Stripe encontrado para esta conta. Crie uma assinatura primeiro.",
        400,
      );
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${this.getFrontendUrl()}/app/plans`,
    });

    return {
      provider: PaymentProvider.STRIPE,
      portalReady: true,
      url: session.url,
      message: "Portal do cliente Stripe pronto.",
    };
  }

  async handleStripeWebhook(signature: string | string[] | undefined, payload: Buffer) {
    const stripe = this.getStripeClient();
    const webhookSecret = this.configService.get<string>("STRIPE_WEBHOOK_SECRET")?.trim();

    if (!stripe || !webhookSecret) {
      throw new HttpException("Webhook do Stripe nao configurado.", 503);
    }

    const normalizedSignature = Array.isArray(signature) ? signature[0] : signature;

    if (!normalizedSignature) {
      throw new HttpException("Assinatura Stripe ausente no webhook.", 400);
    }

    const event = stripe.webhooks.constructEvent(payload, normalizedSignature, webhookSecret);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.mode === "subscription" && typeof session.subscription === "string") {
          const subscription = await stripe.subscriptions.retrieve(session.subscription);
          await this.syncStripeSubscription(subscription);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await this.syncStripeSubscription(subscription);
        break;
      }
      default:
        break;
    }

    return { received: true };
  }

  async activatePremiumMock(userId: string, billingCycleMonths?: number) {
    const offer = getPremiumOfferForMonths(billingCycleMonths);
    const startedAt = new Date();
    const expiresAt = new Date(startedAt);
    expiresAt.setMonth(expiresAt.getMonth() + offer.billingCycleMonths);

    return {
      paymentProvider: "MOCK" as const,
      providerCustomerId: `mock-customer-${userId}`,
      providerSubscriptionId: `mock-subscription-${randomUUID()}`,
      startedAt,
      expiresAt,
      billingCycleMonths: offer.billingCycleMonths,
      offer,
      monthlyMessageLimit: PREMIUM_MONTHLY_MESSAGE_LIMIT,
    };
  }

  async verifyMobilePurchase(userId: string, dto: MobilePurchaseValidationDto) {
    const verification =
      dto.platform === "android-playstore"
        ? await this.verifyGooglePlayPurchase(dto)
        : await this.verifyApplePurchase(dto);

    const status = verification.active
      ? SubscriptionStatus.ACTIVE
      : SubscriptionStatus.EXPIRED;
    const monthlyMessageLimit = verification.active
      ? PREMIUM_MONTHLY_MESSAGE_LIMIT
      : FREE_MONTHLY_MESSAGE_LIMIT;

    await this.prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        plan: SubscriptionPlan.PREMIUM,
        status,
        billingCycleMonths: verification.billingCycleMonths,
        startedAt: verification.startedAt,
        expiresAt: verification.expiresAt,
        monthlyMessageLimit,
        monthlyMessagesUsed: 0,
        usagePeriodStartedAt: new Date(),
        paymentProvider: verification.paymentProvider,
        providerCustomerId: verification.providerCustomerId,
        providerSubscriptionId: verification.providerSubscriptionId,
      },
      update: {
        plan: SubscriptionPlan.PREMIUM,
        status,
        billingCycleMonths: verification.billingCycleMonths,
        startedAt: verification.startedAt,
        expiresAt: verification.expiresAt,
        monthlyMessageLimit,
        paymentProvider: verification.paymentProvider,
        providerCustomerId: verification.providerCustomerId,
        providerSubscriptionId: verification.providerSubscriptionId,
      },
    });

    return verification;
  }

  private async syncStripeSubscription(subscription: Stripe.Subscription) {
    const userId = await this.resolveUserIdFromStripeSubscription(subscription);

    if (!userId) {
      return;
    }

    const status = this.mapStripeStatus(subscription.status);
    const billingCycleMonths = this.resolveBillingCycleMonthsFromStripeSubscription(subscription);
    const startedAt = new Date((subscription.start_date ?? subscription.created) * 1000);
    const primaryItem = subscription.items.data[0];
    const usagePeriodStartedAt = new Date(
      (primaryItem?.current_period_start ?? subscription.start_date ?? subscription.created) * 1000,
    );
    const expiresAt = primaryItem?.current_period_end
      ? new Date(primaryItem.current_period_end * 1000)
      : null;
    const monthlyMessageLimit =
      status === SubscriptionStatus.ACTIVE
        ? PREMIUM_MONTHLY_MESSAGE_LIMIT
        : FREE_MONTHLY_MESSAGE_LIMIT;

    await this.prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        plan: SubscriptionPlan.PREMIUM,
        status,
        billingCycleMonths,
        startedAt,
        expiresAt,
        monthlyMessageLimit,
        monthlyMessagesUsed: 0,
        usagePeriodStartedAt,
        paymentProvider: PaymentProvider.STRIPE,
        providerCustomerId: this.readCustomerId(subscription.customer),
        providerSubscriptionId: subscription.id,
      },
      update: {
        plan: SubscriptionPlan.PREMIUM,
        status,
        billingCycleMonths,
        startedAt,
        expiresAt,
        monthlyMessageLimit,
        paymentProvider: PaymentProvider.STRIPE,
        providerCustomerId: this.readCustomerId(subscription.customer),
        providerSubscriptionId: subscription.id,
      },
    });
  }

  private async resolveUserIdFromStripeSubscription(subscription: Stripe.Subscription) {
    const metadataUserId = subscription.metadata.userId?.trim();

    if (metadataUserId) {
      return metadataUserId;
    }

    const customerId = this.readCustomerId(subscription.customer);

    const existing = await this.prisma.subscription.findFirst({
      where: {
        OR: [
          { providerSubscriptionId: subscription.id },
          ...(customerId ? [{ providerCustomerId: customerId }] : []),
        ],
      },
      select: {
        userId: true,
      },
    });

    return existing?.userId ?? null;
  }

  private mapStripeStatus(status: StripeSubscriptionStatus) {
    if (status === "active" || status === "trialing") {
      return SubscriptionStatus.ACTIVE;
    }

    if (status === "canceled") {
      return SubscriptionStatus.CANCELED;
    }

    return SubscriptionStatus.EXPIRED;
  }

  private resolveBillingCycleMonthsFromStripeSubscription(subscription: Stripe.Subscription) {
    const metadataMonths = Number(subscription.metadata.billingCycleMonths);

    if (metadataMonths) {
      return normalizeBillingCycleMonths(metadataMonths);
    }

    const recurring = subscription.items.data[0]?.price.recurring;

    if (!recurring) {
      return 1;
    }

    if (recurring.interval === "year") {
      return 12;
    }

    return normalizeBillingCycleMonths(recurring.interval_count ?? 1);
  }

  private readCustomerId(customer: string | Stripe.Customer | Stripe.DeletedCustomer | null) {
    if (!customer) {
      return null;
    }

    return typeof customer === "string" ? customer : customer.id;
  }

  private hasStripeBaseConfig() {
    return Boolean(
      this.configService.get<string>("STRIPE_SECRET_KEY")?.trim() &&
        this.getFrontendUrl(),
    );
  }

  private hasStripeCheckoutConfig() {
    return Boolean(
      this.hasStripeBaseConfig() &&
        this.getStripePriceId(1) &&
        this.getStripePriceId(3) &&
        this.getStripePriceId(6) &&
        this.getStripePriceId(12),
    );
  }

  private getStripePriceId(billingCycleMonths: number) {
    const normalized = normalizeBillingCycleMonths(billingCycleMonths);

    if (normalized === 1) {
      return this.configService.get<string>("STRIPE_PRICE_ID_PREMIUM_MONTHLY")?.trim() || null;
    }

    if (normalized === 3) {
      return this.configService.get<string>("STRIPE_PRICE_ID_PREMIUM_3M")?.trim() || null;
    }

    if (normalized === 6) {
      return this.configService.get<string>("STRIPE_PRICE_ID_PREMIUM_6M")?.trim() || null;
    }

    return this.configService.get<string>("STRIPE_PRICE_ID_PREMIUM_12M")?.trim() || null;
  }

  private async verifyApplePurchase(
    dto: MobilePurchaseValidationDto,
  ): Promise<MobileStoreVerification> {
    const signedTransactionInfo =
      dto.signedTransactionInfo ??
      this.readNestedString(dto.receipt, "transaction", "jwsRepresentation") ??
      this.readNestedString(dto.receipt, "transaction", "signedTransactionInfo");

    if (!signedTransactionInfo) {
      throw new HttpException("Recibo Apple sem transacao StoreKit assinada.", 400);
    }

    const localPayload = decodeJwt(signedTransactionInfo) as AppleTransactionPayload;
    const transactionId =
      dto.transactionId ??
      localPayload.transactionId ??
      localPayload.originalTransactionId;

    if (!transactionId) {
      throw new HttpException("Nao foi possivel identificar a transacao Apple.", 400);
    }

    const transactionPayload = await this.getAppleTransactionInfo(transactionId);
    const productId = transactionPayload.productId ?? dto.productId;
    const offer = this.getMobileStoreOffer(PaymentProvider.APPLE_IAP, productId);
    const expectedBundleId = this.configService.get<string>("APPLE_IAP_BUNDLE_ID")?.trim();

    if (expectedBundleId && transactionPayload.bundleId !== expectedBundleId) {
      throw new HttpException("Recibo Apple pertence a outro app.", 400);
    }

    const expiresAt = transactionPayload.expiresDate
      ? new Date(Number(transactionPayload.expiresDate))
      : null;
    const startedAt = transactionPayload.purchaseDate
      ? new Date(Number(transactionPayload.purchaseDate))
      : new Date();

    return {
      paymentProvider: PaymentProvider.APPLE_IAP,
      providerCustomerId: transactionPayload.originalTransactionId ?? transactionId,
      providerSubscriptionId: transactionPayload.originalTransactionId ?? transactionId,
      productId,
      billingCycleMonths: offer.billingCycleMonths,
      startedAt,
      expiresAt,
      active: Boolean(expiresAt && expiresAt > new Date() && !transactionPayload.revocationDate),
    };
  }

  private async getAppleTransactionInfo(transactionId: string) {
    const keyId = this.configService.get<string>("APPLE_IAP_KEY_ID")?.trim();
    const issuerId = this.configService.get<string>("APPLE_IAP_ISSUER_ID")?.trim();
    const bundleId = this.configService.get<string>("APPLE_IAP_BUNDLE_ID")?.trim();
    const rawPrivateKey = this.configService.get<string>("APPLE_IAP_PRIVATE_KEY")?.trim();

    if (!keyId || !issuerId || !bundleId || !rawPrivateKey) {
      throw new HttpException("Credenciais Apple IAP nao configuradas no servidor.", 503);
    }

    const privateKey = await importPKCS8(rawPrivateKey.replace(/\\n/g, "\n"), "ES256");
    const token = await new SignJWT({ bid: bundleId })
      .setProtectedHeader({ alg: "ES256", kid: keyId, typ: "JWT" })
      .setIssuer(issuerId)
      .setAudience("appstoreconnect-v1")
      .setIssuedAt()
      .setExpirationTime("15m")
      .sign(privateKey);

    const environment =
      this.configService.get<string>("APPLE_IAP_ENVIRONMENT")?.trim().toLowerCase() === "sandbox"
        ? "sandbox"
        : "production";
    const baseUrl =
      environment === "sandbox"
        ? "https://api.storekit-sandbox.itunes.apple.com"
        : "https://api.storekit.itunes.apple.com";

    const response = await fetch(
      `${baseUrl}/inApps/v1/transactions/${encodeURIComponent(transactionId)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!response.ok) {
      throw new HttpException(
        `Apple IAP recusou a validacao da transacao (${response.status}).`,
        400,
      );
    }

    const body = (await response.json()) as { signedTransactionInfo?: string };

    if (!body.signedTransactionInfo) {
      throw new HttpException("Apple IAP nao retornou a transacao assinada.", 400);
    }

    return decodeJwt(body.signedTransactionInfo) as AppleTransactionPayload;
  }

  private async verifyGooglePlayPurchase(
    dto: MobilePurchaseValidationDto,
  ): Promise<MobileStoreVerification> {
    const purchaseToken =
      dto.purchaseToken ??
      this.readNestedString(dto.receipt, "transaction", "purchaseToken") ??
      this.readPurchaseTokenFromGoogleReceipt(dto.receipt);

    if (!purchaseToken) {
      throw new HttpException("Recibo Google Play sem purchaseToken.", 400);
    }

    const packageName =
      this.configService.get<string>("GOOGLE_PLAY_PACKAGE_NAME")?.trim() ??
      this.configService.get<string>("ANDROID_PACKAGE_NAME")?.trim() ??
      "br.com.novapride.personalia";
    const accessToken = await this.getGooglePlayAccessToken();
    const response = await fetch(
      `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodeURIComponent(
        packageName,
      )}/purchases/subscriptionsv2/tokens/${encodeURIComponent(purchaseToken)}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    if (!response.ok) {
      throw new HttpException(
        `Google Play recusou a validacao da assinatura (${response.status}).`,
        400,
      );
    }

    const purchase = (await response.json()) as GoogleSubscriptionPurchaseV2;
    const localReceiptProductId = this.readProductIdFromGoogleReceipt(dto.receipt);
    const lineItem = purchase.lineItems?.find((item) =>
      this.isKnownMobileProduct(PaymentProvider.GOOGLE_PLAY, item.productId),
    );
    const productId = lineItem?.productId ?? localReceiptProductId ?? dto.productId;
    const offer = this.getMobileStoreOffer(PaymentProvider.GOOGLE_PLAY, productId);
    const matchingLineItem =
      lineItem ??
      purchase.lineItems?.find((item) => item.productId === productId) ??
      purchase.lineItems?.[0];
    const expiresAt = matchingLineItem?.expiryTime ? new Date(matchingLineItem.expiryTime) : null;
    const startedAt = purchase.startTime ? new Date(purchase.startTime) : new Date();
    const activeStates = new Set([
      "SUBSCRIPTION_STATE_ACTIVE",
      "SUBSCRIPTION_STATE_CANCELED",
      "SUBSCRIPTION_STATE_IN_GRACE_PERIOD",
    ]);

    return {
      paymentProvider: PaymentProvider.GOOGLE_PLAY,
      providerCustomerId: purchase.latestOrderId ?? null,
      providerSubscriptionId: purchaseToken,
      productId,
      billingCycleMonths: offer.billingCycleMonths,
      startedAt,
      expiresAt,
      active: Boolean(
        activeStates.has(purchase.subscriptionState ?? "") &&
          expiresAt &&
          expiresAt > new Date(),
      ),
    };
  }

  private async getGooglePlayAccessToken() {
    const rawCredentials = this.configService
      .get<string>("GOOGLE_PLAY_SERVICE_ACCOUNT_JSON")
      ?.trim();
    const keyFile = this.configService.get<string>("GOOGLE_PLAY_SERVICE_ACCOUNT_KEY_FILE")?.trim();

    if (!rawCredentials && !keyFile) {
      throw new HttpException("Credenciais Google Play Billing nao configuradas.", 503);
    }

    const auth = new GoogleAuth({
      ...(rawCredentials
        ? { credentials: JSON.parse(rawCredentials) as Record<string, unknown> }
        : {}),
      ...(keyFile ? { keyFile } : {}),
      scopes: ["https://www.googleapis.com/auth/androidpublisher"],
    });
    const client = await auth.getClient();
    const token = await client.getAccessToken();

    if (!token.token) {
      throw new HttpException("Nao foi possivel autenticar no Google Play.", 503);
    }

    return token.token;
  }

  private getMobileStoreOffer(
    provider: MobilePaymentProvider,
    productId?: string | null,
  ) {
    const match = this.getMobileStoreProducts(provider).find((product) => product.id === productId);

    if (!match) {
      throw new HttpException("Produto mobile nao reconhecido pelo servidor.", 400);
    }

    return match;
  }

  private isKnownMobileProduct(
    provider: MobilePaymentProvider,
    productId?: string | null,
  ) {
    return Boolean(
      productId &&
        this.getMobileStoreProducts(provider).some((product) => product.id === productId),
    );
  }

  private getMobileStoreProducts(provider: MobilePaymentProvider) {
    const prefix = provider === PaymentProvider.APPLE_IAP ? "APPLE_IAP" : "GOOGLE_PLAY";

    return [
      {
        billingCycleMonths: 1,
        id:
          this.configService.get<string>(`${prefix}_PRODUCT_ID_PREMIUM_MONTHLY`)?.trim() ??
          "personalia.premium.monthly",
      },
      {
        billingCycleMonths: 3,
        id:
          this.configService.get<string>(`${prefix}_PRODUCT_ID_PREMIUM_3M`)?.trim() ??
          "personalia.premium.3m",
      },
      {
        billingCycleMonths: 6,
        id:
          this.configService.get<string>(`${prefix}_PRODUCT_ID_PREMIUM_6M`)?.trim() ??
          "personalia.premium.6m",
      },
      {
        billingCycleMonths: 12,
        id:
          this.configService.get<string>(`${prefix}_PRODUCT_ID_PREMIUM_12M`)?.trim() ??
          "personalia.premium.12m",
      },
    ];
  }

  private readNestedString(
    value: Record<string, unknown> | undefined,
    firstKey: string,
    secondKey: string,
  ) {
    const nested = value?.[firstKey];

    if (!nested || typeof nested !== "object") {
      return undefined;
    }

    const nestedValue = (nested as Record<string, unknown>)[secondKey];
    return typeof nestedValue === "string" ? nestedValue : undefined;
  }

  private readPurchaseTokenFromGoogleReceipt(receipt: Record<string, unknown> | undefined) {
    const rawReceipt = this.readNestedString(receipt, "transaction", "receipt");

    if (!rawReceipt) {
      return undefined;
    }

    try {
      const parsed = JSON.parse(rawReceipt) as { purchaseToken?: string };
      return parsed.purchaseToken;
    } catch {
      return undefined;
    }
  }

  private readProductIdFromGoogleReceipt(receipt: Record<string, unknown> | undefined) {
    const rawReceipt = this.readNestedString(receipt, "transaction", "receipt");

    if (!rawReceipt) {
      return undefined;
    }

    try {
      const parsed = JSON.parse(rawReceipt) as { productId?: string };
      return parsed.productId;
    } catch {
      return undefined;
    }
  }

  private getFrontendUrl() {
    return (
      this.configService.get<string>("FRONTEND_URL")?.trim() ||
      "http://localhost:5173"
    );
  }

  private getStripeClient() {
    if (this.stripeClient !== undefined) {
      return this.stripeClient;
    }

    const secretKey = this.configService.get<string>("STRIPE_SECRET_KEY")?.trim();

    if (!secretKey) {
      this.stripeClient = null;
      return this.stripeClient;
    }

    this.stripeClient = new Stripe(secretKey, {
      apiVersion: "2026-05-27.dahlia",
    });
    return this.stripeClient;
  }
}
