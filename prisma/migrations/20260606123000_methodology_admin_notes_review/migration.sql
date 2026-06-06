-- METHODOLOGY-2B: audited methodology persistence for internal notes, review items and changelog.

CREATE TYPE "MethodologyNotePriority" AS ENUM ('low', 'normal', 'high', 'critical');
CREATE TYPE "MethodologyNoteStatus" AS ENUM ('open', 'incorporated', 'dismissed', 'archived');
CREATE TYPE "MethodologyReviewItemType" AS ENUM ('rule', 'chunk', 'topic', 'domain', 'claim_validator', 'scoring', 'advisor', 'report', 'checklist', 'other');
CREATE TYPE "MethodologyReviewStatus" AS ENUM ('proposed', 'approved', 'rejected', 'implemented', 'archived');

CREATE TABLE "MethodologyAdminNote" (
    "id" TEXT NOT NULL,
    "versionLabel" TEXT,
    "domainKey" TEXT,
    "topicKey" TEXT,
    "ruleCode" TEXT,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "priority" "MethodologyNotePriority" NOT NULL DEFAULT 'normal',
    "status" "MethodologyNoteStatus" NOT NULL DEFAULT 'open',
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MethodologyAdminNote_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MethodologyReviewItem" (
    "id" TEXT NOT NULL,
    "sourceNoteId" TEXT,
    "versionLabel" TEXT NOT NULL,
    "itemType" "MethodologyReviewItemType" NOT NULL,
    "itemKey" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "rationale" TEXT,
    "priority" "MethodologyNotePriority" NOT NULL DEFAULT 'normal',
    "status" "MethodologyReviewStatus" NOT NULL DEFAULT 'proposed',
    "decisionReason" TEXT,
    "decidedBy" TEXT,
    "decidedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MethodologyReviewItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MethodologyChangeLog" (
    "id" TEXT NOT NULL,
    "versionLabel" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "entityKey" TEXT,
    "changeType" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "rationale" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MethodologyChangeLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MethodologyAdminNote_versionLabel_idx" ON "MethodologyAdminNote"("versionLabel");
CREATE INDEX "MethodologyAdminNote_domainKey_idx" ON "MethodologyAdminNote"("domainKey");
CREATE INDEX "MethodologyAdminNote_topicKey_idx" ON "MethodologyAdminNote"("topicKey");
CREATE INDEX "MethodologyAdminNote_ruleCode_idx" ON "MethodologyAdminNote"("ruleCode");
CREATE INDEX "MethodologyAdminNote_status_idx" ON "MethodologyAdminNote"("status");
CREATE INDEX "MethodologyAdminNote_priority_idx" ON "MethodologyAdminNote"("priority");
CREATE INDEX "MethodologyAdminNote_createdAt_idx" ON "MethodologyAdminNote"("createdAt");

CREATE INDEX "MethodologyReviewItem_sourceNoteId_idx" ON "MethodologyReviewItem"("sourceNoteId");
CREATE INDEX "MethodologyReviewItem_versionLabel_idx" ON "MethodologyReviewItem"("versionLabel");
CREATE INDEX "MethodologyReviewItem_itemType_idx" ON "MethodologyReviewItem"("itemType");
CREATE INDEX "MethodologyReviewItem_status_idx" ON "MethodologyReviewItem"("status");
CREATE INDEX "MethodologyReviewItem_createdAt_idx" ON "MethodologyReviewItem"("createdAt");

CREATE INDEX "MethodologyChangeLog_versionLabel_idx" ON "MethodologyChangeLog"("versionLabel");
CREATE INDEX "MethodologyChangeLog_entityType_idx" ON "MethodologyChangeLog"("entityType");
CREATE INDEX "MethodologyChangeLog_entityId_idx" ON "MethodologyChangeLog"("entityId");
CREATE INDEX "MethodologyChangeLog_entityKey_idx" ON "MethodologyChangeLog"("entityKey");
CREATE INDEX "MethodologyChangeLog_changeType_idx" ON "MethodologyChangeLog"("changeType");
CREATE INDEX "MethodologyChangeLog_createdAt_idx" ON "MethodologyChangeLog"("createdAt");

ALTER TABLE "MethodologyReviewItem"
ADD CONSTRAINT "MethodologyReviewItem_sourceNoteId_fkey"
FOREIGN KEY ("sourceNoteId") REFERENCES "MethodologyAdminNote"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
