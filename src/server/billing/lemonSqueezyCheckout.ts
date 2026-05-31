import type { BillingPlanConfig } from "../../config/billing";
import { normalizeCheckoutOrigin } from "./checkoutOrigin";

const LEMON_SQUEEZY_CHECKOUTS_API_URL = "https://api.lemonsqueezy.com/v1/checkouts";

type LemonCheckoutApiResponse = {
  data?: {
    id?: string;
    attributes?: {
      url?: string;
      test_mode?: boolean;
    };
  };
};

export type LemonCheckoutResult =
  | {
      ok: true;
      checkoutId: string | null;
      testMode: boolean;
      url: string;
    }
  | {
      ok: false;
      reason: "not_eligible" | "checkout_disabled" | "not_configured" | "invalid_variant" | "lemon_api_error";
      detail: string;
      statusCode?: number;
    };

function readEnv(name: string) {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

export function readLemonSqueezyApiKey() {
  return readEnv("LEMON_SQUEEZY_API_KEY") ?? readEnv("LEMONSQUEEZY_API_KEY");
}

export function getLemonSqueezyCheckoutMode() {
  return readEnv("LEMON_SQUEEZY_CHECKOUT_MODE") === "live" ? "live" : "test";
}

function isLemonSqueezyCheckoutDisabled() {
  return readEnv("LEMON_SQUEEZY_CHECKOUT_ENABLED") === "false";
}

function getPlanVariantId(plan: BillingPlanConfig) {
  return plan.lemonVariantEnvName ? readEnv(plan.lemonVariantEnvName) : null;
}

export async function createLemonSqueezyCheckout(plan: BillingPlanConfig, origin: string): Promise<LemonCheckoutResult> {
  if (!plan.checkoutEligible || !plan.checkoutSlug) {
    return {
      ok: false,
      reason: "not_eligible",
      detail: "This plan is invoice-only and does not support card checkout.",
    };
  }

  if (isLemonSqueezyCheckoutDisabled()) {
    return {
      ok: false,
      reason: "checkout_disabled",
      detail: "Lemon Squeezy checkout is disabled by runtime configuration.",
    };
  }

  const storeId = readEnv("LEMON_SQUEEZY_STORE_ID");
  const apiKey = readLemonSqueezyApiKey();
  const variantId = getPlanVariantId(plan);
  const redirectOrigin = normalizeCheckoutOrigin(origin);

  if (!storeId || !apiKey || !variantId || !redirectOrigin) {
    return {
      ok: false,
      reason: "not_configured",
      detail: "Lemon Squeezy checkout is missing store, API key, variant ID, or request origin configuration.",
    };
  }

  const numericVariantId = Number(variantId);

  if (!Number.isInteger(numericVariantId) || numericVariantId <= 0) {
    return {
      ok: false,
      reason: "invalid_variant",
      detail: "The configured Lemon Squeezy variant ID must be a positive integer.",
    };
  }

  const checkoutMode = getLemonSqueezyCheckoutMode();
  const checkoutPayload = {
    data: {
      type: "checkouts",
      attributes: {
        product_options: {
          enabled_variants: [numericVariantId],
          redirect_url: `${redirectOrigin}/billing/checkout/${plan.checkoutSlug}?status=success`,
          receipt_button_text: "Return to Shift Evidence",
          receipt_link_url: redirectOrigin,
        },
        checkout_options: {
          embed: false,
          media: true,
          logo: true,
          desc: true,
          discount: true,
        },
        checkout_data: {
          custom: {
            plan_id: plan.id,
            plan_slug: plan.checkoutSlug,
            source: "shift_evidence_public_checkout",
          },
        },
        test_mode: checkoutMode === "test",
        expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
      },
      relationships: {
        store: {
          data: {
            type: "stores",
            id: storeId,
          },
        },
        variant: {
          data: {
            type: "variants",
            id: variantId,
          },
        },
      },
    },
  };

  const response = await fetch(LEMON_SQUEEZY_CHECKOUTS_API_URL, {
    method: "POST",
    headers: {
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(checkoutPayload),
    cache: "no-store",
  });

  if (!response.ok) {
    return {
      ok: false,
      reason: "lemon_api_error",
      detail: `Lemon Squeezy returned ${response.status}.`,
      statusCode: response.status,
    };
  }

  const payload = (await response.json()) as LemonCheckoutApiResponse;
  const checkoutUrl = payload.data?.attributes?.url;

  if (!checkoutUrl) {
    return {
      ok: false,
      reason: "lemon_api_error",
      detail: "Lemon Squeezy did not return a checkout URL.",
    };
  }

  return {
    ok: true,
    checkoutId: payload.data?.id ?? null,
    testMode: payload.data?.attributes?.test_mode ?? checkoutMode === "test",
    url: checkoutUrl,
  };
}
