# HITO Industry Evaluations Landing Section

Fecha: 2026-05-28.

## Objetivo

Agregar a la landing publica una seccion de credibilidad comercial llamada:

- `Evaluaciones privadas por industria`

La seccion muestra ejemplos representativos de evaluaciones privadas por tipo de industria y decision, sin publicar nombres de empresas, marcas, ubicaciones ni detalles identificables de infraestructura.

## Ubicacion

Archivo principal:

- `src/views/LandingPage.tsx`

Ubicacion en la landing:

- Despues del bloque publico de demo/sample report.
- Despues de `Process`.
- Antes del FAQ y del CTA final.
- Anchor publico: `#industry-evaluations`.

No se modificaron:

- `/demo`.
- `/sample-report`.
- dashboard/admin/auth/backend.
- pricing.
- parser.
- PDF/report generation.
- assessment flow.
- logica de negocio.

## Evaluaciones incluidas

Se agregaron 4 cards compactas:

- Metalurgica industrial: renovacion, costos, riesgo.
- MSP regional: clientes, pipeline, priorizacion.
- Grupo multisede: inventario, sedes, evidencia.
- Servicios criticos de salud: continuidad, criticidad, validacion.

Cada card abre un modal con:

- titulo;
- industria;
- contexto;
- decision en juego;
- lo que ShiftReadiness permite ordenar;
- resultado del analisis;
- nota de privacidad.

## Decisiones de privacidad y copy

- No se usan logos reales.
- No se usan nombres reales de empresas.
- No se usan fotos de personas.
- No se afirma que sean testimonios publicos, casos reales verificables o clientes verificados.
- Se presentan como ejemplos representativos y anonimizados por industria y tipo de decision.
- No se prometen ahorros especificos.
- Las menciones a ahorro potencial, exposicion estimada y supuestos financieros se mantienen como evaluacion/modelado.
- La seccion esta escrita en espanol con tono enterprise y sobrio.

## UX/UI

- Cards compactas en grid responsive.
- 4 columnas en desktop cuando el ancho lo permite.
- 2x2 en anchos intermedios.
- Cards apiladas en mobile.
- CTA `Ver evaluacion` en cada card.
- Modal responsive con overlay oscuro.
- Cierre por boton, ESC y click fuera.
- Botones reales para abrir modal.
- Modal con `role="dialog"` y `aria-modal="true"`.

## Archivos modificados

- `src/views/LandingPage.tsx`
- `src/index.css`

## Archivos creados

- `docs/hito-industry-evaluations-landing-section.md`

## Validaciones

Ejecutadas:

- `npm run lint`: OK.
- `npm run typecheck`: OK.
- `npm run build`: OK, con warning NFT conocido no bloqueante.
- Smoke local: `/`, `/demo`, `/sample-report`, `/shiftreadiness` OK; `/dashboard` y `/dashboard/admin` redirigen a `/sign-in`.
- QA interactivo: 4 cards detectadas; cada card abre su modal; cierre por boton, ESC y click fuera validado.

## Riesgos pendientes

- Visual QA en navegador real puede ajustar spacing fino si se desea.
- No hay tracking de clicks en `Ver evaluacion`.
- La seccion no debe presentarse como testimonio publico verificable ni como cliente real identificable.
