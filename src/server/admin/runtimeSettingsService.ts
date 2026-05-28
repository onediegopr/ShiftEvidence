import { ReportType } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { getAdminAiUsage } from "../ai/aiUsageService";
import { getAiBudgetSettings } from "./adminOpsService";
import { recordAdminAuditEvent } from "./adminOpsService";

export type AiRuntimeMode = "env" | "disabled" | "mock" | "gemini";

export type OperationalRuntimeSettings = {
  aiRuntimeMode: AiRuntimeMode;
  aiEnforceBudget: boolean;
  aiBlockOnBudgetExceeded: boolean;
  reportsPdfGenerationEnabled: boolean;
  reportsDownloadEnabled: boolean;
  assessmentsCreationEnabled: boolean;
  uploadsEnabled: boolean;
  publicRegistrationEnabled: boolean;
  maintenanceMode: boolean;
};

export type OperationalCheck = {
  allowed: boolean;
  code: string;
  message: string;
};

export class OperationalBlockError extends Error {
  code: string;

  constructor(check: OperationalCheck) {
    super(check.message);
    this.name = "OperationalBlockError";
    this.code = check.code;
  }
}

const RUNTIME_SETTINGS_KEY = "ops.runtime";

export const DEFAULT_RUNTIME_SETTINGS: OperationalRuntimeSettings = {
  aiRuntimeMode: "env",
  aiEnforceBudget: false,
  aiBlockOnBudgetExceeded: false,
  reportsPdfGenerationEnabled: true,
  reportsDownloadEnabled: true,
  assessmentsCreationEnabled: true,
  uploadsEnabled: true,
  publicRegistrationEnabled: true,
  maintenanceMode: false,
};

function booleanValue(value: unknown, fallback: boolean) {
  if (value === true || value === "true" || value === "on" || value === "1") return true;
  if (value === false || value === "false" || value === "0" || value === null) return false;
  return fallback;
}

function booleanFromForm(formData: FormData, key: string, fallback: boolean) {
  if (!formData.has(key)) return false;
  return booleanValue(formData.get(key), fallback);
}

function parseAiRuntimeMode(value: unknown): AiRuntimeMode {
  return value === "disabled" || value === "mock" || value === "gemini" || value === "env" ? value : "env";
}

export function parseOperationalRuntimeSettingsForm(formData: FormData): OperationalRuntimeSettings {
  return {
    aiRuntimeMode: parseAiRuntimeMode(formData.get("aiRuntimeMode")),
    aiEnforceBudget: booleanFromForm(formData, "aiEnforceBudget", false),
    aiBlockOnBudgetExceeded: booleanFromForm(formData, "aiBlockOnBudgetExceeded", false),
    reportsPdfGenerationEnabled: booleanFromForm(formData, "reportsPdfGenerationEnabled", true),
    reportsDownloadEnabled: booleanFromForm(formData, "reportsDownloadEnabled", true),
    assessmentsCreationEnabled: booleanFromForm(formData, "assessmentsCreationEnabled", true),
    uploadsEnabled: booleanFromForm(formData, "uploadsEnabled", true),
    publicRegistrationEnabled: booleanFromForm(formData, "publicRegistrationEnabled", true),
    maintenanceMode: booleanFromForm(formData, "maintenanceMode", false),
  };
}

export async function getOperationalRuntimeSettings(): Promise<OperationalRuntimeSettings> {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: RUNTIME_SETTINGS_KEY },
    });

    if (!setting || typeof setting.valueJson !== "object" || setting.valueJson === null || Array.isArray(setting.valueJson)) {
      return DEFAULT_RUNTIME_SETTINGS;
    }

    const value = setting.valueJson as Record<string, unknown>;
    return {
      aiRuntimeMode: parseAiRuntimeMode(value.aiRuntimeMode),
      aiEnforceBudget: booleanValue(value.aiEnforceBudget, DEFAULT_RUNTIME_SETTINGS.aiEnforceBudget),
      aiBlockOnBudgetExceeded: booleanValue(value.aiBlockOnBudgetExceeded, DEFAULT_RUNTIME_SETTINGS.aiBlockOnBudgetExceeded),
      reportsPdfGenerationEnabled: booleanValue(value.reportsPdfGenerationEnabled, DEFAULT_RUNTIME_SETTINGS.reportsPdfGenerationEnabled),
      reportsDownloadEnabled: booleanValue(value.reportsDownloadEnabled, DEFAULT_RUNTIME_SETTINGS.reportsDownloadEnabled),
      assessmentsCreationEnabled: booleanValue(value.assessmentsCreationEnabled, DEFAULT_RUNTIME_SETTINGS.assessmentsCreationEnabled),
      uploadsEnabled: booleanValue(value.uploadsEnabled, DEFAULT_RUNTIME_SETTINGS.uploadsEnabled),
      publicRegistrationEnabled: booleanValue(value.publicRegistrationEnabled, DEFAULT_RUNTIME_SETTINGS.publicRegistrationEnabled),
      maintenanceMode: booleanValue(value.maintenanceMode, DEFAULT_RUNTIME_SETTINGS.maintenanceMode),
    };
  } catch {
    return DEFAULT_RUNTIME_SETTINGS;
  }
}

export async function updateOperationalRuntimeSettings(params: {
  actorUserId: string;
  actorEmail: string;
  settings: OperationalRuntimeSettings;
}) {
  const setting = await prisma.systemSetting.upsert({
    where: { key: RUNTIME_SETTINGS_KEY },
    update: {
      valueJson: params.settings,
      updatedByUserId: params.actorUserId,
    },
    create: {
      key: RUNTIME_SETTINGS_KEY,
      valueJson: params.settings,
      updatedByUserId: params.actorUserId,
    },
  });

  await recordAdminAuditEvent({
    actorUserId: params.actorUserId,
    actorEmail: params.actorEmail,
    eventType: "runtime_setting_updated",
    entityType: "SystemSetting",
    entityId: setting.id,
    message: "Configuracion operativa actualizada desde consola admin.",
    metadataJson: {
      aiRuntimeMode: params.settings.aiRuntimeMode,
      aiEnforceBudget: params.settings.aiEnforceBudget,
      aiBlockOnBudgetExceeded: params.settings.aiBlockOnBudgetExceeded,
      reportsPdfGenerationEnabled: params.settings.reportsPdfGenerationEnabled,
      reportsDownloadEnabled: params.settings.reportsDownloadEnabled,
      assessmentsCreationEnabled: params.settings.assessmentsCreationEnabled,
    },
  });

  const eventTypeByMode: Partial<Record<AiRuntimeMode, string>> = {
    disabled: "ai_runtime_disabled",
    mock: "ai_runtime_mock_enabled",
    env: "ai_runtime_env_enabled",
    gemini: "ai_runtime_gemini_enabled",
  };
  await recordAdminAuditEvent({
    actorUserId: params.actorUserId,
    actorEmail: params.actorEmail,
    eventType: eventTypeByMode[params.settings.aiRuntimeMode] ?? "ai_runtime_env_enabled",
    entityType: "SystemSetting",
    entityId: setting.id,
    message: `Modo runtime IA actualizado a ${params.settings.aiRuntimeMode}.`,
    metadataJson: { aiRuntimeMode: params.settings.aiRuntimeMode },
  });

  return setting;
}

export async function setRuntimeMode(params: {
  actorUserId: string;
  actorEmail: string;
  mode: AiRuntimeMode;
}) {
  const current = await getOperationalRuntimeSettings();
  return updateOperationalRuntimeSettings({
    actorUserId: params.actorUserId,
    actorEmail: params.actorEmail,
    settings: { ...current, aiRuntimeMode: params.mode },
  });
}

export async function getEffectiveUserEntitlement(userId: string | null | undefined) {
  if (!userId) return null;

  const now = new Date();
  const entitlement = await prisma.userEntitlement.findFirst({
    where: {
      userId,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    orderBy: { updatedAt: "desc" },
  });

  return entitlement;
}

function isBlockedEntitlementStatus(status: string | null | undefined) {
  return status === "expired" || status === "revoked" || status === "pending_payment";
}

function planAllowsFullReport(planKey: string | null | undefined) {
  return ["professional", "blueprint", "msp_partner", "internal_qa", "admin"].includes(planKey ?? "");
}

function planAllowsAi(planKey: string | null | undefined) {
  return ["starter", "professional", "blueprint", "msp_partner", "internal_qa", "admin"].includes(planKey ?? "");
}

function ok(message = "Permitido."): OperationalCheck {
  return { allowed: true, code: "allowed", message };
}

function blocked(code: string, message: string): OperationalCheck {
  return { allowed: false, code, message };
}

async function recordBlock(params: {
  userId?: string | null;
  workspaceId?: string | null;
  assessmentId?: string | null;
  eventType: string;
  message: string;
  metadataJson?: Record<string, string | number | boolean | null>;
}) {
  try {
    await prisma.auditEvent.create({
      data: {
        userId: params.userId ?? undefined,
        workspaceId: params.workspaceId ?? undefined,
        assessmentId: params.assessmentId ?? undefined,
        eventType: params.eventType,
        message: params.message,
        metadataJson: params.metadataJson,
      },
    });
  } catch {
    // Enforcement must not turn audit persistence issues into product crashes.
  }
}

export async function canUseAi(params: {
  userId?: string | null;
  assessmentId?: string | null;
  operationType?: string | null;
}): Promise<OperationalCheck> {
  const [settings, budget, globalUsage, userUsage, assessmentUsage, entitlement] = await Promise.all([
    getOperationalRuntimeSettings(),
    getAiBudgetSettings(),
    getAdminAiUsage({ range: "month" }),
    getAdminAiUsage({ range: "month", userId: params.userId ?? null }),
    getAdminAiUsage({ range: "month", assessmentId: params.assessmentId ?? null }),
    getEffectiveUserEntitlement(params.userId),
  ]);

  if (settings.aiRuntimeMode === "disabled") {
    return blocked("disabled_runtime", "La IA esta desactivada temporalmente por configuracion operativa.");
  }

  if (entitlement && isBlockedEntitlementStatus(entitlement.status)) {
    return blocked("entitlement_blocked", "Tu acceso actual no habilita IA. Contacta al administrador para ampliar el acceso.");
  }

  if (entitlement && !entitlement.aiEnabled && !planAllowsAi(entitlement.planKey)) {
    return blocked("entitlement_ai_disabled", "Tu plan actual no habilita IA Advisory.");
  }

  if (settings.aiEnforceBudget && settings.aiBlockOnBudgetExceeded) {
    const globalCost = globalUsage.summary.estimatedCostUsd ?? 0;
    const userCost = userUsage.summary.estimatedCostUsd ?? 0;
    const assessmentCost = assessmentUsage.summary.estimatedCostUsd ?? 0;
    if (budget.monthlyBudgetUsd !== null && globalCost >= budget.monthlyBudgetUsd) {
      return blocked("blocked_budget", "Se alcanzo el presupuesto mensual configurado para IA.");
    }
    if (budget.perUserMonthlyBudgetUsd !== null && userCost >= budget.perUserMonthlyBudgetUsd) {
      return blocked("blocked_limit", "Se alcanzo el limite mensual de IA configurado para este usuario.");
    }
    if (budget.perAssessmentBudgetUsd !== null && assessmentCost >= budget.perAssessmentBudgetUsd) {
      return blocked("blocked_limit", "Se alcanzo el limite de IA configurado para esta evaluacion.");
    }
  }

  return ok();
}

export async function assertCanUseAi(params: {
  userId?: string | null;
  assessmentId?: string | null;
  provider: string;
  model: string | null;
  inputChars: number;
  outputChars: number;
}) {
  const check = await canUseAi(params);
  if (check.allowed) return check;

  await recordBlock({
    userId: params.userId,
    assessmentId: params.assessmentId,
    eventType: check.code === "blocked_budget" ? "ai_budget_blocked" : "entitlement_limit_blocked",
    message: check.message,
    metadataJson: {
      code: check.code,
      provider: params.provider,
      model: params.model,
      inputChars: params.inputChars,
      outputChars: params.outputChars,
    },
  });

  return check;
}

export async function canGeneratePdf(params: {
  userId: string;
  assessmentId: string;
  workspaceId: string;
  reportType: ReportType;
  assessmentFullReportUnlocked?: boolean;
}): Promise<OperationalCheck> {
  const [settings, entitlement, generatedReports] = await Promise.all([
    getOperationalRuntimeSettings(),
    getEffectiveUserEntitlement(params.userId),
    prisma.report.count({
      where: {
        generatedByUserId: params.userId,
        status: "generated",
        deletedAt: null,
      },
    }),
  ]);

  if (!settings.reportsPdfGenerationEnabled) {
    return blocked("pdf_generation_disabled", "La generacion de PDF esta desactivada por administracion.");
  }

  if (entitlement && isBlockedEntitlementStatus(entitlement.status)) {
    return blocked("pdf_blocked_by_entitlement", "Tu plan actual no habilita este reporte completo.");
  }

  if (params.reportType !== ReportType.free_preview) {
    const fullReportAllowed = params.assessmentFullReportUnlocked || entitlement?.fullReportEnabled || planAllowsFullReport(entitlement?.planKey);
    if (!fullReportAllowed) {
      return blocked("pdf_blocked_by_entitlement", "Tu plan actual no habilita este reporte completo.");
    }
  }

  if (entitlement?.maxPdfReports !== null && entitlement?.maxPdfReports !== undefined && generatedReports >= entitlement.maxPdfReports) {
    return blocked("entitlement_limit_blocked", "Se alcanzo el limite de reportes PDF configurado para tu acceso.");
  }

  return ok();
}

export async function assertCanGeneratePdf(params: {
  userId: string;
  assessmentId: string;
  workspaceId: string;
  reportType: ReportType;
  assessmentFullReportUnlocked?: boolean;
}) {
  const check = await canGeneratePdf(params);
  if (check.allowed) return;

  await recordBlock({
    userId: params.userId,
    workspaceId: params.workspaceId,
    assessmentId: params.assessmentId,
    eventType: check.code === "pdf_generation_disabled" ? "pdf_generation_disabled" : check.code,
    message: check.message,
    metadataJson: { code: check.code, reportType: params.reportType },
  });
  throw new OperationalBlockError(check);
}

export async function assertCanDownloadReport(params: {
  userId: string;
  assessmentId: string;
  workspaceId: string;
  reportType: ReportType;
  assessmentFullReportUnlocked?: boolean;
}) {
  const [settings, entitlement] = await Promise.all([
    getOperationalRuntimeSettings(),
    getEffectiveUserEntitlement(params.userId),
  ]);

  let check = ok();
  if (!settings.reportsDownloadEnabled) {
    check = blocked("report_download_disabled", "Las descargas de reportes estan desactivadas por administracion.");
  } else if (entitlement && isBlockedEntitlementStatus(entitlement.status)) {
    check = blocked("pdf_blocked_by_entitlement", "Tu plan actual no habilita la descarga de este reporte.");
  } else if (params.reportType !== ReportType.free_preview) {
    const fullReportAllowed = params.assessmentFullReportUnlocked || entitlement?.fullReportEnabled || planAllowsFullReport(entitlement?.planKey);
    if (!fullReportAllowed) {
      check = blocked("pdf_blocked_by_entitlement", "Tu plan actual no habilita la descarga de este reporte.");
    }
  }

  if (check.allowed) return;

  await recordBlock({
    userId: params.userId,
    workspaceId: params.workspaceId,
    assessmentId: params.assessmentId,
    eventType: check.code === "report_download_disabled" ? "report_download_disabled" : check.code,
    message: check.message,
    metadataJson: { code: check.code, reportType: params.reportType },
  });
  throw new OperationalBlockError(check);
}

export async function assertCanCreateAssessment(params: {
  userId: string;
  workspaceId: string;
}) {
  const [settings, entitlement, assessmentCount] = await Promise.all([
    getOperationalRuntimeSettings(),
    getEffectiveUserEntitlement(params.userId),
    prisma.assessment.count({
      where: {
        archivedAt: null,
        workspace: {
          members: {
            some: { userId: params.userId },
          },
        },
      },
    }),
  ]);

  let check = ok();
  if (!settings.assessmentsCreationEnabled) {
    check = blocked("assessment_creation_disabled", "La creacion de nuevas evaluaciones esta desactivada por administracion.");
  } else if (entitlement && isBlockedEntitlementStatus(entitlement.status)) {
    check = blocked("assessment_blocked_by_entitlement", "Tu acceso actual no habilita nuevas evaluaciones.");
  } else if (entitlement?.maxAssessments !== null && entitlement?.maxAssessments !== undefined && assessmentCount >= entitlement.maxAssessments) {
    check = blocked("assessment_blocked_by_entitlement", "Se alcanzo el limite de evaluaciones configurado para tu acceso.");
  }

  if (check.allowed) return;

  await recordBlock({
    userId: params.userId,
    workspaceId: params.workspaceId,
    eventType: check.code,
    message: check.message,
    metadataJson: { code: check.code, assessmentCount, maxAssessments: entitlement?.maxAssessments ?? null },
  });
  throw new OperationalBlockError(check);
}
