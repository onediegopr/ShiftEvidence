-- CreateEnum
CREATE TYPE "RiskSeverity" AS ENUM ('info', 'low', 'medium', 'high', 'critical');

-- CreateEnum
CREATE TYPE "RiskFindingCategory" AS ENUM ('vm', 'host', 'datastore', 'snapshot', 'evidence', 'storage', 'cost', 'readiness');

-- CreateEnum
CREATE TYPE "RiskFindingSource" AS ENUM ('parser', 'manual_input', 'cost_risk', 'system');

-- CreateTable
CREATE TABLE "RiskFinding" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "evidenceFileId" TEXT,
    "category" "RiskFindingCategory" NOT NULL,
    "severity" "RiskSeverity" NOT NULL,
    "entityType" TEXT,
    "entityName" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "recommendation" TEXT,
    "visibleInFree" BOOLEAN NOT NULL DEFAULT true,
    "requiresPlan" "PlanLevel",
    "source" "RiskFindingSource" NOT NULL,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RiskFinding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentScore" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "readinessScore" INTEGER NOT NULL,
    "confidenceScore" INTEGER NOT NULL,
    "inventoryScore" INTEGER,
    "costRiskScore" INTEGER,
    "storageScore" INTEGER,
    "riskLevel" "RiskSeverity",
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentScore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RiskFinding_assessmentId_idx" ON "RiskFinding"("assessmentId");

-- CreateIndex
CREATE INDEX "RiskFinding_evidenceFileId_idx" ON "RiskFinding"("evidenceFileId");

-- CreateIndex
CREATE INDEX "RiskFinding_category_idx" ON "RiskFinding"("category");

-- CreateIndex
CREATE INDEX "RiskFinding_severity_idx" ON "RiskFinding"("severity");

-- CreateIndex
CREATE INDEX "RiskFinding_source_idx" ON "RiskFinding"("source");

-- CreateIndex
CREATE INDEX "RiskFinding_visibleInFree_idx" ON "RiskFinding"("visibleInFree");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentScore_assessmentId_key" ON "AssessmentScore"("assessmentId");

-- AddForeignKey
ALTER TABLE "RiskFinding" ADD CONSTRAINT "RiskFinding_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskFinding" ADD CONSTRAINT "RiskFinding_evidenceFileId_fkey" FOREIGN KEY ("evidenceFileId") REFERENCES "EvidenceFile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentScore" ADD CONSTRAINT "AssessmentScore_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
