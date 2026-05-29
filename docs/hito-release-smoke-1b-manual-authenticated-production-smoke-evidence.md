# Hito RELEASE-SMOKE-1B - Manual Authenticated Production Smoke Evidence

## Objetivo

Ejecutar o registrar evidencia de smoke autenticado manual en produccion para cerrar la validacion operativa pendiente del release productivo de ShiftReadiness.

## Resultado Ejecutivo

Estado: bloqueado para smoke autenticado manual.

Validado:

- Git local sincronizado con `origin/main`.
- Working tree limpio al inicio.
- DB productiva con `Database schema is up to date!`.
- Smoke publico OK.
- Guards privados sin sesion redirigen a `/sign-in`.
- Monitoreo HTTP corto sin 500/503/504.
- No P0/P1 detectado desde validaciones disponibles.

Bloqueado:

- Dashboard autenticado.
- Assessments autenticados.
- Assessment detail.
- Completion Center autenticado.
- Licensing & Cost Exposure en sesion real.
- Client Context en sesion real.
- Admin dashboard.
- Admin pricing.
- Upload/evidence.
- Report preview y PDF real.
- Logs/restart Hostinger.

Motivo:

- No se proporcionaron resultados manuales de una sesion real/admin.
- No habia credenciales/cookies disponibles en el contexto.
- Chrome no fue controlable desde Codex porque el native host registry key sigue ausente en Windows.

## Git / Docs

- Branch: `main`.
- HEAD inicial: `245a7ff docs: record authenticated production smoke`.
- `origin/main`: `245a7ff docs: record authenticated production smoke`.
- Ahead/behind inicial: 0 / 0.
- Working tree inicial: limpio.
- Stash preservado: `stash@{0}: On main: park beta invite docs before functional readiness`.

## DB / Migraciones

Comando ejecutado:

```bash
npx prisma migrate status
```

Salida sanitizada:

- 15 migraciones encontradas.
- `Database schema is up to date!`
- Drift: no reportado.
- Failed migrations: no reportadas.

Reglas respetadas:

- No se ejecuto `migrate deploy`.
- No se ejecuto `migrate reset`.
- No se ejecuto `db push`.
- No se crearon migraciones.

## Smoke Publico

Dominio:

```text
https://shiftevidence.com
```

| Ruta | Resultado |
| --- | --- |
| `/` | 200 |
| `/shiftreadiness` | 200 |
| `/sign-in` | 200 |
| `/sign-up` | 200 |
| `/sample-report` | 200 |

Validaciones:

- Assets `/_next/*`: detectados.
- Copy `ShiftReadiness` / `VMware` / `Proxmox`: detectado.
- Hostinger 404: no observado.
- 500: no observado.

## Guards Privados sin Sesion

| Ruta | Resultado |
| --- | --- |
| `/dashboard` | `307 Temporary Redirect` a `/sign-in` |
| `/dashboard/assessments` | `307 Temporary Redirect` a `/sign-in` |
| `/dashboard/admin` | `307 Temporary Redirect` a `/sign-in` |
| `/dashboard/admin/pricing` | `307 Temporary Redirect` a `/sign-in` |

Resultado:

- Auth guard funcionando para rutas privadas sin sesion.
- Admin guard no expone contenido sin sesion.

## Smoke Autenticado User

Estado: bloqueado.

No validado:

- `/dashboard`.
- `/dashboard/assessments`.
- Assessment detail.
- Completion Center.
- Evidence tab.
- Migration context/questions.
- Report tab.

Motivo:

- No hay sesion manual reportada.
- No hay credenciales/cookies disponibles.
- Chrome automation no puede comunicarse con el navegador por native host registry key ausente.

## Licensing Smoke

Estado: bloqueado por falta de sesion autenticada.

No validado:

- Panel `Licensing & Cost Exposure`.
- Estados/fallbacks.
- CTA `Run financial analysis`.
- Disclaimer `not a vendor quote`.
- Separacion Financial Confidence vs Technical Evidence Confidence.
- Report preview con licensing vacio/skipped.

Reglas respetadas:

- No se aprobo pricing real.
- No se crearon snapshots.
- No se modifico pricing.

## Client Context Smoke

Estado: bloqueado por falta de sesion autenticada.

No validado:

- Tab `Client Context`.
- Textarea.
- Word/character counter.
- Save draft / submit / skip.
- Customer Context Intelligence.
- Analyze/re-run.
- Raw text leakage check en preview/PDF real.

Reglas respetadas:

- No se guardo contexto.
- No se ejecuto AI real.
- No se mutaron assessments.

## Admin Smoke

Estado: bloqueado por falta de sesion admin.

Validado sin sesion:

- `/dashboard/admin`: redirige a `/sign-in`.
- `/dashboard/admin/pricing`: redirige a `/sign-in`.

No validado:

- Admin dashboard.
- Pricing admin.
- Snapshots list.
- Refresh button.
- Approve/reject UI.
- Storage "En desarrollo".

No se aprobaron/rechazaron snapshots.

## Upload / Evidence Smoke

Estado: pendiente.

Archivo usado: ninguno.

Motivo:

- Requiere usuario QA autenticado.
- No habia sesion disponible.

Reglas respetadas:

- No se subieron archivos.
- No se borro storage.
- No se modificaron datos reales.

## Report / PDF Smoke

Estado: pendiente para flujo autenticado real.

Validado:

- `/sample-report`: 200.

No validado:

- Report preview autenticado.
- PDF generation.
- PDF download.
- Secciones Licensing y Customer Context dentro de PDF real.
- Revision visual real.

## Logs / Restart Hostinger

Logs revisados: no.

Restart ejecutado: no.

Motivo:

- No hay `HOSTINGER_API_TOKEN`.
- No hay variables SSH/app-root.
- No hay acceso remoto a logs/restart desde este shell.

Reglas respetadas:

- No se tocaron env vars.
- No se reinicio app.
- No se hizo deploy.
- No se borro storage.

## Monitoreo Post-Smoke

Se ejecuto monitoreo HTTP corto con 5 iteraciones entre `2026-05-29T18:30:35-03:00` y `2026-05-29T18:34:43-03:00`.

Rutas monitoreadas:

- `/`
- `/shiftreadiness`
- `/sign-in`
- `/sign-up`
- `/sample-report`
- `/dashboard`
- `/dashboard/admin/pricing`

Resultado:

- Todas las rutas devolvieron 200 con redirects seguidos.
- No se observaron 500.
- No se observaron 503.
- No se observaron 504.

## Hallazgos

| Severidad | Hallazgo | Accion |
| --- | --- | --- |
| P0 | Ninguno detectado. | No rollback. |
| P1 | Ninguno detectado desde validaciones disponibles. | No rollback. |
| P2 | Smoke autenticado/admin/upload/PDF bloqueado por falta de sesion/control Chrome. | Requiere smoke manual real o reparar native host. |
| P3 | Ninguno. | N/A |

## Rollback

Rollback usado: no.

Motivo:

- DB up to date.
- Smoke publico OK.
- Guards privados OK.
- Monitoreo sin errores 500/503/504.
- No P0/P1 detectado.

## Estado Final

- Controlled production release: parcialmente validado.
- DB/migrations: validado.
- Runtime publico: validado.
- Authenticated manual smoke: bloqueado.
- Full public launch: no declarado.

## Riesgos Pendientes

- Smoke autenticado real.
- Smoke admin real.
- Upload/evidence real.
- Report/PDF productivo real.
- Logs Hostinger.
- Pricing real aprobado.
- QA profunda con datos reales controlados.
- Prompt tuning.
- PDF visual real.

## Proximo Paso Recomendado

Ejecutar uno de estos caminos:

1. Manual: el usuario realiza smoke con sesion real/admin y reporta evidencia para documentar.
2. Tooling: reparar Codex Chrome Extension native host y repetir smoke automatizado.

Hito sugerido:

```text
RELEASE-SMOKE-1C - User-attested authenticated production smoke closure
```
