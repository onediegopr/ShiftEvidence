import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { getAdminAiUsage } from "../ai/aiUsageService";
import { getAiRuntimeStatus } from "../ai/aiRuntimeStatus";
import { logger } from "../logging/logger";
import {
  getAdvisorMethodologyAdminSnapshot,
  type AdvisorMethodologyAdminSnapshot,
} from "./advisorMethodologyAdminService";
import {
  getAdminAiBudgetSummary,
  getAdvancedAuditEvents,
  getCommercialOpportunities,
  listUserEntitlements,
} from "./adminOpsService";
import { DEFAULT_RUNTIME_SETTINGS, getOperationalRuntimeSettings } from "./runtimeSettingsService";
import { getAdminSupportRequests, getSupportRequestFallback } from "../support/supportRequestService";
import { getBillingAdminStatus } from "../billing/billingConfiguration";
import { getEvidenceModuleCatalog } from "../evidence/evidenceModuleRegistry";

function isConfigured(value: string | undefined) {
  return Boolean(value && value.trim());
}
function safeVisibleValue(value: string | undefined) {
  return isConfigured(value) ? value : "No configurada";
}

function configState(value: string | undefined) {
  return isConfigured(value) ? "Configurada" : "No configurada";
}

function sevenDaysAgo() {
  const date = new Date();
  date.setDate(date.getDate() - 7);
  return date;
}

function statusFromBoolean(value: boolean, configuredLabel = "Operativo") {
  return value ? configuredLabel : "No configurado";
}

type AdminAiRuntimeStatus = Awaited<ReturnType<typeof getAiRuntimeStatus>>;
type AdminAiUsage = Awaited<ReturnType<typeof getAdminAiUsage>>;
type AdminAiBudgetSummary = Awaited<ReturnType<typeof getAdminAiBudgetSummary>>;

export type AdminSectionKey =
  | "owner_lookup"
  | "summary_metrics"
  | "users"
  | "assessments"
  | "audit_events"
  | "entitlements"
  | "commercial_opportunities"
  | "ai_budget"
  | "advanced_audit"
  | "runtime_settings"
  | "advisor_methodology"
  | "owner_emails"
  | "ai_status"
  | "ai_usage"
  | "support_requests"
  | "storage_ceph";

export type AdminSectionFailure = {
  sectionKey: AdminSectionKey;
  title: string;
  errorKey: string;
  message: string;
};

export type AdminSectionResult<T> =
  | { ok: true; data: T }
  | ({ ok: false; data: T } & AdminSectionFailure);

export async function resolveAdminSection<T>(params: {
  sectionKey: AdminSectionKey;
  title: string;
  errorKey: string;
  message: string;
  fallback: T;
  load: () => Promise<T>;
}): Promise<AdminSectionResult<T>> {
  try {
    return { ok: true, data: await params.load() };
  } catch (error) {
    logger.error("admin_console_section_unavailable", {
      sectionKey: params.sectionKey,
      errorKey: params.errorKey,
      error,
    });

    return {
      ok: false,
      data: params.fallback,
      sectionKey: params.sectionKey,
      title: params.title,
      errorKey: params.errorKey,
      message: params.message,
    };
  }
}

function getAdminSectionFailure<T>(result: AdminSectionResult<T>): AdminSectionFailure | null {
  if (result.ok) return null;

  return {
    sectionKey: result.sectionKey,
    title: result.title,
    errorKey: result.errorKey,
    message: result.message,
  };
}
function createFallbackAiRuntimeStatus(): AdminAiRuntimeStatus {
  return {
    estado: "desconocido",
    proveedor: "disabled",
    modelo: null,
    proveedorFallback: null,
    modeloFallback: null,
    iaActiva: false,
    geminiConfigurado: false,
    opencodeGoConfigurado: false,
    openaiConfigurado: false,
    fallbackDisponible: true,
    ultimoEstado: "unknown",
    ultimoError: "none",
    ultimoChequeo: null,
    timeoutMs: 0,
    maxInputChars: 0,
    maxOutputChars: 0,
    secretosExpuestos: false,
    archivosCrudosEnviados: false,
    redaccionSecretos: "enabled",
    metricas: {
      solicitudes: 0,
      exitos: 0,
      errores: 0,
      timeouts: 0,
      fallbackUsado: 0,
    },
    metricasEnMemoriaDisponibles: false,
    ultimaDuracionMs: null,
    duracionPromedioMs: null,
    eventosRecientes: [],
  };
}

function createFallbackAiUsage(range = "30d"): AdminAiUsage {
  return {
    summary: {
      range,
      totalCalls: 0,
      calls24h: 0,
      calls7d: 0,
      calls30d: 0,
      successCount: 0,
      errorCount: 0,
      timeoutCount: 0,
      fallbackCount: 0,
      estimatedInputTokens: 0,
      estimatedOutputTokens: 0,
      estimatedTotalTokens: 0,
      estimatedCostUsd: 0,
      averageDurationMs: null,
      lastEventAt: new Date(0),
    },
    recentEvents: [],
    byUser: [],
    byAssessment: [],
    recentErrors: [],
    pagination: {
      limit: 0,
      page: 1,
      returned: 0,
      hasMore: false,
      nextPage: null,
    },
    alerts: [
      {
        status: "Atencion",
        title: "Uso IA no disponible",
        message: "La seccion de consumo IA no pudo cargarse en este runtime.",
      },
    ],
  };
}

function createFallbackAiBudget(): AdminAiBudgetSummary {
  return {
    settings: {
      monthlyBudgetUsd: null,
      alertThreshold50: true,
      alertThreshold80: true,
      alertThreshold100: true,
      dailyBudgetUsd: null,
      perUserMonthlyBudgetUsd: null,
      perAssessmentBudgetUsd: null,
    },
    spentMonthUsd: 0,
    monthlyBudgetUsd: null,
    percentUsed: null,
    remainingMonthUsd: null,
    alerts: [
      {
        status: "Atencion",
        title: "Presupuesto IA no disponible",
        message: "La metrica de presupuesto IA no pudo cargarse; no bloquea el resto de la consola.",
      },
    ],
  };
}

function createFallbackAdvisorMethodologySnapshot(): AdvisorMethodologyAdminSnapshot {
  return {
    runtime: {
      enabled: false,
      flagName: "ADVISOR_METHODOLOGY_CONTEXT_ENABLED",
      activationMode: "env",
      defaultEnabled: false,
      rawValuePresent: false,
      valueDescription: "disabled_default",
      productionSafeSummary: "Methodology context status is unavailable in this runtime; default is disabled.",
    },
    kbHealth: {
      ok: false,
      totalBlocks: 0,
      activeBlocks: 0,
      draftBlocks: 0,
      deprecatedBlocks: 0,
      exposureCounts: {},
      activeBlockIds: [],
      versions: [],
      validationErrorsCount: 0,
      validationWarningsCount: 0,
      restrictedCount: 0,
      lastCheckedAt: new Date(0),
      blockSummaries: [],
    },
    usageStats: {
      windowDays: 30,
      since: new Date(0),
      totalAdvisorEvents: 0,
      methodologyTrackedEvents: 0,
      methodologyEnabledEvents: 0,
      includedCount: 0,
      skippedCount: 0,
      errorCount: 0,
      disabledCount: 0,
      lastMethodologyEventAt: null,
      averageBlockCount: 0,
      totalWarnings: 0,
      totalBlockedReasons: 0,
      topBlockIds: [],
      limitations: [
        "Advisor methodology visibility is temporarily unavailable; no raw prompts or customer evidence are exposed.",
      ],
    },
  };
}

function getAiOperationalAlerts(aiStatus: AdminAiRuntimeStatus) {
  const alerts: Array<{ title: string; status: "Operativo" | "Atencion" | "Info"; message: string }> = [];

  if (aiStatus.proveedor === "gemini" && !aiStatus.geminiConfigurado) {
    alerts.push({
      title: "Gemini requiere configuracion",
      status: "Atencion",
      message: "El proveedor es Gemini, pero la key no aparece configurada en este runtime.",
    });
  }

  if (aiStatus.iaActiva && !["gemini", "mock", "opencode_go"].includes(aiStatus.proveedor)) {
    alerts.push({
      title: "Proveedor desconocido",
      status: "Atencion",
      message: "AI Advisory esta activo con un proveedor no esperado.",
    });
  }

  if (aiStatus.proveedor === "openai") {
    alerts.push({
      title: "OpenAI legacy no operativo",
      status: "Atencion",
      message: "OpenAI queda deprecado y no debe usarse como proveedor operativo normal.",
    });
  }

  if (aiStatus.proveedorFallback === "opencode_go" && !aiStatus.opencodeGoConfigurado) {
    alerts.push({
      title: "Fallback OpenCode Go no configurado",
      status: "Info",
      message: "Gemini sigue siendo primario; OpenCode Go requiere OPENCODE_API_KEY para fallback real.",
    });
  }

  if (aiStatus.ultimoEstado === "error" || aiStatus.ultimoEstado === "timeout") {
    alerts.push({
      title: "Ultima llamada con atencion",
      status: "Atencion",
      message: `Ultimo estado: ${aiStatus.ultimoEstado}. Error: ${aiStatus.ultimoError}.`,
    });
  }

  alerts.push({
    title: "Metricas temporales",
    status: "Info",
    message: "Las metricas actuales son en memoria y pueden reiniciarse con deploy/restart.",
  });

  alerts.push({
    title: "Fallback disponible",
    status: "Operativo",
    message: "Preview y PDF mantienen fallback si el proveedor IA falla.",
  });

  alerts.push({
    title: "Privacidad IA",
    status: "Operativo",
    message: "No se reportan secretos expuestos ni archivos crudos enviados al proveedor.",
  });

  return alerts;
}

export async function getAdminConsoleData(params?: {
  usersSearch?: string;
  usersPage?: number;
  assessmentsSearch?: string;
  assessmentsPage?: number;
}) {
  const since = sevenDaysAgo();
  const sectionFailures: AdminSectionFailure[] = [];
  const rememberSection = <T>(result: AdminSectionResult<T>) => {
    const failure = getAdminSectionFailure(result);
    if (failure) sectionFailures.push(failure);
    return result.data;
  };

  const usersPage = params?.usersPage && params.usersPage > 0 ? params.usersPage : 1;
  const usersTake = 12;
  const usersSkip = (usersPage - 1) * usersTake;

  const assessmentsPage = params?.assessmentsPage && params.assessmentsPage > 0 ? params.assessmentsPage : 1;
  const assessmentsTake = 15;
  const assessmentsSkip = (assessmentsPage - 1) * assessmentsTake;

  const usersSearch = params?.usersSearch?.trim() ?? "";
  const usersWhere: Prisma.UserWhereInput = usersSearch
    ? {
        OR: [
          { email: { contains: usersSearch, mode: "insensitive" } },
          { name: { contains: usersSearch, mode: "insensitive" } },
        ],
      }
    : {};

  const assessmentsSearch = params?.assessmentsSearch?.trim() ?? "";
  const loadAssessmentOwnerMatches = () =>
    prisma.user.findMany({
      where: {
        email: {
          contains: assessmentsSearch,
          mode: "insensitive",
        },
      },
      select: {
        id: true,
      },
      take: 50,
    });
  const assessmentOwnerMatches = assessmentsSearch
    ? rememberSection(
        await resolveAdminSection<Awaited<ReturnType<typeof loadAssessmentOwnerMatches>>>({
          sectionKey: "owner_lookup",
          title: "Busqueda de propietarios",
          errorKey: "admin_owner_lookup_failed",
          message: "No se pudo resolver el filtro por propietario. La busqueda de evaluaciones sigue disponible por titulo o cliente.",
          fallback: [],
          load: loadAssessmentOwnerMatches,
        }),
      )
    : [];
  const assessmentOwnerUserIds = assessmentOwnerMatches.map((user) => user.id);
  const assessmentsWhere: Prisma.AssessmentWhereInput = {
    archivedAt: null,
    ...(assessmentsSearch
      ? {
          OR: [
            { title: { contains: assessmentsSearch, mode: "insensitive" } },
            { clientLabel: { contains: assessmentsSearch, mode: "insensitive" } },
            ...(assessmentOwnerUserIds.length > 0
              ? [{ workspace: { ownerUserId: { in: assessmentOwnerUserIds } } }]
              : []),
          ],
        }
      : {}),
  };

  const loadSummaryMetrics = async () => {
    const [
      totalUsers,
      totalAssessments,
      assessmentsLast7Days,
      totalReports,
      activeEvidenceFiles,
      failedEvidenceFiles,
      failedReports,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.assessment.count({ where: { archivedAt: null } }),
      prisma.assessment.count({ where: { createdAt: { gte: since }, archivedAt: null } }),
      prisma.report.count({ where: { deletedAt: null } }),
      prisma.evidenceFile.count({ where: { deletedAt: null } }),
      prisma.evidenceFile.count({ where: { processingStatus: "failed", deletedAt: null } }),
      prisma.report.count({ where: { status: "failed", deletedAt: null } }),
    ]);

    return {
      totalUsers,
      totalAssessments,
      assessmentsLast7Days,
      totalReports,
      activeEvidenceFiles,
      failedEvidenceFiles,
      failedReports,
    };
  };

  const loadStorageCephMetrics = async () => {
    const [
      activeStorageAssessments,
      readinessGroups,
      cephRequested,
      cephSuitabilityGroups,
      activeWithoutEvidence,
      evidenceClassifications,
      aiAnalysisGroups,
    ] = await Promise.all([
      prisma.assessment.count({ where: { storageReadinessEnabled: true, archivedAt: null } }),
      prisma.assessmentStorageDestinationReadiness.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
      prisma.assessmentStorageDestinationReadiness.count({
        where: {
          OR: [
            { targetStoragePreference: "ceph" },
            { mode: "ceph_candidate" },
          ],
        },
      }),
      prisma.assessmentStorageAnalysis.groupBy({
        by: ["cephSuitabilityStatus"],
        _count: { _all: true },
      }),
      prisma.assessment.count({
        where: {
          storageReadinessEnabled: true,
          archivedAt: null,
          storageEvidence: { none: {} },
        },
      }),
      prisma.assessmentStorageEvidence.groupBy({
        by: ["classification"],
        _count: { _all: true },
      }),
      prisma.assessmentStorageAnalysis.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
    ]);

    const readinessStatus: Record<string, number> = {};
    readinessGroups.forEach((g) => {
      readinessStatus[g.status] = g._count._all;
    });

    const cephSuitability: Record<string, number> = {};
    cephSuitabilityGroups.forEach((g) => {
      if (g.cephSuitabilityStatus) {
        cephSuitability[g.cephSuitabilityStatus] = g._count._all;
      }
    });

    const evidenceClassification: Record<string, number> = {};
    evidenceClassifications.forEach((g) => {
      evidenceClassification[g.classification] = g._count._all;
    });

    const aiAnalysisStatus: Record<string, number> = {};
    aiAnalysisGroups.forEach((g) => {
      aiAnalysisStatus[g.status] = g._count._all;
    });

    return {
      activeStorageAssessments,
      readinessStatus,
      cephRequested,
      cephSuitability,
      activeWithoutEvidence,
      evidenceClassification,
      aiAnalysisStatus,
    };
  };

  const loadRecentUsers = () =>
    prisma.user.findMany({
      where: usersWhere,
      orderBy: { createdAt: "desc" },
      take: usersTake,
      skip: usersSkip,
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        createdAt: true,
        sessions: {
          orderBy: { updatedAt: "desc" },
          take: 1,
          select: { updatedAt: true },
        },
        ownedWorkspaces: {
          select: {
            plan: true,
            _count: {
              select: { assessments: true },
            },
          },
        },
      },
    });
  const loadRecentAssessments = () =>
    prisma.assessment.findMany({
      where: assessmentsWhere,
      orderBy: { updatedAt: "desc" },
      take: assessmentsTake,
      skip: assessmentsSkip,
      select: {
        id: true,
        title: true,
        clientLabel: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        workspace: {
          select: {
            name: true,
            plan: true,
            ownerUserId: true,
          },
        },
        evidenceFiles: {
          where: { deletedAt: null },
          select: {
            processingStatus: true,
          },
        },
        evidenceModules: {
          select: {
            moduleKey: true,
            status: true,
            confidenceLevel: true,
            completionPercent: true,
            sourceType: true,
            updatedAt: true,
            skippedAt: true,
            reviewedAt: true,
            lastUpload: {
              select: {
                originalFilename: true,
                uploadKind: true,
                collectorName: true,
                collectorVersion: true,
                createdAt: true,
              },
            },
            lastParseResult: {
              select: {
                status: true,
                parserKey: true,
                parserVersion: true,
                summaryJson: true,
                warningsJson: true,
                errorsJson: true,
                createdAt: true,
              },
            },
          },
          orderBy: {
            moduleKey: "asc",
          },
        },
        reports: {
          where: { deletedAt: null },
          select: {
            status: true,
          },
        },
        assessmentScore: {
          select: {
            readinessScore: true,
            confidenceScore: true,
          },
        },
        costRiskAssumptions: {
          select: {
            assumptionsJson: true,
          },
        },
        licensingAnalysis: {
          select: {
            status: true,
            mode: true,
            financialConfidenceScore: true,
            financialConfidenceLabel: true,
            savingsQuality: true,
            pricingFreshnessStatus: true,
            assumptionsJson: true,
            executiveRecommendation: true,
            generatedAt: true,
            updatedAt: true,
          },
        },
        clientContext: {
          select: {
            status: true,
            wordCount: true,
            characterCount: true,
          },
        },
        clientContextAnalysis: {
          select: {
            status: true,
            interpretedSummary: true,
          },
        },
        additionalEvidence: {
          where: {
            evidenceFile: { deletedAt: null },
          },
          select: {
            id: true,
            classification: true,
            purpose: true,
            analysisStatus: true,
            evidenceFile: {
              select: {
                id: true,
                originalFilename: true,
                sizeBytes: true,
                processingStatus: true,
              },
            },
          },
        },
        storageReadinessEnabled: true,
        storageDestinationReadiness: {
          select: {
            status: true,
            mode: true,
            targetStoragePreference: true,
          },
        },
        storageAnalysis: {
          select: {
            status: true,
            cephSuitabilityStatus: true,
            storageReadinessScore: true,
            storageEvidenceConfidence: true,
          },
        },
        storageContext: {
          select: {
            status: true,
            wordCount: true,
            characterCount: true,
          },
        },
        storageEvidence: {
          where: {
            evidenceFile: { deletedAt: null },
          },
          select: {
            id: true,
            classification: true,
            analysisStatus: true,
            includedInStorageAnalysis: true,
            evidenceFile: {
              select: {
                id: true,
                originalFilename: true,
                sizeBytes: true,
                processingStatus: true,
              },
            },
          },
        },
      },
    });
  const loadRecentAuditEvents = () =>
    prisma.auditEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        eventType: true,
        message: true,
        createdAt: true,
        user: {
          select: { email: true },
        },
        assessment: {
          select: { title: true },
        },
      },
    });
  const loadPaginationCounts = async () => {
    const [filteredUsersCount, filteredAssessmentsCount] = await Promise.all([
      prisma.user.count({ where: usersWhere }),
      prisma.assessment.count({ where: assessmentsWhere }),
    ]);

    return { filteredUsersCount, filteredAssessmentsCount };
  };

  const [
    summaryMetricsResult,
    recentUsersResult,
    recentAssessmentsResult,
    recentAuditEventsResult,
    userEntitlementsResult,
    commercialOpportunitiesResult,
    aiBudgetResult,
    advancedAuditEventsResult,
    runtimeSettingsResult,
    advisorMethodologyResult,
    paginationCountsResult,
    storageCephResultPart,
  ] = await Promise.all([
    resolveAdminSection<Awaited<ReturnType<typeof loadSummaryMetrics>>>({
      sectionKey: "summary_metrics",
      title: "Metricas principales",
      errorKey: "admin_summary_metrics_failed",
      message: "No se pudieron cargar las metricas principales. El resto de la consola sigue disponible.",
      fallback: {
        totalUsers: 0,
        totalAssessments: 0,
        assessmentsLast7Days: 0,
        totalReports: 0,
        activeEvidenceFiles: 0,
        failedEvidenceFiles: 0,
        failedReports: 0,
      },
      load: loadSummaryMetrics,
    }),
    resolveAdminSection<Awaited<ReturnType<typeof loadRecentUsers>>>({
      sectionKey: "users",
      title: "Usuarios",
      errorKey: "admin_users_failed",
      message: "No se pudo cargar la lista de usuarios. La seccion de usuarios queda temporalmente degradada.",
      fallback: [],
      load: loadRecentUsers,
    }),
    resolveAdminSection<Awaited<ReturnType<typeof loadRecentAssessments>>>({
      sectionKey: "assessments",
      title: "Evaluaciones",
      errorKey: "admin_assessments_failed",
      message: "No se pudo cargar la lista de evaluaciones. Las secciones dependientes muestran fallback local.",
      fallback: [],
      load: loadRecentAssessments,
    }),
    resolveAdminSection<Awaited<ReturnType<typeof loadRecentAuditEvents>>>({
      sectionKey: "audit_events",
      title: "Auditoria reciente",
      errorKey: "admin_recent_audit_failed",
      message: "No se pudieron cargar los ultimos eventos de auditoria.",
      fallback: [],
      load: loadRecentAuditEvents,
    }),
    resolveAdminSection<Awaited<ReturnType<typeof listUserEntitlements>>>({
      sectionKey: "entitlements",
      title: "Accesos y planes",
      errorKey: "admin_entitlements_failed",
      message: "No se pudieron cargar los accesos manuales. Pricing admin no fue modificado.",
      fallback: [],
      load: listUserEntitlements,
    }),
    resolveAdminSection<Awaited<ReturnType<typeof getCommercialOpportunities>>>({
      sectionKey: "commercial_opportunities",
      title: "Oportunidades comerciales",
      errorKey: "admin_commercial_opportunities_failed",
      message: "No se pudieron cargar las oportunidades comerciales. El resto de la consola sigue disponible.",
      fallback: [],
      load: getCommercialOpportunities,
    }),
    resolveAdminSection<AdminAiBudgetSummary>({
      sectionKey: "ai_budget",
      title: "Presupuesto IA",
      errorKey: "admin_ai_budget_failed",
      message: "No se pudo cargar el presupuesto IA. La seccion IA muestra metricas disponibles y fallback local.",
      fallback: createFallbackAiBudget(),
      load: getAdminAiBudgetSummary,
    }),
    resolveAdminSection<Awaited<ReturnType<typeof getAdvancedAuditEvents>>>({
      sectionKey: "advanced_audit",
      title: "Auditoria avanzada",
      errorKey: "admin_advanced_audit_failed",
      message: "No se pudo cargar la auditoria avanzada.",
      fallback: [],
      load: getAdvancedAuditEvents,
    }),
    resolveAdminSection<Awaited<ReturnType<typeof getOperationalRuntimeSettings>>>({
      sectionKey: "runtime_settings",
      title: "Configuracion operativa",
      errorKey: "admin_runtime_settings_failed",
      message: "No se pudo cargar la configuracion operativa desde DB. Se muestran defaults seguros.",
      fallback: DEFAULT_RUNTIME_SETTINGS,
      load: getOperationalRuntimeSettings,
    }),
    resolveAdminSection<AdvisorMethodologyAdminSnapshot>({
      sectionKey: "advisor_methodology",
      title: "Advisor metodologico",
      errorKey: "admin_advisor_methodology_failed",
      message: "No se pudo cargar la visibilidad segura del contexto metodologico.",
      fallback: createFallbackAdvisorMethodologySnapshot(),
      load: () => getAdvisorMethodologyAdminSnapshot({ windowDays: 30 }),
    }),
    resolveAdminSection<Awaited<ReturnType<typeof loadPaginationCounts>>>({
      sectionKey: "summary_metrics",
      title: "Paginacion admin",
      errorKey: "admin_pagination_counts_failed",
      message: "No se pudieron cargar los totales de paginacion. Las tablas muestran datos disponibles.",
      fallback: {
        filteredUsersCount: 0,
        filteredAssessmentsCount: 0,
      },
      load: loadPaginationCounts,
    }),
    resolveAdminSection<Awaited<ReturnType<typeof loadStorageCephMetrics>>>({
      sectionKey: "storage_ceph",
      title: "Storage y Ceph",
      errorKey: "admin_storage_ceph_failed",
      message: "No se pudieron cargar las metricas de Storage y Ceph.",
      fallback: {
        activeStorageAssessments: 0,
        readinessStatus: {},
        cephRequested: 0,
        cephSuitability: {},
        activeWithoutEvidence: 0,
        evidenceClassification: {},
        aiAnalysisStatus: {},
      },
      load: loadStorageCephMetrics,
    }),
  ]);

  const summaryMetrics = rememberSection(summaryMetricsResult);
  const recentUsers = rememberSection(recentUsersResult);
  const recentAssessments = rememberSection(recentAssessmentsResult);
  const recentAuditEvents = rememberSection(recentAuditEventsResult);
  const userEntitlements = rememberSection(userEntitlementsResult);
  const commercialOpportunities = rememberSection(commercialOpportunitiesResult);
  const aiBudget = rememberSection(aiBudgetResult);
  const advancedAuditEvents = rememberSection(advancedAuditEventsResult);
  const runtimeSettings = rememberSection(runtimeSettingsResult);
  const advisorMethodology = rememberSection(advisorMethodologyResult);
  const paginationCounts = rememberSection(paginationCountsResult);
  const storageCephResult = rememberSection(storageCephResultPart);
  const {
    totalUsers,
    totalAssessments,
    assessmentsLast7Days,
    totalReports,
    activeEvidenceFiles,
    failedEvidenceFiles,
    failedReports,
  } = summaryMetrics;
  const { filteredUsersCount, filteredAssessmentsCount } = paginationCounts;

  const ownerUserIds = [...new Set(recentAssessments.map((assessment) => assessment.workspace.ownerUserId))];
  const loadOwnerUsers = () =>
    prisma.user.findMany({
      where: { id: { in: ownerUserIds } },
      select: { id: true, email: true },
    });
  const ownerUsers = ownerUserIds.length > 0
    ? rememberSection(
        await resolveAdminSection<Awaited<ReturnType<typeof loadOwnerUsers>>>({
          sectionKey: "owner_emails",
          title: "Emails de propietarios",
          errorKey: "admin_owner_emails_failed",
          message: "No se pudieron resolver los emails de propietarios. Se muestran placeholders seguros.",
          fallback: [],
          load: loadOwnerUsers,
        }),
      )
    : [];
  const ownerEmailById = new Map(ownerUsers.map((user) => [user.id, user.email]));

  const aiStatus = rememberSection(
    await resolveAdminSection<AdminAiRuntimeStatus>({
      sectionKey: "ai_status",
      title: "Estado IA runtime",
      errorKey: "admin_ai_status_failed",
      message: "No se pudo cargar el estado runtime de IA. Se muestra fallback local.",
      fallback: createFallbackAiRuntimeStatus(),
      load: getAiRuntimeStatus,
    }),
  );
  const aiUsage = rememberSection(
    await resolveAdminSection<AdminAiUsage>({
      sectionKey: "ai_usage",
      title: "Consumo IA",
      errorKey: "admin_ai_usage_failed",
      message: "No se pudo cargar el consumo IA persistente. La consola muestra metricas IA en fallback.",
      fallback: createFallbackAiUsage("30d"),
      load: () => getAdminAiUsage({ range: "30d" }),
    }),
  );
  const supportRequests = rememberSection(
    await resolveAdminSection<Awaited<ReturnType<typeof getAdminSupportRequests>>>({
      sectionKey: "support_requests",
      title: "Solicitudes de soporte",
      errorKey: "admin_support_requests_failed",
      message: "No se pudieron cargar las solicitudes de soporte. El resto de la consola sigue disponible.",
      fallback: getSupportRequestFallback(),
      load: getAdminSupportRequests,
    }),
  );
  const persistentUsageByUser = new Map(aiUsage.byUser.filter((item) => item.userId).map((item) => [item.userId, item]));
  const persistentUsageByAssessment = new Map(
    aiUsage.byAssessment.filter((item) => item.assessmentId).map((item) => [item.assessmentId, item]),
  );
  const databaseConfigured = isConfigured(process.env.DATABASE_URL);
  const authConfigured = isConfigured(process.env.BETTER_AUTH_SECRET) && isConfigured(process.env.BETTER_AUTH_URL);
  const storageConfigured = isConfigured(process.env.HOSTINGER_STORAGE_ROOT);
  const emailConfigured = isConfigured(process.env.RESEND_API_KEY) || isConfigured(process.env.EMAIL_FROM);
  const billingStatus = getBillingAdminStatus();

  const failedSignals = failedEvidenceFiles + failedReports;

  return {
    sectionFailures,
    storageCeph: {
      activeStorageAssessments: storageCephResult.activeStorageAssessments,
      readinessStatus: storageCephResult.readinessStatus,
      cephRequested: storageCephResult.cephRequested,
      cephSuitability: storageCephResult.cephSuitability,
      activeWithoutEvidence: storageCephResult.activeWithoutEvidence,
      evidenceClassification: storageCephResult.evidenceClassification,
      aiAnalysisStatus: storageCephResult.aiAnalysisStatus,
    },
    supportRequests,
    billingStatus,
    summary: {
      totalUsers,
      totalAssessments,
      assessmentsLast7Days,
      totalReports,
      activeEvidenceFiles,
      failedSignals,
      betaStatus: "Activa",
      fullPublicLaunch: "No",
      generalStatus: failedSignals > 0 ? "Atención" : "Operativo",
    },
    aiStatus,
    aiConsumption: {
      callsInMemory: aiStatus.metricas.solicitudes,
      successesInMemory: aiStatus.metricas.exitos,
      errorsInMemory: aiStatus.metricas.errores,
      timeoutsInMemory: aiStatus.metricas.timeouts,
      fallbackInMemory: aiStatus.metricas.fallbackUsado,
      lastDurationMs: aiStatus.ultimaDuracionMs,
      averageDurationMs: aiStatus.duracionPromedioMs,
      recentEvents: aiStatus.eventosRecientes,
      alerts: getAiOperationalAlerts(aiStatus),
      persistentUsage: aiUsage,
      costStatus: aiUsage.summary.totalCalls > 0 ? "Estimacion persistente disponible" : "Sin eventos persistidos todavia",
      costDescription:
        "Costo estimado a partir de caracteres/tokens aproximados. Puede diferir de la facturacion real del proveedor.",
      budget: aiBudget,
    },
    advisorMethodology,
    systemHealth: [
      {
        title: "Sistema general",
        status: failedSignals > 0 ? "Atención" : "Operativo",
        description: failedSignals > 0 ? "Hay señales fallidas que requieren revisión." : "Sin señales críticas persistentes disponibles.",
        recommendation: failedSignals > 0 ? "Revisar errores de evidencia/PDF y logs Hostinger." : "Mantener monitoreo operativo.",
      },
      {
        title: "Base de datos",
        status: statusFromBoolean(databaseConfigured),
        description: databaseConfigured ? "DATABASE_URL está configurada." : "DATABASE_URL no está visible en este runtime.",
        recommendation: "No mostrar ni copiar cadenas de conexión.",
      },
      {
        title: "Autenticación",
        status: statusFromBoolean(authConfigured),
        description: authConfigured ? "Better Auth tiene configuración base." : "Falta configuración visible de Auth.",
        recommendation: "Verificar sign-in y password recovery tras cambios de entorno.",
      },
      {
        title: "Storage privado",
        status: storageConfigured ? "Operativo" : "Atención",
        description: storageConfigured ? "Storage root configurado sin exponer ruta." : "Storage root usa fallback o no está configurado.",
        recommendation: "No exponer rutas privadas; validar uploads en controlled launch.",
      },
      {
        title: "Uploads",
        status: failedEvidenceFiles > 0 ? "Degradado" : "Operativo",
        description: `${activeEvidenceFiles} archivos activos; ${failedEvidenceFiles} fallidos.`,
        recommendation: failedEvidenceFiles > 0 ? "Revisar errores de procesamiento." : "Mantener pruebas de evidencia sintética.",
      },
      {
        title: "Parser / Evidence",
        status: failedEvidenceFiles > 0 ? "Atención" : "Operativo",
        description: "Estado derivado de EvidenceFile.processingStatus.",
        recommendation: "Auditar fallos antes de full public launch.",
      },
      {
        title: "Report preview",
        status: "Operativo",
        description: "Render server-side validado por build y evidencia previa.",
        recommendation: "Mantener revisión autenticada en cambios mayores.",
      },
      {
        title: "PDF",
        status: failedReports > 0 ? "Degradado" : "Operativo",
        description: `${totalReports} reportes no borrados; ${failedReports} fallidos.`,
        recommendation: failedReports > 0 ? "Revisar reportes fallidos y storage." : "Mantener fallback AI no bloqueante.",
      },
      {
        title: "IA Advisory",
        status: aiStatus.estado === "operativo" ? "Operativo" : aiStatus.estado === "degradado" ? "Degradado" : "Atención",
        description: `Proveedor: ${aiStatus.proveedor}. Último estado: ${aiStatus.ultimoEstado}.`,
        recommendation: "Si Gemini falla, usar AI_ADVISORY_ENABLED=false o provider disabled.",
      },
      {
        title: "Email",
        status: emailConfigured ? "Operativo" : "Desconocido",
        description: emailConfigured ? "Email provider presenta configuración segura." : "Este runtime no expone configuración de email.",
        recommendation: "Validar Resend/password recovery con pruebas controladas.",
      },
      {
        title: "Billing Provider",
        status: "Atención",
        description: `Stripe: ${billingStatus.providers[0].status}. Checkout test-safe; fulfillment manual.`,
        recommendation: "Agregar credenciales y Price IDs en un hito futuro antes de activar checkout real.",
      },
      {
        title: "Producción Hostinger",
        status: "Atención",
        description: "Estado real depende de smoke/logs Hostinger, no de este panel local.",
        recommendation: "Revisar hPanel/logs antes de full public launch.",
      },
    ],
    configHealth: [
      { name: "DATABASE_URL", value: configState(process.env.DATABASE_URL), secret: true },
      { name: "DIRECT_URL", value: configState(process.env.DIRECT_URL), secret: true },
      { name: "BETTER_AUTH_SECRET", value: configState(process.env.BETTER_AUTH_SECRET), secret: true },
      { name: "BETTER_AUTH_URL", value: safeVisibleValue(process.env.BETTER_AUTH_URL), secret: false },
      { name: "NEXT_PUBLIC_APP_URL", value: safeVisibleValue(process.env.NEXT_PUBLIC_APP_URL), secret: false },
      { name: "HOSTINGER_STORAGE_ROOT", value: configState(process.env.HOSTINGER_STORAGE_ROOT), secret: true },
      { name: "ADMIN_EMAILS", value: configState(process.env.ADMIN_EMAILS), secret: true },
      { name: "GEMINI_API_KEY", value: configState(process.env.GEMINI_API_KEY), secret: true },
      { name: "OPENCODE_API_KEY", value: configState(process.env.OPENCODE_API_KEY), secret: true },
      { name: "OPENCODE_GO_BASE_URL", value: safeVisibleValue(process.env.OPENCODE_GO_BASE_URL), secret: false },
      { name: "AI_ADVISORY_ENABLED", value: safeVisibleValue(process.env.AI_ADVISORY_ENABLED), secret: false },
      { name: "AI_ADVISORY_PROVIDER", value: safeVisibleValue(process.env.AI_ADVISORY_PROVIDER), secret: false },
      { name: "AI_ADVISORY_MODEL", value: safeVisibleValue(process.env.AI_ADVISORY_MODEL), secret: false },
      { name: "AI_ADVISORY_FALLBACK_PROVIDER", value: safeVisibleValue(process.env.AI_ADVISORY_FALLBACK_PROVIDER), secret: false },
      { name: "AI_ADVISORY_FALLBACK_MODEL", value: safeVisibleValue(process.env.AI_ADVISORY_FALLBACK_MODEL), secret: false },
      { name: "MAX_UPLOAD_SIZE_MB", value: safeVisibleValue(process.env.MAX_UPLOAD_SIZE_MB), secret: false },
      ...billingStatus.envPlaceholders.map((item) => ({
        name: item.name,
        value: item.configured ? "Configurada" : "No configurada",
        secret: item.secret,
      })),
    ],
    runtimeSettings,
    recentUsers: recentUsers.map((user) => {
      const usage = persistentUsageByUser.get(user.id);
      const entitlement = userEntitlements.find((item) => item.userId === user.id);
      const opportunity = commercialOpportunities.find((item) => item.userId === user.id);

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        lastAccess: user.sessions[0]?.updatedAt ?? null,
        role: "Usuario",
        status: user.emailVerified ? "Verificado" : "Pendiente",
        assessments: user.ownedWorkspaces.reduce((total, workspace) => total + workspace._count.assessments, 0),
        plan: user.ownedWorkspaces[0]?.plan ?? "No disponible",
        aiCalls: usage?.calls ?? 0,
        aiTokens: usage?.tokens ?? 0,
        aiCost: usage?.cost ?? 0,
        aiErrors: usage?.errors ?? 0,
        lastAiUsage: usage?.lastEventAt ?? null,
        entitlementPlan: entitlement?.planKey ?? "free_preview",
        entitlementStatus: entitlement?.status ?? "No configurado",
        opportunityScore: opportunity?.score ?? 0,
        commercialStatus: opportunity?.status ?? "new_lead",
        nextBestAction: opportunity?.nextBestAction ?? "No contactar todavia",
      };
    }),
    recentAssessments: recentAssessments.map((assessment) => {
      const parsedFiles = assessment.evidenceFiles.filter((file) => file.processingStatus === "parsed").length;
      const generatedReports = assessment.reports.filter((report) => report.status === "generated").length;
      const assumptions = assessment.costRiskAssumptions?.assumptionsJson;
      const hasContext = Boolean(
        assumptions &&
          typeof assumptions === "object" &&
          !Array.isArray(assumptions) &&
          "migrationContext" in assumptions,
      );

      const usage = persistentUsageByAssessment.get(assessment.id);
      const opportunity = commercialOpportunities.find((item) => item.assessmentId === assessment.id);
      const advancedEvidenceModules = getEvidenceModuleCatalog().map((metadata) => {
        const evidenceModule = assessment.evidenceModules.find((item) => item.moduleKey === metadata.key);
        if (!evidenceModule) {
          return {
            moduleKey: metadata.key,
            status: "not_provided",
            confidenceLevel: "limited",
            completionPercent: 0,
            sourceType: null,
            skippedAt: null,
            reviewedAt: null,
            lastUpload: null,
            lastParseResult: null,
            vmwareMetrics: null,
            proxmoxMetrics: null,
            requiresReview: false,
          };
        }

        const warnings = Array.isArray(evidenceModule.lastParseResult?.warningsJson)
          ? evidenceModule.lastParseResult.warningsJson.length
          : 0;
        const errors = Array.isArray(evidenceModule.lastParseResult?.errorsJson)
          ? evidenceModule.lastParseResult.errorsJson.length
          : 0;
        const summaryJson =
          typeof evidenceModule.lastParseResult?.summaryJson === "object" &&
          evidenceModule.lastParseResult.summaryJson &&
          !Array.isArray(evidenceModule.lastParseResult.summaryJson)
            ? evidenceModule.lastParseResult.summaryJson as Record<string, unknown>
            : null;
        const vmwareSummary =
          typeof summaryJson?.vmwareEnrichmentSummary === "object" &&
          summaryJson.vmwareEnrichmentSummary &&
          !Array.isArray(summaryJson.vmwareEnrichmentSummary)
            ? summaryJson.vmwareEnrichmentSummary as Record<string, unknown>
            : null;
        const vmwareNumber = (key: string) => {
          const value = vmwareSummary?.[key];
          return typeof value === "number" && Number.isFinite(value) ? value : null;
        };
        const proxmoxSummary =
          typeof summaryJson?.proxmoxTargetSummary === "object" &&
          summaryJson.proxmoxTargetSummary &&
          !Array.isArray(summaryJson.proxmoxTargetSummary)
            ? summaryJson.proxmoxTargetSummary as Record<string, unknown>
            : null;
        const proxmoxReadiness =
          typeof summaryJson?.readiness === "object" &&
          summaryJson.readiness &&
          !Array.isArray(summaryJson.readiness)
            ? summaryJson.readiness as Record<string, unknown>
            : null;
        const proxmoxNumber = (key: string) => {
          const value = proxmoxSummary?.[key];
          return typeof value === "number" && Number.isFinite(value) ? value : null;
        };
        const proxmoxBoolean = (key: string) => {
          const value = proxmoxSummary?.[key];
          return typeof value === "boolean" ? value : null;
        };

        return {
          moduleKey: evidenceModule.moduleKey,
          status: evidenceModule.status,
          confidenceLevel: evidenceModule.confidenceLevel,
          completionPercent: evidenceModule.completionPercent,
          sourceType: evidenceModule.sourceType,
          skippedAt: evidenceModule.skippedAt,
          reviewedAt: evidenceModule.reviewedAt,
          lastUpload: evidenceModule.lastUpload
            ? {
                originalFilename: evidenceModule.lastUpload.originalFilename,
                uploadKind: evidenceModule.lastUpload.uploadKind,
                collectorName: evidenceModule.lastUpload.collectorName,
                collectorVersion: evidenceModule.lastUpload.collectorVersion,
                createdAt: evidenceModule.lastUpload.createdAt,
              }
            : null,
          lastParseResult: evidenceModule.lastParseResult
            ? {
                status: evidenceModule.lastParseResult.status,
                parserKey: evidenceModule.lastParseResult.parserKey,
                parserVersion: evidenceModule.lastParseResult.parserVersion,
                warnings,
                errors,
                createdAt: evidenceModule.lastParseResult.createdAt,
              }
            : null,
          vmwareMetrics: vmwareSummary
            ? {
                vmCount: vmwareNumber("vmCount"),
                matchedVmCount: vmwareNumber("matchedVmCount"),
                unmatchedVmCount: vmwareNumber("unmatchedVmCount"),
                oldSnapshotCount: vmwareNumber("oldSnapshotCount"),
                taggedVmCount: vmwareNumber("taggedVmCount"),
                tagAssignmentCount: vmwareNumber("tagAssignmentCount"),
                drsRuleCount: vmwareNumber("drsRuleCount"),
              }
            : null,
          proxmoxMetrics: proxmoxSummary
            ? {
                targetStatus: typeof proxmoxReadiness?.targetStatus === "string" ? proxmoxReadiness.targetStatus : null,
                confidence: typeof proxmoxReadiness?.confidence === "string" ? proxmoxReadiness.confidence : null,
                nodeCount: proxmoxNumber("nodeCount"),
                onlineNodeCount: proxmoxNumber("onlineNodeCount"),
                storageCount: proxmoxNumber("storageCount"),
                sharedStorageCount: proxmoxNumber("sharedStorageCount"),
                storageUsagePercent: proxmoxNumber("storageUsagePercent"),
                haConfigured: proxmoxBoolean("haConfigured"),
                haResourceCount: proxmoxNumber("haResourceCount"),
                pbsDetected: proxmoxBoolean("pbsDetected"),
                cephDetected: proxmoxBoolean("cephDetected"),
                cephHealth: typeof proxmoxSummary.cephHealth === "string" ? proxmoxSummary.cephHealth : null,
              }
            : null,
          requiresReview: evidenceModule.status === "parsed_with_warnings" || evidenceModule.status === "failed",
        };
      });
      const advancedEvidenceParsed = advancedEvidenceModules.filter((module) =>
        ["parsed", "parsed_with_warnings", "reviewed"].includes(module.status),
      ).length;
      const advancedEvidenceWarnings = advancedEvidenceModules.reduce(
        (total, module) => total + (module.lastParseResult?.warnings ?? 0),
        0,
      );
      const advancedEvidenceErrors = advancedEvidenceModules.reduce(
        (total, module) => total + (module.lastParseResult?.errors ?? 0),
        0,
      );

      const lic = assessment.licensingAnalysis;
      const licAssumptions = typeof lic?.assumptionsJson === "object" && lic.assumptionsJson && !Array.isArray(lic.assumptionsJson)
        ? (lic.assumptionsJson as Record<string, unknown>)
        : null;

      return {
        id: assessment.id,
        title: assessment.title,
        clientLabel: assessment.clientLabel,
        ownerEmail: ownerEmailById.get(assessment.workspace.ownerUserId) ?? "Propietario no disponible en este runtime",
        status: assessment.status,
        evidence: assessment.evidenceFiles.length > 0 ? `${parsedFiles}/${assessment.evidenceFiles.length} parseados` : "Sin evidencia",
        advancedEvidence: {
          modules: advancedEvidenceModules,
          parsed: advancedEvidenceParsed,
          total: advancedEvidenceModules.length,
          warnings: advancedEvidenceWarnings,
          errors: advancedEvidenceErrors,
        },
        context: hasContext ? "Con contexto" : "Pendiente",
        pdf: generatedReports > 0 ? `${generatedReports} generado(s)` : "Pendiente",
        ai: aiStatus.iaActiva ? "Disponible" : "Desactivada",
        aiCalls: usage?.calls ?? 0,
        aiTokens: usage?.tokens ?? 0,
        aiCost: usage?.cost ?? 0,
        aiErrors: usage?.errors ?? 0,
        lastAiStatus: usage?.lastStatus ?? "Sin eventos",
        lastAiUsage: usage?.lastEventAt ?? null,
        opportunityScore: opportunity?.score ?? 0,
        opportunityTags: opportunity?.tags ?? [],
        nextBestAction: opportunity?.nextBestAction ?? "No contactar todavia",
        commercialStatus: opportunity?.status ?? "new_lead",
        readiness: assessment.assessmentScore?.readinessScore ?? null,
        confidence: assessment.assessmentScore?.confidenceScore ?? null,
        createdAt: assessment.createdAt,
        updatedAt: assessment.updatedAt,
        licensing: lic
          ? {
              status: lic.status,
              mode: lic.mode,
              financialConfidenceScore: lic.financialConfidenceScore,
              financialConfidenceLabel: lic.financialConfidenceLabel,
              savingsQuality: lic.savingsQuality,
              pricingFreshnessStatus: lic.pricingFreshnessStatus,
              executiveRecommendation: lic.executiveRecommendation,
              renewalDate: typeof licAssumptions?.renewalDate === "string" ? licAssumptions.renewalDate : null,
              hasContract: Boolean(licAssumptions?.hasContract),
              hasRenewalQuote: Boolean(licAssumptions?.hasRenewalQuote),
              includeEscalation: Boolean(licAssumptions?.includeEscalation),
              migrationInvestment: typeof licAssumptions?.migrationInvestmentEstimateUsd === "number" ? licAssumptions.migrationInvestmentEstimateUsd : null,
              proxmoxSupportScenario: typeof licAssumptions?.selectedProxmoxSupportScenario === "string" ? licAssumptions.selectedProxmoxSupportScenario : null,
              notes: typeof licAssumptions?.notes === "string" ? licAssumptions.notes : null,
              updatedAt: lic.updatedAt,
            }
          : null,
        clientContext: assessment.clientContext
          ? {
              status: assessment.clientContext.status,
              wordCount: assessment.clientContext.wordCount,
              characterCount: assessment.clientContext.characterCount,
              analysisStatus: assessment.clientContextAnalysis?.status ?? "not_started",
              interpretedSummary: assessment.clientContextAnalysis?.interpretedSummary ?? null,
            }
          : null,
        additionalEvidence: (assessment.additionalEvidence ?? []).map((item) => ({
          id: item.id,
          classification: item.classification,
          purpose: item.purpose,
          analysisStatus: item.analysisStatus,
          filename: item.evidenceFile.originalFilename,
          fileSize: item.evidenceFile.sizeBytes,
          processingStatus: item.evidenceFile.processingStatus,
        })),
        storage: {
          enabled: assessment.storageReadinessEnabled,
          readinessStatus: assessment.storageDestinationReadiness?.status ?? "not_started",
          readinessMode: assessment.storageDestinationReadiness?.mode ?? "agnostic",
          targetPreference: assessment.storageDestinationReadiness?.targetStoragePreference ?? "not_decided",
          analysisStatus: assessment.storageAnalysis?.status ?? "not_started",
          cephSuitabilityStatus: assessment.storageAnalysis?.cephSuitabilityStatus ?? "not_evaluated_storage_1",
          readinessScore: assessment.storageAnalysis?.storageReadinessScore ?? null,
          evidenceConfidence: assessment.storageAnalysis?.storageEvidenceConfidence ?? null,
          contextStatus: assessment.storageContext?.status ?? "not_provided",
          contextWordCount: assessment.storageContext?.wordCount ?? 0,
          evidenceFilesCount: assessment.storageEvidence.length,
          evidence: assessment.storageEvidence.map((item) => ({
            id: item.id,
            classification: item.classification,
            analysisStatus: item.analysisStatus,
            filename: item.evidenceFile.originalFilename,
            fileSize: item.evidenceFile.sizeBytes,
            includedInAnalysis: item.includedInStorageAnalysis,
          })),
        },
      };
    }),
    recentAuditEvents,
    advancedAuditEvents,
    userEntitlements,
    commercialOpportunities,
    pagination: {
      users: {
        totalCount: filteredUsersCount,
        page: usersPage,
        pageSize: usersTake,
        totalPages: Math.ceil(filteredUsersCount / usersTake),
      },
      assessments: {
        totalCount: filteredAssessmentsCount,
        page: assessmentsPage,
        pageSize: assessmentsTake,
        totalPages: Math.ceil(filteredAssessmentsCount / assessmentsTake),
      },
    },
  };
}
