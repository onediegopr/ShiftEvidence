# Billing Manual Fulfillment Runbook

Status: manual-only fulfillment guidance.

## Purpose

This runbook documents the safe manual process for invoice requests, card checkout review, and access decisions. It does not authorize live payments or automatic grants.

## Manual Invoice Request

1. Review the invoice request in the admin billing console.
2. Confirm plan, amount, customer email, company, and notes.
3. Send invoice instructions manually outside the product.
4. Mark `invoice_sent` only after the manual invoice communication has been sent.
5. Keep internal notes synthetic or operational as appropriate.

Do not mark payment received unless a separate approved workflow confirms payment evidence and the action does not bypass entitlement controls.

## Card Checkout Review

1. Review Stripe billing events in the admin ledger when webhooks are configured.
2. Match event metadata to plan and customer context.
3. Confirm that the event belongs to the expected test or approved live mode.
4. Use the separate approved fulfillment process for any access decision.

Checkout creation alone is not payment evidence and does not unlock access.

## Prohibited Actions

- No automatic access grants.
- No assessment entitlement changes from checkout creation.
- No Wise transfers, recipients, balances, or automated payments.
- No live checkout unless a separate hito approves it.
- No secrets in notes, docs, logs, or UI.

## Reconciliation Notes

Keep reconciliation manual until a separate automation hito defines controls, tests, rollback, and approval gates.
