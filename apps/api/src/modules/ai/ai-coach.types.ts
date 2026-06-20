export type AiCoachSex = "male" | "female" | "other";
export type AiCoachGoal =
  | "hypertrophy"
  | "weight_loss"
  | "strength"
  | "conditioning";
export type AiCoachExperience = "beginner" | "intermediate" | "advanced";
export type AiCoachTrainingLocation = "gym" | "home";

export interface AiCoachQuestionnaire {
  age: number;
  sex: AiCoachSex;
  weight: number;
  height: number;
  goal: AiCoachGoal;
  experienceLevel: AiCoachExperience;
  availableDays: string[];
  trainingLocation: AiCoachTrainingLocation;
}

export interface AiCoachWorkoutExercise {
  exerciseName: string;
  sets: number;
  reps: string;
  restTime: number;
}

export interface AiCoachWorkoutDay {
  dayName: string;
  focus: string;
  exercises: AiCoachWorkoutExercise[];
}

export interface AiCoachWorkoutPlan {
  title: string;
  disclaimer: string;
  weeklySplit: AiCoachWorkoutDay[];
}

export interface AiCoachChatRequest {
  message: string;
  questionnaire?: Partial<AiCoachQuestionnaire>;
  currentPlanTitle?: string;
}
