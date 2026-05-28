-- ADMIN-2B: persistent AI usage telemetry.
-- Safe additive migration: creates a new table and indexes only.

CREATE TABLE "AiUsageEvent" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assessmentId" TEXT,
    "userId" TEXT,
    "provider" TEXT NOT NULL,
    "model" TEXT,
    "operationType" TEXT NOT NULL DEFAULT 'unknown',
    "status" TEXT NOT NULL,
    "durationMs" INTEGER,
    "inputChars" INTEGER,
    "outputChars" INTEGER,
    "estimatedInputTokens" INTEGER,
    "estimatedOutputTokens" INTEGER,
    "estimatedTotalTokens" INTEGER,
    "estimatedCostUsd" DOUBLE PRECISION,
    "errorCategory" TEXT,
    "fallbackUsed" BOOLEAN NOT NULL DEFAULT false,
    "metadataJson" JSONB,

    CONSTRAINT "AiUsageEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AiUsageEvent_createdAt_idx" ON "AiUsageEvent"("createdAt");
CREATE INDEX "AiUsageEvent_userId_idx" ON "AiUsageEvent"("userId");
CREATE INDEX "AiUsageEvent_assessmentId_idx" ON "AiUsageEvent"("assessmentId");
CREATE INDEX "AiUsageEvent_provider_idx" ON "AiUsageEvent"("provider");
CREATE INDEX "AiUsageEvent_status_idx" ON "AiUsageEvent"("status");
CREATE INDEX "AiUsageEvent_operationType_idx" ON "AiUsageEvent"("operationType");

ALTER TABLE "AiUsageEvent"
ADD CONSTRAINT "AiUsageEvent_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AiUsageEvent"
ADD CONSTRAINT "AiUsageEvent_assessmentId_fkey"
FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
