-- CreateEnum
CREATE TYPE "AssessmentAdvisorMemoryItemType" AS ENUM (
    'decision',
    'open_question',
    'resolved_question',
    'assumption',
    'risk_interpretation',
    'customer_preference',
    'evidence_note',
    'next_step',
    'advisor_recommendation',
    'constraint',
    'summary'
);

-- CreateEnum
CREATE TYPE "AssessmentAdvisorMemoryItemStatus" AS ENUM (
    'active',
    'resolved',
    'superseded',
    'rejected',
    'needs_review',
    'archived'
);

-- CreateEnum
CREATE TYPE "AssessmentAdvisorMemorySourceType" AS ENUM (
    'user_message',
    'advisor_message',
    'system_generated',
    'assessment_state',
    'client_context',
    'storage_analysis',
    'licensing_analysis',
    'manual_admin'
);

-- CreateEnum
CREATE TYPE "AssessmentAdvisorMemoryTruthStatus" AS ENUM (
    'confirmed',
    'customer_reported',
    'inferred',
    'missing',
    'advisor_generated',
    'user_confirmed'
);

-- CreateTable
CREATE TABLE "AssessmentAdvisorMemoryItem" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "conversationId" TEXT,
    "sourceMessageId" TEXT,
    "createdByUserId" TEXT,
    "type" "AssessmentAdvisorMemoryItemType" NOT NULL,
    "status" "AssessmentAdvisorMemoryItemStatus" NOT NULL DEFAULT 'needs_review',
    "sourceType" "AssessmentAdvisorMemorySourceType" NOT NULL,
    "truthStatus" "AssessmentAdvisorMemoryTruthStatus" NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "detailsJson" JSONB,
    "tagsJson" JSONB,
    "relatedEntityJson" JSONB,
    "confidence" INTEGER,
    "version" INTEGER NOT NULL DEFAULT 1,
    "supersedesId" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentAdvisorMemoryItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AssessmentAdvisorMemoryItem_assessmentId_status_idx" ON "AssessmentAdvisorMemoryItem"("assessmentId", "status");

-- CreateIndex
CREATE INDEX "AssessmentAdvisorMemoryItem_workspaceId_type_idx" ON "AssessmentAdvisorMemoryItem"("workspaceId", "type");

-- CreateIndex
CREATE INDEX "AssessmentAdvisorMemoryItem_assessmentId_type_status_idx" ON "AssessmentAdvisorMemoryItem"("assessmentId", "type", "status");

-- CreateIndex
CREATE INDEX "AssessmentAdvisorMemoryItem_sourceMessageId_idx" ON "AssessmentAdvisorMemoryItem"("sourceMessageId");

-- CreateIndex
CREATE INDEX "AssessmentAdvisorMemoryItem_supersedesId_idx" ON "AssessmentAdvisorMemoryItem"("supersedesId");

-- AddForeignKey
ALTER TABLE "AssessmentAdvisorMemoryItem" ADD CONSTRAINT "AssessmentAdvisorMemoryItem_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentAdvisorMemoryItem" ADD CONSTRAINT "AssessmentAdvisorMemoryItem_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentAdvisorMemoryItem" ADD CONSTRAINT "AssessmentAdvisorMemoryItem_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "AssessmentAdvisorConversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentAdvisorMemoryItem" ADD CONSTRAINT "AssessmentAdvisorMemoryItem_sourceMessageId_fkey" FOREIGN KEY ("sourceMessageId") REFERENCES "AssessmentAdvisorMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentAdvisorMemoryItem" ADD CONSTRAINT "AssessmentAdvisorMemoryItem_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentAdvisorMemoryItem" ADD CONSTRAINT "AssessmentAdvisorMemoryItem_supersedesId_fkey" FOREIGN KEY ("supersedesId") REFERENCES "AssessmentAdvisorMemoryItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
