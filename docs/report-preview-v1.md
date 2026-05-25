# Report Preview v1

## Service
`src/server/reports/reportPreviewService.ts`

## Data sources
- Assessment
- AssessmentScore
- RiskFinding
- ParsedInventorySummary
- Parsed VM rows
- Cost / Risk assumptions
- Preliminary preview
- EvidenceFile status
- Completion status
- UpgradeEvent model for intent tracking
- UnlockRequest lifecycle and commercial status
- Report history and PDF preview status

## Executive Summary
The executive summary is a short stakeholder-facing narrative. It should describe the current preliminary readiness signal, the inventory size, the top concerns and whether the evidence is sufficient for a fuller report.

## Technical Summary
The technical summary is a concise engineering view that highlights:
- source of evidence
- inventory status
- parser warnings
- top findings by category
- missing evidence
- current limitations

## PDF Preview
The report preview page can generate a preliminary PDF version from the same evidence-backed data. The PDF remains private, downloadable only after ownership validation, and is stored in the private report storage tree.

## Commercial boundary
The report preview also shows free versus paid boundaries, active unlock requests and the current entitlement state for the assessment.

## Limitations
- No PDF generation
- No checkout
- No final report output
- No paid unlock or certification
- No migration waves or Proxmox sizing deep-dive
- No guarantee of migration success
- Locked sections remain visual only until a future milestone unlocks them
