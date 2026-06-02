# Billing Pivot 2 - Manual Invoice QA

Date: 2026-06-02
Environment: production public flow plus read-only database verification
Status: completed after controlled production migration gate

## Scope

Validate the Wise / bank transfer manual invoice flow without real payments, Wise transfers, recipients, balances, Stripe checkout purchases, auto-grants or entitlement changes.

## Synthetic Data

- Plan: Professional Assessment
- Contact name: Billing Smoke Test
- Work email: billing-smoke+wise-test@example.invalid
- Company: Synthetic Billing Smoke LLC
- Country: United States
- Tax/VAT ID: TEST-NOT-REAL
- Purchase order: PO-SMOKE-WISE-001
- Notes: Synthetic smoke test. No real payment. Do not fulfill.

## Public Page Checks

Confirmed for Starter, Professional and MSP bank-transfer routes:

- Pages returned 200.
- Plan and price rendered from server config.
- Copy described manual invoice / bank transfer.
- Wise appeared only as a manual bank transfer reference.
- No Wise transfer, recipient, balance or automated payment promise was shown.
- No bank account, IBAN, SWIFT or routing details were exposed.
- No Lemon copy was found.
- No "Pay with Wise" checkout copy was found.

## Initial Submission Attempt

One synthetic Professional invoice request submission was attempted through the public production route.

Result:

- Request created: no.
- HTTP result from direct Server Action POST attempt: 500.
- Read-only Prisma verification found `BillingInvoiceRequest` table missing in the configured database.
- `npx prisma migrate status` reported pending migration: `20260602133000_billing_invoice_requests`.

No migration was applied during this QA.

## Migration Gate Follow-Up

Approved follow-up hito: `BILLING-PIVOT-2A`.

Applied migration:

- `20260602133000_billing_invoice_requests`

Migration command:

```bash
npx prisma migrate deploy
```

Result:

- Migration applied: yes.
- `BillingInvoiceRequest` table exists: yes.
- `npx prisma migrate status`: database schema is up to date.
- Migration remained additive: CREATE TYPE, CREATE TABLE, CREATE INDEX and ADD FK only.
- No `db push`, reset, destructive SQL, Hostinger change, environment change, payment, Wise transfer, Stripe checkout or entitlement action was used.

Post-migration validation:

- `npx prisma validate`: passed.
- `npx prisma generate`: passed after closing stale local `next start` smoke servers that were locking the Prisma DLL on Windows.
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm run test:run`: passed, 114 files / 580 tests.
- `npm run build`: passed with the known Turbopack/NFT warning involving `localStorageService`.

## Successful Synthetic Request

After migration, one synthetic Professional invoice request was submitted through a headless Chrome browser against production.

Result:

- Request created: yes.
- Request ID: `cmpwt3win0001495l7ghdedqg`.
- Plan: Professional Assessment.
- Plan slug: `professional`.
- Amount: USD 1,500 (`amountCents=150000`), sourced from server config.
- Provider: `wise`.
- Initial status: `pending`.
- User/workspace/assessment links: null.
- Invoice sent timestamp: null.
- Payment received timestamp: null.
- Internal notes: null.

Synthetic customer data:

- Contact name: Billing Smoke Test.
- Work email: billing-smoke+wise-test@example.invalid.
- Company: Synthetic Billing Smoke LLC.
- Country: United States.
- Tax/VAT ID: TEST-NOT-REAL.
- Purchase order: PO-SMOKE-WISE-001.
- Notes: Synthetic smoke test. No real payment. Do not fulfill.

## Reconciliation

Read-only checks after the successful synthetic request found no new records since the test window in:

- BillingOrder.
- BillingPayment.
- AssessmentEntitlement.

The expected audit event was created:

- `billing.invoice_request.created`.
- Provider metadata: `wise`.
- Billing invoice request ID: `cmpwt3win0001495l7ghdedqg`.

Admin billing without a session returned 307 to `/sign-in`, so public admin data was not exposed. Admin actions were not tested because no authenticated admin session was used.

## Admin Manual Invoice QA

Follow-up hito: `BILLING-PIVOT-2B`.

Preflight:

- `npx prisma migrate status`: database schema is up to date.
- Request `cmpwt3win0001495l7ghdedqg` exists.
- Initial status remained `pending`.
- Public `/dashboard/admin/billing` returned 307 to `/sign-in`.

Read-only admin data verification:

- The request appears in the same latest-25 list loaded by the admin billing console.
- Position in latest-25 list: 0.
- Plan: Professional Assessment.
- Plan slug: `professional`.
- Amount: USD 1,500 (`amountCents=150000`).
- Provider: `wise`.
- Status: `pending`.
- Customer email: billing-smoke+wise-test@example.invalid.
- Company: Synthetic Billing Smoke LLC.
- Contact: Billing Smoke Test.
- Country: United States.
- Tax/VAT ID: TEST-NOT-REAL.
- Purchase order: PO-SMOKE-WISE-001.
- Notes: Synthetic smoke test. No real payment. Do not fulfill.

Admin visual/session result:

- Authenticated admin session was not available in this Codex session.
- In-app browser tooling was not exposed in the available tools for this turn.
- Codex for Chrome was not used.
- `invoice_sent` action was not executed.
- No `payment_received` action was executed.
- No grant, unlock, payment, order-paid transition or entitlement action was executed.

Post-admin reconciliation:

- BillingOrder records created since the test window: none.
- BillingOrder `paid` transitions since the test window: none.
- BillingPayment records created since the test window: none.
- AssessmentEntitlement records created since the test window: none.
- UnlockRequest records created since the test window: none.
- Wise API action: none.
- Stripe checkout/payment action: none.
- Lemon residual in public admin redirect/sign-in HTML: none.
- Secrets or bank details exposed in public admin redirect/sign-in HTML: none.

## Conclusion

The UI and safety copy are live, the additive migration is applied, and the end-to-end manual invoice request flow creates a pending synthetic request without payment, order, Wise automation, Stripe checkout or entitlement side effects.

No real payment, Wise API action, Stripe checkout purchase, entitlement grant, unlock, Hostinger change, environment change, DB destructive action, commit or push was performed.
