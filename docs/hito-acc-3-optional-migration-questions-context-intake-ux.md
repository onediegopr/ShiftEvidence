# HITO ACC-3 - Optional Migration Questions & Context Intake UX

## Objetivo

Ordenar y mejorar la experiencia del modulo Migration Questions / Context Intake para que sea claramente optativo, rapido de completar, salteable y util para mejorar Report Confidence.

El valor principal se mantiene: subir RVTools y generar un informe. Las preguntas agregan precision contextual, narrativa ejecutiva y mejores recomendaciones, pero no bloquean el avance.

## Avance

- Assessment Completion Center antes de ACC-3: 50-60%.
- Assessment Completion Center despues de ACC-3: 65-75%.
- Hito ACC-3: 100% al completar implementacion, validaciones y commit local.

## Preguntas definidas

El catalogo de migration context sigue centralizado en:

- `src/server/assessments/migrationContextService.ts`

Se reorganizo en:

- Quick Questions.
- Advanced Context.

## Quick Questions

Quick Questions contiene 7 preguntas:

- Main migration objective.
- Expected migration timeline.
- Preferred target platform.
- Environment criticality.
- Include cost/licensing analysis.
- Include storage readiness.
- Additional context.

Objetivo:

- capturar senales de alto valor rapidamente;
- mejorar precision del reporte;
- no bloquear upload, parser ni report generation;
- permitir Unknown, Not applicable o Skip for now por pregunta.

## Advanced Context

Advanced Context queda visualmente secundario y colapsado por seccion.

Incluye:

- Business / Decision Context.
- VMware Environment.
- Storage.
- Network.
- Backup / DR.
- Business Criticality.
- Downtime / Windows.
- Proxmox Target.
- Compliance / Constraints.
- Free Text.

La nueva seccion Business / Decision Context agrega:

- report audience;
- decision support;
- project stage;
- expected outcome;
- report style;
- report language.

## Como se comunica que es optativo

En el tab `context` del assessment detail:

- titulo visible: `Migration Questions`;
- badges: `Recommended`, `Optional`, `Improves report confidence`;
- copy principal: explica que se puede generar reporte desde RVTools inventory solamente;
- panel de decision: aclara que el reporte se genera igual, pero con menor contexto de negocio;
- CTAs: `Answer quick questions`, `Generate report now` si aplica, `Upload RVTools first` si aplica y `Continue later`.

## Impacto en report confidence

La cobertura de migration context sigue usando `computeMigrationContextCoverage`.

- Empty/skipped => `missing`.
- Algunas respuestas => `limited` o `partial`.
- Respuestas suficientes => `strong`.
- `not_applicable` aporta credito parcial segun la logica existente.

El modulo `migration_questions` del Completion Center consume esta cobertura desde ACC-1.

## Integracion con Completion Center

- `migration_questions` queda `not_started` si no hay respuestas con credito.
- queda `partial` si hay algunas respuestas.
- queda `complete` si coverage es `strong`.
- si falta, aparece como recommended/missing y agrega limitation no culpabilizante.
- no altera `canGenerateReport`.
- no bloquea report generation si RVTools esta completo.

## Persistencia skipped/not_applicable

Implementado por pregunta, sin migracion DB:

- cada pregunta ya guarda `answered`, `unknown`, `not_applicable` o `skipped`;
- la persistencia usa `costRiskAssumptions.assumptionsJson.migrationContext`;
- no se agrego persistencia module-level de skip/not applicable.

Pendiente:

- decision de producto para skip/not applicable a nivel modulo completo.

## Tests

Archivo:

- `tests/unit/migrationContextUx.test.ts`

Casos:

- Quick Questions contiene el set esperado.
- Advanced Context queda separado del quick flow.
- contexto vacio/skipped produce coverage missing.
- pocas quick answers producen coverage parcial/limited.
- todas las preguntas respondidas producen coverage strong.
- skipped/not applicable por pregunta se persisten sin migracion.
- Additional context respeta `INPUT_LIMITS.manualTechnicalContext`.

## Validaciones

- `npm run test:run -- tests/unit/migrationContextUx.test.ts`: OK, 7 tests.
- `npm run test:run`: OK, 10 archivos / 44 tests.
- `npm run lint`: OK, 0 errores, 10 warnings preexistentes de `<img>`.
- `npm run typecheck`: OK.
- `npm run build`: OK, con warning NFT/Turbopack conocido no bloqueante.
- `npm run hostinger:diagnose`: OK, diagnostico seguro sin imprimir secretos.
- `npx prisma validate`: OK cargando `.env.local` solo dentro del proceso.
- `npx prisma generate`: OK cargando `.env.local` solo dentro del proceso.

## Que queda para ACC-4

- Mejorar modulos Storage Analysis y Licensing & Cost Exposure.
- Decidir persistencia module-level de skipped/not_applicable.
- Refinar deep links del Completion Center si se agregan sub-flujos dedicados.
- Integrar coverage del Completion Center en PDF/report.
- QA autenticada visual con assessment real de prueba.

## Riesgos pendientes

- Cambiar opciones puede dejar respuestas antiguas guardadas con valores que ya no aparecen en el select, aunque el JSON se conserva.
- No hay skip/not applicable a nivel modulo completo.
- QA visual autenticada queda pendiente si no hay sesion QA local disponible.

## Confirmaciones

- DB migration: NO.
- Push realizado: NO.
- Production deploy: NO.
- Production launched: NO.
