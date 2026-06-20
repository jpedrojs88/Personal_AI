import { Controller, Headers, HttpCode, Post, Req } from "@nestjs/common";
import type { Request } from "express";
import { PaymentsService } from "./payments.service";

type StripeWebhookRequest = Request & {
  rawBody?: Buffer;
};

@Controller("payments")
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post("stripe/webhook")
  @HttpCode(200)
  handleStripeWebhook(
    @Headers("stripe-signature") signature: string | string[] | undefined,
    @Req() request: StripeWebhookRequest,
  ) {
    const rawBody =
      request.rawBody ??
      Buffer.from(typeof request.body === "string" ? request.body : JSON.stringify(request.body ?? {}));

    return this.paymentsService.handleStripeWebhook(signature, rawBody);
  }
}
