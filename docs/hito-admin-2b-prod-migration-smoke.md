# HITO ADMIN-2B-PROD-MIGRATION-SMOKE - AiUsageEvent Production Migration Smoke

Fecha: 2026-05-28.

## Objetivo

Aplicar la migracion `AiUsageEvent` en produccion y validar que la consola admin pueda leer metricas IA persistentes sin romper produccion.

## Estado

Estado general: PARCIAL / BLOQUEADO POR ACCESO A `DATABASE_URL` PRODUCTIVA.

El codigo ADMIN-2B esta en `main` y la migracion existe, pero este runtime no tiene `DATABASE_URL` disponible para `prisma migrate deploy`.

## Git

- Branch: `main`.
- HEAD esperado: `19ca1bb feat: persist AI usage metrics for admin console`.
- `origin/main`: sincronizado antes del smoke.
- Working tree inicial: limpio.

## Migracion revisada

Archivo:

- `prisma/migrations/20260528103000_admin_2b_ai_usage_events/migration.sql`

La migracion:

- crea tabla `AiUsageEvent`;
- agrega indices por `createdAt`, `userId`, `assessmentId`, `provider`, `status` y `operationType`;
- agrega foreign keys nullable a `user` y `Assessment`;
- usa `ON DELETE SET NULL`;
- no borra tablas;
- no borra columnas;
- no modifica datos existentes;
- no ejecuta Prisma reset.

## Intento de aplicacion

Comando ejecutado:

```bash
npm run prisma:deploy
```

Resultado:

- FALLA segura.
- Motivo: `DATABASE_URL` no esta disponible en el runtime actual.
- No se imprimio `DATABASE_URL`.
- No se aplico migracion productiva desde este entorno.

## Validaciones locales

Ejecutadas:

- `npm run hostinger:diagnose`: OK, sin valores secretos.
- `npm run ai:guardrails`: OK.
- `npm run typecheck`: OK.
- `npm run lint`: OK.
- `npm run build`: OK.
- `npx prisma generate`: OK.
- `npx prisma validate`: OK con `DATABASE_URL` dummy temporal, sin tocar `.env`.

Nota:

- `npx prisma validate` sin env falla porque Prisma requiere `DATABASE_URL`.
- Esto no valida conectividad productiva.

## Smoke produccion sin sesion

Resultado:

- `/`: 200.
- `/shiftreadiness`: 200.
- `/sign-in`: 200.
- `/sign-up`: 200.
- `/dashboard`: 307 -> `/sign-in`.
- `/dashboard/admin`: 307 -> `/sign-in`.

## Smoke admin autenticado

No ejecutado por Codex.

Motivo:

- No hay sesion admin productiva en este runtime.
- La migracion no fue aplicada desde este entorno, por lo que no corresponde cerrar admin usage como PASS.

## Evento IA persistente

No generado.

Motivo:

- Tabla productiva no confirmada como aplicada.
- No hay sesion admin/productiva autenticada.

## Instruccion segura para cierre manual

Ejecutar en el entorno que tenga `DATABASE_URL` productiva configurada como variable segura:

```bash
npm run prisma:deploy
```

Luego validar:

```bash
npm run prisma:generate
```

Despues completar QA autenticado:

- `/dashboard/admin` carga para admin.
- Tab `IA y Consumo` abre.
- Eventos IA esta vacia o lista eventos sin crashear.
- Generar preview/PDF con Gemini en assessment QA.
- Confirmar que aparece un evento persistido.
- Confirmar que no se ven secrets/API keys.

## Seguridad

- No se ejecuto Prisma reset.
- No se modifico Hostinger config.
- No se activo OpenAI.
- No se imprimieron secrets.
- No se imprimio `DATABASE_URL`.
- No se imprimio `GEMINI_API_KEY`.
- No se hizo full public launch.

## Decision

- Production AiUsageEvent migration applied: NO desde este runtime.
- ADMIN-2B production ready: PARCIAL hasta aplicar migracion real.
- Ready for ADMIN-3: NO para dependencias persistentes productivas hasta cerrar este smoke.
- Ready for full public launch: NO.

## Follow-up ADMIN-2B-PROD-MIGRATION-USER-ATTESTED

Fecha: 2026-05-28.

Resultado: BLOQUEADO.

Se repitio el preflight en `main` con `HEAD = origin/main = 66ecca0`. El runtime seguia sin `DATABASE_URL`, sin `NODE_ENV=production` y sin marcador de `NEXT_PUBLIC_APP_URL` productiva.

Por regla critica, no se ejecuto migracion ni se uso `.env.local` para inferir DB productiva.

Produccion sin sesion siguio sana:

- `/`: 200.
- `/shiftreadiness`: 200.
- `/sign-in`: 200.
- `/sign-up`: 200.
- `/dashboard`: 307 -> `/sign-in`.
- `/dashboard/admin`: 307 -> `/sign-in`.
