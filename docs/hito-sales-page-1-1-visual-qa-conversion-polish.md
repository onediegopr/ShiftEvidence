# HITO SALES-PAGE-1.1 - Visual QA & Conversion Polish

Fecha: 2026-05-28.

## Objetivo

Revisar visualmente y pulir la pagina standalone:

- `/vmware-to-proxmox-readiness`

El objetivo fue mejorar claridad comercial, conversion y seguridad de claims sin modificar home `/`, navegacion global ni `/shiftreadiness`.

## Alcance revisado

- Hero.
- Pain section.
- How it works.
- Replay CTA.
- Sample report CTA.
- What you receive.
- Evidence-based section.
- Evidence sources.
- Pricing preview.
- What this is not.
- FAQ.
- CTA final.
- Links desde `/demo` y `/sample-report`.
- Produccion sin sesion.

## Visual QA

Resultado local:

- `/vmware-to-proxmox-readiness`: 200.
- `/demo`: 200.
- `/sample-report`: 200.
- Desktop screenshot revisado.
- Mobile 390 px revisado.

Resultado produccion:

- `/vmware-to-proxmox-readiness`: 200.
- `/demo`: 200.
- `/sample-report`: 200.
- Sin `500`, `503`, `504` ni Hostinger 404 en las rutas revisadas.

## Polish aplicado

Cambios de copy/UX aplicados:

- Hero: se aclaro que la pagina describe un assessment de planificacion, no una herramienta de ejecucion de migracion.
- Pricing preview: se reforzo que los precios son preview para broader invited beta.
- Pricing preview: se aclaro que pagos y accesos son manuales.
- Pricing preview: se agrego nota de que access/contact inicia revision manual, no compra instantanea.

No se agregaron features nuevas.

## Conversion review

La pagina comunica:

- Que empieza con RVTools.
- Que no requiere agentes para el assessment base.
- Que no toca produccion.
- Que el output es un decision pack/report.
- Que `/demo` muestra el proceso.
- Que `/sample-report` muestra el entregable.
- Que pricing es manual/beta.
- Que no hay checkout ni automatic billing.

## Claim safety

Validado:

- `zero downtime` aparece solo como negacion/limite.
- No hay claim activo de automatic migration.
- No hay claim activo de 100% success.
- `checkout` aparece solo para aclarar que no esta activo.
- Full public launch sigue NO.
- OpenAI no se activo.

## Links y CTAs

Desde `/vmware-to-proxmox-readiness`:

- `/sign-up`.
- `/demo`.
- `/sample-report`.
- `/sample-reports/proxmox-migration-readiness-sample-report.pdf`.
- `/contact`.

Desde `/demo`:

- `/vmware-to-proxmox-readiness`.

Desde `/sample-report`:

- `/vmware-to-proxmox-readiness`.

## Seguridad

- No backend nuevo.
- No DB.
- No checkout.
- No Gemini call.
- No OpenAI.
- No datos reales.
- No secrets.
- No `.env` commiteado.
- Stash BETA-INVITE-1 preservado y no aplicado.

## Validaciones

Pre:

- `npm run hostinger:diagnose`: OK.
- `npm run ai:guardrails`: OK.
- `npm run typecheck`: OK.
- `npm run lint`: OK.
- `npm run build`: OK tras limpiar cache local `.next` por EPERM.
- `npx prisma validate`: OK.
- `npx prisma generate`: OK.

Finales:

- `npm run hostinger:diagnose`: OK.
- `npm run ai:guardrails`: OK.
- `npm run typecheck`: OK.
- `npm run lint`: OK.
- `npm run build`: OK, warning NFT conocido no bloqueante.
- `npx prisma validate`: OK.
- `npx prisma generate`: OK.

## Decision

- SALES-PAGE-1.1: completo.
- Standalone offer page: marketing-ready para broader invited beta.
- Full public launch: NO.
- Proximo hito recomendado: beta invite operativo o tracking ligero de conversion para demo/sample/sales page.
