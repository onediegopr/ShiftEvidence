import type { Prisma } from "@prisma/client";

type StripeWebhookPayload = {
  id?: unknown;
  type?: unknown;
  livemode?: unknown;
  data?: {
    object?: Record<string, unknown>;
  };
};

export type ParsedStripeWebhookEvent = {
  providerEventId: string;
  eventType: string;
  safePayloadJson: Prisma.InputJsonValue;
};

function normalizeRequiredText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function safeJsonObject(value: unknown): Prisma.InputJsonValue | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  return value as Prisma.InputJsonObject;
}

export function parseStripeWebhookEvent(rawBody: string): ParsedStripeWebhookEvent {
  let payload: StripeWebhookPayload;

  try {
    payload = JSON.parse(rawBody) as StripeWebhookPayload;
  } catch {
    throw new Error("Invalid Stripe webhook JSON.");
  }

  const providerEventId = normalizeRequiredText(payload.id);
  const eventType = normalizeRequiredText(payload.type);

  if (!providerEventId) {
    throw new Error("Stripe webhook payload is missing id.");
  }

  if (!eventType) {
    throw new Error("Stripe webhook payload is missing type.");
  }

  const resource = payload.data?.object;

  return {
    providerEventId,
    eventType,
    safePayloadJson: {
      provider: "stripe",
      providerEventId,
      eventType,
      liveMode: payload.livemode === true,
      resourceType: normalizeRequiredText(resource?.object),
      resourceId: normalizeRequiredText(resource?.id),
      metadata: safeJsonObject(resource?.metadata),
    },
  };
}
