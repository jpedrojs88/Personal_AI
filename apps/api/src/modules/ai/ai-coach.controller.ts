import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { AiCoachService } from "./ai-coach.service";
import { AiCoachChatDto } from "./dto/ai-coach-chat.dto";
import { GenerateWorkoutPlanDto } from "./dto/generate-workout-plan.dto";

@Controller("ai-coach")
export class AiCoachController {
  constructor(private readonly aiCoachService: AiCoachService) {}

  @Post("generate-plan")
  generatePlan(@Body() dto: GenerateWorkoutPlanDto) {
    return this.aiCoachService.generateWorkoutPlan(dto);
  }

  @Post("chat")
  chat(@Body() dto: AiCoachChatDto) {
    return this.aiCoachService.replyToChat({
      userId: dto.userId,
      message: dto.message,
      currentPlanTitle: dto.currentPlanTitle,
      questionnaire: {
        age: dto.age,
        sex: dto.sex as "male" | "female" | "other" | undefined,
        weight: dto.weight,
        height: dto.height,
        goal: dto.goal as
          | "hypertrophy"
          | "weight_loss"
          | "strength"
          | "conditioning"
          | undefined,
        experienceLevel: dto.experienceLevel as
          | "beginner"
          | "intermediate"
          | "advanced"
          | undefined,
        availableDays: dto.availableDays,
        trainingLocation: dto.trainingLocation as "gym" | "home" | undefined,
      },
    });
  }

  @Get("chat/:userId")
  getChatHistory(@Param("userId") userId: string) {
    return this.aiCoachService.getChatHistory(userId);
  }
}
