import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  Max,
  Min,
} from "class-validator";

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

enum Sex {
  MALE = "male",
  FEMALE = "female",
  OTHER = "other",
}

export class UpsertProfileDto {
  @IsInt()
  @Min(14)
  @Max(100)
  age!: number;

  @IsEnum(Sex)
  sex!: Sex;

  @IsNumber()
  @Min(35)
  @Max(250)
  weightKg!: number;

  @IsNumber()
  @Min(130)
  @Max(230)
  heightCm!: number;

  @IsEnum(Goal)
  goal!: Goal;

  @IsEnum(ExperienceLevel)
  experienceLevel!: ExperienceLevel;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(7)
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  trainingDays!: number[];

  @IsEnum(TrainingLocation)
  trainingLocation!: TrainingLocation;
}
