# Methodology KB Foundation

This document describes the read-only foundation added for `METHODOLOGY-1` and clarifies how the later audited persistence from `METHODOLOGY-2B` sits on top of that base.

## What was added

- A new TypeScript-only knowledge base under `src/server/methodology/`.
- A versioned seed with an active release: `Shift Evidence Methodology Bible v2.1`.
- 11 methodology domains.
- 16 active rules covering governance, VMware, Proxmox VE, SAN, networking, applications, target readiness, security, execution, remediation, and operational checklists.
- Knowledge chunks for deterministic local search and future RAG wiring.
- An admin snapshot API that exposes counts and summaries without revealing raw customer evidence.
- An additive audited persistence layer for internal notes, review items, and changelog entries is now available in `METHODOLOGY-2B`.

## What was intentionally not done

- In `METHODOLOGY-1`, no Prisma schema migration was added.
- In `METHODOLOGY-1`, no DB writes were introduced.
- No production cutover.
- No changes to payments, Wise, DNS, Vercel deployment flow, or live customer data.
- No changes to the current Advisor runtime behavior.
- The later `METHODOLOGY-2B` persistence layer still has no automatic impact on scoring, Advisor, or PDF rendering.

## Design choices

- The seed is static and deterministic so the admin console can render safely in any runtime.
- The first version is read-only by design.
- The rule model is ready for future persistence, embeddings, and review workflows, but those belong to `METHODOLOGY-2`.
- The note/review/changelog persistence layer belongs to `METHODOLOGY-2B`, is additive, admin-only, and stays opt-in through explicit admin actions.
- The full extraction path is documented in `docs/methodology-bible-extraction-plan.md`.

## Clarification after METHODOLOGY-2B

- `METHODOLOGY-1` remained fully read-only.
- `METHODOLOGY-2B` added an audited additive persistence layer only for:
  - internal admin notes
  - review items
  - methodology changelog entries
- The methodology seed itself remains static and read-only.
- The persistence layer does not automatically modify:
  - scoring runtime
  - Advisor runtime
  - PDF/report runtime
- The persistence layer is admin-only.
- No external embeddings were introduced.
- No RAG activation was introduced by this persistence step.
- No real customer data is stored by this methodology persistence layer.

## How to extend it

- Add a new domain in `src/server/methodology/seed.ts`.
- Add the matching topics and rules.
- Add knowledge chunks that reference the new rule codes.
- Extend the local search helper if the new domain needs extra matching logic.
- Keep any future write path auditable and separate from the current read-only console.

## Validation paths

- `npm run typecheck`
- `npm run lint`
- `npm run test:run`
- `npm run build`

If the app needs additional methodology persistence beyond `METHODOLOGY-2B`, the next safe step is to keep the same audited pattern with approval, version history, and explicit separation from scoring, Advisor, and PDF runtime wiring.
