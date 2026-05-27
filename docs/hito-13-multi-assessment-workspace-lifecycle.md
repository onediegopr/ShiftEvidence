# HITO 13 — Multi-Assessment Workspace Lifecycle QA + Hardening

## Objetivo

Validar y endurecer el concepto de dashboard persistente multi-assessment/multi-trabajo en ShiftReadiness.

El objetivo de producto es que ShiftReadiness no funcione como un formulario de una sola vez, sino como un workspace donde el usuario puede crear varios assessments, volver luego, continuar trabajos en progreso, agregar evidencia y generar reportes por assessment sin mezclar datos.

Production launched: NO.

## Contexto

Estado al iniciar:

- Branch: `main`.
- HEAD local: `f7d8e66 docs: record manual admin validation launch review`.
- origin/main: `0de69d3 docs: record production dynamic routes recovery`.
- Working tree inicial: limpio.
- Commits locales pendientes antes de HITO 13:
  - `4e2b86b docs: record manual admin validation launch review`.
  - `f7d8e66 docs: record manual admin validation launch review`.
- Producción pública: OK por hitos previos.
- Producción autenticada base: OK por hitos previos.
- Ready for controlled production launch review: SÍ.
- Ready for public launch: NO.

## Public Launch Readiness Review Follow-up

Fecha: 2026-05-27.

Resultado:

- Multi-assessment lifecycle remains acceptable for controlled production launch and limited public beta.
- Codex did not replay authenticated browser QA in this review because production cookies/session were not available.
- Prior HITO 13 code/service audit and hardening remain valid evidence.

Public launch decision:

- Full public launch: NO.
- Blocking item: run authenticated browser QA for multi-assessment, upload, report and PDF before broad public launch.

Validaciones iniciales:

- `npm run hostinger:diagnose`: OK.
- `npm run typecheck`: OK.
- `npm run lint`: OK.
- `npm run build`: OK.
- Warning conocido: Turbopack/NFT trace en `reportStorageService.ts`.

## Concepto de trabajo/assessment

Un assessment es un trabajo persistente dentro del workspace del usuario.

Debe poder existir en paralelo con otros assessments y mantener aislados:

- intake manual;
- assumptions de costo/riesgo;
- evidence files;
- parsed inventory;
- risk findings;
- scores;
- reports;
- unlock requests;
- entitlements;
- audit events.

## Modelo actual

Modelo base auditado:

| Modelo | Rol |
| --- | --- |
| `Workspace` | Contenedor del usuario/equipo |
| `WorkspaceMember` | Membresía usada para ownership/access |
| `Assessment` | Trabajo principal, con `status`, `archivedAt`, `createdAt`, `updatedAt` |
| `AssessmentInfrastructureInput` | Manual infrastructure intake |
| `CostRiskAssumptions` | Cost/risk assumptions |
| `EvidenceFile` | Archivo asociado a un assessment/workspace/user |
| `ParsedVM`, `ParsedHost`, `ParsedDatastore`, `ParsedSnapshot`, `ParsedInventorySummary` | Inventario parseado por assessment/evidence |
| `RiskFinding`, `AssessmentScore` | Findings y scores por assessment |
| `Report` | PDFs por assessment/workspace, con `deletedAt` |
| `UnlockRequest`, `AssessmentEntitlement` | Flujo manual/comercial por assessment |
| `AuditEvent` | Eventos por user/workspace/assessment |

Rutas auditadas:

- `/dashboard`
- `/dashboard/assessments`
- `/dashboard/assessments/new`
- `/dashboard/assessments/[id]`
- `/dashboard/assessments/[id]/report`
- `/dashboard/admin/unlock-requests`

Servicios auditados:

- `assessmentService`
- `assessmentCompletionService`
- `assessmentUploadPrerequisites`
- `infrastructureInputService`
- `costRiskService`
- `evidenceFileService`
- `reportGenerationService`
- `reportHistoryService`
- `unlockRequestService`

## Lifecycle esperado

Estados conceptuales:

| Estado conceptual | Señales existentes |
| --- | --- |
| Draft / Created | Assessment creado, sin intake/evidence/report |
| In progress | Intake o assumptions parciales, preliminary result |
| Basics complete | Intake + assumptions mínimas detectables |
| Evidence uploaded | `EvidenceFile` activo |
| Parsed / Inventory ready | Evidence con `processingStatus = parsed` e inventario parseado |
| Report preview ready | `Report` generado o preview data disponible |
| Full report unlocked | `AssessmentEntitlement.full_report_unlocked` disponible/comprado/granted |
| Completed | Estado conceptual; no hay cierre formal de producto todavía |
| Archived / Soft-deleted | `Assessment.status = archived` y `archivedAt` no nulo |

No se agregó enum ni campo nuevo.

Implementable sin schema:

- Badges derivados en lista.
- Copy de persistencia.
- CTA de continuar.
- Archive vía `archivedAt`.

Requiere backlog/schema o decisión futura:

- Completed formal editable.
- Restore archived.
- Filtro/lista de archived.
- Hard-delete policy.

## Multiple assessments list

Estado auditado:

- `listAssessmentsForCurrentWorkspace` usa `ensureDefaultWorkspace`.
- Filtra por `workspaceId` y `archivedAt: null`.
- Ordena por `updatedAt desc`, luego `createdAt desc`.
- La UI muestra múltiples cards.
- Cada card muestra nombre, client label, plan, RVTools status y updated date.
- Empty state existe.
- CTA para crear assessment existe.

Hardening aplicado:

- Copy de hero actualizado para explicar que los assessments se guardan en el workspace y se pueden retomar luego.
- Empty state actualizado para explicar progreso persistente.
- CTA de card cambiado de `Open assessment` a `Continue assessment`.
- Badge lifecycle derivado agregado usando señales existentes:
  - `Draft`;
  - `In progress`;
  - `Basics complete`;
  - `Evidence uploaded`;
  - `Inventory ready`;
  - `Report ready`;
  - `Archived`.
- Se mantiene `DB status` visible para no ocultar el estado real persistido.

Resultado: OK con hardening mínimo.

Limitación:

- No se ejecutó browser QA autenticado local con creación real de tres assessments por falta de sesión/cookies QA en el entorno Codex.
- Validación realizada por auditoría de código + build/typecheck/lint.

## Resume incomplete work

Soporte existente:

- Detail page carga por `findAssessmentForUser`.
- Forms server-side guardados:
  - assessment basics;
  - infrastructure input;
  - cost/risk assumptions;
  - storage readiness.
- Cada save redirige al mismo assessment con `saved=1`.
- `updatedAt` del assessment/intake/assumptions permite ordenar y retomar.
- Upload gate reacciona a prerequisitos vía `assessmentUploadPrerequisites`.

Resultado: soportado por diseño actual.

Limitación:

- No se ejecutó prueba manual local A/B/C por falta de sesión local en Codex.

## Modify in-progress work

Soporte existente:

- `updateAssessmentBasicsAction` actualiza título/client label.
- `saveInfrastructureInputAction` upsertea intake.
- `saveCostRiskAssumptionsAction` upsertea assumptions y recalcula preliminary result.
- Todas las acciones requieren sesión.
- Todas pasan por ownership.

Resultado: soportado.

Riesgo:

- No hay bloqueo de edición por estado `completed`; como `completed` formal no existe como flujo de producto, esto es aceptable para MVP.

## Evidence isolation

Soporte existente:

- `EvidenceFile` incluye `assessmentId`, `workspaceId`, `uploadedByUserId`.
- Upload action:
  - requiere sesión;
  - ejecuta `ensureAssessmentOwnership`;
  - ejecuta `assertCanUploadEvidence`;
  - escribe archivo;
  - crea record por assessment.
- Si falla crear DB record, borra el archivo físico recién subido.
- Download evidence:
  - requiere sesión;
  - ejecuta `ensureAssessmentOwnership`;
  - busca file por `assessmentId` + `fileId`;
  - devuelve 404 si está deleted.
- Parser crea inventario por `assessmentId` y `evidenceFileId`.

Resultado: aislamiento por assessment OK por código.

Nota:

- `deleteEvidenceAction` marca `deletedAt`/`processingStatus=deleted` y además intenta borrar el archivo físico. Esto es más agresivo que una retención física completa; aceptable si está documentado, pero conviene definir política formal de retención.

## Report history isolation

Soporte existente:

- `Report` incluye `assessmentId`, `workspaceId`, `generatedByUserId`, `deletedAt`.
- Report page carga assessment por `findAssessmentForUser`.
- `generatePdfReportForAssessment` ejecuta `ensureAssessmentOwnership`.
- `getReportForDownload` ejecuta `ensureAssessmentOwnership` y busca `reportId` por `assessmentId`.
- Download sin sesión redirige a public sign-in URL.
- Report soft-delete existe en servicio con `deletedAt` y `status=deleted`.

Resultado: report history aislado por assessment OK por código.

Limitación:

- No se ejecutó generación adicional de report local en browser QA.

## Archive/delete/completed

Estado actual:

| Acción | Estado |
| --- | --- |
| Archive assessment | Existe |
| Delete assessment hard | No existe en UI auditada |
| Restore archived | No identificado |
| Completed formal | No existe como flujo editable |
| Soft-delete evidence | Existe |
| Soft-delete report | Existe |

Archive:

- `archiveAssessmentAction` requiere sesión.
- `archiveAssessment` ejecuta ownership.
- Actualiza `status = archived` y `archivedAt = now`.
- Lista principal excluye `archivedAt != null`.
- No borra storage físico ni report history.

Backlog:

- Vista/filtro de archived.
- Restore archived.
- Definición formal de completed.
- Política de hard delete/retention.

## Security/ownership

Controles auditados:

- Rutas privadas sin sesión redirigen a `/sign-in`.
- `findAssessmentForUser` exige assessment no archivado y membresía de workspace.
- Detail/report/evidence/report-download usan ownership.
- Direct report cross-owner devuelve `404` por `notFound()`.
- Admin UX gap documentado: admin queue puede listar requests cross-owner, pero `Open report` apunta a ruta owner-protected.

Resultado: ownership protegido por diseño.

## UX hardening

Cambios aplicados:

| Archivo | Cambio |
| --- | --- |
| `src/app/dashboard/page.tsx` | Copy del card Assessments aclara múltiples assessments y continuidad |
| `src/app/dashboard/assessments/page.tsx` | Hero y empty state explican workspace persistente |
| `src/app/dashboard/assessments/page.tsx` | CTA de card cambia a `Continue assessment` |
| `src/app/dashboard/assessments/page.tsx` | Badge lifecycle derivado desde señales existentes |
| `src/server/assessments/assessmentService.ts` | List include agrega `costRiskAssumptions`, `assessmentScore`, `entitlements`, `reports` para lifecycle badges |

Riesgo:

- Bajo. Sólo lectura adicional en list query y cambios de copy/badges.
- No cambia escritura, schema, storage, parser ni PDF.

## Bugs/fixes

No se detectó bug crítico de lifecycle.

Fix/hardening mínimo aplicado:

- Mejor comunicación UX de workspace persistente.
- Estado lifecycle derivado más útil que `status=draft`.

## Riesgos pendientes

- Browser QA autenticado local A/B/C no ejecutado desde Codex por falta de sesión/cookies QA.
- `completed` formal no existe.
- Restore archived no existe.
- Filtro/lista archived no existe.
- QA cleanup/retention productiva pendiente.
- Password recovery pendiente.
- Hostinger logs pendientes.
- Admin UX gap cross-owner pendiente.

## Próximo paso recomendado

1. `HITO 13.1 — Authenticated Multi-Assessment Browser QA` con sesión real.
2. `HITO WORKSPACE-ARCHIVE-1 — Archived Assessments View + Restore`.
3. `HITO AUTH-1 — Password Recovery`.
4. `HITO LAUNCH-1 — Controlled Production Launch Review`.

## Decisión

- Multi-assessment lifecycle listo para controlled launch: SÍ, con hardening mínimo y pendientes documentados.
- Ready for controlled production launch review: SÍ.
- Ready for public launch: NO.
- Production launched: NO.

## HITO LAUNCH-1 follow-up

Fecha: 2026-05-27.

Resultado:

- El lifecycle multi-assessment fue aceptado para controlled production launch.
- Browser QA autenticado multi-assessment completo queda pendiente para public launch.
- El hardening de HITO 13 se mantiene como suficiente para uso controlado/piloto.

Decisión:

- Production launched: SÍ, controlled launch.
- Ready for public launch: NO.
