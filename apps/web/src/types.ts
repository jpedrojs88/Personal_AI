export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
}

export interface Profile {
  id: string;
  userId: string;
  age: number;
  sex: "male" | "female" | "other";
  weightKg: number;
  heightCm: number;
  goal: "hypertrophy" | "weight_loss" | "strength" | "conditioning";
  experienceLevel: "beginner" | "intermediate" | "advanced";
  trainingDays: number[];
  trainingLocation: "gym" | "home";
}

export interface WorkoutExercise {
  id: string;
  name: string;
  muscleGroup: string;
  sets: number;
  reps: string;
  restSeconds: number;
  notes?: string | null;
}

export interface WorkoutDay {
  id: string;
  weekday: number;
  title: string;
  estimatedMinutes: number;
  quickVersion: string;
  exercises: WorkoutExercise[];
}

export interface TodayWorkoutResponse {
  planId: string;
  title: string;
  summary: string;
  day: WorkoutDay;
  completions: Array<{
    id: string;
    workoutExerciseId: string;
    completedAt: string;
    loadKg?: number | null;
    repsCompleted?: number | null;
  }>;
}

export interface ProgressHistory {
  access: {
    fullHistory: boolean;
    comparisonEnabled: boolean;
    maxPeriodDays: number | null;
  };
  filters: {
    periodDays: number | null;
    exerciseName: string | null;
  };
  summary: {
    currentWeightKg: number | null;
    weightDeltaKg: number | null;
    strongestExercise: string | null;
    strongestLoadKg: number | null;
    totalCheckIns: number;
    weeklyCheckIns: number;
  };
  weights: Array<{
    id: string;
    weightKg: number;
    loggedAt: string;
  }>;
  loads: Array<{
    id: string;
    exerciseName: string;
    loadKg: number;
    reps?: number | null;
    loggedAt: string;
  }>;
  completions: Array<{
    id: string;
    completedAt: string;
    loadKg?: number | null;
    repsCompleted?: number | null;
    workoutExercise: {
      name: string;
    };
  }>;
  exerciseBests: Array<{
    exerciseName: string;
    bestLoadKg: number;
    latestLoadKg: number;
    latestReps: number;
    loggedAt: string;
  }>;
  availableExercises: string[];
  exerciseComparison: {
    exerciseName: string;
    bestLoadKg: number;
    firstLoadKg: number | null;
    latestLoadKg: number | null;
    loadDeltaKg: number | null;
    entries: Array<{
      id: string;
      loadKg: number;
      reps: number;
      loggedAt: string;
    }>;
  } | null;
}

export interface ChatMessage {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  createdAt: string;
}

export interface BillingStatus {
  currentPlan: "FREE" | "PREMIUM";
  effectivePlan: "FREE" | "PREMIUM";
  status: "ACTIVE" | "CANCELED" | "EXPIRED";
  currentBillingCycleMonths: number;
  currentBillingCycleLabel: string;
  startedAt: string;
  expiresAt: string | null;
  mockMode: boolean;
  premiumMonthlyPriceBrl: number;
  premiumMonthlyPriceLabel: string;
  premiumOffers: Array<{
    billingCycleMonths: number;
    label: string;
    discountPercent: number;
    baseTotalPriceBrl: number;
    totalPriceBrl: number;
    effectiveMonthlyPriceBrl: number;
    savingsBrl: number;
    totalPriceLabel: string;
    baseTotalPriceLabel: string;
    effectiveMonthlyPriceLabel: string;
    savingsLabel: string;
  }>;
  monthlyMessageLimit: number;
  monthlyMessagesUsed: number;
  monthlyMessagesRemaining: number;
  payment: {
    provider: "MOCK" | "STRIPE" | "MERCADO_PAGO";
    mode: "MOCK" | "TEST" | "LIVE";
    checkoutReady: boolean;
    customerPortalReady: boolean;
    mockActionsEnabled: boolean;
  };
  features: {
    unlimitedWorkouts: boolean;
    fullHistory: boolean;
    unlimitedAdaptations: boolean;
    comparisonEnabled: boolean;
    chatHistoryLimit: number;
    maxGeneratedPlans: number | null;
  };
}
