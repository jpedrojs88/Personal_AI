import { IsIn, IsOptional } from "class-validator";

export class BillingCycleDto {
  @IsOptional()
  @IsIn([1, 3, 6, 12])
  billingCycleMonths?: number;
}
