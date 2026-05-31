-- CreateEnum
CREATE TYPE "BillingProvider" AS ENUM ('lemon_squeezy', 'wise', 'stripe');

-- CreateEnum
CREATE TYPE "BillingEventStatus" AS ENUM ('pending', 'processed', 'failed', 'ignored');

-- CreateEnum
CREATE TYPE "BillingOrderStatus" AS ENUM ('pending', 'paid', 'refunded', 'cancelled');

-- CreateEnum
CREATE TYPE "BillingPaymentStatus" AS ENUM ('pending', 'paid', 'refunded', 'failed');

-- CreateEnum
CREATE TYPE "BillingSubscriptionStatus" AS ENUM ('active', 'cancelled', 'expired', 'payment_failed');

-- CreateEnum
CREATE TYPE "BillingGrantStatus" AS ENUM ('pending_review', 'granted', 'revoked', 'rejected');

-- CreateTable
CREATE TABLE "BillingEvent" (
    "id" TEXT NOT NULL,
    "provider" "BillingProvider" NOT NULL,
    "providerEventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "status" "BillingEventStatus" NOT NULL DEFAULT 'pending',
    "idempotencyKey" TEXT NOT NULL,
    "rawPayloadHash" TEXT NOT NULL,
    "safePayloadJson" JSONB,
    "errorMessage" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingOrder" (
    "id" TEXT NOT NULL,
    "provider" "BillingProvider" NOT NULL,
    "providerOrderId" TEXT,
    "providerCheckoutId" TEXT,
    "providerCustomerId" TEXT,
    "productId" TEXT,
    "variantId" TEXT,
    "planId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "BillingOrderStatus" NOT NULL DEFAULT 'pending',
    "customerEmail" TEXT,
    "userId" TEXT,
    "workspaceId" TEXT,
    "assessmentId" TEXT,
    "paidAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "providerCreatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingPayment" (
    "id" TEXT NOT NULL,
    "provider" "BillingProvider" NOT NULL,
    "providerPaymentId" TEXT,
    "orderId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "BillingPaymentStatus" NOT NULL DEFAULT 'pending',
    "paidAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingSubscription" (
    "id" TEXT NOT NULL,
    "provider" "BillingProvider" NOT NULL,
    "providerSubscriptionId" TEXT,
    "providerCustomerId" TEXT,
    "planId" TEXT NOT NULL,
    "productId" TEXT,
    "variantId" TEXT,
    "status" "BillingSubscriptionStatus" NOT NULL DEFAULT 'active',
    "customerEmail" TEXT,
    "userId" TEXT,
    "workspaceId" TEXT,
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "expiredAt" TIMESTAMP(3),
    "paymentFailedAt" TIMESTAMP(3),
    "providerCreatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingEntitlementGrant" (
    "id" TEXT NOT NULL,
    "billingOrderId" TEXT,
    "billingSubscriptionId" TEXT,
    "userId" TEXT,
    "workspaceId" TEXT,
    "assessmentId" TEXT,
    "entitlementKey" "EntitlementKey" NOT NULL,
    "status" "BillingGrantStatus" NOT NULL DEFAULT 'pending_review',
    "source" TEXT NOT NULL DEFAULT 'billing_ledger',
    "reviewNotes" TEXT,
    "grantedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingEntitlementGrant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BillingEvent_idempotencyKey_key" ON "BillingEvent"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "BillingEvent_provider_providerEventId_key" ON "BillingEvent"("provider", "providerEventId");

-- CreateIndex
CREATE INDEX "BillingEvent_provider_idx" ON "BillingEvent"("provider");

-- CreateIndex
CREATE INDEX "BillingEvent_eventType_idx" ON "BillingEvent"("eventType");

-- CreateIndex
CREATE INDEX "BillingEvent_status_idx" ON "BillingEvent"("status");

-- CreateIndex
CREATE INDEX "BillingEvent_receivedAt_idx" ON "BillingEvent"("receivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "BillingOrder_provider_providerOrderId_key" ON "BillingOrder"("provider", "providerOrderId");

-- CreateIndex
CREATE INDEX "BillingOrder_provider_idx" ON "BillingOrder"("provider");

-- CreateIndex
CREATE INDEX "BillingOrder_providerCheckoutId_idx" ON "BillingOrder"("providerCheckoutId");

-- CreateIndex
CREATE INDEX "BillingOrder_providerCustomerId_idx" ON "BillingOrder"("providerCustomerId");

-- CreateIndex
CREATE INDEX "BillingOrder_customerEmail_idx" ON "BillingOrder"("customerEmail");

-- CreateIndex
CREATE INDEX "BillingOrder_userId_idx" ON "BillingOrder"("userId");

-- CreateIndex
CREATE INDEX "BillingOrder_workspaceId_idx" ON "BillingOrder"("workspaceId");

-- CreateIndex
CREATE INDEX "BillingOrder_assessmentId_idx" ON "BillingOrder"("assessmentId");

-- CreateIndex
CREATE INDEX "BillingOrder_status_idx" ON "BillingOrder"("status");

-- CreateIndex
CREATE INDEX "BillingOrder_createdAt_idx" ON "BillingOrder"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "BillingPayment_provider_providerPaymentId_key" ON "BillingPayment"("provider", "providerPaymentId");

-- CreateIndex
CREATE INDEX "BillingPayment_provider_idx" ON "BillingPayment"("provider");

-- CreateIndex
CREATE INDEX "BillingPayment_orderId_idx" ON "BillingPayment"("orderId");

-- CreateIndex
CREATE INDEX "BillingPayment_status_idx" ON "BillingPayment"("status");

-- CreateIndex
CREATE INDEX "BillingPayment_paidAt_idx" ON "BillingPayment"("paidAt");

-- CreateIndex
CREATE UNIQUE INDEX "BillingSubscription_provider_providerSubscriptionId_key" ON "BillingSubscription"("provider", "providerSubscriptionId");

-- CreateIndex
CREATE INDEX "BillingSubscription_provider_idx" ON "BillingSubscription"("provider");

-- CreateIndex
CREATE INDEX "BillingSubscription_providerCustomerId_idx" ON "BillingSubscription"("providerCustomerId");

-- CreateIndex
CREATE INDEX "BillingSubscription_customerEmail_idx" ON "BillingSubscription"("customerEmail");

-- CreateIndex
CREATE INDEX "BillingSubscription_userId_idx" ON "BillingSubscription"("userId");

-- CreateIndex
CREATE INDEX "BillingSubscription_workspaceId_idx" ON "BillingSubscription"("workspaceId");

-- CreateIndex
CREATE INDEX "BillingSubscription_status_idx" ON "BillingSubscription"("status");

-- CreateIndex
CREATE INDEX "BillingSubscription_currentPeriodEnd_idx" ON "BillingSubscription"("currentPeriodEnd");

-- CreateIndex
CREATE INDEX "BillingEntitlementGrant_billingOrderId_idx" ON "BillingEntitlementGrant"("billingOrderId");

-- CreateIndex
CREATE INDEX "BillingEntitlementGrant_billingSubscriptionId_idx" ON "BillingEntitlementGrant"("billingSubscriptionId");

-- CreateIndex
CREATE INDEX "BillingEntitlementGrant_userId_idx" ON "BillingEntitlementGrant"("userId");

-- CreateIndex
CREATE INDEX "BillingEntitlementGrant_workspaceId_idx" ON "BillingEntitlementGrant"("workspaceId");

-- CreateIndex
CREATE INDEX "BillingEntitlementGrant_assessmentId_idx" ON "BillingEntitlementGrant"("assessmentId");

-- CreateIndex
CREATE INDEX "BillingEntitlementGrant_entitlementKey_idx" ON "BillingEntitlementGrant"("entitlementKey");

-- CreateIndex
CREATE INDEX "BillingEntitlementGrant_status_idx" ON "BillingEntitlementGrant"("status");

-- CreateIndex
CREATE INDEX "BillingEntitlementGrant_createdAt_idx" ON "BillingEntitlementGrant"("createdAt");

-- AddForeignKey
ALTER TABLE "BillingOrder" ADD CONSTRAINT "BillingOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingOrder" ADD CONSTRAINT "BillingOrder_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingOrder" ADD CONSTRAINT "BillingOrder_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingPayment" ADD CONSTRAINT "BillingPayment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "BillingOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingSubscription" ADD CONSTRAINT "BillingSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingSubscription" ADD CONSTRAINT "BillingSubscription_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingEntitlementGrant" ADD CONSTRAINT "BillingEntitlementGrant_billingOrderId_fkey" FOREIGN KEY ("billingOrderId") REFERENCES "BillingOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingEntitlementGrant" ADD CONSTRAINT "BillingEntitlementGrant_billingSubscriptionId_fkey" FOREIGN KEY ("billingSubscriptionId") REFERENCES "BillingSubscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingEntitlementGrant" ADD CONSTRAINT "BillingEntitlementGrant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingEntitlementGrant" ADD CONSTRAINT "BillingEntitlementGrant_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingEntitlementGrant" ADD CONSTRAINT "BillingEntitlementGrant_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
