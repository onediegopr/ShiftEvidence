CREATE TYPE "SupportRequestSource" AS ENUM ('public_support_page', 'user_dashboard', 'assessment_detail', 'admin_internal');

CREATE TYPE "SupportRequestCategory" AS ENUM ('general_question', 'assessment_report_question', 'technical_issue', 'billing_question', 'partner_msp_inquiry', 'security_privacy', 'data_deletion_request');

CREATE TYPE "SupportRequestStatus" AS ENUM ('open', 'triage', 'waiting_on_user', 'resolved', 'closed');

CREATE TYPE "SupportRequestPriority" AS ENUM ('low', 'normal', 'high', 'urgent');

CREATE TABLE "SupportRequest" (
    "id" TEXT NOT NULL,
    "source" "SupportRequestSource" NOT NULL DEFAULT 'public_support_page',
    "category" "SupportRequestCategory" NOT NULL DEFAULT 'general_question',
    "status" "SupportRequestStatus" NOT NULL DEFAULT 'open',
    "priority" "SupportRequestPriority" NOT NULL DEFAULT 'normal',
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "companyName" TEXT,
    "userId" TEXT,
    "workspaceId" TEXT,
    "assessmentId" TEXT,
    "adminNotes" TEXT,
    "metadataJson" JSONB,
    "resolvedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SupportRequest_status_idx" ON "SupportRequest"("status");
CREATE INDEX "SupportRequest_priority_idx" ON "SupportRequest"("priority");
CREATE INDEX "SupportRequest_category_idx" ON "SupportRequest"("category");
CREATE INDEX "SupportRequest_source_idx" ON "SupportRequest"("source");
CREATE INDEX "SupportRequest_userId_idx" ON "SupportRequest"("userId");
CREATE INDEX "SupportRequest_workspaceId_idx" ON "SupportRequest"("workspaceId");
CREATE INDEX "SupportRequest_assessmentId_idx" ON "SupportRequest"("assessmentId");
CREATE INDEX "SupportRequest_createdAt_idx" ON "SupportRequest"("createdAt");

ALTER TABLE "SupportRequest" ADD CONSTRAINT "SupportRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SupportRequest" ADD CONSTRAINT "SupportRequest_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SupportRequest" ADD CONSTRAINT "SupportRequest_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
