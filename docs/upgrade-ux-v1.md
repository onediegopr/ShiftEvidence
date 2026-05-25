# Upgrade UX v1

## Purpose
The upgrade UX exists to communicate value and capture intent without a payment flow.

## CTAs
- Unlock Readiness Report
- Unlock Pro Report
- Add Storage Readiness
- Book Technical Review

## Copy rules
- Say `preview`, `preliminary`, `locked`, `requires ...`
- Do not say `final report ready`
- Do not promise download PDF now
- Do not promise guaranteed savings
- Do not imply checkout exists

## User flow
1. User opens the report preview.
2. User sees the locked sections and the reason they are locked.
3. User clicks a CTA.
4. The app records an `UpgradeEvent`.
5. The app creates an `UnlockRequest` and shows the pending manual review state.
6. The UI returns to the preview with a small confirmation banner.

## No checkout
- No Stripe
- No MercadoPago
- No payment form
- No billing mutation
- No fake success page

## Placeholders
The call to action should always feel intentional, but the actual payment or contract flow is deferred to a future milestone.
