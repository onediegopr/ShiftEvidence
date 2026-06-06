# Methodology KB Foundation

This document describes the read-only foundation added for `METHODOLOGY-1`.

## What was added

- A new TypeScript-only knowledge base under `src/server/methodology/`.
- A versioned seed with an active release: `Shift Evidence Methodology Bible v2.1`.
- 11 methodology domains.
- 16 active rules covering governance, VMware, Proxmox VE, SAN, networking, applications, target readiness, security, execution, remediation, and operational checklists.
- Knowledge chunks for deterministic local search and future RAG wiring.
- An admin snapshot API that exposes counts and summaries without revealing raw customer evidence.
- An additive audited persistence layer for internal notes, review items, and changelog entries is now available in `METHODOLOGY-2B`.

## What was intentionally not done

- No Prisma schema migration.
- No DB writes.
- No production cutover.
- No changes to payments, Wise, DNS, Vercel deployment flow, or live customer data.
- No changes to the current Advisor runtime behavior.
- No automatic impact on scoring, Advisor, or PDF rendering from the persistence layer.

## Design choices

- The seed is static and deterministic so the admin console can render safely in any runtime.
- The first version is read-only by design.
- The rule model is ready for future persistence, embeddings, and review workflows, but those belong to `METHODOLOGY-2`.
- The note/review/changelog persistence layer belongs to `METHODOLOGY-2B` and stays opt-in through admin actions.
- The full extraction path is documented in `docs/methodology-bible-extraction-plan.md`.

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

If the app needs additional persistence beyond METHODOLOGY-2B, the next safe step is an audited schema migration plus a write workflow with approval and version history.
