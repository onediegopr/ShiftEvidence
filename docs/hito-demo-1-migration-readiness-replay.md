# HITO DEMO-1 - Migration Readiness Replay

Fecha: 2026-05-28  
Estado: implementado en codigo  
Ruta publica: `/demo`  
Full public launch: NO

## 1. Objetivo

Crear una pagina publica nueva llamada **Migration Readiness Replay** para mostrar, con datos sinteticos, como un export VMware/RVTools puede transformarse en un assessment profesional VMware -> Proxmox.

La demo esta pensada para explicar valor antes de pedir registro, upload o llamada. No reemplaza el assessment real y no ejecuta ningun proceso de migracion.

## 2. Ruta

- Ruta: `/demo`.
- Titulo visible: `Migration Readiness Replay`.
- Subtitulo: `See how a VMware export becomes a Proxmox migration readiness report.`
- CTA principal: `Start replay`.
- CTA secundario: `Start readiness assessment`.
- CTAs adicionales: `Skip to final report`, `Book readiness review`, `Back to home`.

## 3. Narrativa

La pagina muestra un replay simulado desde evidencia exportada hasta un decision pack:

1. Carga de evidencia.
2. Parseo de inventario VMware.
3. Cobertura de evidencia.
4. Deteccion de riesgos.
5. Matriz de complejidad por VM.
6. Sizing Proxmox.
7. Olas de migracion.
8. Notas AI Advisory.
9. Preview de reporte final.

El posicionamiento es readiness/planning basado en evidencia. No se presenta como migrador automatico, autoconverter ni herramienta de cutover.

## 4. Dataset sintetico

Dataset ficticio:

- Cliente: `ACME Manufacturing Group`.
- Archivo: `rvtools_export_acme_corp.xlsx`.
- 126 VMs.
- 6 ESXi hosts.
- 3 clusters.
- 14 datastores.
- 38 port groups.
- 22 VLANs.
- 19 snapshots.
- 7 old snapshots.
- 12 outdated VMware Tools.
- 4 VMs with disks above 2 TB.
- 9 multi-NIC VMs.
- 3 possible domain controllers.
- 5 SQL/ERP-like workloads.
- 2 datastores above 85%.
- Backup evidence missing.
- Application dependency map missing.
- Proxmox target partial.

No usa datos reales de clientes.

## 5. Escenas implementadas

Upload Evidence:

- File card sintetica.
- Progreso visual.
- Badges: no agents, no production access, no credentials required, synthetic dataset.

Inventory Parsing:

- Stream visual de parseo: `vInfo`, `vCPU`, `vMemory`, `vDisk`, `vDatastore`, `vNetwork`, `vSnapshot`.
- Metricas detectadas: VMs, hosts, clusters, datastores, port groups, VLANs y snapshots.

Evidence Coverage:

- Tabla de evidencia completa/parcial/faltante.
- Evidence Confidence: 64%.

Risk Engine:

- Alertas de riesgo para snapshots viejos, VMware Tools desactualizado, discos grandes, multi-NIC, domain controllers posibles, SQL/ERP, datastores calientes y backup faltante.

VM Complexity Matrix:

- Tabla con VMs sinteticas y accion recomendada por complejidad.

Proxmox Target Sizing:

- Cards de nodos recomendados, RAM target, storage usable, backup capacity, HA readiness y network readiness.
- Disclaimer de que esta basado en allocation, no performance historica.

Migration Waves:

- Timeline de Wave 0, Wave 1, Wave 2, Wave 3, Hold y Retire.

AI Advisory Notes:

- Executive advisory.
- Technical advisory.
- Confidence impact.
- Recommended next actions.
- Aclaracion: AI Advisory no reemplaza scores deterministas.

Final Report:

- Preview de reporte ejecutivo.
- Readiness Score.
- Confidence Score.
- Secciones del PDF decision-ready.
- Limitaciones claras.

## 6. Controles

Controles implementados:

- Play.
- Pause.
- Previous.
- Next step.
- Restart.
- Skip to report.
- Sound visual toggle.

Nota:

- DEMO-1 no reproduce audio real. El sound toggle es visual para evitar autoplay, permisos de navegador y ruido operativo.

## 7. CTAs agregados

Home `/`:

- CTA secundario en el showcase: `Watch the readiness replay`.
- Seccion dedicada: `See the assessment before you start.`

`/shiftreadiness`:

- CTA secundario en hero: `Watch the readiness replay`.

Demo final:

- `Start readiness assessment` -> `/sign-up`.
- `Book readiness review` -> `/contact`.
- `Back to home` -> `/`.

## 8. Limites y seguridad

La demo:

- No usa backend.
- No usa DB.
- No llama Gemini real.
- No requiere login.
- No sube archivos reales.
- No usa datos reales.
- No imprime ni referencia secrets.
- No expone API keys.
- No usa OpenAI.
- No declara full public launch.

Claims prohibidos respetados:

- No promete migracion automatica.
- No promete zero downtime.
- No promete 100% success.
- No promete cutover automatico.
- No se presenta como converter.

## 9. Implementacion tecnica

Archivos creados:

- `src/app/demo/page.tsx`.
- `src/components/demo/MigrationReadinessReplay.tsx`.
- `src/components/demo/ReplayControls.tsx`.
- `src/components/demo/ReplayScene.tsx`.
- `src/components/demo/replayData.ts`.

Archivos modificados:

- `src/index.css`.
- `src/views/LandingPage.tsx`.
- `src/views/ShiftReadinessPage.tsx`.

Arquitectura:

- `page.tsx` es server component.
- Replay interactivo es client component.
- Dataset local en TypeScript.
- Sin dependencias nuevas.

## 10. UX / responsive / accesibilidad

Implementado:

- Estilo dark operational control center coherente con `glass-card`, `badge`, `btn`, `shiftreadiness-*`.
- Layout responsive con columnas apiladas en mobile.
- Tablas con `overflow-x`.
- Controles accesibles por teclado.
- `focus-visible` para tabs y controles.
- `prefers-reduced-motion` respeta usuarios con motion reducido.
- No se usa texto solo por color para severidad: hay labels visibles.

## 11. Validaciones

Validaciones iniciales antes de implementar:

- `npm run hostinger:diagnose`: OK.
- `npm run ai:guardrails`: OK.
- `npm run typecheck`: OK.
- `npm run lint`: OK.
- `npm run build`: OK con warning NFT conocido.

Validaciones post-implementacion deben ejecutarse antes del cierre:

- `npm run hostinger:diagnose`.
- `npm run ai:guardrails`.
- `npm run typecheck`.
- `npm run lint`.
- `npm run build`.
- `npx prisma validate`.
- `npx prisma generate`.
- Smoke local de `/demo`.
- Smoke produccion de `/demo` post-push/deploy.

## 12. Riesgos pendientes

- Hostinger/HCDN puede servir HTML cacheado con assets viejos si no se purga cache despues del deploy. Esto ya fue observado en RECOVERY-2 y debe validarse post-push.
- Sound toggle es visual solamente; audio real queda fuera de DEMO-1.
- No hay analytics real; solo `data-event` attributes no bloqueantes.
- DEMO-1 no incluye sample PDF descargable real.

## 13. Proximos pasos DEMO-2

Opcionales:

- Purga/estrategia de cache HTML en Hostinger si HCDN sigue sirviendo HTML stale.
- Capturas visuales desktop/mobile.
- Eventos analytics reales si existe sistema aprobado.
- Sample report sintetico descargable, si se crea como asset publico seguro.
- Refinar animacion por escena y QA visual autenticado/no autenticado.

## 14. Decision final

- `/demo` implementado: SI.
- Demo teatralizada funcional: SI.
- No backend/DB/Gemini: SI.
- CTAs agregados: SI.
- Full public launch: NO.

## 15. DEMO-1.1 visual QA

DEMO-1.1 completo la revision visual y de conversion:

- Mobile 390 px validado sin overflow real.
- Hero y panel dataset ajustados para textos largos.
- Toggle de sonido aclarado como visual-only.
- Copy publico ajustado para evitar lenguaje de ejecucion/cutover como promesa.
- Produccion `/demo`: 200 OK.

## 16. SAMPLE-REPORT-1 linkage

SAMPLE-REPORT-1 agrega `/sample-report` como foundation publica para mostrar el entregable esperado:

- Usa el mismo dataset sintetico ACME.
- No usa backend, DB, Gemini, upload real ni datos reales.
- No publica PDF real todavia; muestra `Sample PDF coming soon`.
- `/demo` incluye un bloque `Want to see the final deliverable?` con CTA a `/sample-report`.
