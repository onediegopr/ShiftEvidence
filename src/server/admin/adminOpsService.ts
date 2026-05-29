import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { getAdminAiUsage } from "../ai/aiUsageService";
import { INPUT_LIMITS, normalizeOptionalTextInput } from "../validation/inputLimits";
import { buildAdminPaginationMeta } from "./adminPagination";

export type AiBudgetSettings = {
  monthlyBudgetUsd: number | null;
  alertThreshold50: boolean;
  alertThreshold80: boolean;
  alertThreshold100: boolean;
  dailyBudgetUsd: number | null;
  perUserMonthlyBudgetUsd: number | null;
  perAssessmentBudgetUsd: number | null;
};

const AI_BUDGET_KEY = "ai.budget";
const DEFAULT_AI_BUDGET: AiBudgetSettings = {
  monthlyBudgetUsd: null,
  alertThreshold50: true,
  alertThreshold80: true,
  alertThreshold100: true,
  dailyBudgetUsd: null,
  perUserMonthlyBudgetUsd: null,
  perAssessmentBudgetUsd: null,
};

function numberOrNull(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function booleanFromForm(value: unknown) {
  return value === "on" || value === "true" || value === true;
}

function safeString(
  value: unknown,
  fallback = "",
  options: { fieldName?: string; maxLength?: number } = {},
) {
  const parsed = normalizeOptionalTextInput(
    value,
    options.fieldName ?? "Value",
    options.maxLength ?? INPUT_LIMITS.shortText,
  );

  return parsed ?? fallback;
}

function safeJson(value: unknown): Prisma.InputJsonValue | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const unsafe = /key|secret|token|cookie|password|authorization|database_url|direct_url|storage|path|prompt|response/i;
  const output: Record<string, Prisma.InputJsonValue> = {};

  for (const [key, item] of Object.entries(value)) {
    if (unsafe.test(key)) continue;
    if (typeof item === "string") output[key] = item.slice(0, 160);
    if (typeof item === "number" || typeof item === "boolean" || item === null) output[key] = item;
  }

  return Object.keys(output).length > 0 ? output : undefined;
}

export async function recordAdminAuditEvent(params: {
  actorUserId?: string | null;
  actorEmail?: string | null;
  eventType: string;
  entityType?: string | null;
  entityId?: string | null;
  severity?: "info" | "warning" | "critical";
  message: string;
  metadataJson?: unknown;
}) {
  await prisma.auditEvent.create({
    data: {
      userId: params.actorUserId ?? undefined,
      eventType: params.eventType,
      message: params.message,
      metadataJson: safeJson({
        actorEmail: params.actorEmail ?? null,
        entityType: params.entityType ?? null,
        entityId: params.entityId ?? null,
        severity: params.severity ?? "info",
        ...(typeof params.metadataJson === "object" && params.metadataJson ? params.metadataJson : {}),
      }),
    },
  });
}

export async function getAiBudgetSettings(): Promise<AiBudgetSettings> {
  const setting = await prisma.systemSetting.findUnique({
    where: { key: AI_BUDGET_KEY },
  });

  if (!setting || typeof setting.valueJson !== "object" || setting.valueJson === null || Array.isArray(setting.valueJson)) {
    return DEFAULT_AI_BUDGET;
  }

  const value = setting.valueJson as Record<string, unknown>;
  return {
    monthlyBudgetUsd: numberOrNull(value.monthlyBudgetUsd),
    alertThreshold50: value.alertThreshold50 !== false,
    alertThreshold80: value.alertThreshold80 !== false,
    alertThreshold100: value.alertThreshold100 !== false,
    dailyBudgetUsd: numberOrNull(value.dailyBudgetUsd),
    perUserMonthlyBudgetUsd: numberOrNull(value.perUserMonthlyBudgetUsd),
    perAssessmentBudgetUsd: numberOrNull(value.perAssessmentBudgetUsd),
  };
}

export async function updateAiBudgetSettings(params: {
  actorUserId: string;
  actorEmail: string;
  settings: AiBudgetSettings;
}) {
  const valueJson = params.settings as unknown as Prisma.InputJsonValue;
  const setting = await prisma.systemSetting.upsert({
    where: { key: AI_BUDGET_KEY },
    update: {
      valueJson,
      updatedByUserId: params.actorUserId,
    },
    create: {
      key: AI_BUDGET_KEY,
      valueJson,
      updatedByUserId: params.actorUserId,
    },
  });

  await recordAdminAuditEvent({
    actorUserId: params.actorUserId,
    actorEmail: params.actorEmail,
    eventType: "ai_budget_updated",
    entityType: "SystemSetting",
    entityId: setting.id,
    message: "Presupuesto IA actualizado desde consola admin.",
    metadataJson: {
      monthlyBudgetConfigured: params.settings.monthlyBudgetUsd !== null,
      dailyBudgetConfigured: params.settings.dailyBudgetUsd !== null,
      perUserConfigured: params.settings.perUserMonthlyBudgetUsd !== null,
      perAssessmentConfigured: params.settings.perAssessmentBudgetUsd !== null,
    },
  });

  return setting;
}

export async function getAdminAiBudgetSummary() {
  const [settings, aiUsage] = await Promise.all([
    getAiBudgetSettings(),
    getAdminAiUsage({ range: "month" }),
  ]);
  const spent = aiUsage.summary.estimatedCostUsd ?? 0;
  const budget = settings.monthlyBudgetUsd;
  const percentUsed = budget && budget > 0 ? Math.round((spent / budget) * 100) : null;
  const remaining = budget === null ? null : Math.max(0, budget - spent);
  const alerts = [
    budget === null
      ? {
          status: "Info",
          title: "Presupuesto IA no configurado",
          message: "Configura un presupuesto mensual estimado para activar alertas operativas.",
        }
      : null,
    percentUsed !== null && settings.alertThreshold50 && percentUsed >= 50
      ? { status: "Atencion", title: "Consumo IA supera 50%", message: `Uso estimado: ${percentUsed}% del presupuesto mensual.` }
      : null,
    percentUsed !== null && settings.alertThreshold80 && percentUsed >= 80
      ? { status: "Atencion", title: "Consumo IA supera 80%", message: `Uso estimado: ${percentUsed}% del presupuesto mensual.` }
      : null,
    percentUsed !== null && settings.alertThreshold100 && percentUsed >= 100
      ? { status: "Critico", title: "Presupuesto IA superado", message: `Uso estimado: ${percentUsed}% del presupuesto mensual.` }
      : null,
    {
      status: "Info",
      title: "Limites informativos",
      message: "El bloqueo automatico depende de Configuracion Operativa: enforcement IA y bloquear al superar presupuesto.",
    },
  ].filter((alert): alert is { status: string; title: string; message: string } => Boolean(alert));

  return {
    settings,
    spentMonthUsd: spent,
    monthlyBudgetUsd: budget,
    percentUsed,
    remainingMonthUsd: remaining,
    alerts,
  };
}

export function parseAiBudgetForm(formData: FormData): AiBudgetSettings {
  return {
    monthlyBudgetUsd: numberOrNull(formData.get("monthlyBudgetUsd")),
    alertThreshold50: booleanFromForm(formData.get("alertThreshold50")),
    alertThreshold80: booleanFromForm(formData.get("alertThreshold80")),
    alertThreshold100: booleanFromForm(formData.get("alertThreshold100")),
    dailyBudgetUsd: numberOrNull(formData.get("dailyBudgetUsd")),
    perUserMonthlyBudgetUsd: numberOrNull(formData.get("perUserMonthlyBudgetUsd")),
    perAssessmentBudgetUsd: numberOrNull(formData.get("perAssessmentBudgetUsd")),
  };
}

export async function upsertUserEntitlementFromForm(params: {
  actorUserId: string;
  actorEmail: string;
  formData: FormData;
}) {
  const userId = safeString(params.formData.get("userId"));
  if (!userId) throw new Error("Usuario requerido.");

  const expiresAtRaw = safeString(params.formData.get("expiresAt"));
  const expiresAt = expiresAtRaw ? new Date(`${expiresAtRaw}T23:59:59.000Z`) : null;

  const entitlement = await prisma.userEntitlement.create({
    data: {
      userId,
      planKey: safeString(params.formData.get("planKey"), "free_preview"),
      status: safeString(params.formData.get("status"), "manual"),
      source: safeString(params.formData.get("source"), "admin"),
      expiresAt: expiresAt && !Number.isNaN(expiresAt.getTime()) ? expiresAt : null,
      maxAssessments: numberOrNull(params.formData.get("maxAssessments")),
      maxPdfReports: numberOrNull(params.formData.get("maxPdfReports")),
      aiEnabled: booleanFromForm(params.formData.get("aiEnabled")),
      fullReportEnabled: booleanFromForm(params.formData.get("fullReportEnabled")),
      notesInternal: safeString(params.formData.get("notesInternal"), "", {
        fieldName: "Internal notes",
        maxLength: INPUT_LIMITS.notes,
      }) || null,
      createdByUserId: params.actorUserId,
    },
  });

  await recordAdminAuditEvent({
    actorUserId: params.actorUserId,
    actorEmail: params.actorEmail,
    eventType: "entitlement_granted",
    entityType: "UserEntitlement",
    entityId: entitlement.id,
    message: "Acceso manual creado desde consola admin.",
    metadataJson: {
      userId,
      planKey: entitlement.planKey,
      status: entitlement.status,
      source: entitlement.source,
    },
  });

  return entitlement;
}

export async function revokeUserEntitlement(params: {
  actorUserId: string;
  actorEmail: string;
  entitlementId: string;
}) {
  const entitlement = await prisma.userEntitlement.update({
    where: { id: params.entitlementId },
    data: {
      status: "revoked",
      notesInternal: "Revocado desde consola admin.",
    },
  });

  await recordAdminAuditEvent({
    actorUserId: params.actorUserId,
    actorEmail: params.actorEmail,
    eventType: "entitlement_revoked",
    entityType: "UserEntitlement",
    entityId: entitlement.id,
    message: "Acceso manual revocado desde consola admin.",
    metadataJson: { userId: entitlement.userId, planKey: entitlement.planKey },
  });

  return entitlement;
}

export async function listUserEntitlements() {
  return prisma.userEntitlement.findMany({
    orderBy: { updatedAt: "desc" },
    take: 50,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  });
}

export function computeOpportunityScore(params: {
  vmCount: number;
  readiness: number | null;
  confidence: number | null;
  evidenceFiles: number;
  pdfReports: number;
  aiCalls: number;
  hasContext: boolean;
  plan: string | null;
}) {
  let score = 10;
  if (params.vmCount >= 100) score += 25;
  else if (params.vmCount >= 40) score += 18;
  else if (params.vmCount >= 10) score += 10;
  if ((params.readiness ?? 100) < 60) score += 12;
  if ((params.confidence ?? 100) < 60) score += 12;
  if (params.evidenceFiles > 0) score += 10;
  if (params.pdfReports > 0) score += 10;
  if (params.aiCalls > 0) score += 8;
  if (!params.hasContext) score += 5;
  if (params.plan === "free" || !params.plan) score += 8;
  return Math.max(0, Math.min(100, score));
}

export function getOpportunityTags(score: number, params: { confidence: number | null; readiness: number | null; vmCount: number; hasContext: boolean }) {
  const tags: string[] = [];
  if (score >= 70) tags.push("Alto potencial");
  if (score >= 50) tags.push("Requiere seguimiento");
  if (params.vmCount >= 80) tags.push("Candidato Blueprint");
  if ((params.confidence ?? 100) < 60) tags.push("Falta evidencia critica");
  if ((params.readiness ?? 100) < 50) tags.push("Riesgo alto");
  if (!params.hasContext) tags.push("Completar contexto");
  if (tags.length === 0) tags.push("No contactar todavia");
  return tags;
}

export function getNextBestAction(tags: string[]) {
  if (tags.includes("Falta evidencia critica")) return "Solicitar Veeam export / mapa de dependencias";
  if (tags.includes("Candidato Blueprint")) return "Ofrecer Migration Blueprint";
  if (tags.includes("Alto potencial")) return "Agendar revision tecnica";
  if (tags.includes("Completar contexto")) return "Solicitar contexto faltante";
  return "No contactar todavia";
}

export async function getCommercialOpportunities() {
  const aiUsage = await getAdminAiUsage({ range: "30d" });
  const usageByAssessment = new Map(aiUsage.byAssessment.filter((item) => item.assessmentId).map((item) => [item.assessmentId, item]));
  const existing = await prisma.commercialOpportunity.findMany({
    orderBy: [{ score: "desc" }, { updatedAt: "desc" }],
    take: 100,
  });
  const existingByAssessment = new Map(existing.filter((item) => item.assessmentId).map((item) => [item.assessmentId, item]));
  const assessments = await prisma.assessment.findMany({
    orderBy: { updatedAt: "desc" },
    take: 50,
    select: {
      id: true,
      title: true,
      clientLabel: true,
      updatedAt: true,
      workspace: {
        select: {
          plan: true,
          ownerUserId: true,
          ownerUser: { select: { email: true, name: true } },
        },
      },
      evidenceFiles: { where: { deletedAt: null }, select: { id: true } },
      reports: { where: { deletedAt: null }, select: { status: true } },
      parsedInventorySummaries: { select: { vmCount: true }, take: 1 },
      assessmentScore: { select: { readinessScore: true, confidenceScore: true } },
      costRiskAssumptions: { select: { assumptionsJson: true } },
    },
  });

  return assessments.map((assessment) => {
    const vmCount = assessment.parsedInventorySummaries[0]?.vmCount ?? 0;
    const assumptions = assessment.costRiskAssumptions?.assumptionsJson;
    const hasContext = Boolean(assumptions && typeof assumptions === "object" && !Array.isArray(assumptions) && "migrationContext" in assumptions);
    const usage = usageByAssessment.get(assessment.id);
    const score = computeOpportunityScore({
      vmCount,
      readiness: assessment.assessmentScore?.readinessScore ?? null,
      confidence: assessment.assessmentScore?.confidenceScore ?? null,
      evidenceFiles: assessment.evidenceFiles.length,
      pdfReports: assessment.reports.filter((report) => report.status === "generated").length,
      aiCalls: usage?.calls ?? 0,
      hasContext,
      plan: assessment.workspace.plan,
    });
    const tags = getOpportunityTags(score, {
      confidence: assessment.assessmentScore?.confidenceScore ?? null,
      readiness: assessment.assessmentScore?.readinessScore ?? null,
      vmCount,
      hasContext,
    });
    const stored = existingByAssessment.get(assessment.id);

    return {
      id: stored?.id ?? assessment.id,
      userId: assessment.workspace.ownerUserId,
      assessmentId: assessment.id,
      client: assessment.clientLabel ?? assessment.workspace.ownerUser.email,
      ownerEmail: assessment.workspace.ownerUser.email,
      assessmentTitle: assessment.title,
      score: stored?.score ?? score,
      tags: stored?.tagsJson && Array.isArray(stored.tagsJson) ? stored.tagsJson.filter((tag): tag is string => typeof tag === "string") : tags,
      nextBestAction: stored?.nextBestAction ?? getNextBestAction(tags),
      suggestedPlan: stored?.suggestedPlan ?? (score >= 75 ? "blueprint" : score >= 55 ? "professional" : "starter"),
      status: stored?.status ?? "new_lead",
      notesInternal: stored?.notesInternal ?? null,
      lastActivityAt: stored?.lastActivityAt ?? assessment.updatedAt,
      updatedAt: stored?.updatedAt ?? assessment.updatedAt,
    };
  });
}

export async function updateCommercialOpportunityFromForm(params: {
  actorUserId: string;
  actorEmail: string;
  formData: FormData;
}) {
  const assessmentId = safeString(params.formData.get("assessmentId"));
  const userId = safeString(params.formData.get("userId"));
  const status = safeString(params.formData.get("status"), "needs_follow_up");
  const notesInternal = safeString(params.formData.get("notesInternal"), "", {
    fieldName: "Internal notes",
    maxLength: INPUT_LIMITS.notes,
  }) || null;
  const nextBestAction = safeString(params.formData.get("nextBestAction"), "", {
    fieldName: "Next best action",
    maxLength: INPUT_LIMITS.description,
  }) || "Hacer seguimiento comercial";
  const suggestedPlan = safeString(params.formData.get("suggestedPlan"), "", {
    fieldName: "Suggested plan",
    maxLength: INPUT_LIMITS.shortText,
  }) || null;
  const score = Number(params.formData.get("score"));
  const safeScore = Number.isFinite(score) ? Math.max(0, Math.min(100, Math.round(score))) : 50;

  const existing = assessmentId
    ? await prisma.commercialOpportunity.findFirst({ where: { assessmentId } })
    : null;

  const opportunity = existing
    ? await prisma.commercialOpportunity.update({
        where: { id: existing.id },
        data: {
          userId: userId || existing.userId,
          status,
          notesInternal,
          nextBestAction,
          suggestedPlan,
          score: safeScore,
          updatedByUserId: params.actorUserId,
          lastActivityAt: new Date(),
        },
      })
    : await prisma.commercialOpportunity.create({
        data: {
          assessmentId: assessmentId || null,
          userId: userId || null,
          status,
          notesInternal,
          nextBestAction,
          suggestedPlan,
          score: safeScore,
          tagsJson: [],
          updatedByUserId: params.actorUserId,
          lastActivityAt: new Date(),
        },
      });

  await recordAdminAuditEvent({
    actorUserId: params.actorUserId,
    actorEmail: params.actorEmail,
    eventType: "commercial_status_updated",
    entityType: "CommercialOpportunity",
    entityId: opportunity.id,
    message: "Oportunidad comercial actualizada desde consola admin.",
    metadataJson: { assessmentId, status, suggestedPlan },
  });

  return opportunity;
}

export async function getAdvancedAuditEventsPage(params?: {
  limit?: number;
  page?: number;
}) {
  const limit = params?.limit ?? 100;
  const page = params?.page && params.page > 0 ? params.page : 1;
  const rows = await prisma.auditEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    skip: (page - 1) * limit,
    select: {
      id: true,
      eventType: true,
      message: true,
      metadataJson: true,
      createdAt: true,
      user: { select: { email: true } },
      assessment: { select: { title: true } },
    },
  });

  const hasMore = rows.length > limit;
  const events = rows.slice(0, limit);

  return {
    events,
    pagination: buildAdminPaginationMeta({
      limit,
      page,
      returned: events.length,
      hasMore,
    }),
  };
}

export async function getAdvancedAuditEvents(params?: {
  limit?: number;
  page?: number;
}) {
  return (await getAdvancedAuditEventsPage(params)).events;
}
