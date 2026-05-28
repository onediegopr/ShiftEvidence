import { getEffectiveAiAdvisoryConfig, getAiAdvisoryProviderKey } from "./aiAdvisoryConfig";
import type { AiAdvisoryProvider } from "./aiAdvisoryTypes";

export type AiRuntimeLastStatus = "success" | "error" | "timeout" | "unavailable" | "disabled" | "mock" | "unknown";
export type AiRuntimeErrorCategory = "none" | "timeout" | "provider_error" | "invalid_response" | "config_missing";
export type AiRuntimeEventType =
  | "ai_advisory_requested"
  | "ai_advisory_success"
  | "ai_advisory_failed"
  | "ai_advisory_timeout"
  | "ai_advisory_fallback_used";

export type AiRuntimeEvent = {
  eventType: AiRuntimeEventType;
  provider: AiAdvisoryProvider;
  model: string | null;
  assessmentId?: string;
  durationMs?: number;
  status: AiRuntimeLastStatus;
  errorCategory: AiRuntimeErrorCategory;
  createdAt: string;
};

export type AiRuntimeStatus = {
  estado: "operativo" | "degradado" | "desactivado" | "error" | "desconocido";
  proveedor: AiAdvisoryProvider;
  modelo: string | null;
  iaActiva: boolean;
  geminiConfigurado: boolean;
  openaiConfigurado: boolean;
  fallbackDisponible: boolean;
  ultimoEstado: AiRuntimeLastStatus;
  ultimoError: AiRuntimeErrorCategory;
  ultimoChequeo: string | null;
  timeoutMs: number;
  maxInputChars: number;
  maxOutputChars: number;
  secretosExpuestos: false;
  archivosCrudosEnviados: false;
  redaccionSecretos: "enabled";
  metricas: {
    solicitudes: number;
    exitos: number;
    errores: number;
    timeouts: number;
    fallbackUsado: number;
  };
  metricasEnMemoriaDisponibles: boolean;
  ultimaDuracionMs: number | null;
  duracionPromedioMs: number | null;
  eventosRecientes: AiRuntimeEvent[];
};

type AiRuntimeStore = {
  events: AiRuntimeEvent[];
  metrics: AiRuntimeStatus["metricas"];
};

const globalForAiRuntime = globalThis as typeof globalThis & {
  __shiftreadinessAiRuntime?: AiRuntimeStore;
};

function getStore() {
  if (!globalForAiRuntime.__shiftreadinessAiRuntime) {
    globalForAiRuntime.__shiftreadinessAiRuntime = {
      events: [],
      metrics: {
        solicitudes: 0,
        exitos: 0,
        errores: 0,
        timeouts: 0,
        fallbackUsado: 0,
      },
    };
  }

  return globalForAiRuntime.__shiftreadinessAiRuntime;
}

function getEstado(params: {
  enabled: boolean;
  provider: AiAdvisoryProvider;
  lastStatus: AiRuntimeLastStatus;
  hasProviderKey: boolean;
}) {
  if (!params.enabled || params.provider === "none" || params.provider === "disabled") {
    return "desactivado" as const;
  }

  if (params.provider === "gemini" || params.provider === "openai") {
    if (!params.hasProviderKey) {
      return "degradado" as const;
    }
  }

  if (params.lastStatus === "success" || params.lastStatus === "mock") {
    return "operativo" as const;
  }

  if (params.lastStatus === "error" || params.lastStatus === "timeout") {
    return "degradado" as const;
  }

  return "desconocido" as const;
}

export function recordAiRuntimeEvent(event: Omit<AiRuntimeEvent, "createdAt">) {
  const store = getStore();
  const entry = {
    ...event,
    createdAt: new Date().toISOString(),
  } satisfies AiRuntimeEvent;

  store.events.unshift(entry);
  store.events = store.events.slice(0, 25);

  if (event.eventType === "ai_advisory_requested") store.metrics.solicitudes += 1;
  if (event.eventType === "ai_advisory_success") store.metrics.exitos += 1;
  if (event.eventType === "ai_advisory_failed") store.metrics.errores += 1;
  if (event.eventType === "ai_advisory_timeout") store.metrics.timeouts += 1;
  if (event.eventType === "ai_advisory_fallback_used") store.metrics.fallbackUsado += 1;
}

export async function getAiRuntimeStatus(): Promise<AiRuntimeStatus> {
  const config = await getEffectiveAiAdvisoryConfig();
  const store = getStore();
  const last = store.events.find((event) => event.eventType !== "ai_advisory_requested") ?? null;
  const eventsWithDuration = store.events.filter((event) => typeof event.durationMs === "number");
  const averageDuration =
    eventsWithDuration.length > 0
      ? Math.round(
          eventsWithDuration.reduce((total, event) => total + (event.durationMs ?? 0), 0) /
            eventsWithDuration.length,
        )
      : null;
  const geminiConfigured = Boolean(getAiAdvisoryProviderKey("gemini"));
  const openaiConfigured = Boolean(getAiAdvisoryProviderKey("openai"));
  const hasProviderKey =
    config.provider === "gemini" ? geminiConfigured : config.provider === "openai" ? openaiConfigured : true;

  return {
    estado: getEstado({
      enabled: config.enabled,
      provider: config.provider,
      lastStatus: last?.status ?? "unknown",
      hasProviderKey,
    }),
    proveedor: config.provider,
    modelo: config.model,
    iaActiva: config.enabled && config.provider !== "none" && config.provider !== "disabled",
    geminiConfigurado: geminiConfigured,
    openaiConfigurado: openaiConfigured,
    fallbackDisponible: true,
    ultimoEstado: last?.status ?? "unknown",
    ultimoError: last?.errorCategory ?? "none",
    ultimoChequeo: last?.createdAt ?? null,
    timeoutMs: config.timeoutMs,
    maxInputChars: config.maxInputChars,
    maxOutputChars: config.maxOutputChars,
    secretosExpuestos: false,
    archivosCrudosEnviados: false,
    redaccionSecretos: "enabled",
    metricas: { ...store.metrics },
    metricasEnMemoriaDisponibles: true,
    ultimaDuracionMs: last?.durationMs ?? null,
    duracionPromedioMs: averageDuration,
    eventosRecientes: store.events.slice(0, 10),
  };
}
