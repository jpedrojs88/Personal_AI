import { Module } from "@nestjs/common";
import { AiCoachController } from "./ai-coach.controller";
import { AiCoachService } from "./ai-coach.service";
import { AiService } from "./ai.service";
import { GeminiAiCoachProvider } from "./gemini-ai-coach.provider";
import { MockAiCoachProvider } from "./mock-ai-coach.provider";

@Module({
  controllers: [AiCoachController],
  providers: [AiService, AiCoachService, GeminiAiCoachProvider, MockAiCoachProvider],
  exports: [AiService, AiCoachService],
})
export class AiModule {}
