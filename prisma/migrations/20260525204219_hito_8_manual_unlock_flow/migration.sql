-- CreateEnum
CREATE TYPE "UnlockRequestStatus" AS ENUM ('pending', 'approved', 'rejected', 'fulfilled', 'cancelled');

-- CreateEnum
CREATE TYPE "UnlockRequestType" AS ENUM ('readiness_report', 'readiness_report_pro', 'storage_addon', 'technical_review');

-- CreateTable
CREATE TABLE "UnlockRequest" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "requestedType" "UnlockRequestType" NOT NULL,
    "status" "UnlockRequestStatus" NOT NULL DEFAULT 'pending',
    "amountCents" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "contactEmail" TEXT,
    "notes" TEXT,
    "adminNotes" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "fulfilledAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UnlockRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UnlockRequest_assessmentId_idx" ON "UnlockRequest"("assessmentId");

-- CreateIndex
CREATE INDEX "UnlockRequest_workspaceId_idx" ON "UnlockRequest"("workspaceId");

-- CreateIndex
CREATE INDEX "UnlockRequest_userId_idx" ON "UnlockRequest"("userId");

-- CreateIndex
CREATE INDEX "UnlockRequest_requestedType_idx" ON "UnlockRequest"("requestedType");

-- CreateIndex
CREATE INDEX "UnlockRequest_status_idx" ON "UnlockRequest"("status");

-- CreateIndex
CREATE INDEX "UnlockRequest_createdAt_idx" ON "UnlockRequest"("createdAt");

-- AddForeignKey
ALTER TABLE "UnlockRequest" ADD CONSTRAINT "UnlockRequest_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnlockRequest" ADD CONSTRAINT "UnlockRequest_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnlockRequest" ADD CONSTRAINT "UnlockRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
