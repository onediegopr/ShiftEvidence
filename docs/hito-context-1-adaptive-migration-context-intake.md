# HITO CONTEXT-1 — Adaptive Migration Context Intake

## Objetivo
Agregar un intake contextual adaptativo para capturar informacion que RVTools no puede inferir: objetivo de migracion, etapa, timeline, criticidad, downtime, backup/DR, storage, red, destino Proxmox, compliance, restricciones y notas libres.

## Estado
- Controlled production launch: SI.
- Limited public beta: SI.
- Full public launch: NO.
- CONTEXT-1 status: implementado localmente, pendiente de push/deploy autorizado.

## Implementacion
- Se agrego un tab `Migration Context` en el detalle del assessment.
- El formulario tiene `Quick Context` arriba y secciones avanzadas colapsables.
- El usuario puede guardar progreso parcial.
- Cada pregunta admite estados:
  - `answered`
  - `unknown`
  - `not_applicable`
  - `skipped`
- El contexto incompleto no bloquea el assessment ni el upload.
- Missing context aparece como evidence gap, no como error.

## Preguntas Cubiertas
- Project objective.
- Project stage / timeline.
- VMware environment.
- Storage.
- Network.
- Backup / DR.
- Business criticality.
- Downtime / windows.
- Proxmox target.
- Compliance / constraints.
- Free text.

Total: 51 preguntas agrupadas en Quick Context y Advanced Context.

## Storage / Schema
- Schema changed: NO.
- Migration: NO.
- Prisma migrate ejecutado: NO.
- Storage elegido: `CostRiskAssumptions.assumptionsJson.migrationContext`.
- Backward compatibility: assessments existentes sin contexto cargan con coverage 0% y no crashean.

## Coverage
Se implemento calculo deterministico:
- overall context coverage percentage.
- section coverage percentage.
- missing key context list.
- status:
  - `strong`
  - `partial`
  - `limited`
  - `missing`

Reglas:
- answered suma peso completo.
- not_applicable suma credito parcial.
- unknown/skipped cuentan como missing explicito.
- preguntas clave pesan mas que texto libre opcional.

## Evidence Confidence
El contexto humano ahora impacta Evidence Confidence de forma acotada:
- strong context puede sumar hasta 5 puntos.
- partial context puede sumar hasta 3 puntos.
- limited context puede sumar 1 punto.
- missing context no suma.

El objetivo no es inflar scores, sino reflejar que una evidencia tecnica con contexto humano es mas confiable para advisory y wave planning.

## Report Preview / PDF
Se agrego:
- Migration Context Summary.
- Context Coverage.
- Missing Context.
- Important User-Provided Context.
- Impact on Confidence.
- Context not provided como evidence gap.

Esto aparece en:
- assessment report preview.
- PDF renderer.
- evidence overview.

## AI-1 Preparation
Se agrego helper:
- `buildAiAdvisoryContextPayload(assessment)`

Incluye:
- RVTools summary.
- risk findings.
- scores.
- manual migration context.
- missing context.
- assumptions.
- evidence received.
- evidence missing.

Excluye:
- secrets.
- env vars.
- cookies.
- password reset tokens.
- raw uploaded file contents.

Gemini no se llama todavia.

## Upload Gate
El upload gate no fue endurecido por contexto avanzado.

Mantiene dependencias existentes:
- assessment title.
- manual infrastructure intake.
- Cost / Risk assumptions.

Nuevo comportamiento:
- contexto avanzado vacio muestra evidencia faltante y warning en report.
- no bloquea evidence upload.

## Validaciones
- `npm run typecheck`: OK durante implementacion.
- Validaciones finales de hostinger:diagnose, lint, build y git status deben ejecutarse antes del commit.

## Riesgos Pendientes
- Browser QA autenticado real debe validar guardado/refresh en produccion despues de deploy autorizado.
- PDF visual debe revisarse con un assessment real con contexto.
- AI-1 debe consumir payload con guardrails y sin secretos.

## Decision
CONTEXT-1 queda implementado sin schema change y listo para validacion final local. Prepara AI-1 sin introducir IA en runtime.

## Production QA Follow-up

CONTEXT-1-PROD-QA result: PASS, user-attested.

Codex validated build/lint/typecheck, production unauthenticated routes and AI payload code safety. The user executed authenticated production browser QA and reported Context Intake save/refresh, report preview and PDF as OK.

AI-1 is unblocked as a separate next hito with guardrails: no secrets, no cookies, no reset tokens, no raw uploaded file contents.
