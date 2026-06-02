# HITO EVIDENCE-7 - Migration Recommendation Plan

Date: 2026-06-02
Status: implemented in code
Scope: separate premium migration recommendation deliverable, evidence gates, deterministic plan levels, user/admin workflow
Production impact: none in this hito unless deployed later
Public launch decision: unchanged, no full public launch declaration

## Executive summary

EVIDENCE-7 adds the first standalone premium Migration Recommendation Plan for ShiftReadiness. It is separate from the existing readiness report and uses deterministic evidence gates to decide how strong the migration recommendation can be.

The plan does not claim cutover readiness. It summarizes available evidence, missing evidence, blockers, remediation, wave strategy, backup/rollback considerations, go/no-go guidance and next steps.

## Deliverable model

The Migration Recommendation Plan is generated as a separate PDF and stored through the existing private report-history pipeline.

- Report type: `blueprint`
- User-facing label: `Migration Recommendation Plan`
- Storage: existing private report storage
- Download access: existing report download ownership/admin protection
- Entitlement: existing full-report generation entitlement
- Database migration: not required

## Plan levels

The deterministic level engine can return:

- `plan_not_available`: parsed base RVTools inventory is missing.
- `preliminary_plan`: base inventory exists, but advanced migration evidence is limited.
- `technical_plan`: base inventory plus technical evidence such as Proxmox target and backup evidence are available.
- `advanced_plan`: backup, Proxmox target, Storage/SAN and Application Dependency evidence support a stronger plan with non-technical wave context.

These levels describe planning confidence only. They do not certify execution readiness.

## Evidence sources

The plan aggregator considers:

- RVTools parsed inventory.
- VMware Enrichment evidence.
- Proxmox Target evidence.
- Backup Evidence.
- Storage/SAN evidence.
- Application Dependency Mapping.
- Licensing and cost exposure.
- Client context and additional evidence.

Missing evidence is represented as a confidence limiter and gate warning/failure instead of being hidden.

## Deterministic gates

Implemented gates:

- Base inventory gate.
- Backup evidence gate.
- Restore testing gate.
- Proxmox target validation gate.
- Storage evidence gate.
- Dependency mapping gate.
- Wave planning gate.
- Business continuity gate.
- Licensing/cost gate.

Some gates block advanced-plan claims. Some gates block production-wave claims. This intentionally keeps planning recommendations separate from execution approval.

## AI narrative layer

The current implementation uses deterministic fallback narrative only:

- No raw files are sent to AI.
- No storage paths, cookies, sessions, tokens or secrets are included.
- AI cannot override gates or plan level.
- The plan exposes `providerStatus=deterministic_fallback`.

Future AI narrative can be added as a sanitized wording layer only after separate smoke/guardrail validation.

## User workflow

On the assessment report page, users now see a dedicated Migration Recommendation Plan panel with:

- Plan level.
- Evidence confidence.
- Blocking gate count.
- Evidence coverage chips.
- Gate preview.
- Generate Migration Plan PDF action.
- Link to generated reports when a plan exists.

The action submits `reportKind=migration_plan` to the existing report generation endpoint and stores the PDF in private report history.

## Admin workflow

The Spanish admin assessment table now surfaces:

- Migration plan level.
- Blocking gate count.
- Total gates.
- Latest Migration Recommendation Plan PDF status.

This gives admins quick visibility without changing ownership rules, billing, deployment or database schema.

## PDF

The plan PDF is rendered through PDFKit using a light, print-friendly layout:

- Cover summary.
- Evidence coverage.
- Evidence gates.
- Critical blockers.
- Required remediation.
- Wave strategy.
- Backup and rollback posture.
- Go/no-go guidance.
- Next steps.
- Open evidence requests.

The PDF avoids dark cover-heavy styling and is intended as a professional planning deliverable.

## EVIDENCE-8 follow-up

EVIDENCE-8 aligned this standalone PDF with the shared print-friendly report theme and added a synthetic evidence dataset library that includes expected Migration Recommendation Plan gate outputs. The plan remains a planning deliverable only; it does not certify cutover readiness or production migration success.

## Tests

Added unit coverage verifies:

- No plan is available without parsed RVTools inventory.
- Technical plan behavior when backup and Proxmox target evidence exist.
- Advanced plan behavior when advanced evidence and functional wave evidence exist.
- Standalone PDF rendering returns a valid PDF buffer.
- EVIDENCE-7.1 added entitlement checks for blueprint generation/download behavior and fixed page numbering in the standalone Migration Recommendation Plan PDF.

## Out of scope

This hito did not:

- Modify landing pages.
- Modify billing/checkout.
- Touch Hostinger.
- Deploy production.
- Change the Prisma schema.
- Redesign the global readiness PDF.
- Declare full public launch.

## Remaining work

Recommended next hito:

- EVIDENCE-7.1 follow-up/manual closeout: authenticated browser QA for the Migration Recommendation Plan panel, generated PDF download/open, admin visibility and multiuser ownership behavior. Automated QA is documented in `docs/evidence-7-1-migration-plan-authenticated-qa.md`.

Optional future hito:

- AI-MIGRATION-PLAN-1: add sanitized AI narrative wording after proving no raw files/secrets/storage paths can reach the provider and confirming the deterministic gates remain authoritative.
