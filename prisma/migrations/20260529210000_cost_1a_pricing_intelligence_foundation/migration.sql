-- COST-1A Pricing Intelligence foundation.
-- Non-destructive migration: new enums, tables and indexes only.

CREATE TYPE "LicensingPricingVendor" AS ENUM ('vmware', 'proxmox');

CREATE TYPE "LicensingPricingSnapshotStatus" AS ENUM ('draft', 'pending_review', 'approved', 'rejected', 'archived');

CREATE TYPE "LicensingPricingSourceType" AS ENUM ('official', 'manual_admin', 'market_estimate', 'placeholder');

CREATE TYPE "LicensingPricingMetric" AS ENUM ('core', 'socket', 'host', 'node', 'year', 'subscription', 'manual', 'rule');

CREATE TYPE "LicensingPricingRefreshStatus" AS ENUM ('running', 'completed', 'completed_with_warnings', 'failed', 'no_changes');

CREATE TABLE "LicensingPricingSnapshot" (
    "id" TEXT NOT NULL,
    "vendor" "LicensingPricingVendor" NOT NULL,
    "status" "LicensingPricingSnapshotStatus" NOT NULL DEFAULT 'draft',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "sourceName" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "sourceType" "LicensingPricingSourceType" NOT NULL DEFAULT 'placeholder',
    "lastCheckedAt" TIMESTAMP(3),
    "effectiveDate" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "approvedByUserId" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectedByUserId" TEXT,
    "rejectionReason" TEXT,
    "notesInternal" TEXT,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LicensingPricingSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LicensingPricingSnapshotItem" (
    "id" TEXT NOT NULL,
    "snapshotId" TEXT NOT NULL,
    "vendor" "LicensingPricingVendor" NOT NULL,
    "productName" TEXT NOT NULL,
    "edition" TEXT,
    "sku" TEXT,
    "metric" "LicensingPricingMetric" NOT NULL,
    "unitPriceUsd" DECIMAL(14,2),
    "minUnits" INTEGER,
    "termMonths" INTEGER,
    "assumptionsJson" JSONB,
    "sourceNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LicensingPricingSnapshotItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LicensingPricingRefreshRun" (
    "id" TEXT NOT NULL,
    "status" "LicensingPricingRefreshStatus" NOT NULL DEFAULT 'running',
    "triggeredByUserId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "summary" TEXT,
    "detailsJson" JSONB,
    "createdDraftSnapshotsCount" INTEGER NOT NULL DEFAULT 0,
    "errorsCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LicensingPricingRefreshRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LicensingPricingChangeLog" (
    "id" TEXT NOT NULL,
    "snapshotId" TEXT,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "action" TEXT NOT NULL,
    "previousJson" JSONB,
    "nextJson" JSONB,
    "source" TEXT NOT NULL,
    "performedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LicensingPricingChangeLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "LicensingPricingSnapshot_vendor_status_idx" ON "LicensingPricingSnapshot"("vendor", "status");

CREATE INDEX "LicensingPricingSnapshot_status_updatedAt_idx" ON "LicensingPricingSnapshot"("status", "updatedAt");

CREATE INDEX "LicensingPricingSnapshot_lastCheckedAt_idx" ON "LicensingPricingSnapshot"("lastCheckedAt");

CREATE INDEX "LicensingPricingSnapshot_approvedAt_idx" ON "LicensingPricingSnapshot"("approvedAt");

CREATE INDEX "LicensingPricingSnapshotItem_snapshotId_idx" ON "LicensingPricingSnapshotItem"("snapshotId");

CREATE INDEX "LicensingPricingSnapshotItem_vendor_idx" ON "LicensingPricingSnapshotItem"("vendor");

CREATE INDEX "LicensingPricingSnapshotItem_productName_idx" ON "LicensingPricingSnapshotItem"("productName");

CREATE INDEX "LicensingPricingRefreshRun_status_createdAt_idx" ON "LicensingPricingRefreshRun"("status", "createdAt");

CREATE INDEX "LicensingPricingRefreshRun_triggeredByUserId_idx" ON "LicensingPricingRefreshRun"("triggeredByUserId");

CREATE INDEX "LicensingPricingChangeLog_snapshotId_createdAt_idx" ON "LicensingPricingChangeLog"("snapshotId", "createdAt");

CREATE INDEX "LicensingPricingChangeLog_entityType_entityId_idx" ON "LicensingPricingChangeLog"("entityType", "entityId");

CREATE INDEX "LicensingPricingChangeLog_action_createdAt_idx" ON "LicensingPricingChangeLog"("action", "createdAt");

CREATE INDEX "LicensingPricingChangeLog_performedByUserId_idx" ON "LicensingPricingChangeLog"("performedByUserId");

ALTER TABLE "LicensingPricingSnapshotItem" ADD CONSTRAINT "LicensingPricingSnapshotItem_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "LicensingPricingSnapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LicensingPricingChangeLog" ADD CONSTRAINT "LicensingPricingChangeLog_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "LicensingPricingSnapshot"("id") ON DELETE SET NULL ON UPDATE CASCADE;
