import { Injectable } from "@nestjs/common";
import type {
  AiCoachProvider,
} from "./ai-coach.provider";
import type {
  AiCoachChatRequest,
  AiCoachWorkoutPlan,
  AiCoachQuestionnaire,
} from "./ai-coach.types";

@Injectable()
export class MockAiCoachProvider implements AiCoachProvider {
  async generateWorkoutPlan(questionnaire: AiCoachQuestionnaire): Promise<AiCoachWorkoutPlan> {
    const focusMap = {
      hypertrophy: "hipertrofia",
      weight_loss: "gasto calorico",
      strength: "forca",
      conditioning: "condicionamento",
    } as const;

    const gymDays = [
      {
        focus: "Peito, ombros e triceps",
        exercises: [
          { exerciseName: "Supino maquina", sets: 3, reps: "8-12", restTime: 75 },
          { exerciseName: "Desenvolvimento sentado", sets: 3, reps: "8-12", restTime: 75 },
          { exerciseName: "Triceps corda", sets: 3, reps: "10-12", restTime: 60 },
        ],
      },
      {
        focus: "Pernas completas",
        exercises: [
          { exerciseName: "Leg press", sets: 4, reps: "10-12", restTime: 90 },
          { exerciseName: "Mesa flexora", sets: 3, reps: "10-12", restTime: 60 },
          { exerciseName: "Panturrilha sentado", sets: 3, reps: "12-15", restTime: 45 },
        ],
      },
      {
        focus: "Costas e biceps",
        exercises: [
          { exerciseName: "Puxada frente", sets: 3, reps: "8-12", restTime: 75 },
          { exerciseName: "Remada baixa", sets: 3, reps: "8-12", restTime: 75 },
          { exerciseName: "Rosca direta", sets: 3, reps: "10-12", restTime: 60 },
        ],
      },
    ];

    const homeDays = [
      {
        focus: "Empurrar e core",
        exercises: [
          { exerciseName: "Flexao inclinada", sets: 3, reps: "10-15", restTime: 60 },
          { exerciseName: "Desenvolvimento com halteres", sets: 3, reps: "10-12", restTime: 60 },
          { exerciseName: "Prancha", sets: 3, reps: "30-45s", restTime: 45 },
        ],
      },
      {
        focus: "Pernas e gluteos",
        exercises: [
          { exerciseName: "Agachamento goblet", sets: 4, reps: "10-12", restTime: 75 },
          { exerciseName: "Afundo alternado", sets: 3, reps: "10-12", restTime: 60 },
          { exerciseName: "Elevacao de panturrilha", sets: 3, reps: "15-20", restTime: 45 },
        ],
      },
      {
        focus: "Puxar e core",
        exercises: [
          { exerciseName: "Remada unilateral", sets: 3, reps: "10-12", restTime: 60 },
          { exerciseName: "Rosca martelo", sets: 3, reps: "10-12", restTime: 60 },
          { exerciseName: "Dead bug", sets: 3, reps: "10-12", restTime: 45 },
        ],
      },
    ];

    const templates = questionnaire.trainingLocation === "home" ? homeDays : gymDays;

    return {
      title: `Plano ${questionnaire.trainingLocation === "home" ? "Casa" : "Academia"} ${questionnaire.availableDays.length}x`,
      disclaimer:
        "Treino gerado como apoio educacional. O Coach IA nao faz diagnostico medico nem promete resultados.",
      weeklySplit: questionnaire.availableDays.map((dayName, index) => ({
        dayName,
        focus: templates[index % templates.length].focus,
        exercises: templates[index % templates.length].exercises.map((exercise) => ({
          ...exercise,
          sets: questionnaire.experienceLevel === "advanced" ? exercise.sets + 1 : exercise.sets,
          reps:
            questionnaire.goal === "strength"
              ? "5-8"
              : questionnaire.goal === "weight_loss"
                ? "12-15"
                : exercise.reps,
        })),
      })),
    };
  }

  async replyToChat(input: AiCoachChatRequest): Promise<string> {
    const message = input.message.toLowerCase();
    const goal = input.questionnaire?.goal ?? "consistencia";
    const location = input.questionnaire?.trainingLocation ?? "academia";

    if (message.includes("troca") || message.includes("trocar")) {
      return `Posso trocar um exercicio mantendo o mesmo padrao de movimento. Se voce treina em ${location}, eu priorizo uma substituicao equivalente e adequada ao objetivo de ${goal}.`;
    }

    if (message.includes("rapido") || message.includes("rápido") || message.includes("tempo")) {
      return "Versao rapida: mantenha o primeiro exercicio principal, una os dois seguintes em circuito e reduza os descansos para 45-60 segundos.";
    }

    if (message.includes("viagem")) {
      return "Para viagem, posso converter o treino para peso corporal, elásticos e halteres leves, mantendo o foco principal da semana.";
    }

    if (message.includes("adapt")) {
      return "Posso adaptar o treino por tempo, equipamento disponivel ou desconforto leve, sempre em carater educacional e sem substituir avaliacao presencial.";
    }

    return "Posso ajudar com troca de exercicios, treino mais rapido, treino para viagem e adaptacoes simples. Se houver dor aguda ou lesao, procure avaliacao presencial.";
  }
}
