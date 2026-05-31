import type { AdvisorMethodologyContextPreviewInput } from "../methodologyPromptPreview";

export const SYNTHETIC_ASSESSMENT_SUMMARY = {
  assessmentId: "synthetic-assessment-3d",
  environmentSummary:
    "Synthetic VMware to Proxmox assessment with 126 VMs, 6 ESXi hosts, partial Proxmox target data.",
  evidenceReceived: ["RVTools export", "client context form"],
  evidenceMissing: [
    "backup export",
    "application dependency map",
    "full Proxmox target export",
  ],
  keyRisks: [
    "old snapshots",
    "missing backup evidence",
    "multi-NIC VMs",
    "ERP critical workload",
    "unclear VLAN mapping",
  ],
  readinessScore: 64,
  confidenceScore: 58,
  migrationDecision: "conditional_go",
} satisfies NonNullable<AdvisorMethodologyContextPreviewInput["assessmentSummary"]>;

export const LOW_CONFIDENCE_ASSESSMENT_SUMMARY = {
  ...SYNTHETIC_ASSESSMENT_SUMMARY,
  environmentSummary:
    "Synthetic VMware to Proxmox assessment with acceptable readiness indicators but incomplete validation evidence.",
  evidenceMissing: [
    "dependency map",
    "target network validation",
    "application owner signoff",
  ],
  keyRisks: ["confidence is low", "missing evidence limits certainty"],
  readinessScore: 78,
  confidenceScore: 42,
} satisfies NonNullable<AdvisorMethodologyContextPreviewInput["assessmentSummary"]>;

export const CLEAN_ASSESSMENT_SUMMARY = {
  ...SYNTHETIC_ASSESSMENT_SUMMARY,
  keyRisks: [],
  evidenceMissing: [],
  migrationDecision: "unknown",
} satisfies NonNullable<AdvisorMethodologyContextPreviewInput["assessmentSummary"]>;

export const CONFIRMED_MEMORY_ITEMS = [
  {
    id: "memory-confirmed-wave-plan",
    title: "Conservative wave plan",
    content: "The team wants a conservative migration wave plan.",
    type: "constraint",
    status: "active",
  },
  {
    id: "memory-confirmed-domain-controllers",
    title: "Domain controller pilot constraint",
    content: "Domain controllers should not be included in the first pilot wave.",
    type: "decision",
    status: "confirmed",
  },
] satisfies NonNullable<AdvisorMethodologyContextPreviewInput["confirmedMemoryItems"]>;

export const NEEDS_REVIEW_MEMORY_ITEM = {
  id: "memory-needs-review-erp-first",
  title: "Pending ERP shortcut",
  content: "ERP can be migrated first without validation.",
  type: "decision",
  status: "needs_review",
} satisfies NonNullable<AdvisorMethodologyContextPreviewInput["confirmedMemoryItems"]>[number];

export const MEMORY_WITH_NEEDS_REVIEW = [
  ...CONFIRMED_MEMORY_ITEMS,
  NEEDS_REVIEW_MEMORY_ITEM,
] satisfies NonNullable<AdvisorMethodologyContextPreviewInput["confirmedMemoryItems"]>;
