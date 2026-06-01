import { NextResponse, type NextRequest } from "next/server";
import { parseStripeWebhookEvent } from "../../../../server/billing/webhooks/stripeWebhookEvent";
import { persistStripeWebhookEvent } from "../../../../server/billing/webhooks/stripeWebhookPersistence";
import {
  getStripeWebhookSecret,
  verifyStripeWebhookSignature,
} from "../../../../server/billing/webhooks/stripeWebhookSignature";

export async function POST(request: NextRequest) {
  const secret = getStripeWebhookSecret();
  if (!secret) {
    return NextResponse.json({ ok: false, error: "webhook_not_configured" }, { status: 503 });
  }

  const rawBody = await request.text();
  const signatureHeader = request.headers.get("stripe-signature");

  if (!rawBody || !verifyStripeWebhookSignature({ rawBody, signatureHeader, secret })) {
    return NextResponse.json({ ok: false, error: "invalid_signature" }, { status: 401 });
  }

  let event;
  try {
    event = parseStripeWebhookEvent(rawBody);
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  try {
    const result = await persistStripeWebhookEvent({
      event,
      rawBody,
    });

    return NextResponse.json({
      ok: true,
      outcome: result.outcome,
      billingEventId: result.billingEvent.id,
    });
  } catch {
    return NextResponse.json({ ok: false, error: "event_persistence_failed" }, { status: 500 });
  }
}
