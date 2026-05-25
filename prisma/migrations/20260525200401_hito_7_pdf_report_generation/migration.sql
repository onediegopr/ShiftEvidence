-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('free_preview', 'readiness_report', 'readiness_report_pro', 'blueprint');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('generating', 'generated', 'failed', 'deleted');

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "generatedByUserId" TEXT,
    "reportType" "ReportType" NOT NULL,
    "status" "ReportStatus" NOT NULL,
    "originalFilename" TEXT NOT NULL,
    "storedFilename" TEXT NOT NULL,
    "relativePath" TEXT NOT NULL,
    "fileHash" TEXT,
    "mimeType" TEXT NOT NULL DEFAULT 'application/pdf',
    "sizeBytes" INTEGER,
    "planRequired" "PlanLevel",
    "generatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "processingError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Report_assessmentId_idx" ON "Report"("assessmentId");

-- CreateIndex
CREATE INDEX "Report_workspaceId_idx" ON "Report"("workspaceId");

-- CreateIndex
CREATE INDEX "Report_generatedByUserId_idx" ON "Report"("generatedByUserId");

-- CreateIndex
CREATE INDEX "Report_reportType_idx" ON "Report"("reportType");

-- CreateIndex
CREATE INDEX "Report_status_idx" ON "Report"("status");

-- CreateIndex
CREATE INDEX "Report_deletedAt_idx" ON "Report"("deletedAt");

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_generatedByUserId_fkey" FOREIGN KEY ("generatedByUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
