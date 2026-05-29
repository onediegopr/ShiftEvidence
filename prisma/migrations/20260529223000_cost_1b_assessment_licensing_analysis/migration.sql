-- COST-1B Assessment Licensing & Cost Exposure Analysis.
-- Non-destructive migration: new enums and one assessment-linked result table.

CREATE TYPE "AssessmentLicensingAnalysisStatus" AS ENUM ('not_included', 'needs_input', 'ready', 'completed', 'blocked', 'stale_pricing');

CREATE TYPE "AssessmentLicensingAnalysisMode" AS ENUM ('actual_costs', 'estimated_from_environment', 'broad_scenarios', 'skipped');

CREATE TABLE "AssessmentLicensingAnalysis" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "status" "AssessmentLicensingAnalysisStatus" NOT NULL DEFAULT 'not_included',
    "mode" "AssessmentLicensingAnalysisMode" NOT NULL DEFAULT 'skipped',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "financialConfidenceScore" INTEGER,
    "financialConfidenceLabel" TEXT,
    "savingsQuality" TEXT,
    "pricingFreshnessStatus" TEXT,
    "vmwareScenarioJson" JSONB,
    "proxmoxScenarioJson" JSONB,
    "comparisonJson" JSONB,
    "costOfStayingJson" JSONB,
    "contractTimingRiskJson" JSONB,
    "licensingTrapsJson" JSONB,
    "missingEvidenceJson" JSONB,
    "assumptionsJson" JSONB,
    "pricingSnapshotRefsJson" JSONB,
    "executiveRecommendation" TEXT,
    "generatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentLicensingAnalysis_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AssessmentLicensingAnalysis_assessmentId_key" ON "AssessmentLicensingAnalysis"("assessmentId");

CREATE INDEX "AssessmentLicensingAnalysis_assessmentId_idx" ON "AssessmentLicensingAnalysis"("assessmentId");

CREATE INDEX "AssessmentLicensingAnalysis_status_idx" ON "AssessmentLicensingAnalysis"("status");

CREATE INDEX "AssessmentLicensingAnalysis_mode_idx" ON "AssessmentLicensingAnalysis"("mode");

CREATE INDEX "AssessmentLicensingAnalysis_generatedAt_idx" ON "AssessmentLicensingAnalysis"("generatedAt");

ALTER TABLE "AssessmentLicensingAnalysis" ADD CONSTRAINT "AssessmentLicensingAnalysis_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
