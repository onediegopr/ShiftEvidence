# BILLING-3F Production Fulfillment Smoke

Date: 2026-06-01

## Objective

Validate in production that BILLING-3F manual fulfillment can grant access from a verified, matched synthetic `BillingOrder` without live payment, provider calls, webhook auto-grant, subscription fulfillment, or customer data.

## Production deployment

- Expected commit: `148252b feat: add manual billing fulfillment grants`.
- Local `main` and `origin/main`: synchronized at `148252b`.
- Unauthenticated `/dashboard/admin/billing`: `307` redirect to `/sign-in`.
- Authenticated admin route: loaded successfully.
- BILLING-3F panel visible: fulfillment preview, real-access warning, confirmation checkbox and manual grant button.

## Baseline counts

Before creating the BILLING-3F smoke order:

| Table | Count |
| --- | ---: |
| BillingOrder | 1 |
| BillingSubscription | 1 |
| BillingEntitlementGrant | 0 |
| AssessmentEntitlement | 136 |
| AuditEvent | 364 |

## Smoke entities

Used existing synthetic H5 smoke entities:

- User: H5 Smoke test user.
- Workspace: H5 Smoke test workspace.
- Assessment: H5 Risk Smoke Assessment.

The user owns the workspace and the assessment belongs to that workspace.

## Synthetic BillingOrder

Created one production smoke-only `BillingOrder`:

- Provider: `lemon_squeezy`.
- Provider order ID: `billing_3f_smoke_order_20260601104237`.
- Plan: `starter_readiness`.
- Amount: USD 490.00.
- Status: `paid`.
- Customer email: synthetic `.invalid` address.
- Match: user, workspace and assessment populated.
- `paidAt`: set during smoke creation.

No `BillingPayment`, checkout, Lemon API call, card, live payment or customer data was used.

Counts after creating the synthetic order:

| Table | Count |
| --- | ---: |
| BillingOrder | 2 |
| BillingSubscription | 1 |
| BillingEntitlementGrant | 0 |
| AssessmentEntitlement | 136 |
| AuditEvent | 364 |

## Fulfillment preview

The admin UI showed:

- order visible in recent orders;
- status `paid`;
- match complete;
- plan `starter_readiness`;
- entitlement preview: `full_report_unlocked`;
- no existing grants;
- strong warning that the action grants real access to the selected assessment;
- explicit confirmation checkbox;
- no secrets or raw payloads visible.

The previous BILLING-3E pending smoke order remained visible but ineligible with the reason that the order must be `paid`.

## Fulfillment execution

Executed manual fulfillment from the admin UI by selecting the explicit confirmation and pressing the manual access grant button.

Result:

- success banner/redirect state visible;
- no `NEXT_REDIRECT` leaked in the URL;
- UI changed to `Ya concedido`;
- existing grant preview showed `full_report_unlocked`.

Note: a safe internal note was attempted through the embedded browser, but the textarea did not persist text during this run. The resulting `AuditEvent` still contains the required billing, plan, user, workspace, assessment and entitlement context and no secrets.

## DB post-check

After fulfillment:

| Table | Count |
| --- | ---: |
| BillingOrder | 2 |
| BillingSubscription | 1 |
| BillingEntitlementGrant | 1 |
| AssessmentEntitlement | 136 |
| AuditEvent | 365 |

Billing grant:

- `billingOrderId`: synthetic BILLING-3F order.
- `entitlementKey`: `full_report_unlocked`.
- `status`: `granted`.
- `source`: `manual_billing_fulfillment`.
- user/workspace/assessment IDs: matched smoke entities.

Assessment entitlement:

- smoke assessment has `full_report_unlocked` with `status=granted`;
- source references the synthetic billing order;
- no unexpected extra entitlement was granted.

Audit event:

- `eventType`: `billing_order_fulfilled`;
- contains billing order, provider order, plan, user, workspace, assessment and entitlement keys;
- contains no secrets.

## Idempotency replay

The UI showed the fulfilled order as already granted and disabled the manual grant button.

Counts after replay attempt:

| Table | Count |
| --- | ---: |
| BillingOrder | 2 |
| BillingSubscription | 1 |
| BillingEntitlementGrant | 1 |
| AssessmentEntitlement | 136 |
| AuditEvent | 365 |

The specific billing order still has one `BillingEntitlementGrant` for `full_report_unlocked`, and the smoke assessment still has one `AssessmentEntitlement` for `full_report_unlocked`.

## Negative checks

Confirmed:

- no fulfillment control for `BillingSubscription`;
- pending BILLING-3E smoke order is visible but ineligible;
- pending order grant button is disabled;
- MSP, Blueprint, refunded, cancelled and unmatched ineligibility are covered by the BILLING-3F unit tests;
- no webhook, match, subscription, checkout success URL or provider call triggered fulfillment.

## Security

Confirmed:

- no live payment;
- no checkout;
- no card;
- no Lemon API call;
- no Wise API call;
- no Stripe integration;
- no Hostinger or env changes;
- no schema or migration change;
- no secrets in UI/DOM or docs;
- no raw payload;
- no card-like data.

## Risks

- Smoke artifacts remain in production ledger and are clearly marked with `billing_3f_smoke_*`.
- `BillingEntitlementGrant` idempotency is still service-level, not DB-level; DB unique hardening remains recommended.
- Refund/cancel revocation is still a future milestone.
- MSP partner entitlement remains undefined.

## Next step

Recommended next milestone:

- BILLING-3F-PROD-SMOKE-PUSH to commit this documentation;
- then DB-level idempotency hardening or BILLING-3G refund/cancel/revoke boundary.
