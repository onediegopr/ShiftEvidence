# Hito RELEASE-APPLY-1 - Controlled Production Migration & Hostinger Release

## Objetivo

Ejecutar un release productivo controlado de ShiftReadiness aplicando migraciones Prisma pendientes y validando el runtime productivo con smoke tests y observacion post-release.

Resultado real de este hito:

- Migraciones productivas Prisma: aplicadas correctamente.
- DB schema: up to date despues de `migrate deploy`.
- Build local pre-release: OK.
- Smoke publico productivo: OK.
- Smoke privado sin sesion: redireccion segura a `/sign-in`.
- Deploy/restart Hostinger manual desde este entorno: no ejecutable por falta de canal remoto disponible en shell.
- Smoke autenticado/admin/report real: pendiente por falta de sesion/cookies/credenciales en este contexto.

## Git / Release

- Branch: `main`.
- Commit de release: `5fe956e docs: add controlled release readiness plan`.
- `origin/main`: sincronizado con `main` al inicio.
- Working tree inicial: limpio.
- Divergencia: no detectada.
- Stash preservado: `stash@{0}: On main: park beta invite docs before functional readiness`.
- Force push: no.

## Validaciones Locales Pre-Release

Comandos ejecutados:

```bash
git status -sb
git log --oneline -n 20
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
- `npm run hostinger:diagnose`: OK, diagnostico no destructivo; no conecta DB ni imprime secretos.
- `npm run build`: OK.
- Warning no bloqueante: Turbopack/NFT tracing warning relacionado con storage service.

## Backup / PITR

- Backup/PITR DB: confirmado por el usuario como prerrequisito operacional antes de ejecutar este hito.
- Restore path conocido: confirmado por el usuario como prerequisito.
- Timestamp exacto del backup: no disponible dentro del contexto de herramientas; no se invento.
- Secretos/connection strings: no impresos.

## Env Vars

Verificacion local segura:

```bash
npm run deploy:check
```

Resultado:

- Required present: `7/7`.
- `ADMIN_EMAILS`: al menos 1 email configurado.
- `HOSTINGER_STORAGE_ROOT`: configurado.
- Bloqueos: ninguno.

Required:

- `DATABASE_URL`: presente.
- `BETTER_AUTH_SECRET`: presente.
- `BETTER_AUTH_URL`: presente.
- `NEXT_PUBLIC_APP_URL`: presente.
- `HOSTINGER_STORAGE_ROOT`: presente.
- `MAX_UPLOAD_SIZE_MB`: presente.
- `ADMIN_EMAILS`: presente.

Optional:

- Google OAuth vars: no presentes en el check local.
- AI provider vars: no verificadas con valores; no se imprimieron secrets.

Limitacion:

- El check ejecuta contra el entorno local/.env disponible para release, no contra hPanel directamente.
- No hubo canal Hostinger API/SSH disponible desde este shell para listar env vars del runtime remoto.

## Storage Root

- Storage root configurado: si, segun `deploy:check`.
- Storage root real y escribible: confirmado por el usuario como prerrequisito operacional.
- Validacion independiente en Hostinger desde este entorno: no ejecutada; no habia SSH/API/app-root remoto disponible.
- Regla esperada: storage privado, absoluto, persistente y fuera de `.next`, `node_modules`, `public` y `public_html`.

## Migraciones

### Status before

Comando:

```bash
npx prisma migrate status
```

Resultado sanitizado:

- 15 migraciones encontradas.
- Sin drift reportado.
- Sin failed migrations reportadas.
- Pendientes antes del deploy:
  - `20260529120000_add_high_value_query_indexes`
  - `20260529210000_cost_1a_pricing_intelligence_foundation`
  - `20260529223000_cost_1b_assessment_licensing_analysis`
  - `20260529235500_context_1_client_context_foundation`
  - `20260529235900_context_2_ai_context_intelligence_engine`

### Deploy

Comando:

```bash
npx prisma migrate deploy
```

Resultado:

- Aplicada `20260529120000_add_high_value_query_indexes`.
- Aplicada `20260529210000_cost_1a_pricing_intelligence_foundation`.
- Aplicada `20260529223000_cost_1b_assessment_licensing_analysis`.
- Aplicada `20260529235500_context_1_client_context_foundation`.
- Aplicada `20260529235900_context_2_ai_context_intelligence_engine`.
- Prisma reporto: `All migrations have been successfully applied.`
- Exit code: 0.
- Warning no bloqueante: Prisma CLI sugiere upgrade mayor `6.19.3 -> 7.8.0`; no se actuo.

### Status after

Comando:

```bash
npx prisma migrate status
```

Resultado:

- 15 migraciones encontradas.
- `Database schema is up to date!`
- Drift/errors: no detectados por Prisma.

## Build / Restart

Local build:

- `npm run build`: OK.
- Next.js 16.2.6 / Turbopack.
- Static pages generadas: 27/27.

Hostinger restart/deploy:

- No se ejecuto restart manual desde este entorno.
- No se ejecuto deploy manual desde este entorno.
- Motivo: no hay `HOSTINGER_API_TOKEN`, variables SSH, app root ni comando remoto disponible en el shell.
- El repo ya estaba sincronizado en `origin/main`; el runtime publico de Hostinger sirve la app Next.js real.

## Smoke Publico

Dominio usado:

```text
https://shiftevidence.com
```

Rutas:

- `/`: 200.
- `/shiftreadiness`: 200.
- `/sign-in`: 200.
- `/sign-up`: 200.
- `/sample-report`: 200.

Homepage:

- Assets `/_next/*`: detectados.
- Copy ShiftReadiness/VMware/Proxmox: detectado.

## Smoke Privado sin Sesion

Validacion HEAD sin seguir redirect:

- `/dashboard`: `307 Temporary Redirect` a `/sign-in`.
- `/dashboard/assessments`: `307 Temporary Redirect` a `/sign-in`.
- `/dashboard/admin`: `307 Temporary Redirect` a `/sign-in`.
- `/dashboard/admin/pricing`: `307 Temporary Redirect` a `/sign-in`.

Observacion repetida con redirect seguido:

- `/dashboard`: 200 final por redirect a sign-in.
- `/dashboard/admin/pricing`: 200 final por redirect a sign-in.
- No se observaron 500/503/504 durante la ventana corta.

## Smoke Autenticado

Estado: pendiente.

Motivo:

- No habia credenciales, cookies, sesion Chrome o herramienta browser autenticada disponible desde este contexto.
- No se intento usar datos reales sensibles.

Pendiente para cierre completo:

- `/dashboard`.
- `/dashboard/assessments`.
- assessment detail.
- Completion Center.
- Client Context tab.
- Licensing panel.
- report preview.
- PDF generation/download.

## Smoke Admin

Estado: pendiente.

Motivo:

- No habia sesion admin/cookies/credenciales disponibles desde este contexto.
- No se aprobaron ni modificaron pricing snapshots reales.

Validado sin sesion:

- `/dashboard/admin` redirige a `/sign-in`.
- `/dashboard/admin/pricing` redirige a `/sign-in`.

## Upload / Evidence Smoke

Estado: pendiente.

Motivo:

- Requiere sesion autenticada y archivo QA seguro en produccion.
- No se subieron archivos ni se mutaron datos de usuario.

## Report / PDF Smoke

Estado: pendiente para flujo real autenticado.

Motivo:

- Requiere sesion y assessment/report entitlement o datos QA.

Validacion indirecta:

- Build local con rutas de report/PDF OK.
- Tests unitarios/PDF previamente pasan.
- Smoke publico `/sample-report`: 200.

## Logs / Monitoring

Observacion ejecutada:

- 3 iteraciones de rutas publicas y privadas sin sesion.
- Intervalo: ~20 segundos entre iteraciones.
- Resultado: sin 500/503/504 observados.

Limitacion:

- No hubo acceso a logs runtime Hostinger desde este shell.
- No hubo restart/log tail remoto disponible.

## Rollback

Rollback usado: no.

Motivo:

- Migraciones aplicadas correctamente.
- `migrate status` posterior OK.
- Smoke publico OK.
- No se detecto caida publica ni errores 500/503/504 en observacion corta.

Rollback disponible:

- App rollback a commit anterior si Hostinger permite redeploy/restart.
- DB restore/PITR si aparece problema severo de datos.
- Como las migraciones aplicadas son aditivas, app rollback deberia poder convivir con DB forward.
- No usar `migrate reset`.
- No borrar storage.

## Estado Final

- Production DB migration status: completado.
- Public runtime: estable en smoke publico.
- Controlled production release: parcial.
- Full release validation: pendiente por smoke autenticado/admin/report y logs Hostinger.
- Full public launch: no declarado.

## Riesgos Pendientes

- Smoke autenticado real pendiente.
- Smoke admin real pendiente.
- Upload/evidence real pendiente.
- Report/PDF real pendiente.
- Logs Hostinger no revisados desde Codex.
- Restart/deploy manual no ejecutado desde este entorno.
- Pricing real aprobado pendiente.
- Prompt tuning y QA profunda pendientes.

## Proximo Paso Recomendado

Ejecutar un hito corto de cierre operativo:

```text
RELEASE-SMOKE-1 - Authenticated production smoke and Hostinger logs review
```

Ese hito debe usar una sesion real/admin o cookies disponibles y acceso a logs Hostinger para cerrar dashboard, admin, upload, report/PDF y monitoreo runtime.
