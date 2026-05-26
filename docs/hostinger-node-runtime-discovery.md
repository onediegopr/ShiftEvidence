# Hostinger Node Runtime Discovery

## Objetivo

Descubrir la configuracion real de Hostinger para `shiftevidence.com` sin ejecutar deploy, sin reiniciar procesos, sin modificar `public_html`, sin tocar variables productivas y sin cambiar codigo de producto.

## Fecha

2026-05-26

## Estado general

Estado: PARCIAL

Se pudo inspeccionar el dominio publico y el repositorio local. No hubo acceso a hPanel, SSH, SFTP, File Manager, Node App Manager ni logs reales de Hostinger desde este entorno.

## Dominio

- Dominio: `https://shiftevidence.com`
- DNS observado:
  - A: `147.93.65.5`
  - AAAA: `2a02:4780:13:1295:0:2628:44f:10`
- HTTPS: responde.
- `/`: `200 OK`
- Servidor: `LiteSpeed`
- Headers observados:
  - `platform: hostinger`
  - `panel: hpanel`
- `Content-Type`: `text/html`
- `Last-Modified`: `Mon, 25 May 2026 11:29:13 GMT`

## Public HTML status

Hallazgo publico:

- `/` responde `200 OK`.
- El HTML de `/` tiene titulo: `Shift Evidence | VMware to Proxmox Migration Audit`.
- El HTML de `/` contiene `Shift Evidence`.
- El HTML de `/` no contiene `ShiftReadiness`.
- El HTML de `/` no contiene `__next` ni rutas `/_next/`.
- El HTML de `/` contiene indicadores de app estatica tipo Vite/root HTML.
- `/shiftreadiness` responde `404 Not Found`.
- `/sign-in` responde `404 Not Found`.
- `/sign-up` responde `404 Not Found`.
- `/dashboard` responde `404 Not Found`.

Interpretacion:

- El dominio esta sirviendo contenido estatico desde LiteSpeed/Hostinger.
- No hay evidencia publica de que `shiftevidence.com` este sirviendo la app Next.js/Node actual.
- Es probable que el contenido actual venga desde `public_html` o un document root estatico equivalente.

No se modifico `public_html`.

## Node.js App status

No revisable desde este entorno.

Pendiente validar en hPanel:

- si existe una Node.js App configurada;
- si esa Node.js App esta asociada a `shiftevidence.com`;
- Application Root;
- Application URL;
- Startup File;
- App mode;
- Node version;
- variables de entorno;
- botones Start/Restart/Stop;
- logs;
- estado del proceso.

## Application root

No disponible.

Debe obtenerse en Hostinger:

- hPanel -> Websites -> Manage -> Node.js;
- o File Manager;
- o SSH con `pwd` dentro del directorio de la app.

## Startup file

No disponible.

Pendiente confirmar si Hostinger espera:

- `npm run start`;
- un startup file como `server.js`;
- Passenger/Node App Manager;
- puerto asignado por `process.env.PORT`.

## Node version

No disponible en Hostinger.

Local:

- Node: `v22.22.0`
- npm: `10.9.4`

Pendiente confirmar en Hostinger que Node `>=22` este disponible o seleccionable.

## Deploy options

No revisables desde este entorno.

Pendiente confirmar:

- Git deployment disponible;
- repositorio conectado;
- branch configurada;
- auto deploy;
- manual deploy;
- ruta destino;
- install command;
- build command;
- post-deploy command;
- SSH deploy;
- SFTP deploy;
- File Manager deploy.

Recomendacion inicial:

- No reemplazar `public_html` hasta confirmar si se configurara Node SSR o si se usara un reverse/proxy/app manager.
- Preferir un Application Root separado para la app Node y storage fuera del arbol publico.

## Env vars inventory

No se pudieron revisar variables productivas en Hostinger.

Local `.env.local` existe, pero usa configuracion local:

- `BETTER_AUTH_URL`: localhost
- `NEXT_PUBLIC_APP_URL`: localhost
- `HOSTINGER_STORAGE_ROOT`: presente, pero no representa la ruta absoluta productiva

Variables requeridas en Hostinger:

- `DATABASE_URL`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL=https://shiftevidence.com`
- `NEXT_PUBLIC_APP_URL=https://shiftevidence.com`
- `HOSTINGER_STORAGE_ROOT=/home/<hostinger-user>/shiftreadiness-storage`
- `MAX_UPLOAD_SIZE_MB=50`
- `ADMIN_EMAILS=<admin-real>`

No escribir secretos en documentacion ni chats.

## Storage root recommendation

Ruta recomendada:

```text
/home/<hostinger-user>/shiftreadiness-storage
```

Pendiente obtener `<hostinger-user>` desde:

- File Manager;
- hPanel;
- SSH con `pwd`.

Reglas:

- no usar `public_html`;
- no usar `.next`;
- no usar `node_modules`;
- no usar carpetas reemplazadas por deploy;
- mantenerlo privado;
- validar write/read/delete antes del smoke real.

## Logs/start/restart

No disponibles desde este entorno.

Pendiente confirmar en Hostinger:

- Start disponible;
- Restart disponible;
- Stop disponible;
- logs disponibles;
- ruta o panel de logs;
- como preservar logs antes de fixes;
- como verificar proceso vivo;
- como volver al estado anterior.

No se ejecuto start, restart ni stop.

## Next.js compatibility

No confirmada en Hostinger.

Pendiente validar:

- soporte Node SSR;
- soporte Next.js App Router;
- si `next start` esta permitido;
- si requiere `server.js`;
- si requiere Passenger;
- puerto asignado;
- si expone `process.env.PORT`;
- si necesita `.htaccess` o proxy interno.

Riesgo principal:

- El dominio esta sirviendo HTML estatico y rutas Next.js devuelven `404`, por lo que el dominio no parece estar conectado a la app Next.js/Node.

## Riesgos

- Reemplazar `public_html` podria romper la web actual.
- Configurar Node App sin conocer Application Root/Startup File podria dejar el dominio caido.
- Usar localhost en `BETTER_AUTH_URL` o `NEXT_PUBLIC_APP_URL` romperia auth en produccion.
- Poner storage en `public_html`, `.next` o `node_modules` seria inseguro o no persistente.
- Ejecutar deploy sin logs ni rollback bloquearia diagnostico.

## Decision para HITO 9.2

No reintentar HITO 9.2 todavia.

Falta confirmar:

- acceso hPanel/SSH/SFTP/File Manager;
- si existe Node.js App;
- Application Root;
- Startup File;
- Node version >=22;
- metodo deploy;
- metodo start/restart;
- logs;
- storage root absoluto;
- env vars productivas;
- rollback operativo.

## Datos pendientes

- hPanel access;
- SSH/SFTP availability;
- public_html contents reales desde File Manager;
- Node App Manager status;
- Application Root;
- Startup File;
- Node version Hostinger;
- logs path;
- storage absolute home path;
- deploy method.

## Recomendacion final

Antes de HITO 9.2, completar `docs/hostinger-production-access-gate.md` con datos reales del panel Hostinger. El dominio `https://shiftevidence.com` responde, pero actualmente no demuestra estar sirviendo la app Next.js/Node de ShiftReadiness.

## Nota HITO 9.1.7

Local public routing and the landing CTA were validated after HITO 9.1.7:

- `/` returns `200` locally.
- `/shiftreadiness` returns `200` locally.
- `/sign-in` returns `200` locally.
- The landing page includes `New product`, `ShiftReadiness`, and `Explore ShiftReadiness` with `href="/shiftreadiness"`.

Production still serves static Hostinger/LiteSpeed HTML and does not expose the Next.js routes. This hito does not change Hostinger, DNS, `public_html`, env vars, or deployment state.
