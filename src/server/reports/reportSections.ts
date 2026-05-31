export type ReportPreviewTriggerType =
  | "report_preview_viewed"
  | "unlock_report_clicked"
  | "unlock_pro_clicked"
  | "storage_addon_clicked"
  | "review_call_clicked";

export type ReportSectionAccess = "free" | "preview" | "locked";

export type ReportSectionRequirement =
  | "free"
  | "readiness_report"
  | "readiness_report_pro"
  | "storage_addon"
  | "technical_review"
  | null;

export type ReportSectionConfig = {
  key: string;
  title: string;
  description: string;
  visibleInFree: boolean;
  requirement: ReportSectionRequirement;
  whatYouGet: string;
  whyItMatters: string;
  ctaLabel: string;
  planLabel: string;
};

const planOrder: Record<string, number> = {
  free: 0,
  readiness_report: 1,
  readiness_report_pro: 2,
  custom_blueprint: 3,
  partner: 4,
};

export const reportSectionConfigs: ReportSectionConfig[] = [
  {
    key: "executive_summary",
    title: "Executive Summary Preview",
    description: "A concise view of the current readiness signal.",
    visibleInFree: true,
    requirement: "free",
    whatYouGet: "A short, stakeholder-friendly summary of the current migration signal.",
    whyItMatters: "Leadership needs a quick read before opening the full report.",
    ctaLabel: "View full executive summary",
    planLabel: "Free Preview",
  },
  {
    key: "technical_summary",
    title: "Technical Summary Preview",
    description: "A technical snapshot of inventory and evidence quality.",
    visibleInFree: true,
    requirement: "free",
    whatYouGet: "Inventory basis, parser notes, and technical caveats in one place.",
    whyItMatters: "Engineers need a compact technical summary before deeper review.",
    ctaLabel: "Unlock technical summary",
    planLabel: "Free Preview",
  },
  {
    key: "environment_summary",
    title: "Environment Summary",
    description: "VMs, hosts, datastores, snapshots and storage footprint.",
    visibleInFree: true,
    requirement: "free",
    whatYouGet: "A clear inventory snapshot of the current VMware estate.",
    whyItMatters: "This grounds the rest of the readiness narrative in measured evidence.",
    ctaLabel: "View environment summary",
    planLabel: "Free Preview",
  },
  {
    key: "cost_risk_summary",
    title: "Cost / Risk Summary",
    description: "The preliminary cost delta and readiness signal.",
    visibleInFree: true,
    requirement: "free",
    whatYouGet: "Preliminary savings, readiness score, and visible risk signals.",
    whyItMatters: "Cost / Risk is the core business value of the assessment.",
    ctaLabel: "Unlock full cost / risk report",
    planLabel: "Free Preview",
  },
  {
    key: "licensing_cost_exposure",
    title: "Licensing & Cost Exposure Analysis",
    description: "Financial exposure, pricing evidence and VMware/Broadcom vs Proxmox scenario quality.",
    visibleInFree: true,
    requirement: "readiness_report",
    whatYouGet: "A report-ready view of financial confidence, savings quality, pricing freshness, missing evidence and cost exposure findings.",
    whyItMatters: "Technical readiness and financial confidence are separate; leadership needs both before using savings as a decision driver.",
    ctaLabel: "Request Starter Readiness",
    planLabel: "Starter Readiness",
  },
  {
    key: "customer_context_intelligence",
    title: "Customer Context Intelligence",
    description: "Structured interpretation of client-provided business context, constraints, risks and validation questions.",
    visibleInFree: true,
    requirement: "readiness_report",
    whatYouGet: "Interpreted context summary, business priorities, constraints, customer-reported risks, validation items and next questions without printing the raw client narrative.",
    whyItMatters: "Customer narrative can change migration planning, but it must stay separate from confirmed technical evidence.",
    ctaLabel: "Request Starter Readiness",
    planLabel: "Starter Readiness",
  },
  {
    key: "top_findings",
    title: "Top Findings",
    description: "The most important risk signals currently available.",
    visibleInFree: true,
    requirement: "free",
    whatYouGet: "A short list of the highest-priority findings and recommendations.",
    whyItMatters: "Users should immediately see what could block or slow the migration.",
    ctaLabel: "Unlock more findings",
    planLabel: "Free Preview",
  },
  {
    key: "vm_risk_matrix",
    title: "VM-by-VM Risk Matrix",
    description: "Per-VM risk view with size, power state and recommendation.",
    visibleInFree: true,
    requirement: "readiness_report_pro",
    whatYouGet: "Full matrix, advanced filtering and export-ready structure.",
    whyItMatters: "A detailed matrix helps group workloads and prioritize migration waves.",
    ctaLabel: "Book Professional Assessment",
    planLabel: "Professional Assessment",
  },
  {
    key: "storage_readiness",
    title: "Storage Destination Readiness",
    description: "Target storage guidance and storage-specific considerations.",
    visibleInFree: false,
    requirement: "storage_addon",
    whatYouGet: "Storage-specific guidance, target architecture considerations and future scoring hooks.",
    whyItMatters: "Storage decisions can make or break the migration plan.",
    ctaLabel: "Discuss storage scope",
    planLabel: "Storage Scope Review",
  },
  {
    key: "migration_waves",
    title: "Migration Waves",
    description: "Suggested workload grouping and sequencing.",
    visibleInFree: false,
    requirement: "readiness_report_pro",
    whatYouGet: "Wave grouping, ordering and migration pacing in a future milestone.",
    whyItMatters: "Moving everything at once increases risk; waves reduce blast radius.",
    ctaLabel: "Book Professional Assessment",
    planLabel: "Professional Assessment",
  },
  {
    key: "proxmox_sizing",
    title: "Proxmox Sizing",
    description: "Sizing preview for the target platform.",
    visibleInFree: false,
    requirement: "readiness_report_pro",
    whatYouGet: "Sizing guidance and capacity-oriented hints in a future milestone.",
    whyItMatters: "Sizing guidance should come from the report, not from guesswork.",
    ctaLabel: "Book Professional Assessment",
    planLabel: "Professional Assessment",
  },
  {
    key: "technical_report",
    title: "Technical Report",
    description: "A deeper technical narrative for engineering review.",
    visibleInFree: false,
    requirement: "readiness_report",
    whatYouGet: "A fuller technical summary and evidence trail in the full report.",
    whyItMatters: "Engineers need a durable, reviewable record of the assessment.",
    ctaLabel: "Request Starter Readiness",
    planLabel: "Starter Readiness",
  },
  {
    key: "pdf_export",
    title: "PDF Export",
    description: "Executive-ready export in a future milestone.",
    visibleInFree: false,
    requirement: "readiness_report",
    whatYouGet: "A downloadable report artifact once PDF generation exists.",
    whyItMatters: "Stakeholders often want a shareable, printable output.",
    ctaLabel: "Request Starter Readiness",
    planLabel: "Starter Readiness",
  },
  {
    key: "review_call",
    title: "Technical Review",
    description: "Human review and advisory next-step support.",
    visibleInFree: false,
    requirement: "technical_review",
    whatYouGet: "A review-oriented advisory path in a future milestone.",
    whyItMatters: "Sometimes the right next step is a guided technical walkthrough.",
    ctaLabel: "Book Technical Review",
    planLabel: "Technical Review",
  },
];

export function getPlanRank(plan: string | null | undefined) {
  if (!plan) {
    return 0;
  }

  return planOrder[plan] ?? 0;
}

export function getSectionAccess(params: {
  assessmentPlan: string | null | undefined;
  section: ReportSectionConfig;
}): ReportSectionAccess {
  if (params.section.requirement === "free") {
    return "free" as const;
  }

  const planRank = getPlanRank(params.assessmentPlan);

  if (params.section.requirement === "readiness_report" && planRank >= planOrder.readiness_report) {
    return "preview" as const;
  }

  if (params.section.requirement === "readiness_report_pro" && planRank >= planOrder.readiness_report_pro) {
    return "preview" as const;
  }

  if (params.section.requirement === "technical_review" && planRank >= planOrder.custom_blueprint) {
    return "preview" as const;
  }

  if (params.section.requirement === "storage_addon" && planRank >= planOrder.partner) {
    return "preview" as const;
  }

  return params.section.visibleInFree ? "preview" : "locked";
}
