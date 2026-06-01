# BILLING-3E - Manual Match / Reconciliation Queue

Date: 2026-06-01

## 1. Purpose

BILLING-3E adds an admin-only reconciliation workflow for matching existing
billing ledger records to internal Shift Evidence entities.

The workflow links:

- billing orders to user, workspace and assessment;
- billing subscriptions to user and workspace.

This milestone does not grant access.

## 2. Data Model

No migration was required.

Existing fields used:

`BillingOrder`

- `userId`;
- `workspaceId`;
- `assessmentId`.

`BillingSubscription`

- `userId`;
- `workspaceId`.

No new persisted matching status field was created.
No note field was added to billing records.

## 3. Match Status

Match status is derived at runtime.

Order:

- `Sin match`: no user, workspace or assessment;
- `Match parcial`: one or two IDs present;
- `Match completo`: user, workspace and assessment present.

Subscription:

- `Sin match`: no user or workspace;
- `Match parcial`: one ID present;
- `Match completo`: user and workspace present.

`Requiere revision` remains available as a UI/operations label for future
exception states, but it is not persisted in this milestone.

## 4. Audit Trail

Every manual match writes an `AuditEvent`.

The audit event records:

- admin actor id and email;
- billing record type and id;
- provider id;
- plan id;
- before/after linked IDs;
- optional internal note.

Internal notes are stored only in `AuditEvent.metadataJson` and the audit event
message. They are length-limited and rejected when they look like credentials,
tokens, API keys, webhook secrets, database URLs or card-like data.

## 5. Validation Rules

The matching service validates:

- billing record exists;
- selected user exists;
- selected workspace exists;
- selected assessment exists and is not archived;
- selected assessment belongs to the selected workspace when both are provided;
- selected user belongs to the selected workspace or owns it.

Partial match is allowed and visible in the admin UI.

When an assessment is selected without a workspace, the workspace is inferred
from the assessment.

## 6. Admin UI

The admin billing page includes:

- unmatched orders;
- unmatched subscriptions;
- match candidate search;
- order match form;
- subscription match form;
- internal note field;
- visible warnings that saving a match does not grant access.

The UI does not show raw payloads, secrets, full payment method data or billing
addresses.

## 7. What This Does Not Do

BILLING-3E does not:

- create access;
- fulfill a customer purchase;
- create billing access records;
- touch `AssessmentEntitlement`;
- change payment/order/subscription commercial status;
- call Lemon APIs;
- call Wise APIs;
- integrate Stripe;
- run checkout;
- process refunds;
- change Hostinger or environment variables.

## 8. Manual Operation

Recommended operating flow:

1. Open `/dashboard/admin/billing`.
2. Review unmatched orders and subscriptions.
3. Search candidate user/workspace/assessment by email, name or assessment.
4. Select the intended internal entities.
5. Add a short internal note without sensitive data.
6. Save match.
7. Verify the row now shows partial or complete match.
8. Use a future fulfillment milestone to handle access separately.

## 9. Rollback

Rollback is code-only because there is no migration.

Reverting the BILLING-3E commit removes:

- match services;
- admin server actions;
- match UI;
- tests and documentation.

Existing `BillingOrder` and `BillingSubscription` links can be corrected by a
new match action and remain auditable through `AuditEvent`.

## 10. Risks

Remaining risks:

- an admin can select the wrong internal entity, though validation reduces
  obvious mismatches;
- partial matches require manual interpretation;
- fulfillment remains a separate operational step;
- production signed webhook smoke for BILLING-3D is still pending until a safe
  signing-secret workflow is available.

## 11. Next Step

Recommended next milestone:

- BILLING-3E-AUDIT-PUSH for controlled diff audit and commit; then
- BILLING-3F manual fulfillment from verified matched billing records.
