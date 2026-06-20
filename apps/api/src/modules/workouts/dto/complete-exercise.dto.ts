import { IsNumber, IsOptional, IsString, IsUUID, Max, Min } from "class-validator";

export class CompleteExerciseDto {
  @IsUUID()
  workoutExerciseId!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1000)
  loadKg?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  repsCompleted?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
