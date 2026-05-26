# HITO 12.0.5 — UX/Menu + Upload Gate Audit

## Objetivo

Auditar los cambios recientes de UX/UI y navegación, especialmente el flujo donde el usuario llega a upload/evidence, y confirmar si existe un gate real que obligue a completar datos básicos/intake antes de subir archivos.

## Contexto

- Branch auditada: `main`
- HEAD inicial del hito: `2ab2afc feat: unify signup and readiness check flow under signup page`
- Producción lanzada: NO
- Hostinger: no tocado
- Deploy: no ejecutado
- Prisma/migraciones: no ejecutadas

## Estado Git

Al iniciar el hito había un cambio local generado en `next-env.d.ts`:

- `import "./.next/types/routes.d.ts";`
- `import "./.next/dev/types/routes.d.ts";`

Ese cambio fue identificado como generado por Next dev y fue excluido/restaurado.

Cambios reales auditados desde el commit reciente:

- `src/App.tsx`
- `src/app/sign-up/page.tsx`
- `src/views/LandingPage.tsx`
- `src/views/SignUpPage.tsx`

## Cambios Detectados

El commit reciente `2ab2afc` reemplazó el placeholder de `/sign-up` por una página de registro con flujo visual posterior:

- formulario de creación de cuenta;
- campos: nombre, email, empresa, cluster size y password;
- tras registro exitoso, muestra un wizard visual de evidencia;
- opciones visuales: subir RVTools/inventory o completar manual guided intake;
- simulación de análisis, score y descarga.

El flujo de dashboard real de upload no fue reemplazado por este wizard.

## Rutas/Componentes Auditados

### Sign-up / Readiness check

- `src/app/sign-up/page.tsx`
- `src/views/SignUpPage.tsx`
- `src/App.tsx`

Observaciones:

- `/sign-up` ahora es el punto público para crear cuenta y ver el readiness check visual.
- El wizard de evidencia aparece sólo después de registrar cuenta.
- El upload de ese wizard es simulado; no crea `EvidenceFile`, no guarda storage y no ejecuta parser.

### Dashboard assessment detail

- `src/app/dashboard/assessments/[id]/page.tsx`
- `src/app/dashboard/assessments/[id]/evidence/actions.ts`
- `src/server/assessments/assessmentCompletionService.ts`

Observaciones:

- El dashboard tiene secciones de overview, manual infrastructure intake, cost/risk assumptions, storage readiness, evidence upload, inventory, risk, report y completion.
- El upload real está en `src/app/dashboard/assessments/[id]/page.tsx`.
- La acción real de upload está en `src/app/dashboard/assessments/[id]/evidence/actions.ts`.

## Definición del Gate

El código existente trata como datos faltantes:

- manual infrastructure intake incompleto;
- Cost / Risk assumptions incompletos;
- storage readiness pendiente si fue activado;
- preview preliminar no generado;
- RVTools no subido o no parseado;
- inventory/risk insights no generados si aplica.

Esto existe como completion/missing evidence, no como gate bloqueante.

Campos actualmente relevantes para el gate:

- `Assessment.title`
- `Assessment.clientLabel`
- `InfrastructureInput` manual
- `CostRiskAssumptions`
- `storageReadinessEnabled` / `storageReadinessInput`

## QA Menú/Navegación

Resultado:

- `/`: responde 200.
- `/shiftreadiness`: responde 200.
- `/sign-up`: responde 200.
- `/sign-in`: responde 200.
- `/dashboard`: responde 307 a `/sign-in` sin sesión.
- `/dashboard/assessments`: responde 307 a `/sign-in` sin sesión.

HTML/content:

- Home contiene `ShiftReadiness`.
- Home contiene `Explore ShiftReadiness`.
- Home contiene `/shiftreadiness`.
- `/shiftreadiness` contiene `VMware`, `Proxmox`, `Readiness`.
- `/sign-up` contiene `Create Account`.
- No se detectó `[object Object]`.

## QA Upload Gate

### Assessment sin datos completos

El gate real no existe todavía.

El formulario de upload real sigue visible y enviable en:

- `src/app/dashboard/assessments/[id]/page.tsx`

La acción server-side valida:

- sesión;
- ownership del assessment;
- tipo de evidencia;
- archivo requerido;
- extensión/MIME/tamaño.

La acción server-side no valida todavía que el manual intake, datos básicos o cost/risk assumptions estén completos antes de crear `EvidenceFile`.

### Completar datos

No se ejecutó QA autenticado completo de creación/subida por UI en este hito. La auditoría fue de comportamiento local público, código y rutas protegidas.

### Server-side validation

No existe gate server-side para prerrequisitos de upload.

Riesgo:

- Un usuario autenticado puede intentar subir evidencia aunque el assessment esté incompleto.
- Si se agrega sólo un `disabled` en UI, seguirá existiendo bypass vía server action.

## Criterio UX del Gate

El gate debería ser explícito, no oculto.

Copy recomendado:

> Complete the assessment basics before uploading evidence. This helps us interpret your RVTools file correctly and generate a more reliable report.

Recomendación:

- Mostrar el bloque de upload, pero con estado bloqueado y explicación.
- Incluir CTA directo a manual intake / cost assumptions.
- No esconder el upload sin contexto.
- Implementar validación server-side equivalente para evitar bypass.

## Validación Técnica

Ejecutado:

- `npm run hostinger:diagnose`: OK
- `npm run typecheck`: OK después de regenerar `.next`
- `npm run lint`: OK después de hotfix mínimo
- `npm run build`: OK

Warning conocido:

- Turbopack/NFT warning sobre `next.config.mjs` y `reportStorageService.ts`.

Incidencias técnicas:

- `typecheck` falló inicialmente porque `.next/types` estaba inconsistente.
- `build` falló inicialmente por `EPERM unlink` en `.next/static`.
- Se detectaron procesos Next simultáneos (`next dev` y `next start`) en puerto 3000.
- Se detuvieron procesos Next del proyecto, se eliminó sólo `.next`, y se regeneró con `npm run build`.

## Fixes Aplicados

Hotfix mínimo de lint:

- Removido import no usado `AlertTriangle`.
- Removido `useRouter` no usado en `src/app/sign-up/page.tsx`.
- Reemplazado prefill de email vía `setState` síncrono en `useEffect` por inicializador de `useState`.

Archivos:

- `src/app/sign-up/page.tsx`
- `src/views/SignUpPage.tsx`

No se implementó el gate formal de upload en este hito.

## Riesgos

- El upload gate no existe como bloqueo real.
- No hay validación server-side de prerrequisitos de upload.
- El wizard de `/sign-up` simula análisis y descarga; no está conectado al assessment real.
- Hay interacciones en `/sign-up` implementadas como `div onClick`, lo que debería convertirse a `button` accesible en un hito de polish.
- El texto de resultados del wizard usa lenguaje fuerte como “0 blockers” y “direct hypervisor migration conversion”; conviene revisar para evitar overclaiming.

## Decisión

Estado general: OK CON AJUSTES.

El commit visual de `/sign-up` es funcional después del hotfix mínimo y no rompe build/lint/typecheck. Sin embargo, el objetivo de producto “completar datos antes de subir archivos” no está cumplido en el upload real del dashboard.

## Próximo Paso Recomendado

Abrir un hito formal de Upload Gate:

- definir campos mínimos obligatorios;
- bloquear UI de upload con copy claro;
- agregar validación server-side en `uploadEvidenceAction`;
- validar assessment incompleto/completo con sesión real;
- agregar tests o script QA si aplica.

