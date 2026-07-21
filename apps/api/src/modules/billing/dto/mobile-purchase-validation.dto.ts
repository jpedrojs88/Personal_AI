import { IsIn, IsObject, IsOptional, IsString } from "class-validator";

export class MobilePurchaseValidationDto {
  @IsIn(["ios-appstore", "apple-sk2", "android-playstore"])
  platform!: "ios-appstore" | "apple-sk2" | "android-playstore";

  @IsString()
  productId!: string;

  @IsOptional()
  @IsObject()
  receipt?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  purchaseToken?: string;

  @IsOptional()
  @IsString()
  transactionId?: string;

  @IsOptional()
  @IsString()
  signedTransactionInfo?: string;
}
