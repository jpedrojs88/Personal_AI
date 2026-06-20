import type {
  AiCoachChatRequest,
  AiCoachWorkoutPlan,
  AiCoachQuestionnaire,
} from "./ai-coach.types";

export interface AiCoachProvider {
  generateWorkoutPlan(questionnaire: AiCoachQuestionnaire): Promise<AiCoachWorkoutPlan>;
  replyToChat(input: AiCoachChatRequest): Promise<string>;
}
