# HITO RETURNING-USER-LOGIN-1C - HOME CACHE PURGE + FINAL VISUAL SMOKE

Fecha: 2026-05-31

## 1. Resumen ejecutivo

Estado: COMPLETO con cache externo pendiente.

Se diagnostico la home productiva `/`, se confirmo que el runtime actualizado sirve el contenido correcto con cache-busting, y se documento que la ruta limpia `/` sigue atrapada en cache HCDN/Next anterior. No habia token ni procedimiento seguro local para purgar HCDN desde Codex, por lo que no se modifico Hostinger.

Durante la revision visual se detecto una rotura real en mobile: el navbar fijo ocupaba varias filas y se superponia con el badge/hero o el contenido inicial de soporte. Se aplico un hotfix minimo de CSS en `src/index.css` para estabilizar el navbar mobile, dar espacio al primer bloque y mantener `Client login` accesible.

## 2. Auditoria inicial

- Branch: `main`.
- HEAD inicial: `548ab84a140919199cebdd5127c3aa58a84214c0`.
- origin/main inicial: `548ab84a140919199cebdd5127c3aa58a84214c0`.
- Working tree inicial: limpio.
- Commit esperado `548ab84`: confirmado.

## 3. Diagnostico cache

### Headers iniciales

| Target | Status | Cache | Age | Contenido actualizado |
| --- | --- | --- | --- | --- |
| `/` | `200` | `x-nextjs-cache: HIT`, `x-hcdn-cache-status: HIT`, `Cache-Control: s-maxage=31536000` | `396690` aprox. | NO |
| `/?v=returning-login-smoke` | `200` | `x-nextjs-cache: HIT`, `x-hcdn-cache-status: DYNAMIC`, `Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate` | n/a | SI |
| `/?cachebust=<timestamp>` | `200` | `x-nextjs-cache: HIT`, `x-hcdn-cache-status: DYNAMIC`, `Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate` | n/a | SI |
| `/client-login` | `307` a `/sign-in` | `x-hcdn-cache-status: DYNAMIC` | n/a | n/a |
| `/login` | `307` a `/sign-in` | `x-hcdn-cache-status: DYNAMIC` | n/a | n/a |
| `/support` | `200` | `x-hcdn-cache-status: DYNAMIC` | n/a | SI |

### Contenido

- `/` sin query: no contiene `Client login` ni `Already have an account?`.
- `/?cachebust=<timestamp>`: contiene `Client login` y `Already have an account?`.
- `/support`: contiene `Client login` y `Already a customer?`.
- `/sign-in` sin query tambien mostro HTML cacheado viejo en HTTP directo, pero el navegador con `__srFresh` mostro `Welcome back`.

### Causa probable

Cache HCDN/Next sobre HTML estatico prerenderizado de `/` y algunas rutas estaticas. La app/rutas dinamicas nuevas estan operativas; el problema no parece ser bug de auth ni ausencia del deploy de rutas, sino cache externo de HTML limpio.

### Accion de purge/refresh

- No se ejecuto purge HCDN: no habia `HOSTINGER_API_TOKEN` en el entorno.
- No se encontro comando seguro local de purge en `package.json` o scripts del repo.
- No se cambio configuracion Hostinger.
- No se hizo deploy manual.
- Se valido con cache-busting query.

## 4. Hotfix minimo aplicado

Archivo: `src/index.css`.

Cambios:

- Se agrego estilo estable para `.navbar-actions`.
- En mobile, se agrego fondo/borde al navbar fijo.
- En mobile, se redujo el gap del navbar y se permitio wrap controlado de acciones.
- En mobile, se aumento el `padding-top` de la hero y del primer `.section` para evitar superposicion con el header fijo.

No se tocaron componentes, auth core, DB, Advisor, pricing, billing, PDF, scoring ni SupportRequest.

## 5. Smoke productivo posterior

Base URL: `https://shiftevidence.com`.

| Ruta | Resultado |
| --- | --- |
| `/` | `200`, sigue stale por HCDN (`HIT`, `Age` alto) |
| `/?cachebust=<timestamp>` | `200`, contenido actualizado |
| `/client-login` | `307` a `/sign-in` |
| `/login` | `307` a `/sign-in` |
| `/sign-in` | `200`, HTTP limpio con cache viejo; navegador/cache-bust muestra `Welcome back` |
| `/sign-up` | `200` |
| `/dashboard` | `307` a `/sign-in` |
| `/dashboard/admin` | `307` a `/sign-in` |
| `/about` | `200` |
| `/support` | `200` |
| `/pricing` | `200` |
| `/security` | `200` |
| `/partners` | `200` |

## 6. Revision visual

### Produccion antes del hotfix

- Desktop home con cache-busting: `Client login` visible; hero OK.
- Desktop support: `Client login` visible; soporte OK.
- Mobile home: navbar accesible, pero habia superposicion entre header/badge/hero.
- Mobile support: navbar accesible, pero el header fijo quedaba demasiado cerca del contenido inicial.

### Local despues del hotfix

Servidor local: `http://127.0.0.1:3011`.

- Mobile home: OK; header sin superposicion, `Client login` accesible, hero legible.
- Mobile support: OK; badge y titulo separados del header, sin rotura evidente.
- No se detecto overflow horizontal en la revision visual.

Produccion requiere despliegue automatico del commit para reflejar el hotfix CSS.

## 7. Sesion real

No habia sesion real disponible desde Codex.

- `/client-login` con sesion: pendiente de user-attestation.
- `/login` con sesion: pendiente de user-attestation.
- Sin sesion: ambos redirigen correctamente a `/sign-in`.

## 8. Validaciones tecnicas

- `npx prisma validate`: OK con `DATABASE_URL` dummy de proceso, sin tocar DB ni env vars persistentes.
- `npm run typecheck`: OK.
- `npm run lint`: OK.
- `npm run test:run`: OK, 58 files / 278 tests.
- `npm run build`: primer intento bloqueado por EPERM local en `.next/server/app/client-login`; se elimino solo `.next` como artefacto generado tras verificar ruta dentro del workspace; segundo intento OK.
- Warning conocido: Turbopack/NFT sobre `localStorageService.ts`.

## 9. Advisor regression check

Validado por diff/scope:

- `SeniorMigrationAdvisorPanel`: no modificado.
- Runtime/provider routing: no modificado.
- Memory Vault: no modificado.
- Usage/credits: no modificado.
- Resultado: sin regresion esperada por scope.

## 10. Seguridad y limites respetados

- No DB changes.
- No migraciones.
- No `prisma db push`.
- No `prisma migrate deploy`.
- No `prisma migrate reset`.
- No auth core.
- No env vars persistentes.
- No billing.
- No pricing.
- No Advisor.
- No provider routing.
- No Memory Vault.
- No PDF generation.
- No scoring.
- No SupportRequest.
- No Hostinger config.
- No deploy manual.
- No force push.
- Full public launch: NO declarado.

## 11. Riesgos pendientes

- Cache/CDN: `/` limpio sigue stale hasta purge/expiracion/deploy efectivo en HCDN.
- Produccion hotfix CSS: pendiente de despliegue automatico del commit.
- Sesion real: pendiente de user-attestation.
- Full public launch: no declarado.

## 12. Proximo paso recomendado

Esperar el despliegue automatico del commit y repetir:

- `/` sin query para confirmar que baja `Age` o cambia el contenido HTML;
- `/?cachebust=<timestamp>` para confirmar runtime fresco;
- visual mobile home/support;
- `/client-login` y `/login` con sesion real, mediante user-attestation.

