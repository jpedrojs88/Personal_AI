import { Injectable } from "@nestjs/common";
import { AiCoachService } from "./ai-coach.service";
import type { AiCoachQuestionnaire } from "./ai-coach.types";

const weekdayLabels = [
  "Domingo",
  "Segunda-feira",
  "Terca-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sabado",
];

@Injectable()
export class AiService {
  constructor(private readonly aiCoachService: AiCoachService) {}

  async generateWorkoutPlan(profile: {
    age: number;
    sex: string;
    weight?: number;
    weightKg?: number;
    height?: number;
    heightCm?: number;
    goal: string;
    experienceLevel: string;
    trainingDays?: number[] | string[];
    availableDays?: string[];
    trainingLocation?: string;
  }) {
    const questionnaire: AiCoachQuestionnaire = {
      age: profile.age,
      sex: (profile.sex?.toLowerCase() ?? "other") as "male" | "female" | "other",
      weight: profile.weight ?? profile.weightKg ?? 70,
      height: profile.height ?? profile.heightCm ?? 170,
      goal: (profile.goal?.toLowerCase() ?? "hypertrophy") as
        | "hypertrophy"
        | "weight_loss"
        | "strength"
        | "conditioning",
      experienceLevel: (profile.experienceLevel?.toLowerCase() ?? "beginner") as
        | "beginner"
        | "intermediate"
        | "advanced",
      availableDays:
        profile.availableDays ??
        profile.trainingDays?.map((day) =>
          typeof day === "number" ? weekdayLabels[day] ?? `Dia ${day}` : day,
        ) ?? ["Segunda-feira", "Quarta-feira"],
      trainingLocation: (profile.trainingLocation?.toLowerCase() ?? "gym") as "gym" | "home",
    };

    const result = await this.aiCoachService.generateWorkoutPlan(questionnaire);
    return result.plan;
  }

  async generateChatReply(input: {
    message: string;
    goal: string;
    workoutTitle: string;
  }) {
    const result = await this.aiCoachService.replyToChat({
      message: input.message,
      currentPlanTitle: input.workoutTitle,
      questionnaire: {
        goal: input.goal.toLowerCase() as
          | "hypertrophy"
          | "weight_loss"
          | "strength"
          | "conditioning",
      },
    });

    return result.reply;
  }
}
