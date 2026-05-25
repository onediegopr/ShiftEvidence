# Report Entitlements v1

## Plan relationship
The preview uses the workspace plan, existing entitlements and manual unlock requests as visual boundaries.

## Existing entitlement keys
- `full_report_unlocked`
- `storage_readiness_unlocked`
- `pro_matrix_unlocked`
- `review_call_unlocked`

## Add-ons
- Storage Add-on
- Readiness Report Pro
- Technical Review

## Manual unlock flow
- A user can request an unlock from the report preview.
- The request is stored as `UnlockRequest` with a pending state.
- An admin can approve, reject or fulfill it manually.
- Fulfillment grants the matching entitlement idempotently.

## Visual vs functional
- Visual: locked cards, labels, CTAs and preview text
- Functional: existing assessment data, findings, scores and limited matrix rows
- Not implemented yet: payment capture, entitlement purchase, billing state transitions

## Notes
This milestone only reflects the boundary. It does not activate a commerce system.
