# Evidence Expansion Final Closeout Checklist

Date: 2026-06-02
Status: active closeout checklist
Full public launch: NO

## 1. Development Closeout

| Item | Status | Notes |
| --- | --- | --- |
| EVIDENCE-0 Audit + roadmap | Closed | Evidence Expansion direction defined. |
| EVIDENCE-1 Common Evidence Framework | Closed | Registry, parser flow, module states and UI/admin visibility implemented. |
| EVIDENCE-2 VMware Enrichment | Closed in code/docs | Real vCenter customer execution pending. |
| EVIDENCE-3 Proxmox Target Validation | Closed in code/docs | Real Proxmox execution pending. |
| EVIDENCE-4 Backup Evidence | Closed in code/docs | Real Veeam execution and restore-test evidence pending. |
| EVIDENCE-5 Storage/SAN Evidence | Closed in code/docs | Vendor-neutral; vendor APIs future. |
| EVIDENCE-6 Application Dependency Mapping | Closed in code/docs | Template-based; automatic discovery future. |
| EVIDENCE-7 Migration Recommendation Plan | Closed in code/user QA | User-attested manual browser QA PASS on localhost / Chrome normal. |
| EVIDENCE-7.1 Automated QA | Accepted | Automated plan, entitlement and PDF checks complete. |
| EVIDENCE-7.1B Manual/browser QA | Closed | User-attested PASS on 2026-06-02; Codex browser tooling remained broken/not used. |
| EVIDENCE-8 PDF/Datasets/Demo/Landing | Closed | Print-friendly PDFs, synthetic datasets and public messaging updated. |
| EVIDENCE-9 Operational closeout | Closed | Final closeout/checklist documentation and operating rules. |
| EVIDENCE-10 Collector Packaging | Closed in code/docs | Manifest/checksums/download UX complete; real customer execution and code signing pending. |

## 2. Pre-Customer Pilot Checklist

| Item | Status |
| --- | --- |
| Build passes | Required before pilot |
| Tests pass | Required before pilot |
| No secrets in committed files | Required before pilot |
| Docs updated | Required before pilot |
| Sample PDFs regenerated | Required before pilot |
| Synthetic datasets regenerated and safe | Required before pilot |
| Collectors downloadable or operator-ready | Ready for controlled beta with checksum verification |
| Templates downloadable or operator-ready | Ready for controlled beta with checksum verification |
| Admin visibility confirmed | Implemented; user-attested browser closeout accepted |
| Manual updated | Required in EVIDENCE-9 |
| Support/operator aware | Required before pilot |
| No full public launch claim | Required |

## 3. Before Using With Real Customer Data

| Item | Status |
| --- | --- |
| Customer authorization captured | Required |
| NDA/terms confirmed if applicable | Required |
| Read-only collectors explained | Required |
| Customer can review collector output before upload | Required |
| Customer/operator verifies checksum before running collector | Recommended |
| Avoid secrets in uploaded evidence | Required |
| Retention expectations defined | Required |
| Support channel defined | Required |
| Entitlement validated | Required |
| Authenticated browser QA real flow completed | Completed by user-attested manual QA |
| Private storage/download behavior checked | Required |

## 4. Before Selling Migration Recommendation Plan

Mandatory:

- EVIDENCE-7.1B closed by user-attested manual QA.
- Browser-authenticated generation, download and open accepted by owner attestation.
- Admin browser visual confirmation remains recommended before broad sales operations if not separately attested.
- Entitlement/ownership manual denial path, if feasible.
- PDF visual QA.
- No-secret review.
- Owner/commercial approval.

Decision today:

- Migration Recommendation Plan may be described as automated-QA accepted and user-attested browser/manual QA passed for controlled beta.
- Do not describe it as public-launch ready or production migration approval.

## 5. Before Full Public Launch

Mandatory:

- Explicit owner/commercial decision.
- Public support/SLA.
- Public pricing/checkout decision.
- Production smoke.
- Hosting runtime/build/error logs.
- Public route smoke.
- Auth route smoke.
- Admin route smoke.
- QA/demo cleanup/archive or explicit retention decision.
- Final launch checklist.

Decision today:

- Full public launch remains NO.

## 6. Copy Safety Checklist

Forbidden as positive claims:

- Automatic migration.
- Guaranteed migration success.
- Validated cutover.
- Restore tested without evidence.
- Functional waves validated by default.
- Production migration approved.
- Universal SAN integration.
- No human review needed.
- Full public launch ready.

Allowed positioning:

- Evidence-based readiness.
- Optional evidence improves precision.
- Missing evidence limits confidence.
- Read-only collectors/templates.
- Planning support, not migration execution.
- Migration Recommendation Plan is gated by evidence.
- Human review remains required for execution.
