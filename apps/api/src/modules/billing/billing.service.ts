import {
  HttpException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  PaymentProvider,
  SubscriptionPlan,
  SubscriptionStatus,
} from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import {
  FREE_MONTHLY_MESSAGE_LIMIT,
  getPremiumBillingOffers,
  PREMIUM_MONTHLY_MESSAGE_LIMIT,
  PREMIUM_MONTHLY_PRICE_BRL,
  PREMIUM_MONTHLY_PRICE_LABEL,
} from "./billing.constants";
import { PaymentsService } from "../payments/payments.service";

@Injectable()
export class BillingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentsService: PaymentsService,
  ) {}

  async getStatus(userId: string) {
    const subscription = await this.getOrCreateSubscription(userId);
    return this.buildStatus(subscription);
  }

  async ensureAiMessageAvailable(userId: string) {
    const subscription = await this.getOrCreateSubscription(userId);
    return this.assertAiMessageAvailable(subscription);
  }

  async consumeAiMessage(userId: string) {
    const subscription = await this.getOrCreateSubscription(userId);
    this.assertAiMessageAvailable(subscription);

    await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        monthlyMessagesUsed: {
          increment: 1,
        },
      },
    });
  }

  async activatePremiumForTest(userId: string, billingCycleMonths?: number) {
    await this.ensureUserExists(userId);
    const mockSubscription = await this.paymentsService.activatePremiumMock(
      userId,
      billingCycleMonths,
    );

    await this.prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        plan: SubscriptionPlan.PREMIUM,
        status: SubscriptionStatus.ACTIVE,
        billingCycleMonths: mockSubscription.billingCycleMonths,
        startedAt: mockSubscription.startedAt,
        expiresAt: mockSubscription.expiresAt,
        monthlyMessageLimit: mockSubscription.monthlyMessageLimit,
        monthlyMessagesUsed: 0,
        usagePeriodStartedAt: mockSubscription.startedAt,
        paymentProvider: PaymentProvider.MOCK,
        providerCustomerId: mockSubscription.providerCustomerId,
        providerSubscriptionId: mockSubscription.providerSubscriptionId,
      },
      update: {
        plan: SubscriptionPlan.PREMIUM,
        status: SubscriptionStatus.ACTIVE,
        billingCycleMonths: mockSubscription.billingCycleMonths,
        startedAt: mockSubscription.startedAt,
        expiresAt: mockSubscription.expiresAt,
        monthlyMessageLimit: mockSubscription.monthlyMessageLimit,
        monthlyMessagesUsed: 0,
        usagePeriodStartedAt: mockSubscription.startedAt,
        paymentProvider: PaymentProvider.MOCK,
        providerCustomerId: mockSubscription.providerCustomerId,
        providerSubscriptionId: mockSubscription.providerSubscriptionId,
      },
    });

    return this.getStatus(userId);
  }

  async resetFreeForTest(userId: string) {
    await this.ensureUserExists(userId);

    await this.prisma.subscription.upsert({
      where: { userId },
      create: this.buildDefaultFreeSubscription(userId),
      update: this.buildDefaultFreeSubscription(userId),
    });

    return this.getStatus(userId);
  }

  async createCheckoutSession(userId: string) {
    await this.ensureUserExists(userId);
    return this.paymentsService.createPremiumCheckoutSession(userId);
  }

  async createCheckoutSessionForCycle(userId: string, billingCycleMonths?: number) {
    await this.ensureUserExists(userId);
    return this.paymentsService.createPremiumCheckoutSession(userId, billingCycleMonths);
  }

  async createCustomerPortalSession(userId: string) {
    await this.ensureUserExists(userId);
    return this.paymentsService.createCustomerPortalSession(userId);
  }

  private async getOrCreateSubscription(userId: string) {
    await this.ensureUserExists(userId);

    const existing = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    if (!existing) {
      return this.prisma.subscription.create({
        data: this.buildDefaultFreeSubscription(userId),
      });
    }

    const now = new Date();
    const updates: Record<string, unknown> = {};

    if (this.isUsageWindowExpired(existing.usagePeriodStartedAt, now)) {
      updates.monthlyMessagesUsed = 0;
      updates.usagePeriodStartedAt = now;
    }

    if (
      existing.plan === SubscriptionPlan.PREMIUM &&
      existing.status === SubscriptionStatus.ACTIVE &&
      existing.expiresAt &&
      existing.expiresAt <= now
    ) {
      updates.status = SubscriptionStatus.EXPIRED;
      updates.monthlyMessageLimit = FREE_MONTHLY_MESSAGE_LIMIT;
      updates.monthlyMessagesUsed = 0;
      updates.usagePeriodStartedAt = now;
    }

    if (
      existing.plan === SubscriptionPlan.FREE &&
      (existing.monthlyMessageLimit !== FREE_MONTHLY_MESSAGE_LIMIT ||
        existing.billingCycleMonths !== 1)
    ) {
      updates.monthlyMessageLimit = FREE_MONTHLY_MESSAGE_LIMIT;
      updates.billingCycleMonths = 1;
    }

    if (!Object.keys(updates).length) {
      return existing;
    }

    return this.prisma.subscription.update({
      where: { id: existing.id },
      data: updates,
    });
  }

  private buildStatus(subscription: {
    id: string;
    plan: SubscriptionPlan;
    status: SubscriptionStatus;
    billingCycleMonths: number;
    startedAt: Date;
    expiresAt: Date | null;
    monthlyMessageLimit: number;
    monthlyMessagesUsed: number;
    paymentProvider: PaymentProvider;
  }) {
    const premiumActive =
      subscription.plan === SubscriptionPlan.PREMIUM &&
      subscription.status === SubscriptionStatus.ACTIVE &&
      (!subscription.expiresAt || subscription.expiresAt > new Date());

    const effectivePlan = premiumActive ? SubscriptionPlan.PREMIUM : SubscriptionPlan.FREE;
    const messageLimit =
      effectivePlan === SubscriptionPlan.PREMIUM
        ? PREMIUM_MONTHLY_MESSAGE_LIMIT
        : FREE_MONTHLY_MESSAGE_LIMIT;
    const monthlyMessagesRemaining = Math.max(
      messageLimit - subscription.monthlyMessagesUsed,
      0,
    );

    return {
      currentPlan: subscription.plan,
      effectivePlan,
      status: subscription.status,
      currentBillingCycleMonths: subscription.billingCycleMonths,
      currentBillingCycleLabel:
        subscription.billingCycleMonths === 1
          ? "1 mes"
          : `${subscription.billingCycleMonths} meses`,
      startedAt: subscription.startedAt,
      expiresAt: subscription.expiresAt,
      mockMode: subscription.paymentProvider === PaymentProvider.MOCK,
      premiumMonthlyPriceBrl: PREMIUM_MONTHLY_PRICE_BRL,
      premiumMonthlyPriceLabel: PREMIUM_MONTHLY_PRICE_LABEL,
      premiumOffers: getPremiumBillingOffers(),
      monthlyMessageLimit: messageLimit,
      monthlyMessagesUsed: subscription.monthlyMessagesUsed,
      monthlyMessagesRemaining,
      payment: {
        provider: this.paymentsService.getConfiguredProvider(),
        checkoutReady: this.paymentsService.isCheckoutReady(),
        customerPortalReady: this.paymentsService.isCustomerPortalReady(),
      },
      features: {
        unlimitedWorkouts: effectivePlan === SubscriptionPlan.PREMIUM,
        fullHistory: effectivePlan === SubscriptionPlan.PREMIUM,
        unlimitedAdaptations: effectivePlan === SubscriptionPlan.PREMIUM,
        comparisonEnabled: effectivePlan === SubscriptionPlan.PREMIUM,
        chatHistoryLimit: effectivePlan === SubscriptionPlan.PREMIUM ? 50 : 20,
        maxGeneratedPlans: effectivePlan === SubscriptionPlan.PREMIUM ? null : 1,
      },
    };
  }

  private buildDefaultFreeSubscription(userId: string) {
    return {
      userId,
      plan: SubscriptionPlan.FREE,
      status: SubscriptionStatus.ACTIVE,
      billingCycleMonths: 1,
      startedAt: new Date(),
      expiresAt: null,
      monthlyMessageLimit: FREE_MONTHLY_MESSAGE_LIMIT,
      monthlyMessagesUsed: 0,
      usagePeriodStartedAt: new Date(),
      paymentProvider: PaymentProvider.MOCK,
      providerCustomerId: `mock-customer-${userId}`,
      providerSubscriptionId: null,
    };
  }

  private assertAiMessageAvailable(subscription: {
    id: string;
    plan: SubscriptionPlan;
    status: SubscriptionStatus;
    billingCycleMonths: number;
    startedAt: Date;
    expiresAt: Date | null;
    monthlyMessageLimit: number;
    monthlyMessagesUsed: number;
    paymentProvider: PaymentProvider;
  }) {
    const status = this.buildStatus(subscription);

    if (status.monthlyMessagesRemaining <= 0) {
      throw new HttpException(
        {
          message:
            "Seu limite mensal de mensagens com IA no plano Free foi atingido. Ative o Premium para continuar.",
          code: "FREE_PLAN_AI_LIMIT_REACHED",
        },
        403,
      );
    }

    return status;
  }

  private isUsageWindowExpired(start: Date, now: Date) {
    return (
      start.getUTCFullYear() !== now.getUTCFullYear() ||
      start.getUTCMonth() !== now.getUTCMonth()
    );
  }

  private async ensureUserExists(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException("User not found.");
    }
  }
}
