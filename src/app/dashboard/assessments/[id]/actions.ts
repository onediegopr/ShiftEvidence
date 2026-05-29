"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "../../../../lib/auth";
import { upsertUserProfileFromSession } from "../../../../server/user/userProfileService";
import {
  archiveAssessment,
  updateAssessmentBasics,
  setStorageReadinessEnabled,
} from "../../../../server/assessments/assessmentService";
import {
  upsertInfrastructureInput,
} from "../../../../server/assessments/infrastructureInputService";
import {
  upsertCostRiskAssumptions,
  upsertPreliminaryResult,
} from "../../../../server/assessments/costRiskService";
import {
  parseMigrationContextFormData,
  saveMigrationContext,
} from "../../../../server/assessments/migrationContextService";
import {
  parseBooleanField,
  parseOptionalNumber,
  parseOptionalString,
  parseRequiredString,
  safeRedirectError,
} from "../../../../server/assessments/formUtils";
import { INPUT_LIMITS } from "../../../../server/validation/inputLimits";

async function requireSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  await upsertUserProfileFromSession({
    userId: session.user.id,
    email: session.user.email,
    name: session.user.name,
    imageUrl: session.user.image ?? null,
    authProvider: "better-auth",
  });

  return session;
}

function getAssessmentRedirectPath(assessmentId: string, query?: string, tab?: string) {
  const params = [];
  if (query) params.push(query);
  if (tab) params.push(`tab=${tab}`);
  const queryString = params.length > 0 ? `?${params.join("&")}` : "";
  return `/dashboard/assessments/${assessmentId}${queryString}`;
}

export async function updateAssessmentBasicsAction(
  assessmentId: string,
  formData: FormData,
) {
  const session = await requireSession();
  const currentTab = parseOptionalString(formData.get("currentTab"), {
    fieldName: "Current tab",
    maxLength: INPUT_LIMITS.shortText,
  }) ?? "basics";
  let redirectTarget = getAssessmentRedirectPath(assessmentId, "saved=1", currentTab);

  try {
    const title = parseRequiredString(formData.get("title"), "Assessment title", {
      maxLength: INPUT_LIMITS.assessmentTitle,
    });
    const clientLabel = parseOptionalString(formData.get("clientLabel"), {
      fieldName: "Client / company label",
      maxLength: INPUT_LIMITS.companyName,
    });

    await updateAssessmentBasics({
      userId: session.user.id,
      assessmentId,
      title,
      clientLabel,
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update assessment.";
    redirectTarget = getAssessmentRedirectPath(assessmentId, `error=${safeRedirectError(message)}`, currentTab);
  }

  redirect(redirectTarget);
}

export async function saveInfrastructureInputAction(
  assessmentId: string,
  formData: FormData,
) {
  const session = await requireSession();
  const currentTab = parseOptionalString(formData.get("currentTab"), {
    fieldName: "Current tab",
    maxLength: INPUT_LIMITS.shortText,
  }) ?? "basics";
  let redirectTarget = getAssessmentRedirectPath(assessmentId, "saved=1", currentTab);

  try {
    await upsertInfrastructureInput({
      userId: session.user.id,
      assessmentId,
      input: {
        vmCount: parseOptionalNumber(formData.get("vmCount"), {
          fieldName: "VM count",
          integer: true,
          min: 0,
        }),
        hostCount: parseOptionalNumber(formData.get("hostCount"), {
          fieldName: "Host count",
          integer: true,
          min: 0,
        }),
        clusterCount: parseOptionalNumber(formData.get("clusterCount"), {
          fieldName: "Cluster count",
          integer: true,
          min: 0,
        }),
        socketCount: parseOptionalNumber(formData.get("socketCount"), {
          fieldName: "Socket count",
          integer: true,
          min: 0,
        }),
        coreCount: parseOptionalNumber(formData.get("coreCount"), {
          fieldName: "Core count",
          integer: true,
          min: 0,
        }),
        totalRamGb: parseOptionalNumber(formData.get("totalRamGb"), {
          fieldName: "Total RAM GB",
          min: 0,
        }),
        storageFootprintTb: parseOptionalNumber(formData.get("storageFootprintTb"), {
          fieldName: "Storage footprint TB",
          min: 0,
        }),
        usedStorageTb: parseOptionalNumber(formData.get("usedStorageTb"), {
          fieldName: "Used storage TB",
          min: 0,
        }),
        snapshotCount: parseOptionalNumber(formData.get("snapshotCount"), {
          fieldName: "Snapshot count",
          integer: true,
          min: 0,
        }),
        criticalWorkloadCount: parseOptionalNumber(formData.get("criticalWorkloadCount"), {
          fieldName: "Critical workload count",
          integer: true,
          min: 0,
        }),
        largeVmCount: parseOptionalNumber(formData.get("largeVmCount"), {
          fieldName: "Large VM count",
          integer: true,
          min: 0,
        }),
        poweredOffVmCount: parseOptionalNumber(formData.get("poweredOffVmCount"), {
          fieldName: "Powered-off VM count",
          integer: true,
          min: 0,
        }),
        notes: parseOptionalString(formData.get("notes"), {
          fieldName: "Infrastructure notes",
          maxLength: INPUT_LIMITS.notes,
        }),
      },
    });

    await upsertPreliminaryResult({
      userId: session.user.id,
      assessmentId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save infrastructure intake.";
    redirectTarget = getAssessmentRedirectPath(assessmentId, `error=${safeRedirectError(message)}`, currentTab);
  }

  redirect(redirectTarget);
}

export async function saveCostRiskAssumptionsAction(
  assessmentId: string,
  formData: FormData,
) {
  const session = await requireSession();
  const currentTab = parseOptionalString(formData.get("currentTab"), {
    fieldName: "Current tab",
    maxLength: INPUT_LIMITS.shortText,
  }) ?? "basics";
  let redirectTarget = getAssessmentRedirectPath(assessmentId, "saved=1", currentTab);

  try {
    await upsertCostRiskAssumptions({
      userId: session.user.id,
      assessmentId,
      input: {
        vmwareLicenseModel: parseOptionalString(formData.get("vmwareLicenseModel"), {
          fieldName: "VMware license model",
          maxLength: INPUT_LIMITS.shortText,
        }),
        socketCount: parseOptionalNumber(formData.get("socketCount"), {
          fieldName: "Socket count",
          integer: true,
          min: 0,
        }),
        coreCount: parseOptionalNumber(formData.get("coreCount"), {
          fieldName: "Core count",
          integer: true,
          min: 0,
        }),
        vmCount: parseOptionalNumber(formData.get("vmCount"), {
          fieldName: "VM count",
          integer: true,
          min: 0,
        }),
        annualVmwareCost: parseOptionalNumber(formData.get("annualVmwareCost"), {
          fieldName: "Annual VMware cost",
          min: 0,
        }),
        estimatedProxmoxCost: parseOptionalNumber(formData.get("estimatedProxmoxCost"), {
          fieldName: "Estimated Proxmox cost",
          min: 0,
        }),
        currency: parseOptionalString(formData.get("currency"), {
          fieldName: "Currency",
          maxLength: 12,
        }) ?? "USD",
        years: parseOptionalNumber(formData.get("years"), {
          fieldName: "Years",
          integer: true,
          min: 1,
          max: 10,
        }),
        migrationComplexity: parseOptionalString(formData.get("migrationComplexity"), {
          fieldName: "Migration complexity",
          maxLength: INPUT_LIMITS.shortText,
        }),
        businessCriticality: parseOptionalString(formData.get("businessCriticality"), {
          fieldName: "Business criticality",
          maxLength: INPUT_LIMITS.shortText,
        }),
        riskTolerance: parseOptionalString(formData.get("riskTolerance"), {
          fieldName: "Risk tolerance",
          maxLength: INPUT_LIMITS.shortText,
        }),
        assumptionsJson: null,
      },
    });

    await upsertPreliminaryResult({
      userId: session.user.id,
      assessmentId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save Cost / Risk assumptions.";
    redirectTarget = getAssessmentRedirectPath(assessmentId, `error=${safeRedirectError(message)}`, currentTab);
  }

  redirect(redirectTarget);
}

export async function saveMigrationContextAction(
  assessmentId: string,
  formData: FormData,
) {
  const session = await requireSession();
  let redirectTarget = getAssessmentRedirectPath(assessmentId, "saved=1", "context");

  try {
    const context = parseMigrationContextFormData(formData);

    await saveMigrationContext({
      userId: session.user.id,
      assessmentId,
      context,
    });

    await upsertPreliminaryResult({
      userId: session.user.id,
      assessmentId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save migration context.";
    redirectTarget = getAssessmentRedirectPath(assessmentId, `error=${safeRedirectError(message)}`, "context");
  }

  redirect(redirectTarget);
}

export async function toggleStorageReadinessAction(
  assessmentId: string,
  formData: FormData,
) {
  const session = await requireSession();
  const currentTab = parseOptionalString(formData.get("currentTab"), {
    fieldName: "Current tab",
    maxLength: INPUT_LIMITS.shortText,
  }) ?? "evidence";
  let redirectTarget = getAssessmentRedirectPath(assessmentId, "saved=1", currentTab);

  try {
    const enabled = parseBooleanField(formData.get("storageReadinessEnabled"));

    await setStorageReadinessEnabled({
      userId: session.user.id,
      assessmentId,
      enabled,
    });

    await upsertPreliminaryResult({
      userId: session.user.id,
      assessmentId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update Storage Destination Readiness.";
    redirectTarget = getAssessmentRedirectPath(assessmentId, `error=${safeRedirectError(message)}`, currentTab);
  }

  redirect(redirectTarget);
}

export async function archiveAssessmentAction(assessmentId: string) {
  const session = await requireSession();
  let redirectTarget = "/dashboard/assessments?archived=1";

  try {
    await archiveAssessment({
      userId: session.user.id,
      assessmentId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to archive assessment.";
    redirectTarget = getAssessmentRedirectPath(assessmentId, `error=${safeRedirectError(message)}`);
  }

  redirect(redirectTarget);
}
