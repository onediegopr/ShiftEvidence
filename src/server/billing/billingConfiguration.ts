import {
  billingEnvPlaceholders,
  billingPlans,
  billingProviders,
  getBillingPlanByCheckoutSlug,
  type BillingCheckoutSlug,
  type BillingPlanConfig,
} from "../../config/billing";

export type BillingCheckoutRuntimeStatus =
  | "not_configured"
  | "configured_but_disabled"
  | "configured"
  | "invoice_only"
  | "unsupported_plan";

function isPresent(value: string | undefined) {
  return Boolean(value && value.trim());
}

function hasEnv(name: string | null) {
  return name ? isPresent(process.env[name]) : false;
}

function hasLemonSqueezyApiKey() {
  return hasEnv("LEMON_SQUEEZY_API_KEY") || hasEnv("LEMONSQUEEZY_API_KEY");
}

function isCheckoutExplicitlyDisabled() {
  return process.env.LEMON_SQUEEZY_CHECKOUT_ENABLED?.trim().toLowerCase() === "false";
}

export function getLemonSqueezyRuntimeStatus(plan: BillingPlanConfig) {
  const storeConfigured = hasEnv("LEMON_SQUEEZY_STORE_ID");
  const apiKeyConfigured = hasLemonSqueezyApiKey();
  const variantConfigured = hasEnv(plan.lemonVariantEnvName);
  const configured = storeConfigured && apiKeyConfigured && variantConfigured;
  const checkoutActive = configured && !isCheckoutExplicitlyDisabled();
  const status = configured ? (checkoutActive ? "configured" : "configured_but_disabled") : "not_configured";

  return {
    provider: billingProviders.lemonSqueezy.displayName,
    checkoutActive,
    configured,
    status,
    env: {
      storeConfigured,
      apiKeyConfigured,
      variantConfigured,
      variantEnvName: plan.lemonVariantEnvName,
    },
  } satisfies {
    provider: string;
    checkoutActive: boolean;
    configured: boolean;
    status: Extract<BillingCheckoutRuntimeStatus, "not_configured" | "configured_but_disabled" | "configured">;
    env: {
      storeConfigured: boolean;
      apiKeyConfigured: boolean;
      variantConfigured: boolean;
      variantEnvName: string | null;
    };
  };
}

export function getBillingCheckoutRouteState(slug: string) {
  const plan = getBillingPlanByCheckoutSlug(slug);

  if (!plan) {
    return {
      plan: null,
      status: "unsupported_plan" as const,
      headline: "Checkout route is not available",
      detail: "This checkout path is not mapped to an active billing plan.",
    };
  }

  if (!plan.checkoutEligible) {
    return {
      plan,
      status: "invoice_only" as const,
      headline: "Invoice required",
      detail: "This plan is scoped before payment and does not use card checkout.",
    };
  }

  const lemon = getLemonSqueezyRuntimeStatus(plan);

  return {
    plan,
    lemon,
    status: lemon.status,
    headline: lemon.checkoutActive ? "Secure card checkout" : "Checkout coming soon",
    detail:
      lemon.checkoutActive
        ? "This route creates a Lemon Squeezy checkout session server-side and redirects to secure checkout."
        : "Lemon Squeezy checkout is not fully configured yet. No payment is processed and no order is created.",
  };
}

export function getBillingAdminStatus() {
  const planStates = billingPlans.map((plan) => {
    const lemon = getLemonSqueezyRuntimeStatus(plan);

    return {
      planId: plan.id,
      displayName: plan.displayName,
      checkoutEligible: plan.checkoutEligible,
      invoiceEligible: plan.invoiceEligible,
      checkoutStatus: plan.checkoutEligible ? lemon.status : "invoice_only",
      variantEnvName: plan.lemonVariantEnvName,
      variantConfigured: lemon.env.variantConfigured,
    };
  });

  const lemonCheckoutActiveForAnyPlan = planStates.some(
    (plan) => plan.checkoutEligible && plan.checkoutStatus === "configured",
  );
  const lemonConfiguredForAnyCheckoutPlan = planStates.some((plan) => {
    return (
      plan.checkoutEligible &&
      (plan.checkoutStatus === "configured" || plan.checkoutStatus === "configured_but_disabled")
    );
  });

  return {
    providers: [
      {
        id: billingProviders.lemonSqueezy.id,
        label: billingProviders.lemonSqueezy.displayName,
        status: lemonCheckoutActiveForAnyPlan
          ? "Configured"
          : lemonConfiguredForAnyCheckoutPlan
            ? "Configured, disabled"
            : "Not Configured",
        detail: lemonCheckoutActiveForAnyPlan
          ? "Server-side checkout creation is available for configured plans. No entitlement automation is active."
          : "Prepared for checkout. Lemon API calls are made only from checkout start routes when fully configured.",
      },
      {
        id: billingProviders.bankTransfer.id,
        label: billingProviders.bankTransfer.displayName,
        status: "Manual",
        detail: "Invoice requests route through support/manual follow-up.",
      },
      {
        id: billingProviders.stripeDisabled.id,
        label: billingProviders.stripeDisabled.displayName,
        status: "Disabled",
        detail: "Deferred provider. Not shown as public checkout.",
      },
    ],
    envPlaceholders: billingEnvPlaceholders.map((name) => ({
      name,
      configured: hasEnv(name),
      secret: name === "LEMON_SQUEEZY_API_KEY" || name === "LEMONSQUEEZY_API_KEY",
    })),
    planStates,
  };
}

export function getCheckoutSlugForPlanId(planId: string): BillingCheckoutSlug | null {
  return billingPlans.find((plan) => plan.id === planId)?.checkoutSlug ?? null;
}
