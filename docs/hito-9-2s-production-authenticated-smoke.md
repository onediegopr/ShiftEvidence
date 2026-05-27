# HITO 9.2S - Production Authenticated Smoke

## Objetivo

Validar en produccion real, con usuario autenticado, que ShiftReadiness funciona end-to-end de forma controlada antes de declarar cualquier launch.

## Contexto

- Branch: `main`
- HEAD inicial: `625154e docs: validate browser upload gate E2E`
- Production launched: NO
- Hostinger publico ya servia la app Next real.
- No se tocaron Hostinger config, DNS, env vars, DB schema, Prisma migrations ni deploy.

## Estado publico previo

| Ruta | Resultado |
| --- | --- |
| `/` | `200 OK` |
| `/shiftreadiness` | `200 OK` |
| `/sign-in` | `200 OK` |
| `/sign-up` | `200 OK` |
| `/dashboard` | `307` a `/sign-in` sin sesion |
| `/dashboard/assessments` | `307` a `/sign-in` sin sesion |

Checks HTML:

- `/_next`: detectado.
- `ShiftReadiness`: detectado.
- Contenido sign-in: detectado.
- Hostinger 404: ausente.
- `This Page Does Not Exist`: ausente.

## Usuario QA

- Usuario creado: `qa-production-smoke-1779841702733@example.com`
- Datos: sinteticos, no sensibles.
- Password: no documentada.
- Assessment QA incompleto: `cmpnbswol008o49rdi05xfp1l`
- Assessment QA completo: `cmpnbtdi7009749rd9kuy9xfz`
- Nombre base: `QA Production Smoke - 2026-05-27 - safe to delete`

## Auth

- Sign-up por Better Auth API: OK.
- Cookie productiva usada: `__Secure-better-auth.session_token`.
- Sesion en navegador real: OK.
- `/dashboard` autenticado: OK.
- `/dashboard/assessments` autenticado: OK.
- Rutas privadas sin sesion: `307` a `/sign-in`.

## Dashboard

- Dashboard carga: OK.
- Workspace/default context: OK.
- Navegacion a assessments: OK.
- Assessment list y rutas internas: OK.
- Admin route con usuario QA no admin: `404`, fail-closed.

## Assessment CRUD

| Tipo | Assessment ID | Resultado |
| --- | --- | --- |
| Incompleto | `cmpnbswol008o49rdi05xfp1l` | Creado y abierto correctamente |
| Completo | `cmpnbtdi7009749rd9kuy9xfz` | Creado, actualizado y persistido correctamente |

- Guardado de intake: OK.
- Guardado de assumptions: OK.
- Refresh/navegacion posterior: OK.

## Intake/assumptions

Manual intake completado:

- `vmCount`: 2
- `hostCount`: 2
- `socketCount`: 2
- `coreCount`: 32
- `totalRamGb`: 40
- `storageFootprintTb`: 2
- `usedStorageTb`: 1
- `snapshotCount`: 1
- `criticalWorkloadCount`: 1

Cost/risk assumptions completadas:

- Currency: USD
- Years: 3
- VM count: 2
- Socket count: 2
- Core count: 32
- Annual VMware cost: 9000
- Estimated Proxmox cost: 1800
- Migration complexity: medium
- Business criticality: medium
- Risk tolerance: balanced

Resultado:

- Save: OK.
- Refresh: OK.
- Completion: OK.
- Upload gate paso a estado ready.

## Upload gate

Assessment incompleto:

- Upload section visible: SI.
- Upload gate: blocked.
- Mensaje visible: SI.
- Checklist visible: SI.
- CTA a `#infrastructure-intake`: SI.
- CTA a `#cost-risk-assumptions`: SI.
- File input disabled: SI.
- Button disabled: SI.
- Evidence files: 0.
- No se pudo interactuar con upload desde UI.

Assessment completo:

- Upload gate: ready.
- File input enabled: SI.
- Button enabled: SI.
- Upload habilitado: SI.

## Evidence/storage

Archivo subido:

- Path local QA: `qa-artifacts/hito-9-2s-production-authenticated-smoke/evidence/production-smoke-rvtools.csv`
- Tipo: CSV sintetico, no sensible.
- Rows: 2 VMs.
- Evidence file: `cmpnbu9oy00ac49rd9mw1uuvy`

Resultado:

- Upload browser/multipart en produccion: OK.
- EvidenceFile visible: OK.
- Metadata visible: OK.
- Download autenticado: `200 OK`.
- Content-Type: `text/csv`.
- File size: 322 bytes.
- Download sin sesion: `307` a `/sign-in`.
- Storage publico directo: no expuesto en UI.

## Parser/inventory

- Parser triggered: OK.
- Inventory parsed: OK.
- ParsedVM: 2.
- ParsedHost: 0.
- ParsedDatastore: 0.
- ParsedSnapshot: 0.
- Powered on: 2.
- Provisioned: 1,144 GB.
- Used: 875 GB.
- Evidence source: parsed RVTools inventory + manual cost assumptions.
- Parser warnings: presentes, esperados para CSV sintetico limitado.

Nota:

- El archivo QA era CSV simple, no workbook RVTools-like completo. Por eso hosts/datastores/snapshots quedaron en 0.

## Risk/scores

- Generate risk insights: OK.
- Readiness UI: presente.
- Confidence UI: presente.
- Top findings: presente.
- VM matrix: presente.
- No crash observado.
- Risk score preliminar: 6.
- Risk level: Low.

## Report/PDF

Resultado funcional:

- Report route: carga OK.
- Preview: OK.
- Generate PDF Preview: la accion genera el PDF, pero el redirect productivo vuelve a host interno incorrecto.
- Report history tras volver a URL publica correcta: OK.
- Download PDF autenticado: `200 OK`.
- Content-Type: `application/pdf`.
- File size: 23,620 bytes.
- PDF signature: `%PDF-`.
- Report id: `cmpnbvck200bl49rdbzhbu37n`.

Bug productivo detectado:

- La accion de generacion PDF redirige a `https://0.0.0.0:3000/dashboard/assessments/<id>/report?generated=1`.
- Chrome muestra `ERR_ADDRESS_INVALID`.
- Al navegar manualmente de vuelta a `https://shiftevidence.com/dashboard/assessments/<id>/report`, el reporte aparece en history y el download funciona.
- Report download sin sesion tambien redirige a `https://0.0.0.0:3000/sign-in`.

Causa probable:

- El runtime/proxy productivo entrega `request.url` con host interno `0.0.0.0:3000`.
- Las rutas POST de reports construyen redirects absolutos con `new URL(..., request.url)`.

Impacto:

- PDF generation y storage funcionan.
- UX productiva queda rota despues del submit PDF por redirect a host interno.
- Esto bloquea declarar production launched hasta corregir base URL/redirect.

## Unlock/admin/entitlement

- Admin productivo no disponible para usuario QA.
- `/dashboard/admin/unlock-requests` con usuario no admin: `404`.
- Unlock/admin/entitlement full report: pendiente.

## Security/access

- `/dashboard` sin sesion: `307` a `/sign-in`.
- Assessment sin sesion: `307` a `/sign-in`.
- Evidence download sin sesion: `307` a `/sign-in`.
- Report download sin sesion: `307`, pero location incorrecto `https://0.0.0.0:3000/sign-in`.
- Admin route con usuario QA no admin: `404`.
- Evidence/PDF no aparecen como archivos publicos directos.

## Logs

- Logs Hostinger runtime/hPanel: no disponibles desde el contexto actual de herramientas.
- No se toco Hostinger ni hPanel.
- Error observado por navegador: `ERR_ADDRESS_INVALID` por redirect a `https://0.0.0.0:3000/...`.

## QA data created

- User: `qa-production-smoke-1779841702733@example.com`
- Incomplete assessment: `cmpnbswol008o49rdi05xfp1l`
- Complete assessment: `cmpnbtdi7009749rd9kuy9xfz`
- Evidence file: `cmpnbu9oy00ac49rd9mw1uuvy`
- Report: `cmpnbvck200bl49rdbzhbu37n`
- Cleanup done: NO.
- Safe to delete: SI.
- Cleanup pending: SI.

## Bugs encontrados

1. Redirect productivo incorrecto en report/PDF:
   - Sintoma: POST PDF redirige a `https://0.0.0.0:3000/...`.
   - Evidencia: Chrome `ERR_ADDRESS_INVALID`.
   - Area probable: rutas API/report que usan `request.url` para construir redirects absolutos detras del proxy Hostinger.
   - Severidad: bloqueante para declarar launch.

## Fixes aplicados

Ninguno.

No se modifico codigo, Hostinger, DB, Prisma, storage ni env vars.

## Riesgos pendientes

- Corregir redirects absolutos productivos para que usen `https://shiftevidence.com` o redirects relativos.
- Validar Hostinger runtime logs despues de reproducir/fixear el redirect.
- Validar admin/entitlement/full readiness_report en produccion con admin real.
- Decidir cleanup de usuario/assessments/evidence/report QA productivos.

## Decision sobre launch

- Production authenticated smoke paso parcialmente.
- Auth, dashboard, assessment CRUD, intake, upload gate, evidence upload, storage, parser, risk/report preview y PDF download autenticado funcionan.
- No puede declararse production launched todavia por redirect productivo incorrecto `0.0.0.0:3000`.

Decision:

- Production launched: NO.
- Ready for controlled launch review: NO hasta corregir redirects productivos.

## HITO 9.2S.1 follow-up

Se implemento un hotfix local para los redirects productivos de report/PDF:

- Se agrego helper `getPublicUrl`.
- `generate`, `download` y `delete` de report dejaron de usar `request.url` como origin publico.
- Los redirects ahora se basan en `NEXT_PUBLIC_APP_URL`, `BETTER_AUTH_URL` o fallback local.

Estado:

- Validacion local: OK.
- Re-smoke produccion: pendiente hasta push/autodeploy.
- Production launched: NO.
