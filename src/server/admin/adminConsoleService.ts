import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { getAdminAiUsage } from "../ai/aiUsageService";
import { getAiRuntimeStatus } from "../ai/aiRuntimeStatus";
import {
  getAdminAiBudgetSummary,
  getAdvancedAuditEvents,
  getCommercialOpportunities,
  listUserEntitlements,
} from "./adminOpsService";
import { getOperationalRuntimeSettings } from "./runtimeSettingsService";

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

function getAiOperationalAlerts(aiStatus: AdminAiRuntimeStatus) {
  const alerts: Array<{ title: string; status: "Operativo" | "Atencion" | "Info"; message: string }> = [];

  if (aiStatus.proveedor === "gemini" && !aiStatus.geminiConfigurado) {
    alerts.push({
      title: "Gemini requiere configuracion",
      status: "Atencion",
      message: "El proveedor es Gemini, pero la key no aparece configurada en este runtime.",
    });
  }

  if (aiStatus.iaActiva && !["gemini", "mock", "openai"].includes(aiStatus.proveedor)) {
    alerts.push({
      title: "Proveedor desconocido",
      status: "Atencion",
      message: "AI Advisory esta activo con un proveedor no esperado.",
    });
  }

  if (aiStatus.openaiConfigurado && aiStatus.proveedor !== "openai") {
    alerts.push({
      title: "OpenAI configurado pero no activo",
      status: "Info",
      message: "OpenAI no se usa mientras el proveedor activo sea distinto de openai.",
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
  const assessmentOwnerMatches = assessmentsSearch
    ? await prisma.user.findMany({
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
      })
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

  const [
    totalUsers,
    totalAssessments,
    assessmentsLast7Days,
    totalReports,
    activeEvidenceFiles,
    failedEvidenceFiles,
    failedReports,
    recentUsers,
    recentAssessments,
    recentAuditEvents,
    userEntitlements,
    commercialOpportunities,
    aiBudget,
    advancedAuditEvents,
    runtimeSettings,
    filteredUsersCount,
    filteredAssessmentsCount,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.assessment.count({ where: { archivedAt: null } }),
    prisma.assessment.count({ where: { createdAt: { gte: since }, archivedAt: null } }),
    prisma.report.count({ where: { deletedAt: null } }),
    prisma.evidenceFile.count({ where: { deletedAt: null } }),
    prisma.evidenceFile.count({ where: { processingStatus: "failed", deletedAt: null } }),
    prisma.report.count({ where: { status: "failed", deletedAt: null } }),
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
    }),
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
                filename: true,
                fileSize: true,
                processingStatus: true,
              },
            },
          },
        },
      },
    }),
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
    }),
    listUserEntitlements(),
    getCommercialOpportunities(),
    getAdminAiBudgetSummary(),
    getAdvancedAuditEvents(),
    getOperationalRuntimeSettings(),
    prisma.user.count({ where: usersWhere }),
    prisma.assessment.count({ where: assessmentsWhere }),
  ]);

  const ownerUserIds = [...new Set(recentAssessments.map((assessment) => assessment.workspace.ownerUserId))];
  const ownerUsers = ownerUserIds.length > 0
    ? await prisma.user.findMany({
        where: { id: { in: ownerUserIds } },
        select: { id: true, email: true },
      })
    : [];
  const ownerEmailById = new Map(ownerUsers.map((user) => [user.id, user.email]));

  const aiStatus = await getAiRuntimeStatus();
  const aiUsage = await getAdminAiUsage({ range: "30d" });
  const persistentUsageByUser = new Map(aiUsage.byUser.filter((item) => item.userId).map((item) => [item.userId, item]));
  const persistentUsageByAssessment = new Map(
    aiUsage.byAssessment.filter((item) => item.assessmentId).map((item) => [item.assessmentId, item]),
  );
  const databaseConfigured = isConfigured(process.env.DATABASE_URL);
  const authConfigured = isConfigured(process.env.BETTER_AUTH_SECRET) && isConfigured(process.env.BETTER_AUTH_URL);
  const storageConfigured = isConfigured(process.env.HOSTINGER_STORAGE_ROOT);
  const emailConfigured = isConfigured(process.env.RESEND_API_KEY) || isConfigured(process.env.EMAIL_FROM);

  const failedSignals = failedEvidenceFiles + failedReports;

  return {
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
      { name: "OPENAI_API_KEY", value: configState(process.env.OPENAI_API_KEY), secret: true },
      { name: "AI_ADVISORY_ENABLED", value: safeVisibleValue(process.env.AI_ADVISORY_ENABLED), secret: false },
      { name: "AI_ADVISORY_PROVIDER", value: safeVisibleValue(process.env.AI_ADVISORY_PROVIDER), secret: false },
      { name: "AI_ADVISORY_MODEL", value: safeVisibleValue(process.env.AI_ADVISORY_MODEL), secret: false },
      { name: "MAX_UPLOAD_SIZE_MB", value: safeVisibleValue(process.env.MAX_UPLOAD_SIZE_MB), secret: false },
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
          filename: item.evidenceFile.filename,
          fileSize: item.evidenceFile.fileSize,
          processingStatus: item.evidenceFile.processingStatus,
        })),
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
