-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('low', 'medium', 'high');

-- AlterEnum
ALTER TYPE "AssessmentStatus" ADD VALUE 'archived';

-- AlterTable
ALTER TABLE "Assessment" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "clientLabel" TEXT;

-- AlterTable
ALTER TABLE "CostRiskAssumptions" ADD COLUMN     "businessCriticality" TEXT,
ADD COLUMN     "migrationComplexity" TEXT,
ADD COLUMN     "riskTolerance" TEXT;

-- CreateTable
CREATE TABLE "AssessmentInfrastructureInput" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "vmCount" INTEGER,
    "hostCount" INTEGER,
    "clusterCount" INTEGER,
    "socketCount" INTEGER,
    "coreCount" INTEGER,
    "totalRamGb" DOUBLE PRECISION,
    "storageFootprintTb" DOUBLE PRECISION,
    "usedStorageTb" DOUBLE PRECISION,
    "snapshotCount" INTEGER,
    "criticalWorkloadCount" INTEGER,
    "largeVmCount" INTEGER,
    "poweredOffVmCount" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentInfrastructureInput_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentPreliminaryResult" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "annualSubscriptionDelta" DOUBLE PRECISION,
    "threeYearSubscriptionDelta" DOUBLE PRECISION,
    "savingsPercent" DOUBLE PRECISION,
    "riskScore" INTEGER,
    "riskLevel" "RiskLevel",
    "readinessLabel" TEXT,
    "missingEvidenceJson" JSONB,
    "recommendationsJson" JSONB,
    "calculatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentPreliminaryResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentInfrastructureInput_assessmentId_key" ON "AssessmentInfrastructureInput"("assessmentId");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentPreliminaryResult_assessmentId_key" ON "AssessmentPreliminaryResult"("assessmentId");

-- AddForeignKey
ALTER TABLE "AssessmentInfrastructureInput" ADD CONSTRAINT "AssessmentInfrastructureInput_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentPreliminaryResult" ADD CONSTRAINT "AssessmentPreliminaryResult_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
