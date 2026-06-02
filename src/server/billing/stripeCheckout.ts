import type { BillingPlanConfig } from "../../config/billing";
import { normalizeCheckoutOrigin } from "./checkoutOrigin";

const STRIPE_CHECKOUT_SESSIONS_API_URL = "https://api.stripe.com/v1/checkout/sessions";
const STRIPE_CHECKOUT_REQUEST_TIMEOUT_MS = 15000;

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
        | "stripe_key_mode_mismatch"
        | "stripe_api_error"
        | "stripe_auth_error"
        | "stripe_price_invalid"
        | "stripe_runtime_error"
        | "stripe_timeout";
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

export function getStripeSecretKeyMode(secretKey = readStripeSecretKey()) {
  const normalized = secretKey?.trim().replace(/^["']|["']$/g, "");
  if (normalized?.startsWith("sk_live_")) return "live" as const;
  if (normalized?.startsWith("sk_test_")) return "test" as const;
  if (normalized?.startsWith("rk_live_")) return "restricted_live" as const;
  return "unknown" as const;
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

function isAbortError(error: unknown) {
  return error instanceof DOMException
    ? error.name === "AbortError"
    : typeof error === "object" && error !== null && "name" in error && error.name === "AbortError";
}

function logStripeCheckoutFailure(params: {
  planId: string;
  reason: Exclude<StripeCheckoutResult, { ok: true }>["reason"];
  statusCode?: number;
}) {
  console.warn("stripe_checkout_failure", {
    planId: params.planId,
    reason: params.reason,
    statusCode: params.statusCode ?? null,
  });
}

async function mapStripeErrorResponse(
  response: Response,
): Promise<Pick<Exclude<StripeCheckoutResult, { ok: true }>, "reason" | "detail" | "statusCode">> {
  if (response.status === 401 || response.status === 403) {
    return {
      reason: "stripe_auth_error",
      detail: "Stripe authentication failed with the configured server-side key.",
      statusCode: response.status,
    };
  }

  let stripeErrorCode: string | null = null;
  let stripeErrorParam: string | null = null;
  try {
    const payload = await response.clone().json() as { error?: { code?: string; param?: string; type?: string } };
    stripeErrorCode = payload.error?.code ?? null;
    stripeErrorParam = payload.error?.param ?? null;
  } catch {
    // Raw Stripe error bodies are intentionally ignored in safe user-facing responses.
  }

  if (
    response.status === 404 ||
    stripeErrorCode === "resource_missing" ||
    stripeErrorParam?.includes("price")
  ) {
    return {
      reason: "stripe_price_invalid",
      detail: "Stripe could not use the configured Price ID.",
      statusCode: response.status,
    };
  }

  return {
    reason: "stripe_runtime_error",
    detail: `Stripe checkout failed with a safe runtime error code ${response.status}.`,
    statusCode: response.status,
  };
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

  const secretKeyMode = getStripeSecretKeyMode(secretKey);
  const secretKeyModeMismatch =
    (checkoutMode === "live" && secretKeyMode !== "live") ||
    (checkoutMode === "test" && secretKeyMode !== "test");
  if (secretKeyModeMismatch) {
    return {
      ok: false,
      reason: "stripe_key_mode_mismatch",
      detail: "Stripe checkout mode does not match the configured secret key mode.",
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

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), STRIPE_CHECKOUT_REQUEST_TIMEOUT_MS);
  let response: Response;

  try {
    response = await fetch(STRIPE_CHECKOUT_SESSIONS_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
      cache: "no-store",
      signal: controller.signal,
    });
  } catch (error) {
    const reason = isAbortError(error) ? "stripe_timeout" : "stripe_runtime_error";
    logStripeCheckoutFailure({ planId: plan.id, reason });
    return {
      ok: false,
      reason,
      detail: reason === "stripe_timeout"
        ? "Stripe Checkout session creation timed out before a hosted checkout URL was returned."
        : "Stripe Checkout session creation failed before a hosted checkout URL was returned.",
    };
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const mapped = await mapStripeErrorResponse(response);
    logStripeCheckoutFailure({ planId: plan.id, reason: mapped.reason, statusCode: mapped.statusCode });
    return {
      ok: false,
      ...mapped,
    };
  }

  let payload: StripeCheckoutApiResponse;
  try {
    payload = (await response.json()) as StripeCheckoutApiResponse;
  } catch {
    logStripeCheckoutFailure({ planId: plan.id, reason: "stripe_runtime_error" });
    return {
      ok: false,
      reason: "stripe_runtime_error",
      detail: "Stripe returned a response that could not be parsed safely.",
    };
  }

  if (!payload.url) {
    logStripeCheckoutFailure({ planId: plan.id, reason: "stripe_runtime_error" });
    return {
      ok: false,
      reason: "stripe_runtime_error",
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
