# HITO 12.0.6 — Formal Upload Prerequisite Gate

## Objetivo
Implementar un gate formal para impedir la carga real de evidence/RVTools/XLSX/CSV desde el dashboard hasta que el assessment tenga datos mínimos suficientes.

## Contexto
- El flujo visual de `/sign-up` no era el upload real del producto.
- El upload real ocurre en `src/app/dashboard/assessments/[id]/page.tsx`.
- La server action real está en `src/app/dashboard/assessments/[id]/evidence/actions.ts`.
- Hostinger sigue fuera de alcance.
- Production launched: NO.

## Gate Definition
El gate MVP usa campos existentes y no agrega schema ni migraciones.

Prerequisitos mínimos:
- Assessment title presente.
- Manual infrastructure intake no debe estar `missing`.
- Cost/Risk assumptions no debe estar `missing`.

Estados `partial` o `complete` habilitan upload. Esto evita exigir el 100% del assessment antes de permitir evidencia.

## UI Gate
Archivo: `src/app/dashboard/assessments/[id]/page.tsx`

Cambios:
- Se evalúan prerequisitos con `getEvidenceUploadPrerequisites`.
- La sección de upload muestra estado `Upload gate: ready` o `Upload gate: blocked`.
- Si faltan datos, el formulario queda deshabilitado con `fieldset disabled`.
- Se muestra mensaje claro y lista de prerequisitos faltantes.
- Cada prerequisito apunta a su sección:
  - `#assessment-basics`
  - `#infrastructure-intake`
  - `#cost-risk-assumptions`

Copy aplicado:
“Complete the assessment basics before uploading evidence. This helps ShiftReadiness interpret your RVTools file correctly and generate a more reliable report.”

## Server-Side Gate
Archivo: `src/app/dashboard/assessments/[id]/evidence/actions.ts`

Cambios:
- Después de validar sesión y ownership, se ejecuta `assertCanUploadEvidence`.
- Si faltan prerequisitos, la acción redirige con error.
- La validación ocurre antes de escribir el archivo en storage.

## Files Changed
- `src/server/assessments/assessmentUploadPrerequisites.ts`
- `src/app/dashboard/assessments/[id]/page.tsx`
- `src/app/dashboard/assessments/[id]/evidence/actions.ts`
- `docs/hito-12-0-6-formal-upload-prerequisite-gate.md`

## Validations
- `npm run hostinger:diagnose`: OK. Variables productivas ausentes reportadas por nombre, sin valores.
- `npm run typecheck`: OK.
- `npm run lint`: OK.
- `npm run build`: OK.
- Local production-like smoke:
  - `/`: 200
  - `/shiftreadiness`: 200
  - `/sign-in`: 200
  - `/sign-up`: 200
  - `/dashboard`: 307 a `/sign-in` sin sesión
  - `/dashboard/assessments`: 307 a `/sign-in` sin sesión

Build warning conocido:
- Turbopack/NFT warning por `next.config.mjs` y `reportStorageService`.
- No está relacionado con este gate.

## Risks
- La verificación UI autenticada manual debe repetirse con usuario QA para confirmar el copy visual en navegador.
- El gate server-side usa el estado actual de completion; si el producto redefine campos mínimos, se debe ajustar el helper.
- El gate no valida un checklist profundo de calidad del intake. Sólo exige señales mínimas.

## Manual QA Steps
1. Iniciar sesión local.
2. Crear assessment nuevo.
3. Entrar a `/dashboard/assessments/[id]`.
4. Confirmar que la sección `RVTools evidence upload` aparece bloqueada.
5. Confirmar que muestra prerequisitos faltantes.
6. Completar overview, manual infrastructure intake y Cost/Risk assumptions con datos mínimos.
7. Volver al upload.
8. Confirmar que el formulario queda habilitado.
9. Subir `.xlsx` o `.csv` sintético no sensible.
10. Confirmar metadata, storage y parser si aplica.
11. Intentar bypass directo de la action sin prerequisitos y confirmar rechazo.

## Decision
El gate formal queda implementado en UI y server-side sin tocar Hostinger, deploy, Prisma ni DB schema.

## HITO 12.0.7 QA Outcome
Se ejecutó QA autenticado local posterior:

- Assessment incompleto: UI muestra `Upload gate: blocked`, mensaje claro, checklist de faltantes y fieldset deshabilitado.
- Assessment completo: UI muestra `Upload gate: ready` y formulario habilitado.
- Server-side guard: auditado en la action real, después de sesión/ownership y antes de storage/`EvidenceFile`.
- Bypass directo por `curl` contra Server Actions no alcanzó la action por protocolo de Next (`Failed to find Server Action`), por lo que queda pendiente una prueba browser-driven real del submit multipart.
- Regresión parser P0: OK con `node scripts/qa-rvtools-parser-p0.mjs`.

## Next Step
Ejecutar QA autenticado manual y, si pasa, cerrar remoto con autorización explícita de push.
