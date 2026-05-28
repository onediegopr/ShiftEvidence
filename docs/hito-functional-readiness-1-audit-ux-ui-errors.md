# HITO FUNCTIONAL-READINESS-1 - Auditoria funcional, localhost, Gemini, UX/UI y hotfixes

## Resumen

Auditoria funcional pre-uso real ejecutada sobre `main` despues de `RECOVERY-1`.

Estado del hito: **SUPERSEDED BY FUNCTIONAL-READINESS-1B**.

Motivo original: validaciones base, localhost, produccion sin sesion, rutas privadas, seguridad de codigo, conteos QA/demo y hotfixes UX/copy pasaron. En este hito Codex no tenia sesion autenticada para confirmar evidencia fresca de Gemini real en preview/PDF, user dashboard y admin dashboard.

Actualizacion 2026-05-28:

- `FUNCTIONAL-READINESS-1B` recibio evidencia user-attested fresca.
- User flow: PASS.
- Admin flow: PASS.
- Localhost: PASS.
- Gemini local smoke: PASS con `providerStatus=success`.
- PDF/report preview/Gemini Advisory del flujo real: PASS por user-attested evidence.
- Full public launch: sigue NO.

## Metodologia

- Preflight Git sobre `main`.
- Validaciones base locales.
- Smoke HTTP local sin sesion.
- Smoke HTTP produccion sin sesion contra `https://shiftevidence.com`.
- Revision de rutas privadas/admin y endpoints admin sin sesion.
- Revision de codigo de AI runtime, AiUsageEvent, PDF/report, runtime settings y entitlements.
- Revision UX/UI contra Web Interface Guidelines de Vercel.
- Busqueda de claims peligrosos y contradicciones de docs.
- Busqueda de patrones de secretos sin imprimir valores.
- Conteos seguros de DB para QA/demo, IA, auditoria, reportes y entitlements.
- Hotfix minimo de copy/idioma en consola admin.

## Git

- Branch: `main`
- HEAD inicial esperado: `04059b7`
- `origin/main` inicial esperado: `04059b7`
- Stash preservado: `stash@{0}: On main: park beta invite docs before functional readiness`
- Stash aplicado: no

## Localhost / local dev

Estado:

- Localhost funciona: si
- Puerto: `3000`
- Proceso local detectado tras recovery: Node/Next
- Comando recomendado: `npm run build && npm run start -- -p 3000`

Rutas locales:

| Ruta | Resultado |
| --- | --- |
| `/` | `200` |
| `/shiftreadiness` | `200` |
| `/sign-in` | `200` |
| `/sign-up` | `200` |
| `/dashboard` | `307` a `/sign-in` |
| `/dashboard/admin` | `307` a `/sign-in` |

Notas:

- `next start` puede bloquear `npx prisma generate` en Windows por lock `EPERM` sobre `node_modules/.prisma/client`.
- Recovery documentado en `docs/hito-recovery-1-localhost-and-dirty-tree.md`.
- Procedimiento seguro: detener solo el proceso Next local de `:3000`, ejecutar Prisma generate y reiniciar Next.

## Gemini produccion

Evidencia disponible:

- Evidencia previa user-attested: Gemini real reportado como activo, preview/PDF PASS, AI Advisory visible, no JSON crudo, no `[object Object]`.
- Codigo actual: soporta runtime effective config `env`, `disabled`, `mock`, `gemini`.
- Endpoint admin AI status: protegido por login; sin sesion redirige a `/sign-in`.
- OpenAI: no activado por este hito.

Limitacion:

- Codex no tuvo sesion autenticada para confirmar providerStatus fresco `success` en produccion ni generar nuevo AiUsageEvent Gemini desde preview/PDF.
- No se declara Gemini fresco como PASS total en este hito.

User-attested requerido para cerrar esta parte:

```text
USER-ATTESTED QA - GEMINI PRODUCTION REPORT CHECK

- Login:
- Assessment abre:
- Report preview abre:
- Gemini Advisory aparece:
- Parece respuesta real/no mock:
- PDF genera/descarga:
- AI Advisory aparece en PDF:
- AiUsageEvent aparece en IA y Consumo:
- Provider/model visible como Gemini:
- No JSON crudo:
- No [object Object]:
- No secrets/storage paths:
- Errores visibles:
- User final confidence: PASS/PARTIAL/FAIL
```

## Gemini local

- `AI_ADVISORY_ENABLED`: ausente en `.env.local`
- `AI_ADVISORY_PROVIDER`: ausente en `.env.local`
- `AI_ADVISORY_MODEL`: ausente en `.env.local`
- `GEMINI_API_KEY`: ausente en `.env.local`
- `OPENAI_API_KEY`: ausente en `.env.local`

Resultado:

- Local puede servir la app, pero no puede validar Gemini real localmente sin credencial local.
- Esto no contradice produccion: produccion puede tener Gemini configurado en runtime Hostinger.

## Validaciones base

- `npm run hostinger:diagnose`: OK
- `npm run ai:guardrails`: OK
- `npm run typecheck`: OK
- `npm run lint`: OK
- `npm run build`: OK
- `npx prisma validate`: OK
- `npx prisma generate`: OK

Warning conocido:

- `next build` reporta warning NFT en `reportStorageService.ts` desde ruta de descarga de reportes.
- Clasificacion: P2 no bloqueante, conocido.

## Produccion publica / privada sin sesion

Dominio validado: `https://shiftevidence.com`

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

HTML publico:

- Sin patrones de secrets detectados.
- Sin stack traces publicos detectados.
- Sin `[object Object]` detectado en rutas publicas revisadas.
- Sin JSON crudo como respuesta de pagina publica.

Endpoints admin sin sesion:

- `/api/admin/ai/status`: `307` a `/sign-in`
- `/api/admin/ai/usage`: `307` a `/sign-in`
- `/api/admin/settings`: `307` a `/sign-in`
- `/api/admin/audit`: `307` a `/sign-in`
- `/api/admin/entitlements`: `307` a `/sign-in`
- `/api/admin/opportunities`: `307` a `/sign-in`

## Auth

Rutas revisadas sin sesion:

- `/sign-in`: carga.
- `/sign-up`: carga.
- `/forgot-password`: carga.
- `/reset-password`: carga.

Observaciones:

- No se detectaron tokens en HTML.
- Reset password sin token muestra estado controlado segun codigo.
- Formularios usan labels y autocomplete en los flujos principales revisados.

## User dashboard / assessment flow

Estado:

- Sin sesion autenticada en Codex.
- Rutas privadas redirigen correctamente a `/sign-in`.
- Flujo autenticado requiere user-attested fresco.

User-attested requerido:

```text
USER-ATTESTED QA - FUNCTIONAL-READINESS-1 USER FLOW

- Login:
- /dashboard carga:
- /dashboard/assessments carga:
- Assessment QA abre:
- Context Intake visible:
- Guardado/persistencia si se prueba:
- Upload/evidence status visible:
- Missing evidence visible:
- Report preview abre:
- Gemini Advisory aparece o fallback correcto:
- PDF genera/descarga si corresponde:
- No JSON crudo:
- No [object Object]:
- No secrets/storage paths:
- AiUsageEvent se registra o IA y Consumo refleja uso:
- Errores visibles:
- User final confidence: PASS/PARTIAL/FAIL
```

## PDF / report

Revision de codigo:

- Generacion PDF requiere sesion y ownership.
- Descarga requiere sesion, ownership y report generado.
- Download usa `Cache-Control: no-store`.
- Filename se sanitiza.
- Runtime settings y entitlements se evalua antes de generar/descargar.
- Errores de generacion redirigen con mensaje seguro.

Limitacion:

- No se genero PDF fresco en este hito por falta de sesion.

## Admin console

Revision sin sesion:

- `/dashboard/admin`: protegido, redirige a sign-in.
- Endpoints admin protegidos.

Revision de codigo:

- Admin guard usa session + `ADMIN_EMAILS`.
- Usuario autenticado no-admin recibe pantalla de permisos insuficientes.
- Link admin solo se muestra si `isAdminEmail(session.user.email)`.
- Acciones operativas requieren confirmacion.
- Cambios runtime/entitlements/oportunidades auditan eventos.

Hotfix aplicado:

- Se corrigieron textos visibles de admin con ingles innecesario:
  - `Runtime settings y enforcement` -> `Configuracion runtime y enforcement`.
  - `secrets` -> `secretos`.
  - `provider mock` -> `proveedor simulado`.
  - `Mock` -> `Simulacion`.
  - `Entitlements` -> `Derechos de acceso`.
  - `Full report` -> `Reporte completo`.
  - `assessment/assessments` visibles -> `evaluacion/evaluaciones`.
  - Estados internos como `pending_payment`, `internal_qa`, `success`, `mock`, `revoked` se muestran con labels en espanol cuando pasan por `formatStatusLabel`.

Admin authenticated smoke requerido:

```text
USER-ATTESTED QA - FUNCTIONAL-READINESS-1 ADMIN FLOW

- Login admin:
- /dashboard/admin carga:
- Estado del Sistema carga:
- IA y Consumo carga:
- Accesos y Planes carga:
- Oportunidades carga:
- Configuracion Operativa carga:
- Auditoria carga:
- No secrets visibles:
- Settings finales correctas:
- Runtime IA env/gemini:
- PDF/download enabled:
- Assessment creation enabled:
- Errores visibles:
- User final confidence: PASS/PARTIAL/FAIL
```

## Runtime settings / enforcement

Revision de codigo:

- `SystemSetting` se usa como override operativo seguro.
- `ai.runtimeMode` efectivo soporta `env`, `disabled`, `mock`, `gemini`.
- `canUseAi`, `canGeneratePdf`, `canDownloadReport`, `assertCanCreateAssessment` existen server-side.
- Bloqueos registran `AuditEvent` sin romper el producto si falla auditoria.
- No se editan variables Hostinger.
- No se editan secrets desde admin.

Limitacion:

- No se probaron toggles en produccion durante este hito por falta de sesion.
- Evidencia previa ADMIN-4 user-attested reporto PASS y estado final operativo.

## Entitlements / accesos

Revision de codigo:

- `UserEntitlement` existe y se consulta para AI/PDF/assessment limits.
- Planes con full report: `professional`, `blueprint`, `msp_partner`, `internal_qa`, `admin`.
- Planes con IA: `starter`, `professional`, `blueprint`, `msp_partner`, `internal_qa`, `admin`.
- Estados bloqueantes: `expired`, `revoked`, `pending_payment`.

Limitacion:

- No se modificaron entitlements ni usuarios reales.

## IA y Consumo

Revision de codigo/DB:

- `AiUsageEvent` existe.
- `recordAiUsageEvent` sanitiza metadata y evita prompt/response/raw paths/secrets.
- Token estimate: `ceil(chars / 4)`.
- Cost estimate: configurable por modelo conocido.
- Query admin agrupa summary, user, assessment, errores y alertas.

Conteos seguros:

- `AiUsageEvent`: 1
- `AiUsageEvent` ultimos 7 dias: 1
- Errores/timeouts IA persistidos: 0

## QA/demo data

Conteos seguros:

- Usuarios: 24
- Assessments totales: 36
- Assessments QA: 25
- Assessments `safe to delete`: 14
- Reports no borrados: 29
- Evidence files no borrados: 11
- AuditEvent: 343
- UserEntitlement: 1
- Entitlement `internal_qa`: 1
- CommercialOpportunity: 1
- Opportunity QA: 1

Impacto:

- QA/demo sigue identificada y no se borro.
- Riesgo P2: QA/demo puede contaminar metricas comerciales si no se filtra visualmente antes de full public launch.
- No bloquea broader invited beta controlada.

## Seguridad / secrets

Repositorio/diff:

- No se agregaron `.env`.
- No se agregaron `.env.local`.
- No se agregaron API keys.
- No se agregaron URLs DB.
- No se agregaron storage paths privados.
- No se imprimieron valores secretos.

Hallazgo local:

- `.env.local` existe y esta ignorado por Git.
- `.tmp/` esta ignorado por Git.
- Se detectaron patrones sensibles dentro de perfiles temporales Chrome en `.tmp/chrome-*`.

Clasificacion:

- P2 local hygiene, no bloqueante para repo porque `.tmp/` esta ignorado y no entra en diff.
- Recomendacion: limpiar o mover perfiles temporales de browser fuera del workspace en un hito de higiene local, sin tocar datos productivos.

## UX/UI / accesibilidad

Fuente de reglas:

- Web Interface Guidelines de Vercel.

Hallazgos:

- P2: admin tenia labels mixtos ingles/espanol. Corregido en este hito.
- P2/P3: `src/index.css` contiene varios `transition: all` y algunos `outline: none`; no se corrigio por alcance, requiere pasada CSS controlada para evitar regresiones visuales.
- P3: algunos estados de carga publicos usan `...` en vez de `…`.
- P3: hay botones detectados por busqueda estatica sin `type` en lineas abiertas; muchos son falsos positivos por multilinea o botones fuera de form. Requiere revision visual/manual, no bloqueante.
- P3: algunos nombres tecnicos permanecen intencionalmente como marca/plan (`Gemini`, `Blueprint`, `Professional`, `MSP Partner`, `runtime`).

## Docs / coherencia

Revision:

- README, manual v1.2, launch pack, production decision, AI runbook y guardrails revisados por patrones principales.
- Full public launch sigue documentado como NO.
- OpenAI sigue documentado como no activo.
- Billing automatico/checkout publico siguen documentados como no activos.
- Manual v1.2 existe como fuente vigente.

Observaciones:

- Algunas menciones a `migracion garantizada`, `zero downtime` o `100% successful boot rate` aparecen en secciones historicas o de "no promete" / hallazgos corregidos, no como claims activos.

## Logs / errores

Fuentes revisadas:

- Conteos `AuditEvent`.
- Conteos `AiUsageEvent`.
- Validaciones build/lint/typecheck.
- Produccion sin sesion.

No revisado:

- Hostinger runtime logs autenticados.
- Consola navegador autenticada.

## Hallazgos por severidad

### P0

- Ninguno abierto.

### P1

- Ninguno abierto con evidencia disponible.

### P2

- Gemini real fresco en produccion requiere user-attested porque Codex no tiene sesion autenticada.
- User dashboard/admin authenticated smoke fresco requiere user-attested.
- `.tmp/chrome-*` contiene perfiles temporales ignorados con posibles tokens/cookies; no se commitea, pero conviene limpiarlo fuera de este hito.
- QA/demo data sigue presente y debe filtrarse/archivarse antes de full public launch.
- CSS tiene `transition: all` y algunos `outline: none`.

### P3

- Microcopy de loading con `...`.
- Algunos botones/form controls requieren revision manual fina por busquedas estaticas.
- Algunos terminos tecnicos se mantienen en ingles por marca/producto.

## Fixes aplicados

- Hotfix de copy/idioma en `src/app/dashboard/admin/page.tsx`.
- Se agrego `formatStatusLabel()` para mostrar estados internos de admin en espanol.
- Se corrigio anchor interno de `Evaluaciones` para apuntar a `#evaluaciones`.

## Pendientes

- User-attested fresco de Gemini production report check.
- User-attested fresco de user dashboard / assessment flow.
- User-attested fresco de admin dashboard.
- Hito de higiene local para `.tmp/chrome-*` si se decide limpiar perfiles temporales.
- Pasada CSS/accesibilidad para reemplazar `transition: all`, revisar `outline: none` y completar microcopy.
- QA/demo filtering/archive antes de full public launch.
- Hostinger runtime logs review.

## Decision final

- Producto funcional para broader invited beta: **PARCIALMENTE VALIDADO** por Codex; requiere user-attested fresco para flujos autenticados.
- Localhost functional: **SI**.
- Gemini production functional: **PENDIENTE user-attested fresco**; evidencia previa existe, pero no se revalido en este hito.
- Ready for first real client usage: **NO cerrar desde este hito sin user-attested fresco**.
- Ready for full public launch: **NO**.
- Proximo hito recomendado: completar user-attested de `FUNCTIONAL-READINESS-1` o ejecutar `FUNCTIONAL-READINESS-1B` autenticado.
## LOCAL-GEMINI-1 Note

Date: 2026-05-28.

Local Gemini provider connectivity was validated with `npm run ai:smoke-local-gemini` using an ignored `.env.local` secret. The smoke returned `providerStatus=success` without printing the key or full response. The strict synthetic PDF generator still returned `providerStatus=error`, so local PDF/advisory success remains a separate hardening item.
