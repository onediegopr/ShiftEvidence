# BILLING-2.9 - Manual Fulfillment Runbook

Date: 2026-05-31

## BILLING-4 update

This runbook still applies to manual fulfillment, but the active checkout foundation is now Stripe-first. References to Lemon Squeezy below are historical for orders/events created before decommission; new card checkout should use Stripe test-safe wiring or manual invoice fallback.

Status: active operating runbook before BILLING-3.

## 1. Scope

This runbook defines how Shift Evidence should operate paid Lemon Squeezy
checkout while fulfillment is still manual.

Current paid products:

| Product | Lemon checkout | Price | Fulfillment model |
| --- | --- | ---: | --- |
| Starter Readiness | Active in test mode | USD 490 | Manual unlock / manual delivery |
| Professional Assessment | Active in test mode | USD 1,500 | Manual unlock / manual delivery |
| MSP Partner | Active in test mode | USD 399/month | Manual partner onboarding |

Out of scope:

- no webhook processing;
- no order ledger;
- no payment ledger;
- no automatic entitlements;
- no subscription reconciliation;
- no automatic email fulfillment;
- no automatic workspace provisioning.

## 2. What Happens Today After Payment

When a user clicks a configured checkout route:

1. The app creates a Lemon Squeezy checkout session server-side.
2. Lemon hosts the checkout.
3. If checkout succeeds, Lemon owns the payment/order record.
4. The app redirect target is `/billing/checkout/<plan>?status=success`.
5. Shift Evidence does not verify that payment succeeded.
6. Shift Evidence does not write an order/payment row.
7. Shift Evidence does not grant entitlement automatically.
8. Diego must verify the Lemon order manually before unlocking anything.

Authoritative payment evidence is in Lemon Squeezy, not in the app database.

## 3. Universal Manual Fulfillment Rules

Before granting access:

1. Open Lemon Squeezy dashboard.
2. Confirm order exists.
3. Confirm order is paid/succeeded and not refunded.
4. Confirm product/variant matches the requested plan.
5. Confirm purchaser email and customer identity.
6. Confirm whether the app user/workspace/assessment exists.
7. Confirm there is no duplicate/refunded/conflicting order.
8. Save a safe internal note with:
   - Lemon order id;
   - product name;
   - customer email;
   - payment date;
   - app user email;
   - workspace id or name;
   - assessment id if known;
   - operator initials.

Never store card numbers, raw payment method data, full billing address dumps, or
API keys in admin notes.

## 4. Scenario A - Starter Assessment

Trigger:

- Customer pays Starter Readiness through Lemon checkout.

Diego checklist:

1. Verify Lemon order:
   - product: Starter Readiness;
   - amount: USD 490;
   - status: paid/succeeded;
   - test/live mode matches the current operating mode;
   - not refunded.
2. Match customer to Shift Evidence account:
   - confirm user email;
   - confirm workspace;
   - confirm target assessment or ask customer to create one.
3. If the user has not requested unlock in the app:
   - ask them to open the assessment and request Starter/full report access, or
   - create/track an internal manual task referencing the assessment id.
4. In `/dashboard/admin/unlock-requests`, find the relevant request.
5. Approve/fulfill the request only after payment verification.
6. Expected entitlement:
   - `full_report_unlocked`.
7. Verify:
   - assessment report opens for the customer;
   - PDF/download works if included in current product scope;
   - no unrelated workspace has access.
8. Send customer email:
   - confirm payment received;
   - confirm Starter access is enabled;
   - include next step link to dashboard/assessment;
   - include support contact.
9. Save internal evidence:
   - Lemon order id;
   - unlock request id;
   - assessment id;
   - timestamp;
   - operator note.

Do not grant Professional or MSP access from a Starter payment.

## 5. Scenario B - Professional Assessment

Trigger:

- Customer pays Professional Assessment through Lemon checkout.

Diego checklist:

1. Verify Lemon order:
   - product: Professional Assessment;
   - amount: USD 1,500;
   - status: paid/succeeded;
   - not refunded.
2. Confirm commercial scope:
   - one assessment unless manually agreed otherwise;
   - customer workspace;
   - expected evidence package;
   - any promised call/report delivery timeline.
3. Match customer to app:
   - user email;
   - workspace;
   - assessment id.
4. In admin unlock requests, approve/fulfill the Professional request.
5. Expected entitlements:
   - `full_report_unlocked`;
   - `pro_matrix_unlocked`.
6. If storage readiness is included by a separate agreement, verify that
   commercial decision separately before granting `storage_readiness_unlocked`.
7. Verify:
   - Pro sections appear;
   - report preview renders;
   - PDF/export works;
   - AI advisory does not expose raw files/secrets.
8. Send customer email:
   - payment confirmation;
   - access confirmation;
   - evidence upload/checklist reminder;
   - expected delivery/support path.
9. Save evidence:
   - Lemon order id;
   - entitlement keys granted;
   - assessment id;
   - workspace;
   - operator note.

Do not assume payment means the customer's uploaded evidence is complete.

## 6. Scenario C - MSP Partner

Trigger:

- Customer subscribes to MSP Partner through Lemon checkout.

Diego checklist:

1. Verify Lemon subscription:
   - product: MSP Partner;
   - amount: USD 399/month;
   - status: active;
   - customer email/domain;
   - next renewal date;
   - not cancelled/refunded.
2. Confirm partner identity:
   - company;
   - billing contact;
   - primary admin user;
   - intended client/workspace model.
3. Decide manual access scope:
   - partner workspace;
   - client workspaces;
   - number of assessments included;
   - support boundary.
4. Create or confirm the app user/workspace.
5. Grant only the agreed manual entitlements or workspace access.
6. Record subscription details:
   - Lemon subscription id;
   - plan;
   - renewal date;
   - customer email;
   - workspace id;
   - partner agreement notes.
7. Send onboarding email:
   - MSP access confirmed;
   - operating rules;
   - client onboarding process;
   - billing support contact.
8. Add the subscription to the weekly/monthly reconciliation list.

Do not assume Lemon subscription renewal automatically extends app access until
BILLING-3 subscription sync exists.

## 7. Scenario D - Manual Refund

Trigger:

- Customer requests refund, duplicate payment is found, or support decides to
  refund manually.

Refund checklist:

1. Verify original Lemon order/subscription.
2. Confirm refund policy and reason.
3. Confirm whether app access was already granted.
4. Process refund in Lemon only if authorized by Diego.
5. Do not delete assessments, reports, users, or evidence.
6. If access should be revoked:
   - use admin/manual entitlement process where available;
   - record reason and Lemon refund id;
   - notify customer.
7. If access remains temporarily available:
   - record exception and expiry date.
8. Save evidence:
   - Lemon refund id;
   - original order id;
   - affected user/workspace/assessment;
   - operator note;
   - customer communication.

Never run destructive database commands for a billing refund.

## 8. Daily Billing Checklist

Daily:

- Review Lemon orders and subscriptions.
- Review failed/abandoned checkout if visible.
- Review `/dashboard/admin/unlock-requests`.
- Match paid orders to app users/workspaces/assessments.
- Fulfill only verified paid orders.
- Check support messages for billing/invoice issues.
- Record any manual actions in admin notes.

## 9. Weekly Billing Checklist

Weekly:

- Reconcile Lemon paid orders against fulfilled unlock requests.
- Reconcile MSP active subscriptions against partner access.
- Review refunds, disputes, failed payments, and cancellations.
- Review manual invoice requests.
- Check if any paid customer has no app access.
- Check if any app entitlement lacks payment/admin evidence.
- Update the billing operations tracker.

## 10. Monthly Billing Checklist

Monthly:

- Export or review Lemon orders/subscriptions.
- Reconcile revenue totals with manual fulfillment records.
- Review MSP renewals and cancellations.
- Review refund/dispute trends.
- Review entitlement exceptions.
- Prepare BILLING-3 migration notes for automation gaps found in real use.

## 11. Customer Email Templates

Payment received:

```text
Subject: Shift Evidence access confirmed

Hi <name>,

We received your Shift Evidence payment for <plan>. Your access has been enabled
manually for <workspace/assessment>.

You can continue here:
<dashboard or assessment link>

If anything looks off, reply to this email and include your workspace or
assessment name.

Thanks,
Shift Evidence
```

Payment received but account missing:

```text
Subject: Next step for your Shift Evidence access

Hi <name>,

We received your Shift Evidence payment for <plan>. I could not match it to an
active Shift Evidence account yet.

Please sign up or reply with the email address you want associated with the
workspace. Access will be enabled manually after confirmation.

Thanks,
Shift Evidence
```

Refund processed:

```text
Subject: Shift Evidence refund confirmation

Hi <name>,

Your refund for <plan/order reference> has been processed in Lemon Squeezy.
Access changes, if any, will be handled manually and confirmed separately.

Thanks,
Shift Evidence
```
