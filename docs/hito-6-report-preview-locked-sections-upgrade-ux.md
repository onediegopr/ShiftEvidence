# Hito 6 - Report Preview + Locked Sections + Upgrade UX

## Objetivo
Convertir los datos ya existentes en una experiencia de Report Preview clara, con secciones visibles gratis, secciones bloqueadas y CTAs de upgrade trackeables.

## Alcance
- Ruta `/dashboard/assessments/[id]/report`
- Executive Summary Preview
- Technical Summary Preview
- Environment Summary
- Cost / Risk Summary
- Top Findings
- VM Risk Matrix Preview
- Missing Evidence
- Locked Sections
- Upgrade CTAs
- UpgradeEvent tracking

## Avance
- Avance general antes del hito: 70%
- Avance general después del hito: 78%
- Avance del hito actual: 100%

## Rutas
- `/dashboard/assessments/[id]` agrega CTA a Report Preview
- `/dashboard/assessments/[id]/report` muestra el preview estructurado

## Preview
- El preview es preliminar y basado en evidencia actual.
- No genera PDF.
- No ejecuta checkout.
- No crea facturación.
- No promete resultado final ni savings garantizados.

## Locked sections
- Full VM-by-VM matrix
- Migration waves
- Proxmox sizing
- Storage strategy
- Executive PDF export
- Technical review

## Upgrade UX
- Los botones registran intención de upgrade.
- No hay pago ni checkout.
- La UX debe dejar claro qué está disponible gratis y qué exige un plan o add-on.

## Smoke tests
- Abrir el report preview desde un assessment con findings.
- Ver Executive Summary Preview y Technical Summary Preview.
- Ver secciones locked y CTAs.
- Confirmar que el click en CTAs crea `UpgradeEvent`.
- Confirmar que `/` y `/shiftreadiness` siguen respondiendo.

## Riesgos
- Que la UI parezca un reporte final.
- Que el upgrade copy suene demasiado comercial.
- Que los sections locked parezcan desbloqueados por error.

## Rollback
- Retirar la ruta `/report`.
- Retirar los CTAs de upgrade.
- Volver al detalle del assessment con solo los bloques anteriores.

## Próximo hito
- HITO 7 - PDF Report Generation v1
