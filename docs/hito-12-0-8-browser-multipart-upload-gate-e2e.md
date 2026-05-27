# HITO 12.0.8 — Browser Multipart Upload Gate E2E

## Objetivo
Validar end-to-end, desde navegador real, que el upload gate de evidence funciona con multipart/form-data en el flujo autenticado real del dashboard.

## Contexto
- HITO 12.0.6 implementó el gate formal en UI y server-side.
- HITO 12.0.7 validó la UI autenticada y auditó el guard server-side, pero el submit multipart real quedó pendiente.
- Este hito valida el submit real desde Chrome controlado por DevTools Protocol.
- Hostinger no fue tocado.
- Production launched: NO.

## Entorno Local
- Branch: `main`.
- HEAD inicial: `4819d9a docs: validate authenticated upload gate QA`.
- `origin/main`: sincronizado al inicio.
- Node: `v22.22.0`.
- npm: `10.9.4`.
- Runtime: `next start -p 3000`.
- Browser usado: Google Chrome real vía DevTools Protocol, modo headless.
- DB local/dev: disponible mediante `.env.local`.

## Archivo QA
Archivo creado en artefactos locales ignorados por Git:

`qa-artifacts/hito-12-0-8-browser-upload-gate-e2e/evidence/browser-upload-gate-sample.csv`

Contenido:
- 2 filas sintéticas.
- No sensible.
- No commiteado.

## Assessment Incompleto
- Assessment id: `cmpnavv9k0005izu4tcm02xtb`.
- Title presente.
- Manual infrastructure intake ausente.
- Cost/Risk assumptions ausente.

Resultado:
- Upload section visible: sí.
- Mensaje visible: sí.
- Checklist visible: sí.
- CTA `#infrastructure-intake`: sí.
- CTA `#cost-risk-assumptions`: sí.
- File input `disabled` property: `false`.
- File input effective disabled via `:disabled`: `true`.
- Submit button disabled: sí.
- Browser/CDP pudo setear técnicamente el file input, pero el submit button quedó disabled y no se envió el formulario.
- EvidenceFile before: `0`.
- EvidenceFile after: `0`.
- Archivo guardado: no.
- Parser triggered: no.

Conclusión: el assessment incompleto queda bloqueado en el navegador real y no genera evidencia.

## Assessment Completo
- Assessment id: `cmpnavvi80007izu4ncipajyj`.
- Title presente.
- Manual infrastructure intake parcial.
- Cost/Risk assumptions completo.

Resultado:
- Upload section visible: sí.
- File input effective disabled: no.
- Submit button disabled: no.
- Submit real vía browser `form.requestSubmit(button)`: ejecutado.
- EvidenceFile before: `0`.
- EvidenceFile after: `1`.
- Evidence id: `cmpnawgu9000jizn49x2q7daz`.
- Original filename: `browser-upload-gate-sample.csv`.
- Evidence type: `manual_csv`.
- Processing status: `uploaded`.
- Size: `308` bytes.
- Storage path relativo: `users/XJBQmkVBKDyndBqyoBSL8a5L6YOkZZBV/workspaces/cmpnavub20001izu4jvq0il8v/assessments/cmpnavvi80007izu4ncipajyj/uploads/manual_csv/manual_csv_2026-05-27_00-03-18-237_browser-upload-gate-sample_32f2ccdd.csv`.
- Stored file exists: sí.
- Parser: no automático; status correcto `uploaded`.
- Report preview link visible: sí.
- Risk overview visible: sí.

Conclusión: el assessment completo permite upload multipart real desde navegador y persiste evidencia en DB/storage.

## Browser Upload Result
El browser E2E cubrió:
- sesión Better Auth local;
- navegación autenticada;
- render del gate incompleto;
- bloqueo efectivo de controles;
- submit real habilitado en assessment completo;
- creación de `EvidenceFile`;
- escritura física en storage.

El resultado JSON local se dejó en:

`qa-artifacts/hito-12-0-8-browser-upload-gate-e2e/notes/browser-e2e-result.json`

No está commiteado.

## Server-Side Confirmation
Guard server-side confirmado por código:

- Helper: `getEvidenceUploadPrerequisites` / `assertCanUploadEvidence`.
- Archivo: `src/server/assessments/assessmentUploadPrerequisites.ts`.
- Action: `src/app/dashboard/assessments/[id]/evidence/actions.ts`.
- Orden:
  - sesión requerida;
  - ownership requerido;
  - prerequisite guard;
  - recién después storage write;
  - recién después `EvidenceFile`;
  - parser no se dispara si falla upload.

La prueba de assessment incompleto no creó `EvidenceFile` ni archivo. La prueba de assessment completo sí creó ambos.

## Regression
- `node scripts/qa-rvtools-parser-p0.mjs`: OK.
- Workbook RVTools-like:
  - ParsedVM: `23`.
  - ParsedHost: `5`.
  - ParsedDatastore: `6`.
  - ParsedSnapshot: `5`.
- CSV simple:
  - ParsedVM: `3`.
- Rutas:
  - `/`: 200.
  - `/shiftreadiness`: 200.
  - `/sign-in`: 200.
  - `/sign-up`: 200.
  - `/dashboard`: 307 a `/sign-in` sin sesión.
  - `/dashboard/assessments`: 307 a `/sign-in` sin sesión.

## Bugs/Fixes
No se aplicaron bugfixes de producto.

Observación:
- `input.disabled` fue `false` dentro de un `fieldset disabled`, pero `input.matches(':disabled')` fue `true`. El navegador aplica el bloqueo efectivo correctamente.

## Validaciones Técnicas
- `npm run hostinger:diagnose`: OK.
- `npm run typecheck`: OK.
- `npm run lint`: OK.
- `npm run build`: OK.

Warning conocido:
- Turbopack/NFT por `reportStorageService`.
- No relacionado con este hito.

## Riesgos Pendientes
- El upload deja `processingStatus: uploaded`; parser automático no se ejecuta en este flujo, lo cual es comportamiento actual aceptado para este hito.
- El archivo QA y el resultado JSON viven en `qa-artifacts/`, ignorado por Git.

## Decisión Final
- Gate UI: validado.
- Browser multipart upload completo: validado.
- Server-side guard: confirmado.
- HITO 12.0.8: COMPLETO.
- Production launched: NO.
- Hostinger tocado: NO.
