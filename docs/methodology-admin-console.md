# Methodology Admin Console

The new admin route is `src/app/dashboard/admin/methodology/page.tsx`.

## Purpose

- Show the active methodology version.
- Expose the catalog of domains, rules, source docs, chunks, seed changelog entries, persisted notes, review items, and internal changelog entries.
- Preview a deterministic advisor context.
- Demonstrate claim validation against unsafe statements such as:
  - guaranteed migration
  - zero downtime
  - backup restore claims without proof
  - "ready to migrate" wording while blockers remain active

## Safety rules

- The seed sections remain read-only.
- Internal notes, review items, and the persisted changelog are editable through admin-authenticated server actions.
- Every write is audited and recorded in the methodology changelog.
- No real customer evidence is rendered.
- The page intentionally avoids any dependency on production runtime state.
- The additive persistence step is documented in `docs/methodology-2b-audited-persistence.md`.
- The incremental Bible extraction checklist lives in `docs/methodology-bible-extraction-plan.md`.
- The persistence layer does not automatically alter scoring, Advisor behavior, or PDF/report generation.
- No external embeddings or automatic RAG activation are introduced by this console.

## Navigation

- The main admin dashboard now links to this console from the hero actions.
- The methodology page also includes internal anchors for version, domains, rules, RAG preview, notes, revision, changelog, persisted changelog, and roadmap.

## Next step

`METHODOLOGY-3` can add:

- version diffing
- embeddings and indexed retrieval
- approval states for rule changes
- a controlled bridge from approved notes toward Advisor/PDF consumers once explicitly approved

That work should stay separate from the current read-only seed and current admin-only persistence until it can be reviewed safely.
