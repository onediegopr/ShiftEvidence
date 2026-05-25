-- CreateEnum
CREATE TYPE "EvidenceType" AS ENUM ('rvtools', 'manual_csv', 'veeam', 'proxmox', 'network', 'cmdb', 'other');

-- CreateEnum
CREATE TYPE "EvidenceProcessingStatus" AS ENUM ('uploaded', 'queued', 'processing', 'parsed', 'failed', 'deleted');

-- CreateTable
CREATE TABLE "EvidenceFile" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "uploadedByUserId" TEXT NOT NULL,
    "evidenceType" "EvidenceType" NOT NULL,
    "originalFilename" TEXT NOT NULL,
    "storedFilename" TEXT NOT NULL,
    "relativePath" TEXT NOT NULL,
    "fileHash" TEXT NOT NULL,
    "mimeType" TEXT,
    "sizeBytes" INTEGER NOT NULL,
    "processingStatus" "EvidenceProcessingStatus" NOT NULL DEFAULT 'uploaded',
    "processingError" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EvidenceFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EvidenceFile_assessmentId_idx" ON "EvidenceFile"("assessmentId");

-- CreateIndex
CREATE INDEX "EvidenceFile_workspaceId_idx" ON "EvidenceFile"("workspaceId");

-- CreateIndex
CREATE INDEX "EvidenceFile_uploadedByUserId_idx" ON "EvidenceFile"("uploadedByUserId");

-- CreateIndex
CREATE INDEX "EvidenceFile_evidenceType_idx" ON "EvidenceFile"("evidenceType");

-- CreateIndex
CREATE INDEX "EvidenceFile_processingStatus_idx" ON "EvidenceFile"("processingStatus");

-- CreateIndex
CREATE INDEX "EvidenceFile_deletedAt_idx" ON "EvidenceFile"("deletedAt");

-- AddForeignKey
ALTER TABLE "EvidenceFile" ADD CONSTRAINT "EvidenceFile_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceFile" ADD CONSTRAINT "EvidenceFile_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceFile" ADD CONSTRAINT "EvidenceFile_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
