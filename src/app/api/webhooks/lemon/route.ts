import { NextResponse, type NextRequest } from "next/server";
import { parseLemonWebhookEvent } from "../../../../server/billing/webhooks/lemonWebhookEvent";
import { persistLemonWebhookEvent } from "../../../../server/billing/webhooks/lemonWebhookPersistence";
import {
  getLemonWebhookSecret,
  verifyLemonWebhookSignature,
} from "../../../../server/billing/webhooks/lemonWebhookSignature";

export async function POST(request: NextRequest) {
  const secret = getLemonWebhookSecret();
  if (!secret) {
    return NextResponse.json({ ok: false, error: "webhook_not_configured" }, { status: 503 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-signature");

  if (!rawBody || !verifyLemonWebhookSignature({ rawBody, signature, secret })) {
    return NextResponse.json({ ok: false, error: "invalid_signature" }, { status: 401 });
  }

  let event;
  try {
    event = parseLemonWebhookEvent(rawBody, request.headers.get("x-event-name"));
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  try {
    const result = await persistLemonWebhookEvent({
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
