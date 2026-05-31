import { createHash } from "node:crypto";
import type { BillingProvider } from "@prisma/client";

function normalizeIdPart(value: string) {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error("Billing idempotency values cannot be empty.");
  }

  return normalized.toLowerCase();
}

export function createBillingEventIdempotencyKey(params: {
  provider: BillingProvider;
  providerEventId: string;
}) {
  return [
    "billing_event",
    normalizeIdPart(params.provider),
    normalizeIdPart(params.providerEventId),
  ].join(":");
}

export function createBillingOrderEventIdempotencyKey(params: {
  provider: BillingProvider;
  providerOrderId: string;
  eventType: string;
}) {
  return [
    "billing_order_event",
    normalizeIdPart(params.provider),
    normalizeIdPart(params.providerOrderId),
    normalizeIdPart(params.eventType),
  ].join(":");
}

export function createBillingSubscriptionPeriodIdempotencyKey(params: {
  provider: BillingProvider;
  providerSubscriptionId: string;
  eventType: string;
  periodStart?: string | Date | null;
  periodEnd?: string | Date | null;
}) {
  const periodStart = normalizeOptionalDatePart(params.periodStart);
  const periodEnd = normalizeOptionalDatePart(params.periodEnd);

  return [
    "billing_subscription_period",
    normalizeIdPart(params.provider),
    normalizeIdPart(params.providerSubscriptionId),
    normalizeIdPart(params.eventType),
    periodStart,
    periodEnd,
  ].join(":");
}

export function createBillingManualIdempotencyKey(params: {
  provider: BillingProvider;
  scope: string;
  externalId: string;
}) {
  return [
    "billing_manual",
    normalizeIdPart(params.provider),
    normalizeIdPart(params.scope),
    normalizeIdPart(params.externalId),
  ].join(":");
}

export function hashBillingPayload(payload: string | Buffer) {
  return createHash("sha256").update(payload).digest("hex");
}

function normalizeOptionalDatePart(value: string | Date | null | undefined) {
  if (!value) {
    return "none";
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return normalizeIdPart(value);
}
