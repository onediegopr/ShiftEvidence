# Hostinger Rollback Runbook v1

## App rollback
1. Detener el proceso Node actual.
2. Restaurar el build/release anterior.
3. Ejecutar `npm ci` si cambia `package-lock.json`.
4. Ejecutar `npx prisma generate`.
5. Iniciar `npm run start`.
6. Ejecutar smoke minimo.

## DB rollback
No usar resets destructivos.

Opciones:
- Neon point-in-time restore.
- Restaurar backup verificado.
- Aplicar migracion forward corrective si es mas seguro.

## Storage rollback
1. Mantener `HOSTINGER_STORAGE_ROOT` fuera del build.
2. Restaurar backup de storage si hubo perdida.
3. Conservar estructura de `relativePath`.
4. Validar evidencia y PDF descargables.

## Env rollback
Revisar:
- `DATABASE_URL`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `NEXT_PUBLIC_APP_URL`
- `HOSTINGER_STORAGE_ROOT`
- `ADMIN_EMAILS`

## Smoke minimo post-rollback
- `/`
- `/shiftreadiness`
- `/sign-in`
- `/dashboard`
- `/dashboard/assessments`
- `/dashboard/assessments/[id]/report`
- PDF download de un reporte existente
- Evidence download de una evidencia existente
