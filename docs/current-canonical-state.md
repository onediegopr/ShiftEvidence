# Current Canonical State

Fecha: 2026-06-09

## 1. Purpose

This document is the current operational state reference for Shift Evidence. Older documents remain useful as history, but this file should be treated as the short canonical summary before acting on production, billing, launch, or customer work.

## 2. Current Production Status

Status: controlled production ready.

Production is live at:

- `https://www.shiftevidence.com`.

Current posture:

- Soft public availability: yes.
- Private outreach: allowed with guardrails.
- Public launch masivo: not approved.
- Paid Ads: not approved.
- Live payment collection: approved only through the controlled Stripe checkout flow.
- Real customer pilot: only with explicit prospect/dataset/consent.

## 3. What Is Live

- Production runtime: Vercel project `shiftevidence`.
- DNS: Cloudflare authoritative DNS for the public domain.
- Email DNS: preserved.
- Database: Neon production configured and validated.
- Storage: Cloudflare R2 production configured and app upload/download/delete validated.
- Rate limiting: Upstash production configured and smoke validated.
- Auth/admin: production auth/admin smoke validated.
- Billing: controlled live Stripe checkout plus manual invoice / bank transfer.
- Stripe: live hosted checkout is enabled for approved public checkout routes; fulfillment remains manual.
- PDFs: demo, public sample, and premium sample validated.
- Demo/workspace/sample report: public routes validated.

## 4. What Is Not Approved

- Paid Ads.
- Tracking implementation in this hito.
- Real customer payment without operational review and fulfillment readiness.
- Automatic grants.
- Automatic entitlements.
- Public launch masivo.
- Real customer pilot without consent.
- Customer data uploads without explicit scope, consent, and handling expectations.

## 5. Canonical Next Steps

Recommended order:

1. `OUTREACH-FOLLOWUP-1` after private replies arrive.
2. `PILOT-EXECUTION-1` when prospect/dataset/consent exists.
3. `GOOGLE-ADS-TRACKING-SETUP-1`.
4. `BILLING-FULFILLMENT-OPS-1` to rehearse paid order matching, invoice follow-up and manual access grants with explicit owner approval.

## 6. Historical Docs Policy

Older docs are reference/history.

Do not use old Hostinger, Lemon, Stripe stale-price, pre-cutover, or pre-safe-off docs as runtime truth.

Current source of truth hierarchy:

1. This document.
2. `docs/mega-audit-hotfix-1.md`.
3. `docs/mega-audit-production-readiness-1.md`.
4. `docs/production-cutover-controlled.md`.
5. Specific smoke docs for R2, Upstash, Neon, Stripe, Auth/Admin, and DNS.

## 7. Known Risks

- Workbook parsing dependency risk has initial guardrails but remains a controlled-pilot-only risk; see `docs/dependency-xlsx-risk.md` and `docs/dependency-xlsx-risk-1.md`.
- Tracking/Ads remains out of scope until a dedicated tracking/privacy hito.
- Stripe live checkout can collect payment, but paid access still requires manual match and fulfillment from the admin console.
- Real pilot remains pending prospect/dataset/consent.
- Private outreach motion and safe execution record are prepared; sending remains manual one-to-one by the owner and should not store personal contact data in repo.
- Docs history remains broad; operators should start from this canonical file.

## 8. Current Controlled Billing Rule

Production checkout start routes may create hosted Stripe Checkout sessions for approved public plans.

Public pricing should prioritize:

- invoice request;
- controlled onboarding;
- support/contact;
- controlled card checkout;
- no promise of instant access or automatic entitlements.

## 9. Monetization And Fulfillment State

Stripe:

- Public card checkout is enabled for Starter Readiness, Professional Assessment, and MSP Partner.
- Checkout creates hosted Stripe Checkout sessions server-side.
- Success and cancel routes return to the plan checkout page.
- Checkout metadata includes provider, plan id, plan slug, source, and, when the buyer is logged in, user/email/workspace context.
- Stripe webhooks are implemented at `/api/webhooks/stripe` with signature verification.
- Webhook events are persisted into billing events, orders, payments and subscriptions for admin review.
- Stripe webhook processing does not grant access automatically.

Wise / bank transfer:

- Wise is used as a manual bank transfer / invoice reference, not as an automated transfer system.
- Public pages do not expose bank or Wise receiving details.
- Customers submit invoice requests from the bank-transfer routes.
- Billing sends bank/Wise receiving details on the reviewed invoice.
- Customers should pay using the invoice number or payment reference.
- Billing validates transfer evidence manually before access is fulfilled.

Fulfillment:

- Automatic entitlements are not approved.
- Paid Stripe orders require manual review, match and fulfillment from `/dashboard/admin/billing`.
- Manual invoice requests can be marked pending, invoice sent, payment received, cancelled, or rejected.
- Marking an invoice request as payment received does not create an automatic grant.
- Starter and Professional paid orders can be fulfilled manually after paid status and complete user/workspace/assessment match.
- MSP Partner requires partner-specific manual onboarding and is not auto-granted by the standard assessment fulfillment flow.
- All manual match, fulfillment, revocation and invoice status changes write audit events.

Operational procedure:

1. Buyer chooses a plan from pricing, partners, demo, sample report, landing, or direct billing route.
2. Buyer uses card checkout or submits manual invoice request.
3. For Stripe, wait for webhook/ledger record and verify payment status in admin billing.
4. For bank transfer, send reviewed invoice with bank/Wise details and require invoice/reference on payment.
5. Confirm payment externally in Stripe/Wise/bank before granting access.
6. Match paid order to user, workspace and assessment in admin billing.
7. Fulfill manually only after match is complete and the paid status is verified.
8. If refund/cancel occurs, use the refund/cancel review panel and manual revocation flow. Do not delete customer data.

## 10. Operational Rule

If a future task conflicts with this file, pause and update the canonical state first or document why a newer approved hito supersedes it.
