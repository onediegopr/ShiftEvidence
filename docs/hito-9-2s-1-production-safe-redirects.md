# HITO 9.2S.1 - Production-Safe Redirects

## Objetivo

Corregir redirects productivos de report/PDF para que no usen el host interno `0.0.0.0:3000` detras de Hostinger.

## Contexto

HITO 9.2S valido que produccion autenticada funciona parcialmente:

- Auth: OK.
- Dashboard: OK.
- Assessment CRUD: OK.
- Intake/assumptions: OK.
- Upload gate: OK.
- Evidence upload/storage: OK.
- Parser/risk/report preview: OK.
- PDF preview generation/download autenticado: funcional.

El bloqueo era el redirect post-submit de PDF y el redirect de download sin sesion.

## Bug detectado

Sintomas:

- Despues de generar PDF, el navegador terminaba en `https://0.0.0.0:3000/dashboard/assessments/<id>/report?generated=1`.
- Download de report sin sesion redirigia a `https://0.0.0.0:3000/sign-in`.

Impacto:

- El PDF se generaba y se podia descargar si se volvia manualmente a la URL publica.
- La UX productiva quedaba rota por `ERR_ADDRESS_INVALID`.
- Production launched debe seguir en NO hasta revalidar post-push.

## Causa raiz

Las rutas API de report construian redirects absolutos con `new URL(path, request.url)`.

En Hostinger/proxy, `request.url` puede contener el host interno `0.0.0.0:3000`, por lo que el redirect se propagaba al navegador.

## Archivos afectados

- `src/server/url/publicAppUrl.ts`
- `src/app/api/assessments/[id]/reports/generate/route.ts`
- `src/app/api/assessments/[id]/reports/[reportId]/download/route.ts`
- `src/app/api/assessments/[id]/reports/[reportId]/delete/route.ts`

## Estrategia de fix

- No usar `request.url` como base publica en report flows.
- Centralizar URL publica en `getPublicUrl`.
- Resolver base publica en este orden:
  1. `NEXT_PUBLIC_APP_URL`
  2. `BETTER_AUTH_URL`
  3. `http://localhost:3000`
- Mantener rutas internas con paths estables:
  - `/sign-in`
  - `/dashboard/assessments/<id>/report`

## Helper public URL

Se agrego `src/server/url/publicAppUrl.ts`:

- `getPublicAppUrl()`
- `getPublicUrl(path?: string)`

El helper normaliza trailing slash y path con slash unico. No imprime secretos ni lee Hostinger config.

## Validacion local

Validaciones tecnicas:

- `npm run hostinger:diagnose`: OK.
- `npm run typecheck`: OK.
- `npm run lint`: OK.
- `npm run build`: OK.

Warning conocido:

- Turbopack/NFT warning en `reportStorageService`, preexistente.

Rutas locales:

- `/`: `200 OK`
- `/shiftreadiness`: `200 OK`
- `/sign-in`: `200 OK`
- `/sign-up`: `200 OK`
- `/dashboard`: `307` a `/sign-in`
- `/dashboard/assessments`: `307` a `/sign-in`

Redirects locales sin sesion:

- `POST /api/assessments/test-assessment/reports/generate`: `303` a `http://localhost:3000/sign-in`
- `GET /api/assessments/test-assessment/reports/test-report/download`: `307` a `http://localhost:3000/sign-in`
- `POST /api/assessments/test-assessment/reports/test-report/delete`: `303` a `http://localhost:3000/sign-in`

`0.0.0.0`: ausente localmente en redirects validados.

## Validacion produccion

Re-smoke productivo reducido ejecutado despues de push/autodeploy.

Rutas publicas:

- `/`: `200 OK`.
- `/shiftreadiness`: `200 OK`.
- `/sign-in`: `200 OK`.
- `/sign-up`: `200 OK`.
- `/dashboard`: `307` a `/sign-in` sin sesion.

Browser/authenticated report flow:

- Usuario QA: `qa-production-smoke-1779875983103@example.com`.
- Assessment incompleto: `cmpnw7n72000b497z7oax65ro`.
- Assessment completo: `cmpnw843p000u497zmb27voab`.
- Evidence upload/download autenticado: OK.
- Parser/risk/report preview: OK.
- PDF generation post-submit: OK.
- Redirect post-generate: `https://shiftevidence.com/dashboard/assessments/cmpnw843p000u497zmb27voab/report?generated=1`.
- `wrongInternalRedirect`: `null`.
- Report id: `cmpnwa2um001249b5ynb0wdqe`.
- Download PDF autenticado: `200 OK`, `application/pdf`, signature `%PDF-`.
- Download PDF sin sesion: `307` a `https://shiftevidence.com/sign-in`.
- `0.0.0.0`: ausente en report/PDF redirects revalidados.

## Riesgos pendientes

- Admin/entitlement productivo sigue pendiente de validacion completa.
- QA data productiva del re-smoke queda marcada como safe to delete.

## Proximo paso recomendado

Ejecutar HITO 9.2S.2 o re-smoke autenticado reducido final para admin/entitlement/logs antes de cualquier decision de launch.
