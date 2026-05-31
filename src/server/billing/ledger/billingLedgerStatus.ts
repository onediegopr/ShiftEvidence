import type {
  BillingEventStatus,
  BillingGrantStatus,
  BillingOrderStatus,
  BillingPaymentStatus,
  BillingSubscriptionStatus,
} from "@prisma/client";

const billingEventStatusTransitions = {
  pending: ["processed", "failed", "ignored"],
  processed: [],
  failed: ["pending", "ignored"],
  ignored: [],
} as const satisfies Record<BillingEventStatus, readonly BillingEventStatus[]>;

const billingOrderStatusTransitions = {
  pending: ["paid", "cancelled"],
  paid: ["refunded"],
  refunded: [],
  cancelled: [],
} as const satisfies Record<BillingOrderStatus, readonly BillingOrderStatus[]>;

const billingPaymentStatusTransitions = {
  pending: ["paid", "failed"],
  paid: ["refunded"],
  refunded: [],
  failed: [],
} as const satisfies Record<BillingPaymentStatus, readonly BillingPaymentStatus[]>;

const billingSubscriptionStatusTransitions = {
  active: ["cancelled", "expired", "payment_failed"],
  cancelled: ["active", "expired"],
  expired: [],
  payment_failed: ["active", "cancelled", "expired"],
} as const satisfies Record<BillingSubscriptionStatus, readonly BillingSubscriptionStatus[]>;

const billingGrantStatusTransitions = {
  pending_review: ["granted", "rejected"],
  granted: ["revoked"],
  revoked: [],
  rejected: [],
} as const satisfies Record<BillingGrantStatus, readonly BillingGrantStatus[]>;

function canTransition<TStatus extends string>(
  transitions: Record<TStatus, readonly TStatus[]>,
  from: TStatus,
  to: TStatus,
) {
  return from === to || transitions[from].includes(to);
}

export function canTransitionBillingEventStatus(from: BillingEventStatus, to: BillingEventStatus) {
  return canTransition(billingEventStatusTransitions, from, to);
}

export function canTransitionBillingOrderStatus(from: BillingOrderStatus, to: BillingOrderStatus) {
  return canTransition(billingOrderStatusTransitions, from, to);
}

export function canTransitionBillingPaymentStatus(from: BillingPaymentStatus, to: BillingPaymentStatus) {
  return canTransition(billingPaymentStatusTransitions, from, to);
}

export function canTransitionBillingSubscriptionStatus(
  from: BillingSubscriptionStatus,
  to: BillingSubscriptionStatus,
) {
  return canTransition(billingSubscriptionStatusTransitions, from, to);
}

export function canTransitionBillingGrantStatus(from: BillingGrantStatus, to: BillingGrantStatus) {
  return canTransition(billingGrantStatusTransitions, from, to);
}
