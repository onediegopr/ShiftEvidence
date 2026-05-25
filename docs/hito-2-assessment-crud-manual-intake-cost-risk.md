# Hito 2 - Assessment CRUD + Manual Intake + Cost/Risk Assumptions

Fecha: 2026-05-25

## Objetivo
Convertir el assessment shell en una herramienta funcional basica:
- listar assessments
- crear drafts
- editar datos base
- cargar infraestructura de forma manual
- cargar supuestos de Cost / Risk
- generar un preview preliminar
- mantener Storage Destination Readiness como opcion

## Alcance ejecutado
- CRUD basico de assessments.
- Manual infrastructure intake en Neon.
- Cost / Risk assumptions editables.
- Preliminary Cost / Risk preview persistido.
- Storage optional UX.
- Completion status derivado.
- Audit events para acciones clave.

## Ruta y UI
- `/dashboard/assessments`
- `/dashboard/assessments/new`
- `/dashboard/assessments/[id]`

No se implemento una ruta separada `/edit`; la edicion se resolvio inline dentro del detail page con server actions.

## Servicios server
- `listAssessmentsForCurrentWorkspace`
- `findAssessmentForUser`
- `ensureAssessmentOwnership`
- `createAssessment`
- `updateAssessmentBasics`
- `setStorageReadinessEnabled`
- `archiveAssessment`
- `getInfrastructureInput`
- `upsertInfrastructureInput`
- `validateInfrastructureInputCompleteness`
- `getCostRiskAssumptions`
- `upsertCostRiskAssumptions`
- `calculatePreliminaryCostRisk`
- `upsertPreliminaryResult`
- `getAssessmentCompletionStatus`
- `getMissingEvidenceSummary`
- `getNextStepsSummary`

## Validaciones
- Numeros no negativos.
- Years entre 1 y 10.
- `usedStorageTb <= storageFootprintTb` cuando ambos existen.
- `criticalWorkloadCount <= vmCount` cuando ambos existen.
- `largeVmCount <= vmCount` cuando ambos existen.
- `poweredOffVmCount <= vmCount` cuando ambos existen.

## Riesgos
- El preview es preliminar y depende de supuestos manuales.
- RVTools upload sigue pendiente.
- Parser de archivos sigue pendiente.
- El scoring no es definitivo.

## Validacion real
- `npm run lint`: OK
- `npm run typecheck`: OK
- `npm run build`: OK
- `npx prisma validate`: OK
- `npx prisma generate`: OK
- `npx prisma migrate dev --name hito_2_assessment_intake_cost_risk`: OK
- Ruta pública `/`: OK
- Ruta pública `/shiftreadiness`: OK
- `/dashboard` con session: OK
- `/dashboard/assessments`: OK
- `/dashboard/assessments/new`: OK
- `/dashboard/assessments/[id]`: OK
- Smoke test de assessments: OK

## Rollback
- Volver a la version anterior de `src/app/dashboard/assessments/*`.
- Revertir la migracion Prisma `20260525125533_hito_2_assessment_intake_cost_risk` si fuera necesario en un entorno controlado.

## Proximo hito
- HITO 3 - RVTools Upload + Secure Local File Storage
