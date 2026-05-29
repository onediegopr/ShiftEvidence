-- CONTEXT-2 AI Context Intelligence Engine.
-- Non-destructive migration: add fallback/entitlement statuses to the existing analysis enum.

ALTER TYPE "AssessmentClientContextAnalysisStatus" ADD VALUE IF NOT EXISTS 'ai_disabled';
ALTER TYPE "AssessmentClientContextAnalysisStatus" ADD VALUE IF NOT EXISTS 'budget_blocked';
ALTER TYPE "AssessmentClientContextAnalysisStatus" ADD VALUE IF NOT EXISTS 'plan_restricted';
