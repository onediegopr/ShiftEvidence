-- EVIDENCE-1 common evidence framework.
-- Additive only: creates enums, tables, indexes and foreign keys for optional evidence modules.

CREATE TYPE "EvidenceModuleKey" AS ENUM (
  'vmware_enrichment',
  'proxmox_target',
  'backup_evidence',
  'storage_san',
  'application_dependency',
  'migration_plan_readiness'
);

CREATE TYPE "EvidenceModuleStatus" AS ENUM (
  'not_provided',
  'template_downloaded',
  'collector_downloaded',
  'uploaded',
  'queued',
  'parsing',
  'parsed',
  'parsed_with_warnings',
  'failed',
  'stale',
  'skipped',
  'reviewed'
);

CREATE TYPE "EvidenceModuleSourceType" AS ENUM (
  'manual',
  'csv',
  'xlsx',
  'json',
  'collector_output',
  'system'
);

CREATE TYPE "EvidenceModuleConfidenceLevel" AS ENUM (
  'none',
  'limited',
  'low',
  'medium',
  'high',
  'verified'
);

CREATE TYPE "EvidenceUploadKind" AS ENUM (
  'manual',
  'template',
  'collector_output',
  'system'
);

CREATE TYPE "EvidenceParseResultStatus" AS ENUM (
  'parsed',
  'parsed_with_warnings',
  'failed',
  'unsupported'
);

CREATE TABLE "AssessmentEvidenceModule" (
  "id" TEXT NOT NULL,
  "assessmentId" TEXT NOT NULL,
  "moduleKey" "EvidenceModuleKey" NOT NULL,
  "status" "EvidenceModuleStatus" NOT NULL DEFAULT 'not_provided',
  "sourceType" "EvidenceModuleSourceType",
  "confidenceLevel" "EvidenceModuleConfidenceLevel" NOT NULL DEFAULT 'limited',
  "completionPercent" INTEGER NOT NULL DEFAULT 0,
  "lastUploadId" TEXT,
  "lastParseResultId" TEXT,
  "skippedAt" TIMESTAMP(3),
  "reviewedAt" TIMESTAMP(3),
  "reviewedByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "AssessmentEvidenceModule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EvidenceUpload" (
  "id" TEXT NOT NULL,
  "assessmentId" TEXT NOT NULL,
  "evidenceFileId" TEXT NOT NULL,
  "moduleKey" "EvidenceModuleKey" NOT NULL,
  "uploadKind" "EvidenceUploadKind" NOT NULL DEFAULT 'manual',
  "originalFilename" TEXT NOT NULL,
  "schemaVersion" TEXT,
  "collectorName" TEXT,
  "collectorVersion" TEXT,
  "sourcePlatform" TEXT,
  "uploadedByUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "EvidenceUpload_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EvidenceParseResult" (
  "id" TEXT NOT NULL,
  "assessmentId" TEXT NOT NULL,
  "evidenceUploadId" TEXT NOT NULL,
  "moduleKey" "EvidenceModuleKey" NOT NULL,
  "parserKey" TEXT NOT NULL,
  "parserVersion" TEXT NOT NULL,
  "status" "EvidenceParseResultStatus" NOT NULL,
  "summaryJson" JSONB,
  "warningsJson" JSONB,
  "errorsJson" JSONB,
  "normalizedEntitiesJson" JSONB,
  "startedAt" TIMESTAMP(3),
  "finishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "EvidenceParseResult_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AssessmentEvidenceModule_assessmentId_moduleKey_key"
  ON "AssessmentEvidenceModule"("assessmentId", "moduleKey");

CREATE INDEX "AssessmentEvidenceModule_assessmentId_idx"
  ON "AssessmentEvidenceModule"("assessmentId");

CREATE INDEX "AssessmentEvidenceModule_moduleKey_idx"
  ON "AssessmentEvidenceModule"("moduleKey");

CREATE INDEX "AssessmentEvidenceModule_status_idx"
  ON "AssessmentEvidenceModule"("status");

CREATE INDEX "AssessmentEvidenceModule_lastUploadId_idx"
  ON "AssessmentEvidenceModule"("lastUploadId");

CREATE INDEX "AssessmentEvidenceModule_lastParseResultId_idx"
  ON "AssessmentEvidenceModule"("lastParseResultId");

CREATE INDEX "AssessmentEvidenceModule_reviewedByUserId_idx"
  ON "AssessmentEvidenceModule"("reviewedByUserId");

CREATE INDEX "EvidenceUpload_assessmentId_moduleKey_idx"
  ON "EvidenceUpload"("assessmentId", "moduleKey");

CREATE INDEX "EvidenceUpload_assessmentId_idx"
  ON "EvidenceUpload"("assessmentId");

CREATE INDEX "EvidenceUpload_evidenceFileId_idx"
  ON "EvidenceUpload"("evidenceFileId");

CREATE INDEX "EvidenceUpload_moduleKey_idx"
  ON "EvidenceUpload"("moduleKey");

CREATE INDEX "EvidenceUpload_uploadKind_idx"
  ON "EvidenceUpload"("uploadKind");

CREATE INDEX "EvidenceUpload_uploadedByUserId_idx"
  ON "EvidenceUpload"("uploadedByUserId");

CREATE INDEX "EvidenceUpload_createdAt_idx"
  ON "EvidenceUpload"("createdAt");

CREATE INDEX "EvidenceParseResult_assessmentId_moduleKey_idx"
  ON "EvidenceParseResult"("assessmentId", "moduleKey");

CREATE INDEX "EvidenceParseResult_assessmentId_idx"
  ON "EvidenceParseResult"("assessmentId");

CREATE INDEX "EvidenceParseResult_evidenceUploadId_idx"
  ON "EvidenceParseResult"("evidenceUploadId");

CREATE INDEX "EvidenceParseResult_moduleKey_idx"
  ON "EvidenceParseResult"("moduleKey");

CREATE INDEX "EvidenceParseResult_status_idx"
  ON "EvidenceParseResult"("status");

CREATE INDEX "EvidenceParseResult_createdAt_idx"
  ON "EvidenceParseResult"("createdAt");

ALTER TABLE "AssessmentEvidenceModule"
  ADD CONSTRAINT "AssessmentEvidenceModule_assessmentId_fkey"
  FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AssessmentEvidenceModule"
  ADD CONSTRAINT "AssessmentEvidenceModule_lastUploadId_fkey"
  FOREIGN KEY ("lastUploadId") REFERENCES "EvidenceUpload"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AssessmentEvidenceModule"
  ADD CONSTRAINT "AssessmentEvidenceModule_lastParseResultId_fkey"
  FOREIGN KEY ("lastParseResultId") REFERENCES "EvidenceParseResult"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AssessmentEvidenceModule"
  ADD CONSTRAINT "AssessmentEvidenceModule_reviewedByUserId_fkey"
  FOREIGN KEY ("reviewedByUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "EvidenceUpload"
  ADD CONSTRAINT "EvidenceUpload_assessmentId_fkey"
  FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EvidenceUpload"
  ADD CONSTRAINT "EvidenceUpload_evidenceFileId_fkey"
  FOREIGN KEY ("evidenceFileId") REFERENCES "EvidenceFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EvidenceUpload"
  ADD CONSTRAINT "EvidenceUpload_uploadedByUserId_fkey"
  FOREIGN KEY ("uploadedByUserId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EvidenceParseResult"
  ADD CONSTRAINT "EvidenceParseResult_assessmentId_fkey"
  FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EvidenceParseResult"
  ADD CONSTRAINT "EvidenceParseResult_evidenceUploadId_fkey"
  FOREIGN KEY ("evidenceUploadId") REFERENCES "EvidenceUpload"("id") ON DELETE CASCADE ON UPDATE CASCADE;
