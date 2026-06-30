import {
  PaymentProvider,
  PrismaClient,
  SubscriptionPlan,
  SubscriptionStatus,
} from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { FREE_MONTHLY_MESSAGE_LIMIT } from "../src/modules/billing/billing.constants";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("123456", 10);

  const user = await prisma.user.upsert({
    where: { email: "demo@personalia.app" },
    update: {
      name: "Usuario Demo",
      password,
    },
    create: {
      name: "Usuario Demo",
      email: "demo@personalia.app",
      password,
      profile: {
        create: {
          age: 28,
          sex: "OTHER",
          height: 176,
          weight: 78,
          goal: "HYPERTROPHY",
          experienceLevel: "INTERMEDIATE",
        },
      },
    },
  });

  const existingPlan = await prisma.workoutPlan.findFirst({
    where: { userId: user.id },
  });

  await prisma.subscription.upsert({
    where: { userId: user.id },
    update: {
      plan: SubscriptionPlan.FREE,
      status: SubscriptionStatus.ACTIVE,
      billingCycleMonths: 1,
      monthlyMessageLimit: FREE_MONTHLY_MESSAGE_LIMIT,
      monthlyMessagesUsed: 2,
      paymentProvider: PaymentProvider.MOCK,
      providerCustomerId: `mock-customer-${user.id}`,
    },
    create: {
      userId: user.id,
      plan: SubscriptionPlan.FREE,
      status: SubscriptionStatus.ACTIVE,
      billingCycleMonths: 1,
      monthlyMessageLimit: FREE_MONTHLY_MESSAGE_LIMIT,
      monthlyMessagesUsed: 2,
      paymentProvider: PaymentProvider.MOCK,
      providerCustomerId: `mock-customer-${user.id}`,
    },
  });

  if (!existingPlan) {
    await prisma.workoutPlan.create({
      data: {
        userId: user.id,
        title: "Plano Demo 3x/semana",
        workoutDays: {
          create: [
            {
              dayName: "Segunda-feira",
              workoutExercises: {
                create: [
                  {
                    exerciseName: "Supino maquina",
                    sets: 3,
                    reps: "8-12",
                    restTime: 75,
                  },
                  {
                    exerciseName: "Crucifixo peck deck",
                    sets: 3,
                    reps: "10-12",
                    restTime: 60,
                  },
                  {
                    exerciseName: "Triceps corda",
                    sets: 3,
                    reps: "10-12",
                    restTime: 60,
                  },
                ],
              },
            },
            {
              dayName: "Quarta-feira",
              workoutExercises: {
                create: [
                  {
                    exerciseName: "Leg press",
                    sets: 4,
                    reps: "10-12",
                    restTime: 90,
                  },
                  {
                    exerciseName: "Mesa flexora",
                    sets: 3,
                    reps: "12",
                    restTime: 60,
                  },
                ],
              },
            },
            {
              dayName: "Sexta-feira",
              workoutExercises: {
                create: [
                  {
                    exerciseName: "Puxada frente",
                    sets: 3,
                    reps: "8-12",
                    restTime: 75,
                  },
                  {
                    exerciseName: "Rosca direta",
                    sets: 3,
                    reps: "10-12",
                    restTime: 60,
                  },
                ],
              },
            },
          ],
        },
      },
    });
  }

  const existingWorkoutLog = await prisma.workoutLog.findFirst({
    where: { userId: user.id },
  });

  if (!existingWorkoutLog) {
    await prisma.workoutLog.createMany({
      data: [
        {
          userId: user.id,
          exerciseName: "Supino maquina",
          weightUsed: 35,
          repsPerformed: 10,
        },
        {
          userId: user.id,
          exerciseName: "Leg press",
          weightUsed: 120,
          repsPerformed: 12,
        },
      ],
    });
  }

  const existingBodyMetric = await prisma.bodyMetric.findFirst({
    where: { userId: user.id },
  });

  if (!existingBodyMetric) {
    await prisma.bodyMetric.createMany({
      data: [
        {
          userId: user.id,
          weight: 78,
        },
        {
          userId: user.id,
          weight: 77.4,
          createdAt: new Date("2026-06-08T08:00:00.000Z"),
        },
      ],
    });
  }

  const existingChatMessage = await prisma.aiChatMessage.findFirst({
    where: { userId: user.id },
  });

  if (!existingChatMessage) {
    await prisma.aiChatMessage.createMany({
      data: [
        {
          userId: user.id,
          role: "USER",
          content: "Pode trocar o supino de hoje por outra opcao?",
        },
        {
          userId: user.id,
          role: "ASSISTANT",
          content:
            "Posso sugerir uma alternativa equivalente, como chest press ou flexao inclinada, mantendo a resposta em carater educacional.",
        },
      ],
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
