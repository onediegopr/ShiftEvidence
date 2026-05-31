# HITO RETURNING-USER-LOGIN-1 - Returning User Access & Client Login UX

## 1. Problema detectado

La experiencia publica estaba demasiado orientada a primera conversion. Un usuario recurrente podia llegar al producto sin una entrada clara para volver a su workspace, dashboard, assessments, reportes, Advisor o soporte autenticado.

## 2. Objetivo

Agregar una capa publica sobria de acceso para clientes existentes, sin tocar auth core, providers, DB, billing, pricing, Advisor, PDF ni scoring.

## 3. Cambios implementados

- Header publico:
  - se agrego link visible `Client login`;
  - se mantuvo la CTA comercial `Start Free Check`.
- Footer:
  - se agrego `Client login` en recursos junto a About, Support, Partners y Contact.
- Landing/home:
  - se agrego bloque discreto `Already have an account?`;
  - CTA `Go to client login`;
  - copy orientado a continuar assessment, evidencia, reportes, soporte y Advisor.
- Support page:
  - se agrego bloque `Already a customer?`;
  - CTA `Client login`;
  - link a dashboard.
- Sign-in:
  - microcopy actualizado a `Welcome back`;
  - orientado a workspace, assessments, reports, support requests y migration advisor.

## 4. Rutas nuevas / alias

- `/client-login`
- `/login`

Ambas rutas usan server redirect seguro:

- sin sesion: redirect a `/sign-in`;
- con sesion: redirect a `/dashboard`.

No se duplico logica de auth ni se modifico Better Auth/config sensible.

## 5. Comportamiento de redirects validado

Validacion local sin sesion:

- `/client-login`: 307 a `/sign-in`.
- `/login`: 307 a `/sign-in`.
- `/dashboard`: 307 a `/sign-in`.
- `/dashboard/admin`: 307 a `/sign-in`.
- `/sign-in`: 200.
- `/sign-up`: 200.

Comportamiento con sesion real: pendiente de user-attestation por falta de sesion accesible desde Codex.

## 6. Validaciones publicas

Validado localmente:

- `/`: 200.
- `/about`: 200.
- `/support`: 200.
- `/pricing`: 200.
- `/security`: 200.
- `/partners`: 200.
- `/client-login`: redirect correcto.
- `/login`: redirect correcto.

Contenido verificado:

- `Client login`.
- `Already have an account?`.
- `Go to client login`.
- `Already a customer?`.
- `Welcome back.`

## 7. Validaciones tecnicas

- `npx prisma validate`: OK con `DATABASE_URL` dummy temporal de proceso.
- `npm run typecheck`: OK.
- `npm run lint`: OK.
- `npm run test:run`: OK, 58 files / 278 tests.
- `npm run build`: OK.
- Warning conocido: Turbopack/NFT sobre `localStorageService.ts`.

## 8. Advisor regression check

- `SeniorMigrationAdvisorPanel`: no modificado.
- Advisor runtime/provider routing: no modificado.
- Project Memory Vault: no modificado.
- Usage/credits: no modificado.
- Prompt context/persistence: no modificado.

## 9. Fuera de alcance respetado

- Sin cambios DB.
- Sin migraciones.
- Sin `db push`, `migrate deploy` ni `migrate reset`.
- Sin cambios en auth core/providers.
- Sin cambios en billing/pricing.
- Sin deploy manual.
- Sin Hostinger config/env vars.
- Sin refactor global ni rediseño completo.

## 10. Riesgos pendientes

- Validar comportamiento con sesion real:
  - `/client-login` debe terminar en `/dashboard`.
  - `/login` debe terminar en `/dashboard`.
- Revisar visualmente mobile nav con usuario real/dispositivo real.
- Confirmar produccion despues de push/deploy automatico si aplica.

## 11. Proximo paso

- Smoke productivo rapido post-push para `/client-login`, `/login`, `/sign-in`, `/dashboard` y header/footer.
- Luego user-attestation con sesion real para confirmar retorno a dashboard.
