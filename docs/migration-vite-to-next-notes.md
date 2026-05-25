# Migration Vite to Next Notes

## Estado inicial
- Vite + React 19 + TypeScript.
- SPA con routing minimo por pathname.
- Landing comercial y pagina `/shiftreadiness` ya existian y debian preservarse.

## Estrategia usada
- Migracion controlada, no destructiva.
- Se agrego Next.js App Router en `src/app`.
- Se conservaron los componentes y paginas existentes como base visual.
- Se dejo el arbol Vite como referencia de rollback.

## Archivos migrados o reusados
- `src/pages/LandingPage.tsx`
- `src/pages/ShiftReadinessPage.tsx`
- `src/pages/PlaceholderPage.tsx`
- `src/components/*`
- `src/index.css`
- `public/*`

## Archivos nuevos principales
- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/app/shiftreadiness/page.tsx`
- `src/app/sign-in/page.tsx`
- `src/app/sign-up/page.tsx`
- `src/app/contact/page.tsx`
- `src/app/dashboard/*`
- `src/app/api/auth/[...all]/route.ts`
- `src/lib/*`
- `src/server/*`

## Riesgos
- El repositorio conserva archivos legacy de Vite para rollback.
- El auth stack requiere variables de entorno reales.
- Prisma y Better Auth necesitan migracion real en Neon para funcionar en produccion.

## Rollback
- Revertir los archivos `src/app`, `src/lib`, `src/server`, `prisma`, `next.config.mjs` y volver a apuntar scripts a Vite.
- Mantener `src/pages` y `src/components` como base visual si se necesita retroceder.

