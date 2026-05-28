# HITO AUDIT-1 - Auditoria integral pre-beta

Fecha: 2026-05-28.

## Resumen

AUDIT-1 reviso ShiftReadiness antes de invitar clientes beta.

Resultado:

- Estado general: COMPLETO CON HOTFIXES MENORES.
- P0 abiertos: 0.
- P1 abiertos: 0.
- P1 corregidos: 1 grupo de copy publico que prometia ejecucion/conversion/migracion mas alla del alcance readiness.
- P2/P3 abiertos: documentados como no bloqueantes para broader invited beta.
- Full public launch: NO.

## Metodologia

Se ejecuto:

- preflight Git;
- validaciones locales;
- smoke produccion sin sesion;
- revision de HTML publico;
- revision de endpoints admin sin sesion;
- revision de guardas admin;
- revision de runtime settings/enforcement;
- revision de sanitizacion AI;
- consulta segura de counts QA/demo, auditoria y AI usage;
- busquedas de secrets y claims peligrosos;
- revision UX/UI basica contra Web Interface Guidelines;
- hotfixes minimos de copy y coherencia.

No se ejecuto:

- QA autenticado fresco desde Codex, porque no hay sesion user/admin disponible en este runtime;
- screenshots Playwright, porque `playwright` no esta instalado en el entorno Node disponible;
- Hostinger runtime logs, porque no hay acceso directo desde Codex.

La evidencia autenticada previa de user/admin PASS sigue vigente, pero AUDIT-1 no debe contarse como replay autenticado fresco.

## Areas auditadas

- Produccion publica.
- Auth/login/sign-up/reset.
- Rutas privadas sin sesion.
- Dashboard y assessments a nivel codigo/documentacion.
- Report preview/PDF a nivel codigo/evidencia previa.
- Gemini AI Advisory y guardrails.
- Admin console.
- IA y Consumo.
- Accesos y Planes.
- Oportunidades comerciales.
- Configuracion Operativa.
- Auditoria.
- Entitlements/enforcement.
- Seguridad y secrets.
- UX/UI/copy.
- Docs/manual v1.2.
- QA/demo data.
- Coherencia broader invited beta.

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

- Turbopack NFT warning conocido en `next.config.mjs` / `reportStorageService`.
- No bloqueante.

## Produccion publica sin sesion

| Ruta | Resultado |
| --- | --- |
| `/` | `200` |
| `/shiftreadiness` | `200` |
| `/sign-in` | `200` |
| `/sign-up` | `200` |
| `/forgot-password` | `200` |
| `/reset-password` | `200` |
| `/dashboard` | `307` a `/sign-in` |
| `/dashboard/assessments` | `307` a `/sign-in` |
| `/dashboard/admin` | `307` a `/sign-in` |
| `/dashboard/admin/unlock-requests` | `307` a `/sign-in` |

No se observaron `500`, `503`, `504` ni Hostinger 404.

## HTML publico

Rutas muestreadas:

- `/`
- `/shiftreadiness`
- `/sign-in`
- `/sign-up`
- `/forgot-password`

Resultado:

- assets `_next` presentes;
- no stack traces visibles;
- no patrones de secrets en HTML;
- no DB URLs;
- no API keys.

## Endpoints admin sin sesion

Rutas probadas:

- `/api/admin/ai/status`
- `/api/admin/ai/usage`
- `/api/admin/settings`
- `/api/admin/entitlements`
- `/api/admin/opportunities`
- `/api/admin/audit`

Resultado:

- todas redirigen `307` a `/sign-in` sin sesion.

## User flow

Estado:

- No revalidado fresco por Codex por falta de sesion autenticada.
- Cubierto por evidencia user-attested previa en `PUBLIC-LAUNCH-READINESS-2`.

Evidencia previa aceptada:

- login PASS;
- dashboard PASS;
- assessments PASS;
- preview PASS;
- Gemini/fallback PASS;
- PDF genera/descarga PASS;
- no JSON crudo;
- no `[object Object]`;
- no secrets/storage paths.

Riesgo:

- P2: falta replay autenticado fresco desde AUDIT-1 antes de invitar cada nuevo lote beta.

## Admin flow

Estado:

- No revalidado fresco por Codex por falta de sesion admin.
- Cubierto por evidencia user-attested previa en `ADMIN-4-PROD-OPS-SMOKE` y `PUBLIC-LAUNCH-READINESS-2`.

Revision codigo:

- `/dashboard/admin` usa login del producto.
- usuarios sin sesion redirigen a `/sign-in`.
- endpoints admin requieren `requireAdminSession`.
- admin console muestra estado, IA, consumo, accesos, oportunidades, configuracion operativa y auditoria.

Riesgo:

- P2: repetir smoke admin autenticado antes del primer lote mayor de clientes beta.

## Gemini / AI Advisory

Revision:

- OpenAI no activo.
- Gemini real activo segun estado heredado.
- AI payload sanitizer elimina secrets, tokens, emails, storage paths y raw file content.
- `AiUsageEvent` persiste metadata segura.
- `recordAiUsageEvent` no guarda prompts completos ni raw responses.
- `canUseAi` soporta disabled/runtime/budget/entitlement.
- fallback no debe romper preview/PDF.

Counts seguros:

- `AiUsageEvent` total: 1.
- eventos `admin_test`/`synthetic_test`: 1.
- AI errors/timeouts/unavailable/bloqueos persistidos: 0.

## PDF / report flow

Estado:

- No se genero PDF fresco en AUDIT-1 por falta de sesion/entitlement.
- Cubierto por evidencia previa user-attested PASS.
- Codigo de enforcement PDF/download revisado.

Riesgo:

- P2: hacer un PDF QA fresco antes del primer cliente externo nuevo si se quiere reducir riesgo operativo.

## Entitlements / enforcement

Revision:

- `UserEntitlement` activo en produccion.
- `canGeneratePdf`, `assertCanDownloadReport` y `assertCanCreateAssessment` aplican settings/entitlement.
- Bloqueos devuelven mensajes controlados en espanol.
- Auditoria de bloqueos no debe romper producto si falla persistencia.

No probado fresco:

- revoked/expired con usuario QA.

Riesgo:

- P2: ejecutar prueba controlada de revoked/expired en usuario QA antes de usar entitlements con mas clientes.

## QA/demo data

Counts seguros:

- assessments QA/demo: 25.
- `safe to delete`: 14.
- synthetic detectados por nombre actual: 0.
- `internal_qa` entitlements: 1.
- oportunidades QA: 1.
- AI usage `admin_test`/`synthetic_test`: 1.
- reports asociados QA/demo: 31.

Decision:

- no hard-delete;
- mantener trazabilidad;
- tratar QA/demo como no comercial;
- filtrar/archive en hito posterior si molesta metricas.

## Hallazgos P0

Ninguno abierto.

Validado:

- no secrets visibles en HTML muestreado;
- rutas privadas/admin protegidas sin sesion;
- endpoints admin protegidos sin sesion;
- build/lint/typecheck/Prisma OK;
- no DB schema changes;
- no Prisma reset;
- no Hostinger config;
- no OpenAI;
- no full public launch.

## Hallazgos P1

### P1-001 - Copy publico prometia ejecucion/conversion mas alla del alcance readiness

Estado: CORREGIDO EN CODIGO.

Se detecto en HTML productivo y fuente:

- `Zero-Downtime Replication`;
- `Automated VM Translation`;
- `100% successful boot rate`;
- uso de `converter`;
- textos que sugerian cutover/replicacion/configuracion real;
- footer con `zero data loss guidance`.

Riesgo:

- puede contradecir el posicionamiento evidence-based;
- puede prometer capabilities no activas durante beta;
- puede generar expectativa incorrecta en clientes beta.

Fix aplicado:

- `src/components/Features.tsx`: ahora habla de planning, readiness, backup evidence y downtime window review.
- `src/components/Process.tsx`: ahora describe proceso de readiness/validacion, no ejecucion automatizada.
- `src/components/Footer.tsx`: reemplazado `zero data loss guidance` por `data-loss risk guidance`.
- `src/app/sign-up/page.tsx`, `src/views/SignUpPage.tsx`, `src/components/ReadinessValidator.tsx`: eliminadas referencias a auto-converter/staging como si fueran ejecucion real.

Nota:

- produccion seguira mostrando el copy anterior hasta que el deploy automatico tome el commit.

## Hallazgos P2

### P2-001 - No hubo replay autenticado fresco en AUDIT-1

Estado: ABIERTO / NO BLOQUEANTE PARA BETA INVITADA.

Motivo:

- Codex no tiene sesion user/admin en este runtime.
- Se usa evidencia user-attested previa, pero no es un replay fresco de AUDIT-1.

Recomendacion:

- antes del primer cliente nuevo, ejecutar user/admin smoke rapido autenticado.

### P2-002 - QA/demo data sigue visible en metricas si no se filtra

Estado: ACEPTADO PARA BETA.

Impacto:

- puede distorsionar lectura comercial si se interpreta sin contexto.

Recomendacion:

- `QA-CLEANUP-ARCHIVE-2` o filtro admin antes de full public launch.

### P2-003 - CSS legacy tiene multiples `transition: all` y algunos `outline: none`

Estado: ABIERTO / NO BLOQUEANTE.

Impacto:

- no bloquea beta;
- puede afectar accesibilidad/focus/performance visual.

Recomendacion:

- hito UX-HARDENING-1 para revisar focus-visible, reduced motion y transiciones.

### P2-004 - Copy publico sigue mayormente en ingles mientras admin esta en espanol

Estado: ACEPTADO.

Motivo:

- requisito estricto de espanol aplica al admin interno;
- paginas publicas pueden permanecer en ingles mientras beta sea invitada.

## Hallazgos P3

### P3-001 - Alertas `alert()` en frontend publico

Estado: PARCIALMENTE MITIGADO.

Se mantuvo:

- footer newsletter con alert simple;
- `sign-up` usa alert informativo para indicar que PDF real se descarga desde workspace.

Recomendacion:

- reemplazar con toast/inline state en UX-HARDENING-1.

### P3-002 - DOCX v1.2 pendiente

Estado: DOCUMENTADO.

Markdown v1.2 es fuente vigente. DOCX queda pendiente hasta tener generador repo-safe y verificacion visual.

## Fixes aplicados

- Copy publico de features/proceso alineado a readiness.
- Footer publico sin claim de zero data loss.
- Wizard sign-up sin descarga simulada.
- Mensajes de auto-converter reemplazados por revision/planificacion.
- Textos admin obsoletos ADMIN-2A/2B actualizados.
- `sign-in` inputs agregan `autocomplete` y `spellCheck={false}` en email.

## Fixes no aplicados

- No se cambio DB schema.
- No se agregaron features.
- No se agrego filtro QA/demo.
- No se reemplazaron todos los `transition: all`.
- No se implemento DOCX.
- No se hizo QA autenticado fresco desde Codex.

## Riesgos aceptados

- QA/demo data identificada pero no filtrada.
- Costos IA estimados, no billing real.
- Billing manual.
- Soporte sin SLA formal.
- Hostinger logs no integrados/revisados desde Codex.
- Replay autenticado fresco pendiente antes de ampliar lote beta.

## Riesgos no aceptados

- secrets visibles;
- rutas privadas publicas;
- admin abierto a no-admin;
- PDF globalmente roto;
- Gemini sin fallback;
- perdida de datos;
- OpenAI activado sin decision;
- full public launch sin aprobacion explicita.

## Decision final

- AUDIT-1 complete: SI.
- Broader invited beta: SI, con hotfixes aplicados y deploy automatico esperado.
- Full public launch: NO.
- Proximo hito recomendado: `BETA-INVITE-1` con smoke autenticado fresco, o `UX-HARDENING-1` para accesibilidad/focus/responsive.
