# HITO PRE-LAUNCH-1 - Full Controlled Beta Acceptance

Fecha: 2026-05-28.

## Objetivo

Realizar hardening pre-launch sin agregar features nuevas:

- validar produccion publica;
- validar rutas privadas sin sesion;
- validar build/guardrails/Prisma;
- revisar estado admin y runtime settings;
- revisar evidencia autenticada heredada;
- revisar QA/demo data sin borrar nada;
- revisar errores/logs disponibles desde DB;
- actualizar documentos de launch;
- mantener full public launch como NO.

## Estado heredado

- HEAD inicial esperado: `332511f docs: record admin 4 production ops smoke`.
- Controlled launch: 100%.
- Limited beta: 99%.
- Full public launch: 97-98%.
- Producto total: 99%.
- Gemini real en produccion: activo.
- OpenAI: no activo.
- Admin console en espanol: activa.
- Runtime settings y enforcement ADMIN-4: productivos.

## Validaciones base

Resultado Codex:

- `npm run hostinger:diagnose`: OK, sin imprimir secrets.
- `npm run ai:guardrails`: OK.
- `npm run typecheck`: OK.
- `npm run lint`: OK.
- `npm run build`: OK.
- `npx prisma validate`: OK.
- `npx prisma generate`: OK.

Warning conocido:

- Turbopack NFT warning en `next.config.mjs` / `reportStorageService`.
- No bloqueante; ya observado en hitos previos.

## Produccion sin sesion

Smoke publico:

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

## Seguridad HTML publica basica

Rutas revisadas:

- `/`
- `/shiftreadiness`
- `/sign-in`
- `/sign-up`

Resultado:

- assets `_next` presentes;
- no patrones visibles de `DATABASE_URL`, `GEMINI_API_KEY`, `OPENAI_API_KEY`, `BETTER_AUTH_SECRET`, DB URL, bearer token, stack trace o error crudo;
- no se imprimieron secrets.

## Admin authenticated smoke

Codex no tuvo sesion admin productiva directa en este hito.

Evidencia user-attested heredada de `ADMIN-4-PROD-OPS-SMOKE`, fechada 2026-05-28:

- login admin: PASS;
- `/dashboard/admin`: PASS;
- `Configuracion Operativa`: PASS;
- `IA y Consumo`: PASS;
- `Auditoria`: PASS;
- no secrets visibles: PASS;
- runtime IA `disabled`: PASS;
- runtime IA `mock`: PASS;
- restauracion `env/gemini`: PASS;
- auditoria registra acciones: PASS;
- estado final IA correcto: PASS;
- PDF/download final enabled: PASS;
- assessment creation final enabled: PASS;
- errores visibles: ninguno reportado.

Interpretacion:

- admin smoke se acepta como PASS por evidencia user-attested reciente.

## User dashboard smoke

Codex no tuvo sesion de usuario productiva directa en este hito.

Evidencia heredada aplicable:

- `CONTEXT-1-PROD-QA`: context intake save/refresh/report/PDF PASS user-attested.
- `AI-1.3`: Gemini real en preview/PDF PASS user-attested.
- `ADMIN-4-PROD-OPS-SMOKE`: estado final operativo confirma IA/PDF/download/assessment creation enabled.

Resultado:

- No se ejecuto fresh user dashboard mini-replay en este hito.
- Se clasifica como cubierto por evidencia heredada reciente + public/private route smoke + build/guardrails.

## Assessment mini-replay

No se creo un assessment nuevo en PRE-LAUNCH-1.

Motivo:

- Evitar datos QA adicionales innecesarios.
- Ya existen multiples assessments QA marcados `safe to delete`.
- Flujos context/Gemini/PDF tienen evidencia user-attested previa.

Decision:

- No bloquear controlled beta acceptance.
- Mantener pendiente una limpieza/archive QA ordenada antes de full public launch.

## Settings finales

Revision segura DB:

- `ops.runtime`: no persistido; aplica default seguro `env`.
- IA efectiva: `env/gemini` segun runtime productivo configurado.
- Budget IA: configurado.
- PDF/download: estado final reportado enabled por user-attested ADMIN-4.
- Assessment creation: estado final reportado enabled por user-attested ADMIN-4.
- Maintenance mode: default no activo.
- OpenAI: no activo.

Budget setting seguro observado:

- monthly budget USD 50.
- daily budget USD 10.
- per-user monthly budget USD 5.
- per-assessment budget USD 2.
- alert thresholds 50/80/100 activos.

## QA cleanup review

No se borro nada.

Se detectaron:

- multiples assessments QA/demo marcados `safe to delete` o `QA`;
- al menos un assessment QA archivado;
- entitlement `internal_qa` activo para usuario QA/controlado;
- oportunidad comercial QA asociada a ADMIN-3 smoke;
- `AiUsageEvent` con status `success`.

Decision:

- mantener por ahora;
- no hard-delete;
- preparar hito posterior de QA cleanup/archive si se quiere reducir ruido antes de full public launch.

## Logs / errores disponibles

Revision segura DB:

- ultimos audit events incluyen eventos comerciales, entitlement, budget, report/PDF y context.
- no se detectaron eventos recientes con patron operativo tipo `fail`, `error`, `timeout`, `blocked`, `disabled`, `revoked` en la muestra revisada.

Limitacion:

- Hostinger runtime logs no fueron revisados desde Codex en este hito.

## Seguridad

- No secrets impresos.
- No `.env` ni `.env.local` versionados.
- No API keys en diff.
- No raw files.
- No storage paths privados.
- Rutas privadas redirigen sin sesion.
- Admin guard preservado.
- OpenAI no activo.
- Full public launch no declarado.

## Riesgos pendientes

- Fresh user dashboard smoke autenticado no se repitio en este hito.
- Hostinger runtime/build/error logs no revisados desde Codex.
- QA/demo data cleanup/archive pendiente.
- Soporte/SLA publico formal pendiente.
- Full public launch requiere decision explicita posterior.

## Checklist para full launch

Antes de full public launch:

- revisar Hostinger logs reales;
- ejecutar fresh authenticated user dashboard replay;
- ejecutar QA cleanup/archive;
- confirmar soporte/SLA;
- confirmar pricing/payment/self-service si aplica;
- revisar entitlement/commercial policy final;
- confirmar rollback operativo admin/IA/PDF.

## Decision

- Controlled beta accepted: SI.
- Ready for limited beta usage: SI.
- Ready for full public launch: NO.
- Proximo hito recomendado: `PUBLIC-LAUNCH-READINESS-2` o `QA-CLEANUP-ARCHIVE-1`.
