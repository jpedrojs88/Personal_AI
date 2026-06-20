export type Goal =
  | "hypertrophy"
  | "weight_loss"
  | "strength"
  | "conditioning";

export type ExperienceLevel = "beginner" | "intermediate" | "advanced";

export type TrainingLocation = "gym" | "home";

export type Sex = "male" | "female" | "other";

export interface ProfileFormData {
  age: number;
  sex: Sex;
  weightKg: number;
  heightCm: number;
  goal: Goal;
  experienceLevel: ExperienceLevel;
  trainingDays: number[];
  trainingLocation: TrainingLocation;
}

export interface WorkoutExerciseView {
  id: string;
  name: string;
  muscleGroup: string;
  sets: number;
  reps: string;
  restSeconds: number;
  notes?: string | null;
}
