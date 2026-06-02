# Demo Workspace Read-Only Synthetic

## Objetivo

Demo Workspace permite que un prospecto explore Shift Evidence antes de comprar sin obtener una herramienta gratuita para analizar su propia infraestructura.

La experiencia ahora forma parte de un funnel de demos:

- `/demo`: hub publico para elegir entre simulacion rapida y workspace profundo.
- `/demo/replay`: Migration Readiness Replay, una simulacion guiada de 60-120 segundos.
- `/demo/workspace`: Demo Workspace profundo read-only con 8 escenarios sinteticos.

## Decisiones de producto

- El demo es read-only.
- El demo usa datos sinteticos.
- El demo no representa una empresa real.
- El demo no analiza infraestructura del visitante.
- El demo no permite upload, edicion, creacion de assessments, billing, admin ni Advisor IA live.
- Full public launch no queda declarado.

## Usuario demo

El usuario reservado es `demo@shiftevidence.com`.

La experiencia publica no inicia sesion como ese usuario. Se implemento demo mode server-side con fixtures para evitar interferir con sesiones reales y para no depender de DB productiva, cookies ni credenciales visibles.

## Rutas demo

- `/demo`: hub publico de demos. Explica las dos experiencias y no analiza infraestructura real.
- `/demo/replay`: simulacion rapida, visual y sintetica para entender el flujo sin login.
- `/demo/workspace`: Demo Workspace publico/read-only.
- `/demo/reports/[scenario]`: PDF demo dinamico, generado desde fixtures sinteticos, sin escribir archivos ni mutar DB.

## Experiencias complementarias

`/demo/replay` y `/demo/workspace` no compiten entre si:

- Replay es educativo, rapido y marketing-friendly. Muestra como evidencia VMware/RVTools se convierte en un decision pack Proxmox.
- Workspace es exploracion tecnica profunda. Permite ver escenarios, scores, riesgos, Advisor transcript sintetico y PDFs demo.

Ambas experiencias usan datos sinteticos, no suben archivos, no acceden a produccion, no llaman Gemini/OpenAI y no mutan DB.

## Paginas publicas con CTA

- `/`: CTA en Hero.
- `/shiftreadiness`: CTA en hero y bloque explicativo.
- `/pricing`: bloque "Not ready to purchase yet?".
- `/sample-report`: CTA "Want more than a PDF?".
- `/vmware-to-proxmox-readiness`: CTA en hero y bloques comerciales.

## Datasets

1. `balanced-mid-market`: Balanced Mid-Market VMware Exit.
2. `storage-risk-heavy`: Storage Risk Heavy.
3. `backup-evidence-missing`: Backup Evidence Missing.
4. `critical-sql-erp`: Critical SQL / ERP Workloads.
5. `proxmox-target-partial`: Proxmox Target Partial Readiness.
6. `msp-client-sample`: MSP Client Sample.
7. `low-evidence-low-confidence`: Low Evidence / Low Confidence Assessment.
8. `enterprise-multisite`: Enterprise Multi-Site Complexity.

Cada dataset incluye slug, nombre, descripcion, badges, VM count, host count, datastore count, readiness score, confidence score, evidence received, evidence missing, risks, recommendations, migration waves, report config, disclaimer y Advisor transcript sintetico.

## Que puede hacer el visitante

- Navegar los 8 escenarios sinteticos.
- Ver scores, riesgos, evidencia recibida/faltante y recomendaciones.
- Revisar Migration Recommendation Plan sintetico.
- Leer Senior AI Advisor Demo Transcript.
- Descargar PDFs demo sinteticos.
- Ir a pricing o sign-up para iniciar assessment pago.

## Que esta bloqueado

- Upload de archivos propios.
- Creacion de assessments reales.
- Edicion de formularios/evidencia.
- Borrado de evidencia.
- Generacion persistente de reportes reales.
- Live Senior Advisor.
- Project Memory mutation.
- Billing checkout/order/subscription mutation desde demo.
- Admin.
- Entitlements.

## Acceso one-click

Los CTAs publicos llevan a `/demo/replay` o `/demo/workspace` segun contexto. No se solicita password ni se reemplaza la sesion de un usuario real. Si un usuario real esta logueado, puede ver las rutas demo sin perder su sesion.

## Aislamiento y datos reales

El Demo Workspace se alimenta desde `src/server/demo/demoDatasets.ts`. No lee assessments reales, workspaces reales, reportes privados ni storage paths privados.

Los reportes demo se generan en `/demo/reports/[scenario]` desde fixtures. No usan `Report`, `EvidenceFile`, storage productivo ni `relativePath`.

## Bloqueo de mutaciones

El helper central esta en `src/server/demo/demoGuards.ts`.

Funciones principales:

- `isDemoUserEmail`
- `isDemoAssessmentId`
- `isDemoMode`
- `assertNotDemoMode`
- `getDemoBlockedMessage`

Se conecto a mutaciones criticas:

- creacion de assessments;
- edicion/archivo/toggle de assessments demo;
- client context y additional evidence;
- upload de evidence adicional;
- Advisor live;
- admin auth.

## PDFs demo

Los PDFs son dinamicos y publicos:

- `/demo/reports/balanced-mid-market`
- `/demo/reports/storage-risk-heavy`
- `/demo/reports/backup-evidence-missing`
- `/demo/reports/critical-sql-erp`
- `/demo/reports/proxmox-target-partial`
- `/demo/reports/msp-client-sample`
- `/demo/reports/low-evidence-low-confidence`
- `/demo/reports/enterprise-multisite`

Cada PDF incluye:

- `Synthetic Demo Report`;
- `Generated from synthetic sample data`;
- `Not based on a real company or real infrastructure`;
- `Shift Evidence Demo Workspace`.

## Advisor transcript sintetico

El bloque `Senior AI Advisor - Demo Transcript` usa fixtures del registry. No llama Gemini, OpenAI ni ningun provider. No descuenta creditos ni crea usage events.

## Tests agregados

Archivo:

- `tests/unit/demoWorkspace.test.ts`

Cobertura:

- registry de 8 datasets;
- slugs unicos;
- CTA publico en 5 paginas;
- guardrails demo;
- aislamiento de report paths;
- disclaimers sinteticos.

## Validaciones

Validaciones esperadas al cierre:

- `npx prisma validate`
- `npx prisma generate`
- `npm run typecheck`
- `npm run lint`
- `npm run test:run`
- `npm run build`

## Riesgos remanentes

- Requiere QA visual posterior para ajustar densidad y conversion.
- Los PDFs demo son funcionales y seguros, pero pueden pulirse visualmente en un hito `DEMO-WORKSPACE-1B`.
- El demo no registra analytics de conversion aun.
- La cuenta `demo@shiftevidence.com` existe como usuario reservado, pero el flujo publico no la usa como sesion real.

## Proximos pasos

- DEMO-WORKSPACE-1B visual QA/polish.
- Smoke publico post-push.
- Analytics de conversion.
- A/B testing de CTA.
- Ampliar datasets sinteticos.
