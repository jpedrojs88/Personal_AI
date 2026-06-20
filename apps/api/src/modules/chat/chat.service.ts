import { Injectable } from "@nestjs/common";
import { AiCoachService } from "../ai/ai-coach.service";
import { BillingService } from "../billing/billing.service";
import type { AiCoachQuestionnaire } from "../ai/ai-coach.types";
import { ProfileService } from "../profile/profile.service";
import { WorkoutsService } from "../workouts/workouts.service";

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
export class ChatService {
  constructor(
    private readonly aiCoachService: AiCoachService,
    private readonly billingService: BillingService,
    private readonly profileService: ProfileService,
    private readonly workoutsService: WorkoutsService,
  ) {}

  async getMessages(userId: string) {
    const billingStatus = await this.billingService.getStatus(userId);
    return this.aiCoachService.getChatHistory(userId, billingStatus.features.chatHistoryLimit);
  }

  async reply(userId: string, message: string) {
    const billingStatus = await this.billingService.ensureAiMessageAvailable(userId);
    const [profileResult, todayWorkout] = await Promise.all([
      this.profileService.getProfile(userId),
      this.workoutsService.getTodayWorkout(userId),
    ]);
    const questionnaire: Partial<AiCoachQuestionnaire> | undefined = profileResult?.profile
      ? {
          age: profileResult.profile.age,
          sex: profileResult.profile.sex as AiCoachQuestionnaire["sex"],
          weight: profileResult.profile.weightKg,
          height: profileResult.profile.heightCm,
          goal: profileResult.profile.goal as AiCoachQuestionnaire["goal"],
          experienceLevel:
            profileResult.profile.experienceLevel as AiCoachQuestionnaire["experienceLevel"],
          availableDays: profileResult.profile.trainingDays.map(
            (day) => weekdayLabels[day] ?? `Dia ${String(day)}`,
          ),
          trainingLocation:
            profileResult.profile.trainingLocation as AiCoachQuestionnaire["trainingLocation"],
        }
      : undefined;

    const result = await this.aiCoachService.replyToChat({
      userId,
      message,
      currentPlanTitle: todayWorkout?.day?.title ?? "Seu treino atual",
      questionnaire,
    });

    await this.billingService.consumeAiMessage(userId);

    const messages = await this.aiCoachService.getChatHistory(
      userId,
      billingStatus.features.chatHistoryLimit,
    );
    return messages[messages.length - 1] ?? { role: "ASSISTANT", content: result.reply };
  }
}
