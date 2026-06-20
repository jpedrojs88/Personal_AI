-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('FREE', 'PREMIUM');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'CANCELED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('MOCK', 'STRIPE', 'MERCADO_PAGO');

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plan" "SubscriptionPlan" NOT NULL DEFAULT 'FREE',
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "monthlyMessageLimit" INTEGER NOT NULL DEFAULT 15,
    "monthlyMessagesUsed" INTEGER NOT NULL DEFAULT 0,
    "usagePeriodStartedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paymentProvider" "PaymentProvider" NOT NULL DEFAULT 'MOCK',
    "providerCustomerId" TEXT,
    "providerSubscriptionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_userId_key" ON "subscriptions"("userId");

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed existing users with a default Free subscription
INSERT INTO "subscriptions" (
    "id",
    "userId",
    "plan",
    "status",
    "startedAt",
    "monthlyMessageLimit",
    "monthlyMessagesUsed",
    "usagePeriodStartedAt",
    "paymentProvider",
    "createdAt",
    "updatedAt"
)
SELECT
    "users"."id" || '-subscription',
    "users"."id",
    'FREE'::"SubscriptionPlan",
    'ACTIVE'::"SubscriptionStatus",
    CURRENT_TIMESTAMP,
    15,
    0,
    CURRENT_TIMESTAMP,
    'MOCK'::"PaymentProvider",
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "users"
WHERE NOT EXISTS (
    SELECT 1
    FROM "subscriptions"
    WHERE "subscriptions"."userId" = "users"."id"
);
