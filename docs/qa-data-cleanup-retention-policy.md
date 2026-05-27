# QA Data Cleanup / Retention Policy

## Purpose

Define an initial policy for QA data created during controlled production launch.

## Naming Convention

All QA production data should be marked:

`QA Production Smoke — safe to delete`

## Data Types

Track:

- QA users.
- Assessment IDs.
- Evidence IDs.
- Report IDs.
- Unlock request IDs.
- Entitlement IDs.

## Retention

During controlled launch:

- Keep key QA data temporarily for traceability.
- Do not delete data used to validate launch without documenting it.
- Keep synthetic evidence only.
- Avoid real customer-sensitive data in QA.

## Cleanup Rules

Before cleanup:

- Record what will be deleted.
- Confirm data is marked safe to delete.
- Confirm no active pilot depends on it.

Do not:

- Delete storage manually without record.
- Delete DB records directly without an approved cleanup process.
- Run destructive Prisma commands.

## Cleanup Backlog

Create `HITO OPS-1 — QA Data Cleanup / Retention` to formalize:

- Cleanup scripts or admin tools.
- Retention duration.
- Audit events.
- Storage cleanup behavior.
- Report/evidence deletion policy.
