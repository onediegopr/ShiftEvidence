import type { BillingPlanConfig } from "../../config/billing";
import { normalizeCheckoutOrigin } from "./checkoutOrigin";

const STRIPE_CHECKOUT_SESSIONS_API_URL = "https://api.stripe.com/v1/checkout/sessions";

type StripeCheckoutApiResponse = {
  id?: string;
  livemode?: boolean;
  url?: string | null;
};

export type StripeCheckoutResult =
  | {
      ok: true;
      checkoutId: string | null;
      testMode: boolean;
      url: string;
    }
  | {
      ok: false;
      reason:
        | "not_eligible"
        | "checkout_disabled"
        | "not_configured"
        | "invalid_price"
        | "live_not_approved"
        | "stripe_api_error";
      detail: string;
      statusCode?: number;
    };

function readEnv(name: string) {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

export function readStripeSecretKey() {
  return readEnv("STRIPE_SECRET_KEY");
}

export function getStripeCheckoutMode() {
  return readEnv("STRIPE_CHECKOUT_MODE") === "live" ? "live" : "test";
}

function parseEnvBoolean(value: string | null) {
  const normalized = value?.trim().replace(/^["']|["']$/g, "").toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes";
}

export function isStripeLivePaymentsApproved() {
  return parseEnvBoolean(readEnv("STRIPE_LIVE_PAYMENTS_APPROVED"));
}

function isStripeCheckoutDisabled() {
  return readEnv("STRIPE_CHECKOUT_ENABLED") === "false";
}

function getPlanStripePriceId(plan: BillingPlanConfig) {
  return plan.stripePriceEnvName ? readEnv(plan.stripePriceEnvName) : null;
}

function appendFormValue(body: URLSearchParams, key: string, value: string | number) {
  body.append(key, String(value));
}

export async function createStripeCheckoutSession(
  plan: BillingPlanConfig,
  origin: string,
): Promise<StripeCheckoutResult> {
  if (!plan.checkoutEligible || !plan.checkoutSlug) {
    return {
      ok: false,
      reason: "not_eligible",
      detail: "This plan is invoice-only and does not support card checkout.",
    };
  }

  if (isStripeCheckoutDisabled()) {
    return {
      ok: false,
      reason: "checkout_disabled",
      detail: "Stripe checkout is disabled by runtime configuration.",
    };
  }

  const checkoutMode = getStripeCheckoutMode();
  if (checkoutMode === "live" && !isStripeLivePaymentsApproved()) {
    return {
      ok: false,
      reason: "live_not_approved",
      detail: "Stripe live checkout is not approved in this milestone.",
    };
  }

  const secretKey = readStripeSecretKey();
  const priceId = getPlanStripePriceId(plan);
  const redirectOrigin = normalizeCheckoutOrigin(origin);

  if (!secretKey || !priceId || !redirectOrigin) {
    return {
      ok: false,
      reason: "not_configured",
      detail: "Stripe checkout is missing secret key, price ID, or request origin configuration.",
    };
  }

  if (!priceId.startsWith("price_")) {
    return {
      ok: false,
      reason: "invalid_price",
      detail: "The configured Stripe Price ID must start with price_.",
    };
  }

  const body = new URLSearchParams();
  appendFormValue(body, "mode", plan.cadence === "monthly" ? "subscription" : "payment");
  appendFormValue(body, "line_items[0][price]", priceId);
  appendFormValue(body, "line_items[0][quantity]", 1);
  appendFormValue(body, "success_url", `${redirectOrigin}/billing/checkout/${plan.checkoutSlug}?status=success`);
  appendFormValue(body, "cancel_url", `${redirectOrigin}/billing/checkout/${plan.checkoutSlug}?status=cancelled`);
  appendFormValue(body, "metadata[provider]", "stripe");
  appendFormValue(body, "metadata[plan_id]", plan.id);
  appendFormValue(body, "metadata[plan_slug]", plan.checkoutSlug);
  appendFormValue(body, "metadata[source]", "shift_evidence_public_checkout");
  appendFormValue(body, "allow_promotion_codes", "true");

  const response = await fetch(STRIPE_CHECKOUT_SESSIONS_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
  });

  if (!response.ok) {
    return {
      ok: false,
      reason: "stripe_api_error",
      detail: `Stripe returned ${response.status}.`,
      statusCode: response.status,
    };
  }

  const payload = (await response.json()) as StripeCheckoutApiResponse;

  if (!payload.url) {
    return {
      ok: false,
      reason: "stripe_api_error",
      detail: "Stripe did not return a checkout URL.",
    };
  }

  return {
    ok: true,
    checkoutId: payload.id ?? null,
    testMode: payload.livemode === false,
    url: payload.url,
  };
}
