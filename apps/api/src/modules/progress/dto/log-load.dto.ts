import { IsNumber, IsOptional, IsString, Max, Min } from "class-validator";

export class LogLoadDto {
  @IsString()
  exerciseName!: string;

  @IsOptional()
  @IsString()
  workoutExerciseId?: string;

  @IsNumber()
  @Min(0)
  @Max(1000)
  loadKg!: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  reps?: number;
}
