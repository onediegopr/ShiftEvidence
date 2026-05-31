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
  | "invoice_only"
  | "unsupported_plan";

function isPresent(value: string | undefined) {
  return Boolean(value && value.trim());
}

function hasEnv(name: string | null) {
  return name ? isPresent(process.env[name]) : false;
}

export function getLemonSqueezyRuntimeStatus(plan: BillingPlanConfig) {
  const storeConfigured = hasEnv("LEMON_SQUEEZY_STORE_ID");
  const apiKeyConfigured = hasEnv("LEMON_SQUEEZY_API_KEY");
  const variantConfigured = hasEnv(plan.lemonVariantEnvName);
  const configured = storeConfigured && apiKeyConfigured && variantConfigured;

  return {
    provider: billingProviders.lemonSqueezy.displayName,
    checkoutActive: false,
    configured,
    status: configured ? "configured_but_disabled" : "not_configured",
    env: {
      storeConfigured,
      apiKeyConfigured,
      variantConfigured,
      variantEnvName: plan.lemonVariantEnvName,
    },
  } satisfies {
    provider: string;
    checkoutActive: false;
    configured: boolean;
    status: Extract<BillingCheckoutRuntimeStatus, "not_configured" | "configured_but_disabled">;
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
    headline: "Checkout coming soon",
    detail:
      "Lemon Squeezy checkout is wired as a safe placeholder only. No payment is processed and no order is created.",
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

  const lemonConfiguredForAnyCheckoutPlan = planStates.some(
    (plan) => plan.checkoutEligible && plan.checkoutStatus === "configured_but_disabled",
  );

  return {
    providers: [
      {
        id: billingProviders.lemonSqueezy.id,
        label: billingProviders.lemonSqueezy.displayName,
        status: lemonConfiguredForAnyCheckoutPlan ? "Configured, disabled" : "Not Configured",
        detail: "Prepared for future checkout. No Lemon API calls are made.",
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
      secret: name === "LEMON_SQUEEZY_API_KEY",
    })),
    planStates,
  };
}

export function getCheckoutSlugForPlanId(planId: string): BillingCheckoutSlug | null {
  return billingPlans.find((plan) => plan.id === planId)?.checkoutSlug ?? null;
}
