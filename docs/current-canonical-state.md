# Current Canonical State

Fecha: 2026-06-05

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
- Live payment collection: not approved.
- Real customer pilot: only with explicit prospect/dataset/consent.

## 3. What Is Live

- Production runtime: Vercel project `shiftevidence`.
- DNS: Cloudflare authoritative DNS for the public domain.
- Email DNS: preserved.
- Database: Neon production configured and validated.
- Storage: Cloudflare R2 production configured and app upload/download/delete validated.
- Rate limiting: Upstash production configured and smoke validated.
- Auth/admin: production auth/admin smoke validated.
- Billing: safe-off.
- Stripe: live hosted checkout smoke completed without payment; live payment collection remains off.
- PDFs: demo, public sample, and premium sample validated.
- Demo/workspace/sample report: public routes validated.

## 4. What Is Not Approved

- Paid Ads.
- Tracking implementation in this hito.
- Live payment collection.
- Real customer payment.
- Automatic grants.
- Automatic entitlements.
- Public launch masivo.
- Real customer pilot without consent.
- Customer data uploads without explicit scope, consent, and handling expectations.

## 5. Canonical Next Steps

Recommended order:

1. `PRIVATE-OUTREACH-1`.
2. `PILOT-EXECUTION-1`.
3. `GOOGLE-ADS-TRACKING-SETUP-1`.
4. `STRIPE-LIVE-PAYMENT-FINAL-GATE-1` only with exact owner approval.

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
- Stripe live payment final gate remains pending.
- Real pilot remains pending prospect/dataset/consent.
- Docs history remains broad; operators should start from this canonical file.

## 8. Current Safe-Off Billing Rule

Production checkout start routes should remain disabled until explicit approval.

Public pricing should prioritize:

- invoice request;
- controlled onboarding;
- support/contact;
- checkout link only after controlled approval.

## 9. Operational Rule

If a future task conflicts with this file, pause and update the canonical state first or document why a newer approved hito supersedes it.
