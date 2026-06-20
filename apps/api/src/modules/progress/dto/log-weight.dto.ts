import { IsNumber, Max, Min } from "class-validator";

export class LogWeightDto {
  @IsNumber()
  @Min(35)
  @Max(250)
  weightKg!: number;
}
