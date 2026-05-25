# Neon + Prisma Runbook

## Propósito
Instrucciones mínimas para conectar ShiftReadiness a Neon Postgres, validar Prisma y ejecutar migraciones sin destruir datos.

## Variables requeridas
- `DATABASE_URL`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `NEXT_PUBLIC_APP_URL`

## Flujo recomendado
1. Crear o copiar un `.env.local` con las variables requeridas.
2. Confirmar que `.env.local` no se commitea.
3. Ejecutar:
   - `npm run prisma:validate`
   - `npm run prisma:generate`
4. Si la base es nueva o está alineada con el schema:
   - `npm run prisma:migrate -- --name hito_1_foundation`

## Verificaciones seguras
- Revisar que el esquema Prisma compile.
- Confirmar que las tablas de auth y producto existan en Neon.
- Probar login y dashboard con sesión real.
- Probar creación de workspace y assessment draft.

## No hacer sin autorización
- `prisma migrate reset`
- `prisma db push --force-reset`
- `TRUNCATE`
- `DROP TABLE`
- borrar usuarios
- borrar sesiones

## Troubleshooting
- Si `DATABASE_URL` falta, Prisma no debe migrar.
- Si `Better Auth` falla con callback URL, revisar `BETTER_AUTH_URL`, `Origin` y `trustedOrigins`.
- Si `dashboard` no crea workspace, revisar el bootstrap server-side y la sesión activa.
- Si la migración falla, conservar el último estado funcional y documentar el error exacto.

## Resultado de referencia del hito 1.1
- Prisma validate: OK
- Prisma generate: OK
- Prisma migrate dev: OK contra Neon real
- Workspace default: OK
- Auth smoke test: OK
