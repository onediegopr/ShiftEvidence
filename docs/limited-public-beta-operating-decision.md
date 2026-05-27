# Limited Public Beta Operating Decision

Date: 2026-05-27.

## Decision

ShiftReadiness remains in controlled production launch and may operate as a limited public beta.

Full public launch remains NO.

## Launch Type

Controlled production launch with limited public beta access.

## Who Can Use It

Allowed:

- Selected pilot users.
- Invited public beta users.
- Supervised demos.
- Low-volume manual onboarding.

Not allowed yet:

- Broad public launch.
- Mass paid self-service.
- Automated checkout/payment claims.
- High-volume marketing campaigns without monitoring/log review.

## Operating Conditions

- Keep user volume low.
- Use manual support and manual entitlement.
- Keep QA data marked `safe to delete`.
- Do not delete QA data without inventory.
- Monitor routes manually.
- Review Hostinger logs when access is available.
- Capture screenshots/IDs for support incidents.

## Support Model

Minimum support model for limited beta:

- Support channel: manual operator/admin channel.
- Response expectation: best-effort same business day for pilot/beta users.
- Password recovery: self-service is operational; manual support remains fallback.
- Upload support: collect assessment ID, file type and screenshot.
- PDF/report support: collect assessment ID, report ID and exact action.
- Entitlement support: handled manually by admin.

Formal SLA is required before full public launch.

## Commercial Model

Current model:

- Manual entitlement.
- No automated checkout.
- No paid self-service.

Public paid self-service requires a separate payment/checkout hito.

## Accepted Risks

- Hostinger logs not reviewed from Codex.
- QA cleanup not executed.
- Authenticated multi-assessment/product-flow browser QA not replayed in this hito.
- Admin cross-owner UX gap remains.
- Support/SLA is manual and minimal.

## Full Public Launch Blockers

- Hostinger logs/runtime health review.
- QA data inventory and cleanup/archive.
- Authenticated browser QA for multi-assessment, upload, parser, report and PDF.
- Admin-safe cross-owner report UX.
- Formal support/SLA.
- Payment/checkout only if the public model requires paid self-service.

## Next Hito

`PUBLIC-BETA-OPS-1 - Hostinger Logs Review + QA Data Inventory/Archive + Authenticated Browser QA`.

## PUBLIC-BETA-OPS-1 Follow-up

Date: 2026-05-27.

Decision remains:

- Limited public beta: YES.
- Full public launch: NO.

Operational conditions remain:

- Invitation-only or controlled low-volume access.
- Manual support.
- Manual entitlement.
- No paid self-service claims.
- No automated migration claims.
- QA data retained only with `safe to delete` marking.

Pending:

- Hostinger logs review.
- Real QA data inventory/archive.
- Authenticated browser QA with QA user.
- Product flow replay with upload/parser/report/PDF.

## PUBLIC-BETA-OPS-2 Follow-up

Date: 2026-05-27.

Decision remains:

- Limited public beta: YES.
- Full public launch: NO.

Evidence captured:

- Public/private route health.
- Password recovery regression.
- Local build/typecheck/lint.

Evidence still needed:

- Manual Hostinger logs.
- Authenticated browser QA.
- Authenticated product flow.
- QA data archive/retention execution.

## PUBLIC-BETA-OPS-3 Follow-up

Date: 2026-05-27.

Decision remains:

- Limited public beta: YES.
- Full public launch: NO.

Evidence captured:

- Production route smoke.
- Password recovery regression for non-existing email neutral response.
- Password recovery invalid-token controlled failure.
- Local build/typecheck/lint.

Evidence still needed:

- Hostinger runtime/build/deploy logs.
- Authenticated multi-assessment browser QA.
- Authenticated upload/parser/report/PDF replay.
- Real QA data inventory/archive.

## PUBLIC-BETA-OPS-3A Follow-up

Date: 2026-05-27.

Decision remains:

- Limited public beta: YES.
- Full public launch: NO.

Evidence imported:

- Codex production route smoke.
- Codex password recovery regression.
- Codex local build/typecheck/lint.

Evidence not imported:

- Hostinger logs.
- User-attested browser QA.
- User-attested product-flow replay.
- QA data cleanup/archive.
