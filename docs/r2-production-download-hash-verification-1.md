# R2 Production Download Hash Verification 1

Fecha: 2026-06-05

## 1. Objetivo

Cerrar la verificacion de descarga autenticada production para evidencia almacenada en R2, usando un archivo sintetico y sin exponer credenciales del navegador ni datos reales.

Alcance:

- Subir archivo sintetico por UI autenticada.
- Confirmar link de descarga autenticada.
- Confirmar descarga manual por owner.
- Comparar contenido descargado contra contenido esperado.
- Comparar bytes/hash del archivo subido contra el hash mostrado por la app.
- Confirmar acceso sin sesion bloqueado.
- Eliminar evidencia sintetica por UI.
- Revisar logs de Vercel.

Fuera de alcance:

- DNS.
- Hostinger.
- Stripe live.
- Pagos.
- Webhooks.
- Wise.
- Grants reales.
- Entitlements reales.
- DB destructive.
- `db push`.
- Migraciones.
- Datos reales.
- RVTools real.

## 2. Estado inicial

| Area | Estado inicial |
| --- | ---: |
| R2-PRODUCTION-DOWNLOAD-HASH-VERIFICATION-1 | 0% |
| R2 authenticated production upload smoke | 92% |
| Production/cutover readiness | 97% |
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
- HEAD inicial: `32bde54efd4c41d86e1f5155e85f0ff1229082ae`.
- `origin/main`: `32bde54efd4c41d86e1f5155e85f0ff1229082ae`.
- `origin/preview`: `5c8b695eb3c20b709db30b00d7cddc6164cf2fed`.
- Repo limpio al iniciar.
- No habia commits locales sin pushear.
- No habia stashes.
- No habia untracked files visibles.
- `.env.local` no esta trackeado.
- `.env.r2-smoke.local` no esta trackeado.

Vercel hardening:

- `vercel.json` conserva `git.deploymentEnabled.main=false`.
- `vercel.json` conserva `git.deploymentEnabled.preview=true`.

## 4. Metodo usado

Metodo:

- Manual owner download.

Motivo:

- El navegador embebido no materializa descargas en disco.
- El controlador Chrome no estuvo disponible en esta sesion.
- No se extrajeron credenciales del navegador.
- No se imprimieron enlaces sensibles.

Confirmacion:

- Owner descargo el archivo desde la UI productiva.
- Owner confirmo el contenido visible del archivo descargado.
- Codex calculo el hash del archivo local subido y del contenido esperado.

## 5. Assessment sintetico

Assessment:

- ID: `cmq16c8ds000dl104d3ht1qqu`.
- Uso: synthetic production smoke only.
- No customer data.

Upload gate:

- Estado observado: `ready`.
- No se uso bypass de DB.
- No se uso grant.
- No se uso payment.
- No se uso entitlement real.

## 6. Archivo sintetico

Archivo temporal local fuera del repo:

- Filename: `synthetic-production-r2-download-hash.txt`.
- Path local temporal: `%TEMP%`.
- Contenido esperado visible: `Shift Evidence production authenticated R2 download hash verification smoke. No customer data.`

Detalles:

| Campo | Valor |
| --- | --- |
| Visible content bytes UTF-8 sin BOM | `94` |
| Visible content SHA256 sin BOM | `1d9ac11e2f59a24453c14e2010503f3ff81252887e09f395817058f416b5d894` |
| Uploaded local file bytes | `97` |
| Uploaded local file SHA256 | `19d3af9d56fcbedaa660f49fc001bffbd3d5c135f69e5d8811e6e4aab8fc4406` |

Nota:

- El archivo local fue creado por PowerShell con BOM UTF-8, por eso el archivo subido tiene 97 bytes.
- El contenido visible descargado no muestra el BOM, pero coincide exactamente con el texto esperado.

## 7. Upload por UI productiva

Ruta:

- `https://www.shiftevidence.com/dashboard/assessments/cmq16c8ds000dl104d3ht1qqu?tab=evidence#evidence-upload`.

Resultado:

| Check | Resultado |
| --- | --- |
| Evidence type | `Other` |
| Upload gate | OK, `ready` |
| Upload por UI | OK |
| Redirect after upload | OK |
| Evidence history row | OK |
| Download link visible | OK |
| Delete button visible | OK |

Evidence record no sensible:

- File ID: `cmq18pa860005jv04g4hpml1w`.
- Filename: `synthetic-production-r2-download-hash.txt`.
- Visible bytes: `97 B`.
- Visible hash prefix: `19D3AF9D56FC`.

## 8. Download hash/content verification

Resultado:

| Check | Resultado |
| --- | --- |
| Authenticated download request | OK, Vercel logs `200` |
| Owner manual download | OK |
| Downloaded visible content | Match |
| App displayed hash prefix | Match local uploaded file SHA256 |
| Uploaded local file bytes | `97` |
| Uploaded local file SHA256 | `19d3af9d56fcbedaa660f49fc001bffbd3d5c135f69e5d8811e6e4aab8fc4406` |
| Visible content bytes without BOM | `94` |
| Visible content SHA256 without BOM | `1d9ac11e2f59a24453c14e2010503f3ff81252887e09f395817058f416b5d894` |

Downloaded content confirmed by owner:

```text
Shift Evidence production authenticated R2 download hash verification smoke. No customer data.
```

Interpretation:

- The authenticated route returned `200`.
- The owner-confirmed downloaded content matches the expected synthetic payload.
- The app-displayed hash prefix matches the uploaded local file SHA256.
- No credential extraction was used to fetch the file.

## 9. Access without session

Endpoint shape:

- `/api/assessments/<assessment-id>/files/<file-id>/download`.

Result:

| Check | Resultado |
| --- | --- |
| GET without app auth | `307` |
| Final unauthenticated page | sign-in |
| Public file download | No |

No sensitive download URL was documented.

## 10. Delete and cleanup

Resultado:

| Check | Resultado |
| --- | --- |
| Delete by UI | OK |
| Redirect after delete | OK, `saved=1&tab=evidence` |
| Evidence row status | `Deleted` |
| Active download links in evidence block | `0` |
| Active delete buttons in evidence block | `0` |

Notes:

- Deleted evidence remains visible for auditability.
- The synthetic evidence is no longer downloadable from the UI.
- No non-synthetic files were deleted.

## 11. Logs

Deployment observed:

- `https://shiftevidence-p2yhuq8hj-shift-evidence.vercel.app`.

Logs:

| Evento | Resultado |
| --- | --- |
| Upload POST | `303` |
| Authenticated download | `200` |
| Delete POST | `303` |
| Unauthenticated download | `307` then sign-in |
| Error logs | none |
| 500 logs | none |

No observed:

- `AccessDenied`.
- Storage errors.
- Rate-limit errors.
- 500s.

## 12. Security review

Confirmado:

- No secrets.
- No credenciales del navegador.
- No sensitive download URL exposure.
- No customer data.
- No real RVTools.
- No Stripe live.
- No payments.
- No webhooks.
- No DNS.
- No Hostinger.
- No DB destructive.
- No `db push`.
- No migrations.
- No `vercel env pull`.

## 13. Estado final

| Area | Estado final |
| --- | ---: |
| R2-PRODUCTION-DOWNLOAD-HASH-VERIFICATION-1 | 100% |
| R2 authenticated production upload smoke | 100% |
| Production/cutover readiness | 98% |
| Storage/R2 readiness | 100% |
| General technical | 99% |

## 14. Proximo hito recomendado

- `STRIPE-LIVE-READINESS-1`.
- `DNS-HOSTINGER-CUTOVER-PREP-1`.
- `PRODUCTION-CUTOVER-CONTROLLED`.
