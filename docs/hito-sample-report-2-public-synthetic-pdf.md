# HITO SAMPLE-REPORT-2 - Public Synthetic Sample PDF

Fecha: 2026-05-28.

## Objetivo

Crear un PDF publico, sintetico y descargable que complemente `/demo` y `/sample-report`.

El objetivo comercial es mostrar el entregable final antes de pedir registro, upload o llamada, sin usar datos reales y sin presentar ShiftReadiness como migrador automatico.

## PDF generado

Archivo versionado:

- `public/sample-reports/proxmox-migration-readiness-sample-report.pdf`

Ruta publica:

- `/sample-reports/proxmox-migration-readiness-sample-report.pdf`

Caracteristicas:

- 15 paginas.
- PDF estatico servido desde `public/`.
- Dataset sintetico: `ACME Manufacturing Group`.
- No usa backend.
- No usa DB.
- No llama Gemini real.
- No usa datos reales.
- No contiene secrets, API keys, DB URLs ni storage paths privados.

## Generador reproducible

Se agrego un generador seguro:

- `scripts/generate-public-sample-report.mjs`

Script npm:

- `npm run sample-report:generate`

El script genera el PDF desde datos sinteticos locales y escribe el resultado en `public/sample-reports/`.

## Dataset sintetico

Contexto ACME:

- 126 VMs.
- 6 ESXi hosts.
- 3 clusters.
- 14 datastores.
- 38 port groups.
- 22 VLANs.
- 19 snapshots.
- Backup evidence missing.
- Application dependencies missing.
- Proxmox target partial.

Scores del sample:

- Migration Readiness Score: `64/100`.
- Evidence Confidence Score: `58/100`.

## Contenido del PDF

El PDF incluye:

1. Cover.
2. Executive Summary.
3. Environment Overview.
4. Readiness Score.
5. Evidence Confidence Score.
6. Evidence Matrix.
7. Top Risks.
8. VM Classification Preview.
9. Proxmox Sizing Preview.
10. Migration Wave Preview.
11. AI Advisory Notes.
12. Required Validations.
13. Next Steps.
14. What This Sample Does Not Prove.
15. CTA / Final Page.

## Claim safety

El PDF declara que es un sample sintetico y no usa datos reales.

No promete:

- migracion automatica;
- zero downtime;
- 100% success;
- backup restorability sin evidencia;
- dependencias de aplicacion no provistas;
- ejecucion de cutover.

AI Advisory se presenta como apoyo consultivo y no reemplaza scores deterministas de readiness/confidence.

## Paginas actualizadas

`/sample-report`:

- Cambio de `Sample PDF coming soon` a CTA real `Download sample PDF`.
- Link al PDF publico.
- Nota visible: `Synthetic sample. No customer data.`

`/demo`:

- El bloque `Want to see the final deliverable?` ahora lleva a `View and download sample report`.
- La descarga sigue pasando por `/sample-report` para mantener contexto antes del PDF.

Home `/` y `/shiftreadiness`:

- Mantienen CTA discreto `View sample report`.
- No se agrego descarga directa para no saturar el flujo principal.

## Validaciones del PDF

Validado:

- archivo existe;
- header `%PDF-`;
- Pages tree `/Count 15`;
- no contiene `[object Object]`;
- no contiene JSON crudo;
- contiene marcadores `Synthetic`;
- no contiene nombres de variables sensibles ni patrones de API key conocidos;
- no contiene datos reales de clientes.

## Validaciones tecnicas

Validaciones esperadas para cierre:

- `npm run hostinger:diagnose`.
- `npm run ai:guardrails`.
- `npm run typecheck`.
- `npm run lint`.
- `npm run build`.
- `npx prisma validate`.
- `npx prisma generate`.
- `npm run sample-report:generate`.

Rutas esperadas:

- Local `/sample-report`: 200.
- Local PDF: 200.
- Local `/demo`: 200.
- Produccion `/sample-report`: 200.
- Produccion PDF: 200.
- Produccion `/demo`: 200.
- Privadas sin sesion: 307 a `/sign-in`.

## Riesgos pendientes

- El PDF publico es comercial y resumido; no reemplaza el reporte tecnico completo de un assessment real.
- No hay preview embebido del PDF dentro de `/sample-report`.
- No hay tracking real de descargas salvo que se agregue un sistema aprobado en otro hito.
- Hostinger/HCDN puede tardar en servir el asset nuevo hasta que termine deploy/cache.

## Decision

- SAMPLE-REPORT-2 complete: SI cuando build/rutas/push pasen.
- Public sample PDF ready: SI.
- Ready for broader invited beta marketing: SI.
- Ready for full public launch: NO.

## SAMPLE-REPORT-2.1 Visual QA

SAMPLE-REPORT-2.1 reviso el PDF visualmente con render local de las 15 paginas y capturas de `/sample-report`.

Resultado:

- PDF visualmente usable como sample comercial.
- No se detectaron paginas vacias innecesarias.
- No se detecto texto cortado grave en el PDF.
- Se corrigio overflow horizontal mobile en `/sample-report`.
- `npm run sample-report:generate` ahora produce un PDF reproducible al normalizar metadata no sensible.
