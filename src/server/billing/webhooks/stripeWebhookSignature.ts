import { createHmac, timingSafeEqual } from "node:crypto";

export function getStripeWebhookSecret() {
  return process.env.STRIPE_WEBHOOK_SECRET?.trim() || null;
}

export function createStripeWebhookSignature(params: {
  rawBody: string | Buffer;
  secret: string;
  timestamp: string | number;
}) {
  return createHmac("sha256", params.secret)
    .update(`${params.timestamp}.${params.rawBody.toString()}`)
    .digest("hex");
}

function parseStripeSignatureHeader(signatureHeader: string | null) {
  const parts = signatureHeader?.split(",").map((part) => part.trim()) ?? [];
  const timestamp = parts.find((part) => part.startsWith("t="))?.slice(2) ?? null;
  const signatures = parts
    .filter((part) => part.startsWith("v1="))
    .map((part) => part.slice(3))
    .filter(Boolean);

  return { timestamp, signatures };
}

function safeCompareHex(expectedHex: string, actualHex: string) {
  const expected = Buffer.from(expectedHex, "hex");
  const actual = Buffer.from(actualHex, "hex");

  if (expected.length === 0 || expected.length !== actual.length) {
    return false;
  }

  return timingSafeEqual(expected, actual);
}

export function verifyStripeWebhookSignature(params: {
  rawBody: string | Buffer;
  signatureHeader: string | null;
  secret: string;
}) {
  const { timestamp, signatures } = parseStripeSignatureHeader(params.signatureHeader);

  if (!timestamp || signatures.length === 0) {
    return false;
  }

  const expected = createStripeWebhookSignature({
    rawBody: params.rawBody,
    secret: params.secret,
    timestamp,
  });

  return signatures.some((signature) => safeCompareHex(expected, signature));
}
