import { Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../prisma/prisma.service";
import type { AiCoachProvider } from "./ai-coach.provider";
import type {
  AiCoachChatRequest,
  AiCoachQuestionnaire,
} from "./ai-coach.types";
import { GeminiAiCoachProvider } from "./gemini-ai-coach.provider";
import { MockAiCoachProvider } from "./mock-ai-coach.provider";

@Injectable()
export class AiCoachService {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly geminiProvider: GeminiAiCoachProvider,
    private readonly mockProvider: MockAiCoachProvider,
  ) {}

  async generateWorkoutPlan(questionnaire: AiCoachQuestionnaire) {
    const plan = await this.withFallback((provider) => provider.generateWorkoutPlan(questionnaire));

    return {
      provider: this.hasGeminiConfig() ? "gemini-with-fallback" : "mock",
      plan,
    };
  }

  async replyToChat(input: AiCoachChatRequest & { userId?: string }) {
    if (input.userId) {
      await this.ensureUserExists(input.userId);
      await this.prisma.aiChatMessage.create({
        data: {
          userId: input.userId,
          role: "USER",
          content: input.message,
        },
      });
    }

    const reply = await this.withFallback((provider) => provider.replyToChat(input));

    if (input.userId) {
      await this.prisma.aiChatMessage.create({
        data: {
          userId: input.userId,
          role: "ASSISTANT",
          content: reply,
        },
      });
    }

    return {
      provider: this.hasGeminiConfig() ? "gemini-with-fallback" : "mock",
      reply,
    };
  }

  async getChatHistory(userId: string, limit = 50) {
    return this.prisma.aiChatMessage.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      take: limit,
    });
  }

  private async withFallback<T>(
    operation: (provider: AiCoachProvider) => Promise<T>,
  ): Promise<T> {
    if (!this.hasGeminiConfig()) {
      return operation(this.mockProvider);
    }

    try {
      return await operation(this.geminiProvider);
    } catch {
      return operation(this.mockProvider);
    }
  }

  private hasGeminiConfig() {
    return Boolean(this.configService.get<string>("GEMINI_API_KEY"));
  }

  private async ensureUserExists(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException("Usuario nao encontrado para salvar o historico do Coach IA.");
    }
  }
}
