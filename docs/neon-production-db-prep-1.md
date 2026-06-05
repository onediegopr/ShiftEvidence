# Neon Production DB Prep 1

Fecha: 2026-06-05

## 1. Objetivo

Preparar de forma segura la base de datos productiva Neon para el futuro cutover de `shiftevidence`, sin ejecutar cutover, sin `db push`, sin DNS, sin Stripe live y sin documentar secretos.

Este hito identifica el target productivo, confirma separacion respecto de ramas no productivas, revisa configuracion Prisma y deja definida la decision de carga de Vercel Production env.

## 2. Estado inicial

| Area | Estado inicial |
| --- | ---: |
| NEON-PRODUCTION-DB-PREP-1 | 0% |
| Production/cutover readiness | 91% |
| Vercel readiness | 95% |
| Storage/R2 readiness | 97% |
| Billing readiness | 95% |
| Stripe live readiness | 65% |
| Admin ops | 94% |
| PDF/report quality | 98% |
| General technical | 97% |

## 3. Auditoria local

Repositorio:

- Branch actual: `main`.
- HEAD inicial: `c0ed150a3e9036ac472bb2bf3f7ab3d13231b71e`.
- `origin/main`: `c0ed150a3e9036ac472bb2bf3f7ab3d13231b71e`.
- `origin/preview`: `5c8b695eb3c20b709db30b00d7cddc6164cf2fed`.
- No habia commits locales sin pushear.
- No habia cambios locales al iniciar.
- No habia untracked files visibles.
- No habia stashes reportados.
- `.env.local` no esta trackeado.
- `.env.r2-smoke.local` no esta trackeado.

Vercel hardening:

- `vercel.json` conserva `git.deploymentEnabled.main=false`.
- `vercel.json` conserva `git.deploymentEnabled.preview=true`.
- No se modifico configuracion Vercel.

## 4. Auditoria Prisma / DB config

Archivos revisados:

- `prisma/schema.prisma`.
- `prisma/migrations`.
- `package.json`.
- `src/lib/env.ts`.
- `docs/production-env-prep-2.md`.
- `docs/production-cutover-plan-2.md`.
- `docs/neon-vercel-preview-env-smoke.md`.

Resultados:

| Item | Resultado |
| --- | --- |
| DB provider | PostgreSQL |
| Runtime env requerida | `DATABASE_URL` |
| `directUrl` en Prisma schema | No configurado |
| `DIRECT_URL` requerido por Prisma actualmente | No |
| Migraciones locales versionadas | 24 |
| Comando production correcto | `npx prisma migrate deploy` / `npm run prisma:deploy` |
| Comando prohibido en production | `prisma db push` |
| Seed productivo | No ejecutado; no requerido en este hito |

Notas:

- `src/lib/env.ts` exige `DATABASE_URL` para runtime.
- `package.json` contiene `prisma:deploy` como `prisma migrate deploy`.
- `package.json` contiene `prisma:migrate` como `prisma migrate dev`; no debe usarse en production.
- No hay script `db push` en `package.json`, pero sigue prohibido.

## 5. Neon audit

Organizacion Neon observada:

- `ONE Ideas`.

Proyecto seleccionado:

| Campo | Valor |
| --- | --- |
| Project name | `InfraShift` |
| Project ID | `icy-term-84598838` |
| Region | `aws-us-east-1` |
| Postgres version | 17 |
| History retention observado | 21600 seconds |

Ramas observadas:

| Branch | Branch ID | Rol decidido | Estado | Notas |
| --- | --- | --- | --- | --- |
| `production` | `br-raspy-morning-ap11hfm6` | Production seleccionada | ready | Primary/default branch. |
| `viviana-demo-seed-dry-run-20260602` | `br-twilight-poetry-apqlxbsa` | No production | ready | Dry-run/demo branch. |
| `john-demo-seed-dry-run-20260602` | `br-gentle-firefly-apv7th9p` | No production | ready | Dry-run/demo branch. |

Databases observadas en branch `production`:

- `neondb`.
- `postgres`.

Database seleccionada:

- `neondb`.

Compute:

- Existe compute read/write para branch `production`.
- No se documenta connection string.
- No se documentan credenciales.

## 6. Decision de DB productiva

Decision: Opcion C, usar la DB existente porque ya esta claramente nombrada como `production`, es primary/default y contiene el esquema Prisma actual.

Target seleccionado:

| Campo | Valor |
| --- | --- |
| Neon project | `InfraShift` |
| Branch | `production` |
| Database | `neondb` |
| Uso | Production DB futura para `shiftevidence` |

Motivos:

- Ya existe una rama `production`.
- Esta separada de ramas dry-run/demo.
- Contiene tablas del producto y `_prisma_migrations`.
- No hace falta crear otra branch productiva.
- Crear otra branch sin necesidad aumentaria la ambiguedad operacional.

No se creo:

- Proyecto nuevo.
- Branch nueva.
- Database nueva.
- Role nuevo.

## 7. Migration status

Validacion local:

- Migraciones locales en `prisma/migrations`: 24.
- `npm run prisma:generate`: OK.
- `npm run prisma:validate` con placeholder no sensible de `DATABASE_URL`: OK.
- `npm run prisma:validate` sin placeholder fallo por falta de `DATABASE_URL` local; no fue un error de schema.

Validacion Neon metadata:

- Tabla `_prisma_migrations`: presente.
- Migraciones aplicadas en Neon production `neondb`: 24.
- Migraciones rolled back: 0.
- Migraciones unfinished: 0.
- Ultima migracion finalizada observada: 2026-06-02.

Conclusion:

- El conteo de migraciones locales coincide con el conteo aplicado en Neon production.
- No se detectaron migraciones pendientes por metadata.
- `npx prisma migrate status` no se ejecuto porque no habia `DATABASE_URL` productivo seguro en env local y obtenerlo/imprimirlo desde Neon estaria fuera de las reglas del hito.

## 8. Migrate deploy

`migrate deploy` ejecutado: No.

Motivos:

- Neon production ya reporta 24 migraciones aplicadas.
- El repo local tambien tiene 24 migraciones.
- No hay `DATABASE_URL` productivo seguro local para Prisma CLI.
- El hito no requiere aplicar cambios porque no hay migraciones nuevas pendientes.

No se ejecuto:

- `prisma db push`.
- `prisma migrate reset`.
- `prisma migrate dev` contra production.
- SQL destructivo.
- Seed con datos reales.

## 9. Vercel Production env

Target Vercel canonico:

- `shiftevidence`.

Variables:

| Variable | Loaded in this hito | Motivo |
| --- | --- | --- |
| `DATABASE_URL` | No | No se obtuvo ni imprimio connection string; cargarla requiere ingreso seguro/manual o herramienta que no exponga valor. |
| `DIRECT_URL` | No | No esta configurado en Prisma schema; no es requerido actualmente por Prisma. |

No se toco:

- `infrashift-r2-recovery` Production env.
- Vercel Preview env.
- Vercel deploy/promote.

## 10. Que NO se toco

No se tocaron:

- Production cutover.
- DNS.
- Hostinger.
- Custom domains.
- Stripe live.
- Payments.
- Webhooks live.
- Wise automation.
- R2 prod.
- R2 prod writes.
- Upstash prod.
- Entitlements reales.
- Grants.
- DB reset.
- DB delete.
- Destructive migrations.
- Seeds con datos reales.
- Vercel Production deploy.
- Vercel Production env values.

No se imprimieron:

- `DATABASE_URL`.
- `DIRECT_URL`.
- Credenciales Neon.
- Passwords.
- Tokens.
- Claves privadas.

## 11. Riesgos

- El branch `production` no esta marcado como protected en Neon; conviene evaluar proteccion antes de cutover publico.
- `DATABASE_URL` todavia no esta cargado por este hito en Vercel Production `shiftevidence`.
- `DIRECT_URL` no aplica al Prisma schema actual, pero podria requerirse si se cambia estrategia de migracion.
- `migrate status` formal de Prisma queda pendiente hasta tener una forma segura de ejecutar Prisma con la URL productiva sin exponerla.
- Cualquier carga futura de Vercel Production env podria requerir redeploy controlado para aplicar runtime env.

## 12. Rollback / restore considerations

- Neon permite branching/restore segun la ventana de retencion disponible del plan.
- Antes de aplicar futuras migraciones productivas, crear snapshot/branch o confirmar restore point.
- Si una migracion futura falla, no usar `db push` ni reset; detener, revisar `_prisma_migrations` y usar restore/branch recovery.
- Mantener separacion entre branch `production` y branches dry-run/demo.

## 13. Estado final

| Area | Estado final |
| --- | ---: |
| NEON-PRODUCTION-DB-PREP-1 | 100% |
| Production/cutover readiness | 92% |
| Vercel readiness | 95% |
| DB readiness | 96% |
| Storage/R2 readiness | 97% |
| Billing readiness | 95% |
| Stripe live readiness | 65% |
| Admin ops | 94% |
| PDF/report quality | 98% |
| General technical | 97% |

## 14. Proximo hito recomendado

Recomendado:

- `PRODUCTION-ENV-PREP-2A-MANUAL-ENV-ENTRY` para cargar `DATABASE_URL` de forma segura en `shiftevidence` Production sin imprimir valor.

Luego:

- `R2-PRODUCTION-STORAGE-SMOKE-1`.
- `UPSTASH-PRODUCTION-RATE-LIMIT-SMOKE-1`.
- `AUTH-ADMIN-PRODUCTION-SMOKE-1`.
- `STRIPE-LIVE-READINESS-1`.
