import { IsIn, IsOptional, IsString } from "class-validator";

export class ProgressHistoryQueryDto {
  @IsOptional()
  @IsIn([7, 30, 90, 180])
  periodDays?: 7 | 30 | 90 | 180;

  @IsOptional()
  @IsString()
  exerciseName?: string;
}
