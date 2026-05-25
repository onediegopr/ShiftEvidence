# Upgrade Events v1

## Model
`UpgradeEvent`

## Trigger types used in Hito 6 and Hito 8
- `report_preview_viewed`
- `unlock_report_clicked`
- `unlock_pro_clicked`
- `storage_addon_clicked`
- `review_call_clicked`

## Tracking
- `report_preview_viewed` is recorded when the report preview page loads.
- CTA clicks are recorded by server action before redirecting back to the preview.
- In Hito 8, the CTA click also creates or reuses an `UnlockRequest`.
- `clicked` is `true` for CTAs and `false` for view events.

## Metadata
Keep metadata minimal and non-sensitive:
- assessment id
- user id
- trigger type
- message
- clicked

## Limitations
- No checkout event exists.
- No payment confirmation exists.
- No purchase or entitlement change is performed by this milestone.
- The unlock request lifecycle is tracked separately from the upgrade intent event.
