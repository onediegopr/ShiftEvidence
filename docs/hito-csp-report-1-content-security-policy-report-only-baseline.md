# HITO CSP-REPORT-1 - Content Security Policy Report-Only Baseline

## Objetivo

Agregar una baseline de `Content-Security-Policy-Report-Only` para observar una futura politica CSP sin bloquear recursos ni romper frontend, auth, PDFs, fuentes, estilos o integraciones actuales.

Blocking CSP: NO.
Production deploy: NO.
Production launched: NO.

## Por que Report-Only

La app ya tiene headers HTTP basicos, pero una CSP bloqueante requiere observacion previa para evitar falsos positivos y roturas en Next.js, estilos inline, scripts generados, assets, PDFs, autenticacion y dependencias externas.

`Content-Security-Policy-Report-Only` permite que el navegador reporte violaciones potenciales sin bloquear la carga de la pagina.

## Por que no se usa CSP bloqueante todavia

No se agrega `Content-Security-Policy` en este hito porque no existe todavia una auditoria completa de:

- scripts inline o generados por Next.js;
- estilos inline;
- fuentes o imagenes externas;
- conexiones externas necesarias;
- posibles integraciones futuras;
- flujo de auth;
- descarga/render de PDFs.

## Politica agregada

Header:

```http
Content-Security-Policy-Report-Only
```

Politica:

```txt
default-src 'self';
base-uri 'self';
frame-ancestors 'none';
object-src 'none';
form-action 'self';
img-src 'self' data: blob: https:;
font-src 'self' data: https:;
style-src 'self' 'unsafe-inline' https:;
script-src 'self' 'unsafe-inline' 'unsafe-eval' https:;
connect-src 'self' https:;
media-src 'self' data: blob: https:;
worker-src 'self' blob:;
manifest-src 'self'
```

## Directivas incluidas

- `default-src 'self'`: baseline por defecto para origen propio.
- `base-uri 'self'`: reduce abuso de etiquetas base.
- `frame-ancestors 'none'`: coherente con `X-Frame-Options: DENY`.
- `object-src 'none'`: bloquearia objetos legacy en enforcement futuro.
- `form-action 'self'`: limita submits a origen propio en enforcement futuro.
- `img-src 'self' data: blob: https:`: permite imagenes propias, data/blob y HTTPS.
- `font-src 'self' data: https:`: permite fuentes propias, data y HTTPS.
- `style-src 'self' 'unsafe-inline' https:`: permite estilos inline temporalmente.
- `script-src 'self' 'unsafe-inline' 'unsafe-eval' https:`: permite compatibilidad temporal con scripts inline/eval.
- `connect-src 'self' https:`: permite conexiones propias y HTTPS.
- `media-src 'self' data: blob: https:`: permite medios propios, data/blob y HTTPS.
- `worker-src 'self' blob:`: permite workers propios/blob.
- `manifest-src 'self'`: limita manifests a origen propio.

## Directivas deliberadamente permisivas

### `unsafe-inline`

Se mantiene temporalmente porque Next.js y componentes actuales pueden depender de estilos o scripts inline. Quitarla requiere auditoria visual y funcional.

### `unsafe-eval`

Se mantiene temporalmente para evitar incompatibilidades en entornos de desarrollo/tooling o dependencias que puedan usar eval. Debe revisarse antes de enforcement.

### `https:`

Se permite como baseline de observacion para no romper imagenes, fuentes o llamadas externas legitimas mientras no exista un inventario completo de dominios.

### `upgrade-insecure-requests`

No se agrega todavia porque no se auditaron todos los recursos externos ni rutas locales.

### `report-uri` / `report-to`

No se agrega endpoint de reportes en este hito. Queda pendiente decidir si se implementa endpoint propio, servicio externo o monitoreo de navegador/QA.

## Headers preservados

Se preservan los headers agregados previamente:

- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`

## Que no se toco

- Auth: NO.
- Dashboard: NO.
- Parser RVTools: NO.
- PDF: NO.
- AI Advisory: NO.
- Storage: NO.
- Rate limiting: NO.
- DB schema: NO.
- UI/copy: NO.
- `.env.local`: NO.
- Hostinger config: NO.

## Validaciones ejecutadas

- `npm run hostinger:diagnose`: OK. No imprime secretos ni conecta a la base.
- `npm run lint`: OK con warnings preexistentes de `@next/next/no-img-element`.
- `npm run typecheck`: OK.
- `npm run build`: OK.

Notas de build:

- El primer intento de build fallo por `ENOSPC: no space left on device`.
- Se elimino solo `.next` generado dentro del workspace y se limpio cache regenerable de npm.
- El segundo build paso correctamente.
- Warning Turbopack/NFT conocido: no bloqueante para este hito.

## Validacion local de rutas y headers

Se levanto `next start` localmente en `http://localhost:3000`.

Rutas:

- `/`: 200 OK.
- `/shiftreadiness`: 200 OK.
- `/sign-in`: 200 OK.
- `/sign-up`: 200 OK.
- `/dashboard`: 307 a `/sign-in`.

Headers confirmados en `/`:

- `X-Frame-Options: DENY`.
- `X-Content-Type-Options: nosniff`.
- `Referrer-Policy: strict-origin-when-cross-origin`.
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`.
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`.
- `Content-Security-Policy-Report-Only`: presente.

## Riesgos pendientes

- Definir endpoint o herramienta para recolectar reportes CSP.
- Auditar dominios externos reales.
- Eliminar gradualmente `unsafe-inline`.
- Eliminar gradualmente `unsafe-eval`.
- Evaluar CSP bloqueante en hito futuro.
- Configurar Upstash real para rate limiting efectivo.

## Proximo paso recomendado

Ejecutar un hito `CSP-ENFORCE-1` solo despues de observar la politica report-only, revisar consola/reportes, inventariar dominios externos y validar auth/dashboard/PDF/demo en navegador.
