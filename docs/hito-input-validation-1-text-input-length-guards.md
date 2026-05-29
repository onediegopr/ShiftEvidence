# HITO INPUT-VALIDATION-1 - Text Input Length Guards

## Objetivo

Agregar validaciones server-side de longitud para inputs textuales criticos que se guardan en DB o alimentan reportes, PDF, AI Advisory y render del dashboard.

## Problema corregido

Antes del hito, varios campos de texto libre dependian de `trim()` o truncados locales, sin una politica central de limites. Eso podia permitir textos excesivamente largos en campos como company name, assessment title, notas, contexto manual, branding de PDF o comentarios internos.

## Decision de limites amplios

Se aplicaron limites conservadores pero generosos, aproximadamente 80% por encima de limites base prudentes. El objetivo es proteger DB, SSR, PDF y AI sin bloquear contexto tecnico util.

## Limites definidos

- Company name: 216 caracteres.
- Assessment title/name: 288 caracteres.
- Short text: 288 caracteres.
- Description: 3.600 caracteres.
- Notes/comments: 3.600 caracteres.
- Manual technical context: 9.000 caracteres.
- Email: 320 caracteres.
- URL: 2.048 caracteres.
- Currency: 12 caracteres.

## Archivos revisados

- `src/app/dashboard/assessments/new/actions.ts`
- `src/app/dashboard/assessments/[id]/actions.ts`
- `src/app/dashboard/assessments/[id]/report/actions.ts`
- `src/app/api/assessments/[id]/reports/generate/route.ts`
- `src/app/sign-up/actions.ts`
- `src/server/assessments/formUtils.ts`
- `src/server/assessments/assessmentService.ts`
- `src/server/assessments/infrastructureInputService.ts`
- `src/server/assessments/costRiskService.ts`
- `src/server/assessments/migrationContextService.ts`
- `src/server/workspace/workspaceService.ts`
- `src/server/user/userProfileService.ts`
- `src/server/admin/adminOpsService.ts`
- `src/server/unlocks/unlockRequestService.ts`

## Archivos modificados

- `src/server/validation/inputLimits.ts`
- `src/server/assessments/formUtils.ts`
- `src/server/assessments/assessmentService.ts`
- `src/server/assessments/infrastructureInputService.ts`
- `src/server/assessments/costRiskService.ts`
- `src/server/assessments/migrationContextService.ts`
- `src/server/workspace/workspaceService.ts`
- `src/server/user/userProfileService.ts`
- `src/server/admin/adminOpsService.ts`
- `src/server/unlocks/unlockRequestService.ts`
- `src/app/dashboard/assessments/new/actions.ts`
- `src/app/dashboard/assessments/[id]/actions.ts`
- `src/app/dashboard/assessments/[id]/report/actions.ts`
- `src/app/dashboard/admin/unlock-requests/actions.ts`
- `src/app/api/assessments/[id]/reports/generate/route.ts`
- `src/app/sign-up/actions.ts`
- `src/app/dashboard/assessments/new/page.tsx`
- `src/app/dashboard/assessments/[id]/page.tsx`
- `src/app/dashboard/assessments/[id]/report/page.tsx`
- `src/app/sign-up/page.tsx`
- `docs/hito-input-validation-1-text-input-length-guards.md`

## Validaciones aplicadas

- `Assessment title`: requerido en acciones de create/update, max 288.
- `Client / company label`: opcional, max 216.
- `Company name` de onboarding y branding PDF: max 216.
- `User profile`: email, name, image URL y auth provider tienen guardas de longitud.
- `Infrastructure notes`: max 3.600.
- `Cost/Risk` labels: short text max 288; currency max 12.
- `Migration context`: campos `text` max 9.000; `single` y `multi` max 288 por valor.
- `Unlock/admin notes`: max 3.600.
- `Upgrade intent message`: max 3.600.
- `Commercial opportunity` admin text: max 3.600 para notas/next action y 288 para status/suggested plan.

## Que no se toco

- DB schema: NO.
- `schema.prisma`: NO.
- Migraciones Prisma: NO.
- Datos historicos: NO.
- Parser RVTools: NO.
- PDF renderer/generacion core: NO.
- AI prompts/providers: NO.
- Auth/password reset/sesiones: NO.
- Headers/middleware/rate limiting/CSP: NO.
- Pricing/cost formulas/scoring: NO.

## Validaciones ejecutadas

- Helper smoke con Node `--experimental-strip-types`: OK.
- `npm run typecheck`: OK.
- `npm run hostinger:diagnose`: OK.
- `npm run lint`: OK con 10 warnings conocidos de `<img>`.
- `npm run build`: OK.

Nota: el build mantiene el warning NFT conocido de Turbopack en `next.config.mjs -> reportStorageService.ts -> reports download route`.

## Riesgos pendientes

- Rate limiting sigue pendiente.
- CSP sigue pendiente.
- Tests unitarios formales para todos los parsers siguen pendientes.
- DB constraints futuras con `@db.VarChar()` siguen pendientes para otro hito.

## Estado final

- DB migration: NO.
- Production deploy: NO.
- Production launched: NO.
