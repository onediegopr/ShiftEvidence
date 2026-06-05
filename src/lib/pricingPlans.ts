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

export type PaymentProvider = Extract<BillingProvider, "stripe">;

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
  cardCheckout: "Card checkout is available only through a controlled rollout after approval.",
  bankTransfer: "Bank transfer invoices are the primary onboarding path for business customers.",
  general: "Manual invoice requests are reviewed before fulfillment. Card checkout remains controlled until explicitly approved.",
  pricingNote:
    "Manual invoice and controlled onboarding are the default paths while production checkout remains safe-off. Card checkout links can be enabled only after approval.",
  faq:
    "Card checkout is a controlled Stripe path, not open self-service. Bank transfer is a reviewed manual invoice request, not an automatic transfer or instant fulfillment path.",
  blueprint:
    "Blueprint engagements are scoped before payment. Request a manual invoice after confirming project scope.",
  msp:
    "MSP partner plans are handled through reviewed business invoice by default. Card checkout can be approved later for controlled rollout.",
  notActive:
    "If checkout is unavailable or account matching is required, requests are routed for manual follow-up, review and invoice handling.",
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
    bestFor: "Teams that need a first evidence-based readiness checkpoint before committing budget or migration scope.",
    accent: "core",
    recommendedPayment: starterBillingPlan.recommendedPayment,
    paymentOptions: starterBillingPlan.paymentOptions,
    futureProvider: "stripe",
    cta: starterBillingPlan.primaryAction,
    secondaryCta: starterBillingPlan.secondaryAction,
    paymentNote: "Invoice requests are reviewed before fulfillment. Card checkout is available only after controlled approval.",
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
    bestFor: "Infrastructure teams that need a VM-by-VM readiness assessment and stakeholder-ready migration decision pack.",
    accent: "pro",
    recommendedPayment: professionalBillingPlan.recommendedPayment,
    paymentOptions: professionalBillingPlan.paymentOptions,
    futureProvider: "stripe",
    cta: professionalBillingPlan.primaryAction,
    secondaryCta: professionalBillingPlan.secondaryAction,
    paymentNote: "Manual invoice requests are reviewed before access or fulfillment. Card checkout is available only after controlled approval.",
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
    bestFor: "Teams preparing a serious migration plan with scope, architecture assumptions, waves, validation gates and rollback expectations.",
    accent: "blueprint",
    recommendedPayment: blueprintBillingPlan.recommendedPayment,
    paymentOptions: blueprintBillingPlan.paymentOptions,
    futureProvider: "stripe",
    cta: blueprintBillingPlan.primaryAction,
    secondaryCta: blueprintBillingPlan.secondaryAction,
    paymentNote: paymentOptionsCopy.blueprint,
    includes: [
      "Everything in Professional Assessment",
      "Migration wave planning",
      "Pilot candidate selection",
      "Remediation roadmap",
      "Rollback framework",
      "Migration day checklist",
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
    bestFor: "Consultants, MSPs and integrators who need repeatable, client-ready assessments before workshops or proposals.",
    accent: "partner",
    recommendedPayment: mspBillingPlan.recommendedPayment,
    paymentOptions: mspBillingPlan.paymentOptions,
    futureProvider: "stripe",
    cta: mspBillingPlan.primaryAction,
    secondaryCta: mspBillingPlan.secondaryAction,
    paymentNote: paymentOptionsCopy.msp,
    includes: [
      "Reusable methodology",
      "Client-ready PDFs",
      "Assessment templates",
      "Reusable pre-sales evidence workflow",
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
