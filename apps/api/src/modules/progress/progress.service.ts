import { Injectable } from "@nestjs/common";
import { BillingService } from "../billing/billing.service";
import { PrismaService } from "../prisma/prisma.service";
import { LogLoadDto } from "./dto/log-load.dto";
import { LogWeightDto } from "./dto/log-weight.dto";
import { ProgressHistoryQueryDto } from "./dto/progress-history-query.dto";

@Injectable()
export class ProgressService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly billingService: BillingService,
  ) {}

  async logWeight(userId: string, dto: LogWeightDto) {
    return this.prisma.bodyMetric.create({
      data: {
        userId,
        weight: dto.weightKg,
      },
    });
  }

  async logLoad(userId: string, dto: LogLoadDto) {
    return this.prisma.workoutLog.create({
      data: {
        userId,
        exerciseName: dto.exerciseName,
        weightUsed: dto.loadKg,
        repsPerformed: dto.reps ?? 0,
      },
    });
  }

  async getHistory(userId: string, query: ProgressHistoryQueryDto) {
    const billingStatus = await this.billingService.getStatus(userId);
    const fullHistoryEnabled = billingStatus.features.fullHistory;
    const comparisonEnabled = billingStatus.features.comparisonEnabled;
    const periodDays =
      fullHistoryEnabled || !query.periodDays
        ? query.periodDays
        : Math.min(query.periodDays, 30);
    const sinceDate = periodDays ? this.daysAgo(periodDays) : undefined;
    const exerciseName =
      comparisonEnabled && query.exerciseName?.trim() ? query.exerciseName.trim() : undefined;
    const weightLimit = fullHistoryEnabled ? 60 : 24;
    const loadLimit = fullHistoryEnabled ? 120 : 60;
    const [weights, loads] = await Promise.all([
      this.prisma.bodyMetric.findMany({
        where: {
          userId,
          ...(sinceDate
            ? {
                createdAt: {
                  gte: sinceDate,
                },
          }
            : {}),
        },
        orderBy: { createdAt: "desc" },
        take: weightLimit,
      }),
      this.prisma.workoutLog.findMany({
        where: {
          userId,
          ...(sinceDate
            ? {
                completedAt: {
                  gte: sinceDate,
                },
          }
            : {}),
        },
        orderBy: { completedAt: "desc" },
        take: loadLimit,
      }),
    ]);

    const currentWeight = weights[0]?.weight ?? null;
    const previousWeight = weights[1]?.weight ?? null;
    const weightDeltaKg =
      currentWeight !== null && previousWeight !== null
        ? Number((currentWeight - previousWeight).toFixed(1))
        : null;

    const strongestLoad = loads.reduce<(typeof loads)[number] | null>(
      (best, entry) => {
        if (!best || entry.weightUsed > best.weightUsed) {
          return entry;
        }

        return best;
      },
      null,
    );

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const weeklyCheckIns = loads.filter((entry) => entry.completedAt >= sevenDaysAgo).length;
    const availableExercises = [...new Set(loads.map((entry) => entry.exerciseName))].sort((a, b) =>
      a.localeCompare(b, "pt-BR"),
    );

    const exerciseMap = new Map<
      string,
      {
        exerciseName: string;
        bestLoadKg: number;
        latestLoadKg: number;
        latestReps: number;
        loggedAt: Date;
      }
    >();

    for (const entry of loads) {
      const current = exerciseMap.get(entry.exerciseName);

      if (!current) {
        exerciseMap.set(entry.exerciseName, {
          exerciseName: entry.exerciseName,
          bestLoadKg: entry.weightUsed,
          latestLoadKg: entry.weightUsed,
          latestReps: entry.repsPerformed,
          loggedAt: entry.completedAt,
        });
        continue;
      }

      current.bestLoadKg = Math.max(current.bestLoadKg, entry.weightUsed);
    }

    const exerciseBests = [...exerciseMap.values()]
      .sort((a, b) => b.bestLoadKg - a.bestLoadKg)
      .slice(0, 6)
      .map((entry) => ({
        exerciseName: entry.exerciseName,
        bestLoadKg: entry.bestLoadKg,
        latestLoadKg: entry.latestLoadKg,
        latestReps: entry.latestReps,
        loggedAt: entry.loggedAt,
      }));

    const comparisonEntries = exerciseName
      ? loads
          .filter((entry) => entry.exerciseName === exerciseName)
          .sort((a, b) => a.completedAt.getTime() - b.completedAt.getTime())
      : [];

    const comparisonFirst = comparisonEntries[0] ?? null;
    const comparisonLatest = comparisonEntries[comparisonEntries.length - 1] ?? null;
    const comparisonDeltaKg =
      comparisonFirst && comparisonLatest && comparisonEntries.length > 1
        ? Number((comparisonLatest.weightUsed - comparisonFirst.weightUsed).toFixed(1))
        : null;

    return {
      access: {
        fullHistory: fullHistoryEnabled,
        comparisonEnabled,
        maxPeriodDays: fullHistoryEnabled ? null : 30,
      },
      filters: {
        periodDays: periodDays ?? null,
        exerciseName: exerciseName ?? null,
      },
      summary: {
        currentWeightKg: currentWeight,
        weightDeltaKg,
        strongestExercise: strongestLoad?.exerciseName ?? null,
        strongestLoadKg: strongestLoad?.weightUsed ?? null,
        totalCheckIns: loads.length,
        weeklyCheckIns,
      },
      availableExercises,
      weights: weights.map((entry) => ({
        id: entry.id,
        weightKg: entry.weight,
        loggedAt: entry.createdAt,
      })),
      loads: loads.map((entry) => ({
        id: entry.id,
        exerciseName: entry.exerciseName,
        loadKg: entry.weightUsed,
        reps: entry.repsPerformed,
        loggedAt: entry.completedAt,
      })),
      completions: loads.map((entry) => ({
        id: entry.id,
        completedAt: entry.completedAt,
        loadKg: entry.weightUsed,
        repsCompleted: entry.repsPerformed,
        workoutExercise: {
          name: entry.exerciseName,
        },
      })),
      exerciseBests,
      exerciseComparison:
        comparisonEnabled && exerciseName && comparisonEntries.length
          ? {
              exerciseName,
              bestLoadKg: Math.max(...comparisonEntries.map((entry) => entry.weightUsed)),
              firstLoadKg: comparisonFirst?.weightUsed ?? null,
              latestLoadKg: comparisonLatest?.weightUsed ?? null,
              loadDeltaKg: comparisonDeltaKg,
              entries: comparisonEntries.map((entry) => ({
                id: entry.id,
                loadKg: entry.weightUsed,
                reps: entry.repsPerformed,
                loggedAt: entry.completedAt,
              })),
            }
          : null,
    };
  }

  private daysAgo(days: number) {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date;
  }
}
