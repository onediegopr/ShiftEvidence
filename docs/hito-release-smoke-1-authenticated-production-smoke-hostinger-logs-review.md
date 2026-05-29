# Hito RELEASE-SMOKE-1 - Authenticated Production Smoke & Hostinger Logs Review

## Objetivo

Cerrar la validacion operativa del release productivo despues de `RELEASE-APPLY-1`, revisando estado DB, runtime publico, guards privados, posibilidad de smoke autenticado/admin, logs/restart Hostinger y estabilidad post-release.

## Resultado Ejecutivo

Estado: parcial / bloqueado para smoke autenticado.

Validado:

- Git local limpio salvo docs pendientes.
- DB productiva con migraciones up to date.
- Smoke publico productivo OK.
- Guards privados sin sesion redirigen a `/sign-in`.
- Monitoreo HTTP extendido sin 500/503/504.
- No P0/P1 detectado desde las validaciones disponibles.

Bloqueado:

- Smoke autenticado real.
- Smoke admin real.
- Upload/evidence real.
- Report/PDF productivo real.
- Logs Hostinger.
- Restart Hostinger.

Motivo:

- No hay canal Hostinger API/SSH/app-root disponible desde este shell.
- Chrome esta instalado y la extension Codex esta habilitada, pero el native host de la extension no esta registrado en Windows, por lo que no se pudo controlar una sesion real ni reutilizar cookies.
- No se dispuso de credenciales/cookies de produccion en el contexto.

## Git / Docs

- Branch: `main`.
- HEAD inicial: `2b4376a docs: record controlled production release`.
- `origin/main`: `5fe956e docs: add controlled release readiness plan`.
- Ahead inicial: 1 commit, solo docs de `RELEASE-APPLY-1`.
- Behind: 0.
- Working tree inicial: limpio.
- Stash preservado: `stash@{0}: On main: park beta invite docs before functional readiness`.

## DB / Migraciones

Comando ejecutado en modo lectura:

```bash
npx prisma migrate status
```

Salida sanitizada:

- 15 migraciones encontradas.
- `Database schema is up to date!`
- Drift: no reportado.
- Failed migrations: no reportadas.

Resultado:

- DB productiva queda confirmada como actualizada despues de `RELEASE-APPLY-1`.
- No se ejecutaron migraciones nuevas.
- No se ejecuto `migrate deploy`.
- No se ejecuto `migrate reset`.
- No se ejecuto `db push`.

## Smoke Publico

Dominio:

```text
https://shiftevidence.com
```

Rutas validadas:

| Ruta | Resultado |
| --- | --- |
| `/` | 200 |
| `/shiftreadiness` | 200 |
| `/sign-in` | 200 |
| `/sign-up` | 200 |
| `/sample-report` | 200 |

Validaciones adicionales:

- Assets `/_next/*`: detectados.
- Copy de producto `ShiftReadiness` / `VMware` / `Proxmox`: detectado.
- Hostinger 404: no observado.
- Error 500: no observado.

## Guards Privados sin Sesion

Validacion HEAD sin seguir redirect:

| Ruta | Resultado |
| --- | --- |
| `/dashboard` | `307 Temporary Redirect` a `/sign-in` |
| `/dashboard/assessments` | `307 Temporary Redirect` a `/sign-in` |
| `/dashboard/admin` | `307 Temporary Redirect` a `/sign-in` |
| `/dashboard/admin/pricing` | `307 Temporary Redirect` a `/sign-in` |

Resultado:

- Auth guard responde correctamente para rutas privadas sin sesion.
- Admin guard sin sesion no expone contenido.

## Logs / Restart Hostinger

Logs revisados: no.

Restart ejecutado: no.

Motivo:

- No hay `HOSTINGER_API_TOKEN` disponible.
- No hay variables SSH/app-root disponibles.
- No hay herramienta remota disponible desde este shell para leer logs, reiniciar proceso o ejecutar comandos en Hostinger.

Resultado:

- No se modifico Hostinger.
- No se reinicio la app.
- No se cambiaron env vars.
- No se borraron archivos.

## Smoke Autenticado

Estado: bloqueado.

Intento:

- Se intento conectar con Chrome para reutilizar una sesion real.
- La llamada de navegador no respondio dentro del timeout.
- Se ejecutaron chequeos locales de Chrome/extension.

Hallazgos:

- Chrome instalado: si.
- Chrome corriendo: si.
- Codex Chrome Extension instalada/habilitada: si.
- Native host manifest/registry: incorrecto; falta registry key `HKCU\Software\Google\Chrome\NativeMessagingHosts\com.openai.codexextension`.

Impacto:

- No se pudo controlar una sesion real.
- No se inspeccionaron cookies.
- No se usaron credenciales.
- No se pudo validar dashboard autenticado, assessments, assessment detail ni Completion Center.

## Licensing Smoke

Estado: bloqueado por falta de sesion autenticada.

No validado en navegador:

- Panel Licensing & Cost Exposure.
- Fallbacks.
- Disclaimers.
- Financial Confidence separado de Technical Evidence Confidence.

No se tocaron snapshots.
No se aprobo pricing real.
No se modifico pricing.

## Client Context Smoke

Estado: bloqueado por falta de sesion autenticada.

No validado en navegador:

- Tab `Client Context`.
- Textarea.
- Customer Context Intelligence.
- Raw text leakage en report preview/PDF real.

No se guardo texto.
No se ejecuto AI.
No se mutaron assessments.

## Admin Smoke

Estado: bloqueado por falta de sesion admin.

Validado sin sesion:

- `/dashboard/admin` redirige a `/sign-in`.
- `/dashboard/admin/pricing` redirige a `/sign-in`.

No validado:

- Admin dashboard autenticado.
- Pricing admin autenticado.
- Snapshots list.
- Workflow approve/reject.

No se modifico pricing real.

## Upload / Evidence Smoke

Estado: pendiente.

Motivo:

- Requiere usuario autenticado y archivo QA seguro.
- No habia sesion disponible.

No se subieron archivos.
No se borro storage.
No se mutaron datos.

## Report / PDF Smoke

Estado: pendiente para flujo autenticado real.

Motivo:

- Requiere assessment/report access con sesion.

Validacion indirecta:

- `/sample-report`: 200.
- Build local previo OK.
- DB migrada OK.

No validado:

- Report preview autenticado.
- PDF generation productivo.
- PDF download productivo.
- Secciones Licensing/Customer Context dentro de PDF real.

## Monitoreo Post-Release

Se ejecuto monitoreo HTTP con 10 iteraciones entre `2026-05-29T18:16:01-03:00` y `2026-05-29T18:25:18-03:00`.

Rutas monitoreadas:

- `/`
- `/shiftreadiness`
- `/sign-in`
- `/sign-up`
- `/sample-report`
- `/dashboard`
- `/dashboard/admin/pricing`

Resultado:

- Todas las iteraciones devolvieron 200 cuando se siguieron redirects.
- No se observaron 500.
- No se observaron 503.
- No se observaron 504.
- No se observo caida publica.

## Hallazgos

| Severidad | Hallazgo | Accion |
| --- | --- | --- |
| P0 | Ninguno detectado. | No rollback. |
| P1 | Ninguno detectado desde pruebas disponibles. | No rollback. |
| P2 | Smoke autenticado/admin/upload/PDF bloqueado por falta de sesion/control Chrome. | Reintentar con Chrome native host corregido o sesion manual. |
| P3 | Ninguno. | N/A |

## Rollback

Rollback usado: no.

Motivo:

- DB up to date.
- Smoke publico OK.
- Guards privados OK.
- Monitoreo sin 500/503/504.
- No P0/P1 detectado.

## Riesgos Pendientes

- Smoke autenticado real.
- Smoke admin real.
- Upload/evidence real.
- Report/PDF productivo real.
- Logs Hostinger.
- Pricing real aprobado.
- QA profunda con datos reales controlados.
- PDF visual real.
- Prompt tuning con casos reales.

## Estado Final

- Controlled production release: parcialmente validado.
- DB/migrations: validado.
- Public runtime: validado.
- Authenticated production flow: bloqueado por sesion/herramienta.
- Full public launch: no declarado.

## Proximo Paso Recomendado

Corregir el acceso de Chrome Extension/native host o ejecutar smoke manual con sesion real/admin y registrar evidencia:

```text
RELEASE-SMOKE-1B - Manual authenticated production smoke evidence
```

Ese hito debe cerrar dashboard, assessments, admin pricing, upload/evidence y report/PDF con sesion real.
