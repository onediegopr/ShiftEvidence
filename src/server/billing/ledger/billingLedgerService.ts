import type {
  BillingOrderStatus,
  BillingPaymentStatus,
  BillingProvider,
  BillingSubscriptionStatus,
  EntitlementKey,
  Prisma,
} from "@prisma/client";
import {
  createBillingEventIdempotencyKey,
  hashBillingPayload,
} from "./billingIdempotency";

function normalizeOptionalText(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function normalizeCustomerEmail(value: string | null | undefined) {
  return normalizeOptionalText(value)?.toLowerCase() ?? null;
}

function assertNonNegativeCents(amountCents: number) {
  if (!Number.isInteger(amountCents) || amountCents < 0) {
    throw new Error("Billing ledger amounts must be non-negative integer cents.");
  }
}

export function buildBillingEventCreateData(params: {
  provider: BillingProvider;
  providerEventId: string;
  eventType: string;
  rawPayload: string | Buffer;
  safePayloadJson?: Prisma.InputJsonValue;
  idempotencyKey?: string | null;
}): Prisma.BillingEventUncheckedCreateInput {
  return {
    provider: params.provider,
    providerEventId: params.providerEventId.trim(),
    eventType: params.eventType.trim(),
    idempotencyKey:
      normalizeOptionalText(params.idempotencyKey) ??
      createBillingEventIdempotencyKey({
        provider: params.provider,
        providerEventId: params.providerEventId,
      }),
    rawPayloadHash: hashBillingPayload(params.rawPayload),
    safePayloadJson: params.safePayloadJson,
    status: "pending",
  };
}

export function buildBillingOrderCreateData(params: {
  provider: BillingProvider;
  providerOrderId?: string | null;
  providerCheckoutId?: string | null;
  providerCustomerId?: string | null;
  productId?: string | null;
  variantId?: string | null;
  planId: string;
  amountCents: number;
  currency?: string | null;
  status?: BillingOrderStatus;
  customerEmail?: string | null;
  userId?: string | null;
  workspaceId?: string | null;
  assessmentId?: string | null;
  paidAt?: Date | null;
  refundedAt?: Date | null;
  cancelledAt?: Date | null;
  providerCreatedAt?: Date | null;
}): Prisma.BillingOrderUncheckedCreateInput {
  assertNonNegativeCents(params.amountCents);

  return {
    provider: params.provider,
    providerOrderId: normalizeOptionalText(params.providerOrderId),
    providerCheckoutId: normalizeOptionalText(params.providerCheckoutId),
    providerCustomerId: normalizeOptionalText(params.providerCustomerId),
    productId: normalizeOptionalText(params.productId),
    variantId: normalizeOptionalText(params.variantId),
    planId: params.planId.trim(),
    amountCents: params.amountCents,
    currency: normalizeOptionalText(params.currency) ?? "USD",
    status: params.status ?? "pending",
    customerEmail: normalizeCustomerEmail(params.customerEmail),
    userId: normalizeOptionalText(params.userId),
    workspaceId: normalizeOptionalText(params.workspaceId),
    assessmentId: normalizeOptionalText(params.assessmentId),
    paidAt: params.paidAt,
    refundedAt: params.refundedAt,
    cancelledAt: params.cancelledAt,
    providerCreatedAt: params.providerCreatedAt,
  };
}

export function buildBillingPaymentCreateData(params: {
  provider: BillingProvider;
  providerPaymentId?: string | null;
  orderId: string;
  amountCents: number;
  currency?: string | null;
  status?: BillingPaymentStatus;
  paidAt?: Date | null;
  refundedAt?: Date | null;
  failedAt?: Date | null;
}): Prisma.BillingPaymentUncheckedCreateInput {
  assertNonNegativeCents(params.amountCents);

  return {
    provider: params.provider,
    providerPaymentId: normalizeOptionalText(params.providerPaymentId),
    orderId: params.orderId,
    amountCents: params.amountCents,
    currency: normalizeOptionalText(params.currency) ?? "USD",
    status: params.status ?? "pending",
    paidAt: params.paidAt,
    refundedAt: params.refundedAt,
    failedAt: params.failedAt,
  };
}

export function buildBillingSubscriptionCreateData(params: {
  provider: BillingProvider;
  providerSubscriptionId?: string | null;
  providerCustomerId?: string | null;
  planId: string;
  productId?: string | null;
  variantId?: string | null;
  status?: BillingSubscriptionStatus;
  customerEmail?: string | null;
  userId?: string | null;
  workspaceId?: string | null;
  currentPeriodStart?: Date | null;
  currentPeriodEnd?: Date | null;
  cancelledAt?: Date | null;
  expiredAt?: Date | null;
  paymentFailedAt?: Date | null;
  providerCreatedAt?: Date | null;
}): Prisma.BillingSubscriptionUncheckedCreateInput {
  return {
    provider: params.provider,
    providerSubscriptionId: normalizeOptionalText(params.providerSubscriptionId),
    providerCustomerId: normalizeOptionalText(params.providerCustomerId),
    planId: params.planId.trim(),
    productId: normalizeOptionalText(params.productId),
    variantId: normalizeOptionalText(params.variantId),
    status: params.status ?? "active",
    customerEmail: normalizeCustomerEmail(params.customerEmail),
    userId: normalizeOptionalText(params.userId),
    workspaceId: normalizeOptionalText(params.workspaceId),
    currentPeriodStart: params.currentPeriodStart,
    currentPeriodEnd: params.currentPeriodEnd,
    cancelledAt: params.cancelledAt,
    expiredAt: params.expiredAt,
    paymentFailedAt: params.paymentFailedAt,
    providerCreatedAt: params.providerCreatedAt,
  };
}

export function buildBillingEntitlementGrantCreateData(params: {
  entitlementKey: EntitlementKey;
  billingOrderId?: string | null;
  billingSubscriptionId?: string | null;
  userId?: string | null;
  workspaceId?: string | null;
  assessmentId?: string | null;
  source?: string | null;
  reviewNotes?: string | null;
}): Prisma.BillingEntitlementGrantUncheckedCreateInput {
  return {
    entitlementKey: params.entitlementKey,
    billingOrderId: normalizeOptionalText(params.billingOrderId),
    billingSubscriptionId: normalizeOptionalText(params.billingSubscriptionId),
    userId: normalizeOptionalText(params.userId),
    workspaceId: normalizeOptionalText(params.workspaceId),
    assessmentId: normalizeOptionalText(params.assessmentId),
    status: "pending_review",
    source: normalizeOptionalText(params.source) ?? "billing_ledger",
    reviewNotes: normalizeOptionalText(params.reviewNotes),
  };
}
