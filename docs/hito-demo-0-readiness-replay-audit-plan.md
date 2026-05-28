# HITO DEMO-0 - Migration Readiness Replay Audit Plan

Fecha: 2026-05-28  
Estado: auditoria y planificacion, sin implementacion funcional  
Full public launch: NO

## 1. Objetivo

Auditar el estado actual de la web publica, rutas, componentes, estilos, copy y riesgos antes de implementar una demo teatralizada tipo **Migration Readiness Replay** para ShiftReadiness.

Este hito no implementa `/demo`, no toca base de datos, no toca Hostinger, no activa OpenAI, no aplica el stash de BETA-INVITE-1 y no modifica funcionalidad core.

## 2. Estado Git auditado

- Branch: `main`.
- HEAD inicial auditado: `ca2c080d17f9a85f2c034f262c2a2f62361885a6`.
- origin/main inicial auditado: `ca2c080d17f9a85f2c034f262c2a2f62361885a6`.
- Working tree inicial: limpio.
- Divergencia: no detectada.
- Stash BETA-INVITE-1: preservado, no aplicado.

## 3. Validaciones base

Resultado inicial:

- `npm run typecheck`: OK.
- `npm run lint`: FAIL preexistente en `src/app/sign-up/page.tsx` y `src/views/SignUpPage.tsx` por `react-hooks/set-state-in-effect`.
- `npm run build`: OK.
- `npm run hostinger:diagnose`: OK.
- `npm run ai:guardrails`: OK.
- `npx prisma validate`: OK al cargar `.env.local` al proceso sin imprimir valores.
- `npx prisma generate`: OK al liberar previamente el lock del servidor local sobre el engine Prisma y reiniciar localhost.

Nota: DEMO-0 es solo auditoria/documentacion. No se corrigio el lint porque implicaria cambio funcional fuera del alcance de este hito. Debe resolverse antes o durante un hito de hotfix separado si se exige gate verde completo para DEMO-1.

Warning conocido:

- Build mantiene warning NFT/Turbopack relacionado con `src/server/reports/reportStorageService.ts` y rutas de descarga de reportes. No bloquea este plan.

## 4. Rutas existentes

Rutas publicas detectadas:

- `/`: `src/app/page.tsx`, renderiza `src/views/LandingPage.tsx`.
- `/shiftreadiness`: `src/app/shiftreadiness/page.tsx`, renderiza `src/views/ShiftReadinessPage.tsx`.
- `/sign-in`: `src/app/sign-in/page.tsx`.
- `/sign-up`: `src/app/sign-up/page.tsx`.
- `/forgot-password`: `src/app/forgot-password/page.tsx`.
- `/reset-password`: `src/app/reset-password/page.tsx`.
- `/contact`: `src/app/contact/page.tsx`.

Rutas privadas relevantes:

- `/dashboard`.
- `/dashboard/assessments`.
- `/dashboard/assessments/new`.
- `/dashboard/assessments/[id]`.
- `/dashboard/assessments/[id]/report`.
- `/dashboard/admin`.
- `/dashboard/admin/unlock-requests`.

APIs relevantes, solo para contexto:

- `/api/admin/ai/status`.
- `/api/admin/ai/usage`.
- `/api/admin/settings`.
- `/api/admin/entitlements`.
- `/api/admin/opportunities`.
- `/api/assessments/[id]/reports/generate`.
- `/api/assessments/[id]/reports/[reportId]/download`.

No existe actualmente:

- Ruta `/demo`.
- Pagina standalone de sample report.
- Pagina standalone de pricing. El pricing vive como seccion `#pricing` dentro de `/shiftreadiness`.

## 5. Baseline local y produccion

Localhost:

- Proceso escuchando en `:3000`: SI, PID `15980`.
- `http://localhost:3000`: 200.
- `http://localhost:3000/shiftreadiness`: 200.
- `http://localhost:3000/sign-in`: 200.

Produccion:

- `https://shiftevidence.com/`: 200.
- `https://shiftevidence.com/shiftreadiness`: 200.
- `https://shiftevidence.com/sign-in`: 200.
- `https://shiftevidence.com/dashboard`: 307 a `/sign-in`.

Resultado: baseline publico actual sano para planificar DEMO-1.

## 6. UX/UI actual

Stack visual detectado:

- Next.js App Router.
- React 19.
- CSS global en `src/index.css`.
- No se detecto Tailwind como sistema principal.
- No se detecto Framer Motion.
- `lucide-react` esta disponible y se usa ampliamente.
- No se detecto `recharts`.

Patrones visuales actuales:

- Estetica dark/glass con cards translúcidas.
- Clases globales: `section`, `container`, `glass-card`, `btn`, `btn-primary`, `btn-secondary`, `btn-glow`, `badge`, `badge-cyan`.
- Patrones especificos de ShiftReadiness: `shiftreadiness-*`, `sr-*`.
- Mockups de dashboard y cards ya existentes en home y `/shiftreadiness`.
- Grids responsive y cards apilables.
- CTAs con iconos `ArrowRight`.

Componentes reutilizables:

- `src/components/Navbar.tsx`.
- `src/components/Hero.tsx`.
- `src/components/Footer.tsx`.
- `src/views/LandingPage.tsx`.
- `src/views/ShiftReadinessPage.tsx`.
- Clases CSS existentes para cards, badges, botones, paneles y mockups.

Recomendacion:

- DEMO-1 debe reutilizar el lenguaje visual `glass-card` / `sr-*`.
- Evitar introducir librerias nuevas de animacion.
- Usar interactividad React local solo donde haga falta.
- Mantener page-level composition en App Router.

## 7. CTAs actuales

Home (`/`):

- Hero principal lleva a `/sign-up`.
- Seccion `#readiness-showcase` tiene:
  - `Start Free Assessment` -> `/sign-up`.
  - `View Assessment Plans` -> `/shiftreadiness#pricing`.

ShiftReadiness (`/shiftreadiness`):

- Navbar:
  - `Pricing` -> `#pricing`.
  - `Start Free Check` -> `/sign-up`.
- Hero:
  - `Start Free Readiness Check` -> `/sign-up`.
  - `View plans and add-ons` -> `#pricing`.
- Pricing:
  - CTAs a `/sign-up` y `/contact`.
- Final CTA:
  - `Start Free Readiness Check` -> `/sign-up`.
  - `Compare plans` -> `#pricing`.

Recomendacion de insercion para DEMO-1:

1. Agregar CTA secundario en home hero o cerca de `#readiness-showcase`: `Watch the readiness replay`.
2. Agregar CTA secundario en hero de `/shiftreadiness`: `Watch the demo`.
3. Agregar una seccion dedicada despues de `#assessment` o antes de `#pricing`: `See the assessment before you start.`
4. No agregar CTAs en todos los bloques para evitar saturacion.

## 8. Copy actual y claims

Hallazgos:

- La pagina `/shiftreadiness` ya incluye un bloque claro de "What ShiftReadiness does not do".
- El producto ya evita prometer migracion automatica, cambios en produccion o reemplazo de validacion final.
- Las menciones a `Automatic migration` aparecen como exclusion de planes o guardrail, no como claim activo.
- Las menciones a `zero downtime` aparecen en prompts/docs/reportes como prohibicion o aclaracion negativa.
- No se detecto claim activo de OpenAI como proveedor activo.
- No se detecto declaracion activa de full public launch.

Riesgo de copy para DEMO-1:

- La palabra "Replay" puede interpretarse como ejecucion real si no se aclara que es simulada.
- La demo no debe sugerir que sube datos reales, llama Gemini, genera PDF real o ejecuta migracion.
- Evitar frases como "automatic migration", "zero downtime", "guaranteed success", "converter", "cutover automation".

## 9. Ubicacion recomendada de la demo

Ruta recomendada:

- `/demo`

Nombre:

- `Migration Readiness Replay`

Subtitulo:

- `See how a VMware export becomes a Proxmox migration readiness report.`

Justificacion:

- Es una ruta publica simple, memorable y separada de `/shiftreadiness`.
- Permite explicar valor antes de pedir registro, upload o llamada.
- Evita saturar la landing principal con toda la narrativa.
- Puede linkearse desde home, `/shiftreadiness`, mensajes comerciales y onboarding beta.

Copy recomendado para seccion CTA:

Titulo:

- `See the assessment before you start.`

Body:

- `Watch a simulated VMware -> Proxmox readiness replay and see how a raw RVTools export becomes a professional migration decision pack: evidence coverage, VM risk classification, Proxmox sizing, migration waves, AI Advisory notes and an executive-ready PDF report.`

Badges:

- `No agents`
- `No production access`
- `Starts with RVTools`
- `Evidence-based`

CTA:

- `Watch the readiness replay`

Nota:

- En codigo se puede usar `{"->"}` o `&rarr;` segun consistencia existente. Mantener ASCII en archivos si se edita codigo, salvo que el archivo ya use simbolos.

## 10. Arquitectura propuesta para DEMO-1

Opcion recomendada segun estructura actual:

- `src/app/demo/page.tsx`: metadata y render de la pagina.
- `src/components/demo/MigrationReadinessReplay.tsx`: componente principal interactivo.
- `src/components/demo/ReplayControls.tsx`: controles de play, pausa, siguiente, reiniciar.
- `src/components/demo/ReplayScene.tsx`: render de escena activa.
- `src/components/demo/replayData.ts`: dataset sintetico y escenas.

Alternativa si se prefiere menor cantidad de archivos:

- `src/app/demo/page.tsx`.
- `src/components/demo/MigrationReadinessReplay.tsx`.

Client/server:

- `page.tsx` puede ser server component.
- `MigrationReadinessReplay.tsx` debe ser client component por timers/interaccion.
- Dataset local, importado desde TS.

Restricciones:

- Sin backend.
- Sin DB.
- Sin Gemini real.
- Sin upload real.
- Sin lectura de archivos.
- Sin secretos.
- Sin datos reales.
- Sin dependencias nuevas salvo necesidad justificada.

## 11. Dataset sintetico recomendado

Dataset ACME:

- Cliente: `ACME Manufacturing Group`.
- Tipo: manufactura regional.
- VMs: 126.
- ESXi hosts: 6.
- Clusters: 3.
- Datastores: 14.
- Port groups: 38.
- VLANs: 22.
- Snapshots: 19.
- Backup evidence: missing.
- Dependency map: missing.
- Proxmox target: partial.
- Storage: mezcla de SAN/NFS/local.
- Readiness inicial sugerido: medio.
- Confidence inicial sugerido: limitado por evidencia faltante.

Regla:

- Todo debe estar marcado como sintetico o simulado.
- No usar nombres, dominios, emails, IPs, rutas, exports o archivos reales.

## 12. Escenas recomendadas para DEMO-1

1. Upload Evidence
   - Visual: tarjeta de RVTools/CSV entrando al pipeline.
   - Copy: `A synthetic RVTools-style export is loaded into the readiness workflow. No agents, no credentials, no production access.`

2. Parse VMware Inventory
   - Visual: conteos de VMs, hosts, clusters, datastores, networks.
   - Copy: `The inventory is normalized into infrastructure facts that can be reviewed and scored.`

3. Evidence Coverage
   - Visual: matriz de evidencia completa/parcial/faltante.
   - Copy: `The platform separates what is known from what still needs validation.`

4. Risk Engine
   - Visual: riesgos por snapshots, backup gaps, storage ambiguity, dependency gaps.
   - Copy: `Risk is calculated from evidence patterns and missing context, not from guesswork.`

5. VM Complexity Matrix
   - Visual: simple grid low/medium/high complexity.
   - Copy: `Workloads are grouped by migration complexity so teams know what can move first and what needs review.`

6. Proxmox Target Sizing
   - Visual: host/storage target panel con recomendaciones prudentes.
   - Copy: `Sizing is framed as planning input, not final architecture sign-off.`

7. Migration Waves
   - Visual: wave 1, wave 2, wave 3 con criterios.
   - Copy: `Migration waves turn inventory into a controlled sequencing discussion.`

8. AI Advisory Notes
   - Visual: advisory panel con notas guardrailed.
   - Copy: `AI Advisory summarizes risks, gaps and next questions without replacing deterministic scores.`

9. Final Report
   - Visual: preview de PDF ejecutivo.
   - Copy: `The final output is a decision-ready report: evidence, scores, risks, waves, assumptions and limitations.`

Escena opcional:

10. Before/After
   - Visual: antes = raw export / despues = decision pack.
   - Copy: `The value is not automatic migration. The value is clarity before migration.`

## 13. Plan exacto para DEMO-1

1. Crear ruta publica `/demo`.
2. Crear dataset sintetico ACME local.
3. Crear componente interactivo `MigrationReadinessReplay`.
4. Implementar escenas con transicion controlada y botonera.
5. Agregar aviso visible: `Simulated demo. No customer data. No production access.`
6. Agregar CTAs finales:
   - `Start a readiness assessment` -> `/sign-up`.
   - `View plans` -> `/shiftreadiness#pricing`.
7. Agregar CTA secundario desde home.
8. Agregar CTA secundario desde `/shiftreadiness`.
9. Validar responsive desktop/mobile.
10. Validar `prefers-reduced-motion`.
11. Validar no secrets, no datos reales, no backend.
12. Ejecutar typecheck/lint/build/guardrails.
13. Documentar DEMO-1.

## 14. Riesgos y mitigacion

Riesgo: confundir demo con migrador automatico.

- Mitigacion: usar `simulated replay`, `readiness`, `planning`, `evidence-based`, `no production access`, `not a migration tool`.

Riesgo: romper landing actual con CTAs duplicados.

- Mitigacion: agregar maximo uno o dos CTAs externos hacia `/demo`; no reemplazar todos los CTAs primarios.

Riesgo: animaciones pesadas o molestas.

- Mitigacion: CSS/transiciones ligeras, controles manuales, `prefers-reduced-motion`, no autoplay agresivo.

Riesgo: audio bloqueado o intrusivo.

- Mitigacion: no incluir audio en DEMO-1, o dejarlo off por defecto si se decide despues.

Riesgo: SSR/client mismatch.

- Mitigacion: timers y estado solo dentro de client component; `page.tsx` server component simple.

Riesgo: tablas desbordan en mobile.

- Mitigacion: cards apiladas, `overflow-x-auto` si hay matriz, `min-width: 0`, labels compactos.

Riesgo: performance/bundle.

- Mitigacion: dataset pequeno, sin librerias nuevas, sin video pesado.

Riesgo: claims comerciales excesivos.

- Mitigacion: copy prudente, no prometer savings garantizados, zero downtime, conversion automatica ni exito total.

## 15. Clasificacion de hallazgos

Reutilizar:

- Layout dark/glass.
- `glass-card`, `badge`, `btn`, `btn-glow`, `sr-*`.
- `lucide-react`.
- Home `#readiness-showcase`.
- `/shiftreadiness` hero y seccion `#assessment`.

Evitar:

- Backend.
- DB.
- Gemini real.
- Upload real.
- Audio autoplay.
- Dependencias nuevas de animacion.
- Copy que sugiera migracion automatica.

Modificar en DEMO-1:

- Agregar ruta `/demo`.
- Agregar CTA acotado en home.
- Agregar CTA acotado en `/shiftreadiness`.
- Crear componentes de replay y dataset sintetico.

Riesgo:

- Lint preexistente rojo en sign-up.
- Algunas paginas/docs historicas mencionan claims prohibidos como ejemplos o negaciones; no deben reaparecer como claims activos.

Pendiente:

- Resolver lint de `sign-up` fuera de DEMO-0 o al inicio de DEMO-1 si se exige pipeline verde.
- QA visual con navegador despues de implementar DEMO-1.

## 16. Criterios de cierre DEMO-1

DEMO-1 deberia cerrarse solo si:

- `/demo` existe y carga en local y produccion tras deploy normal.
- No usa datos reales.
- No usa backend, DB, Gemini ni upload real.
- Demo se declara como simulada.
- CTAs no saturan home ni `/shiftreadiness`.
- No hay claims de migracion automatica, zero downtime ni exito garantizado.
- Responsive desktop/mobile aceptable.
- `prefers-reduced-motion` respetado.
- typecheck/lint/build OK.
- No secrets.
- No OpenAI.
- No full public launch.

## 17. Decision final

DEMO-0 queda planificado con recomendacion clara:

- Implementar `/demo` como pagina publica nueva.
- Nombrarla `Migration Readiness Replay`.
- Usar dataset sintetico ACME.
- Usar componentes locales sin backend.
- Agregar CTAs limitados desde home y `/shiftreadiness`.
- Mantener posicionamiento como readiness/planning basado en evidencia.

Estado: listo para DEMO-1, condicionado a resolver o aceptar explicitamente el lint preexistente antes del commit funcional.

## 18. DEMO-1 implementation follow-up

Fecha: 2026-05-28.

DEMO-1 implementa la recomendacion de este plan:

- Ruta publica nueva: `/demo`.
- Nombre visible: `Migration Readiness Replay`.
- Dataset sintetico: `ACME Manufacturing Group`.
- Componentes client-side sin backend, DB, upload real ni Gemini real.
- CTAs acotados desde home y `/shiftreadiness`.
- Documentacion principal: `docs/hito-demo-1-migration-readiness-replay.md`.

Nota operativa:

- Antes de DEMO-1 se cerro RECOVERY-2 y el lint gate de `sign-up` quedo limpio.
- Hostinger/HCDN puede requerir purga de cache despues del deploy para evitar HTML stale con assets `_next` antiguos.
