# Premium Synthetic Sample Readiness Report

Date: 2026-05-31

## What Changed

`SAMPLE-PREMIUM-1` upgrades the public sample report flow from a lightweight sample into a premium synthetic readiness report designed as a commercial conversion asset.

The public sample remains isolated from the real product runtime:

- no auth changes;
- no billing changes;
- no database calls;
- no Prisma migrations;
- no Gemini or external API calls;
- no customer data;
- no production access;
- no real pricing mutation.

## Public Route And PDF

- Public page: `/sample-report`.
- Public PDF: `/sample-reports/proxmox-migration-readiness-premium-sample-report-v2.pdf`.
- Compatibility PDF: `/sample-reports/proxmox-migration-readiness-sample-report.pdf`.
- Generator: `scripts/generate-public-sample-report.mjs`.
- Component: `src/components/sample-report/SampleReportPage.tsx`.
- Dataset: synthetic `Northbridge Industrial Group`.

The versioned PDF path was introduced after HCDN continued serving the previous unversioned PDF from cache on clean requests. The old path remains in place for existing external links, while public CTAs now point to the versioned asset.

## Synthetic Dataset

The sample uses a fictional medium industrial environment:

- 126 VMs.
- 6 ESXi hosts.
- 3 clusters.
- 14 datastores.
- 22 VLANs.
- 38 port groups.
- 19 snapshots.
- Partial 24/7 operations.
- ERP, SQL, domain controller, file server, web, monitoring, backup proxy and legacy workloads.
- Incomplete backup, dependency, performance and target storage evidence.
- Proxmox target partially defined.

## PDF Sections

The generated PDF includes:

- Cover Page.
- Executive Summary.
- Assessment Scope.
- Environment Overview.
- Migration Readiness Score.
- Evidence Confidence Score.
- VMware -> Proxmox Technical Readiness.
- Storage Destination Readiness.
- Ceph / Shared Storage Considerations.
- Licensing & Cost Exposure.
- Business Continuity Risk.
- VM Risk Matrix.
- Workload Classification.
- Proxmox Target / Sizing Preview.
- Recommended Migration Path.
- Remediation Roadmap.
- Senior AI Advisor Insights.
- Senior AI Advisor Q&A Highlights.
- Project Memory / Decisions Captured.
- Assumptions & Disclaimers.
- Appendix / Calculation Notes.
- Final CTA Page.

## Licensing Model In The Sample

The synthetic licensing section documents:

- VMware billable cores = `max(raw cores, sockets * 16)`.
- Proxmox annual cost = `sockets * normalized unit price USD`.
- Static FX assumption: `EUR->USD 1.08`.
- Storage does not directly impact licensing cost.
- VMware and Proxmox prices are estimates/references, not quotes or contracts.

## Storage Threshold

The sample uses the central storage threshold:

- Datastores at or above `80%` are flagged as high usage.
- The previous `85%` public PDF language was removed from the generated artifact.

## CTA Alignment

Updated public copy aligns the flow around a full/premium sample:

- Landing Hero CTA: `View Full Sample Report`.
- ShiftReadiness CTA: `View full sample report`.
- VMware -> Proxmox offer page CTAs: `View full sample report` / `Download full sample PDF`.
- Sample report page CTA: `Download full sample PDF`.
- Demo replay output card: premium synthetic sample language.

## How To Regenerate

Run:

```bash
npm run sample-report:generate
```

This writes:

```text
public/sample-reports/proxmox-migration-readiness-sample-report.pdf
public/sample-reports/proxmox-migration-readiness-premium-sample-report-v2.pdf
```

The generator normalizes non-sensitive PDF metadata so repeated generation remains stable.

## Validation

Recommended checks:

```bash
npm run sample-report:generate
npm run test:run
npm run typecheck
npm run lint
npm run build
```

Text extraction should confirm:

- `Storage Destination Readiness`.
- `Licensing & Cost Exposure`.
- `Business Continuity Risk`.
- `Senior AI Advisor Q&A Highlights`.
- `Project Memory / Decisions Captured`.
- `VMware billable cores`.
- `Proxmox annual cost`.
- `EUR->USD 1.08`.
- `Synthetic sample`.
- `no customer data`.
- `Datastores above 80%`.

It should not contain:

- `Datastores above 85%`.

## Visual QA Notes

Review at least:

- cover page;
- executive summary;
- storage section;
- licensing section;
- business continuity section;
- advisor Q&A pages;
- Project Memory section;
- assumptions/disclaimers;
- final CTA page.

Check for:

- readable tables;
- no clipped text;
- visible page numbers;
- professional premium tone;
- no claims of guaranteed migration, zero downtime or real financial quote.

## Rollback

Rollback is safe because this hito is isolated to public sample assets.

To revert:

1. Revert the commit that changed the sample generator/page/CTA files.
2. Restore the prior PDF artifact.
3. Regenerate with the old generator if necessary.
4. Point public CTAs back to the unversioned path after HCDN cache is known to be fresh.

No database, auth, billing, entitlement, real pricing or production storage rollback is required.

## Pending Risks

- The PDF is a static synthetic artifact, not generated from the live assessment report renderer.
- Future product sections may need periodic sample refreshes.
- HCDN may keep stale HTML for `/sample-report` until its cache expires or is purged.
