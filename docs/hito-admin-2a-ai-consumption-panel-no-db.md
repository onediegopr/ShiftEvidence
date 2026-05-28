# HITO ADMIN-2A - AI Consumption Panel No-DB

Fecha: 2026-05-28.

## Objetivo

Mejorar la consola interna `/dashboard/admin` con una seccion realista de `IA y Consumo`, usando solamente datos disponibles en memoria y configuracion segura existente.

## Por que se redujo alcance

El ADMIN-2 completo incluia tracking persistente, costos por usuario/assessment, auditoria avanzada y acciones operativas. Ese alcance requiere schema/migraciones y mas superficie de riesgo.

ADMIN-2A evita:

- DB schema.
- Prisma migrations.
- tracking persistente.
- billing real.
- acciones destructivas.
- edicion de variables Hostinger.
- secret management.

## Implementado

- Estado actual de AI Advisory.
- Proveedor y modelo activo.
- Gemini/OpenAI key configurada/no configurada sin valores.
- Fallback disponible.
- Ultimo estado conocido.
- Ultimo error.
- Ultima duracion si existe.
- Duracion promedio en memoria si existe.
- Metricas en memoria: solicitudes, exitos, errores, timeouts y fallback.
- Tabla de eventos IA recientes en memoria.
- Alertas operativas basicas.
- Placeholder honesto para tokens/costos persistentes.
- Nota de que las metricas pueden reiniciarse con deploy/restart.

## Datos reales disponibles

Fuente principal:

- `src/server/ai/aiRuntimeStatus.ts`

Datos expuestos de forma segura:

- `estado`
- `iaActiva`
- `proveedor`
- `modelo`
- `geminiConfigurado`
- `openaiConfigurado`
- `fallbackDisponible`
- `ultimoEstado`
- `ultimoError`
- `timeoutMs`
- `maxInputChars`
- `maxOutputChars`
- `metricas`
- `eventosRecientes`

## Placeholders honestos

ADMIN-2A muestra como pendiente:

- tokens estimados persistentes;
- costo estimado persistente;
- consumo por usuario;
- consumo por assessment;
- presupuesto mensual;
- billing real;
- acciones de cambio de provider/modelo.

## Seguridad

ADMIN-2A no muestra:

- `DATABASE_URL`
- `DIRECT_URL`
- `BETTER_AUTH_SECRET`
- `GEMINI_API_KEY`
- `OPENAI_API_KEY`
- cookies
- tokens
- prompts completos
- raw responses
- raw uploaded files
- storage paths privados

La consola no edita secrets ni Hostinger env vars.

## Alertas operativas

Alertas visibles:

- Gemini requiere configuracion si provider=gemini y key ausente.
- AI activa con provider desconocido.
- OpenAI configurado pero no activo.
- Ultima llamada con error/timeout.
- Metricas temporales en memoria.
- Fallback disponible.
- Privacidad IA sin secrets/raw files reportados.

## Pendiente ADMIN-2B

- Modelo persistente de uso IA.
- Estimacion persistente de tokens/costos.
- Consumo por usuario.
- Consumo por assessment.
- Auditoria avanzada.
- Errores operativos persistidos.
- Acciones seguras basadas en runtime settings persistente.

## Cierre posterior ADMIN-2B

ADMIN-2B reemplaza el placeholder principal de tokens/costos con persistencia real basada en `AiUsageEvent`.

Queda implementado:

- eventos IA persistidos;
- tokens estimados;
- costo estimado;
- consumo por usuario;
- consumo por evaluacion;
- endpoint admin `GET /api/admin/ai/usage`;
- tablas de errores y eventos IA en la consola.

Sigue fuera de alcance:

- billing real;
- presupuesto mensual persistente;
- cambio de provider desde admin;
- auditoria avanzada completa.

## Decision

- ADMIN-2A complete: SI si build/lint/typecheck/guardrails pasan.
- Ready for ADMIN-2B: SI.
- Ready for full public launch: NO.
