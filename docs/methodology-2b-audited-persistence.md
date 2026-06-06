# METHODOLOGY-2B: Audited Persistence

This step extends the methodology console with a safe write path for internal notes, review workflow items, and a persisted changelog.

## Scope

- Add audited persistence for `MethodologyAdminNote`, `MethodologyReviewItem`, and `MethodologyChangeLog`.
- Keep admin auth on the write path.
- Record both methodology changelog entries and admin audit events.
- Keep the existing seed, Advisor context, scoring, and PDF pipeline unchanged.

## Safety

- No production deploy changes.
- No payments, Wise, DNS, or Vercel cutover changes.
- No external embeddings or APIs are required for this step.
- No customer evidence or real assessment data is written.

## Database

- The migration is additive and named `methodology_admin_notes_review`.
- It introduces new enums for note priority, note status, review item type, and review status.
- It does not modify existing methodology seed tables.

## Console behavior

- The admin methodology page now includes:
  - a note composer
  - a note status workflow
  - review item status updates
  - a persisted changelog view
- The original seed sections stay visible for comparison.

## Next step

- Decide whether to apply the migration in local/dev and wire the new tables to the wider admin review flow.
- Keep the current behavior fallback-safe if the DB tables are not available yet.
