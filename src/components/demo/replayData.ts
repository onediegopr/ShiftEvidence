import {
  AlertTriangle,
  BarChart3,
  Brain,
  CheckCircle2,
  ClipboardList,
  Database,
  FileSpreadsheet,
  FileText,
  Layers3,
  Network,
  Server,
  ShieldAlert,
  Waves,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type ReplaySeverity = "info" | "low" | "medium" | "high" | "critical" | "success";

export type ReplayStepId =
  | "upload"
  | "inventory"
  | "coverage"
  | "risk"
  | "matrix"
  | "sizing"
  | "waves"
  | "advisory"
  | "report";

export type EvidenceItem = {
  label: string;
  status: "Complete" | "Partial" | "Missing";
  detail: string;
};

export type RiskItem = {
  label: string;
  severity: ReplaySeverity;
  detail: string;
};

export type VmMatrixItem = {
  vm: string;
  role: string;
  complexity: "Low" | "Medium" | "High" | "Critical";
  action: string;
};

export type SizingItem = {
  label: string;
  value: string;
  note: string;
};

export type MigrationWave = {
  label: string;
  title: string;
  count: string;
  description: string;
};

export type AdvisoryItem = {
  title: string;
  body: string;
};

export type ReplayStep = {
  id: ReplayStepId;
  eyebrow: string;
  title: string;
  body: string;
  icon: LucideIcon;
};

export const acmeDataset = {
  client: "ACME Manufacturing Group",
  fileName: "rvtools_export_acme_corp.xlsx",
  vmCount: 126,
  hosts: 6,
  clusters: 3,
  datastores: 14,
  portGroups: 38,
  vlans: 22,
  snapshots: 19,
  oldSnapshots: 7,
  outdatedTools: 12,
  largeDiskVms: 4,
  multiNicVms: 9,
  possibleDomainControllers: 3,
  sqlErpWorkloads: 5,
  hotDatastores: 2,
  evidenceConfidence: 64,
  readinessScore: 71,
  waveOneCandidates: 38,
  highRiskWorkloads: 14,
  missingEvidenceItems: 8,
} as const;

export const replaySteps: ReplayStep[] = [
  {
    id: "upload",
    eyebrow: "Scene 01",
    title: "Upload Evidence",
    body: "Start with exported evidence. No agents. No production changes.",
    icon: FileSpreadsheet,
  },
  {
    id: "inventory",
    eyebrow: "Scene 02",
    title: "Parse VMware Inventory",
    body: "The RVTools-style export is normalized into infrastructure facts that can be reviewed and scored.",
    icon: Server,
  },
  {
    id: "coverage",
    eyebrow: "Scene 03",
    title: "Evidence Coverage",
    body: "The assessment separates what is known, what is partial, and what still needs validation.",
    icon: ClipboardList,
  },
  {
    id: "risk",
    eyebrow: "Scene 04",
    title: "Risk Engine",
    body: "Risk is calculated from evidence patterns and missing context, not from guesswork.",
    icon: ShieldAlert,
  },
  {
    id: "matrix",
    eyebrow: "Scene 05",
    title: "VM Complexity Matrix",
    body: "Not every VM should move in the same wave.",
    icon: Layers3,
  },
  {
    id: "sizing",
    eyebrow: "Scene 06",
    title: "Proxmox Target Sizing",
    body: "Sizing is framed as planning input, not final architecture sign-off.",
    icon: Database,
  },
  {
    id: "waves",
    eyebrow: "Scene 07",
    title: "Migration Waves",
    body: "Migration waves turn inventory into a controlled sequencing discussion.",
    icon: Waves,
  },
  {
    id: "advisory",
    eyebrow: "Scene 08",
    title: "AI Advisory Notes",
    body: "AI Advisory summarizes risks, gaps and next questions without replacing deterministic scores.",
    icon: Brain,
  },
  {
    id: "report",
    eyebrow: "Scene 09",
    title: "Final Report",
    body: "The final output is a decision-ready report: evidence, scores, risks, waves, assumptions and limitations.",
    icon: FileText,
  },
];

export const signalStream = [
  "Parsing vInfo...",
  "Parsing vCPU...",
  "Parsing vMemory...",
  "Parsing vDisk...",
  "Parsing vDatastore...",
  "Parsing vNetwork...",
  "Parsing vSnapshot...",
  "Normalizing inventory...",
];

export const inventoryResults = [
  { label: "VMs detected", value: "126" },
  { label: "ESXi hosts", value: "6" },
  { label: "Clusters", value: "3" },
  { label: "Datastores", value: "14" },
  { label: "Port groups", value: "38" },
  { label: "VLANs", value: "22" },
  { label: "Snapshots", value: "19" },
];

export const evidenceItems: EvidenceItem[] = [
  { label: "RVTools Inventory", status: "Complete", detail: "Inventory, CPU, memory, disk and snapshot exports loaded." },
  { label: "Backup Evidence", status: "Missing", detail: "No restore point or backup coverage export provided." },
  { label: "Application Dependencies", status: "Missing", detail: "No dependency map or application owner input provided." },
  { label: "Proxmox Target", status: "Partial", detail: "Target sizing assumptions exist, but final design is not validated." },
  { label: "Network Mapping", status: "Partial", detail: "Port groups and VLANs exist; bridge mapping still requires review." },
];

export const riskItems: RiskItem[] = [
  { label: "7 old snapshots", severity: "high", detail: "Snapshot age should be reviewed before wave planning." },
  { label: "12 outdated VMware Tools", severity: "medium", detail: "Guest readiness may require remediation." },
  { label: "4 VMs with disks above 2 TB", severity: "high", detail: "Large disks affect migration windows and backup planning." },
  { label: "9 multi-NIC VMs", severity: "medium", detail: "Network mapping needs extra validation." },
  { label: "3 possible domain controllers", severity: "critical", detail: "Identity workloads need a special plan." },
  { label: "5 SQL/ERP-like workloads", severity: "critical", detail: "Business critical systems should not be early-wave candidates." },
  { label: "2 datastores above 85%", severity: "high", detail: "Storage pressure may affect migration staging." },
  { label: "Backup evidence missing", severity: "critical", detail: "Restore points must be validated before critical workload movement." },
];

export const vmMatrix: VmMatrixItem[] = [
  { vm: "web-portal-01", role: "Web App", complexity: "Low", action: "Wave 1" },
  { vm: "fileserver-02", role: "File Server", complexity: "Medium", action: "Validate storage" },
  { vm: "sql-prod-01", role: "Database", complexity: "High", action: "Manual review" },
  { vm: "dc-main-01", role: "Domain Controller", complexity: "High", action: "Special plan" },
  { vm: "erp-prod", role: "ERP", complexity: "Critical", action: "Hold" },
];

export const sizingItems: SizingItem[] = [
  { label: "Recommended nodes", value: "3-4", note: "HA-ready baseline, subject to target design." },
  { label: "RAM target", value: "1.8-2.5 TB", note: "Based on allocation, not peak performance." },
  { label: "Usable storage", value: "70 TB+", note: "Requires backup and growth validation." },
  { label: "Backup capacity", value: "90 TB", note: "Estimate only; retention policy required." },
  { label: "HA readiness", value: "Conditional", note: "Depends on network and storage design." },
  { label: "Network readiness", value: "Requires mapping", note: "Port groups must map to target bridges/VLANs." },
];

export const migrationWaves: MigrationWave[] = [
  { label: "Wave 0", title: "Pilot", count: "4-6 VMs", description: "Non-critical candidates used to validate assumptions." },
  { label: "Wave 1", title: "Low-risk workloads", count: "38 candidates", description: "Simple web, utility and stateless workloads." },
  { label: "Wave 2", title: "Standard production", count: "44 candidates", description: "Production systems after backup and dependency validation." },
  { label: "Wave 3", title: "Critical systems", count: "14 review items", description: "Identity, database and ERP-like systems with special controls." },
  { label: "Hold", title: "Not ready", count: "8 evidence gaps", description: "Workloads blocked until missing evidence is resolved." },
  { label: "Retire", title: "Decommission candidates", count: "12 candidates", description: "VMs that should be reviewed before migration spend is allocated." },
];

export const advisoryItems: AdvisoryItem[] = [
  {
    title: "Executive advisory",
    body: "ACME has a viable first assessment path, but critical workloads should wait until backup and dependency evidence are validated.",
  },
  {
    title: "Technical advisory",
    body: "Large disks, multi-NIC systems and likely domain controllers need manual review before migration wave assignment.",
  },
  {
    title: "Confidence impact",
    body: "Evidence confidence is limited by missing backup coverage and application dependency mapping.",
  },
  {
    title: "Recommended next actions",
    body: "Provide backup evidence, identify application owners, and validate target networking before moving production workloads.",
  },
];

export const reportSections = [
  "Executive Summary",
  "Readiness Score",
  "Confidence Score",
  "Evidence Missing",
  "VM Risk Matrix",
  "Proxmox Sizing",
  "Migration Waves",
  "AI Advisory Notes",
  "Required Validations",
  "Next Steps",
];

export const whatYouGet = [
  { title: "Executive Decision Report", icon: FileText },
  { title: "Technical Assessment", icon: ClipboardList },
  { title: "VM Risk Matrix", icon: BarChart3 },
  { title: "Proxmox Sizing", icon: Server },
  { title: "Migration Wave Plan", icon: Waves },
  { title: "Evidence Missing Checklist", icon: CheckCircle2 },
  { title: "AI Advisory Notes", icon: Brain },
  { title: "PDF Report", icon: FileSpreadsheet },
];

export const demoDoesNotDo = [
  "It does not migrate VMs.",
  "It does not touch production.",
  "It does not guarantee zero downtime.",
  "It does not replace a pilot.",
  "It does not pretend to know evidence that was not provided.",
];

export const demoBadges = [
  "Simulated demo",
  "No agents required",
  "No production access",
  "Starts with RVTools",
  "Evidence-based",
];

export const safetyBadges = [
  { label: "No agents", icon: CheckCircle2 },
  { label: "No production access", icon: ShieldAlert },
  { label: "No credentials required", icon: Network },
  { label: "Synthetic dataset", icon: AlertTriangle },
];
