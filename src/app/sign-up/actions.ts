"use server";

import { headers } from "next/headers";
import { auth } from "../../lib/auth";
import { createAssessment } from "../../server/assessments/assessmentService";
import { ensureDefaultWorkspace } from "../../server/workspace/workspaceService";
import { upsertUserProfileFromSession } from "../../server/user/userProfileService";
import {
  saveMigrationContext,
  migrationContextQuestions,
  type MigrationContextAnswer,
  type MigrationContextData,
} from "../../server/assessments/migrationContextService";
import { upsertPreliminaryResult } from "../../server/assessments/costRiskService";

export async function createOnboardingAssessmentAction(params: {
  company: string;
  storageType?: string;
  networkType?: string;
  haRequired?: boolean;
  backupSystem?: string;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  await upsertUserProfileFromSession({
    userId: session.user.id,
    email: session.user.email,
    name: session.user.name,
    imageUrl: session.user.image ?? null,
    authProvider: "better-auth",
  });

  const workspace = await ensureDefaultWorkspace({
    userId: session.user.id,
    userDisplayName: session.user.name,
  });

  const companyLabel = params.company?.trim() || "My Company";
  const title = `${companyLabel} VMware Exit Audit`;

  const assessment = await createAssessment({
    userId: session.user.id,
    workspaceId: workspace.id,
    title,
    clientLabel: companyLabel,
    storageReadinessEnabled: true,
  });

  // Map wizard values to formal context questions
  const now = new Date().toISOString();
  const answers: Record<string, MigrationContextAnswer> = {};

  migrationContextQuestions.forEach((question) => {
    let value: string | string[] | null = null;
    let answered = false;

    if (question.id === "current_storage_type") {
      value = params.storageType === "vsan" ? ["VMware vSAN"] : ["SAN Fibre Channel", "NFS/NAS"];
      answered = true;
    } else if (question.id === "planned_proxmox_storage") {
      value = params.storageType === "vsan" ? ["Ceph"] : ["iSCSI/SAN", "NFS"];
      answered = true;
    } else if (question.id === "vmware_switch_type") {
      value = params.networkType === "dvs" ? "Distributed switches" : "Standard switches";
      answered = true;
    } else if (question.id === "ha_required") {
      value = params.haRequired ? "Yes" : "No";
      answered = true;
    } else if (question.id === "backup_solution") {
      value = params.backupSystem === "veeam" ? "Veeam" : "Scripts/other";
      answered = true;
    }

    answers[question.id] = {
      value,
      status: answered ? "answered" : "skipped",
      source: answered ? "user_input" : "missing",
      updatedAt: answered ? now : null,
    };
  });

  const contextData: MigrationContextData = {
    version: 1,
    answers,
    updatedAt: now,
  };

  await saveMigrationContext({
    userId: session.user.id,
    assessmentId: assessment.id,
    context: contextData,
  });

  await upsertPreliminaryResult({
    userId: session.user.id,
    assessmentId: assessment.id,
  });

  return { assessmentId: assessment.id };
}
