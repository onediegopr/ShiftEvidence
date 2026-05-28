# HITO CACHE-1 - HCDN landing purge verification

Fecha: 2026-05-28.

## Objetivo

Verificar si la landing publica limpia:

- `https://shiftevidence.com/`

muestra la seccion nueva:

- `Evaluaciones privadas por industria`

sin depender de query string.

Este hito se limita a cache/CDN/verificacion. No modifica codigo funcional, no toca DB, no toca Hostinger config, no activa OpenAI y no declara full public launch.

## Estado Git inicial

- Branch: `main`.
- HEAD esperado: `eed0fc4 feat: add private industry evaluations landing section`.
- HEAD y `origin/main`: sincronizados en `eed0fc43111af212841f9ad3665f0f1a803a90fa`.
- Working tree inicial: limpio.
- Stash BETA-INVITE-1: preservado, no aplicado.

## Estado de cache antes de accion

### URL limpia

Ruta:

- `https://shiftevidence.com/`

Resultado:

- HTTP status: `200`.
- `x-hcdn-cache-status`: `HIT`.
- `Age`: `171876`.
- `Cache-Control`: `s-maxage=31536000`.
- HTML contiene `Evaluaciones privadas por industria`: NO.

Interpretacion:

- La ruta limpia seguia sirviendo HTML viejo desde HCDN.

### URL con cache-busting

Ruta:

- `https://shiftevidence.com/?industry-evals-check=eed0fc4`

Resultado:

- HTTP status: `200`.
- `x-hcdn-cache-status`: `DYNAMIC`.
- HTML contiene `Evaluaciones privadas por industria`: SI.
- HTML contiene `METALURGICA INDUSTRIAL` / `METALURGICA INDUSTRIAL` equivalente acentuado: SI.
- HTML contiene `ejemplos representativos`: SI.

Interpretacion:

- La app desplegada ya contiene la nueva seccion.
- El bloqueo esta en cache CDN para la URL limpia, no en el codigo ni en el deploy de aplicacion.

## Accion de cache

Purga HCDN:

- No realizada.

Motivo:

- No hay `HOSTINGER_API_TOKEN` disponible en el entorno.
- No hay herramienta Hostinger callable expuesta para purgar HCDN desde esta sesion.
- No se debe tocar Hostinger config ni env vars en este hito.

Redeploy:

- No realizado.

Motivo:

- El codigo ya esta en `origin/main`.
- La URL con query string confirma que la app desplegada sirve la nueva seccion.
- El problema es cache CDN de la URL limpia.

## Revalidacion

Produccion sin sesion:

- `/`: `200`.
- `/demo`: `200`.
- `/sample-report`: `200`.
- `/vmware-to-proxmox-readiness`: `200`.
- `/shiftreadiness`: `200`.
- `/sign-in`: `200`.
- `/dashboard`: `307` a `/sign-in`.
- `/dashboard/admin`: `307` a `/sign-in`.

Seguridad HTML:

- `AIza`: no detectado.
- `DATABASE_URL`: no detectado.
- `GEMINI_API_KEY`: no detectado.
- `OPENAI_API_KEY`: no detectado.
- Claims peligrosos `zero downtime` / `automatic migration`: no detectados en el HTML cache-busted revisado.

## Resultado

Estado del hito:

- PARCIAL / WAITING HCDN EXPIRATION.

Decision:

- No hay problema de codigo.
- No hay problema de rutas productivas.
- La seccion esta disponible en produccion con cache-busting.
- La URL limpia sigue sujeta a cache HCDN antiguo.

## Riesgos pendientes

- Usuarios que entren a `https://shiftevidence.com/` sin query pueden ver temporalmente HTML anterior hasta que HCDN expire o se purgue.
- La visibilidad inmediata en URL limpia requiere purga manual desde hPanel/Hostinger o acceso API seguro.

## Proximo paso recomendado

Opcion recomendada:

1. Purgar cache desde hPanel/Hostinger para el sitio `shiftevidence.com`.
2. Revalidar `https://shiftevidence.com/` sin query.
3. Confirmar que aparece `Evaluaciones privadas por industria`.

Alternativa:

- Esperar expiracion automatica de HCDN y revalidar mas tarde.

