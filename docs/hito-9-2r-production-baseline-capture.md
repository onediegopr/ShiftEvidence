# HITO 9.2R - Production Baseline Capture + Public Smoke

## Fecha
2026-05-26

## Objetivo
Capturar baseline productivo sano antes de pushear el commit local pendiente del HITO 12.

## Estado git local
- Branch: `main`
- HEAD local: `83ec9b1 fix: harden RVTools parser canonical VM mapping`
- `origin/main`: `5777b23 docs: map RVTools-like workbook coverage`
- Working tree antes de documentación: limpio
- Local ahead de `origin/main`: 1 commit
- Commit pendiente de push: `83ec9b1 fix: harden RVTools parser canonical VM mapping`
- Push realizado: NO

## Producción - Headers HTTP
Dominio validado:

`https://shiftevidence.com`

Rutas:

| Ruta | Resultado | Evidencia |
| --- | --- | --- |
| `/` | `200 OK` | `X-Powered-By: Next.js`, `x-nextjs-cache: HIT`, `platform: hostinger`, `Server: hcdn` |
| `/shiftreadiness` | `200 OK` | `X-Powered-By: Next.js`, `x-nextjs-cache: HIT`, `platform: hostinger`, `Server: hcdn` |
| `/sign-in` | `200 OK` | `X-Powered-By: Next.js`, `x-nextjs-cache: HIT`, `platform: hostinger`, `Server: hcdn` |
| `/sign-up` | `200 OK` | `X-Powered-By: Next.js`, `x-nextjs-cache: HIT`, `platform: hostinger`, `Server: hcdn` |
| `/dashboard` | `307 Temporary Redirect` | `location: /sign-in`, `X-Powered-By: Next.js` |
| `/dashboard/assessments` | `307 Temporary Redirect` | `location: /sign-in`, `X-Powered-By: Next.js` |

## Producción - HTML
Checks HTML:

| Check | Resultado |
| --- | --- |
| `/` contiene `/_next/` | SI |
| `/` contiene `ShiftReadiness` | SI |
| `/` contiene `Explore ShiftReadiness` | SI |
| `/` contiene pagina 404 Hostinger | NO |
| `/shiftreadiness` contiene `/_next/` | SI |
| `/shiftreadiness` contiene `ShiftReadiness` | SI |
| `/shiftreadiness` contiene `VMware` | SI |
| `/shiftreadiness` contiene `Proxmox` | SI |
| `/shiftreadiness` contiene pagina 404 Hostinger | NO |
| `/sign-in` contiene `/_next/` | SI |
| `/sign-in` contiene contenido auth/sign-in | SI |
| `/sign-in` contiene pagina 404 Hostinger | NO |

## ¿Producción sirve Next real?
SI.

Evidencia:

- headers `X-Powered-By: Next.js`;
- headers `x-nextjs-cache` / `x-nextjs-prerender`;
- HTML con assets `/_next/`;
- rutas App Router publicas sirven 200;
- rutas privadas redirigen con `307` a `/sign-in`;
- no aparece pagina 404 de Hostinger.

## Rutas que funcionan
- `/`: 200
- `/shiftreadiness`: 200
- `/sign-in`: 200
- `/sign-up`: 200

## Rutas protegidas
- `/dashboard`: 307 a `/sign-in`
- `/dashboard/assessments`: 307 a `/sign-in`

## Validación local
- `npm run hostinger:diagnose`: OK
- `npm run typecheck`: OK
- `npm run lint`: OK
- `npm run build`: OK tras limpiar `.next`

Nota:

El primer `npm run build` falló por `EPERM: operation not permitted, unlink .next/static/...`, consistente con lock/cache local de Windows/OneDrive. Se limpió sólo `.next` y el build pasó. No se tocó código, DB, Prisma ni Hostinger.

Warning conocido:

- Turbopack/NFT warning en `next.config.mjs` trazando `src/server/reports/reportStorageService.ts`.

## Qué falta para declarar production launched
No declarar todavía.

Falta validar al menos:

- auth real en producción;
- creación/login de usuario;
- dashboard autenticado;
- DB productiva conectada y estable;
- storage productivo;
- upload evidence;
- parser en producción;
- report preview/PDF en producción;
- secure download;
- entitlement/unlock/admin;
- smoke de errores/logs productivos.

## Decisión sobre HITO 12
Es seguro pushear HITO 12 desde el punto de vista de baseline público:

- producción actual sirve Next real;
- rutas públicas y auth shell responden correctamente;
- rutas privadas protegen con redirect;
- local `typecheck`, `lint` y `build` pasan;
- HITO 12 es cambio de parser local/producto, no Hostinger/deploy.

Push realizado en este hito: NO.

## Fuera de alcance respetado
- Hostinger tocado: NO
- Deploy ejecutado: NO
- Prisma ejecutado: NO
- DB tocada: NO
- Código modificado: NO
- Push realizado: NO
