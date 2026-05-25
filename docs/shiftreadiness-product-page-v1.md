# ShiftReadiness Product Page v1

## Objective

Create the first commercial block for ShiftReadiness without replacing the current landing page.

ShiftReadiness is positioned as:

- `Infrastructure readiness before you migrate.`
- a technical workspace for VMware to Proxmox cost, risk and architecture decisions
- a product family that starts with the `VMware -> Proxmox Readiness Assessment`

## Commercial architecture

The product page at `/shiftreadiness` now explains:

- what ShiftReadiness is
- why the VMware -> Proxmox readiness assessment exists
- why the `Cost / Risk Engine` is included in every assessment
- why `Storage Destination Readiness` is optional
- how modular pricing works
- what is included and what is not included
- the intended user flow
- the final CTAs and placeholder routes

## Pricing model

### Free Readiness Check

- Price: `USD 0`
- Best for: teams that want a first signal before committing budget
- Includes: limited evidence intake, summarized inventory, basic readiness score, risk level, simple savings estimate, preliminary top risks, report preview, locked module visibility
- Does not include: full downloadable report, VM-by-VM matrix, editable assumptions, deep recommendations, Storage Destination Readiness, target architecture recommendation, review call

### Readiness Report

- Price: `From USD 249`
- Best for: teams that need a complete migration readiness report before taking action
- Includes: complete VMware -> Proxmox readiness analysis, full Cost / Risk Engine, downloadable report, executive summary, technical summary, detailed scoring, editable assumptions, prioritized recommendations, full risk findings, evidence confidence, annual and 3-year savings, subscription delta
- Does not include: deep Storage Destination Readiness, SAN/NAS/ZFS/Ceph/Hybrid target recommendation, implementation design, migration runbook, review call, automatic migration

### Readiness Report Pro

- Price: `From USD 690`
- Best for: MSPs, consultants and larger teams that need deeper technical segmentation
- Includes: everything in Readiness Report, VM-by-VM risk matrix, filters by criticality/size/host/cluster/datastore, migration complexity bands, workload group recommendations, remediation priority, advanced assumptions, executive and technical outputs, preparation for review call
- Does not include: Storage Destination Readiness unless bundled, final signed architecture design, implementation, production validation, managed migration, review call unless purchased

### Add-ons

- `Storage Destination Readiness`
  - Price: `From USD 290`
  - Optional module
  - Agnostic target storage analysis for SAN, NAS, NFS, iSCSI, ZFS, Ceph and hybrid scenarios
- `Technical Review Call`
  - Price: `From USD 390`
  - Human review of findings before a decision is made

## Storage Destination Readiness

This module is explicitly optional.

It is not a default part of the product. It is offered only when the target architecture deserves deeper validation.

## Landing page protection

The existing landing page was preserved.

Only a minimal promotional block was added to the landing, linking to `/shiftreadiness`.

The current landing hero and existing sections were not replaced.

## Rollback points

- `ROLLBACK 0`: initial state before the change
- `ROLLBACK 1`: landing page identified and protected
- `ROLLBACK 2`: `/shiftreadiness` route created without affecting the landing
- `ROLLBACK 3`: new ShiftReadiness page developed
- `ROLLBACK 4`: minimal CTA added to the landing
- `ROLLBACK 5`: documentation created
- `ROLLBACK 6`: build / lint / typecheck validation completed

## Risks and notes

- `/sign-up` and `/contact` are placeholder routes for this milestone
- no auth, backend, payments, upload pipeline or dashboard work was added
- the current implementation uses a lightweight pathname-based SPA route

## Next recommended milestone

`HITO 1 - Foundation tecnica: Next/React + Auth + Dashboard + Assessment shell`

If the product needs more refinement before that, the fallback is:

`HITO 0.1 - Adjust visual hierarchy and copy for ShiftReadiness`
