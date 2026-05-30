# HITO BROWSER-RECOVERY-1 - Codex Chrome Connector and Hostinger/Admin Access

## Executive Summary

Estado: `BLOQUEADO`.

Se diagnostico el canal Codex <-> Chrome para recuperar acceso a hPanel/Hostinger y smoke admin autenticado. No se modifico codigo de producto, no se toco DB, no se aplicaron migraciones, no se hizo deploy, no se editaron env vars y no se reintento Storage release.

Resultado:

- Chrome esta instalado y corriendo.
- El perfil seleccionado es `Default`.
- La Codex Chrome Extension esta instalada y habilitada.
- El manifest del Native Messaging Host existe.
- La registry key HKCU de Chrome NativeMessagingHosts existe y apunta al manifest.
- El ejecutable `extension-host.exe` existe.
- Aun asi, Codex no puede adquirir el browser backend: `Browser is not available: extension`.

Conclusion:

- El bloqueo no es por ausencia evidente de Chrome, extension, manifest o executable.
- El canal native messaging sigue no operativo para Codex.
- La reparacion segura recomendada es reinstalar/reparar el plugin Chrome desde la UI oficial de Codex y reiniciar Chrome/Codex.

## Git

Estado inicial:

- Branch: `main`.
- Working tree: limpio.
- HEAD/origin: `7fe2cba docs: record blocked admin recovery confirmation`.
- Divergencia: no.
- Stash preservado: `stash@{0}: On main: park beta invite docs before functional readiness`.

No se tocaron archivos de producto.

## Diagnostico Chrome Connector

Checks ejecutados:

- `chrome-is-running.js --json`.
- `installed-browsers.js --json`.
- `check-extension-installed.js --json`.
- `check-native-host-manifest.js --json`.
- `reg query HKCU\Software\Google\Chrome\NativeMessagingHosts\com.openai.codexextension`.
- lectura segura del manifest `com.openai.codexextension.json`.
- verificacion de existencia de `extension-host.exe`.

Resultados:

| Item | Estado |
| --- | --- |
| Chrome instalado | si |
| Chrome corriendo | si |
| Chrome default browser | si |
| Perfil seleccionado | `Default` |
| Codex Chrome Extension instalada | si |
| Codex Chrome Extension habilitada | si |
| Extension id | `hehggadaopoacecdllhhajmbjkdcmajg` |
| Native host esperado | `com.openai.codexextension` |
| Manifest existe | si |
| Registry HKCU existe | si |
| Registry HKCU default apunta al manifest | si |
| Executable host existe | si |
| Chrome controlable por Codex | no |

Manifest observado:

- `name`: `com.openai.codexextension`.
- `type`: `stdio`.
- `allowed_origins`: contiene la Codex Chrome Extension.
- `path`: apunta a `extension-host.exe` dentro del plugin Chrome cacheado.

No se imprimieron cookies, tokens, credenciales ni secretos.

## Reparacion

No se realizo reparacion manual de registry/manifest.

Motivo:

- La configuracion local parece presente, pero el backend sigue no disponible.
- La reparacion del Native Messaging Host debe ejecutarse desde el flujo oficial del plugin para evitar registrar paths inconsistentes o romper futuras actualizaciones.
- No se deben tocar perfiles/cookies ni instalaciones de Chrome manualmente desde este hito.

Procedimiento manual recomendado:

1. Abrir la UI de plugins de Codex.
2. Reinstalar o reparar el plugin `Chrome`.
3. Cerrar y reabrir Chrome.
4. Cerrar y reabrir Codex si la UI lo recomienda.
5. Volver a ejecutar el diagnostico de Chrome connector.
6. Confirmar que `browser.tabs.list()` o equivalente ya responde.

## Validacion Chrome

Intento final:

- Resultado: `Browser is not available: extension`.

Por lo tanto:

- No se pudo abrir `https://shiftevidence.com` desde Chrome controlado por Codex.
- No se pudo leer DOM con sesion real.
- No se pudo abrir hPanel desde navegador controlado.
- No se pudo validar `/dashboard/admin` autenticado.

## hPanel / Hostinger

No validado en este hito.

Pendiente despues de recuperar Chrome:

- Abrir hPanel/Hostinger.
- Identificar proyecto `shiftevidence.com`.
- Confirmar Deployments visibles.
- Confirmar logs visibles.
- Confirmar restart/redeploy visible.
- Confirmar env vars visibles sin imprimir valores.

## Deploy Hotfix

No confirmado visualmente en Hostinger por bloqueo del navegador.

Pendiente:

- Confirmar si `b2b69f8` o commit posterior esta `Completed Current`.
- Confirmar si el build remoto ejecuto `prisma generate && next build`.

## Admin Smoke

No validado con sesion real.

Pendiente:

- `/dashboard`.
- `/dashboard/admin`.
- `/dashboard/admin/pricing`.
- Confirmar si admin carga completo o sigue fallback.
- Revisar logs si aparece `admin_console_data_unavailable`, `PrismaClientValidationError` o digest `3639664386`.

## Seguridad

Cumplido:

- No codigo de producto modificado.
- No DB tocada.
- No migraciones.
- No deploy.
- No env vars modificadas.
- No datos/storage borrados.
- No cookies/credenciales inspeccionadas.
- No secretos impresos.
- No full public launch.

## Decision

El hito queda bloqueado por canal Chrome/Codex no operativo.

No hay evidencia suficiente para reintentar `PROD-HOTFIX-1B` ni Storage release desde Codex hasta recuperar el conector.

Proximo paso recomendado:

1. Reinstalar/reparar el plugin Chrome desde la UI de Codex.
2. Reiniciar Chrome y Codex.
3. Reintentar este hito empezando por `check-native-host-manifest.js --json`.
4. Si Chrome queda controlable, continuar con hPanel y admin smoke.
