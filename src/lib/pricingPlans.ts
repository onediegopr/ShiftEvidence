export type BillingCadence = "one_time" | "monthly" | "scoped";

export type PaymentOption = "card_checkout" | "bank_transfer_invoice";

export type PaymentProvider = "lemon_squeezy" | "stripe";

export type PlanId =
  | "starter_readiness"
  | "professional_assessment"
  | "migration_blueprint"
  | "msp_partner";

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

export const marketingPlans: Plan[] = [
  {
    id: "starter_readiness",
    name: "Starter Readiness",
    price: "USD 490",
    priceAmountUsd: 490,
    billingCadence: "one_time",
    bestFor: "Teams that want a clear first assessment before committing to a larger migration plan.",
    accent: "core",
    recommendedPayment: "card_checkout",
    paymentOptions: ["card_checkout", "bank_transfer_invoice"],
    futureProvider: "lemon_squeezy",
    disabledProvider: "stripe",
    cta: { label: "Start Starter Assessment", href: "/sign-up?plan=starter_readiness" },
    secondaryCta: {
      label: "Request bank transfer invoice",
      href: "/support?category=billing_question&subject=Starter%20Readiness%20Bank%20Transfer%20Invoice",
    },
    paymentNote: "Fast-start card checkout first. Bank transfer invoice available on request for business customers.",
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
    name: "Professional Assessment",
    price: "USD 1,500",
    priceAmountUsd: 1_500,
    billingCadence: "one_time",
    bestFor: "Infrastructure teams that need a fuller migration readiness assessment and stakeholder-ready report.",
    accent: "pro",
    recommendedPayment: "card_checkout",
    paymentOptions: ["card_checkout", "bank_transfer_invoice"],
    futureProvider: "lemon_squeezy",
    disabledProvider: "stripe",
    cta: { label: "Book Professional Assessment", href: "/sign-up?plan=professional_assessment" },
    secondaryCta: {
      label: "Request invoice",
      href: "/support?category=billing_question&subject=Professional%20Assessment%20Invoice",
    },
    paymentNote: "Card checkout or bank transfer invoice. Business invoice support is available for procurement workflows.",
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
    name: "Migration Blueprint",
    price: "From USD 3,500",
    priceAmountUsd: 3_500,
    pricePrefix: "from",
    billingCadence: "scoped",
    bestFor: "Teams preparing a serious migration plan with scope, waves, validation gates and rollback expectations.",
    accent: "blueprint",
    recommendedPayment: "bank_transfer_invoice",
    paymentOptions: ["bank_transfer_invoice"],
    futureProvider: "lemon_squeezy",
    disabledProvider: "stripe",
    cta: {
      label: "Request Migration Blueprint",
      href: "/support?category=partner_msp_inquiry&subject=Migration%20Blueprint%20Scope",
    },
    secondaryCta: {
      label: "Discuss scope",
      href: "/support?category=assessment_report_question&subject=Migration%20Blueprint%20Scope%20Discussion",
    },
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
    name: "MSP Partner",
    price: "From USD 399/month",
    priceAmountUsd: 399,
    pricePrefix: "from",
    billingCadence: "monthly",
    bestFor: "Consultants, MSPs and integrators who need repeatable assessments for client conversations.",
    accent: "partner",
    recommendedPayment: "card_checkout",
    paymentOptions: ["card_checkout", "bank_transfer_invoice"],
    futureProvider: "lemon_squeezy",
    disabledProvider: "stripe",
    cta: { label: "Become a partner", href: "/partners" },
    secondaryCta: {
      label: "Request partner invoice",
      href: "/support?category=partner_msp_inquiry&subject=MSP%20Partner%20Invoice",
    },
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
