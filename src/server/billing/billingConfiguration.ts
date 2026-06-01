import {
  billingEnvPlaceholders,
  billingPlans,
  billingProviders,
  legacyLemonEnvPlaceholders,
  getBillingPlanByCheckoutSlug,
  type BillingCheckoutSlug,
  type BillingPlanConfig,
} from "../../config/billing";

export type BillingCheckoutRuntimeStatus =
  | "not_configured"
  | "configured_but_disabled"
  | "configured_live_disabled"
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

function readCheckoutMode() {
  return process.env.STRIPE_CHECKOUT_MODE?.trim().toLowerCase() === "live" ? "live" : "test";
}

function parseEnvBoolean(value: string | undefined) {
  const normalized = value?.trim().replace(/^["']|["']$/g, "").toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes";
}

function isStripeLivePaymentsApproved() {
  return parseEnvBoolean(process.env.STRIPE_LIVE_PAYMENTS_APPROVED);
}

function isStripeCheckoutExplicitlyDisabled() {
  return process.env.STRIPE_CHECKOUT_ENABLED?.trim().toLowerCase() === "false";
}

function hasStripeSecretKey() {
  return hasEnv("STRIPE_SECRET_KEY");
}

function getStripeSecretKeyMode() {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim().replace(/^["']|["']$/g, "");
  if (secretKey?.startsWith("sk_live_")) return "live" as const;
  if (secretKey?.startsWith("sk_test_")) return "test" as const;
  return "unknown" as const;
}

function getStripePriceEnvName(plan: BillingPlanConfig) {
  return plan.stripePriceEnvName;
}

export function getStripeRuntimeStatus(plan: BillingPlanConfig) {
  const secretKeyConfigured = hasStripeSecretKey();
  const priceConfigured = hasEnv(getStripePriceEnvName(plan));
  const mode = readCheckoutMode();
  const secretKeyMode = getStripeSecretKeyMode();
  const configured = secretKeyConfigured && priceConfigured;
  const liveApproved = isStripeLivePaymentsApproved();
  const keyModeMatches =
    !secretKeyConfigured ||
    (mode === "live" ? secretKeyMode === "live" : secretKeyMode === "test");
  const checkoutActive =
    configured &&
    !isStripeCheckoutExplicitlyDisabled() &&
    keyModeMatches &&
    (mode === "test" || liveApproved);
  const status = !configured
    ? "not_configured"
    : isStripeCheckoutExplicitlyDisabled()
      ? "configured_but_disabled"
      : !keyModeMatches
        ? "configured_live_disabled"
        : mode === "live" && !liveApproved
          ? "configured_live_disabled"
          : "configured";

  return {
    provider: billingProviders.stripe.displayName,
    checkoutActive,
    configured,
    status,
    mode,
    env: {
      secretKeyConfigured,
      secretKeyMode,
      priceConfigured,
      priceEnvName: getStripePriceEnvName(plan),
    },
  } satisfies {
    provider: string;
    checkoutActive: boolean;
    configured: boolean;
    status: Extract<
      BillingCheckoutRuntimeStatus,
      "not_configured" | "configured_but_disabled" | "configured_live_disabled" | "configured"
    >;
    mode: "test" | "live";
    env: {
      secretKeyConfigured: boolean;
      secretKeyMode: "live" | "test" | "unknown";
      priceConfigured: boolean;
      priceEnvName: string | null;
    };
  };
}

export function getLemonSqueezyRuntimeStatus(plan: BillingPlanConfig) {
  const storeConfigured = hasEnv("LEMON_SQUEEZY_STORE_ID");
  const apiKeyConfigured = hasLemonSqueezyApiKey();
  const variantConfigured = hasEnv(plan.lemonVariantEnvName);
  const configured = storeConfigured && apiKeyConfigured && variantConfigured;
  const checkoutActive = false;
  const status = configured ? "configured_but_disabled" : "not_configured";

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
    legacyReason: "Lemon Squeezy rejected the offering as services. It remains read-only historical/legacy.",
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
    legacyReason: string;
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

  const stripe = getStripeRuntimeStatus(plan);

  return {
    plan,
    stripe,
    status: stripe.status,
    headline: stripe.checkoutActive ? "Secure Stripe checkout" : "Stripe checkout not configured",
    detail:
      stripe.checkoutActive
        ? stripe.mode === "live"
          ? "This route creates a Stripe Checkout session server-side in live mode for the controlled go-live smoke."
          : "This route creates a Stripe Checkout session server-side in test mode and redirects to hosted checkout."
        : stripe.status === "configured_live_disabled"
          ? "Stripe appears configured for live mode, but live checkout is intentionally disabled until owner approval."
          : "Stripe checkout is not fully configured yet. No payment is processed and no order is created.",
  };
}

export function getBillingAdminStatus() {
  const planStates = billingPlans.map((plan) => {
    const stripe = getStripeRuntimeStatus(plan);

    return {
      planId: plan.id,
      displayName: plan.displayName,
      checkoutEligible: plan.checkoutEligible,
      invoiceEligible: plan.invoiceEligible,
      checkoutStatus: plan.checkoutEligible ? stripe.status : "invoice_only",
      priceEnvName: plan.stripePriceEnvName,
      priceConfigured: stripe.env.priceConfigured,
    };
  });

  const stripeCheckoutActiveForAnyPlan = planStates.some(
    (plan) => plan.checkoutEligible && plan.checkoutStatus === "configured",
  );
  const stripeConfiguredForAnyCheckoutPlan = planStates.some((plan) => {
    return (
      plan.checkoutEligible &&
      (
        plan.checkoutStatus === "configured" ||
        plan.checkoutStatus === "configured_but_disabled" ||
        plan.checkoutStatus === "configured_live_disabled"
      )
    );
  });

  return {
    providers: [
      {
        id: billingProviders.stripe.id,
        label: billingProviders.stripe.displayName,
        status: stripeCheckoutActiveForAnyPlan
          ? readCheckoutMode() === "live"
            ? "Configured live mode"
            : "Configured test mode"
          : stripeConfiguredForAnyCheckoutPlan
            ? "Configured, disabled/live not approved"
            : "Not Configured",
        detail: stripeCheckoutActiveForAnyPlan
          ? readCheckoutMode() === "live"
            ? "Server-side Stripe Checkout creation is available in live mode for the controlled smoke. No entitlement automation is active."
            : "Server-side Stripe Checkout creation is available in test mode. No entitlement automation is active."
          : "Stripe is the primary configurable provider. Missing env vars degrade to manual invoice follow-up.",
      },
      {
        id: billingProviders.bankTransfer.id,
        label: billingProviders.bankTransfer.displayName,
        status: "Manual",
        detail: "Invoice requests route through support/manual follow-up.",
      },
      {
        id: billingProviders.lemonSqueezy.id,
        label: billingProviders.lemonSqueezy.displayName,
        status: "Rejected / legacy disabled",
        detail: "Historical provider only. Lemon checkout is no longer active after services-policy rejection.",
      },
    ],
    envPlaceholders: billingEnvPlaceholders.map((name) => ({
      name,
      configured: hasEnv(name),
      secret: name === "STRIPE_SECRET_KEY" || name === "STRIPE_WEBHOOK_SECRET",
    })),
    legacyLemonEnvPlaceholders: legacyLemonEnvPlaceholders.map((name) => ({
      name,
      configured: hasEnv(name),
      secret: name.includes("API_KEY") || name.includes("WEBHOOK_SECRET"),
    })),
    planStates,
  };
}

export function getCheckoutSlugForPlanId(planId: string): BillingCheckoutSlug | null {
  return billingPlans.find((plan) => plan.id === planId)?.checkoutSlug ?? null;
}
