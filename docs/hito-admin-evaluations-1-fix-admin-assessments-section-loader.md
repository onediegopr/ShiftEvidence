# HITO ADMIN-EVALUATIONS-1 - Fix Admin Assessments Section Loader

## Objetivo

Corregir o aislar la falla `admin_assessments_failed` en `/dashboard/admin`.

## Contexto

`ADMIN-FINAL-1B` dejo admin en estado parcial controlado. La consola carga, pero la seccion Evaluaciones quedaba degradada con fallback local.

## Causa

La falla estaba en el loader `loadRecentAssessments` dentro de `src/server/admin/adminConsoleService.ts`.

La query de `AssessmentAdditionalEvidence` seleccionaba campos inexistentes en el modelo actual `EvidenceFile`:

- `filename`
- `fileSize`

El schema Prisma actual define:

- `originalFilename`
- `sizeBytes`

Esa diferencia podia producir `PrismaClientValidationError` y activar el fallback local `admin_assessments_failed`.

## Cambios Realizados

Archivos modificados:

- `src/server/admin/adminConsoleService.ts`
- `tests/unit/adminAssessmentsSectionFallback.test.ts`

Cambios:

- La query admin de additional evidence ahora selecciona `originalFilename` y `sizeBytes`.
- El mapeo mantiene el shape esperado por la UI: `filename` y `fileSize`.
- Se agregaron tests para evitar volver a usar `filename: true` o `fileSize: true` en el select Prisma.
- Se agrego test para verificar que el loader no usa la relacion anidada `workspace.ownerUser`.
- Se agrego test de fallback local para `admin_assessments_failed`.
- Se mantiene el fallback por seccion como defensa, sin fallback global.

## Comportamiento Final

- Admin final esperado: completo para la seccion Evaluaciones si el runtime usa el Prisma Client actualizado.
- Fallback global: no.
- Fallback local: permanece disponible como defensa.
- Seccion Evaluaciones: deberia cargar con lista de evaluaciones y evidencia adicional sin `PrismaClientValidationError`.

## Validaciones

Comandos ejecutados:

- `npx prisma validate`
- `npx prisma generate`
- `npm run test:run`
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run hostinger:diagnose`

Resultado: OK. Build mantiene el warning Turbopack/NFT conocido sobre `next.config.mjs` y `localStorageService.ts`.

## Seguridad

- No DB mutation.
- No migrations.
- No `db push`.
- No `migrate reset`.
- No env vars.
- No secrets.
- No pricing real.
- No Storage/Ceph engine.
- No full public launch declarado.

## Riesgos Pendientes

- Smoke autenticado real de `/dashboard/admin` post-deploy.
- Validar que `admin_assessments_failed` desaparece en produccion despues de que el runtime tome este commit.
- PDF visual real.
- Real Ceph evidence tuning.
- Collector futuro.
- Storage cost/TCO futuro.
- Decision de full public launch pendiente.

## Proximo Paso

- Ejecutar smoke autenticado de `/dashboard/admin`.
- Si Evaluaciones carga sin fallback, aceptar admin como recuperado para beta/demo controlada.
- Mantener full public launch como decision posterior.
