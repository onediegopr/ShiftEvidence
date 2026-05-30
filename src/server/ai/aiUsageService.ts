import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { buildAdminPaginationMeta } from "../admin/adminPagination";
import { logger } from "../logging/logger";
import type { AiAdvisoryProvider } from "./aiAdvisoryTypes";

export type AiUsageOperationType =
  | "preview"
  | "pdf"
  | "synthetic_test"
  | "admin_test"
  | "retry"
  | "client_context_analysis"
  | "storage_context_analysis"
  | "senior_advisor_message"
  | "unknown";
export type AiUsageStatus =
  | "success"
  | "error"
  | "timeout"
  | "unavailable"
  | "fallback"
  | "disabled"
  | "mock"
  | "blocked_budget"
  | "blocked_limit"
  | "disabled_runtime";

const MODEL_COST_USD_PER_MILLION_TOKENS: Record<string, { input: number; output: number }> = {
  "gemini:gemini-1.5-flash": {
    input: 0.075,
    output: 0.3,
  },
  "gemini:gemini-2.5-flash": {
    input: 0.075,
    output: 0.3,
  },
};

function normalizeNullableString(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function estimateTokensFromChars(chars: number | null | undefined) {
  if (!chars || chars <= 0) {
    return 0;
  }

  return Math.ceil(chars / 4);
}

export function estimateAiCostUsd(params: {
  provider: AiAdvisoryProvider;
  model: string | null;
  inputTokens: number;
  outputTokens: number;
}) {
  if (params.provider === "mock" || params.provider === "disabled" || params.provider === "none") {
    return 0;
  }

  const key = `${params.provider}:${params.model ?? "unknown"}`;
  const pricing = MODEL_COST_USD_PER_MILLION_TOKENS[key];
  if (!pricing) {
    return null;
  }

  return (params.inputTokens / 1_000_000) * pricing.input + (params.outputTokens / 1_000_000) * pricing.output;
}

function sanitizeMetadata(value: unknown): Prisma.InputJsonValue | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  const unsafeKeys = /key|secret|token|cookie|password|authorization|database_url|direct_url|storage|path|prompt|response/i;
  const safe: Record<string, Prisma.InputJsonValue> = {};
  for (const [key, item] of Object.entries(value)) {
    if (unsafeKeys.test(key)) {
      continue;
    }

    if (typeof item === "string") {
      safe[key] = item.slice(0, 160);
    } else if (typeof item === "number" || typeof item === "boolean" || item === null) {
      safe[key] = item;
    }
  }

  return Object.keys(safe).length > 0 ? safe : undefined;
}

export async function recordAiUsageEvent(params: {
  assessmentId?: string | null;
  userId?: string | null;
  provider: AiAdvisoryProvider;
  model: string | null;
  operationType?: AiUsageOperationType;
  status: AiUsageStatus;
  durationMs?: number | null;
  inputChars?: number | null;
  outputChars?: number | null;
  errorCategory?: string | null;
  fallbackUsed?: boolean;
  metadataJson?: unknown;
}) {
  const inputTokens = estimateTokensFromChars(params.inputChars);
  const outputTokens = estimateTokensFromChars(params.outputChars);
  const totalTokens = inputTokens + outputTokens;
  const estimatedCostUsd = estimateAiCostUsd({
    provider: params.provider,
    model: params.model,
    inputTokens,
    outputTokens,
  });

  try {
    await prisma.aiUsageEvent.create({
      data: {
        assessmentId: normalizeNullableString(params.assessmentId),
        userId: normalizeNullableString(params.userId),
        provider: params.provider,
        model: params.model,
        operationType: params.operationType ?? "unknown",
        status: params.status,
        durationMs: params.durationMs ?? null,
        inputChars: params.inputChars ?? null,
        outputChars: params.outputChars ?? null,
        estimatedInputTokens: inputTokens,
        estimatedOutputTokens: outputTokens,
        estimatedTotalTokens: totalTokens,
        estimatedCostUsd,
        errorCategory: normalizeNullableString(params.errorCategory)?.slice(0, 255) ?? null,
        fallbackUsed: params.fallbackUsed ?? false,
        metadataJson: sanitizeMetadata(params.metadataJson),
      },
    });
  } catch (error) {
    logger.warn("ai_usage_event_persistence_failed", {
      assessmentId: params.assessmentId ?? null,
      userId: params.userId ?? null,
      provider: params.provider,
      model: params.model,
      operationType: params.operationType ?? "unknown",
      status: params.status,
      error,
    });
  }
}

function getRangeStart(range: string | null | undefined) {
  const date = new Date();
  switch (range) {
    case "24h":
      date.setHours(date.getHours() - 24);
      return date;
    case "7d":
      date.setDate(date.getDate() - 7);
      return date;
    case "month":
    case "30d":
    default:
      date.setDate(date.getDate() - 30);
      return date;
  }
}

function sum(values: Array<number | null | undefined>) {
  return values.reduce<number>((total, value) => total + (value ?? 0), 0);
}

function roundMoney(value: number | null) {
  return value === null ? null : Number(value.toFixed(6));
}

export async function getAdminAiUsage(params?: {
  range?: string | null;
  provider?: string | null;
  status?: string | null;
  userId?: string | null;
  assessmentId?: string | null;
  limit?: number;
  page?: number;
}) {
  const since = getRangeStart(params?.range);
  const limit = params?.limit ?? 500;
  const page = params?.page && params.page > 0 ? params.page : 1;
  const where: Prisma.AiUsageEventWhereInput = {
    createdAt: { gte: since },
    provider: normalizeNullableString(params?.provider) ?? undefined,
    status: normalizeNullableString(params?.status) ?? undefined,
    userId: normalizeNullableString(params?.userId) ?? undefined,
    assessmentId: normalizeNullableString(params?.assessmentId) ?? undefined,
  };

  const [eventRows, calls24h, calls7d, calls30d] = await Promise.all([
    prisma.aiUsageEvent.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      skip: (page - 1) * limit,
      include: {
        user: { select: { email: true, name: true } },
        assessment: {
          select: {
            title: true,
            clientLabel: true,
            workspace: {
              select: {
                ownerUserId: true,
              },
            },
          },
        },
      },
    }),
    prisma.aiUsageEvent.count({ where: { createdAt: { gte: getRangeStart("24h") } } }),
    prisma.aiUsageEvent.count({ where: { createdAt: { gte: getRangeStart("7d") } } }),
    prisma.aiUsageEvent.count({ where: { createdAt: { gte: getRangeStart("30d") } } }),
  ]);
  const hasMore = eventRows.length > limit;
  const events = eventRows.slice(0, limit);
  const ownerUserIds = [
    ...new Set(
      events
        .map((event) => event.assessment?.workspace.ownerUserId)
        .filter((userId): userId is string => Boolean(userId)),
    ),
  ];
  const ownerUsers = ownerUserIds.length > 0
    ? await prisma.user.findMany({
        where: { id: { in: ownerUserIds } },
        select: { id: true, email: true },
      })
    : [];
  const ownerEmailById = new Map(ownerUsers.map((user) => [user.id, user.email]));

  const totalCalls = events.length;
  const successCount = events.filter((event) => event.status === "success" || event.status === "mock").length;
  const errorCount = events.filter((event) => event.status === "error" || event.status.startsWith("blocked_") || event.status === "disabled_runtime").length;
  const timeoutCount = events.filter((event) => event.status === "timeout").length;
  const fallbackCount = events.filter((event) => event.fallbackUsed || event.status === "fallback").length;
  const durationEvents = events.filter((event) => typeof event.durationMs === "number");
  const totalCost = sum(events.map((event) => event.estimatedCostUsd));

  const byUser = new Map<string, {
    userId: string | null;
    name: string;
    email: string;
    calls: number;
    tokens: number;
    cost: number;
    errors: number;
    lastEventAt: Date;
  }>();

  const byAssessment = new Map<string, {
    assessmentId: string | null;
    title: string;
    owner: string;
    calls: number;
    tokens: number;
    cost: number;
    errors: number;
    lastStatus: string;
    lastEventAt: Date;
  }>();

  for (const event of events) {
    const userKey = event.userId ?? "sin-usuario";
    const existingUser = byUser.get(userKey) ?? {
      userId: event.userId,
      name: event.user?.name ?? "No disponible",
      email: event.user?.email ?? "No disponible",
      calls: 0,
      tokens: 0,
      cost: 0,
      errors: 0,
      lastEventAt: event.createdAt,
    };
    existingUser.calls += 1;
    existingUser.tokens += event.estimatedTotalTokens ?? 0;
    existingUser.cost += event.estimatedCostUsd ?? 0;
    existingUser.errors += event.status === "error" || event.status === "timeout" || event.status.startsWith("blocked_") || event.status === "disabled_runtime" ? 1 : 0;
    if (event.createdAt > existingUser.lastEventAt) existingUser.lastEventAt = event.createdAt;
    byUser.set(userKey, existingUser);

    const assessmentKey = event.assessmentId ?? "sin-assessment";
    const existingAssessment = byAssessment.get(assessmentKey) ?? {
      assessmentId: event.assessmentId,
      title: event.assessment?.title ?? "No disponible",
      owner: event.assessment?.workspace.ownerUserId
        ? ownerEmailById.get(event.assessment.workspace.ownerUserId) ?? "Propietario no disponible en este runtime"
        : "No disponible",
      calls: 0,
      tokens: 0,
      cost: 0,
      errors: 0,
      lastStatus: event.status,
      lastEventAt: event.createdAt,
    };
    existingAssessment.calls += 1;
    existingAssessment.tokens += event.estimatedTotalTokens ?? 0;
    existingAssessment.cost += event.estimatedCostUsd ?? 0;
    existingAssessment.errors += event.status === "error" || event.status === "timeout" || event.status.startsWith("blocked_") || event.status === "disabled_runtime" ? 1 : 0;
    if (event.createdAt > existingAssessment.lastEventAt) {
      existingAssessment.lastEventAt = event.createdAt;
      existingAssessment.lastStatus = event.status;
    }
    byAssessment.set(assessmentKey, existingAssessment);
  }

  const errorRate = totalCalls > 0 ? (errorCount + timeoutCount) / totalCalls : 0;
  const alerts = [
    totalCalls === 0
      ? {
          status: "Info",
          title: "Sin eventos persistidos",
          message: "Todavia no hay eventos IA persistidos para el rango seleccionado.",
        }
      : null,
    errorRate > 0.2
      ? {
          status: "Atencion",
          title: "Tasa de error alta",
          message: `Errores/timeouts sobre llamadas: ${Math.round(errorRate * 100)}%.`,
        }
      : null,
    totalCost === 0
      ? {
          status: "Info",
          title: "Costo estimado no disponible o cero",
          message: "El costo puede ser cero para mock/disabled o modelos sin tarifa configurada.",
        }
      : null,
  ].filter((alert): alert is { status: string; title: string; message: string } => Boolean(alert));

  return {
    summary: {
      range: params?.range ?? "30d",
      totalCalls,
      calls24h,
      calls7d,
      calls30d,
      successCount,
      errorCount,
      timeoutCount,
      fallbackCount,
      estimatedInputTokens: sum(events.map((event) => event.estimatedInputTokens)),
      estimatedOutputTokens: sum(events.map((event) => event.estimatedOutputTokens)),
      estimatedTotalTokens: sum(events.map((event) => event.estimatedTotalTokens)),
      estimatedCostUsd: roundMoney(totalCost),
      averageDurationMs:
        durationEvents.length > 0
          ? Math.round(sum(durationEvents.map((event) => event.durationMs)) / durationEvents.length)
          : null,
      lastEventAt: events[0]?.createdAt ?? null,
    },
    recentEvents: events.slice(0, 25).map((event) => ({
      id: event.id,
      createdAt: event.createdAt,
      provider: event.provider,
      model: event.model,
      operationType: event.operationType,
      status: event.status,
      durationMs: event.durationMs,
      estimatedTotalTokens: event.estimatedTotalTokens,
      estimatedCostUsd: roundMoney(event.estimatedCostUsd),
      errorCategory: event.errorCategory,
      fallbackUsed: event.fallbackUsed,
      userEmail: event.user?.email ?? null,
      assessmentId: event.assessmentId,
      assessmentTitle: event.assessment?.title ?? null,
    })),
    byUser: [...byUser.values()]
      .sort((a, b) => b.calls - a.calls)
      .slice(0, 10)
      .map((item) => ({ ...item, cost: roundMoney(item.cost) })),
    byAssessment: [...byAssessment.values()]
      .sort((a, b) => b.calls - a.calls)
      .slice(0, 10)
      .map((item) => ({ ...item, cost: roundMoney(item.cost) })),
    recentErrors: events
      .filter((event) => event.status === "error" || event.status === "timeout" || event.status.startsWith("blocked_") || event.status === "disabled_runtime" || event.fallbackUsed)
      .slice(0, 20)
      .map((event) => ({
        id: event.id,
        createdAt: event.createdAt,
        provider: event.provider,
        model: event.model,
        status: event.status,
        errorCategory: event.errorCategory,
        assessmentTitle: event.assessment?.title ?? null,
        userEmail: event.user?.email ?? null,
      })),
    pagination: buildAdminPaginationMeta({
      limit,
      page,
      returned: events.length,
      hasMore,
    }),
    alerts,
  };
}
