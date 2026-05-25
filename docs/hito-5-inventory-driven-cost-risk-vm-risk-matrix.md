# Hito 5 - Inventory-driven Cost/Risk + VM Risk Matrix

## Objetivo
Convertir inventario parseado en findings accionables, VM matrix y scoring preliminar.

## Alcance
- `RiskFinding`
- `AssessmentScore`
- Risk overview
- Top findings
- VM risk matrix
- Inventory-driven Cost/Risk preview
- Locked insights

## Avance
- Avance general antes del hito: 58%
- Avance general despues del hito: 70% aprox.
- Avance del hito: 100%

## Verificacion
- Findings persistidos en Neon.
- Score persistido en Neon.
- Detail del assessment renderiza risk overview, top findings y VM matrix.
- Public pages y auth siguen funcionando.

## Riesgos
- Scoring sigue siendo preliminar.
- Parsing RVTools sigue siendo basico.
- Matrix puede requerir paginacion.

## Rollback
- Mantener Hito 4.
- Remover los servicios de risk scoring y los modelos nuevos si se necesita revertir.

## Proximo hito
- `HITO 6 - Report Preview + Locked Sections + Upgrade UX`
