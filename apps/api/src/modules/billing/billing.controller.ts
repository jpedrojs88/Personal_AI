import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import type { AuthenticatedUser } from "../auth/auth-user.type";
import { CurrentUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { BillingCycleDto } from "./dto/billing-cycle.dto";
import { MobilePurchaseValidationDto } from "./dto/mobile-purchase-validation.dto";
import { BillingService } from "./billing.service";

@Controller("billing")
@UseGuards(JwtAuthGuard)
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get("status")
  getStatus(@CurrentUser() user: AuthenticatedUser) {
    return this.billingService.getStatus(user.id);
  }

  @Post("mock/activate-premium")
  activatePremiumForTest(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: BillingCycleDto,
  ) {
    return this.billingService.activatePremiumForTest(user.id, dto.billingCycleMonths);
  }

  @Post("checkout-session")
  createCheckoutSession(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: BillingCycleDto,
  ) {
    return this.billingService.createCheckoutSessionForCycle(user.id, dto.billingCycleMonths);
  }

  @Post("customer-portal")
  createCustomerPortal(@CurrentUser() user: AuthenticatedUser) {
    return this.billingService.createCustomerPortalSession(user.id);
  }

  @Post("mobile/verify")
  verifyMobilePurchase(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: MobilePurchaseValidationDto,
  ) {
    return this.billingService.verifyMobilePurchase(user.id, dto);
  }

  @Post("mock/reset-free")
  resetFreeForTest(@CurrentUser() user: AuthenticatedUser) {
    return this.billingService.resetFreeForTest(user.id);
  }
}
