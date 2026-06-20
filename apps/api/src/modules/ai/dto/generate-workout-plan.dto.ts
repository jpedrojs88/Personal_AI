import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsString,
  Max,
  Min,
} from "class-validator";
import type {
  AiCoachExperience,
  AiCoachGoal,
  AiCoachSex,
  AiCoachTrainingLocation,
} from "../ai-coach.types";

enum Sex {
  MALE = "male",
  FEMALE = "female",
  OTHER = "other",
}

enum Goal {
  HYPERTROPHY = "hypertrophy",
  WEIGHT_LOSS = "weight_loss",
  STRENGTH = "strength",
  CONDITIONING = "conditioning",
}

enum ExperienceLevel {
  BEGINNER = "beginner",
  INTERMEDIATE = "intermediate",
  ADVANCED = "advanced",
}

enum TrainingLocation {
  GYM = "gym",
  HOME = "home",
}

export class GenerateWorkoutPlanDto {
  @IsInt()
  @Min(14)
  @Max(100)
  age!: number;

  @IsEnum(Sex)
  sex!: AiCoachSex;

  @IsNumber()
  @Min(35)
  @Max(250)
  weight!: number;

  @IsNumber()
  @Min(130)
  @Max(230)
  height!: number;

  @IsEnum(Goal)
  goal!: AiCoachGoal;

  @IsEnum(ExperienceLevel)
  experienceLevel!: AiCoachExperience;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(7)
  @IsString({ each: true })
  availableDays!: string[];

  @IsEnum(TrainingLocation)
  trainingLocation!: AiCoachTrainingLocation;
}
