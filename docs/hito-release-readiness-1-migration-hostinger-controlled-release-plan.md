# Hito RELEASE-READINESS-1 - Migration & Hostinger Controlled Release Plan

## Objetivo

Preparar un plan controlado de release, migraciones y Hostinger para ShiftReadiness sin ejecutar deploy, sin aplicar migraciones productivas y sin mutar base de datos remota.

Este documento consolida:

- estado Git y validaciones no destructivas;
- inventario de migraciones recientes;
- riesgo Prisma/DB;
- variables de entorno requeridas;
- storage root esperado;
- orden recomendado de release futuro;
- plan de smoke;
- rollback;
- criterios Go / No-Go.

## Estado Git Auditado

- Branch: `main`.
- HEAD auditado: `230427f fix: polish executive demo and report quality`.
- `origin/main`: sincronizado con `main` al momento de la auditoria.
- Working tree inicial: limpio.
- Divergencia: no detectada.
- Stash preservado: `stash@{0}: On main: park beta invite docs before functional readiness`.
- Push realizado en este hito: no.
- Deploy realizado en este hito: no.
- Migraciones productivas aplicadas en este hito: no.

## Validaciones Ejecutadas

Comandos no destructivos ejecutados:

```bash
git status -sb
git log --oneline -n 30
git fetch origin
git log --oneline --left-right --graph origin/main...HEAD
git stash list
npm run test:run
npm run lint
npm run typecheck
npx prisma validate
npx prisma generate
npm run hostinger:diagnose
npm run build
```

Resultados:

- `npm run test:run`: OK, 22 archivos / 107 tests.
- `npm run lint`: OK.
- `npm run typecheck`: OK.
- `npx prisma validate`: OK con `DATABASE_URL` dummy local seguro para validacion.
- `npx prisma generate`: OK.
- `npm run hostinger:diagnose`: OK, diagnostico no destructivo.
- `npm run build`: OK despues de limpiar artefacto local `.next`.

Build lock:

- El primer `npm run build` fallo por `EPERM unlink` dentro de `.next`, consistente con lock local Windows/OneDrive.
- No se detecto proceso local Next escuchando en puerto 3000.
- No se detuvo ningun proceso Next.
- Se elimino solo el artefacto local `.next` despues de verificar que el path resuelto estaba dentro del workspace.
- El build posterior fue exitoso.
- Permanece un warning conocido de Turbopack/NFT relacionado con tracing de storage, no bloqueante.

## Inventario de Migraciones Recientes

El ultimo punto seguro aplicado en produccion no fue consultado contra `_prisma_migrations`. Para esta auditoria se infiere como pendientes las migraciones posteriores al bloque anterior a COST/CONTEXT, segun historial del repo y contexto operativo.

Antes de ejecutar un release real, se debe confirmar el estado productivo con una lectura controlada de `_prisma_migrations` o `npx prisma migrate status` contra el ambiente objetivo.

| Migracion | Modulo | Que agrega | Riesgo | Backfill | Orden |
| --- | --- | --- | --- | --- | --- |
| `20260529210000_cost_1a_pricing_intelligence_foundation` | COST-1A | Enums y tablas de pricing snapshots, items, refresh runs y changelog. | Bajo | No | 1 |
| `20260529223000_cost_1b_assessment_licensing_analysis` | COST-1B | Enum de status/mode y tabla `AssessmentLicensingAnalysis`. | Bajo/medio | No | 2 |
| `20260529235500_context_1_client_context_foundation` | CONTEXT-1 | Enums y tablas `AssessmentClientContext`, `AssessmentClientContextAnalysis`, `AssessmentAdditionalEvidence`. | Bajo/medio | No | 3 |
| `20260529235900_context_2_ai_context_intelligence_engine` | CONTEXT-2 | Expansion aditiva del enum `AssessmentClientContextAnalysisStatus`. | Bajo | No | 4 |

### Detalle por migracion

#### COST-1A - Pricing Intelligence Admin Foundation

Crea:

- `LicensingPricingSnapshot`;
- `LicensingPricingSnapshotItem`;
- `LicensingPricingRefreshRun`;
- `LicensingPricingChangeLog`;
- enums de vendor, status, source type, metric y refresh status;
- indices por vendor/status, freshness, approval, item/product, refresh status y changelog.

Riesgo:

- Migracion aditiva.
- No modifica tablas existentes.
- No requiere backfill.
- `LicensingPricingSnapshotItem` usa cascade al borrar snapshot.
- `LicensingPricingChangeLog` preserva auditoria con `SET NULL` sobre snapshot borrado.

#### COST-1B - Assessment Licensing Analysis Engine

Crea:

- `AssessmentLicensingAnalysis`;
- enums `AssessmentLicensingAnalysisStatus` y `AssessmentLicensingAnalysisMode`;
- unique index sobre `assessmentId`;
- FK a `Assessment` con `ON DELETE CASCADE`.

Riesgo:

- Migracion aditiva.
- No requiere backfill porque la tabla nace vacia.
- El unique index sobre `assessmentId` es seguro en tabla nueva.
- Si se despliega app sin migracion, las pantallas/servicios nuevos pueden fallar por tabla inexistente.

#### CONTEXT-1 - Client Context Foundation

Crea:

- `AssessmentClientContext`;
- `AssessmentClientContextAnalysis`;
- `AssessmentAdditionalEvidence`;
- enums de status, source type, purpose, classification y analysis status;
- unique indexes sobre `assessmentId` para contexto y analisis;
- unique index `(assessmentId, evidenceFileId)` para evidencia adicional;
- FKs a `Assessment` y `EvidenceFile` con cascade.

Riesgo:

- Migracion aditiva.
- No requiere backfill.
- Cascade sobre `EvidenceFile` elimina metadata semantica de additional evidence cuando se elimina el archivo, comportamiento esperado.
- App nueva requiere estas tablas antes de operar Client Context.

#### CONTEXT-2 - AI Context Intelligence Engine

Altera enum:

- `AssessmentClientContextAnalysisStatus` agrega `ai_disabled`, `budget_blocked`, `plan_restricted`.

Riesgo:

- Expansion aditiva de enum.
- Requiere que CONTEXT-1 ya haya creado el enum.
- No requiere backfill.

## Riesgo Prisma / DB

Hallazgos:

- Las migraciones recientes son aditivas.
- No se detectaron `DROP TABLE`, `DROP COLUMN`, renombres destructivos ni cambios obligatorios sobre tablas pobladas.
- No se agregaron columnas requeridas a modelos existentes con datos previos.
- Las relaciones nuevas desde `Assessment` son opcionales o viven en tablas nuevas.
- Los unique constraints nuevos estan sobre tablas nuevas, por lo que no deberian fallar por datos historicos.
- Las migraciones tienen orden relevante: CONTEXT-2 depende del enum creado por CONTEXT-1.

Recomendacion:

- Ejecutar migraciones antes o dentro del mismo release que despliega el codigo que consulta esas tablas.
- No desplegar app nueva contra DB vieja.
- Hacer backup/snapshot antes de `npx prisma migrate deploy`.
- Confirmar `_prisma_migrations` en el ambiente objetivo antes de aplicar.

## Hostinger / Env Vars

No se imprimieron secretos. La auditoria reviso nombres de variables, scripts y archivos de ejemplo.

### Variables requeridas para runtime/release

| Variable | Estado local/repo | Estado target Hostinger | Impacto si falta |
| --- | --- | --- | --- |
| `DATABASE_URL` | Documentada en `.env.example`; presente localmente, no impresa. | Desconocido. | App y migraciones no pueden operar. |
| `BETTER_AUTH_SECRET` | Documentada; presente localmente, no impresa. | Desconocido. | Auth/session puede fallar o ser inseguro. |
| `BETTER_AUTH_URL` | Documentada. | Desconocido. | Callbacks/auth pueden apuntar mal. |
| `NEXT_PUBLIC_APP_URL` | Documentada. | Desconocido. | Links, redirects y URLs publicas pueden fallar. |
| `HOSTINGER_STORAGE_ROOT` | Documentada. | Desconocido. | Uploads/PDF pueden fallar o perder persistencia. |
| `MAX_UPLOAD_SIZE_MB` | Documentada con default esperado. | Desconocido. | Upload limits ambiguos. |
| `ADMIN_EMAILS` | Documentada. | Desconocido. | Admin falla cerrado o no hay admin operativo. |

### Variables opcionales/recomendadas

| Variable | Uso | Impacto si falta |
| --- | --- | --- |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | OAuth Google si se habilita. | Login Google no disponible. |
| `RESEND_API_KEY` / `EMAIL_FROM` | Email de recuperacion de cuenta. | Password recovery por email no disponible. |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Rate limiting si se usa Upstash. | Puede caer a comportamiento sin Redis si el codigo lo permite. |
| `AI_ADVISORY_ENABLED` | Flag de AI advisory/context. | AI puede quedar deshabilitada o usar default. |
| `AI_ADVISORY_PROVIDER` | Provider AI. | AI no sabe que provider usar. |
| `AI_ADVISORY_MODEL` | Modelo AI. | AI puede fallar o usar default. |
| `AI_ADVISORY_TIMEOUT_MS` | Timeout AI. | Riesgo de timeouts no controlados. |
| `AI_ADVISORY_MAX_INPUT_CHARS` | Limite input AI. | Riesgo de payload excesivo. |
| `AI_ADVISORY_MAX_OUTPUT_CHARS` | Limite output AI. | Riesgo de respuestas excesivas. |
| `GEMINI_API_KEY` / `OPENAI_API_KEY` | Credencial del provider elegido. | AI no ejecuta analisis real. |
| `HOSTINGER_API_TOKEN` | Automatizacion API Hostinger futura. | No afecta runtime de la app. |

Nota sobre `DIRECT_URL`:

- `schema.prisma` usa `DATABASE_URL`.
- No se detecto `directUrl` en el datasource actual.
- `DIRECT_URL` no es obligatoria en el schema actual, salvo que se adopte un flujo Neon/Prisma futuro que la requiera.

## Storage Root

Implementacion actual:

- `HOSTINGER_STORAGE_ROOT` se usa si existe y es absoluto.
- Si no existe o no es absoluto, cae a `storage` relativo al `process.cwd()`.
- El servicio valida path containment dentro del storage root.
- Los archivos se guardan bajo estructura por user/workspace/assessment/evidence type.
- Download/read/delete resuelven paths relativos dentro del storage root.

Recomendacion para Hostinger:

```text
/home/<hostinger-user>/shiftreadiness-storage
```

Reglas:

- Debe ser absoluto.
- Debe ser persistente entre deploys.
- Debe estar fuera de `.next`.
- Debe estar fuera de `node_modules`.
- Debe estar fuera de `public` / `public_html`.
- Debe ser escribible/leible por el proceso Node.
- Debe incluirse en estrategia de backup.

Validacion futura:

```bash
npm run storage:check
```

No se ejecuto `storage:check` contra Hostinger en este hito.

## Release Order Futuro Recomendado

1. Congelar commit de release.
2. Confirmar que `main` y `origin/main` estan sincronizados.
3. Confirmar acceso a Hostinger y logs runtime.
4. Confirmar Node.js 22 o superior en Hostinger.
5. Confirmar variables de entorno target sin imprimir valores.
6. Confirmar `HOSTINGER_STORAGE_ROOT` absoluto, privado, persistente y con permisos.
7. Crear backup/snapshot de DB antes de migrar.
8. Confirmar estado actual de migraciones:

```bash
npx prisma migrate status
```

9. Instalar dependencias en el entorno de release:

```bash
npm ci
```

10. Generar Prisma Client:

```bash
npx prisma generate
```

11. Ejecutar build:

```bash
npm run build
```

12. Aplicar migraciones solo contra el ambiente objetivo aprobado:

```bash
npx prisma migrate deploy
```

13. Iniciar/reiniciar app:

```bash
npm run start
```

14. Ejecutar smoke publico.
15. Ejecutar smoke autenticado.
16. Ejecutar smoke admin.
17. Ejecutar smoke upload/download.
18. Ejecutar smoke report/PDF.
19. Revisar logs por errores 500, auth, DB, storage y PDF.
20. Mantener ventana de rollback abierta hasta completar smoke.

Orden alternativo si Hostinger auto-build/auto-deploy ejecuta build por push:

- Confirmar si el push dispara deploy automatico antes de pushear.
- Si dispara deploy automatico, no pushear hasta tener env vars, backup, storage y plan de migracion listos.
- Si no dispara deploy automatico, usar push solo como sincronizacion y ejecutar release manual controlado.

## Smoke Plan Futuro

### Publico

- `/`
- `/shiftreadiness`
- `/sign-in`
- `/sign-up`
- `/vmware-to-proxmox-readiness`
- `/sample-report`

Esperado:

- 200 en paginas publicas.
- Sin errores 500.
- Assets cargan.

### Auth

- Sign-up con usuario ficticio.
- Sign-in.
- Sign-out.
- `/dashboard` redirige sin sesion.
- `/dashboard` carga con sesion.

### Assessment

- `/dashboard/assessments` carga.
- Crear assessment ficticio.
- Abrir assessment detail.
- Ver Completion Center.
- Ver RVTools/upload gate.
- Ver Client Context tab.
- Ver Licensing panel.

### Evidence / Parser

- Subir RVTools o fixture permitido.
- Confirmar metadata de archivo.
- Confirmar parser/inventory si corresponde.
- Descargar evidencia.
- Validar que borrado/archivo no autorizado devuelve seguro.

### Reports / PDF

- Abrir report preview.
- Generar reporte.
- Descargar PDF.
- Confirmar que PDF empieza con `%PDF`.
- Confirmar secciones nuevas:
  - Licensing & Cost Exposure Analysis;
  - Customer Context Intelligence.
- Confirmar que raw client context no aparece.
- Confirmar que archivos adicionales aparecen solo como metadata.

### Admin

- Sin sesion: admin bloquea o redirige.
- Usuario no-admin: admin deniega.
- Admin incluido en `ADMIN_EMAILS`: admin carga.
- `/dashboard/admin/pricing` carga.
- Pricing snapshots visibles.
- Storage sigue como "En desarrollo".

### AI

- Si AI esta deshabilitada: fallback seguro.
- Si AI esta habilitada: smoke con payload pequeno, sin secretos.
- Confirmar `AiUsageEvent` si el flujo lo usa.

## Rollback Plan

### Si falla antes de migraciones

- No aplicar migraciones.
- Revertir app/build al commit anterior.
- Corregir env/storage/build.
- Reintentar solo cuando preflight pase.

### Si migraciones aplican pero app falla

- Las migraciones recientes son aditivas, por lo que el rollback de app al commit anterior deberia ser compatible.
- No intentar revertir tablas manualmente.
- Mantener DB forward si el commit anterior ignora las tablas nuevas.
- Si hay corrupcion o falla severa, restaurar snapshot/PITR.

### Si app deploya pero PDF/report falla

- Revisar logs de `reportPdfRenderer`, storage root y permisos.
- Verificar que `HOSTINGER_STORAGE_ROOT` es persistente/escribible.
- Si el fallo bloquea demo/operacion, rollback de app al commit anterior.

### Si storage falla

- No borrar uploads.
- Corregir path/permisos.
- Validar con `npm run storage:check`.
- Restaurar backup de storage solo si hubo perdida real.

### Si auth falla

- Revisar `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL`.
- Confirmar dominio HTTPS.
- Rollback de env o app si no se corrige rapido.

### Si DB connection falla

- No ejecutar comandos destructivos.
- Validar `DATABASE_URL`, SSL, allowlist/red.
- Volver a app anterior si el incidente impacta usuarios.

### Feature flags / degradacion

- `AI_ADVISORY_ENABLED=false` puede desactivar flujos AI si provider/budget falla.
- Licensing y Client Context son modulos opcionales; no deben bloquear report generation.
- Admin access falla cerrado si `ADMIN_EMAILS` no esta correctamente configurado.

## Go / No-Go

### GO para release futuro si

- Build pasa.
- Tests/lint/typecheck pasan.
- Migraciones confirmadas como aditivas y ordenadas.
- `_prisma_migrations` o `migrate status` confirma estado esperado.
- Backup DB/snapshot disponible.
- Env vars target confirmadas.
- Storage root absoluto, privado, persistente y escribible.
- Node 22+ confirmado.
- Logs Hostinger accesibles.
- Admin smoke posible.
- Rollback documentado.

### NO-GO si

- Falta backup DB.
- Env vars target estan incompletas o apuntan a localhost.
- Storage root no esta confirmado.
- No hay acceso a logs/restart.
- `npm run build` falla.
- `npx prisma migrate status` muestra drift inesperado.
- No se sabe si Hostinger auto-deploya al push.
- No hay usuario/admin para smoke autenticado.
- No hay plan de rollback aprobado.

Veredicto preliminar de este hito:

- Codigo y migraciones: GO tecnico preliminar.
- Release productivo inmediato: NO-GO operacional hasta confirmar env vars target, backup DB, storage root persistente, logs/restart Hostinger y estado real de `_prisma_migrations`.

## Que NO se ejecuto

- No se ejecuto deploy.
- No se aplicaron migraciones productivas.
- No se ejecuto `npx prisma migrate deploy` contra produccion.
- No se mutaron datos remotos.
- No se crearon migraciones.
- No se modifico codigo funcional.
- No se imprimieron secretos.
- No se tocaron archivos de Hostinger.

## Riesgos Pendientes

- Estado real de `_prisma_migrations` en produccion no verificado.
- Env vars reales de Hostinger no confirmadas.
- Storage root productivo no validado en runtime.
- Backup/PITR DB no confirmado.
- Hostinger auto-deploy behavior debe confirmarse antes del proximo push/release.
- QA autenticada real sigue pendiente por decision operativa previa.
- Pricing real aprobado sigue pendiente.
- AI provider productivo requiere smoke con credencial real si se habilita.

## Proximo Paso Recomendado

Antes de `RELEASE-APPLY-1`, ejecutar un gate manual de release:

1. Confirmar si Hostinger auto-deploya al push.
2. Confirmar env vars target sin imprimir valores.
3. Confirmar storage root persistente y permisos.
4. Confirmar backup/PITR de DB.
5. Confirmar estado de migraciones con lectura segura.
6. Aprobar ventana de deploy.

Solo despues ejecutar un hito separado:

```text
RELEASE-APPLY-1 - Apply migrations and deploy Hostinger controlled release
```

Ese hito debe ser explicito, aprobado y con rollback preparado.
