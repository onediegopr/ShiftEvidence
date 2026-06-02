# HITO EVIDENCE-8 - PDF Print-Friendly Global + Synthetic Dataset Library + Demo/Landing/Docs Expansion

Date: 2026-06-02
Status: implemented locally
Scope: global PDF visual theme, public sample PDF generator, synthetic evidence datasets, public demo/sample/landing copy, documentation
Production impact: none in this hito unless deployed later
Hostinger touched: no
Billing touched: no
Database schema changed: no
Public launch decision: unchanged, full public launch remains NO

## Executive Summary

EVIDENCE-8 strengthens the evidence expansion line without changing production configuration or billing. It makes customer-facing PDFs more print-friendly, adds a deterministic synthetic evidence dataset library, expands the demo/sample/landing messaging and documents the state of the broader evidence story.

This hito did not close the authenticated manual browser QA from EVIDENCE-7.1B at the time. That gap was later closed by owner user-attested localhost/Chrome manual QA on 2026-06-02.

## PDF Print-Friendly Work

Implemented:

- Added shared report theme: `src/server/reports/reportTheme.ts`.
- Updated the main readiness PDF renderer to use light cover and section headers.
- Updated report tables to use light table headers with dark text.
- Updated branding panels to use print-friendly white cards.
- Aligned the standalone Migration Recommendation Plan PDF with the shared theme.
- Updated the public sample PDF generator to use light cover/header sections.

Expected output:

- White or light report surfaces.
- Dark readable text.
- Subtle cyan/blue accents.
- Page numbering preserved.
- No dark navy full-page report treatment for generated customer-facing PDFs.

## Synthetic Dataset Library

Added `synthetic-data/` and `npm run synthetic:evidence`.

The library contains eight deterministic synthetic scenarios:

- `northbridge-small-clean`
- `atlas-medium-mixed-risk`
- `meridian-large-enterprise`
- `orion-no-backup`
- `delta-target-insufficient`
- `apollo-storage-constrained`
- `helix-dependency-heavy`
- `phoenix-advanced-ready`

Each scenario includes:

- RVTools-like CSV inventory.
- VMware enrichment JSON.
- Proxmox target JSON.
- Backup evidence JSON.
- Storage/SAN CSV.
- Application dependencies CSV.
- Expected Migration Recommendation Plan gates.
- Expected summary metadata.

Safety model:

- No customer data.
- No secrets.
- No cookies/tokens/session values.
- No private storage paths.
- No production credentials.
- No real internal inventory.

## Public Demo / Sample / Landing Expansion

Updated public messaging:

- `/demo` now references the synthetic evidence expansion library and module coverage.
- `/sample-report` now shows Evidence Expansion coverage and Migration Recommendation Plan sections.
- Landing page now explains that extra evidence improves confidence without increasing migration promises.
- VMware to Proxmox offer page now includes Migration Recommendation Plan as a deliverable.

Copy guardrails preserved:

- No automatic migration claim.
- No guaranteed migration success.
- No validated cutover claim.
- No full public launch declaration.
- Missing evidence is treated as a confidence limitation, not inferred.

## Tests Added

Added:

- `tests/unit/syntheticEvidenceDatasets.test.ts`
- `tests/unit/evidence8PublicCopySafety.test.ts`

Coverage:

- Synthetic dataset index and module completeness.
- Basic no-secret/no-private-path checks for synthetic files.
- Print-friendly shared theme assertions.
- Public copy presence and unsafe-promise absence.

## Regeneration Commands

```bash
npm run synthetic:evidence
npm run sample-report:generate
```

## EVIDENCE-7.1B Status

Still pending:

- Authenticated real browser click-through for Migration Recommendation Plan panel.
- Generate Migration Plan PDF in a real authenticated browser session.
- Download/open the PDF from report history.
- Admin authenticated UI verification in Spanish.
- Entitlement/ownership manual validation if feasible.

EVIDENCE-8 does not invent or replace that evidence.

## Final Decision

EVIDENCE-8 is closed in code/docs by commit `3b979bd feat: finalize evidence expansion demo and print-ready reports`.

Full public launch remains NO.

## EVIDENCE-9 follow-up

EVIDENCE-9 closes the main Evidence Expansion line operationally through final documentation, operating rules and a QA/commercialization checklist. It does not close EVIDENCE-7.1B browser/manual QA and does not change launch status.
