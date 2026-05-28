# HITO QA-CLEANUP-ARCHIVE-1 - Revision y archivo seguro QA/demo

Fecha: 2026-05-28.

## Objetivo

Revisar y clasificar datos QA/demo sin borrar agresivamente ni tocar datos reales.

Alcance:

- inventario QA/demo;
- clasificacion;
- decision de acciones seguras;
- revision de impacto en metricas comerciales;
- produccion sin sesion;
- documentacion para limpieza futura.

## Reglas aplicadas

- No hard-delete.
- No borrar usuarios.
- No borrar assessments.
- No borrar evidencia.
- No tocar Hostinger config.
- No Prisma reset.
- No OpenAI.
- No full public launch.
- No imprimir secrets.
- No imprimir raw file contents ni storage paths privados.

## Validaciones base

Resultado:

- `npm run hostinger:diagnose`: OK.
- `npm run ai:guardrails`: OK.
- `npm run typecheck`: OK.
- `npm run lint`: OK.
- `npm run build`: OK.
- `npx prisma validate`: OK.
- `npx prisma generate`: OK.

Warning:

- NFT warning conocido en `next.config.mjs` / `reportStorageService`.
- No bloqueante.

## Inventario QA/demo

Inventario read-only ejecutado con consultas seguras Neon.

Counts:

- assessments QA/demo: 25.
- assessments `safe to delete`: 14.
- assessments demo: 0.
- assessments synthetic: 2.
- entitlements QA: 1.
- opportunities QA: 1.
- `AiUsageEvent` `admin_test`: 1.
- `AiUsageEvent` `synthetic_test`: 0.
- reports asociados a assessments QA: 31.

## Assessments QA/demo detectados

Muestra segura por ID corto:

| ID corto | Nombre seguro | Clasificacion | Estado | Accion recomendada |
| --- | --- | --- | --- | --- |
| `cmpo15x8` | `QA Production Smoke - admin-owned - safe to delete` | QA interno | archived | mantener archivado |
| `cmpokemx` | `QA Context Intake PROD QA - safe to delete` | QA interno | draft | revisar/manual archive |
| `cmpnwl8o` | `QA Production Smoke - admin entitlement` | QA interno | draft | revisar/manual archive |
| `cmpnw843` | `QA Production Smoke - complete` | QA interno | draft | revisar/manual archive |
| `cmpnw7n7` | `QA Production Smoke - incomplete` | QA interno | draft | revisar/manual archive |
| `cmpnbtdi` | `QA Production Smoke - complete` | QA interno | draft | revisar/manual archive |
| `cmpnbswo` | `QA Production Smoke - incomplete` | QA interno | draft | revisar/manual archive |
| `cmpnbpc0` | `QA Production Smoke - complete` | QA interno | draft | revisar/manual archive |
| `cmpnbovg` | `QA Production Smoke - incomplete` | QA interno | draft | revisar/manual archive |
| `cmpnbkil` | `QA Production Smoke - complete` | QA interno | draft | revisar/manual archive |
| `cmpnbk14` | `QA Production Smoke - incomplete` | QA interno | draft | revisar/manual archive |
| `cmpnbj0i` | `QA Production Smoke - incomplete` | QA interno | draft | revisar/manual archive |
| `cmpnbiai` | `QA Production Smoke - complete` | QA interno | draft | revisar/manual archive |
| `cmpnbi3d` | `QA Production Smoke - incomplete` | QA interno | draft | revisar/manual archive |
| `cmpnavvi` | `HITO 12.0.8 QA - Complete Browser Gate` | test tecnico | draft | mantener o archive |
| `cmpnavv9` | `HITO 12.0.8 QA - Incomplete Browser Gate` | test tecnico | draft | mantener o archive |
| `cmpnau3k` | `HITO 12.0.8 QA - Complete Browser Gate` | test tecnico | draft | mantener o archive |
| `cmpnau3b` | `HITO 12.0.8 QA - Incomplete Browser Gate` | test tecnico | draft | mantener o archive |
| `cmpn9op4` | `HITO 12.0.7 QA - Complete Gate` | test tecnico | draft | mantener o archive |
| `cmpn9oov` | `HITO 12.0.7 QA - Incomplete Gate` | test tecnico | draft | mantener o archive |
| `cmpn6t08` | `HITO 10.2.3 RVTools-like mapping QA` | demo sintetico | draft | mantener como synthetic/demo |
| `cmpn63i6` | `HITO 10.2.3 RVTools-like mapping QA` | demo sintetico | draft | mantener como synthetic/demo |
| `cmpmzc6u` | `HITO 11 QA Product Flow` | QA interno | draft | revisar/manual archive |
| `cmpmqm8j` | `HITO 10.1 QA - Parsed Inventory` | test tecnico | draft | mantener o archive |
| `cmpmqm6v` | `HITO 10.1 QA - Incomplete Evidence` | test tecnico | draft | mantener o archive |

## Entitlements QA

Detectado:

- `internal_qa` activo: 1.
- ID corto: `cmppfi5k`.
- Usuario corto: `vZUg0tb2`.
- Estado: `active`.
- Source: `admin`.
- AI enabled: true.
- Full report enabled: true.

Clasificacion:

- usuario QA/controlado.

Accion recomendada:

- mantener mientras haya beta controlada y QA operativo;
- revisar antes de full public launch;
- no revocar automaticamente en este hito.

## Oportunidades QA

Detectado:

- oportunidad QA: 1.
- ID corto: `admin-3-`.
- assessment corto: `cmpo15x8`.
- score: 72.
- status: `needs_follow_up`.
- plan sugerido: `professional`.

Clasificacion:

- oportunidad QA ADMIN-3.

Accion recomendada:

- mantener como evidencia de smoke comercial;
- excluir mentalmente de pipeline real hasta que exista filtro/tag formal;
- futuro ADMIN-5: filtros `QA/demo` en oportunidades.

## AiUsageEvent QA

Detectado:

- `operationType=admin_test`, `status=success`: 1.
- `operationType=synthetic_test`: 0.

Clasificacion:

- evento sintetico/admin.

Accion recomendada:

- mantener para trazabilidad;
- excluir de costos comerciales reales en reportes futuros mediante filtro admin.

## Acciones ejecutadas

No se modificaron datos.

Motivo:

- existen elementos claramente QA, pero no hay herramienta dedicada de bulk archive/cleanup con confirmacion granular;
- algunos registros QA tienen reports/evidence asociados;
- el hito prohibe hard-delete y prioriza no tocar datos si hay duda;
- la accion segura en este hito es inventario + clasificacion + documentacion.

Acciones no ejecutadas:

- hard-delete: NO.
- archive masivo: NO.
- revocacion entitlement QA: NO.
- borrado de reports/evidence: NO.
- edicion de oportunidades: NO.

## Admin visibility

Estado:

- admin puede ver assessments, opportunities, IA y consumo.
- QA/demo es identificable por nombre, `safe to delete`, `internal_qa` y `operationType`.

Limitacion:

- no existe filtro formal `QA/demo` global.
- no existe accion bulk archive segura.

Pendiente recomendado:

- ADMIN-5 / QA-CLEANUP-2: filtros admin `QA/demo`, bulk archive con confirmacion, exclusion de metricas comerciales.

## Produccion sin sesion

Smoke:

| Ruta | Resultado |
| --- | --- |
| `/` | `200` |
| `/shiftreadiness` | `200` |
| `/sign-in` | `200` |
| `/sign-up` | `200` |
| `/dashboard` | `307` a `/sign-in` |
| `/dashboard/admin` | `307` a `/sign-in` |

No se observaron `500`, `503`, `504` ni Hostinger 404.

## Riesgos

- QA/demo data todavia existe y puede ensuciar metricas si no se filtra.
- Reports QA asociados: 31.
- Entitlement `internal_qa` activo debe mantenerse controlado.
- Oportunidad QA puede aparecer en pipeline comercial si no se filtra.
- La limpieza final requiere herramienta admin dedicada o ejecucion manual cuidadosamente revisada.

## Decision

- QA cleanup review complete: SI.
- Produccion ordenada para beta: SI, con QA/demo identificado y no mezclado conceptualmente.
- Ready for PUBLIC-LAUNCH-READINESS-2: SI.
- Ready for full public launch: NO.
- Proximo hito recomendado: `QA-CLEANUP-ARCHIVE-2` o `PUBLIC-LAUNCH-READINESS-2`.
