# HITO SALES-PAGE-1 - Standalone VMware Proxmox Readiness Offer Page

Fecha: 2026-05-28.

## Objetivo

Crear una pagina comercial standalone para explicar la oferta completa de **VMware to Proxmox Migration Readiness Assessment** sin alterar la landing principal ni abrir un full public launch.

Ruta creada:

- `/vmware-to-proxmox-readiness`

## Decision de producto

Se implemento la opcion B definida por el owner:

- Pagina standalone nueva.
- Sin cambios en home `/`.
- Sin cambios en hero principal.
- Sin cambios en navegacion global.
- Sin CTA global.
- Sin cambios en `/shiftreadiness`.
- Link entrante permitido solo desde `/demo` y `/sample-report`.

## Estructura de la pagina

La pagina incluye:

- Hero con posicionamiento de assessment.
- Problema: migrar riesgo, no inventario.
- Flujo de trabajo desde evidencia VMware hacia decisiones Proxmox.
- CTA hacia Migration Readiness Replay en `/demo`.
- CTA hacia sample report en `/sample-report` y PDF sintetico.
- Entregables esperados.
- Seccion evidence-based: confirmado, probable y faltante.
- Fuentes de evidencia.
- Pricing preview orientativo.
- Que no es el producto.
- FAQ.
- CTA final.

## CTAs

Desde la pagina:

- `Start readiness assessment` -> `/sign-up`.
- `Watch readiness replay` -> `/demo`.
- `View sample report` -> `/sample-report`.
- `Download sample PDF` -> `/sample-reports/proxmox-migration-readiness-sample-report.pdf`.

Hacia la pagina:

- `/demo` agrega un bloque discreto: `Want the full assessment offer?`.
- `/sample-report` agrega un bloque discreto: `Want to understand the full assessment?`.

No se agregaron CTAs desde home, nav global ni `/shiftreadiness`.

## Pricing preview

Los paquetes se muestran como orientativos para beta:

- Starter Readiness: USD 490.
- Professional Assessment: USD 1,500.
- Migration Blueprint: desde USD 3,500.
- MSP Partner: desde USD 399/month.

La pagina aclara que durante beta los pagos son manuales, sin public checkout y sin automatic billing activo.

## Limites y seguridad

La pagina:

- No usa backend.
- No usa DB.
- No llama Gemini.
- No activa OpenAI.
- No crea checkout.
- No usa datos reales.
- No incluye secrets.
- No modifica Hostinger config.
- No toca runtime settings.

Claims controlados:

- No promete migracion automatica.
- No promete zero downtime.
- No promete 100% success.
- No ejecuta cutover.
- No reemplaza piloto.

## UX/UI

El estilo mantiene coherencia con `/demo` y `/sample-report`:

- Fondo oscuro operativo.
- Cards glass.
- Badges tecnicos.
- Pricing cards compactas.
- FAQ estatica.
- Layout responsive.
- CTAs visibles en mobile.
- Focus visible heredado por los patrones globales.

## Validaciones

Pre-implementacion:

- `npm run hostinger:diagnose`: OK.
- `npm run ai:guardrails`: OK.
- `npm run typecheck`: OK.
- `npm run lint`: OK.
- `npm run build`: OK, con warning NFT conocido no bloqueante.
- `npx prisma validate`: OK.
- `npx prisma generate`: OK.

Local:

- `/vmware-to-proxmox-readiness`: 200.
- `/demo`: 200.
- `/sample-report`: 200.
- `/sample-reports/proxmox-migration-readiness-sample-report.pdf`: 200.
- `/`: 200.
- `/shiftreadiness`: 200.
- `/dashboard`: 307 a `/sign-in`.
- `/dashboard/admin`: 307 a `/sign-in`.

## Resultado

SALES-PAGE-1 deja disponible una pagina comercial standalone para explicar la oferta VMware -> Proxmox Readiness, sin alterar la landing principal y sin declarar full public launch.

## Proximos pasos

- SALES-PAGE-1.1: visual QA post-deploy y polish de conversion si hace falta.
- BETA-INVITE-1: reactivar cuando el owner quiera continuar invitaciones reales.
- Full public launch: sigue NO hasta decision explicita owner/comercial.
