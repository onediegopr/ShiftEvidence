import type { Prisma } from "@prisma/client";

type LemonWebhookPayload = {
  meta?: {
    event_name?: unknown;
    custom_data?: unknown;
  };
  data?: {
    id?: unknown;
    type?: unknown;
    attributes?: Record<string, unknown>;
  };
};

export type ParsedLemonWebhookEvent = {
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

function getBooleanProperty(value: unknown, key: string) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  const record = value as Record<string, unknown>;
  return typeof record[key] === "boolean" ? record[key] : undefined;
}

export function parseLemonWebhookEvent(rawBody: string, eventNameHeader: string | null): ParsedLemonWebhookEvent {
  let payload: LemonWebhookPayload;

  try {
    payload = JSON.parse(rawBody) as LemonWebhookPayload;
  } catch {
    throw new Error("Invalid Lemon webhook JSON.");
  }

  const providerEventId = normalizeRequiredText(payload.data?.id);
  const eventType = normalizeRequiredText(payload.meta?.event_name) ?? normalizeRequiredText(eventNameHeader);

  if (!providerEventId) {
    throw new Error("Lemon webhook payload is missing data.id.");
  }

  if (!eventType) {
    throw new Error("Lemon webhook payload is missing event name.");
  }

  const attributes = payload.data?.attributes ?? {};
  const firstOrderItemTestMode = getBooleanProperty(attributes.first_order_item, "test_mode");

  return {
    providerEventId,
    eventType,
    safePayloadJson: {
      provider: "lemon_squeezy",
      providerEventId,
      eventType,
      resourceType: normalizeRequiredText(payload.data?.type),
      testMode: typeof attributes.test_mode === "boolean" ? attributes.test_mode : firstOrderItemTestMode,
      customData: safeJsonObject(payload.meta?.custom_data),
    },
  };
}
