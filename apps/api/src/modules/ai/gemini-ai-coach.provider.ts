import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type {
  AiCoachProvider,
} from "./ai-coach.provider";
import type {
  AiCoachChatRequest,
  AiCoachWorkoutPlan,
  AiCoachQuestionnaire,
} from "./ai-coach.types";

@Injectable()
export class GeminiAiCoachProvider implements AiCoachProvider {
  private readonly logger = new Logger(GeminiAiCoachProvider.name);

  constructor(private readonly configService: ConfigService) {}

  async generateWorkoutPlan(questionnaire: AiCoachQuestionnaire): Promise<AiCoachWorkoutPlan> {
    const prompt = `
Voce e o AI Coach do app Personal IA.
Seu papel e montar treinos para usuarios comuns de academia.
Restricoes obrigatorias:
- Nunca faca diagnostico medico.
- Nunca prometa resultados.
- Mantenha o tom educacional e prudente.
- Considere apenas os dados enviados.
- Responda somente JSON valido.

Dados do usuario:
${JSON.stringify(questionnaire)}

Formato de resposta:
{
  "title": "string",
  "disclaimer": "string",
  "weeklySplit": [
    {
      "dayName": "string",
      "focus": "string",
      "exercises": [
        {
          "exerciseName": "string",
          "sets": 3,
          "reps": "8-12",
          "restTime": 60
        }
      ]
    }
  ]
}
    `.trim();

    const response = await this.generateText(prompt);
    return JSON.parse(this.extractJson(response)) as AiCoachWorkoutPlan;
  }

  async replyToChat(input: AiCoachChatRequest): Promise<string> {
    const prompt = `
Voce e o AI Coach do app Personal IA.
Seu papel e responder em portugues do Brasil sobre treino.
Restricoes:
- Nunca faca diagnostico medico.
- Nunca prometa resultados.
- Se houver dor aguda ou suspeita de lesao, recomende avaliacao presencial.
- Ajude com troca de exercicios, treino mais rapido, treino para viagem e adaptacao de treino.

Contexto:
${JSON.stringify(input)}

Responda de forma objetiva.
    `.trim();

    return this.generateText(prompt);
  }

  private async generateText(prompt: string) {
    const apiKey = this.configService.get<string>("GEMINI_API_KEY");
    const model = this.configService.get<string>("GEMINI_MODEL", "gemini-3.5-flash");

    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured.");
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        }),
      },
    );

    if (!response.ok) {
      const body = await response.text();
      this.logger.warn(`Gemini request failed with status ${response.status}: ${body}`);
      throw new Error("Gemini request failed.");
    }

    const data = (await response.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{ text?: string }>;
        };
      }>;
    };

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!text) {
      throw new Error("Gemini response was empty.");
    }

    return text;
  }

  private extractJson(value: string) {
    const fenced = value.match(/```json\s*([\s\S]*?)```/i);
    return fenced?.[1]?.trim() ?? value.trim();
  }
}
