export type BillingProvider =
  | "stripe"
  | "bank_transfer"
  | "wise_manual"
  | "paddle_not_used"
  | "fastspring_not_used";

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
  stripePriceEnvName: string | null;
  primaryAction: BillingPlanAction;
  secondaryAction: BillingPlanAction;
};

export const billingProviders = {
  stripe: {
    id: "stripe" as const,
    displayName: "Stripe",
    statusLabel: "Primary configurable",
    checkoutActive: false,
  },
  bankTransfer: {
    id: "bank_transfer" as const,
    displayName: "Manual invoice / bank transfer",
    statusLabel: "Manual follow-up available",
    checkoutActive: false,
  },
  wiseManual: {
    id: "wise_manual" as const,
    displayName: "Wise / bank transfer reference",
    statusLabel: "Manual reference only",
    checkoutActive: false,
  },
  paddleNotUsed: {
    id: "paddle_not_used" as const,
    displayName: "Paddle",
    statusLabel: "Not used",
    checkoutActive: false,
  },
  fastspringNotUsed: {
    id: "fastspring_not_used" as const,
    displayName: "FastSpring / 2Checkout",
    statusLabel: "Not used",
    checkoutActive: false,
  },
} satisfies Record<string, {
  id: BillingProvider;
  displayName: string;
  statusLabel: string;
  checkoutActive: boolean;
}>;

export const billingEnvPlaceholders = [
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_STARTER_PRICE_ID",
  "STRIPE_PROFESSIONAL_PRICE_ID",
  "STRIPE_MSP_PRICE_ID",
  "STRIPE_CHECKOUT_MODE",
  "STRIPE_LIVE_PAYMENTS_APPROVED",
  "STRIPE_CHECKOUT_ENABLED",
  "NEXT_PUBLIC_APP_URL",
  "BETTER_AUTH_URL",
] as const;


export function getBillingCheckoutPath(slug: BillingCheckoutSlug) {
  return `/billing/checkout/${slug}`;
}

export function getBillingBankTransferPath(slug: BillingCheckoutSlug) {
  return `/billing/bank-transfer/${slug}`;
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
    recommendedPayment: "bank_transfer_invoice",
    checkoutEligible: true,
    invoiceEligible: true,
    stripePriceEnvName: "STRIPE_STARTER_PRICE_ID",
    primaryAction: {
      label: "Request invoice",
      href: getBillingBankTransferPath("starter"),
      kind: "invoice_request",
    },
    secondaryAction: {
      label: "Request checkout link",
      href: getBillingCheckoutPath("starter"),
      kind: "checkout_placeholder",
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
    recommendedPayment: "bank_transfer_invoice",
    checkoutEligible: true,
    invoiceEligible: true,
    stripePriceEnvName: "STRIPE_PROFESSIONAL_PRICE_ID",
    primaryAction: {
      label: "Request invoice",
      href: getBillingBankTransferPath("professional"),
      kind: "invoice_request",
    },
    secondaryAction: {
      label: "Request checkout link",
      href: getBillingCheckoutPath("professional"),
      kind: "checkout_placeholder",
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
    stripePriceEnvName: null,
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
    recommendedPayment: "bank_transfer_invoice",
    checkoutEligible: true,
    invoiceEligible: true,
    stripePriceEnvName: "STRIPE_MSP_PRICE_ID",
    primaryAction: {
      label: "Request partner invoice",
      href: getBillingBankTransferPath("msp"),
      kind: "invoice_request",
    },
    secondaryAction: {
      label: "Request checkout link",
      href: getBillingCheckoutPath("msp"),
      kind: "checkout_placeholder",
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
      return "Controlled card checkout";
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
