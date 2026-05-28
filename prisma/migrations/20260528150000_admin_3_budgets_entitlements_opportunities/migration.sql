-- ADMIN-3: budgets, manual entitlements and commercial opportunities.
-- Safe additive migration: creates new tables and indexes only.

CREATE TABLE "SystemSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "valueJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedByUserId" TEXT,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserEntitlement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planKey" TEXT NOT NULL DEFAULT 'free_preview',
    "status" TEXT NOT NULL DEFAULT 'manual',
    "source" TEXT NOT NULL DEFAULT 'admin',
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "maxAssessments" INTEGER,
    "maxPdfReports" INTEGER,
    "aiEnabled" BOOLEAN NOT NULL DEFAULT false,
    "fullReportEnabled" BOOLEAN NOT NULL DEFAULT false,
    "notesInternal" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdByUserId" TEXT,

    CONSTRAINT "UserEntitlement_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CommercialOpportunity" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "assessmentId" TEXT,
    "score" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'new_lead',
    "tagsJson" JSONB,
    "nextBestAction" TEXT,
    "suggestedPlan" TEXT,
    "notesInternal" TEXT,
    "lastActivityAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedByUserId" TEXT,

    CONSTRAINT "CommercialOpportunity_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SystemSetting_key_key" ON "SystemSetting"("key");
CREATE INDEX "SystemSetting_updatedByUserId_idx" ON "SystemSetting"("updatedByUserId");

CREATE INDEX "UserEntitlement_userId_idx" ON "UserEntitlement"("userId");
CREATE INDEX "UserEntitlement_planKey_idx" ON "UserEntitlement"("planKey");
CREATE INDEX "UserEntitlement_status_idx" ON "UserEntitlement"("status");
CREATE INDEX "UserEntitlement_source_idx" ON "UserEntitlement"("source");
CREATE INDEX "UserEntitlement_expiresAt_idx" ON "UserEntitlement"("expiresAt");

CREATE INDEX "CommercialOpportunity_userId_idx" ON "CommercialOpportunity"("userId");
CREATE INDEX "CommercialOpportunity_assessmentId_idx" ON "CommercialOpportunity"("assessmentId");
CREATE INDEX "CommercialOpportunity_score_idx" ON "CommercialOpportunity"("score");
CREATE INDEX "CommercialOpportunity_status_idx" ON "CommercialOpportunity"("status");
CREATE INDEX "CommercialOpportunity_lastActivityAt_idx" ON "CommercialOpportunity"("lastActivityAt");

ALTER TABLE "UserEntitlement"
ADD CONSTRAINT "UserEntitlement_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
