-- CreateEnum
CREATE TYPE "ParsedRiskLevel" AS ENUM ('low', 'medium', 'high');

-- CreateTable
CREATE TABLE "ParsedVM" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "evidenceFileId" TEXT NOT NULL,
    "vmName" TEXT NOT NULL,
    "powerState" TEXT,
    "guestOs" TEXT,
    "cpuCount" INTEGER,
    "memoryMb" INTEGER,
    "diskCount" INTEGER,
    "provisionedGb" DOUBLE PRECISION,
    "usedGb" DOUBLE PRECISION,
    "nicCount" INTEGER,
    "toolsStatus" TEXT,
    "datastoreName" TEXT,
    "clusterName" TEXT,
    "hostName" TEXT,
    "riskLevel" "ParsedRiskLevel",
    "recommendation" TEXT,
    "rawJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParsedVM_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParsedHost" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "evidenceFileId" TEXT NOT NULL,
    "hostName" TEXT NOT NULL,
    "clusterName" TEXT,
    "cpuModel" TEXT,
    "cpuSockets" INTEGER,
    "cpuCores" INTEGER,
    "memoryGb" DOUBLE PRECISION,
    "version" TEXT,
    "rawJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParsedHost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParsedDatastore" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "evidenceFileId" TEXT NOT NULL,
    "datastoreName" TEXT NOT NULL,
    "datastoreType" TEXT,
    "capacityGb" DOUBLE PRECISION,
    "usedGb" DOUBLE PRECISION,
    "freeGb" DOUBLE PRECISION,
    "usagePercent" DOUBLE PRECISION,
    "riskLevel" "ParsedRiskLevel",
    "rawJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParsedDatastore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParsedSnapshot" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "evidenceFileId" TEXT NOT NULL,
    "vmName" TEXT,
    "snapshotName" TEXT,
    "createdAtSource" TIMESTAMP(3),
    "ageDays" INTEGER,
    "sizeGb" DOUBLE PRECISION,
    "riskLevel" "ParsedRiskLevel",
    "rawJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParsedSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParsedInventorySummary" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "evidenceFileId" TEXT NOT NULL,
    "vmCount" INTEGER NOT NULL DEFAULT 0,
    "hostCount" INTEGER NOT NULL DEFAULT 0,
    "datastoreCount" INTEGER NOT NULL DEFAULT 0,
    "snapshotCount" INTEGER NOT NULL DEFAULT 0,
    "poweredOnVmCount" INTEGER NOT NULL DEFAULT 0,
    "poweredOffVmCount" INTEGER NOT NULL DEFAULT 0,
    "totalProvisionedGb" DOUBLE PRECISION,
    "totalUsedGb" DOUBLE PRECISION,
    "largestVmGb" DOUBLE PRECISION,
    "oldestSnapshotDays" INTEGER,
    "parsedAt" TIMESTAMP(3),
    "parseWarningsJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParsedInventorySummary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ParsedVM_assessmentId_idx" ON "ParsedVM"("assessmentId");

-- CreateIndex
CREATE INDEX "ParsedVM_evidenceFileId_idx" ON "ParsedVM"("evidenceFileId");

-- CreateIndex
CREATE INDEX "ParsedVM_vmName_idx" ON "ParsedVM"("vmName");

-- CreateIndex
CREATE INDEX "ParsedVM_riskLevel_idx" ON "ParsedVM"("riskLevel");

-- CreateIndex
CREATE INDEX "ParsedHost_assessmentId_idx" ON "ParsedHost"("assessmentId");

-- CreateIndex
CREATE INDEX "ParsedHost_evidenceFileId_idx" ON "ParsedHost"("evidenceFileId");

-- CreateIndex
CREATE INDEX "ParsedHost_hostName_idx" ON "ParsedHost"("hostName");

-- CreateIndex
CREATE INDEX "ParsedHost_clusterName_idx" ON "ParsedHost"("clusterName");

-- CreateIndex
CREATE INDEX "ParsedDatastore_assessmentId_idx" ON "ParsedDatastore"("assessmentId");

-- CreateIndex
CREATE INDEX "ParsedDatastore_evidenceFileId_idx" ON "ParsedDatastore"("evidenceFileId");

-- CreateIndex
CREATE INDEX "ParsedDatastore_datastoreName_idx" ON "ParsedDatastore"("datastoreName");

-- CreateIndex
CREATE INDEX "ParsedDatastore_riskLevel_idx" ON "ParsedDatastore"("riskLevel");

-- CreateIndex
CREATE INDEX "ParsedSnapshot_assessmentId_idx" ON "ParsedSnapshot"("assessmentId");

-- CreateIndex
CREATE INDEX "ParsedSnapshot_evidenceFileId_idx" ON "ParsedSnapshot"("evidenceFileId");

-- CreateIndex
CREATE INDEX "ParsedSnapshot_vmName_idx" ON "ParsedSnapshot"("vmName");

-- CreateIndex
CREATE INDEX "ParsedSnapshot_riskLevel_idx" ON "ParsedSnapshot"("riskLevel");

-- CreateIndex
CREATE UNIQUE INDEX "ParsedInventorySummary_evidenceFileId_key" ON "ParsedInventorySummary"("evidenceFileId");

-- CreateIndex
CREATE INDEX "ParsedInventorySummary_assessmentId_idx" ON "ParsedInventorySummary"("assessmentId");

-- AddForeignKey
ALTER TABLE "ParsedVM" ADD CONSTRAINT "ParsedVM_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParsedVM" ADD CONSTRAINT "ParsedVM_evidenceFileId_fkey" FOREIGN KEY ("evidenceFileId") REFERENCES "EvidenceFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParsedHost" ADD CONSTRAINT "ParsedHost_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParsedHost" ADD CONSTRAINT "ParsedHost_evidenceFileId_fkey" FOREIGN KEY ("evidenceFileId") REFERENCES "EvidenceFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParsedDatastore" ADD CONSTRAINT "ParsedDatastore_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParsedDatastore" ADD CONSTRAINT "ParsedDatastore_evidenceFileId_fkey" FOREIGN KEY ("evidenceFileId") REFERENCES "EvidenceFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParsedSnapshot" ADD CONSTRAINT "ParsedSnapshot_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParsedSnapshot" ADD CONSTRAINT "ParsedSnapshot_evidenceFileId_fkey" FOREIGN KEY ("evidenceFileId") REFERENCES "EvidenceFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParsedInventorySummary" ADD CONSTRAINT "ParsedInventorySummary_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParsedInventorySummary" ADD CONSTRAINT "ParsedInventorySummary_evidenceFileId_fkey" FOREIGN KEY ("evidenceFileId") REFERENCES "EvidenceFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
