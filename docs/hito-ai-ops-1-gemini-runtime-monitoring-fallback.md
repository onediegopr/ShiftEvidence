# HITO AI-OPS-1 — Gemini Runtime Monitoring + Fallback Drill

Fecha: 2026-05-27

## Objetivo

Implementar una capa minima de operacion para AI Advisory en ShiftReadiness:

- runtime monitoring seguro;
- estado de provider sin secretos;
- metricas basicas en memoria por proceso;
- fallback drill controlado;
- endpoint admin protegido para una futura consola en espanol;
- documentacion de rollback y limites.

Este hito no construye la consola admin completa y no cambia configuracion productiva de Hostinger.

## Estado Heredado

- Branch: `main`.
- HEAD esperado: `7378be1 test: validate production Gemini AI advisory`.
- Production launched: SI.
- Launch type: controlled production launch.
- Limited public beta: SI.
- Full public launch: NO.
- Gemini real en produccion: activo por evidencia heredada/user-attested.
- OpenAI activo: NO.

## Arquitectura AI Actual

- Configuracion: `src/server/ai/aiAdvisoryConfig.ts`.
- Cliente/provider: `src/server/ai/aiAdvisoryClient.ts`.
- Sanitizacion: `src/server/ai/aiAdvisorySanitizer.ts`.
- Tipos: `src/server/ai/aiAdvisoryTypes.ts`.
- Prompt contract: `src/server/ai/aiAdvisoryPrompts.ts`.
- Payload seguro: `src/server/ai/advisoryContextPayload.ts`.
- Preview: `src/server/reports/reportPreviewService.ts`.
- PDF: `src/server/reports/reportPdfRenderer.ts`.

Gemini se llama desde `generateAiAdvisory`. El output normalizado se integra en `getReportPreviewData` y llega al PDF por `ReportPreviewData.aiAdvisory`.

## Runtime Status Seguro

Se agrego `src/server/ai/aiRuntimeStatus.ts`.

El helper expone:

- `estado`: operativo, degradado, desactivado, error o desconocido.
- `proveedor`: gemini, mock, openai, none o disabled.
- `modelo`.
- `iaActiva`.
- `geminiConfigurado`: booleano sin valor secreto.
- `openaiConfigurado`: booleano sin valor secreto.
- `fallbackDisponible`.
- `ultimoEstado`.
- `ultimoError`.
- `ultimoChequeo`.
- limites de timeout/input/output.
- metricas basicas en memoria.

El helper nunca expone:

- API keys.
- valores de env vars sensibles.
- prompts completos.
- responses crudas.
- cookies/tokens.
- rutas privadas de storage.
- contenido crudo de archivos.

## Runtime Monitoring Minimo

Se agrego registro en memoria por proceso para eventos:

- `ai_advisory_requested`.
- `ai_advisory_success`.
- `ai_advisory_failed`.
- `ai_advisory_timeout`.
- `ai_advisory_fallback_used`.

Cada evento contiene solo metadata segura:

- `assessmentId`.
- provider.
- model.
- durationMs.
- status.
- errorCategory.
- createdAt.

No se agrego persistencia en base de datos ni migracion Prisma. La persistencia operativa historica queda para ADMIN-1/OPS-2 si se decide.

## Endpoint Admin Futuro

Se agrego:

`GET /api/admin/ai/status`

Proteccion:

- usa `requireAdminSession`.
- respuesta `no-store`.
- no es endpoint publico.

Respuesta esperada, sin secretos:

```json
{
  "estado": "operativo",
  "proveedor": "gemini",
  "modelo": "gemini-1.5-flash",
  "iaActiva": true,
  "geminiConfigurado": true,
  "openaiConfigurado": false,
  "fallbackDisponible": true,
  "ultimoEstado": "success",
  "ultimoError": "none",
  "secretosExpuestos": false,
  "archivosCrudosEnviados": false
}
```

## Fallback Drill

Se agrego:

```bash
npm run ai:fallback-drill
```

El drill valida de forma controlada:

- fallback por provider sin key.
- fallback por error de provider.
- clasificacion de timeout por `AbortError`.
- registro de `ai_advisory_fallback_used`.
- truncado de input antes de llamar al provider.
- endpoint admin protegido.
- PDF no vuelca JSON crudo de AI.
- PDF solo incluye AI Advisory cuando `providerStatus` es `success` o `mock`.

Resultado local:

- `npm run ai:fallback-drill`: OK.
- `npm run ai:guardrails`: OK.
- `npm run typecheck`: OK.
- `npm run lint`: OK.
- `npm run build`: OK, con warning NFT conocido no bloqueante.

## Produccion Sin Sesion

Validacion sin tocar Hostinger:

- rutas publicas esperadas: 200.
- rutas privadas esperadas: 307 a `/sign-in`.
- sin 500/503/504.
- sin Hostinger 404.

## QA Gemini Productivo

No se reejecuto navegador autenticado en este hito. Se conserva evidencia heredada de AI-1.3:

- Preview AI Advisory: PASS user-attested.
- PDF AI Advisory: PASS user-attested.
- No JSON crudo: PASS.
- No `[object Object]`: PASS.
- No leaks visibles: PASS.

## Rollback Operativo

Rollback recomendado si Gemini afecta preview/PDF:

```text
AI_ADVISORY_ENABLED=false
```

Alternativa:

```text
AI_ADVISORY_PROVIDER=disabled
```

Despues de rollback:

1. reiniciar/redeploy si Hostinger lo requiere;
2. validar rutas publicas;
3. validar preview/PDF con AI disabled;
4. documentar incidente;
5. no activar OpenAI como respuesta automatica.

## Textos Internos para ADMIN-1

Textos listos para UI futura:

- Estado IA: operativo.
- Estado IA: degradado.
- Estado IA: desactivado.
- Proveedor activo: Gemini.
- Fallback disponible: SI.
- Secretos expuestos: NO.
- Archivos crudos enviados: NO.
- Ultimo error: timeout.
- Ultimo error: proveedor no disponible.
- Ultimo error: respuesta invalida.
- Accion recomendada: mantener scores deterministas como fuente de verdad.

## Limitaciones

- Las metricas son en memoria por proceso; pueden reiniciarse con deploy/restart.
- No hay dashboard admin visual todavia.
- No se persistieron eventos AI en `AuditEvent`.
- No se forzo una falla en produccion.
- Browser QA autenticado no se repitio en este hito.

## Decision

- AI-OPS-1: COMPLETO para capa operativa minima.
- Gemini listo para limited beta AI usage: SI, bajo controlled launch.
- Ready for ADMIN-1: SI, con endpoint/helper base.
- Ready for full public launch: NO.

