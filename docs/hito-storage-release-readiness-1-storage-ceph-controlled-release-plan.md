# HITO STORAGE-RELEASE-READINESS-1 - Storage/Ceph Controlled Release Plan

## Objetivo

Preparar el plan controlado para aplicar en el ambiente objetivo las migraciones y cambios del modulo Storage/Ceph, sin ejecutar todavia migraciones productivas, deploy, mutaciones de DB ni cambios en Hostinger.

Este documento consolida:

- estado Git y validaciones no destructivas;
- inventario de migraciones Storage/Ceph;
- riesgo Prisma/DB;
- dependencias funcionales de la app;
- orden recomendado para `STORAGE-RELEASE-APPLY-1`;
- smoke plan especifico de Storage/Ceph;
- rollback plan;
- criterios Go / No-Go.

## Estado Git Auditado

- Fecha de auditoria: 2026-05-30.
- Branch: `main`.
- HEAD auditado: `33569db docs: update master documentation with storage and Ceph readiness`.
- `origin/main`: sincronizado con `main` al momento de la auditoria.
- Working tree inicial: limpio.
- Divergencia: no detectada.
- Ahead/behind: no detectado.
- Stash preservado: `stash@{0}: On main: park beta invite docs before functional readiness`.
- Push realizado en este hito: no.
- Deploy realizado en este hito: no.
- Migraciones productivas aplicadas en este hito: no.
- Mutaciones DB realizadas en este hito: no.
- Mutaciones Hostinger realizadas en este hito: no.

## Validaciones No Destructivas

Comandos ejecutados:

```bash
git status -sb
git log --oneline -n 40
git log --oneline origin/main..HEAD
git log --oneline HEAD..origin/main
git stash list
git fetch origin
git log --oneline --left-right --graph origin/main...HEAD
npm run test:run
npm run lint
npm run typecheck
npx prisma validate
npx prisma generate
npm run build
npm run hostinger:diagnose
```

Resultados:

- `npm run test:run`: OK, 35 archivos / 150 tests.
- `npm run lint`: OK.
- `npm run typecheck`: OK.
- `npx prisma validate`: OK con `DATABASE_URL` dummy/local seguro para validacion.
- `npx prisma generate`: OK.
- `npm run hostinger:diagnose`: OK, diagnostico local no destructivo. No aplico deploy, no migro DB y no muto Hostinger.
- `npm run build`: OK despues de resolver lock local de `.next`.

Build lock observado:

- Primer `npm run build`: fallo con `EPERM unlink` dentro de `.next`, consistente con lock local Windows/OneDrive.
- Se revisaron procesos `node`/`next`; no se detecto un proceso Next local claro para cerrar.
- Se elimino solo el artefacto local `.next` despues de verificar que el path resuelto estaba dentro del workspace.
- Segundo `npm run build`: OK.
- Permanece warning conocido de Turbopack/NFT en `next.config.mjs`, no bloqueante para este plan.

## Inventario de Migraciones Storage/Ceph

Migraciones Storage identificadas:

| Migracion | Commit | Modulo | Que cambia | Riesgo | Backfill | Orden |
| --- | --- | --- | --- | --- | --- | --- |
| `20260530120000_storage_1_destination_readiness_foundation` | `0950f9b` | STORAGE-1 | Crea enums, tablas dedicadas de Storage Destination Readiness, Storage Context, Storage Evidence y Storage Analysis. | Bajo/medio | No | 1 |
| `20260530133000_storage_2_analysis_fallback_statuses` | `f3fb4dd` | STORAGE-2 | Agrega valores fallback al enum `AssessmentStorageAnalysisStatus`. | Bajo | No | 2 |

No se detectaron migraciones nuevas en:

- `56bab35 feat: add Ceph suitability and operations readiness engine`;
- `ddf64d4 feat: add storage and Ceph report visibility`;
- `33569db docs: update master documentation with storage and Ceph readiness`.

### `20260530120000_storage_1_destination_readiness_foundation`

Crea enums:

- `AssessmentStorageDestinationReadinessStatus`;
- `AssessmentStorageDestinationMode`;
- `AssessmentStorageCurrentType`;
- `AssessmentStorageTargetPreference`;
- `AssessmentStorageContextStatus`;
- `AssessmentStorageEvidenceClassification`;
- `AssessmentStorageEvidenceAnalysisStatus`;
- `AssessmentStorageAnalysisStatus`.

Crea tablas:

- `AssessmentStorageDestinationReadiness`;
- `AssessmentStorageContext`;
- `AssessmentStorageEvidence`;
- `AssessmentStorageAnalysis`.

Relaciones:

- `AssessmentStorageDestinationReadiness.assessmentId` -> `Assessment.id`, `ON DELETE CASCADE`;
- `AssessmentStorageContext.assessmentId` -> `Assessment.id`, `ON DELETE CASCADE`;
- `AssessmentStorageEvidence.assessmentId` -> `Assessment.id`, `ON DELETE CASCADE`;
- `AssessmentStorageEvidence.evidenceFileId` -> `EvidenceFile.id`, `ON DELETE CASCADE`;
- `AssessmentStorageAnalysis.assessmentId` -> `Assessment.id`, `ON DELETE CASCADE`.

Indices y constraints:

- unique `assessmentId` en `AssessmentStorageDestinationReadiness`;
- unique `assessmentId` en `AssessmentStorageContext`;
- unique `assessmentId` en `AssessmentStorageAnalysis`;
- unique `(assessmentId, evidenceFileId)` en `AssessmentStorageEvidence`;
- indices por status, mode, storage type, target preference, classification, analysis status y fechas relevantes.

Riesgo:

- Migracion aditiva.
- No borra ni renombra tablas/columnas.
- No agrega columnas obligatorias a tablas existentes pobladas.
- Las relaciones son en tablas nuevas.
- Los unique constraints viven sobre tablas nuevas, por lo que no deberian fallar por datos historicos.
- No requiere backfill.
- El cascade con `Assessment` y `EvidenceFile` es coherente: metadata semantica Storage se elimina si se elimina el assessment o evidence file asociado.

### `20260530133000_storage_2_analysis_fallback_statuses`

Agrega valores al enum `AssessmentStorageAnalysisStatus`:

- `ai_disabled`;
- `budget_blocked`;
- `plan_restricted`.

Riesgo:

- Expansion aditiva de enum.
- Usa `ADD VALUE IF NOT EXISTS`.
- Requiere que la migracion STORAGE-1 haya creado el enum previamente.
- No requiere backfill.
- No toca tablas existentes.
- Riesgo bajo.

## Riesgo Prisma / DB

Modelos auditados:

- `AssessmentStorageDestinationReadiness`;
- `AssessmentStorageContext`;
- `AssessmentStorageEvidence`;
- `AssessmentStorageAnalysis`;
- relacion con `Assessment`;
- relacion con `EvidenceFile`.

Hallazgos:

- Las migraciones Storage son aditivas.
- No hay `DROP TABLE`, `DROP COLUMN`, renombres destructivos ni cambios obligatorios sobre tablas existentes.
- No se agregan columnas requeridas a tablas productivas existentes.
- Las relaciones nuevas desde `Assessment` son opcionales en Prisma y se materializan mediante tablas nuevas.
- `AssessmentStorageEvidence` depende de `EvidenceFile`, pero solo para metadata semantica de archivos ya existentes.
- `AssessmentStorageAnalysisStatus` se expande de forma aditiva para fallbacks de AI/budget/plan.
- El orden de migracion importa: STORAGE-2 depende del enum creado por STORAGE-1.

Recomendacion DB:

- Aplicar migraciones con `npx prisma migrate deploy`, no `db push`.
- Confirmar `npx prisma migrate status` antes y despues.
- No desplegar app nueva contra DB sin estas migraciones.
- Tomar backup/PITR antes de aplicar.
- Considerar la DB forward-compatible con rollback de app porque las migraciones agregan tablas/enums y no destruyen datos previos.

## Dependencias Funcionales

Codigo que depende de las tablas Storage:

- Assessment detail include en `src/server/assessments/assessmentService.ts`.
- Storage tab y server actions en `src/app/dashboard/assessments/[id]/storage/actions.ts`.
- UI `StorageDestinationReadinessPanel`.
- Completion Center en `assessmentCompletionService.ts`.
- Storage Context Intelligence.
- Ceph Suitability & Operations Readiness.
- Report preview payload `storageDestinationReadiness`.
- PDF section `Storage Destination Readiness`.

Impacto si se despliega app nueva sin migracion:

- Rutas autenticadas que incluyen relaciones `storageDestinationReadiness`, `storageContext`, `storageAnalysis` o `storageEvidence` pueden fallar por tablas inexistentes.
- Assessment detail puede fallar aunque Storage sea opcional, porque el include de Prisma referencia relaciones nuevas.
- Completion Center puede fallar al leer metadata Storage.
- Report preview/PDF puede fallar si intenta normalizar relaciones Storage ausentes.

Impacto si se aplica migracion y luego se hace rollback de app:

- Riesgo bajo.
- La app anterior deberia ignorar tablas/enums nuevos.
- No se modifican datos historicos ni tablas core.
- DB restore solo deberia considerarse ante un incidente severo no esperado.

Conclusiones:

- La migracion debe ejecutarse antes o dentro del mismo release que despliega el codigo Storage/Ceph.
- No conviene reiniciar/deployar app nueva contra DB vieja.
- El rollback preferido ante falla de app es rollback de app, no rollback DB, dado que las migraciones son aditivas.

## Hostinger / Env Vars / Storage Requirements

Este hito no imprimio secretos ni cambio variables.

Variables requeridas ya conocidas para release general:

| Variable | Obligatoria | Impacto si falta |
| --- | --- | --- |
| `DATABASE_URL` | Si | App y migraciones no pueden operar. |
| `BETTER_AUTH_SECRET` | Si | Auth/session puede fallar o quedar inseguro. |
| `BETTER_AUTH_URL` | Si | Redirects/callbacks auth pueden apuntar mal. |
| `NEXT_PUBLIC_APP_URL` | Si | Links y URLs publicas pueden ser incorrectas. |
| `HOSTINGER_STORAGE_ROOT` | Si para uploads/evidence | Upload/evidence puede fallar o usar path no persistente. |
| `MAX_UPLOAD_SIZE_MB` | Recomendado/operativo | Limites de upload ambiguos. |
| `ADMIN_EMAILS` | Si para admin | Admin dashboard/pricing puede quedar inaccesible. |

Variables AI relevantes para STORAGE-2:

| Variable | Uso | Impacto si falta |
| --- | --- | --- |
| `AI_ADVISORY_ENABLED` | Habilitar/deshabilitar AI advisory. | Storage Context Intelligence puede degradar a fallback. |
| `AI_ADVISORY_PROVIDER` | Provider AI. | AI puede no ejecutar analisis real. |
| `AI_ADVISORY_MODEL` | Modelo AI. | AI puede usar default o fallar segun config. |
| `GEMINI_API_KEY` / `OPENAI_API_KEY` | Credenciales provider. | AI real no disponible. |
| `AI_ADVISORY_TIMEOUT_MS` | Timeout. | Riesgo de timeouts no controlados. |
| `AI_ADVISORY_MAX_INPUT_CHARS` | Limite input. | Riesgo de payload excesivo si falta. |
| `AI_ADVISORY_MAX_OUTPUT_CHARS` | Limite output. | Riesgo de respuesta excesiva si falta. |

Storage root:

- Debe ser absoluto.
- Debe estar fuera de `.next`, `node_modules`, `public` y `public_html`.
- Debe ser persistente.
- Debe ser escribible por el proceso Node.
- No debe borrarse durante deploy/restart.
- Debe incluirse en estrategia de backup si evidence files son necesarios para soporte/auditoria.

## Orden Recomendado para `STORAGE-RELEASE-APPLY-1`

1. Confirmar ventana de release y responsable operativo.
2. Confirmar commit exacto a liberar: `33569db` o superior aprobado.
3. Confirmar backup/snapshot/PITR DB reciente y procedimiento de restore.
4. Confirmar acceso a logs/restart Hostinger.
5. Confirmar env vars requeridas sin imprimir valores.
6. Confirmar `HOSTINGER_STORAGE_ROOT` absoluto, persistente y escribible.
7. Ejecutar `git status -sb` y confirmar branch/repo limpio.
8. Ejecutar validaciones locales o de release: tests, lint, typecheck, Prisma validate/generate, build.
9. Contra DB objetivo, ejecutar solo lectura: `npx prisma migrate status`.
10. Si hay drift o failed migrations, detener release.
11. Si build OK y migrate status sano, ejecutar `npx prisma migrate deploy`.
12. Repetir `npx prisma migrate status` y confirmar `Database schema is up to date!`.
13. Deploy/restart app segun mecanismo Hostinger aprobado.
14. Smoke publico.
15. Smoke autenticado.
16. Smoke Storage tab.
17. Smoke Storage Context Intelligence con fallback si AI esta disabled/budget/plan restricted.
18. Smoke Ceph Suitability en assessment QA.
19. Smoke report preview.
20. Smoke PDF.
21. Revisar logs 10-20 minutos.
22. Documentar resultado y decidir cierre/rollback/hotfix.

## Smoke Plan Storage Post-Release

### Publico

- `/`: 200.
- `/shiftreadiness`: 200.
- `/sign-in`: 200.
- `/sign-up`: 200.
- `/sample-report`: 200.
- Assets `/_next/*`: cargan correctamente.
- Landing muestra `Storage & Ceph Readiness`.
- Landing muestra `Licensing & Cost Exposure`.
- Disclaimers visibles: Ceph no es default, no vendor quote, evidence-based.

### Autenticado

- Login real/QA funciona sin loop.
- `/dashboard`: carga sin 500.
- `/dashboard/assessments`: carga sin 500.
- Abrir assessment existente o crear assessment QA.
- Assessment detail carga.
- Completion Center carga y no bloquea report por Storage opcional.
- Tab `Storage` visible.
- Source Storage fields visibles.
- Target Preference fields visibles.
- HA/shared storage/PBS/Proxmox target visibles.
- Growth/downtime visibles.
- Storage free context permite draft/submit/skip en assessment QA.
- Additional Storage Evidence permite clasificacion/inclusion/exclusion si hay evidence file QA.

### Storage Context Intelligence

- Si AI enabled: ejecutar analisis en assessment QA.
- Si AI disabled: verificar fallback `ai_disabled`.
- Si budget blocked: verificar fallback `budget_blocked`.
- Si plan restricted: verificar fallback `plan_restricted`.
- Confirmar que no se imprime raw storage text.
- Confirmar que missing evidence se muestra como hallazgo util.

### Ceph

- En assessment QA con preferencia Ceph, ejecutar `Evaluate Ceph suitability`.
- Verificar status esperado:
  - `ceph_applies`;
  - `ceph_does_not_apply`;
  - `ceph_conditional`;
  - `ceph_overkill`;
  - `ceph_underdesigned`;
  - `not_enough_evidence`.
- Verificar scores:
  - Ceph Suitability;
  - Operations Readiness;
  - Evidence Confidence;
  - Capacity Fit;
  - Network Readiness;
  - Failure Domain Readiness;
  - Backup Readiness;
  - Operational Skills.
- Confirmar findings, remediations y missing evidence.
- Confirmar disclaimer: Ceph no se recomienda por default.

### Report Preview / PDF

- Report preview incluye `storageDestinationReadiness`.
- PDF incluye `Storage Destination Readiness`.
- PDF incluye `Ceph Suitability & Operations Readiness` si aplica.
- No aparece raw storage free text.
- No aparecen contenidos de archivos.
- No hay promesa de performance, capacity, zero downtime ni instalacion.
- Si Storage no fue completado, fallback es claro y no rompe el reporte.
- Si Ceph no fue evaluado, fallback es claro y no inventa recomendacion.

### Admin

- Admin dashboard carga sin 500.
- Pricing admin carga sin 500.
- No se tocan pricing snapshots reales.
- No se aprueba/rechaza pricing real durante este smoke.
- No se exponen secrets.

## Rollback Plan

### Si falla antes de migrar

- No ejecutar `migrate deploy`.
- No desplegar app nueva.
- Mantener produccion en estado anterior.
- Documentar error y corregir fuera de ventana productiva.

### Si falla `migrate status`

- Si hay drift o failed migrations: detener.
- No ejecutar `migrate deploy`.
- Revisar historial `_prisma_migrations` con acceso controlado.
- Definir fix/restore plan antes de continuar.

### Si falla `migrate deploy`

- Detener release.
- No reiniciar app si no corresponde.
- Revisar error Prisma/Postgres.
- Clasificar:
  - error transitorio: evaluar rerun solo con causa entendida;
  - error de schema/drift: detener y planificar hotfix;
  - error parcial: revisar `_prisma_migrations` antes de cualquier accion.
- Considerar restore DB solo si hay dano severo.

### Si migracion aplica pero app falla

- Rollback de app al commit anterior conocido.
- Mantener DB forward, porque migraciones son aditivas.
- Revisar logs y preparar hotfix.
- DB restore no es primera opcion salvo dano severo.

### Si Storage tab falla

- Core app puede seguir operando si dashboard/assessment/report base estan sanos.
- Clasificar como P1/P2 segun impacto.
- Evitar usar modulo Storage hasta hotfix.
- Preparar hotfix o rollback app si afecta assessment detail global.

### Si report/PDF falla por Storage

- Clasificar como P1 si bloquea report/PDF.
- Hotfix preferido: fallback/disable seguro de seccion Storage.
- Rollback app si report/PDF core queda roto.
- No borrar evidence/storage.

### Si AI Storage falla

- Debe degradar a `ai_disabled`, `budget_blocked`, `plan_restricted` o `failed`.
- No debe bloquear report generation.
- No requiere DB restore.

### Si storage root falla

- No borrar carpetas ni uploads.
- Corregir path/permisos solo con aprobacion operativa.
- Validar containment y persistencia.
- Reintentar upload/evidence smoke con archivo QA.

## Go / No-Go

### GO tecnico preliminar

Se considera GO tecnico para preparar `STORAGE-RELEASE-APPLY-1` porque:

- las migraciones Storage son aditivas;
- no hay drops/renames;
- no hay columnas obligatorias nuevas sobre tablas existentes;
- no requieren backfill;
- el orden de migracion es claro;
- las validaciones locales pasaron;
- el build paso;
- el rollback de app es compatible con DB forward.

### NO-GO operativo hasta confirmar en el hito APPLY

No se debe aplicar todavia hasta confirmar justo antes del release:

- backup/PITR DB reciente;
- `npx prisma migrate status` contra DB objetivo sin drift/failed migrations;
- env vars reales en Hostinger;
- storage root real absoluto, persistente y escribible;
- acceso a logs/restart;
- usuario QA/admin para smoke autenticado;
- ventana operativa y rollback owner.

### NO-GO si aparece cualquiera de estos puntos

- drift o failed migrations;
- falta backup/PITR;
- falta `DATABASE_URL` o auth vars requeridas;
- storage root incierto o no escribible;
- build falla;
- no hay acceso a logs/restart;
- no hay smoke autenticado posible;
- evidencia de que app nueva correria contra DB sin migrar.

## Que NO se ejecuto

- No se aplico `npx prisma migrate deploy`.
- No se ejecuto `prisma db push`.
- No se ejecuto `prisma migrate reset`.
- No se mutuo DB productiva.
- No se hizo deploy.
- No se reinicio Hostinger.
- No se cambiaron env vars.
- No se tocaron secrets.
- No se declaro full public launch.

## Riesgos Pendientes

- Migraciones Storage pendientes de aplicar en ambiente objetivo.
- Estado real de `_prisma_migrations` objetivo debe verificarse antes de aplicar.
- Backup/PITR debe confirmarse en ventana de release.
- Storage root real debe validarse en Hostinger.
- Smoke autenticado Storage/Ceph pendiente en ambiente objetivo.
- PDF visual real con datos storage-heavy puede requerir polish.
- Tuning con evidencia Ceph real pendiente.
- Collector Proxmox/Ceph/PBS futuro.
- Storage cost/TCO futuro.

## Veredicto Final

`STORAGE-RELEASE-READINESS-1` queda como GO tecnico preliminar y NO-GO operativo hasta autorizacion explicita de `STORAGE-RELEASE-APPLY-1` con backup, env vars, storage root, migrate status, logs/restart y smoke autenticado confirmados.

Produccion no cambio durante este hito.
