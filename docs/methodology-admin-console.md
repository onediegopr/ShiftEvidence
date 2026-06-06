# Methodology Admin Console

The new admin route is `src/app/dashboard/admin/methodology/page.tsx`.

## Purpose

- Show the active methodology version.
- Expose the catalog of domains, rules, source docs, chunks, changelog entries, and internal notes.
- Preview a deterministic advisor context.
- Demonstrate claim validation against unsafe statements such as:
  - guaranteed migration
  - zero downtime
  - backup restore claims without proof
  - "ready to migrate" wording while blockers remain active

## Safety rules

- The page is read-only.
- Notes cannot be written yet.
- No real customer evidence is rendered.
- The page intentionally avoids any dependency on production runtime state.
- The incremental Bible extraction checklist lives in `docs/methodology-bible-extraction-plan.md`.

## Navigation

- The main admin dashboard now links to this console from the hero actions.
- The methodology page also includes internal anchors for version, domains, rules, RAG preview, notes, changelog, and roadmap.

## Next step

`METHODOLOGY-2` can add:

- audited note writes
- version diffing
- persistence for review workflow
- embeddings and indexed retrieval
- approval states for rule changes
- a write-safe admin workflow for internal notes once Prisma persistence is approved

That work should stay separate from the current read-only foundation until it can be reviewed safely.
