# HITO QA-ENV-1 - Prepare Isolated Local/Staging QA Database

## 1. Objetivo

Preparar el camino seguro para ejecutar QA autenticada real del Assessment Completion Center sin tocar produccion ni datos remotos reales.

Este hito es de diagnostico y planificacion. No modifica `.env.local`, no crea DB, no crea usuarios QA y no aplica migraciones.

## 2. Estado Git

- Branch: `main`.
- HEAD inicial: `821b403 docs: record ACC authenticated QA environment check`.
- Ahead/behind inicial: `main...origin/main [ahead 9]`.
- Working tree inicial: limpio.
- Stash: `stash@{0}: On main: park beta invite docs before functional readiness`.
- Push realizado: NO.
- Production deploy: NO.
- Production launched: NO.

## 3. Clasificacion segura de DB actual

`.env.local`:

- Presente: SI.
- Modificado: NO.
- Impreso: NO.

`DATABASE_URL`:

- Presente: SI.
- Valor completo impreso: NO.
- Clasificacion: `remote-managed`.
- Confianza: alta.
- Seguro para crear datos QA: NO.

`DIRECT_URL`:

- Presente: NO.
- Clasificacion: `unknown`.

Conclusion:

- No hay DB local/QA aislada confirmada.
- No se debe crear usuario QA ni assessment QA en el entorno actual.

## 4. Clasificacion de storage actual

`HOSTINGER_STORAGE_ROOT`:

- Presente: SI.
- Valor completo impreso: NO.
- Clasificacion: `local-path-like`.

Conclusion:

- Storage parece local para este workspace, pero la DB remota/gestionada sigue bloqueando QA autenticada con escritura.
- Para QA aislada, usar un storage root separado, por ejemplo `.qa-storage`, no el storage actual.

## 5. Scripts existentes

Scripts relevantes en `package.json`:

- `dev`: `next dev`
- `build`: `next build`
- `start`: `next start`
- `lint`: `eslint .`
- `test:run`: `vitest run`
- `typecheck`: `tsc --noEmit`
- `prisma:validate`: `prisma validate`
- `prisma:generate`: `prisma generate`
- `prisma:migrate`: `prisma migrate dev`
- `prisma:deploy`: `prisma migrate deploy`
- `prisma:studio`: `prisma studio`
- `hostinger:diagnose`: `node scripts/hostinger-diagnose.mjs`
- `storage:check`: `node scripts/check-storage-runtime.mjs`
- `sample-report:generate`: `node scripts/generate-public-sample-report.mjs`

Scripts en `scripts/`:

- `ai-advisory-fallback-drill.mjs`
- `ai-advisory-guardrails-smoke.mjs`
- `check-hostinger-env.mjs`
- `check-storage-runtime.mjs`
- `generate-full-synthetic-gemini-report.mjs`
- `generate-public-sample-report.mjs`
- `hostinger-diagnose.mjs`
- `qa-rvtools-parser-p0.mjs`
- `smoke-local-gemini.mjs`

## 6. Soporte de seed/fixtures

Seed:

- No se encontro `prisma/seed.*`.
- No hay script oficial de seed QA.
- No hay script oficial para crear usuario QA/admin.

Fixtures QA existentes:

- `qa-artifacts/hito-10-2-3-rvtools-mapping-review/evidence/rvtools-like-sample.xlsx`
- `qa-artifacts/hito-12-0-8-browser-upload-gate-e2e/evidence/browser-upload-gate-sample.csv`
- `qa-artifacts/hito-10-2-2-human-review/evidence/sample-rvtools-evidence.csv`
- JSONs sinteticos en `qa-artifacts/ai-report-*` y `qa-artifacts/synthetic-consistency-1`.

Conclusion:

- Hay evidencia sintetica util para upload/parser/report QA.
- Falta seed/fixture transaccional para crear usuario, workspace, assessment y entitlement QA.

## 7. Opciones evaluadas

### Opcion A - Local Postgres aislado

Ventajas:

- Maximo aislamiento.
- Permite crear/borrar datos QA sin riesgo de tocar remoto.
- Permite ejecutar `prisma migrate deploy` o `prisma migrate dev` contra una DB desechable.
- Ideal para ACC-AUTH-QA-2.

Desventajas:

- Requiere Postgres local o Docker.
- Requiere env QA separado.

### Opcion B - Neon branch QA/staging

Ventajas:

- No requiere instalar Postgres local.
- Mantiene compatibilidad con Neon/Postgres real.
- Permite aislar QA si se crea branch dedicado.

Desventajas:

- Sigue siendo remoto/gestionado.
- Requiere confirmacion explicita de que el branch puede recibir usuarios/datos QA.
- Requiere variables separadas y cuidado para no mezclar con produccion.

### Opcion C - DB actual

Resultado:

- Rechazada para QA con escritura.

Motivo:

- Clasifica como `remote-managed`.
- No esta confirmada como QA/staging aislada.

### Opcion D - SQLite

Resultado:

- Rechazada.

Motivo:

- `prisma/schema.prisma` usa `provider = "postgresql"`.
- Cambiar a SQLite implicaria cambios de schema/runtime fuera de alcance.

## 8. Recomendacion final

Camino recomendado:

- Opcion A: Local Postgres aislado.

Motivo:

- Es la opcion de menor riesgo operativo.
- Permite ejecutar QA autenticada real sin tocar datos remotos.
- Se puede destruir/recrear despues de la QA sin afectar produccion.

Alternativa aceptable:

- Opcion B: Neon branch QA/staging dedicado, solo con confirmacion explicita del usuario y variables separadas.

## 9. Pasos exactos para preparar DB QA local

Estos pasos son para ejecutar manualmente cuando el usuario decida preparar el entorno. No se ejecutaron en este hito.

1. Crear una base local PostgreSQL:

```powershell
createdb shiftreadiness_qa
```

Si se usa Docker:

```powershell
docker run --name shiftreadiness-qa-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=shiftreadiness_qa -p 54329:5432 -d postgres:16
```

2. Crear un archivo local no commiteado de entorno QA, por ejemplo `.env.qa.local`.

Variables necesarias, sin valores reales:

```env
DATABASE_URL=
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
HOSTINGER_STORAGE_ROOT=.qa-storage
MAX_UPLOAD_SIZE_MB=25
ADMIN_EMAILS=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

3. Cargar variables QA solo en el proceso actual, sin modificar `.env.local`.

4. Aplicar migraciones contra la DB QA local:

```powershell
npx prisma migrate deploy
```

5. Generar Prisma client:

```powershell
npx prisma generate
```

6. Levantar la app con env QA:

```powershell
npm run build
npm run start -- -p 3000
```

7. Crear usuario QA por UI local `/sign-up` o por un script QA futuro.

8. Crear assessment QA.

9. Usar fixture sintetico:

```text
qa-artifacts/hito-10-2-3-rvtools-mapping-review/evidence/rvtools-like-sample.xlsx
```

10. Ejecutar `ACC-AUTH-QA-2`.

## 10. Pasos exactos para preparar Neon branch QA

Estos pasos requieren autorizacion explicita antes de tocar Neon.

1. Crear branch Neon dedicado, por ejemplo `qa-acc-auth`.
2. Obtener connection string del branch QA.
3. Crear `.env.qa.local` no commiteado con `DATABASE_URL` del branch QA.
4. Confirmar que el branch no es produccion.
5. Aplicar migraciones:

```powershell
npx prisma migrate deploy
```

6. Usar storage root QA separado.
7. Ejecutar sign-up/assessment/upload/report solo contra ese branch.

## 11. Validaciones ejecutadas

- `npm run test:run`: OK, 13 archivos / 56 tests.
- `npm run lint`: OK con 10 warnings preexistentes de `<img>`.
- `npm run typecheck`: OK.
- `npm run build`: OK.
- `npm run hostinger:diagnose`: OK.
- `npx prisma validate`: OK.
- `npx prisma generate`: OK.

Build mantiene el warning conocido NFT/Turbopack relacionado con `localStorageService`.

## 12. Que no se toco

- `.env.local`: no modificado.
- Produccion: no tocada.
- Hostinger: no tocado.
- DB remota: no escrita.
- QA data: no creada.
- Usuarios: no creados.
- Assessments: no creados.
- Storage: no escrito para QA.
- Migraciones: no aplicadas.
- Stash: no aplicado.
- Codigo funcional: no modificado.

## 13. Riesgos pendientes

- QA autenticada real sigue pendiente.
- Falta seed/script QA para usuario/workspace/assessment.
- Falta storage root QA separado.
- Falta decidir Local Postgres vs Neon branch QA.
- Si se usa Neon branch, se requiere confirmacion explicita para evitar mezclar con produccion.

## 14. Proximo hito recomendado

`QA-ENV-2 - Create isolated QA database and seed account`

Objetivo sugerido:

- Preparar `.env.qa.local` no commiteado.
- Aplicar migraciones contra DB QA confirmada.
- Crear usuario QA, workspace y assessment con datos sinteticos.
- Ejecutar despues `ACC-AUTH-QA-2`.

## 15. Confirmaciones

- `.env.local modified: NO`.
- `QA data created: NO`.
- `Production touched: NO`.
- `Push realizado: NO`.
- `Production deploy: NO`.
- `Production launched: NO`.
