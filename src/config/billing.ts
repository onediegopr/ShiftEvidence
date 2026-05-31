export type BillingProvider = "lemon_squeezy" | "bank_transfer" | "stripe_disabled";

export type BillingCadence = "one_time" | "monthly" | "scoped";

export type BillingPaymentOption = "card_checkout" | "bank_transfer_invoice";

export type BillingPlanId =
  | "starter_readiness"
  | "professional_assessment"
  | "migration_blueprint"
  | "msp_partner";

export type BillingCheckoutSlug = "starter" | "professional" | "msp";

export type BillingPlanAction = {
  label: string;
  href: string;
  kind: "checkout_placeholder" | "invoice_request" | "scope_discussion" | "partner_inquiry";
};

export type BillingPlanConfig = {
  id: BillingPlanId;
  checkoutSlug: BillingCheckoutSlug | null;
  displayName: string;
  priceLabel: string;
  priceAmountUsd: number;
  pricePrefix?: "from";
  currency: "USD";
  cadence: BillingCadence;
  paymentOptions: BillingPaymentOption[];
  recommendedPayment: BillingPaymentOption;
  checkoutEligible: boolean;
  invoiceEligible: boolean;
  lemonVariantEnvName: string | null;
  primaryAction: BillingPlanAction;
  secondaryAction: BillingPlanAction;
};

export const billingProviders = {
  lemonSqueezy: {
    id: "lemon_squeezy" as const,
    displayName: "Lemon Squeezy",
    statusLabel: "Not Configured",
    checkoutActive: false,
  },
  bankTransfer: {
    id: "bank_transfer" as const,
    displayName: "Bank transfer invoice",
    statusLabel: "Manual follow-up available",
    checkoutActive: false,
  },
  stripeDisabled: {
    id: "stripe_disabled" as const,
    displayName: "Stripe",
    statusLabel: "Disabled",
    checkoutActive: false,
  },
} satisfies Record<string, {
  id: BillingProvider;
  displayName: string;
  statusLabel: string;
  checkoutActive: boolean;
}>;

export const billingEnvPlaceholders = [
  "LEMON_SQUEEZY_STORE_ID",
  "LEMON_SQUEEZY_API_KEY",
  "LEMONSQUEEZY_API_KEY",
  "LEMON_STARTER_VARIANT_ID",
  "LEMON_PROFESSIONAL_VARIANT_ID",
  "LEMON_MSP_VARIANT_ID",
] as const;

export function getBillingCheckoutPath(slug: BillingCheckoutSlug) {
  return `/billing/checkout/${slug}`;
}

export function getBillingInvoicePath(subject: string, category = "billing_question") {
  return `/support?category=${category}&subject=${encodeURIComponent(subject)}`;
}

export const billingPlans: BillingPlanConfig[] = [
  {
    id: "starter_readiness",
    checkoutSlug: "starter",
    displayName: "Starter Readiness",
    priceLabel: "USD 490",
    priceAmountUsd: 490,
    currency: "USD",
    cadence: "one_time",
    paymentOptions: ["card_checkout", "bank_transfer_invoice"],
    recommendedPayment: "card_checkout",
    checkoutEligible: true,
    invoiceEligible: true,
    lemonVariantEnvName: "LEMON_STARTER_VARIANT_ID",
    primaryAction: {
      label: "Pay by card",
      href: getBillingCheckoutPath("starter"),
      kind: "checkout_placeholder",
    },
    secondaryAction: {
      label: "Request invoice",
      href: getBillingInvoicePath("Starter Readiness Invoice"),
      kind: "invoice_request",
    },
  },
  {
    id: "professional_assessment",
    checkoutSlug: "professional",
    displayName: "Professional Assessment",
    priceLabel: "USD 1,500",
    priceAmountUsd: 1_500,
    currency: "USD",
    cadence: "one_time",
    paymentOptions: ["card_checkout", "bank_transfer_invoice"],
    recommendedPayment: "card_checkout",
    checkoutEligible: true,
    invoiceEligible: true,
    lemonVariantEnvName: "LEMON_PROFESSIONAL_VARIANT_ID",
    primaryAction: {
      label: "Pay by card",
      href: getBillingCheckoutPath("professional"),
      kind: "checkout_placeholder",
    },
    secondaryAction: {
      label: "Request invoice",
      href: getBillingInvoicePath("Professional Assessment Invoice"),
      kind: "invoice_request",
    },
  },
  {
    id: "migration_blueprint",
    checkoutSlug: null,
    displayName: "Migration Blueprint",
    priceLabel: "From USD 3,500",
    priceAmountUsd: 3_500,
    pricePrefix: "from",
    currency: "USD",
    cadence: "scoped",
    paymentOptions: ["bank_transfer_invoice"],
    recommendedPayment: "bank_transfer_invoice",
    checkoutEligible: false,
    invoiceEligible: true,
    lemonVariantEnvName: null,
    primaryAction: {
      label: "Request invoice",
      href: getBillingInvoicePath("Migration Blueprint Invoice", "partner_msp_inquiry"),
      kind: "invoice_request",
    },
    secondaryAction: {
      label: "Discuss scope",
      href: getBillingInvoicePath("Migration Blueprint Scope Discussion", "assessment_report_question"),
      kind: "scope_discussion",
    },
  },
  {
    id: "msp_partner",
    checkoutSlug: "msp",
    displayName: "MSP Partner",
    priceLabel: "From USD 399/month",
    priceAmountUsd: 399,
    pricePrefix: "from",
    currency: "USD",
    cadence: "monthly",
    paymentOptions: ["card_checkout", "bank_transfer_invoice"],
    recommendedPayment: "card_checkout",
    checkoutEligible: true,
    invoiceEligible: true,
    lemonVariantEnvName: "LEMON_MSP_VARIANT_ID",
    primaryAction: {
      label: "Subscribe",
      href: getBillingCheckoutPath("msp"),
      kind: "checkout_placeholder",
    },
    secondaryAction: {
      label: "Request invoice",
      href: getBillingInvoicePath("MSP Partner Invoice", "partner_msp_inquiry"),
      kind: "invoice_request",
    },
  },
];

export function getBillingPlanById(planId: BillingPlanId) {
  return billingPlans.find((plan) => plan.id === planId) ?? null;
}

export function getBillingPlanByCheckoutSlug(slug: string) {
  return billingPlans.find((plan) => plan.checkoutSlug === slug) ?? null;
}

export function getBillingPaymentOptionLabel(option: BillingPaymentOption) {
  switch (option) {
    case "card_checkout":
      return "Card checkout";
    case "bank_transfer_invoice":
      return "Bank transfer invoice";
  }
}

export function getBillingCadenceLabel(cadence: BillingCadence) {
  switch (cadence) {
    case "one_time":
      return "One-time";
    case "monthly":
      return "Monthly";
    case "scoped":
      return "Scoped before payment";
  }
}
