# HITO 10 - PDF Visual Hardening + Report Quality

## Objetivo

Improve the generated ShiftReadiness PDF so it reads like a professional VMware to Proxmox readiness assessment instead of a basic technical v1 export.

The goal is not only visual polish. The report must improve:

- executive clarity;
- technical credibility;
- evidence transparency;
- conservative recommendations;
- commercial report quality;
- explicit missing evidence handling.

Hostinger remains paused. This hito does not touch hPanel, deploy, DNS, production env vars, `public_html`, Prisma migrations, or production DB.

## Estado anterior

The previous PDF v1 used `pdfkit` and generated a valid PDF, but it was mostly a linear export of preview data:

- basic header;
- executive summary;
- environment summary;
- cost/risk summary;
- top findings;
- VM matrix preview;
- missing evidence;
- locked sections;
- disclaimer.

It lacked a professional cover, page structure, score interpretation, explicit evidence received vs missing, migration waves, required validations, next evidence, and page numbers.

## Problemas del PDF v1

- No strong cover page.
- No clear report type positioning.
- Readiness and confidence were not separated strongly enough.
- Missing evidence existed but was not framed as a core assessment output.
- No migration wave preview.
- No required validation checklist.
- No next evidence collection section.
- No structured visual hierarchy with cards/tables/badges.
- No page numbers.
- Limited commercial quality for a paid readiness report.

## Principios aplicados

- Evidence-based.
- Transparent.
- Conservative.
- No magic.
- No overclaiming.
- Missing evidence is shown as a risk and confidence input.

The PDF now reinforces this principle:

> This assessment is based on the evidence provided. Missing evidence is explicitly shown because it changes confidence and migration risk.

## Nueva estructura del PDF

The hardened PDF is intentionally paginated and structured:

1. Cover Page
2. Executive Summary
3. Evidence Overview
4. Environment Summary
5. Readiness and Confidence Scores
6. Top Findings
7. VM Risk Matrix
8. Migration Wave Preview
9. Required Validations
10. Next Evidence and Next Steps
11. Limitations and Disclaimer

The exact number of pages can vary based on data length, but the report now has a durable professional structure.

## Secciones agregadas

- Professional cover page.
- Decision signal card.
- Readiness score card.
- Confidence score card.
- Evidence Received.
- Evidence Missing.
- Confidence implication.
- Combined readiness/confidence interpretation.
- Finding severity badges.
- VM risk table.
- Migration wave preview.
- Required validations checklist.
- Next evidence to collect.
- Next steps / commercial CTA.
- Operating limitations.
- Page numbers and report footer.

## Datos usados

The PDF uses existing data only:

- `Assessment`
- `Workspace`
- `AssessmentInfrastructureInput`
- `CostRiskAssumptions`
- `EvidenceFile`
- `ParsedInventorySummary`
- `ParsedVM`
- `RiskFinding`
- `AssessmentScore`
- report type
- commercial status / unlock state through report preview data

No schema migration was required.

## Fallbacks

When data is missing, the PDF shows explicit conservative fallbacks:

- `Not provided`
- `Not available`
- `Not available in current evidence`
- `No VM-level matrix is available yet because parsed inventory is limited`
- `No findings have been generated yet`

Missing evidence is also promoted into an evidence section instead of being hidden.

## Que no se inventa

The PDF does not invent:

- exact compatibility;
- zero downtime;
- complete dependency maps;
- backup restore validation;
- Proxmox sizing validation;
- storage architecture validation;
- final migration waves;
- final production go/no-go authority.

The report explicitly states that critical workloads require pilot import, backup restore validation and rollback planning.

## Archivos modificados

- `src/server/reports/reportPdfRenderer.ts`
- `src/server/reports/reportPreviewService.ts`

## Implementacion

`reportPdfRenderer.ts` was rewritten around a stronger PDF layout using pdfkit:

- theme constants;
- cards;
- badges;
- callouts;
- tables;
- two-column evidence blocks;
- page headers;
- page footers;
- page numbers;
- text sanitization for standard PDF fonts.

`reportPreviewService.ts` now derives additional report data:

- `readinessScore`
- `confidenceScore`
- `recommendedDecision`
- `evidenceOverview.received`
- `evidenceOverview.missing`
- `evidenceOverview.sourceIndicator`
- `evidenceOverview.confidenceImplication`

## Validaciones ejecutadas

Required validations for final close:

- `npm run hostinger:diagnose`
- `npm run typecheck`
- `npm run lint`
- `npm run build`

Manual PDF validation should be performed from the dashboard after logging in locally.

## Como probar manualmente

1. Start local app.
2. Log in with a test user.
3. Open `/dashboard/assessments`.
4. Create or open a test assessment.
5. Complete manual intake and Cost / Risk assumptions.
6. Upload/parse RVTools evidence if available.
7. Generate risk findings if parsed inventory exists.
8. Open `/dashboard/assessments/[id]/report`.
9. Click `Generate PDF Preview` or `Generate Readiness Report PDF` if entitlement exists.
10. Download the generated PDF from report history.
11. Confirm:
    - cover page exists;
    - executive summary exists;
    - evidence received/missing exists;
    - readiness and confidence are separated;
    - environment summary exists;
    - top findings or fallback exists;
    - VM matrix or fallback exists;
    - migration waves exist;
    - required validations exist;
    - next evidence and next steps exist;
    - page numbers exist;
    - no fake data is shown;
    - PDF opens correctly.

## Riesgos pendientes

- Full end-to-end PDF generation requires a local authenticated session and an assessment with test data.
- Visual QA should be repeated with both sparse and populated assessments.
- The known Turbopack/NFT warning related to report storage tracing remains non-blocking.
- Hostinger remains blocked by production env vars, especially `DATABASE_URL`.

## Proximos pasos

Recommended next hito:

- `HITO 10.1 - PDF QA with Sparse and Populated Assessments`

Hostinger remains paused until production env vars and storage path are ready.
