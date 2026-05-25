# HITO 1.1 - Stabilization / Neon / Auth / Assessment Smoke Test

Fecha: 2026-05-25

## Objetivo
Validar la foundation técnica del proyecto ShiftReadiness contra una base Neon real, confirmando:
- Prisma conectado y migrado.
- Better Auth funcionando con persistencia real.
- Dashboard protegido con sesión real.
- Bootstrap de workspace por defecto.
- Creación de assessment draft con Cost / Risk incluido y Storage opcional.
- Smoke test de rutas públicas sin regresiones.

## Resultado ejecutivo
- Prisma validate: OK
- Prisma generate: OK
- Prisma migrate dev: OK contra Neon real
- Better Auth sign-up: OK
- Better Auth sign-in: OK
- Better Auth sign-out: OK
- `/dashboard` protegido: OK
- Workspace default: OK
- Assessment shell: OK
- Rutas públicas `/` y `/shiftreadiness`: OK

Estado general del hito: PARCIAL -> operativamente estable, con la única limitación de que los flujos de prueba siguen siendo de laboratorio y no representan producto final.

## Avance
- Avance general antes del hito: 20%
- Avance general después del hito: 25%
- Avance del hito actual: 100%

## Variables de entorno validadas
- `DATABASE_URL`: presente y apuntando a Neon real
- `BETTER_AUTH_SECRET`: presente
- `BETTER_AUTH_URL`: presente
- `NEXT_PUBLIC_APP_URL`: presente

## Validaciones realizadas
1. `npx prisma validate`
2. `npx prisma generate`
3. `npx prisma migrate dev --name hito_1_foundation`
4. `GET /`
5. `GET /shiftreadiness`
6. `POST /api/auth/sign-up/email`
7. `POST /api/auth/sign-in/email`
8. `POST /api/auth/sign-out`
9. `GET /dashboard` sin sesión
10. `GET /dashboard` con sesión
11. Creación de workspace default
12. Creación de assessment shell con y sin Storage Destination Readiness

## Qué quedó validado
- La base de datos real responde.
- El esquema Prisma quedó alineado con la DB.
- Better Auth persiste usuarios y sesión.
- El dashboard está protegido.
- El bootstrap de workspace funciona.
- El shell de assessment crea módulos y entitlements esperados.
- El producto público no se rompió durante la estabilización.

## Qué quedó pendiente
- Flujo real de upload.
- Parser RVTools.
- Cálculo real de Cost / Risk.
- Cálculo real de Storage Readiness.
- Checkout / pagos.
- PDF / report export.

## Riesgos
- El comportamiento depende de variables de entorno correctas.
- La DB real debe mantenerse sincronizada con `prisma/schema.prisma`.
- Cualquier cambio en Better Auth o Prisma requiere repetir el smoke test.

## Rollback
- `ROLLBACK 0`: estado final del Hito 1, sin migración real contra Neon.
- `ROLLBACK 1`: auditoría completada.
- `ROLLBACK 2`: variables de entorno validadas.
- `ROLLBACK 3`: Prisma validate/generate OK.
- `ROLLBACK 4`: migración Neon aplicada.
- `ROLLBACK 5`: auth probado.
- `ROLLBACK 6`: dashboard protegido probado.
- `ROLLBACK 7`: workspace default probado.
- `ROLLBACK 8`: assessment shell probado.
- `ROLLBACK 9`: documentación completa.
- `ROLLBACK 10`: validaciones finales OK.

## Próximo salto
HITO 2 - Assessment CRUD + Manual Intake + Cost/Risk Assumptions.
