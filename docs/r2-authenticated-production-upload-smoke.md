# R2 Authenticated Production Upload Smoke

Fecha: 2026-06-05

## 1. Objetivo

Validar el flujo autenticado de production para upload de evidencia hacia storage R2 usando solo un assessment sintetico, un archivo sintetico y la UI real de `shiftevidence`.

Alcance:

- Usar `www.shiftevidence.com` en production.
- Usar assessment sintetico existente.
- Subir archivo sintetico por UI autenticada.
- Confirmar que la descarga protegida existe y requiere sesion.
- Eliminar el archivo sintetico por UI.
- Revisar logs de Vercel.
- No usar datos reales.

Fuera de alcance:

- DNS.
- Hostinger.
- Stripe live.
- Pagos.
- Webhooks.
- Wise.
- Grants o entitlements reales.
- Migraciones.
- `db push`.
- Datos de clientes.
- RVTools real.

## 2. Estado inicial

| Area | Estado inicial |
| --- | ---: |
| R2-AUTHENTICATED-PRODUCTION-UPLOAD-SMOKE | 0% |
| Production/cutover readiness | 96% |
| Vercel readiness | 98% |
| DB readiness | 98% |
| Storage/R2 readiness | 99% |
| Upstash/rate limit readiness | 100% |
| Billing readiness | 96% |
| Admin ops | 98% |
| General technical | 98% |

## 3. Auditoria local

Repositorio:

- Branch actual: `main`.
- HEAD inicial: `118f251856b955c99b6283b3ac4a2e3aff00e7c8`.
- Repo limpio al iniciar.
- `.env.local` no esta trackeado.
- `.env.r2-smoke.local` no esta trackeado.

Vercel hardening:

- `vercel.json` conserva `git.deploymentEnabled.main=false`.
- `vercel.json` conserva `git.deploymentEnabled.preview=true`.

## 4. Assessment sintetico

Assessment:

- ID: `cmq16c8ds000dl104d3ht1qqu`.
- Tipo: sintetico, sin datos reales.
- Uso: smoke production autenticado.

Upload gate:

- Estado observado antes del upload: `ready`.
- No se uso bypass de DB.
- No se usaron grants, pagos, entitlements reales ni checkout.
- Se completo el minimo requerido por UI para habilitar evidencia.

## 5. Archivo sintetico

Archivo local temporal:

- Nombre: `synthetic-production-r2-upload.txt`.
- Ubicacion: directorio temporal local fuera del repo.
- Bytes: `74`.
- SHA256 local: `35a92e0b491581f9964edb4faf18057c509adefccdf4489824d2265d82abf58f`.
- Contenido: texto sintetico de smoke, sin datos de clientes.

No se guardo el archivo en git.

## 6. Upload por UI autenticada

Ruta:

- `https://www.shiftevidence.com/dashboard/assessments/cmq16c8ds000dl104d3ht1qqu?tab=evidence#evidence-upload`.

Formulario:

- Evidence type: `Other`.
- File: `synthetic-production-r2-upload.txt`.

Resultado:

| Check | Resultado |
| --- | --- |
| Authenticated UI available | OK |
| Upload gate ready | OK |
| Upload POST | OK |
| Redirect after upload | OK, `saved=1&tab=evidence` |
| Evidence history row | OK |
| File name visible | OK |
| Evidence file count | OK, `1` |

Evidence record no sensible:

- File ID observado: `cmq17ou5z0005ju04nit9enet`.
- Nombre visible: `synthetic-production-r2-upload.txt`.
- Estado visible despues del upload: `Uploaded`.

## 7. Download protegido

Endpoint observado:

- `/api/assessments/cmq16c8ds000dl104d3ht1qqu/files/cmq17ou5z0005ju04nit9enet/download`.

Resultado:

| Check | Resultado |
| --- | --- |
| Link protegido visible tras upload | OK |
| GET autenticado registrado en Vercel | OK, `200` |
| GET sin sesion | OK, redirige a sign-in |
| Download publico | No |
| Captura de bytes por navegador embebido | No soportado por herramienta |

Nota:

- El navegador embebido de Codex no soporta eventos de descarga y bloqueo la descarga como archivo.
- Por esa limitacion de herramienta, no se documento hash del contenido descargado.
- No se extrajeron credenciales del navegador.
- No se imprimieron ni guardaron signed URLs.

## 8. Delete y cleanup

Resultado:

| Check | Resultado |
| --- | --- |
| Delete por UI | OK |
| Redirect after delete | OK, `saved=1&tab=evidence` |
| Evidence history audit trail | OK |
| Estado visible | `Deleted` |
| Download link despues de delete | No disponible para el archivo eliminado |

Nota:

- La UI conserva el registro eliminado para auditabilidad.
- El texto visible indica que la evidencia eliminada ya no es descargable.
- No se borro nada fuera del archivo sintetico.

## 9. Logs Vercel

Deployment production observado:

- `https://shiftevidence-p2yhuq8hj-shift-evidence.vercel.app`.

Logs relevantes:

| Evento | Resultado |
| --- | --- |
| Upload/delete POST assessment | `303` |
| Download autenticado | `200` |
| Download sin sesion | `307` hacia sign-in |
| Error logs | none |
| 500 logs | none |

No se observaron errores `AccessDenied`, fallos R2 ni 500 durante la ventana del smoke.

## 10. Seguridad

Confirmado:

- No secrets en docs.
- No credenciales del navegador.
- No signed URLs.
- No datos reales.
- No RVTools real.
- No DNS.
- No Hostinger.
- No Stripe live.
- No pagos.
- No webhooks.
- No Wise.
- No grants reales.
- No entitlements reales.
- No migrations.
- No `db push`.
- No deploy productivo intencional.

## 11. Resultado

| Area | Resultado |
| --- | ---: |
| R2-AUTHENTICATED-PRODUCTION-UPLOAD-SMOKE | 92% |
| Production/cutover readiness | 97% |
| Vercel readiness | 98% |
| DB readiness | 98% |
| Storage/R2 readiness | 99% |
| Upstash/rate limit readiness | 100% |
| Billing readiness | 96% |
| Admin ops | 98% |
| General technical | 98% |

Estado:

- Parcial alto.

Motivo:

- Upload autenticado y cleanup pasaron por UI production.
- Download protegido fue observado y registrado como `200` con sesion.
- La verificacion byte-for-byte del download quedo limitada por el navegador embebido, que no soporta capturar descargas.

## 12. Proximo hito recomendado

`R2-PRODUCTION-DOWNLOAD-HASH-VERIFICATION-1`

Objetivo recomendado:

- Repetir solo la parte de download usando una herramienta que soporte descargas autenticadas, sin exponer cookies ni sesiones, o con intervencion manual controlada del owner.
