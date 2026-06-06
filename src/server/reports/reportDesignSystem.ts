export const REPORT_DESIGN_SYSTEM_VERSION = "REPORTS-UX-1";

export const REPORT_TYPES = [
  "starter_readiness_report",
  "professional_assessment_report",
  "migration_blueprint_report",
  "msp_white_label_report",
  "public_sample_report",
  "deep_technical_report",
] as const;

export type ReportDesignSystemType = (typeof REPORT_TYPES)[number];

export const REPORT_PAGE_ARCHITECTURE = [
  "Cover",
  "Executive Command Center",
  "Decision Summary",
  "Evidence Coverage",
  "Readiness and Confidence Scores",
  "Migration Readiness Radar",
  "Top Risks",
  "VM Classification",
  "Storage Readiness",
  "Network Readiness",
  "Backup Readiness",
  "Proxmox Target Readiness",
  "Migration Waves",
  "Pilot Candidates",
  "Hold / No-Go Items",
  "Required Validations",
  "Recommended Next Steps",
  "Appendix / Assumptions / Methodology",
] as const;

export const REPORT_VISUAL_COMPONENTS = [
  "Score Card",
  "Dual Score Card",
  "Evidence Badge",
  "Severity Badge",
  "Insight Card",
  "Risk Card",
  "Missing Evidence Card",
  "Decision Box",
  "Risk Heatmap",
  "Migration Readiness Radar",
  "Wave Timeline",
  "VM Archetype Card",
  "Evidence Coverage Matrix",
  "Proxmox Target Blueprint Diagram",
  "Before/After Block",
  "Action Plan Table",
  "Assumptions Box",
  "Methodology Note",
] as const;

export const REPORT_COLOR_SEMANTICS = {
  critical: { label: "Critical", color: "#b91c1c" },
  high: { label: "High", color: "#dc2626" },
  medium: { label: "Medium", color: "#d97706" },
  low: { label: "Low", color: "#15803d" },
  info: { label: "Info", color: "#2563eb" },
  missingEvidence: { label: "Missing Evidence", color: "#7c2d12" },
  partialEvidence: { label: "Partial Evidence", color: "#b45309" },
  confirmedEvidence: { label: "Confirmed Evidence", color: "#047857" },
  unknown: { label: "Unknown / Not Provided", color: "#64748b" },
} as const;

export const REPORT_COPY_RULE = "Finding -> Evidence -> Why it matters -> Recommendation -> Owner/action";
