import { prisma } from "../../lib/prisma";
import { getAiRuntimeStatus } from "../ai/aiRuntimeStatus";

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

function getAiOperationalAlerts(aiStatus: ReturnType<typeof getAiRuntimeStatus>) {
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

export async function getAdminConsoleData() {
  const since = sevenDaysAgo();
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
  ] = await Promise.all([
    prisma.user.count(),
    prisma.assessment.count({ where: { archivedAt: null } }),
    prisma.assessment.count({ where: { createdAt: { gte: since }, archivedAt: null } }),
    prisma.report.count({ where: { deletedAt: null } }),
    prisma.evidenceFile.count({ where: { deletedAt: null } }),
    prisma.evidenceFile.count({ where: { processingStatus: "failed", deletedAt: null } }),
    prisma.report.count({ where: { status: "failed", deletedAt: null } }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
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
      orderBy: { updatedAt: "desc" },
      take: 15,
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
            ownerUser: {
              select: {
                email: true,
              },
            },
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
  ]);

  const aiStatus = getAiRuntimeStatus();
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
      costStatus: "Pendiente para ADMIN-2B",
      costDescription: "El calculo persistente de tokens y costos requiere guardar eventos de uso IA.",
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
    recentUsers: recentUsers.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      lastAccess: user.sessions[0]?.updatedAt ?? null,
      role: "Usuario",
      status: user.emailVerified ? "Verificado" : "Pendiente",
      assessments: user.ownedWorkspaces.reduce((total, workspace) => total + workspace._count.assessments, 0),
      plan: user.ownedWorkspaces[0]?.plan ?? "No disponible",
    })),
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

      return {
        id: assessment.id,
        title: assessment.title,
        clientLabel: assessment.clientLabel,
        ownerEmail: assessment.workspace.ownerUser.email,
        status: assessment.status,
        evidence: assessment.evidenceFiles.length > 0 ? `${parsedFiles}/${assessment.evidenceFiles.length} parseados` : "Sin evidencia",
        context: hasContext ? "Con contexto" : "Pendiente",
        pdf: generatedReports > 0 ? `${generatedReports} generado(s)` : "Pendiente",
        ai: aiStatus.iaActiva ? "Disponible" : "Desactivada",
        readiness: assessment.assessmentScore?.readinessScore ?? null,
        confidence: assessment.assessmentScore?.confidenceScore ?? null,
        createdAt: assessment.createdAt,
        updatedAt: assessment.updatedAt,
      };
    }),
    recentAuditEvents,
  };
}
