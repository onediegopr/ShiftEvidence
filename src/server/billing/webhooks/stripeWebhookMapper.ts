import type {
  BillingOrderStatus,
  BillingPaymentStatus,
  BillingSubscriptionStatus,
} from "@prisma/client";
import {
  billingPlans,
  getBillingPlanByCheckoutSlug,
  type BillingPlanId,
} from "../../../config/billing";

const supportedStripeBusinessEvents = [
  "checkout.session.completed",
  "invoice.paid",
  "invoice.payment_failed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
] as const;

export type SupportedStripeBusinessEvent = (typeof supportedStripeBusinessEvents)[number];

export type StripeMappedOrder = {
  providerOrderId: string;
  providerCheckoutId: string | null;
  providerCustomerId: string | null;
  productId: string | null;
  variantId: string | null;
  planId: BillingPlanId | null;
  amountCents: number | null;
  currency: string;
  status: BillingOrderStatus;
  customerEmail: string | null;
  paidAt: Date | null;
  refundedAt: Date | null;
  cancelledAt: Date | null;
  providerCreatedAt: Date | null;
};

export type StripeMappedPayment = {
  providerPaymentId: string | null;
  providerOrderId: string | null;
  amountCents: number | null;
  currency: string;
  status: BillingPaymentStatus;
  paidAt: Date | null;
  refundedAt: Date | null;
  failedAt: Date | null;
};

export type StripeMappedSubscription = {
  providerSubscriptionId: string;
  providerCustomerId: string | null;
  planId: BillingPlanId | null;
  productId: string | null;
  variantId: string | null;
  status: BillingSubscriptionStatus;
  customerEmail: string | null;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  cancelledAt: Date | null;
  expiredAt: Date | null;
  paymentFailedAt: Date | null;
  providerCreatedAt: Date | null;
};

export type StripeBusinessLedgerEvent = {
  providerEventId: string;
  eventType: SupportedStripeBusinessEvent | null;
  resourceType: string | null;
  liveMode: boolean;
  order: StripeMappedOrder | null;
  payment: StripeMappedPayment | null;
  subscription: StripeMappedSubscription | null;
  warnings: string[];
};

type StripeWebhookPayload = {
  id?: unknown;
  type?: unknown;
  livemode?: unknown;
  created?: unknown;
  data?: {
    object?: Record<string, unknown>;
  };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getRecord(value: unknown, key: string) {
  if (!isRecord(value)) return null;
  const next = value[key];
  return isRecord(next) ? next : null;
}

function getText(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getBoolean(value: unknown) {
  return typeof value === "boolean" ? value : null;
}

function getTextPath(value: unknown, path: readonly string[]) {
  let current: unknown = value;

  for (const segment of path) {
    if (!isRecord(current)) return null;
    current = current[segment];
  }

  return getText(current);
}

function getRecordPath(value: unknown, path: readonly string[]) {
  let current: unknown = value;

  for (const segment of path) {
    if (!isRecord(current)) return null;
    current = current[segment];
  }

  return isRecord(current) ? current : null;
}

function getFirstArrayRecord(value: unknown, key: string) {
  const container = getRecord(value, key);
  const data = container?.data;
  return Array.isArray(data) && isRecord(data[0]) ? data[0] : null;
}

function firstText(...values: unknown[]) {
  for (const value of values) {
    const text = getText(value);
    if (text) return text;
  }

  return null;
}

function normalizeEmail(value: unknown) {
  return getText(value)?.toLowerCase() ?? null;
}

function normalizeCurrency(value: unknown) {
  return getText(value)?.toUpperCase() ?? "USD";
}

function parseDateValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    const date = new Date(value * 1000);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const raw = getText(value);
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseAmountCents(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Number.isInteger(value) ? value : Math.round(value * 100);
  }

  const text = getText(value);
  if (!text) return null;
  const normalized = text.replace(/[$,\s]/g, "");
  if (/^\d+$/.test(normalized)) return Number(normalized);
  if (/^\d+\.\d{1,2}$/.test(normalized)) return Math.round(Number(normalized) * 100);
  return null;
}

function firstDate(...values: unknown[]) {
  for (const value of values) {
    const date = parseDateValue(value);
    if (date) return date;
  }

  return null;
}

function firstAmountCents(...values: unknown[]) {
  for (const value of values) {
    const amount = parseAmountCents(value);
    if (amount !== null) return amount;
  }

  return null;
}

function isSupportedEvent(value: string | null): value is SupportedStripeBusinessEvent {
  return supportedStripeBusinessEvents.includes(value as SupportedStripeBusinessEvent);
}

function getMetadata(resource: Record<string, unknown>) {
  return isRecord(resource.metadata) ? resource.metadata : {};
}

function getStripePricePlanId(priceId: string | null) {
  if (!priceId) return null;

  const matchingPlan = billingPlans.find((plan) => (
    plan.stripePriceEnvName
      ? process.env[plan.stripePriceEnvName]?.trim() === priceId
      : false
  ));

  return matchingPlan?.id ?? null;
}

function getPlanId(metadata: Record<string, unknown>, priceId: string | null) {
  const metadataPlanId = getText(metadata.plan_id);
  if (metadataPlanId && billingPlans.some((plan) => plan.id === metadataPlanId)) {
    return metadataPlanId as BillingPlanId;
  }

  const metadataSlug = getText(metadata.plan_slug);
  if (metadataSlug) {
    const plan = getBillingPlanByCheckoutSlug(metadataSlug);
    if (plan) return plan.id;
  }

  return getStripePricePlanId(priceId);
}

function getLineItem(resource: Record<string, unknown>) {
  return (
    getFirstArrayRecord(resource, "line_items") ??
    getFirstArrayRecord(resource, "lines") ??
    getFirstArrayRecord(resource, "items")
  );
}

function getPriceRecord(resource: Record<string, unknown>) {
  const lineItem = getLineItem(resource);
  return (
    getRecord(lineItem, "price") ??
    getRecord(resource, "price") ??
    getRecordPath(resource, ["plan"])
  );
}

function getPriceId(resource: Record<string, unknown>, metadata: Record<string, unknown>) {
  const price = getPriceRecord(resource);
  return firstText(
    metadata.price_id,
    metadata.stripe_price_id,
    price?.id,
    getTextPath(resource, ["pricing", "price_details", "price"]),
  );
}

function getProductId(resource: Record<string, unknown>) {
  const price = getPriceRecord(resource);
  return firstText(
    price?.product,
    getTextPath(resource, ["plan", "product"]),
  );
}

function getCustomerEmail(resource: Record<string, unknown>) {
  return normalizeEmail(
    firstText(
      resource.customer_email,
      getTextPath(resource, ["customer_details", "email"]),
      getTextPath(resource, ["customer", "email"]),
      resource.receipt_email,
    ),
  );
}

function mapOrderStatus(resource: Record<string, unknown>) {
  const paymentStatus = getText(resource.payment_status)?.toLowerCase();
  const status = getText(resource.status)?.toLowerCase();

  if (status === "expired" || status === "canceled" || status === "cancelled") return "cancelled" as const;
  if (paymentStatus === "paid" || status === "complete") return "paid" as const;
  return "pending" as const;
}

function mapPaymentStatus(eventType: SupportedStripeBusinessEvent, resource: Record<string, unknown>) {
  const paymentStatus = getText(resource.payment_status)?.toLowerCase();
  const status = getText(resource.status)?.toLowerCase();
  const paid = getBoolean(resource.paid);

  if (eventType === "invoice.payment_failed" || status === "failed") return "failed" as const;
  if (eventType === "invoice.paid" || paymentStatus === "paid" || status === "succeeded" || paid === true) {
    return "paid" as const;
  }
  return "pending" as const;
}

function mapSubscriptionStatus(eventType: SupportedStripeBusinessEvent, resource: Record<string, unknown>) {
  const status = getText(resource.status)?.toLowerCase();

  if (eventType === "customer.subscription.deleted" || status === "canceled" || status === "cancelled") {
    return "cancelled" as const;
  }
  if (status === "incomplete_expired" || status === "expired") return "expired" as const;
  if (
    eventType === "invoice.payment_failed" ||
    status === "past_due" ||
    status === "unpaid" ||
    status === "incomplete"
  ) {
    return "payment_failed" as const;
  }
  return "active" as const;
}

function getProviderSubscriptionId(resource: Record<string, unknown>, resourceType: string | null) {
  if (resourceType === "subscription") return getText(resource.id);

  return firstText(
    resource.subscription,
    getTextPath(resource, ["parent", "subscription_details", "subscription"]),
    getTextPath(resource, ["subscription_details", "subscription"]),
  );
}

function buildOrder(params: {
  eventType: SupportedStripeBusinessEvent;
  resource: Record<string, unknown>;
  resourceType: string | null;
  metadata: Record<string, unknown>;
  warnings: string[];
}): StripeMappedOrder | null {
  if (params.eventType !== "checkout.session.completed" || params.resourceType !== "checkout.session") {
    return null;
  }

  const providerOrderId = getText(params.resource.id);
  if (!providerOrderId) {
    params.warnings.push("order_skipped_missing_checkout_session_id");
    return null;
  }

  const priceId = getPriceId(params.resource, params.metadata);
  const planId = getPlanId(params.metadata, priceId);
  const amountCents = firstAmountCents(params.resource.amount_total, params.resource.amount_subtotal);

  if (!planId) params.warnings.push("order_missing_plan_id");
  if (amountCents === null) params.warnings.push("order_missing_amount_cents");

  return {
    providerOrderId,
    providerCheckoutId: providerOrderId,
    providerCustomerId: firstText(params.resource.customer, getTextPath(params.resource, ["customer", "id"])),
    productId: getProductId(params.resource),
    variantId: priceId,
    planId,
    amountCents,
    currency: normalizeCurrency(params.resource.currency),
    status: mapOrderStatus(params.resource),
    customerEmail: getCustomerEmail(params.resource),
    paidAt: mapOrderStatus(params.resource) === "paid" ? firstDate(params.resource.created) : null,
    refundedAt: null,
    cancelledAt: mapOrderStatus(params.resource) === "cancelled" ? firstDate(params.resource.created) : null,
    providerCreatedAt: firstDate(params.resource.created),
  };
}

function buildPayment(params: {
  eventType: SupportedStripeBusinessEvent;
  resource: Record<string, unknown>;
  resourceType: string | null;
  order: StripeMappedOrder | null;
  warnings: string[];
}): StripeMappedPayment | null {
  const providerPaymentId = firstText(
    params.resource.payment_intent,
    getTextPath(params.resource, ["payment_intent", "id"]),
    params.eventType === "invoice.paid" ? params.resource.id : null,
  );
  const providerOrderId = params.order?.providerOrderId ?? firstText(
    getTextPath(params.resource, ["metadata", "checkout_session_id"]),
    getTextPath(params.resource, ["metadata", "provider_order_id"]),
  );

  if (!providerPaymentId) {
    if (params.eventType === "checkout.session.completed" || params.eventType.startsWith("invoice.")) {
      params.warnings.push("payment_skipped_missing_provider_payment_id");
    }
    return null;
  }

  if (!providerOrderId) {
    params.warnings.push("payment_skipped_missing_order");
  }

  return {
    providerPaymentId,
    providerOrderId,
    amountCents: firstAmountCents(
      params.resource.amount_total,
      params.resource.amount_paid,
      params.resource.amount_due,
      params.order?.amountCents,
    ),
    currency: normalizeCurrency(params.resource.currency),
    status: mapPaymentStatus(params.eventType, params.resource),
    paidAt: mapPaymentStatus(params.eventType, params.resource) === "paid" ? firstDate(params.resource.created) : null,
    refundedAt: null,
    failedAt: mapPaymentStatus(params.eventType, params.resource) === "failed" ? firstDate(params.resource.created) : null,
  };
}

function buildSubscription(params: {
  eventType: SupportedStripeBusinessEvent;
  resource: Record<string, unknown>;
  resourceType: string | null;
  metadata: Record<string, unknown>;
  order: StripeMappedOrder | null;
  warnings: string[];
}): StripeMappedSubscription | null {
  const providerSubscriptionId = getProviderSubscriptionId(params.resource, params.resourceType);
  if (!providerSubscriptionId) return null;

  const priceId = getPriceId(params.resource, params.metadata);
  const planId = params.order?.planId ?? getPlanId(params.metadata, priceId);
  if (!planId) params.warnings.push("subscription_missing_plan_id");

  return {
    providerSubscriptionId,
    providerCustomerId: firstText(params.resource.customer, getTextPath(params.resource, ["customer", "id"])),
    planId,
    productId: getProductId(params.resource),
    variantId: priceId,
    status: mapSubscriptionStatus(params.eventType, params.resource),
    customerEmail: params.order?.customerEmail ?? getCustomerEmail(params.resource),
    currentPeriodStart: firstDate(params.resource.current_period_start),
    currentPeriodEnd: firstDate(params.resource.current_period_end, params.resource.period_end),
    cancelledAt: firstDate(params.resource.canceled_at, params.resource.cancelled_at),
    expiredAt: mapSubscriptionStatus(params.eventType, params.resource) === "expired" ? firstDate(params.resource.ended_at) : null,
    paymentFailedAt: mapSubscriptionStatus(params.eventType, params.resource) === "payment_failed"
      ? firstDate(params.resource.created)
      : null,
    providerCreatedAt: firstDate(params.resource.created),
  };
}

export function mapStripeWebhookPayloadToBusinessLedger(rawBody: string): StripeBusinessLedgerEvent {
  const payload = JSON.parse(rawBody) as StripeWebhookPayload;
  const providerEventId = getText(payload.id);
  const eventTypeText = getText(payload.type);
  const resource = payload.data?.object;

  if (!providerEventId) {
    throw new Error("Cannot map Stripe billing event without id.");
  }

  if (!isRecord(resource)) {
    throw new Error("Cannot map Stripe billing event without data.object.");
  }

  const resourceType = getText(resource.object);
  if (!isSupportedEvent(eventTypeText)) {
    return {
      providerEventId,
      eventType: null,
      resourceType,
      liveMode: payload.livemode === true,
      order: null,
      payment: null,
      subscription: null,
      warnings: eventTypeText ? [`unsupported_event:${eventTypeText}`] : ["unsupported_event:missing"],
    };
  }

  const metadata = getMetadata(resource);
  const warnings: string[] = [];
  const order = buildOrder({
    eventType: eventTypeText,
    resource,
    resourceType,
    metadata,
    warnings,
  });
  const subscription = buildSubscription({
    eventType: eventTypeText,
    resource,
    resourceType,
    metadata,
    order,
    warnings,
  });
  const payment = buildPayment({
    eventType: eventTypeText,
    resource,
    resourceType,
    order,
    warnings,
  });

  return {
    providerEventId,
    eventType: eventTypeText,
    resourceType,
    liveMode: payload.livemode === true,
    order,
    payment,
    subscription,
    warnings,
  };
}

export function getSupportedStripeBusinessEvents() {
  return [...supportedStripeBusinessEvents];
}
