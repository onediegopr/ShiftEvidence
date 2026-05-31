import {
  billingPlans,
  getBillingCadenceLabel as getConfiguredBillingCadenceLabel,
  getBillingPaymentOptionLabel,
  type BillingCadence,
  type BillingPaymentOption,
  type BillingPlanId,
  type BillingProvider,
} from "../config/billing";

export type { BillingCadence };

export type PaymentOption = BillingPaymentOption;

export type PaymentProvider = Extract<BillingProvider, "lemon_squeezy" | "stripe_disabled">;

export type PlanId = BillingPlanId;

export interface Plan {
  id: PlanId;
  name: string;
  price: string;
  priceAmountUsd: number;
  pricePrefix?: "from";
  billingCadence: BillingCadence;
  bestFor: string;
  accent: "core" | "pro" | "blueprint" | "partner";
  recommendedPayment: PaymentOption;
  paymentOptions: PaymentOption[];
  futureProvider: PaymentProvider;
  disabledProvider: PaymentProvider;
  cta: {
    label: string;
    href: string;
  };
  secondaryCta: {
    label: string;
    href: string;
  };
  paymentNote: string;
  includes: string[];
  excludes: string[];
  upsell?: string;
}

export interface AddOn {
  name: string;
  price: string;
  bestFor: string;
  cta: {
    label: string;
    href: string;
  };
  includes: string[];
  excludes: string[];
  upsell?: string;
}

export const paymentOptionsCopy = {
  cardCheckout: "Secure card checkout will be available through Lemon Squeezy.",
  bankTransfer: "Bank transfer invoices are available for business customers.",
  general: "Card checkout will be available through secure checkout. Bank transfer invoices are available for business customers.",
  pricingNote:
    "Card checkout is planned for fast starts. Bank transfer invoices are available for Professional, Blueprint and MSP agreements.",
  faq:
    "Card checkout will support fast starts when activated. Bank transfer invoices are available for business customers and are especially recommended for larger assessments, blueprints and MSP agreements.",
  blueprint:
    "Blueprint engagements are scoped before payment. Request an invoice after confirming project scope.",
  msp:
    "MSP partner plans can be billed monthly by card or handled through business invoice depending on agreement size.",
  notActive:
    "Payments are not processed automatically yet. Requests are routed for manual follow-up until checkout is activated.",
} as const;

export function getPaymentOptionLabel(option: PaymentOption) {
  return getBillingPaymentOptionLabel(option);
}

export function getBillingCadenceLabel(cadence: BillingCadence) {
  return getConfiguredBillingCadenceLabel(cadence);
}

const starterBillingPlan = billingPlans.find((plan) => plan.id === "starter_readiness")!;
const professionalBillingPlan = billingPlans.find((plan) => plan.id === "professional_assessment")!;
const blueprintBillingPlan = billingPlans.find((plan) => plan.id === "migration_blueprint")!;
const mspBillingPlan = billingPlans.find((plan) => plan.id === "msp_partner")!;

export const marketingPlans: Plan[] = [
  {
    id: "starter_readiness",
    name: starterBillingPlan.displayName,
    price: starterBillingPlan.priceLabel,
    priceAmountUsd: starterBillingPlan.priceAmountUsd,
    billingCadence: starterBillingPlan.cadence,
    bestFor: "Teams that want a clear first assessment before committing to a larger migration plan.",
    accent: "core",
    recommendedPayment: starterBillingPlan.recommendedPayment,
    paymentOptions: starterBillingPlan.paymentOptions,
    futureProvider: "lemon_squeezy",
    disabledProvider: "stripe_disabled",
    cta: starterBillingPlan.primaryAction,
    secondaryCta: starterBillingPlan.secondaryAction,
    paymentNote: "Card checkout is prepared for this plan but not active yet. Bank transfer invoice is available on request for business customers.",
    includes: [
      "Guided VMware readiness intake",
      "RVTools upload / guided evidence review",
      "Initial licensing and readiness signal",
      "Basic executive-ready assessment output",
      "Missing evidence checklist",
      "Client workspace",
    ],
    excludes: [
      "Deep migration blueprint",
      "Implementation design",
      "Managed migration",
      "Final architecture sign-off",
      "Ongoing MSP workspace",
    ],
    upsell: "Use Starter Readiness to confirm whether a deeper Professional Assessment or Migration Blueprint is justified.",
  },
  {
    id: "professional_assessment",
    name: professionalBillingPlan.displayName,
    price: professionalBillingPlan.priceLabel,
    priceAmountUsd: professionalBillingPlan.priceAmountUsd,
    billingCadence: professionalBillingPlan.cadence,
    bestFor: "Infrastructure teams that need a fuller migration readiness assessment and stakeholder-ready report.",
    accent: "pro",
    recommendedPayment: professionalBillingPlan.recommendedPayment,
    paymentOptions: professionalBillingPlan.paymentOptions,
    futureProvider: "lemon_squeezy",
    disabledProvider: "stripe_disabled",
    cta: professionalBillingPlan.primaryAction,
    secondaryCta: professionalBillingPlan.secondaryAction,
    paymentNote: "Card checkout is prepared for this plan but not active yet. Business invoice support is available for procurement workflows.",
    includes: [
      "Everything in Starter Readiness",
      "Full licensing and cost exposure review",
      "Storage Destination Readiness analysis",
      "Senior Migration Advisor access",
      "Project Memory Vault access",
      "VM-by-VM risk matrix",
      "Executive and technical report output",
      "Prioritized recommendations",
    ],
    excludes: [
      "Final signed architecture design",
      "Implementation execution",
      "Managed migration operations",
      "Ongoing production support",
    ],
    upsell: "Request a Migration Blueprint when the assessment needs scoped wave planning, rollback design and architecture alignment.",
  },
  {
    id: "migration_blueprint",
    name: blueprintBillingPlan.displayName,
    price: blueprintBillingPlan.priceLabel,
    priceAmountUsd: blueprintBillingPlan.priceAmountUsd,
    pricePrefix: blueprintBillingPlan.pricePrefix,
    billingCadence: blueprintBillingPlan.cadence,
    bestFor: "Teams preparing a serious migration plan with scope, waves, validation gates and rollback expectations.",
    accent: "blueprint",
    recommendedPayment: blueprintBillingPlan.recommendedPayment,
    paymentOptions: blueprintBillingPlan.paymentOptions,
    futureProvider: "lemon_squeezy",
    disabledProvider: "stripe_disabled",
    cta: blueprintBillingPlan.primaryAction,
    secondaryCta: blueprintBillingPlan.secondaryAction,
    paymentNote: paymentOptionsCopy.blueprint,
    includes: [
      "Everything in Professional Assessment",
      "Migration wave planning",
      "Pilot candidate selection",
      "Remediation roadmap",
      "Rollback framework",
      "Technical review session",
      "Executive decision pack",
      "Blueprint guidance",
    ],
    excludes: [
      "Implementation execution",
      "Managed migration operations",
      "Ongoing production support",
    ],
    upsell: "Blueprint engagements are scoped before payment so the invoice matches the real migration planning effort.",
  },
  {
    id: "msp_partner",
    name: mspBillingPlan.displayName,
    price: mspBillingPlan.priceLabel,
    priceAmountUsd: mspBillingPlan.priceAmountUsd,
    pricePrefix: mspBillingPlan.pricePrefix,
    billingCadence: mspBillingPlan.cadence,
    bestFor: "Consultants, MSPs and integrators who need repeatable assessments for client conversations.",
    accent: "partner",
    recommendedPayment: mspBillingPlan.recommendedPayment,
    paymentOptions: mspBillingPlan.paymentOptions,
    futureProvider: "lemon_squeezy",
    disabledProvider: "stripe_disabled",
    cta: mspBillingPlan.primaryAction,
    secondaryCta: mspBillingPlan.secondaryAction,
    paymentNote: paymentOptionsCopy.msp,
    includes: [
      "Reusable methodology",
      "Client-ready PDFs",
      "Assessment templates",
      "Partner workflow",
      "Dedicated workspace management",
      "Billing and support priority",
    ],
    excludes: [
      "Direct client end-user support",
      "Automatic public checkout activation before agreement",
    ],
    upsell: "Request Partner Access to discuss client volume, invoice terms and workspace requirements.",
  },
];

export const marketingAddOns: AddOn[] = [
  {
    name: "Technical Review Call",
    price: "Quoted with assessment scope",
    bestFor: "Teams that want a human review of the readiness findings before making a decision.",
    cta: { label: "Book Technical Review", href: "/support?category=assessment_report_question&subject=Technical%20Review%20Call" },
    includes: [
      "Report walkthrough",
      "Risk discussion",
      "Assumptions review",
      "Prioritization",
      "Next-step recommendations",
    ],
    excludes: [
      "Implementation",
      "Migration execution",
      "Ongoing support",
      "Managed infrastructure",
      "Guaranteed outcome",
    ],
    upsell: "Use the call to align the report with your internal decision process and architecture review.",
  },
];
