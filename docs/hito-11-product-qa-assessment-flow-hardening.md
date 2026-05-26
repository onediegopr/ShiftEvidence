# HITO 11 — Product QA / Assessment Flow Hardening

## Objetivo

Ejecutar QA local integral del flujo principal de ShiftReadiness antes de retomar Hostinger:

- rutas publicas y auth shell;
- dashboard protegido;
- assessment CRUD;
- manual intake;
- cost/risk assumptions;
- evidence/storage;
- parser/inventory;
- risk engine/scores;
- report/PDF regression;
- unlock/admin/entitlement;
- seguridad basica de acceso.

Este hito no ejecuta deploy, no toca Hostinger y no modifica schema ni migraciones.

## Contexto

Estado inicial:

- branch: `main`
- HEAD inicial: `c692fa4 fix: polish readiness PDF visual output`
- working tree inicial: limpio
- local estable: si
- Hostinger: pausado
- Production launched: NO

Hostinger sigue bloqueado por env vars/storage productivos, especialmente `DATABASE_URL`.

## Entorno local

- Node: `v22.22.0`
- npm: `10.9.4`
- `.env.local`: presente
- DB local: disponible
- storage local: disponible
- usuario QA usado: `hito10qa+1779805937369@example.local`
- admin local existente: `h81-admin-smoke@example.com`
- cookie QA existente usada para smoke autenticado: presente

`npm run hostinger:diagnose` se ejecuto como smoke local. El script no carga `.env.local`, por lo que reporta env vars ausentes aunque la app local si carga `.env.local` durante `next build` / `next start`.

## Rutas públicas/auth

Validado con `next start -p 3000`:

- `/`: `200 OK`
- `/shiftreadiness`: `200 OK`
- `/sign-in`: `200 OK`
- `/sign-up`: `200 OK`
- `/dashboard` sin sesion: `307` a `/sign-in`
- `/dashboard/assessments` sin sesion: `307` a `/sign-in`

Contenido HTML validado:

- home contiene `ShiftReadiness`, `Explore ShiftReadiness` y `/shiftreadiness`;
- `/shiftreadiness` contiene `VMware`, `Proxmox` y `Readiness`;
- `/sign-up` y `/sign-in` contienen campos de email/password;
- no se detecto `[object Object]`.

## Dashboard

Con sesion QA:

- `/dashboard`: `200 OK`
- `/dashboard/assessments`: `200 OK`
- `/dashboard/assessments/cmpmqm8jh000ciznkuq9rnn5t`: `200 OK`
- `/dashboard/assessments/cmpmqm8jh000ciznkuq9rnn5t/report`: `200 OK`

Contenido validado:

- dashboard carga;
- assessment list carga;
- assessment QA parseado aparece;
- assessment HITO 11 creado para QA aparece;
- no se detecto `[object Object]`.

## Assessment CRUD

Se creo un assessment QA local nuevo:

- assessment id: `cmpmzc6ul0001izo85suykooh`
- titulo inicial: `HITO 11 QA Product Flow 2026-05-26T18-39-38-496Z`
- titulo actualizado: `HITO 11 QA Product Flow 2026-05-26T18-39-38-496Z - updated`
- workspace: `cmpmqidb50003iznsvw4twj0d`

Validaciones:

- create: OK mediante DB local/dev con estructura de producto equivalente;
- read: OK por ruta autenticada `/dashboard/assessments/cmpmzc6ul0001izo85suykooh`;
- update: OK, titulo actualizado persistio;
- audit events creados para create/update;
- ownership: usuario QA accede a su assessment; assessment de otro owner devuelve `404`.

Nota: los Server Actions de forms no se invocaron directamente desde CLI porque no hay interfaz HTTP estable para simularlos sin acoplarse al protocolo interno de Next. La persistencia se valido con DB local y rutas autenticadas.

## Manual intake

En el assessment HITO 11 se guardo manual intake local con:

- VM count;
- hosts;
- cluster;
- sockets/cores;
- RAM;
- storage footprint;
- used storage;
- snapshots;
- critical workloads;
- large VMs;
- powered-off VMs;
- notes.

Validaciones:

- persistencia: OK;
- reload via dashboard detail: OK;
- audit event `infrastructure_input_updated`: OK;
- campos incompletos no crashean en assessments existentes.

## Cost/risk assumptions

En el assessment HITO 11 se guardaron assumptions locales:

- VMware annual cost;
- Proxmox estimated cost;
- currency `USD`;
- years `3`;
- socket/core/VM assumptions;
- complexity/business criticality/risk tolerance.

Validaciones:

- persistencia: OK;
- preliminary result QA creado con delta anual y 3-year delta;
- audit event `cost_risk_assumptions_updated`: OK;
- se mantiene claridad anual/3-year en datos persistidos.

## Evidence/storage

Se creo evidencia QA fisica real para el assessment HITO 11:

- evidence file id: `cmpmzc9x7000mizo8uwkoiqox`
- filename: `hito-11-qa-rvtools.xlsx`
- size: `21282` bytes
- SHA-256 prefix: `e52d542c84f4`
- storage root: `storage`
- fuera de `public`: si
- fuera de `.next`: si

Validaciones:

- `npm run storage:check`: OK;
- download autenticado: `200 OK`, `content-type` XLSX, `content-length: 21282`;
- download sin sesion: `307` a `/sign-in`;
- soft-delete local: OK;
- archivo fisico removido: OK;
- download post-delete: `404`.

Hallazgo QA:

- El evidence file sintetico del assessment parseado `cmpmqm8jh000ciznkuq9rnn5t` apunta a `qa/hito-10-1-synthetic-rvtools.csv`, que no existe fisicamente; su descarga devuelve `404`.
- Esto se clasifico como issue del fixture QA legado, no como bug de storage, porque el flujo con archivo fisico real funciono correctamente.

## Parser/inventory

Assessment parseado usado:

- assessment id: `cmpmqm8jh000ciznkuq9rnn5t`
- evidence id: `cmpmqma6u000riznkby9jpmt6`
- processing status: `parsed`
- parsed VMs: `4`
- parsed hosts: `2`
- parsed datastores: `2`
- parsed snapshots: `2`
- summary: presente
- total provisioned GB: `18500`
- total used GB: `11200`

Validaciones:

- inventory data presente: OK;
- summary presente: OK;
- parser status `parsed`: OK;
- inventory UI route carga: OK.

Reparse no se ejecuto en este hito porque el fixture parseado legado no conserva archivo fisico real. Se dejo documentado como pendiente no bloqueante; el flujo de parser ya estaba cubierto por registros parseados y el flujo de storage/download fue validado con archivo fisico real.

## Risk engine/scores

Assessment parseado usado:

- findings: `3`
- readiness score: `72`
- confidence score: `68`
- risk level: `medium`

Findings presentes:

- high/datastore: `Legacy datastore near capacity`
- medium/snapshot: `Snapshot requires cleanup before migration`
- low/cost: `Subscription delta appears favorable`

Validaciones:

- RiskFinding: OK;
- AssessmentScore: OK;
- readiness/confidence separados: OK;
- VM matrix respaldada por parsed VMs: OK;
- source indicator en findings: parser/cost_risk;
- evidencia limitada del assessment incompleto no crashea.

## Report/PDF regression

Validaciones ejecutadas:

- generar free preview para assessment incompleto: `303` a report page con `generated=1`;
- generar full `readiness_report` para assessment con entitlement: `303` a report page con `generated=1`;
- descargar preview PDF: `200 OK`, `application/pdf`, archivo no vacio;
- descargar full readiness PDF: `200 OK`, `application/pdf`, archivo no vacio;
- no session download: `307` a `/sign-in`;
- report/assessment mismatch: `404`;
- report soft-delete via POST: `303` con `deleted=1`;
- download post-delete: `404`;
- report history contiene reportes generados.

PDFs descargados durante QA:

- preview: `hito11-preview.pdf`, `21591` bytes;
- full: `hito11-full-after-fix.pdf`, `23608` bytes.

## Unlock/admin/entitlement

Assessment full usado:

- assessment id: `cmpmqm8jh000ciznkuq9rnn5t`
- unlock request: `cmpmtmse30001izh8sglt0ckm`
- requested type: `readiness_report`
- status: `fulfilled`
- `full_report_unlocked`: `granted`

Validaciones:

- full report desbloqueado con entitlement: OK;
- full report sin entitlement en assessment incompleto permanece locked: OK;
- report page incompleto muestra `Free Preview`, `locked`, `Unlock`, `Readiness Report`;
- non-admin/QA user en admin route: `404` fail-closed;
- admin local existe, pero no se uso sesion admin nueva en este hito; se hizo smoke reducido porque HITO 10.2 ya valido fulfill local.

## Security/access

Validaciones:

- rutas privadas sin sesion redirigen a `/sign-in`;
- download de evidencia sin sesion redirige a `/sign-in`;
- download de reporte sin sesion redirige a `/sign-in`;
- assessment de otro owner devuelve `404`;
- report/assessment mismatch devuelve `404`;
- admin route para usuario no-admin devuelve `404`;
- storage no esta bajo `public` ni `.next`;
- evidencia soft-deleted no descarga;
- reporte soft-deleted no descarga;
- no se detecto leakage de full report en assessment sin entitlement.

## Bugs encontrados

1. Audit messages de reportes full usaban copy de preview.

   Sintoma:
   - `report_generated` / `report_downloaded` decian `PDF preview` incluso para `readiness_report`.

   Impacto:
   - No afectaba permisos ni PDF, pero degradaba trazabilidad y auditoria.

   Fix:
   - Se ajustaron mensajes para usar `getReportTypeLabel(reportType)`.
   - Nuevo resultado: `Generated Readiness Report`, `Downloaded Readiness Report`.

2. Fixture QA parseado con archivo fisico ausente.

   Sintoma:
   - Evidence metadata existe y esta `parsed`, pero el archivo `qa/hito-10-1-synthetic-rvtools.csv` no existe en storage.

   Impacto:
   - No afecta parser/risk/report existentes, pero impide descargar ese evidence legado.

   Decision:
   - No se corrigio como codigo. Se valido storage real con un nuevo archivo fisico QA y se documenta limpiar/rehidratar fixture si se necesita repetir reparse.

## Fixes aplicados

Archivos modificados:

- `src/app/api/assessments/[id]/reports/[reportId]/download/route.ts`
- `src/server/reports/reportGenerationService.ts`

Cambio:

- mensajes de audit events de generation/download/delete ahora usan el tipo real de reporte.

Validacion del fix:

- `npm run typecheck`: OK
- `npm run lint`: OK
- `npm run build`: OK
- nuevo full report generado: OK
- nuevo full report descargado: OK
- audit events nuevos: `Generated Readiness Report`, `Downloaded Readiness Report`

## Validaciones técnicas

Ejecutadas durante el hito:

- `npm run hostinger:diagnose`: OK como smoke local, con nota de `.env.local` no cargado por el script.
- `npm run typecheck`: OK
- `npm run lint`: OK
- `npm run storage:check`: OK
- `npm run build`: OK
- `next start -p 3000`: OK

Warning conocido:

- Turbopack/NFT warning por tracing de storage en `reportStorageService.ts`.
- No bloqueo build ni runtime local.

## Riesgos pendientes

- Reparse directo desde UI/Server Action no se automatizo desde CLI; requiere navegador o harness especifico para Server Actions.
- El fixture parseado de HITO 10 conserva metadata sin archivo fisico descargable.
- Admin fulfill no se repitio con sesion admin nueva en este hito; se hizo smoke reducido porque ya estaba validado en HITO 10.2.
- `hostinger:diagnose` no carga `.env.local`, lo que puede confundir diagnosticos locales si se interpreta como runtime real.
- Hostinger sigue bloqueado por env vars/storage productivos.

## Decisión final

HITO 11 queda completo con bugfix menor aplicado y pendientes no bloqueantes documentados.

El flujo principal local queda estable:

- public/auth: OK;
- dashboard: OK;
- assessment CRUD local: OK;
- manual intake: OK;
- cost/risk assumptions: OK;
- storage/download/soft-delete: OK;
- parser/inventory existente: OK;
- risk/scores: OK;
- report/PDF regression: OK;
- unlock/entitlement: OK con smoke reducido;
- security/access basic: OK.

## Próximo paso recomendado

Ejecutar un hito corto de cleanup QA fixtures si se quiere repetir reparse/download sobre el mismo assessment parseado, o avanzar al siguiente hito funcional local si no se requiere reparse automatizado.

Hostinger debe seguir pausado hasta definir env vars productivas y storage root.
