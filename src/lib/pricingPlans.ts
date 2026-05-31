export interface Plan {
  name: string;
  price: string;
  bestFor: string;
  accent: "free" | "core" | "pro" | "blueprint" | "partner";
  cta: {
    label: string;
    href: string;
  };
  includes: string[];
  excludes: string[];
  upsell?: string;
}

export const marketingPlans: Plan[] = [
  {
    name: "Free Readiness Check",
    price: "USD 0",
    bestFor: "Teams that want a first signal before committing budget.",
    accent: "free",
    cta: { label: "Start Free Assessment", href: "/sign-up" },
    includes: [
      "RVTools upload / guided intake",
      "Initial evidence coverage",
      "Basic readiness snapshot",
      "Limited risk preview",
      "Missing evidence checklist",
      "Client workspace",
    ],
    excludes: [
      "Full downloadable report",
      "VM-by-VM risk matrix",
      "Editable assumptions",
      "Deep recommendations",
      "Storage Destination Readiness",
      "Target architecture recommendation",
      "Review call",
    ],
    upsell: "Unlock the full Readiness Report to see detailed cost/risk, prioritized recommendations, and downloadable executive/technical output.",
  },
  {
    name: "Readiness Report",
    price: "USD 249",
    bestFor: "Teams that need a complete migration readiness report before taking action.",
    accent: "core",
    cta: { label: "Unlock Readiness Report", href: "/sign-up?plan=readiness-report" },
    includes: [
      "Everything in Free Readiness Check",
      "Full Cost / Risk Engine",
      "Downloadable report",
      "Executive summary",
      "Technical summary",
      "Detailed scoring",
      "Editable assumptions",
      "Prioritized recommendations",
      "Full risk findings",
      "Evidence confidence",
      "Annual and 3-year savings",
      "Subscription delta",
    ],
    excludes: [
      "Deep Storage Destination Readiness",
      "SAN / NAS / ZFS / Ceph / Hybrid target recommendation",
      "Implementation design",
      "Migration runbook",
      "Review call",
      "Automatic migration",
    ],
    upsell: "Upgrade to Readiness Report Pro to include deep storage analysis, Ceph suitability signals, and the AI Senior Advisor.",
  },
  {
    name: "Readiness Report Pro",
    price: "USD 690",
    bestFor: "MSPs, consultants and larger teams that need deeper technical segmentation and AI advice.",
    accent: "pro",
    cta: { label: "Upgrade to Pro", href: "/sign-up?plan=readiness-report-pro" },
    includes: [
      "Everything in Readiness Report",
      "Storage Destination Readiness Analysis",
      "Ceph suitability signals",
      "Proxmox/Ceph/PBS agentless evidence guidance",
      "Senior Migration Advisor access",
      "Project Memory Vault access",
      "VM-by-VM risk matrix",
      "Filters by criticality, size, host, cluster and datastore",
      "Migration complexity bands",
      "Workload group recommendations",
      "Remediation priority",
      "Advanced assumptions",
      "Executive and technical outputs",
    ],
    excludes: [
      "Final signed architecture design",
      "Implementation",
      "Production validation",
      "Managed migration",
      "Review call unless purchased",
    ],
    upsell: "Add a Technical Review Call or request a custom Migration Blueprint for guided wave execution planning.",
  },
  {
    name: "Migration Blueprint",
    price: "From USD 1,500",
    bestFor: "Teams preparing a serious migration plan with wave scheduling and rollbacks.",
    accent: "blueprint",
    cta: { label: "Request Migration Blueprint", href: "/support?category=partner_msp_inquiry&subject=Migration%20Blueprint" },
    includes: [
      "Everything in Readiness Report Pro",
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
    upsell: "Review the blueprint with your internal architecture board and external stakeholders.",
  },
  {
    name: "MSP / Partner",
    price: "From USD 399/month",
    bestFor: "Consultants, MSPs and integrators who need repeatable assessments for clients.",
    accent: "partner",
    cta: { label: "Become a Partner", href: "/partners" },
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
      "Automatic checkout endpoints",
    ],
    upsell: "Request Partner Access to unlock dedicated multi-client dashboards.",
  },
];

export const marketingAddOns = [
  {
    name: "Storage Destination Readiness",
    price: "USD 290",
    bestFor: "Teams that need to understand whether their target storage architecture is reasonable before migration.",
    cta: { label: "Add Storage Readiness", href: "/support?category=billing_question&subject=Storage%20Readiness%20Addon" },
    includes: [
      "Current storage review",
      "Target storage architecture analysis",
      "Agnostic destination recommendation",
      "SAN / NAS / NFS / iSCSI / ZFS / Ceph / Hybrid scenarios",
      "Ceph Suitability & Operations Readiness when relevant",
      "Storage risk level",
      "Proxmox compatibility considerations",
      "Missing storage evidence",
      "Migration impact",
      "Additional report section",
    ],
    excludes: [
      "Final implementation design",
      "Production benchmark",
      "Hardware procurement",
      "Storage configuration",
      "Managed operation",
      "Guaranteed performance validation",
      "Ceph as a default recommendation",
    ],
    upsell: "Included by default in the Readiness Report Pro.",
  },
  {
    name: "Technical Review Call",
    price: "USD 390",
    bestFor: "Teams that want a human review of the readiness findings before making a decision.",
    cta: { label: "Book Technical Review", href: "/support?category=general_question&subject=Technical%20Review%20Call" },
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
