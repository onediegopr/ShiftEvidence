# HITO RETURNING-USER-LOGIN-1B — Production Smoke + Visual Check

Fecha: 2026-05-31

## 1. Resumen ejecutivo

Estado: PARCIAL.

Se valido el smoke HTTP productivo de las rutas de acceso recurrente y rutas publicas principales. Las rutas `/client-login`, `/login`, `/dashboard` y `/dashboard/admin` redirigen correctamente a `/sign-in` sin sesion. Las rutas publicas principales responden `200`.

El hito no queda cerrado como COMPLETO porque el HTML productivo de `/` sigue sirviendo una version estatica anterior desde CDN/cache (`x-nextjs-cache: HIT`, `x-hcdn-cache-status: HIT`, `Age` alto), sin `Client login` ni el bloque `Already have an account?` en la respuesta HTTP directa. No se realizo deploy manual ni cambios en Hostinger.

## 2. Base Git validada

- Branch: `main`.
- HEAD inicial: `672b32837266072ccfa35e79ef23caed58375338`.
- origin/main inicial: `672b32837266072ccfa35e79ef23caed58375338`.
- Working tree inicial: limpio.
- Commit base: `672b328 feat: improve returning user login access`.

## 3. Smoke productivo HTTP

Base URL: `https://shiftevidence.com`.

| Ruta | Resultado | Veredicto |
| --- | --- | --- |
| `/` | `200` | OK como ruta, pero contenido HTML stale para returning-user UX |
| `/client-login` | `307` a `https://shiftevidence.com/sign-in` | OK |
| `/login` | `307` a `https://shiftevidence.com/sign-in` | OK |
| `/sign-in` | `200` | OK |
| `/sign-up` | `200` | OK |
| `/dashboard` | `307` a `https://shiftevidence.com/sign-in` | OK |
| `/dashboard/admin` | `307` a `https://shiftevidence.com/sign-in` | OK |
| `/about` | `200` | OK |
| `/support` | `200` | OK |
| `/pricing` | `200` | OK |
| `/security` | `200` | OK |
| `/partners` | `200` | OK |

## 4. Revisión visual / contenido

### Desktop

- Header desktop: OK en navegador; `Client login` visible junto a `Start Free Check`.
- Footer desktop: OK en navegador; `Client login` visible.
- Home returning-user block: OK en navegador desktop, pero NO confirmado por HTTP directo de `/` por cache stale.
- Support returning-customer block: OK; `Already a customer?` y `Client login` presentes.
- Overflow desktop: no se detecto overflow horizontal en home/support.

### Mobile

- Support mobile: OK; `Already a customer?` y `Client login` visibles, sin overflow horizontal.
- Home mobile: BLOQUEADO/PARCIAL en navegador embebido; la vista devolvio `This page couldn't load` al intentar validar `/` en viewport movil. HTTP movil respondio `200`, pero con HTML stale sin `Client login` ni `Already have an account?`.
- Header mobile: PARCIAL; en support se ve el header y `Client login`, pero home queda afectada por el bloqueo/caché.
- Footer mobile: PARCIAL; no confirmado visualmente en home por bloqueo de carga movil.

## 5. Sesión real

No habia sesion real disponible en Codex para validar flujo autenticado.

- `/client-login` con sesion: pendiente de user-attestation.
- `/login` con sesion: pendiente de user-attestation.
- Resultado sin sesion: ambos redirigen correctamente a `/sign-in`.

## 6. Señal de cache/stale en producción

La respuesta HTTP directa de `/` mostro contenido anterior:

- `Client login`: 0 ocurrencias.
- `Already have an account?`: 0 ocurrencias.
- Footer viejo con recursos como `Subscription Cost Whitepaper`: presente.
- Headers relevantes: `x-nextjs-cache: HIT`, `x-nextjs-prerender: 1`, `Cache-Control: s-maxage=31536000`, `Age: 396261`, `x-hcdn-cache-status: HIT`.

Interpretacion: la funcionalidad de rutas nuevas esta desplegada, pero la pagina estatica `/` sigue servida desde cache/CDN con contenido anterior para parte del trafico HTTP. No se hizo purga, deploy manual ni cambio de configuracion.

## 7. Validaciones técnicas

- `npx prisma validate`: primer intento fallo por ausencia local de `DATABASE_URL`; segundo intento OK con `DATABASE_URL` dummy de proceso, sin tocar DB ni env vars persistentes.
- `npm run typecheck`: OK.
- `npm run lint`: OK.
- `npm run test:run`: OK, 58 files / 278 tests.
- `npm run build`: OK, con warning conocido Turbopack/NFT sobre `localStorageService.ts`.

## 8. Advisor regression check

Validado por alcance/diff:

- `SeniorMigrationAdvisorPanel`: no modificado.
- Runtime/provider routing: no modificado.
- Memory Vault: no modificado.
- Usage/credits: no modificado.
- Resultado: sin regresion esperada por scope.

## 9. Seguridad y límites respetados

- No DB changes.
- No migraciones.
- No `db push`.
- No `migrate deploy`.
- No `migrate reset`.
- No deploy manual.
- No Hostinger config.
- No auth core.
- No billing/pricing.
- No Advisor.
- No PDF/scoring.
- No SupportRequest.
- No force push.
- Full public launch: NO declarado.

## 10. Riesgos pendientes

- Sesion real: pendiente user-attestation para `/client-login` y `/login` con usuario autenticado.
- Home productiva `/`: cache/CDN stale en respuesta HTTP directa.
- Mobile visual home: pendiente revalidacion tras refresh/purga/deploy automatico efectivo.
- Produccion/runtime: rutas OK, pero home estatica requiere refresh de contenido.

## 11. Próximo paso recomendado

Resolver el stale cache/deploy de `/` sin cambios funcionales, idealmente mediante el flujo normal de despliegue/purga autorizado. Luego repetir smoke productivo de:

- `/`
- `/client-login`
- `/login`
- `/sign-in`
- `/dashboard`
- header/footer desktop
- header/footer mobile
- home returning-user block
- support returning-customer block

