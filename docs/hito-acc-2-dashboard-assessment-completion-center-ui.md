# HITO ACC-2 - Dashboard Assessment Completion Center UI

## Objetivo

Agregar una primera version visual del Assessment Completion Center en el detalle del assessment, usando el engine creado en ACC-1.

El usuario puede ver rapidamente que modulos existen, cuales estan completos, cuales son required/recommended, si puede generar el reporte, cuanto avance operativo tiene el assessment y que confianza estimada tendra el informe.

## Avance

- Assessment Completion Center antes de ACC-2: 25-30%.
- Assessment Completion Center despues de ACC-2: 50-60%.
- Hito ACC-2: 100% al completar implementacion, validaciones y commit local.

## Componente creado

- `src/components/assessments/AssessmentCompletionCenter.tsx`
- `src/components/assessments/assessmentCompletionPresentation.ts`

El componente es server-rendered y recibe el summary calculado por `computeAssessmentCompletionSummary`. No convierte el dashboard completo en Client Component.

## Integracion

Se integra en:

- `src/app/dashboard/assessments/[id]/page.tsx`

Ubicacion visual:

- despues del hero y banners;
- antes de las tabs del assessment;
- visible como bloque superior de orientacion antes de entrar en secciones profundas.

## Metricas mostradas

- Completion percent.
- Report confidence percent.
- Report status:
  - `Ready to generate` si RVTools inventory esta completo.
  - `RVTools inventory required` si falta RVTools.
- `requiredComplete` queda reflejado en el texto del status.
- `canGenerateReport` define el CTA primario.

## Modulos mostrados

- RVTools Inventory.
- Infrastructure Risk Analysis.
- Migration Questions.
- Storage Analysis.
- Licensing & Cost Exposure.
- Manual Assumptions.
- AI Advisory.
- Report Generation.

Cada modulo muestra:

- label;
- descripcion;
- status;
- required/recommended badge;
- weight;
- impact/limitation;
- action label con link al tab o pagina correspondiente.

## Required vs optional

- RVTools Inventory se mantiene como base obligatoria.
- Infrastructure Risk y Report Generation se muestran como required/system-required.
- Migration Questions, Storage, Licensing, Manual Assumptions y AI Advisory se muestran como recommended.
- Los recommended incompletos no bloquean generacion.

## Optativos preservados

- Preguntas: optativas, link a `tab=context`.
- Storage: optativo, link a `tab=basics#storage-readiness`.
- Licensing: optativo, link a `tab=basics#cost-risk-assumptions`.
- Manual assumptions: optativo, link a `tab=basics#infrastructure-intake`.
- AI Advisory: optativo, link a report preview.

El copy evita tono culpabilizante. Si el reporte puede generarse, el usuario ve que puede avanzar y que completar modulos recomendados mejora precision.

## CTAs agregados

- CTA primario:
  - `Upload RVTools` si falta RVTools.
  - `Generate report now` si RVTools esta completo y falta reporte.
  - `Improve report confidence` si ya hay reporte pero quedan recommended abiertos.
  - `Review modules` si todo esta completo.
- CTA secundario:
  - `Improve report` cuando `canGenerateReport = true`.
- CTAs por modulo:
  - apuntan a tabs/secciones existentes.

No se agregaron controles de `Skip for now` o `Mark not applicable` porque no existe persistencia para eso en este hito.

## Tests

Archivo:

- `tests/unit/assessmentCompletionPresentation.test.ts`

Casos:

- status label/tone;
- hrefs por modulo;
- CTA primario;
- notice que aclara que el reporte puede generarse aunque queden recommended pendientes.

No se instalo React Testing Library. Se testearon helpers puros para mantener el hito liviano.

## Validaciones

- `npm run test:run`: OK, 9 archivos / 37 tests.
- `npm run lint`: OK, 0 errores, 10 warnings preexistentes de `<img>`.
- `npm run typecheck`: OK.
- `npm run build`: OK, con warning NFT/Turbopack conocido no bloqueante.
- `npm run hostinger:diagnose`: OK, diagnostico seguro sin imprimir secretos.
- `npx prisma validate`: OK cargando `.env.local` solo dentro del proceso.
- `npx prisma generate`: OK cargando `.env.local` solo dentro del proceso.

Nota local:

- El primer `npm run build` fallo por `EPERM` al borrar un archivo generado dentro de `.next/static`.
- Se verifico que no habia proceso escuchando en `:3000`.
- Se elimino solo `.next` dentro del workspace y el build paso al repetir.

## Que no se implemento todavia

- Persistencia de `skipped` / `not_applicable`.
- UI avanzada para administrar skip/not applicable.
- Integracion del Completion Center en PDF.
- QA visual autenticada completa si no hay sesion QA local disponible.
- Redisenio completo del dashboard.

## Proximo hito recomendado ACC-3

ACC-3 deberia cubrir:

- UX de preguntas/migration context conectada al Completion Center.
- Persistencia real de skipped/not applicable por modulo si el producto lo requiere.
- Mejor guidance por modulo y deep links mas precisos.
- QA autenticada visual con assessment real de prueba.

## Riesgos pendientes

- La deteccion de AI Advisory sigue siendo best-effort si `aiUsageEvents` no se incluye en el detail payload.
- Algunos CTAs apuntan a tabs/secciones actuales; pueden refinarse cuando ACC-3 agregue flujo guiado.
- Sin persistencia de skipped/not applicable, esos estados siguen limitados a inferencias existentes.
- QA visual autenticada queda pendiente si no hay sesion QA local disponible.

## Confirmaciones

- DB migration: NO.
- Push realizado: NO.
- Production deploy: NO.
- Production launched: NO.
