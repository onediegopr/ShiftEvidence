# Billing Provider Cleanup Record

Date: 2026-06-02

This file is the historical record for removing the retired Lemon Squeezy payment provider from the active Shift Evidence product.

Allowed residual references after this cleanup:

- Historical Prisma migrations that already created provider enum values.
- The `BillingProvider` database enum value `lemon_squeezy`, retained to avoid destructive schema changes against historical ledger rows.
- This document only.

Active billing model after cleanup:

- Stripe is the only card checkout provider. It remains configurable/test-gated and does not grant access automatically.
- Wise is represented only as a manual bank transfer and invoice reference through `/billing/bank-transfer/[plan]`.
- Manual admin review remains required for invoice requests, payment evidence, fulfillment, refunds and revocations.

No active route, service, UI card, environment placeholder, test, operational doc, provider option or legacy functional path should create or process Lemon checkout or webhook activity after this cleanup.