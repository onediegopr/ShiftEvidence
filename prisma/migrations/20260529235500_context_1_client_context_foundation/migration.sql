-- CONTEXT-1 Client Context & Additional Evidence foundation.
-- Non-destructive migration: new enums, assessment-linked context tables and indexes only.

CREATE TYPE "AssessmentClientContextStatus" AS ENUM (
    'not_provided',
    'draft',
    'submitted',
    'ready_for_analysis',
    'analysis_pending',
    'analyzed',
    'analysis_failed',
    'skipped'
);

CREATE TYPE "AssessmentClientContextSourceType" AS ENUM (
    'customer_free_text',
    'internal_note',
    'imported'
);

CREATE TYPE "AssessmentClientContextAnalysisStatus" AS ENUM (
    'not_started',
    'pending',
    'completed',
    'failed',
    'stale'
);

CREATE TYPE "AssessmentAdditionalEvidencePurpose" AS ENUM (
    'client_context',
    'business_context',
    'technical_evidence',
    'financial_evidence',
    'architecture_diagram',
    'contract_renewal_evidence',
    'unknown_needs_review'
);

CREATE TYPE "AssessmentAdditionalEvidenceClassification" AS ENUM (
    'business_context',
    'technical_evidence',
    'financial_evidence',
    'architecture_diagram',
    'contract_renewal_evidence',
    'unknown_needs_review'
);

CREATE TYPE "AssessmentAdditionalEvidenceAnalysisStatus" AS ENUM (
    'received_not_analyzed',
    'queued',
    'summarized',
    'failed',
    'excluded'
);

CREATE TABLE "AssessmentClientContext" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "rawText" TEXT,
    "wordCount" INTEGER NOT NULL DEFAULT 0,
    "characterCount" INTEGER NOT NULL DEFAULT 0,
    "status" "AssessmentClientContextStatus" NOT NULL DEFAULT 'not_provided',
    "sourceType" "AssessmentClientContextSourceType" NOT NULL DEFAULT 'customer_free_text',
    "planLimitWords" INTEGER,
    "planLimitFiles" INTEGER,
    "truncated" BOOLEAN NOT NULL DEFAULT false,
    "submittedByUserId" TEXT,
    "submittedAt" TIMESTAMP(3),
    "lastEditedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentClientContext_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AssessmentClientContextAnalysis" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "status" "AssessmentClientContextAnalysisStatus" NOT NULL DEFAULT 'not_started',
    "interpretedSummary" TEXT,
    "businessPrioritiesJson" JSONB,
    "migrationConstraintsJson" JSONB,
    "criticalWorkloadsJson" JSONB,
    "customerReportedRisksJson" JSONB,
    "aiExtractedInsightsJson" JSONB,
    "contradictionsJson" JSONB,
    "validationItemsJson" JSONB,
    "reportImpactJson" JSONB,
    "nextQuestionsJson" JSONB,
    "contextCompletenessScore" INTEGER,
    "businessContextConfidence" TEXT,
    "analysisVersion" TEXT,
    "promptVersion" TEXT,
    "modelUsed" TEXT,
    "safetyFlagsJson" JSONB,
    "generatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentClientContextAnalysis_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AssessmentAdditionalEvidence" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "evidenceFileId" TEXT NOT NULL,
    "purpose" "AssessmentAdditionalEvidencePurpose" NOT NULL DEFAULT 'client_context',
    "classification" "AssessmentAdditionalEvidenceClassification" NOT NULL DEFAULT 'unknown_needs_review',
    "analysisStatus" "AssessmentAdditionalEvidenceAnalysisStatus" NOT NULL DEFAULT 'received_not_analyzed',
    "aiSummary" TEXT,
    "includedInContextAnalysis" BOOLEAN NOT NULL DEFAULT true,
    "planRestricted" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentAdditionalEvidence_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AssessmentClientContext_assessmentId_key" ON "AssessmentClientContext"("assessmentId");
CREATE INDEX "AssessmentClientContext_assessmentId_idx" ON "AssessmentClientContext"("assessmentId");
CREATE INDEX "AssessmentClientContext_status_idx" ON "AssessmentClientContext"("status");
CREATE INDEX "AssessmentClientContext_submittedAt_idx" ON "AssessmentClientContext"("submittedAt");
CREATE INDEX "AssessmentClientContext_submittedByUserId_idx" ON "AssessmentClientContext"("submittedByUserId");

CREATE UNIQUE INDEX "AssessmentClientContextAnalysis_assessmentId_key" ON "AssessmentClientContextAnalysis"("assessmentId");
CREATE INDEX "AssessmentClientContextAnalysis_assessmentId_idx" ON "AssessmentClientContextAnalysis"("assessmentId");
CREATE INDEX "AssessmentClientContextAnalysis_status_idx" ON "AssessmentClientContextAnalysis"("status");
CREATE INDEX "AssessmentClientContextAnalysis_generatedAt_idx" ON "AssessmentClientContextAnalysis"("generatedAt");

CREATE UNIQUE INDEX "AssessmentAdditionalEvidence_assessmentId_evidenceFileId_key" ON "AssessmentAdditionalEvidence"("assessmentId", "evidenceFileId");
CREATE INDEX "AssessmentAdditionalEvidence_assessmentId_idx" ON "AssessmentAdditionalEvidence"("assessmentId");
CREATE INDEX "AssessmentAdditionalEvidence_evidenceFileId_idx" ON "AssessmentAdditionalEvidence"("evidenceFileId");
CREATE INDEX "AssessmentAdditionalEvidence_purpose_idx" ON "AssessmentAdditionalEvidence"("purpose");
CREATE INDEX "AssessmentAdditionalEvidence_classification_idx" ON "AssessmentAdditionalEvidence"("classification");
CREATE INDEX "AssessmentAdditionalEvidence_analysisStatus_idx" ON "AssessmentAdditionalEvidence"("analysisStatus");
CREATE INDEX "AssessmentAdditionalEvidence_includedInContextAnalysis_idx" ON "AssessmentAdditionalEvidence"("includedInContextAnalysis");

ALTER TABLE "AssessmentClientContext" ADD CONSTRAINT "AssessmentClientContext_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssessmentClientContextAnalysis" ADD CONSTRAINT "AssessmentClientContextAnalysis_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssessmentAdditionalEvidence" ADD CONSTRAINT "AssessmentAdditionalEvidence_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssessmentAdditionalEvidence" ADD CONSTRAINT "AssessmentAdditionalEvidence_evidenceFileId_fkey" FOREIGN KEY ("evidenceFileId") REFERENCES "EvidenceFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
