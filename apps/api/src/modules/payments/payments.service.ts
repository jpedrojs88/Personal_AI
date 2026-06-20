import { randomUUID } from "node:crypto";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PaymentProvider } from "@prisma/client";
import {
  getPremiumOfferForMonths,
  PREMIUM_MONTHLY_MESSAGE_LIMIT,
} from "../billing/billing.constants";

@Injectable()
export class PaymentsService {
  constructor(private readonly configService: ConfigService) {}

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
    return false;
  }

  async createPremiumCheckoutSession(userId: string, billingCycleMonths?: number) {
    const offer = getPremiumOfferForMonths(billingCycleMonths);

    return {
      provider: this.getConfiguredProvider(),
      checkoutReady: this.isCheckoutReady(),
      mockMode: true,
      checkoutUrl: null,
      billingCycleMonths: offer.billingCycleMonths,
      offer,
      message:
        "Gateway de pagamento ainda nao configurado. Use a ativacao Premium para teste enquanto Stripe ou Mercado Pago nao forem conectados.",
      userId,
    };
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
}
