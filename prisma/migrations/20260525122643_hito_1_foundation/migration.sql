-- CreateEnum
CREATE TYPE "WorkspacePlan" AS ENUM ('free', 'readiness_report', 'readiness_report_pro', 'custom_blueprint', 'partner');

-- CreateEnum
CREATE TYPE "BillingStatus" AS ENUM ('none', 'trial', 'active', 'past_due', 'cancelled');

-- CreateEnum
CREATE TYPE "WorkspaceRole" AS ENUM ('owner', 'admin', 'member', 'viewer');

-- CreateEnum
CREATE TYPE "AssessmentType" AS ENUM ('vmware_to_proxmox');

-- CreateEnum
CREATE TYPE "SourcePlatform" AS ENUM ('vmware');

-- CreateEnum
CREATE TYPE "TargetPlatform" AS ENUM ('proxmox');

-- CreateEnum
CREATE TYPE "AssessmentStatus" AS ENUM ('draft', 'uploaded', 'processing', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "PlanLevel" AS ENUM ('free', 'readiness_report', 'readiness_report_pro', 'custom_blueprint');

-- CreateEnum
CREATE TYPE "StorageReadinessStatus" AS ENUM ('not_selected', 'selected', 'completed', 'locked');

-- CreateEnum
CREATE TYPE "AssessmentModuleKey" AS ENUM ('cost_risk', 'storage_readiness', 'backup_readiness', 'network_readiness', 'proxmox_target_design');

-- CreateEnum
CREATE TYPE "AssessmentModuleStatus" AS ENUM ('locked', 'available', 'selected', 'in_progress', 'completed');

-- CreateEnum
CREATE TYPE "EntitlementKey" AS ENUM ('full_report_unlocked', 'storage_readiness_unlocked', 'pro_matrix_unlocked', 'review_call_unlocked');

-- CreateEnum
CREATE TYPE "EntitlementStatus" AS ENUM ('locked', 'available', 'purchased', 'granted');

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "imageUrl" TEXT,
    "authProvider" TEXT,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Workspace" (
    "id" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "companyName" TEXT,
    "plan" "WorkspacePlan" NOT NULL DEFAULT 'free',
    "billingStatus" "BillingStatus" NOT NULL DEFAULT 'none',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspaceMember" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "WorkspaceRole" NOT NULL DEFAULT 'member',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkspaceMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assessment" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "assessmentType" "AssessmentType" NOT NULL DEFAULT 'vmware_to_proxmox',
    "sourcePlatform" "SourcePlatform" NOT NULL DEFAULT 'vmware',
    "targetPlatform" "TargetPlatform" NOT NULL DEFAULT 'proxmox',
    "status" "AssessmentStatus" NOT NULL DEFAULT 'draft',
    "planLevel" "PlanLevel" NOT NULL DEFAULT 'free',
    "storageReadinessEnabled" BOOLEAN NOT NULL DEFAULT false,
    "storageReadinessStatus" "StorageReadinessStatus" NOT NULL DEFAULT 'not_selected',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentModule" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "moduleKey" "AssessmentModuleKey" NOT NULL,
    "status" "AssessmentModuleStatus" NOT NULL DEFAULT 'locked',
    "includedInPlan" BOOLEAN NOT NULL DEFAULT false,
    "isOptional" BOOLEAN NOT NULL DEFAULT false,
    "isPaidAddon" BOOLEAN NOT NULL DEFAULT false,
    "priceCents" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentModule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CostRiskAssumptions" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "vmwareLicenseModel" TEXT,
    "socketCount" INTEGER,
    "coreCount" INTEGER,
    "vmCount" INTEGER,
    "annualVmwareCost" DECIMAL(14,2),
    "estimatedProxmoxCost" DECIMAL(14,2),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "years" INTEGER NOT NULL DEFAULT 3,
    "assumptionsJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CostRiskAssumptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StorageReadinessInput" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "currentStorageType" TEXT,
    "targetStoragePreference" TEXT,
    "capacityTb" DOUBLE PRECISION,
    "usedTb" DOUBLE PRECISION,
    "expectedGrowthPercent" DOUBLE PRECISION,
    "requiresHa" BOOLEAN,
    "requiresSharedStorage" BOOLEAN,
    "workloadProfile" TEXT,
    "performanceSensitivity" TEXT,
    "operationalComplexityTolerance" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StorageReadinessInput_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentEntitlement" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "entitlementKey" "EntitlementKey" NOT NULL,
    "status" "EntitlementStatus" NOT NULL DEFAULT 'locked',
    "source" TEXT,
    "purchasedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentEntitlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "workspaceId" TEXT,
    "assessmentId" TEXT,
    "eventType" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UpgradeEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "workspaceId" TEXT,
    "assessmentId" TEXT,
    "triggerType" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "clicked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UpgradeEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE INDEX "session_userId_idx" ON "session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE INDEX "account_userId_idx" ON "account"("userId");

-- CreateIndex
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_userId_key" ON "UserProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_email_key" ON "UserProfile"("email");

-- CreateIndex
CREATE INDEX "UserProfile_email_idx" ON "UserProfile"("email");

-- CreateIndex
CREATE INDEX "Workspace_ownerUserId_idx" ON "Workspace"("ownerUserId");

-- CreateIndex
CREATE INDEX "WorkspaceMember_userId_idx" ON "WorkspaceMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceMember_workspaceId_userId_key" ON "WorkspaceMember"("workspaceId", "userId");

-- CreateIndex
CREATE INDEX "Assessment_workspaceId_idx" ON "Assessment"("workspaceId");

-- CreateIndex
CREATE INDEX "Assessment_status_idx" ON "Assessment"("status");

-- CreateIndex
CREATE INDEX "AssessmentModule_assessmentId_idx" ON "AssessmentModule"("assessmentId");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentModule_assessmentId_moduleKey_key" ON "AssessmentModule"("assessmentId", "moduleKey");

-- CreateIndex
CREATE UNIQUE INDEX "CostRiskAssumptions_assessmentId_key" ON "CostRiskAssumptions"("assessmentId");

-- CreateIndex
CREATE UNIQUE INDEX "StorageReadinessInput_assessmentId_key" ON "StorageReadinessInput"("assessmentId");

-- CreateIndex
CREATE INDEX "AssessmentEntitlement_assessmentId_idx" ON "AssessmentEntitlement"("assessmentId");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentEntitlement_assessmentId_entitlementKey_key" ON "AssessmentEntitlement"("assessmentId", "entitlementKey");

-- CreateIndex
CREATE INDEX "AuditEvent_workspaceId_idx" ON "AuditEvent"("workspaceId");

-- CreateIndex
CREATE INDEX "AuditEvent_assessmentId_idx" ON "AuditEvent"("assessmentId");

-- CreateIndex
CREATE INDEX "AuditEvent_userId_idx" ON "AuditEvent"("userId");

-- CreateIndex
CREATE INDEX "UpgradeEvent_workspaceId_idx" ON "UpgradeEvent"("workspaceId");

-- CreateIndex
CREATE INDEX "UpgradeEvent_assessmentId_idx" ON "UpgradeEvent"("assessmentId");

-- CreateIndex
CREATE INDEX "UpgradeEvent_userId_idx" ON "UpgradeEvent"("userId");

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Workspace" ADD CONSTRAINT "Workspace_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentModule" ADD CONSTRAINT "AssessmentModule_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CostRiskAssumptions" ADD CONSTRAINT "CostRiskAssumptions_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorageReadinessInput" ADD CONSTRAINT "StorageReadinessInput_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentEntitlement" ADD CONSTRAINT "AssessmentEntitlement_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UpgradeEvent" ADD CONSTRAINT "UpgradeEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UpgradeEvent" ADD CONSTRAINT "UpgradeEvent_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UpgradeEvent" ADD CONSTRAINT "UpgradeEvent_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
