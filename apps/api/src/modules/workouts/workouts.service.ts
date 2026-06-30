import { randomUUID } from "node:crypto";
import { ExperienceLevel, Goal, Prisma, Sex } from "@prisma/client";
import { Injectable, NotFoundException } from "@nestjs/common";
import { AiCoachService } from "../ai/ai-coach.service";
import { BillingService } from "../billing/billing.service";
import { PrismaService } from "../prisma/prisma.service";
import { UpsertProfileDto } from "../profile/dto/upsert-profile.dto";

const weekdayLabels = [
  "Domingo",
  "Segunda-feira",
  "Terca-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sabado",
];

type WorkoutPlanSnapshot = {
  id: string;
  userId: string;
  title: string;
  createdAt: Date;
  workoutDays: Array<{
    id: string;
    dayName: string;
    workoutExercises: Array<{
      id: string;
      exerciseName: string;
      sets: number;
      reps: string;
      restTime: number;
    }>;
  }>;
};

@Injectable()
export class WorkoutsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiCoachService: AiCoachService,
    private readonly billingService: BillingService,
  ) {}

  async generatePlanForUser(userId: string, questionnaire: UpsertProfileDto) {
    await this.ensureUserExists(userId);
    const generated = await this.createGeneratedPlan(userId, questionnaire);
    return generated.plan;
  }

  async bootstrapPlanForUser(userId: string, questionnaire: UpsertProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    if (!user) {
      throw new NotFoundException("Usuario nao encontrado.");
    }

    const generated = await this.createGeneratedPlan(userId, questionnaire, true);

    return {
      displayName: user.name,
      profile: {
        id: user.id,
        userId: user.id,
        age: questionnaire.age,
        sex: questionnaire.sex,
        weightKg: questionnaire.weightKg,
        heightCm: questionnaire.heightCm,
        goal: questionnaire.goal,
        experienceLevel: questionnaire.experienceLevel,
        trainingDays: [...questionnaire.trainingDays].sort((a, b) => a - b),
        trainingLocation: questionnaire.trainingLocation,
      },
      todayWorkout: this.buildTodayWorkoutResponse(generated.plan, []),
    };
  }

  async getTodayWorkout(userId: string) {
    const todayName = weekdayLabels[new Date().getDay()] ?? "Segunda-feira";
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const activePlan = await this.prisma.workoutPlan.findFirst({
      where: { userId },
      include: {
        workoutDays: {
          include: {
            workoutExercises: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!activePlan) {
      return null;
    }

    if (!activePlan.workoutDays.length) {
      return null;
    }

    const day =
      activePlan.workoutDays.find((entry) => entry.dayName.toLowerCase().startsWith(todayName.toLowerCase())) ??
      activePlan.workoutDays[0];

    const logs = await this.prisma.workoutLog.findMany({
      where: {
        userId,
        exerciseName: {
          in: day.workoutExercises.map((exercise) => exercise.exerciseName),
        },
        completedAt: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
      orderBy: { completedAt: "desc" },
    });

    const exerciseIdByName = new Map(
      day.workoutExercises.map((exercise) => [exercise.exerciseName, exercise.id]),
    );
    const latestLogsByExercise = new Map<string, (typeof logs)[number]>();

    for (const log of logs) {
      if (!latestLogsByExercise.has(log.exerciseName)) {
        latestLogsByExercise.set(log.exerciseName, log);
      }
    }

    return this.buildTodayWorkoutResponse(activePlan, [...latestLogsByExercise.values()].map((log) => ({
        id: log.id,
        workoutExerciseId: exerciseIdByName.get(log.exerciseName) ?? "",
        completedAt: log.completedAt,
        loadKg: log.weightUsed,
        repsCompleted: log.repsPerformed,
      })));
  }

  async completeExercise(
    userId: string,
    workoutExerciseId: string,
    payload: {
      loadKg?: number;
      repsCompleted?: number;
      notes?: string;
    },
  ) {
    const exercise = await this.prisma.workoutExercise.findUnique({
      where: { id: workoutExerciseId },
    });

    if (!exercise) {
      throw new NotFoundException("Exercicio nao encontrado.");
    }

    const fallbackReps = this.extractFirstNumber(exercise.reps) ?? 0;
    const completion = await this.prisma.workoutLog.create({
      data: {
        userId,
        exerciseName: exercise.exerciseName,
        weightUsed: payload.loadKg ?? 0,
        repsPerformed: payload.repsCompleted ?? fallbackReps,
      },
    });

    return {
      id: completion.id,
      workoutExerciseId,
      completedAt: completion.completedAt,
      loadKg: completion.weightUsed,
      repsCompleted: completion.repsPerformed,
      notes: payload.notes ?? null,
    };
  }

  async getWorkoutHistory(userId: string) {
    const billingStatus = await this.billingService.getStatus(userId);

    return this.prisma.workoutPlan.findMany({
      where: { userId },
      include: {
        workoutDays: {
          include: { workoutExercises: true },
        },
      },
      orderBy: { createdAt: "desc" },
      ...(billingStatus.features.maxGeneratedPlans
        ? { take: billingStatus.features.maxGeneratedPlans }
        : {}),
    });
  }

  private async createGeneratedPlan(
    userId: string,
    questionnaire: UpsertProfileDto,
    persistProfile = false,
  ) {
    const billingStatus = await this.billingService.getStatus(userId);
    const generated = await this.aiCoachService.generateWorkoutPlan({
      age: questionnaire.age,
      sex: questionnaire.sex,
      weight: questionnaire.weightKg,
      height: questionnaire.heightCm,
      goal: questionnaire.goal,
      experienceLevel: questionnaire.experienceLevel,
      availableDays: questionnaire.trainingDays.map((day) => weekdayLabels[day] ?? `Dia ${day}`),
      trainingLocation: questionnaire.trainingLocation,
    });

    const planId = randomUUID();
    const createdAt = new Date();
    const workoutDays = generated.plan.weeklySplit.map((day) => {
      const workoutDayId = randomUUID();

      return {
        id: workoutDayId,
        dayName: `${day.dayName} • ${day.focus}`,
        workoutExercises: day.exercises.map((exercise) => ({
          id: randomUUID(),
          workoutDayId,
          exerciseName: exercise.exerciseName,
          sets: exercise.sets,
          reps: exercise.reps,
          restTime: exercise.restTime,
        })),
      };
    });

    const operations: Prisma.PrismaPromise<unknown>[] = [];

    if (persistProfile) {
      operations.push(
        this.prisma.profile.upsert({
          where: { userId },
          create: {
            userId,
            ...this.toPrismaProfile(questionnaire),
          },
          update: this.toPrismaProfile(questionnaire),
        }),
      );
    }

    if (billingStatus.features.maxGeneratedPlans === 1) {
      operations.push(
        this.prisma.workoutPlan.deleteMany({
          where: { userId },
        }),
      );
    }

    operations.push(
      this.prisma.workoutPlan.create({
        data: {
          id: planId,
          userId,
          title: generated.plan.title,
        },
      }),
    );

    if (workoutDays.length) {
      operations.push(
        this.prisma.workoutDay.createMany({
          data: workoutDays.map((day) => ({
            id: day.id,
            workoutPlanId: planId,
            dayName: day.dayName,
          })),
        }),
      );
    }

    const workoutExercises = workoutDays.flatMap((day) => day.workoutExercises);

    if (workoutExercises.length) {
      operations.push(
        this.prisma.workoutExercise.createMany({
          data: workoutExercises,
        }),
      );
    }

    await this.prisma.$transaction(operations);

    const plan: WorkoutPlanSnapshot = {
      id: planId,
      userId,
      title: generated.plan.title,
      createdAt,
      workoutDays: workoutDays.map((day) => ({
        id: day.id,
        dayName: day.dayName,
        workoutExercises: day.workoutExercises.map((exercise) => ({
          id: exercise.id,
          exerciseName: exercise.exerciseName,
          sets: exercise.sets,
          reps: exercise.reps,
          restTime: exercise.restTime,
        })),
      })),
    };

    return { generated, plan };
  }

  private buildTodayWorkoutResponse(
    activePlan: WorkoutPlanSnapshot,
    completions: Array<{
      id: string;
      workoutExerciseId: string;
      completedAt: Date;
      loadKg: number | null;
      repsCompleted: number | null;
    }>,
  ) {
    const todayName = weekdayLabels[new Date().getDay()] ?? "Segunda-feira";
    const day =
      activePlan.workoutDays.find((entry) => entry.dayName.toLowerCase().startsWith(todayName.toLowerCase())) ??
      activePlan.workoutDays[0];

    return {
      planId: activePlan.id,
      title: activePlan.title,
      summary:
        "Treino gerado pelo Personal IA como apoio educacional. Ajuste com um profissional presencial quando necessario.",
      day: {
        id: day.id,
        weekday: this.dayNameToIndex(day.dayName),
        title: day.dayName,
        estimatedMinutes: Math.max(35, day.workoutExercises.length * 12),
        quickVersion:
          "Versao rapida: faca os dois primeiros exercicios, reduza o descanso e finalize com o principal da sessao.",
        exercises: day.workoutExercises.map((exercise) => ({
          id: exercise.id,
          name: exercise.exerciseName,
          muscleGroup: this.inferMuscleGroup(exercise.exerciseName),
          sets: exercise.sets,
          reps: exercise.reps,
          restSeconds: exercise.restTime,
          notes: "Mantenha execucao controlada e interrompa em caso de dor aguda.",
        })),
      },
      completions,
    };
  }

  private async ensureUserExists(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException("Usuario nao encontrado.");
    }
  }

  private toPrismaProfile(dto: UpsertProfileDto) {
    return {
      age: dto.age,
      sex: dto.sex.toUpperCase() as Sex,
      weight: dto.weightKg,
      height: dto.heightCm,
      goal: dto.goal.toUpperCase() as Goal,
      experienceLevel: dto.experienceLevel.toUpperCase() as ExperienceLevel,
    };
  }

  private dayNameToIndex(value: string) {
    const normalized = value.toLowerCase();

    if (normalized.startsWith("domingo")) return 0;
    if (normalized.startsWith("segunda")) return 1;
    if (normalized.startsWith("terca")) return 2;
    if (normalized.startsWith("terça")) return 2;
    if (normalized.startsWith("quarta")) return 3;
    if (normalized.startsWith("quinta")) return 4;
    if (normalized.startsWith("sexta")) return 5;
    if (normalized.startsWith("sabado")) return 6;
    if (normalized.startsWith("sábado")) return 6;
    return 1;
  }

  private inferMuscleGroup(exerciseName: string) {
    const name = exerciseName.toLowerCase();

    if (name.includes("supino") || name.includes("crucifixo") || name.includes("peito")) return "Peito";
    if (name.includes("triceps")) return "Triceps";
    if (name.includes("ombro") || name.includes("desenvolvimento")) return "Ombros";
    if (name.includes("leg") || name.includes("agach") || name.includes("panturr")) return "Pernas";
    if (name.includes("mesa flexora") || name.includes("stiff")) return "Posterior";
    if (name.includes("remada") || name.includes("puxada")) return "Costas";
    if (name.includes("rosca")) return "Biceps";
    if (name.includes("prancha") || name.includes("dead bug")) return "Core";
    return "Musculacao";
  }

  private extractFirstNumber(value: string) {
    const match = value.match(/\d+/);
    return match ? Number(match[0]) : null;
  }
}
