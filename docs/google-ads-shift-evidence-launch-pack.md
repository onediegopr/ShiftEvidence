# Google Ads Shift Evidence Launch Pack

Date: 2026-06-08

This pack is the operational baseline for launching Shift Evidence in Google Ads once browser automation is available again. It follows the `shift-evidence-google-ads-architect` skill and keeps all campaigns paused until explicit approval.

## Current Route

Browser automation remains blocked by the Browser MCP extension connection, so the active execution path is now Google Ads Editor / manual CSV import.

Prepared import files:

- `docs/exports/google-ads/campaigns.csv`
- `docs/exports/google-ads/ad_groups.csv`
- `docs/exports/google-ads/keywords.csv`
- `docs/exports/google-ads/negative_keywords.csv`
- `docs/exports/google-ads/responsive_search_ads.csv`
- `docs/exports/google-ads/assets_sitelinks.csv`
- `docs/exports/google-ads/assets_callouts.csv`
- `docs/exports/google-ads/assets_structured_snippets.csv`
- `docs/exports/google-ads/shift-evidence-search-build.csv`
- `docs/exports/google-ads/google-ads-editor-import-guide.md`

## Objective

Launch Shift Evidence as a search-first offer for VMware to Proxmox migration readiness.

Core promise:

`Before migrating VMware to Proxmox, know what can break.`

Primary landing page:

`https://shiftevidence.com`

Commercial offers:

- Starter Readiness: USD 490
- Professional Assessment: USD 1,500
- Migration Blueprint: from USD 3,500
- MSP Partner: from USD 399/month

## Account Cleanup Rules

When browser control is restored, clean the existing `shiftevidence` Google Ads account using these rules:

- Pause or remove all campaigns, ad groups, ads, keywords, assets, audiences, and shared items that are unrelated to Shift Evidence.
- Do not preserve legacy campaign structure for historical convenience.
- Do not touch billing, payment methods, tax settings, users, ownership, or permissions.
- If Google asks for an irreversible confirmation outside normal entity removal or pausing, stop and request approval.
- Keep the new Shift Evidence campaigns paused.
- Do not publish ads.
- Do not spend budget.

## New Campaign Plan

### Campaign 1

- Name: `SE | Search EN | VMware to Proxmox High Intent`
- Landing page: `https://shiftevidence.com`
- Locations: United States, Canada, United Kingdom, Ireland, Australia, New Zealand, Germany, Netherlands, Sweden, Norway, Denmark, Finland, Switzerland
- Language: English
- Budget share: 40%

### Campaign 2

- Name: `SE | Search EN | Broadcom VMware Exit`
- Landing page: `https://shiftevidence.com`
- Locations: United States, Canada, United Kingdom, Ireland, Australia, New Zealand, Germany, Netherlands, Sweden, Norway, Denmark, Finland, Switzerland
- Language: English
- Budget share: 25%

### Campaign 3

- Name: `SE | Search ES | LATAM Espana VMware Proxmox`
- Landing page: `https://shiftevidence.com`
- Locations: Argentina, Uruguay, Paraguay, Chile, Peru, Bolivia, Colombia, Ecuador, Mexico, Costa Rica, Panama, Guatemala, El Salvador, Honduras, Nicaragua, Dominican Republic, Spain
- Language: Spanish
- Budget share: 25%

### Campaign 4

- Name: `SE | Search EN ES | MSP Consultants Partners`
- Landing page: `https://shiftevidence.com`
- Locations: combine EN campaign countries with LATAM and Spain
- Languages: English and Spanish
- Budget share: 10%

## Budget And Bidding

Initial total budget recommendation:

- USD 20/day total for the first 7 days

Budget split at launch:

- Campaign 1: USD 8/day
- Campaign 2: USD 5/day
- Campaign 3: USD 5/day
- Campaign 4: USD 2/day

Bidding recommendation:

- Use `Maximize clicks` with a conservative CPC cap if Google allows it cleanly for new campaigns.
- If CPC caps become awkward in setup, use `Manual CPC`.
- Do not use aggressive conversion bidding until sufficient real conversion volume exists.

## Responsive Search Ads

Create draft RSAs only. Do not enable them.

### Headlines EN

- VMware to Proxmox Readiness
- Know What Can Break
- Analyze Your RVTools Export
- Migration Risk Assessment
- No Agents Required
- No Production Access
- Proxmox Migration Planning
- RVTools-Based Assessment
- Executive + Technical Report
- Before You Migrate
- Find Risk Before Migration
- VMware Exit Planning

### Descriptions EN

- Get a professional VMware to Proxmox readiness assessment with VM risks, evidence gaps, sizing and migration waves.
- Upload your RVTools export and turn infrastructure evidence into a migration decision pack.
- No agents. No mandatory credentials. No production access. Start with exported evidence.
- Identify risky workloads, missing backup evidence and Proxmox sizing needs before migration.

### Headlines ES

- Migracion VMware a Proxmox
- Antes De Migrar, Valida Riesgos
- Assessment VMware Proxmox
- Analizamos Tu RVTools
- Sin Agentes
- Sin Tocar Produccion
- Plan De Migracion Proxmox
- Riesgos, Sizing Y Oleadas
- Salida De VMware
- Consultoria Proxmox

### Descriptions ES

- Recibi un assessment VMware a Proxmox con riesgos por VM, brechas de evidencia, sizing y plan por oleadas.
- Subi tu export RVTools y converti evidencia tecnica en un plan profesional de migracion.
- Sin agentes, sin credenciales obligatorias y sin tocar produccion.
- Detecta workloads riesgosos, evidencia faltante y necesidades del destino Proxmox antes de migrar.

## Assets

Create if supported in the account and keep associated campaigns paused.

Sitelinks:

- Pricing -> `https://shiftevidence.com/pricing`
- Sample Report -> `https://shiftevidence.com/sample-report`
- Demo -> `https://shiftevidence.com/demo`
- Security -> `https://shiftevidence.com/security`
- Partners -> `https://shiftevidence.com/partners`

Callouts EN:

- No Agents
- No Production Access
- Starts With RVTools
- Evidence-Based
- Executive Report
- Technical Report

Callouts ES:

- Sin Agentes
- Sin Tocar Produccion
- Basado En RVTools
- Basado En Evidencia
- Reporte Ejecutivo
- Reporte Tecnico

Structured snippet header:

- Services

Structured snippet values:

- VMware to Proxmox Readiness
- RVTools Assessment
- Migration Risk Report
- Proxmox Sizing
- Migration Wave Plan
- MSP Partner Reports

## Conversion Review

When the account becomes accessible, review whether useful existing conversions already exist:

- form submit
- sample report download
- start assessment
- pricing CTA click
- booking/contact request

Do not install new tracking, touch GTM, or edit website code without explicit approval.

## Activation Checklist

- Browser automation connected to the embedded Codex browser
- Legacy entities reviewed and cleaned
- New campaigns created in paused state
- Keywords and negatives loaded
- RSAs created as drafts
- Assets attached
- Geo and language settings verified
- Conversions audited
- Billing untouched
- Final user approval collected before activation

## Current Blocker

The embedded Browser MCP is enabled, but the extension connection is not attaching to a live browser tab. Because of that, no Google Ads account actions have been executed yet.

## Editor Import Path

Until browser control is restored, use Google Ads Editor with the CSV pack above. Import all entities in paused state, review legacy account cleanup manually, and do not post changes until final approval.
