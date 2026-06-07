export const trustBadges = [
  "Former VMware TAM-led readiness methodology",
  "No agents",
  "No mandatory credentials",
  "No production access",
  "Starts with RVTools + senior context",
  "Evidence-based scoring",
  "Guided questions and AI-assisted review",
  "Built for companies, MSPs and Proxmox consultants",
];

export const snapshotMetrics = [
  { label: "VMs analyzed", value: "126" },
  { label: "Risks identified", value: "21" },
  { label: "Evidence gaps", value: "8" },
  { label: "Wave-1 candidates", value: "38" },
];

export const evidenceBadges = ["No agents", "No credentials", "No production access"];

export const contextCards = [
  { title: "Project context", file: "migration_objectives.md", detail: "Business constraints and cutover goals" },
  { title: "Storage destination evidence", file: "storage_target_notes.xlsx", detail: "Target storage, HA and throughput notes" },
  { title: "Guided answers", file: "guided_intake.json", detail: "Senior context beyond RVTools" },
  { title: "Advisor review", file: "advisor_assumptions.md", detail: "Evidence-bound technical interpretation" },
];

export const riskSignals = [
  { label: "Backup evidence missing", severity: "Critical" },
  { label: "Old snapshots", severity: "High" },
  { label: "Large disks", severity: "High" },
  { label: "SQL / ERP-like workloads", severity: "Medium" },
];

export const confidenceGaps = ["Backup evidence", "Dependency map", "Performance history"];

export const advisorNotes = ["Pilot first", "Validate backups", "Confirm dependencies", "Delay ERP / DCs"];

export const migrationWaves = [
  { label: "Pilot", detail: "Safety rehearsal" },
  { label: "Wave 1", detail: "38 candidates" },
  { label: "Wave 2", detail: "Validated dependencies" },
  { label: "Hold", detail: "15 items" },
];

export const decisionPackSections = ["Summary", "Risk Matrix", "Advisor Notes", "Migration Waves", "Next Steps"];
