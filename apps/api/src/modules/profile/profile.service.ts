import { Injectable } from "@nestjs/common";
import { ExperienceLevel, Goal, Sex } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { UpsertProfileDto } from "./dto/upsert-profile.dto";

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const [user, latestPlan] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          profile: true,
        },
      }),
      this.prisma.workoutPlan.findFirst({
        where: { userId },
        include: {
          workoutDays: true,
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    if (!user) {
      return null;
    }

    const trainingDays = latestPlan
      ? latestPlan.workoutDays
          .map((day) => this.dayNameToIndex(day.dayName))
          .filter((value): value is NonNullable<typeof value> => value !== null)
          .sort((a, b) => a - b)
      : [];

    const trainingLocation =
      latestPlan?.title.toLowerCase().includes("casa") || latestPlan?.title.toLowerCase().includes("home")
        ? "home"
        : "gym";

    return {
      id: user.id,
      email: user.email,
      displayName: user.name,
      profile: user.profile
        ? {
            id: user.profile.userId,
            userId: user.profile.userId,
            age: user.profile.age,
            sex: user.profile.sex.toLowerCase(),
            weightKg: user.profile.weight,
            heightCm: user.profile.height,
            goal: user.profile.goal.toLowerCase(),
            experienceLevel: user.profile.experienceLevel.toLowerCase(),
            trainingDays,
            trainingLocation,
          }
        : null,
    };
  }

  async upsertProfile(userId: string, dto: UpsertProfileDto) {
    return this.prisma.profile.upsert({
      where: { userId },
      create: {
        userId,
        ...this.toPrismaProfile(dto),
      },
      update: this.toPrismaProfile(dto),
    });
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

  private dayNameToIndex(value: string): number | null {
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
    return null;
  }
}
