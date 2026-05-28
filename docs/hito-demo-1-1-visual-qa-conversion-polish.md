# HITO DEMO-1.1 — Visual QA & Conversion Polish

Fecha: 2026-05-28.

## Objetivo

Revisar y pulir la experiencia publica `/demo` sin agregar features grandes, sin backend, sin DB, sin Gemini real y sin tocar configuracion Hostinger.

## Alcance revisado

- `/demo` local.
- `/demo` produccion.
- CTAs desde `/` y `/shiftreadiness`.
- Hero, replay interactivo, controles, before/after, outputs, limites y CTA final.
- Responsive mobile basico.
- Claims de seguridad comercial: sin migracion automatica, sin zero downtime como promesa, sin 100% success, sin full public launch.

## Visual QA

Resultado:

- Desktop: PASS.
- Mobile emulado 390 px: PASS despues de hotfix.
- Produccion `/demo`: 200 OK.
- Assets/HTML produccion: contenido renderizado, sin `__next_error__`.

Hallazgo principal:

- P2: Chrome mobile emulado mostro riesgo de recorte visual en hero y panel tecnico por textos largos y strings monoespaciados.

Fix aplicado:

- Se reforzo el layout mobile de `/demo` con ancho maximo por viewport.
- Se agrego wrapping mas agresivo para subtitulo, cuerpo, strings tecnicos y paneles terminal.
- Se redujo el headline en mobile y se forzo corte por palabras.

## Conversion polish

La demo comunica en los primeros segundos:

- Input: export VMware/RVTools.
- Proceso: coverage, riesgos, matriz VM, sizing, waves, AI Advisory notes.
- Output: decision pack y PDF ejecutivo.
- Limites: simulada, sin agentes, sin acceso a produccion, sin backend y sin migracion automatica.

Fix aplicado:

- El toggle de sonido ahora dice `Audio off` / `Visual cue only` para evitar que parezca audio real.
- El texto publico de marketing se ajusto para evitar lenguaje de ejecucion/cutover como promesa.

## Claims safety

Revisado:

- `/demo` mantiene `Simulated demo`.
- `/demo` no usa backend, DB, Gemini, uploads reales ni datos de cliente.
- `/demo` no promete migracion automatica.
- `/demo` no promete zero downtime.
- `/demo` no promete 100% success.
- Full public launch sigue NO.

Fix aplicado fuera de `/demo` por seguridad de copy:

- `Live cutover` paso a `Readiness handoff`.
- `From Readiness to Controlled Execution` paso a `From Readiness to Controlled Planning`.
- `SAFE CUTOVER` paso a `READY PLAN`.

Menciones restantes:

- Algunas menciones a `zero downtime`, `automatic migration`, `cutover` y `full public launch` siguen existiendo en guardrails, docs historicas o reportes tecnicos como limites/negaciones, no como claim activo de la demo.

## Responsive y accesibilidad

Confirmado:

- Botones visibles en mobile.
- CTA principal y secundarios apilados.
- Panel dataset legible.
- Replay rail apilado.
- Focus visible ya presente.
- `prefers-reduced-motion` ya presente.
- Sin dependencia exclusiva del color: severidades y estados tienen labels.

## Validaciones

Ejecutadas antes/durante el hito:

- `npm run hostinger:diagnose`: OK.
- `npm run ai:guardrails`: OK.
- `npm run typecheck`: OK.
- `npm run lint`: OK.
- `npm run build`: OK con warning NFT conocido.
- `npx prisma validate`: OK con `.env.local` cargado en proceso sin imprimir valores.
- `npx prisma generate`: OK.

Rutas:

- Local `/demo`: 200.
- Local `/`: 200.
- Local `/shiftreadiness`: 200.
- Produccion `/demo`: 200.
- Produccion `/`: 200.
- Produccion `/shiftreadiness`: 200.
- Produccion privadas: 307 a `/sign-in`.

## Seguridad

- No secrets.
- No `.env`.
- No API keys.
- No `DATABASE_URL`.
- No datos reales.
- No stash BETA-INVITE-1 aplicado.
- No Hostinger config tocada.
- No OpenAI activado.

## Decision

- DEMO-1.1 complete: SI.
- Demo ready for broader invited beta marketing: SI.
- Ready for full public launch: NO.

## Proximos pasos recomendados

- DEMO-2 opcional: analytics real si existe sistema aprobado, sample report sintetico seguro, polish de animaciones por escena.
- BETA-INVITE-1 cuando se decida reanudar invitaciones reales.
