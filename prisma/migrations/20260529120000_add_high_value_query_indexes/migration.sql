-- High-value non-destructive indexes for frequent list/filter/order queries.

CREATE INDEX "Assessment_workspaceId_archivedAt_updatedAt_idx" ON "Assessment"("workspaceId", "archivedAt", "updatedAt");

CREATE INDEX "Assessment_archivedAt_updatedAt_idx" ON "Assessment"("archivedAt", "updatedAt");

CREATE INDEX "EvidenceFile_assessmentId_deletedAt_uploadedAt_idx" ON "EvidenceFile"("assessmentId", "deletedAt", "uploadedAt");

CREATE INDEX "EvidenceFile_processingStatus_deletedAt_idx" ON "EvidenceFile"("processingStatus", "deletedAt");

CREATE INDEX "AuditEvent_createdAt_idx" ON "AuditEvent"("createdAt");

CREATE INDEX "AiUsageEvent_userId_createdAt_idx" ON "AiUsageEvent"("userId", "createdAt");

CREATE INDEX "AiUsageEvent_assessmentId_createdAt_idx" ON "AiUsageEvent"("assessmentId", "createdAt");

CREATE INDEX "AiUsageEvent_provider_createdAt_idx" ON "AiUsageEvent"("provider", "createdAt");

CREATE INDEX "AiUsageEvent_status_createdAt_idx" ON "AiUsageEvent"("status", "createdAt");

CREATE INDEX "Report_assessmentId_deletedAt_createdAt_idx" ON "Report"("assessmentId", "deletedAt", "createdAt");

CREATE INDEX "Report_status_deletedAt_idx" ON "Report"("status", "deletedAt");
