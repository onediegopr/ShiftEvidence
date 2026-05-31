import { createHmac, timingSafeEqual } from "node:crypto";

export function getLemonWebhookSecret() {
  return process.env.LEMON_SQUEEZY_WEBHOOK_SECRET?.trim()
    || process.env.LEMONSQUEEZY_WEBHOOK_SECRET?.trim()
    || null;
}

export function createLemonWebhookSignature(rawBody: string | Buffer, secret: string) {
  return createHmac("sha256", secret).update(rawBody).digest("hex");
}

export function verifyLemonWebhookSignature(params: {
  rawBody: string | Buffer;
  signature: string | null;
  secret: string;
}) {
  const signature = params.signature?.trim() ?? "";
  if (!signature) {
    return false;
  }

  const expected = Buffer.from(createLemonWebhookSignature(params.rawBody, params.secret), "utf8");
  const actual = Buffer.from(signature, "utf8");

  if (expected.length !== actual.length) {
    return false;
  }

  return timingSafeEqual(expected, actual);
}
