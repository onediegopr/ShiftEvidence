# Hito 1 Technical Foundation

> Update note: Hito 1.1 validated this foundation against Neon real, including Prisma migrate, Better Auth sign-up/sign-in/sign-out, protected dashboard, workspace bootstrap and assessment smoke tests.

## Objetivo
Construir la base tecnica de ShiftReadiness sobre Next.js, con auth, dashboard privado, Prisma, Better Auth y shell modular de assessment, preservando la landing publica y la pagina comercial `/shiftreadiness`.

## Alcance ejecutado
- Migracion controlada de Vite SPA a Next.js App Router.
- Preservacion de `/` y `/shiftreadiness`.
- Rutas auth: `/sign-in` y `/sign-up`.
- Ruta publica auxiliar: `/contact`.
- Dashboard privado en `/dashboard`.
- Shell de assessments en `/dashboard/assessments`, `/dashboard/assessments/new` y `/dashboard/assessments/[id]`.
- Prisma schema v1 con Better Auth y modelos de producto.
- Better Auth con email/password.
- Servicios server iniciales para workspace, user profile y assessments.
- Documentacion del hito y notas de preservacion.

## Decisiones tecnicas
- Next.js App Router en `src/app`.
- CSS global existente reutilizado.
- Prisma con `@prisma/client` y `@prisma/adapter-pg`.
- Better Auth integrado via `toNextJsHandler`.
- Rutas publicas preservadas como componente de pagina y no como rediseño.
- `ShiftReadinessPage` se mantuvo como componente cliente para no romper el bloque comercial ya validado.

## Estado de avance
- Avance general antes del hito: 8%
- Avance general despues del hito: 20%
- Avance del hito actual: 100%
- Justificacion: hay foundation tecnica real, routing Next, auth shell, dashboard, Prisma schema y servicios base.
- Proximo salto esperado: Hito 2, con CRUD de assessment, manual intake y assumptions de Cost/Risk.

## Rollback points
- ROLLBACK 0: estado inicial Vite/React con landing y `/shiftreadiness`.
- ROLLBACK 1: auditoria completa y mapa de archivos criticos.
- ROLLBACK 2: base Next creada sin eliminar la fuente Vite.
- ROLLBACK 3: landing migrada/preservada en Next.
- ROLLBACK 4: `/shiftreadiness` migrada/preservada en Next.
- ROLLBACK 5: Prisma instalado y schema valido.
- ROLLBACK 6: Neon preparado via `DATABASE_URL`.
- ROLLBACK 7: Better Auth integrado.
- ROLLBACK 8: dashboard privado protegido.
- ROLLBACK 9: assessment shell creado.
- ROLLBACK 10: documentacion y validaciones finales.

## Validaciones
- `npm run lint`: OK
- `npm run typecheck`: OK
- `npm run build`: OK
- `npx prisma validate`: OK
- `npx prisma generate`: OK
- `npx prisma migrate dev --name hito_1_foundation`: pendiente, porque no hay base Neon real conectada aun

## Riesgos pendientes
- Falta DATABASE_URL real de Neon para migracion y runtime persistente.
- Los flujos auth necesitan secretos reales antes de deploy.
- El shell de assessment tiene arquitectura lista, pero no ingest real ni scoring real.
