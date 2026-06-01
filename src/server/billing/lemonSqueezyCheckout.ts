import type { BillingPlanConfig } from "../../config/billing";

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

export async function createLemonSqueezyCheckout(plan: BillingPlanConfig, _origin: string): Promise<LemonCheckoutResult> {
  void _origin;

  if (!plan.checkoutEligible || !plan.checkoutSlug) {
    return {
      ok: false,
      reason: "not_eligible",
      detail: "This plan is invoice-only and does not support card checkout.",
    };
  }

  return {
    ok: false,
    reason: "checkout_disabled",
    detail: "Lemon Squeezy checkout is legacy-disabled after provider rejection. Use Stripe or manual invoice.",
  };
}
