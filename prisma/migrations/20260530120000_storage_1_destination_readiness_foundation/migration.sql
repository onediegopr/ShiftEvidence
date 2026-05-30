-- STORAGE-1 Storage Destination Readiness foundation.
-- Non-destructive migration: dedicated optional storage tables, enums and indexes only.

CREATE TYPE "AssessmentStorageDestinationReadinessStatus" AS ENUM (
    'not_started',
    'draft',
    'submitted',
    'ready_for_analysis',
    'analysis_pending',
    'analyzed',
    'skipped',
    'stale',
    'failed'
);

CREATE TYPE "AssessmentStorageDestinationMode" AS ENUM (
    'agnostic',
    'zfs_local',
    'nfs_san',
    'ceph_candidate',
    'unknown'
);

CREATE TYPE "AssessmentStorageCurrentType" AS ENUM (
    'vmfs',
    'vsan',
    'nfs',
    'san',
    'local_datastore',
    'mixed',
    'unknown'
);

CREATE TYPE "AssessmentStorageTargetPreference" AS ENUM (
    'zfs_local',
    'nfs',
    'san',
    'ceph',
    'pbs',
    'unknown',
    'not_decided'
);

CREATE TYPE "AssessmentStorageContextStatus" AS ENUM (
    'not_provided',
    'draft',
    'submitted',
    'skipped',
    'ready_for_analysis',
    'analyzed',
    'stale'
);

CREATE TYPE "AssessmentStorageEvidenceClassification" AS ENUM (
    'source_storage_export',
    'target_storage_design',
    'hardware_bom',
    'network_diagram',
    'ceph_status',
    'ceph_osd_tree',
    'ceph_df',
    'pbs_backup_info',
    'vsan_summary',
    'san_nas_export',
    'architecture_diagram',
    'quote_or_bill_of_materials',
    'unknown_needs_review'
);

CREATE TYPE "AssessmentStorageEvidenceAnalysisStatus" AS ENUM (
    'received_not_analyzed',
    'queued',
    'summarized',
    'failed',
    'excluded'
);

CREATE TYPE "AssessmentStorageAnalysisStatus" AS ENUM (
    'not_started',
    'pending',
    'completed',
    'failed',
    'stale'
);

CREATE TABLE "AssessmentStorageDestinationReadiness" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "status" "AssessmentStorageDestinationReadinessStatus" NOT NULL DEFAULT 'not_started',
    "mode" "AssessmentStorageDestinationMode" NOT NULL DEFAULT 'agnostic',
    "currentStorageType" "AssessmentStorageCurrentType",
    "targetStoragePreference" "AssessmentStorageTargetPreference",
    "needsHighAvailability" BOOLEAN,
    "requiresSharedStorage" BOOLEAN,
    "hasProxmoxTarget" BOOLEAN,
    "hasPbs" BOOLEAN,
    "hasMinimumThreeNodes" BOOLEAN,
    "hasDedicatedStorageNetwork" BOOLEAN,
    "hasCephExperience" BOOLEAN,
    "hasVendorOrPartnerSupport" BOOLEAN,
    "estimatedGrowthPercent3y" INTEGER,
    "downtimeTolerance" TEXT,
    "rpoRtoNotes" TEXT,
    "sourceNotes" TEXT,
    "storageConstraintsJson" JSONB,
    "assumptionsJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentStorageDestinationReadiness_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AssessmentStorageContext" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "rawText" TEXT,
    "wordCount" INTEGER NOT NULL DEFAULT 0,
    "characterCount" INTEGER NOT NULL DEFAULT 0,
    "status" "AssessmentStorageContextStatus" NOT NULL DEFAULT 'not_provided',
    "planLimitWords" INTEGER,
    "planLimitFiles" INTEGER,
    "truncated" BOOLEAN NOT NULL DEFAULT false,
    "submittedByUserId" TEXT,
    "submittedAt" TIMESTAMP(3),
    "lastEditedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentStorageContext_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AssessmentStorageEvidence" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "evidenceFileId" TEXT NOT NULL,
    "classification" "AssessmentStorageEvidenceClassification" NOT NULL DEFAULT 'unknown_needs_review',
    "analysisStatus" "AssessmentStorageEvidenceAnalysisStatus" NOT NULL DEFAULT 'received_not_analyzed',
    "includedInStorageAnalysis" BOOLEAN NOT NULL DEFAULT true,
    "planRestricted" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentStorageEvidence_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AssessmentStorageAnalysis" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "status" "AssessmentStorageAnalysisStatus" NOT NULL DEFAULT 'not_started',
    "storageReadinessScore" INTEGER,
    "storageEvidenceConfidence" INTEGER,
    "cephSuitabilityStatus" TEXT,
    "interpretedSummary" TEXT,
    "missingEvidenceJson" JSONB,
    "recommendationsJson" JSONB,
    "analysisVersion" TEXT,
    "generatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentStorageAnalysis_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AssessmentStorageDestinationReadiness_assessmentId_key" ON "AssessmentStorageDestinationReadiness"("assessmentId");
CREATE INDEX "AssessmentStorageDestinationReadiness_assessmentId_idx" ON "AssessmentStorageDestinationReadiness"("assessmentId");
CREATE INDEX "AssessmentStorageDestinationReadiness_status_idx" ON "AssessmentStorageDestinationReadiness"("status");
CREATE INDEX "AssessmentStorageDestinationReadiness_mode_idx" ON "AssessmentStorageDestinationReadiness"("mode");
CREATE INDEX "AssessmentStorageDestinationReadiness_currentStorageType_idx" ON "AssessmentStorageDestinationReadiness"("currentStorageType");
CREATE INDEX "AssessmentStorageDestinationReadiness_targetStoragePreference_idx" ON "AssessmentStorageDestinationReadiness"("targetStoragePreference");

CREATE UNIQUE INDEX "AssessmentStorageContext_assessmentId_key" ON "AssessmentStorageContext"("assessmentId");
CREATE INDEX "AssessmentStorageContext_assessmentId_idx" ON "AssessmentStorageContext"("assessmentId");
CREATE INDEX "AssessmentStorageContext_status_idx" ON "AssessmentStorageContext"("status");
CREATE INDEX "AssessmentStorageContext_submittedAt_idx" ON "AssessmentStorageContext"("submittedAt");
CREATE INDEX "AssessmentStorageContext_submittedByUserId_idx" ON "AssessmentStorageContext"("submittedByUserId");

CREATE UNIQUE INDEX "AssessmentStorageEvidence_assessmentId_evidenceFileId_key" ON "AssessmentStorageEvidence"("assessmentId", "evidenceFileId");
CREATE INDEX "AssessmentStorageEvidence_assessmentId_idx" ON "AssessmentStorageEvidence"("assessmentId");
CREATE INDEX "AssessmentStorageEvidence_evidenceFileId_idx" ON "AssessmentStorageEvidence"("evidenceFileId");
CREATE INDEX "AssessmentStorageEvidence_classification_idx" ON "AssessmentStorageEvidence"("classification");
CREATE INDEX "AssessmentStorageEvidence_analysisStatus_idx" ON "AssessmentStorageEvidence"("analysisStatus");
CREATE INDEX "AssessmentStorageEvidence_includedInStorageAnalysis_idx" ON "AssessmentStorageEvidence"("includedInStorageAnalysis");

CREATE UNIQUE INDEX "AssessmentStorageAnalysis_assessmentId_key" ON "AssessmentStorageAnalysis"("assessmentId");
CREATE INDEX "AssessmentStorageAnalysis_assessmentId_idx" ON "AssessmentStorageAnalysis"("assessmentId");
CREATE INDEX "AssessmentStorageAnalysis_status_idx" ON "AssessmentStorageAnalysis"("status");
CREATE INDEX "AssessmentStorageAnalysis_generatedAt_idx" ON "AssessmentStorageAnalysis"("generatedAt");

ALTER TABLE "AssessmentStorageDestinationReadiness" ADD CONSTRAINT "AssessmentStorageDestinationReadiness_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssessmentStorageContext" ADD CONSTRAINT "AssessmentStorageContext_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssessmentStorageEvidence" ADD CONSTRAINT "AssessmentStorageEvidence_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssessmentStorageEvidence" ADD CONSTRAINT "AssessmentStorageEvidence_evidenceFileId_fkey" FOREIGN KEY ("evidenceFileId") REFERENCES "EvidenceFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssessmentStorageAnalysis" ADD CONSTRAINT "AssessmentStorageAnalysis_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
