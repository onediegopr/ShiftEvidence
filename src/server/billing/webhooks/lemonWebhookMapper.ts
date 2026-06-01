import type {
  BillingOrderStatus,
  BillingPaymentStatus,
  BillingSubscriptionStatus,
} from "@prisma/client";
import {
  billingPlans,
  type BillingPlanId,
} from "../../../config/billing";

const supportedLemonBusinessEvents = [
  "order_created",
  "order_refunded",
  "subscription_created",
  "subscription_updated",
  "subscription_cancelled",
  "subscription_payment_success",
  "subscription_payment_failed",
] as const;

export type SupportedLemonBusinessEvent = (typeof supportedLemonBusinessEvents)[number];

export type LemonMappedOrder = {
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

export type LemonMappedPayment = {
  providerPaymentId: string | null;
  providerOrderId: string | null;
  amountCents: number | null;
  currency: string;
  status: BillingPaymentStatus;
  paidAt: Date | null;
  refundedAt: Date | null;
  failedAt: Date | null;
};

export type LemonMappedSubscription = {
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

export type LemonBusinessLedgerEvent = {
  providerEventId: string;
  eventType: SupportedLemonBusinessEvent | null;
  resourceType: string | null;
  testMode: boolean | null;
  order: LemonMappedOrder | null;
  payment: LemonMappedPayment | null;
  subscription: LemonMappedSubscription | null;
  warnings: string[];
};

type LemonWebhookPayload = {
  meta?: {
    event_name?: unknown;
    custom_data?: unknown;
  };
  data?: {
    id?: unknown;
    type?: unknown;
    attributes?: Record<string, unknown>;
    relationships?: Record<string, unknown>;
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

function getTextPath(value: unknown, path: readonly string[]) {
  let current: unknown = value;

  for (const segment of path) {
    if (!isRecord(current)) return null;
    current = current[segment];
  }

  return getText(current);
}

function getBoolean(value: unknown) {
  return typeof value === "boolean" ? value : null;
}

function normalizeEmail(value: unknown) {
  return getText(value)?.toLowerCase() ?? null;
}

function normalizeCurrency(value: unknown) {
  return getText(value)?.toUpperCase() ?? "USD";
}

function parseDateValue(value: unknown) {
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

function firstText(...values: unknown[]) {
  for (const value of values) {
    const text = getText(value);
    if (text) return text;
  }

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

function isSupportedEvent(value: string | null): value is SupportedLemonBusinessEvent {
  return supportedLemonBusinessEvents.includes(value as SupportedLemonBusinessEvent);
}

function getCustomData(payload: LemonWebhookPayload) {
  return isRecord(payload.meta?.custom_data) ? payload.meta.custom_data : {};
}

function getRelationshipId(relationships: Record<string, unknown> | undefined, relationshipName: string) {
  return getTextPath(relationships, [relationshipName, "data", "id"]);
}

function getVariantPlanId(variantId: string | null) {
  if (!variantId) return null;

  const matchingPlan = billingPlans.find((plan) => (
    plan.lemonVariantEnvName
      ? process.env[plan.lemonVariantEnvName]?.trim() === variantId
      : false
  ));

  return matchingPlan?.id ?? null;
}

function getPlanId(customData: Record<string, unknown>, variantId: string | null) {
  const customPlanId = getText(customData.plan_id);
  if (customPlanId && billingPlans.some((plan) => plan.id === customPlanId)) {
    return customPlanId as BillingPlanId;
  }

  return getVariantPlanId(variantId);
}

function getProductAndVariant(
  attributes: Record<string, unknown>,
  relationships: Record<string, unknown> | undefined,
) {
  const firstOrderItem = getRecord(attributes, "first_order_item");
  const productId = firstText(
    attributes.product_id,
    firstOrderItem?.product_id,
    getRelationshipId(relationships, "product"),
  );
  const variantId = firstText(
    attributes.variant_id,
    firstOrderItem?.variant_id,
    getRelationshipId(relationships, "variant"),
  );

  return {
    productId,
    variantId,
  };
}

function mapOrderStatus(eventType: SupportedLemonBusinessEvent, attributes: Record<string, unknown>) {
  const rawStatus = getText(attributes.status)?.toLowerCase();

  if (eventType === "order_refunded" || rawStatus === "refunded") return "refunded" as const;
  if (rawStatus === "cancelled" || rawStatus === "canceled") return "cancelled" as const;
  if (rawStatus === "pending") return "pending" as const;
  if (rawStatus === "paid" || eventType === "order_created") return "paid" as const;
  return "pending" as const;
}

function mapPaymentStatus(eventType: SupportedLemonBusinessEvent, attributes: Record<string, unknown>) {
  const rawStatus = getText(attributes.status)?.toLowerCase();

  if (eventType === "order_refunded" || rawStatus === "refunded") return "refunded" as const;
  if (eventType === "subscription_payment_failed" || rawStatus === "failed") return "failed" as const;
  if (eventType === "subscription_payment_success" || rawStatus === "paid" || rawStatus === "successful") {
    return "paid" as const;
  }

  return "pending" as const;
}

function mapSubscriptionStatus(eventType: SupportedLemonBusinessEvent, attributes: Record<string, unknown>) {
  const rawStatus = getText(attributes.status)?.toLowerCase();

  if (eventType === "subscription_cancelled" || rawStatus === "cancelled" || rawStatus === "canceled") {
    return "cancelled" as const;
  }

  if (eventType === "subscription_payment_failed" || rawStatus === "past_due" || rawStatus === "payment_failed") {
    return "payment_failed" as const;
  }

  if (rawStatus === "expired") return "expired" as const;
  return "active" as const;
}

function getCustomerEmail(attributes: Record<string, unknown>) {
  return normalizeEmail(
    firstText(
      attributes.user_email,
      attributes.customer_email,
      attributes.email,
    ),
  );
}

function getProviderPaymentId(
  payload: LemonWebhookPayload,
  eventType: SupportedLemonBusinessEvent,
  attributes: Record<string, unknown>,
  relationships: Record<string, unknown> | undefined,
  resourceType: string | null,
) {
  const directPaymentId = firstText(
    attributes.payment_id,
    attributes.provider_payment_id,
    attributes.invoice_id,
    attributes.subscription_invoice_id,
    getRelationshipId(relationships, "payment"),
    getRelationshipId(relationships, "invoice"),
  );

  if (directPaymentId) return directPaymentId;

  if (
    eventType.startsWith("subscription_payment_") &&
    (resourceType === "subscription-invoices" || resourceType === "subscription-payments")
  ) {
    return getText(payload.data?.id);
  }

  return null;
}

function getProviderSubscriptionId(
  payload: LemonWebhookPayload,
  attributes: Record<string, unknown>,
  relationships: Record<string, unknown> | undefined,
  resourceType: string | null,
) {
  if (resourceType === "subscriptions") return getText(payload.data?.id);

  return firstText(
    attributes.subscription_id,
    attributes.provider_subscription_id,
    getRelationshipId(relationships, "subscription"),
  );
}

function getProviderOrderId(
  payload: LemonWebhookPayload,
  attributes: Record<string, unknown>,
  relationships: Record<string, unknown> | undefined,
  resourceType: string | null,
) {
  if (resourceType === "orders") return getText(payload.data?.id);

  return firstText(
    attributes.order_id,
    attributes.provider_order_id,
    getRelationshipId(relationships, "order"),
  );
}

function buildOrder(params: {
  payload: LemonWebhookPayload;
  eventType: SupportedLemonBusinessEvent;
  attributes: Record<string, unknown>;
  relationships: Record<string, unknown> | undefined;
  resourceType: string | null;
  customData: Record<string, unknown>;
  warnings: string[];
}): LemonMappedOrder | null {
  const providerOrderId = getProviderOrderId(
    params.payload,
    params.attributes,
    params.relationships,
    params.resourceType,
  );
  if (!providerOrderId) return null;

  const { productId, variantId } = getProductAndVariant(params.attributes, params.relationships);
  const planId = getPlanId(params.customData, variantId);
  const amountCents = firstAmountCents(
    params.attributes.total,
    params.attributes.total_usd,
    params.attributes.amount_total,
    params.attributes.amount,
    getRecord(params.attributes, "first_order_item")?.price,
  );

  if (!planId) params.warnings.push("order_missing_plan_id");
  if (amountCents === null) params.warnings.push("order_missing_amount_cents");

  return {
    providerOrderId,
    providerCheckoutId: firstText(params.attributes.checkout_id, getRelationshipId(params.relationships, "checkout")),
    providerCustomerId: firstText(params.attributes.customer_id, getRelationshipId(params.relationships, "customer")),
    productId,
    variantId,
    planId,
    amountCents,
    currency: normalizeCurrency(params.attributes.currency),
    status: mapOrderStatus(params.eventType, params.attributes),
    customerEmail: getCustomerEmail(params.attributes),
    paidAt: firstDate(params.attributes.paid_at, params.attributes.created_at),
    refundedAt: firstDate(params.attributes.refunded_at),
    cancelledAt: firstDate(params.attributes.cancelled_at),
    providerCreatedAt: firstDate(params.attributes.created_at),
  };
}

function buildPayment(params: {
  payload: LemonWebhookPayload;
  eventType: SupportedLemonBusinessEvent;
  attributes: Record<string, unknown>;
  relationships: Record<string, unknown> | undefined;
  resourceType: string | null;
  order: LemonMappedOrder | null;
  warnings: string[];
}): LemonMappedPayment | null {
  const providerPaymentId = getProviderPaymentId(
    params.payload,
    params.eventType,
    params.attributes,
    params.relationships,
    params.resourceType,
  );
  const providerOrderId = params.order?.providerOrderId ?? getProviderOrderId(
    params.payload,
    params.attributes,
    params.relationships,
    params.resourceType,
  );

  if (!providerPaymentId) {
    if (params.eventType === "subscription_payment_success" || params.eventType === "subscription_payment_failed") {
      params.warnings.push("payment_missing_provider_payment_id");
    }
    return null;
  }

  if (!providerOrderId) {
    params.warnings.push("payment_missing_provider_order_id");
  }

  return {
    providerPaymentId,
    providerOrderId,
    amountCents: firstAmountCents(
      params.attributes.total,
      params.attributes.total_usd,
      params.attributes.amount_total,
      params.attributes.amount,
      params.order?.amountCents,
    ),
    currency: normalizeCurrency(params.attributes.currency),
    status: mapPaymentStatus(params.eventType, params.attributes),
    paidAt: firstDate(params.attributes.paid_at, params.attributes.created_at),
    refundedAt: firstDate(params.attributes.refunded_at),
    failedAt: firstDate(params.attributes.failed_at),
  };
}

function buildSubscription(params: {
  payload: LemonWebhookPayload;
  eventType: SupportedLemonBusinessEvent;
  attributes: Record<string, unknown>;
  relationships: Record<string, unknown> | undefined;
  resourceType: string | null;
  customData: Record<string, unknown>;
  warnings: string[];
}): LemonMappedSubscription | null {
  const providerSubscriptionId = getProviderSubscriptionId(
    params.payload,
    params.attributes,
    params.relationships,
    params.resourceType,
  );
  if (!providerSubscriptionId) return null;

  const { productId, variantId } = getProductAndVariant(params.attributes, params.relationships);
  const planId = getPlanId(params.customData, variantId);

  if (!planId) params.warnings.push("subscription_missing_plan_id");

  return {
    providerSubscriptionId,
    providerCustomerId: firstText(params.attributes.customer_id, getRelationshipId(params.relationships, "customer")),
    planId,
    productId,
    variantId,
    status: mapSubscriptionStatus(params.eventType, params.attributes),
    customerEmail: getCustomerEmail(params.attributes),
    currentPeriodStart: firstDate(params.attributes.created_at, params.attributes.starts_at),
    currentPeriodEnd: firstDate(params.attributes.renews_at, params.attributes.ends_at),
    cancelledAt: firstDate(params.attributes.cancelled_at, params.attributes.ends_at),
    expiredAt: firstDate(params.attributes.expired_at, params.attributes.ends_at),
    paymentFailedAt: params.eventType === "subscription_payment_failed"
      ? firstDate(params.attributes.failed_at, params.attributes.updated_at, params.attributes.created_at)
      : null,
    providerCreatedAt: firstDate(params.attributes.created_at),
  };
}

export function mapLemonWebhookPayloadToBusinessLedger(
  rawBody: string,
  eventNameHeader: string | null = null,
): LemonBusinessLedgerEvent {
  const payload = JSON.parse(rawBody) as LemonWebhookPayload;
  const eventTypeText = getText(payload.meta?.event_name) ?? getText(eventNameHeader);
  const providerEventId = getText(payload.data?.id);

  if (!providerEventId) {
    throw new Error("Cannot map Lemon billing event without data.id.");
  }

  if (!isSupportedEvent(eventTypeText)) {
    return {
      providerEventId,
      eventType: null,
      resourceType: getText(payload.data?.type),
      testMode: null,
      order: null,
      payment: null,
      subscription: null,
      warnings: eventTypeText ? [`unsupported_event:${eventTypeText}`] : ["unsupported_event:missing"],
    };
  }

  const attributes = payload.data?.attributes ?? {};
  const relationships = payload.data?.relationships;
  const resourceType = getText(payload.data?.type);
  const customData = getCustomData(payload);
  const firstOrderItem = getRecord(attributes, "first_order_item");
  const warnings: string[] = [];
  const order = buildOrder({
    payload,
    eventType: eventTypeText,
    attributes,
    relationships,
    resourceType,
    customData,
    warnings,
  });
  const subscription = buildSubscription({
    payload,
    eventType: eventTypeText,
    attributes,
    relationships,
    resourceType,
    customData,
    warnings,
  });
  const payment = buildPayment({
    payload,
    eventType: eventTypeText,
    attributes,
    relationships,
    resourceType,
    order,
    warnings,
  });

  return {
    providerEventId,
    eventType: eventTypeText,
    resourceType,
    testMode: getBoolean(attributes.test_mode) ?? getBoolean(firstOrderItem?.test_mode),
    order,
    payment,
    subscription,
    warnings,
  };
}

export function getSupportedLemonBusinessEvents() {
  return [...supportedLemonBusinessEvents];
}
