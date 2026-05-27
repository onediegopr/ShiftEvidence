# HITO 12.0.7 — Authenticated Upload Gate Manual QA

## Objetivo
Validar con sesión autenticada local que el gate formal de evidence upload se renderiza correctamente y protege el flujo antes de pushear los commits locales pendientes.

## Contexto
- Commit base local: `8be0787 fix: gate evidence upload behind prerequisites`.
- Commit local previo pendiente: `621af0b fix: stabilize upload gate UX flow`.
- `origin/main`: `75df8db fix: unwrap searchParams promise in assessments page`.
- Hostinger no fue tocado.
- Production launched: NO.

## Git/Remoto
- Branch: `main`.
- Working tree inicial: limpio.
- `origin/main` es ancestor de `HEAD`: sí.
- Divergencia: no hay divergencia; sólo commits locales no pusheados.
- Commits locales no pusheados antes de este doc:
  - `8be0787 fix: gate evidence upload behind prerequisites`
  - `621af0b fix: stabilize upload gate UX flow`

## Validaciones Técnicas
- `npm run hostinger:diagnose`: OK. Variables productivas ausentes reportadas por nombre, sin valores.
- `npm run typecheck`: OK.
- `npm run lint`: OK.
- `npm run build`: OK.
- Warning conocido: Turbopack/NFT por `reportStorageService`, no relacionado con upload gate.

## Local Runtime
`next start -p 3000` levantó correctamente.

Rutas sin sesión:
- `/`: 200.
- `/shiftreadiness`: 200.
- `/sign-in`: 200.
- `/sign-up`: 200.
- `/dashboard`: 307 a `/sign-in`.
- `/dashboard/assessments`: 307 a `/sign-in`.

## Sesión QA
Se creó un usuario QA local sintético vía Better Auth usando `/api/auth/sign-up/email`.

No se documentan credenciales ni secretos.

## Assessment Incompleto
- Assessment id: `cmpn9oova0005izhgsm7eoc9s`.
- Estado: title presente, sin manual infrastructure intake, sin Cost/Risk assumptions.

Resultado UI autenticada:
- Evidence upload section visible: sí.
- Upload bloqueado/deshabilitado: sí.
- Estado visible: `Upload gate: blocked`.
- Mensaje visible: `Upload is locked until the assessment basics are complete.`
- Checklist visible:
  - `Manual infrastructure intake`.
  - `Cost / Risk assumptions`.
- CTA/enlaces a secciones: sí, mediante anchors `#infrastructure-intake` y `#cost-risk-assumptions`.
- Dead-end: no, el usuario puede ir a las secciones requeridas.
- Layout roto evidente en HTML renderizado: no.

## Assessment Completo
- Assessment id: `cmpn9op4a0007izhg4cq4ty58`.
- Estado: title presente, manual infrastructure intake parcial, Cost/Risk assumptions completo.

Resultado UI autenticada:
- Evidence upload section visible: sí.
- Estado visible: `Upload gate: ready`.
- Mensaje de bloqueo: ausente.
- Botón `Upload evidence`: visible.
- Fieldset: `aria-disabled="false"`.
- Formulario habilitado: sí.

## Server-Side Gate
La server action real está protegida en `src/app/dashboard/assessments/[id]/evidence/actions.ts`.

Validación aplicada:
- Después de sesión y ownership.
- Antes de escribir archivo en storage.
- Antes de crear `EvidenceFile`.

Intento de bypass por `curl`:
- Se intentó postear multipart directamente contra los hidden fields de Server Actions.
- Next respondió `Failed to find Server Action`.
- El request no llegó a la action de upload, por lo que no prueba aceptación ni rechazo del guard.
- Verificación DB posterior: `EvidenceFile` siguió en `0` para el assessment incompleto y `0` para el completo.
- No se guardó archivo por ese intento.
- No corrió parser.

Conclusión server-side:
- La protección server-side queda validada por auditoría de código y ubicación del guard.
- Falta una prueba browser-driven real del submit multipart para confirmar el rechazo end-to-end desde el protocolo de Server Actions.

## Regresión
- Script ejecutado: `node scripts/qa-rvtools-parser-p0.mjs`.
- Resultado:
  - Workbook RVTools-like: `ParsedVM = 23`, `ParsedHost = 5`, `ParsedDatastore = 6`, `ParsedSnapshot = 5`.
  - CSV simple: `ParsedVM = 3`.
- Resultado parser P0: OK.

## Riesgos
- No se pudo completar upload real del assessment completo mediante navegador interactivo desde esta sesión.
- No se pudo probar submit server-side real con protocolo de Server Actions fuera del navegador.
- La UI autenticada sí quedó validada por HTML renderizado con sesión real.

## Decisión de Push
- Gate UI autenticado: validado.
- Gate server-side: implementado y auditado, con prueba directa de bypass limitada por protocolo Server Actions.
- Recomendación: seguro para push si se acepta que la prueba de upload real completo queda como QA manual browser follow-up.
- Production launched: NO.

## HITO 12.0.8 Outcome
El follow-up browser-driven quedó completado:

- Browser real: Google Chrome vía DevTools Protocol.
- Assessment incompleto: bloqueo efectivo, sin `EvidenceFile`, sin archivo guardado, sin parser.
- Assessment completo: submit multipart real exitoso, `EvidenceFile` creado, archivo guardado en storage, status `uploaded`.
- Parser P0 regression: OK.

La limitación documentada en HITO 12.0.7 queda cerrada.
