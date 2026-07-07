import { randomUUID } from "node:crypto";
import { HttpException, Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
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
