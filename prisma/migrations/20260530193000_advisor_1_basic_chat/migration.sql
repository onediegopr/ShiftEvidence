-- ADVISOR-1 Senior Migration Advisor basic persistent chat.
-- Non-destructive migration: dedicated optional advisor chat tables, enums and indexes only.

CREATE TYPE "AssessmentAdvisorConversationStatus" AS ENUM (
    'active',
    'archived'
);

CREATE TYPE "AssessmentAdvisorMessageRole" AS ENUM (
    'user',
    'assistant',
    'system'
);

CREATE TYPE "AssessmentAdvisorMessageStatus" AS ENUM (
    'completed',
    'failed',
    'blocked'
);

CREATE TABLE "AssessmentAdvisorConversation" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "status" "AssessmentAdvisorConversationStatus" NOT NULL DEFAULT 'active',
    "title" TEXT,
    "createdByUserId" TEXT,
    "messageCount" INTEGER NOT NULL DEFAULT 0,
    "creditUsed" INTEGER NOT NULL DEFAULT 0,
    "lastMessageAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentAdvisorConversation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AssessmentAdvisorMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT,
    "role" "AssessmentAdvisorMessageRole" NOT NULL,
    "content" TEXT,
    "sanitizedContent" TEXT NOT NULL,
    "status" "AssessmentAdvisorMessageStatus" NOT NULL DEFAULT 'completed',
    "model" TEXT,
    "provider" TEXT,
    "estimatedInputTokens" INTEGER,
    "estimatedOutputTokens" INTEGER,
    "estimatedCostUsd" DOUBLE PRECISION,
    "creditCost" INTEGER NOT NULL DEFAULT 0,
    "safetyFlagsJson" JSONB,
    "referencedContextJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssessmentAdvisorMessage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AssessmentAdvisorConversation_assessmentId_key" ON "AssessmentAdvisorConversation"("assessmentId");
CREATE INDEX "AssessmentAdvisorConversation_assessmentId_idx" ON "AssessmentAdvisorConversation"("assessmentId");
CREATE INDEX "AssessmentAdvisorConversation_workspaceId_idx" ON "AssessmentAdvisorConversation"("workspaceId");
CREATE INDEX "AssessmentAdvisorConversation_status_idx" ON "AssessmentAdvisorConversation"("status");
CREATE INDEX "AssessmentAdvisorConversation_createdByUserId_idx" ON "AssessmentAdvisorConversation"("createdByUserId");
CREATE INDEX "AssessmentAdvisorConversation_lastMessageAt_idx" ON "AssessmentAdvisorConversation"("lastMessageAt");

CREATE INDEX "AssessmentAdvisorMessage_conversationId_idx" ON "AssessmentAdvisorMessage"("conversationId");
CREATE INDEX "AssessmentAdvisorMessage_assessmentId_idx" ON "AssessmentAdvisorMessage"("assessmentId");
CREATE INDEX "AssessmentAdvisorMessage_workspaceId_idx" ON "AssessmentAdvisorMessage"("workspaceId");
CREATE INDEX "AssessmentAdvisorMessage_userId_idx" ON "AssessmentAdvisorMessage"("userId");
CREATE INDEX "AssessmentAdvisorMessage_role_idx" ON "AssessmentAdvisorMessage"("role");
CREATE INDEX "AssessmentAdvisorMessage_status_idx" ON "AssessmentAdvisorMessage"("status");
CREATE INDEX "AssessmentAdvisorMessage_createdAt_idx" ON "AssessmentAdvisorMessage"("createdAt");

ALTER TABLE "AssessmentAdvisorConversation" ADD CONSTRAINT "AssessmentAdvisorConversation_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssessmentAdvisorConversation" ADD CONSTRAINT "AssessmentAdvisorConversation_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssessmentAdvisorConversation" ADD CONSTRAINT "AssessmentAdvisorConversation_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AssessmentAdvisorMessage" ADD CONSTRAINT "AssessmentAdvisorMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "AssessmentAdvisorConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssessmentAdvisorMessage" ADD CONSTRAINT "AssessmentAdvisorMessage_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssessmentAdvisorMessage" ADD CONSTRAINT "AssessmentAdvisorMessage_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssessmentAdvisorMessage" ADD CONSTRAINT "AssessmentAdvisorMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
