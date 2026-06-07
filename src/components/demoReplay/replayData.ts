import {
  AlertTriangle,
  BarChart3,
  Boxes,
  BrainCircuit,
  ClipboardCheck,
  ClipboardList,
  Database,
  FileQuestion,
  FileSpreadsheet,
  FileText,
  FolderInput,
  GitBranch,
  Layers3,
  Network,
  Radar,
  Route,
  Server,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Waves,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type EvidenceStatus = "Complete" | "Received" | "Partial" | "Missing" | "Limited" | "Generated";
export type StepTone = "cyan" | "blue" | "amber" | "risk" | "teal" | "advisor" | "report";

export type ReplayStepId =
  | "opening"
  | "intake"
  | "context"
  | "parse"
  | "separation"
  | "confidence"
  | "risk"
  | "matrix"
  | "target"
  | "advisor"
  | "questions"
  | "waves"
  | "validations"
  | "assembly"
  | "decisionPack"
  | "final";

export type ReplayStep = {
  id: ReplayStepId;
  number: string;
  title: string;
  shortTitle: string;
  body: string;
  tone: StepTone;
  durationMs: number;
  icon: LucideIcon;
  leftTitle: string;
  leftBody: string;
  rightTitle: string;
};

export const northbridgeDataset = {
  customer: "Northbridge Industrial Group",
  fileName: "rvtools_export_northbridge_industrial.xlsx",
  inventory: {
    vms: "126",
    hosts: "6",
    clusters: "3",
    datastores: "14",
    portGroups: "38",
    vlans: "22",
    snapshots: "19",
    olderOs: "5",
  },
  scores: {
    readiness: 68,
    confidence: 64,
    decision: "Conditional Go",
  },
};

export const replaySteps: ReplayStep[] = [
  {
    id: "opening",
    number: "00",
    title: "Replay Opening",
    shortTitle: "Opening",
    body: "Senior-grade VMware -> Proxmox readiness before touching production.",
    tone: "cyan",
    durationMs: 8000,
    icon: Radar,
    leftTitle: "Why this matters",
    leftBody: "RVTools inventory, storage destination evidence, project context and Senior Advisor review become a migration decision pack.",
    rightTitle: "Trust boundary",
  },
  {
    id: "intake",
    number: "01",
    title: "Evidence Intake",
    shortTitle: "Evidence Intake",
    body: "Start with RVTools inventory. Add senior context and supporting evidence when confidence matters.",
    tone: "cyan",
    durationMs: 9000,
    icon: FileSpreadsheet,
    leftTitle: "Intake logic",
    leftBody: "RVTools starts the assessment, but it is not the whole assessment. Context and evidence quality determine confidence.",
    rightTitle: "Evidence received",
  },
  {
    id: "context",
    number: "02",
    title: "Project Context + Additional Files",
    shortTitle: "Context + Files",
    body: "The replay does not rely on inventory alone. Project context, destination evidence and user-provided files shape the decision.",
    tone: "amber",
    durationMs: 11000,
    icon: FolderInput,
    leftTitle: "Why context matters",
    leftBody: "Inventory does not reveal business criticality, downtime tolerance, storage destination intent or dependency ownership.",
    rightTitle: "Received / missing",
  },
  {
    id: "parse",
    number: "03",
    title: "Inventory Parsing",
    shortTitle: "Parsing",
    body: "RVTools establishes infrastructure inventory. Context and additional evidence determine confidence.",
    tone: "blue",
    durationMs: 10000,
    icon: Server,
    leftTitle: "Parsing scope",
    leftBody: "The export is normalized into facts that can be scored, reviewed and connected to migration planning logic.",
    rightTitle: "Inventory scope",
  },
  {
    id: "separation",
    number: "04",
    title: "Evidence Separation",
    shortTitle: "Evidence Split",
    body: "We separate what is confirmed, what is probable and what still requires validation.",
    tone: "amber",
    durationMs: 10000,
    icon: GitBranch,
    leftTitle: "Decision logic",
    leftBody: "Confirmed facts, probable findings and missing evidence should not be mixed into one false certainty score.",
    rightTitle: "Evidence state",
  },
  {
    id: "confidence",
    number: "05",
    title: "Evidence Confidence",
    shortTitle: "Confidence",
    body: "Confidence is not assumed. It changes based on the evidence provided.",
    tone: "teal",
    durationMs: 9500,
    icon: Radar,
    leftTitle: "Confidence model",
    leftBody: "Project context improves guidance. Missing backup and dependency evidence limit critical-wave confidence.",
    rightTitle: "Confidence impact",
  },
  {
    id: "risk",
    number: "06",
    title: "Risk Engine",
    shortTitle: "Risk Engine",
    body: "Risk signals are interpreted with infrastructure evidence and project context.",
    tone: "risk",
    durationMs: 12000,
    icon: ShieldAlert,
    leftTitle: "Risk interpretation",
    leftBody: "Risk is assembled from evidence, storage posture, VM patterns and business context, not invented.",
    rightTitle: "Risk counters",
  },
  {
    id: "matrix",
    number: "07",
    title: "VM Complexity Matrix",
    shortTitle: "VM Matrix",
    body: "The assessment does not only classify VMs. It changes treatment based on business context.",
    tone: "blue",
    durationMs: 10500,
    icon: BarChart3,
    leftTitle: "Treatment logic",
    leftBody: "A low-risk web app, a domain controller and an ERP system should not enter the same migration wave.",
    rightTitle: "Classification",
  },
  {
    id: "target",
    number: "08",
    title: "Target / Storage Readiness",
    shortTitle: "Target Readiness",
    body: "Destination evidence turns migration planning from can we import into can the target safely receive these workloads.",
    tone: "teal",
    durationMs: 10500,
    icon: Database,
    leftTitle: "Storage destination",
    leftBody: "Target sizing is conditional until storage topology, backup target and performance history are validated.",
    rightTitle: "Sizing confidence",
  },
  {
    id: "advisor",
    number: "09",
    title: "Senior Migration Advisor Review",
    shortTitle: "Advisor Review",
    body: "The Advisor turns signals, gaps and project context into migration guidance.",
    tone: "advisor",
    durationMs: 12000,
    icon: BrainCircuit,
    leftTitle: "Advisor reasoning",
    leftBody: "Pilot low-risk services first. Delay ERP and domain controllers until backup and dependencies are validated.",
    rightTitle: "Advisor inputs",
  },
  {
    id: "questions",
    number: "10",
    title: "Guided Questions + AI-assisted Review",
    shortTitle: "Guided Review",
    body: "Guided questions make missing context visible before production is touched.",
    tone: "advisor",
    durationMs: 12000,
    icon: FileQuestion,
    leftTitle: "Guided discovery",
    leftBody: "AI-assisted review helps surface questions and update context, without pretending missing evidence was validated.",
    rightTitle: "Context updates",
  },
  {
    id: "waves",
    number: "11",
    title: "Migration Waves",
    shortTitle: "Waves",
    body: "The Advisor changes the wave plan based on evidence, gaps and business context.",
    tone: "cyan",
    durationMs: 11000,
    icon: Waves,
    leftTitle: "Advisor wave logic",
    leftBody: "Move low-risk internal services first. Block critical systems until backup, dependency and rollback evidence is validated.",
    rightTitle: "Blocked items",
  },
  {
    id: "validations",
    number: "12",
    title: "Required Validations",
    shortTitle: "Validations",
    body: "Missing evidence becomes required validation, not a hidden weakness.",
    tone: "amber",
    durationMs: 10000,
    icon: ClipboardCheck,
    leftTitle: "Validation gates",
    leftBody: "Critical waves remain blocked until backup and dependency evidence are validated.",
    rightTitle: "Next evidence",
  },
  {
    id: "assembly",
    number: "13",
    title: "Report Assembly",
    shortTitle: "Report Assembly",
    body: "The output is a senior-grade decision pack, not just a dashboard screenshot.",
    tone: "report",
    durationMs: 10500,
    icon: FileText,
    leftTitle: "Report purpose",
    leftBody: "Executive review, technical planning, MSP pre-sales and migration readiness review use the same evidence trail.",
    rightTitle: "Generated sections",
  },
  {
    id: "decisionPack",
    number: "14",
    title: "Downloadable Decision Pack",
    shortTitle: "Decision Pack",
    body: "The final deliverable is not a dashboard screenshot. It is a decision pack your technical team, executive sponsor or MSP client can review.",
    tone: "report",
    durationMs: 11500,
    icon: ClipboardList,
    leftTitle: "What the report is for",
    leftBody: "Ready for executive review, technical planning and migration decision-making.",
    rightTitle: "Download pack includes",
  },
  {
    id: "final",
    number: "15",
    title: "Executive Decision / Final CTA",
    shortTitle: "Final Decision",
    body: "Senior-grade VMware -> Proxmox readiness before touching production.",
    tone: "report",
    durationMs: 10500,
    icon: ShieldCheck,
    leftTitle: "Advisor summary",
    leftBody: "Pilot first. Validate backups. Confirm dependencies. Delay ERP and domain controllers. Do not migrate blind.",
    rightTitle: "Decision",
  },
];

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

export const impactMetrics = [
  ["Risk discovery", "21 findings"],
  ["Wave planning", "6 mapped phases"],
  ["Evidence confidence", "64 / 100"],
  ["VMs analyzed", "126 workloads"],
  ["Decision", "Conditional Go"],
] as const;

export const userProvidedFiles = [
  "network_diagram_northbridge.pdf",
  "storage_target_notes.xlsx",
  "migration_objectives.md",
  "app_criticality.csv",
  "maintenance_windows.csv",
];

export const guidedAnswers = [
  ["Business driver", "VMware exit / licensing pressure"],
  ["Downtime tolerance", "Limited by workload"],
  ["Target platform", "Proxmox cluster under design"],
  ["Preferred first wave", "Low-risk internal services"],
  ["Critical workloads", "ERP, SQL, domain controllers"],
  ["Maintenance", "Weekend window available for Wave 1"],
] as const;

export const evidenceItems = [
  ["RVTools Inventory", "Complete", "Inventory, VM flags, snapshots, datastore and network objects."],
  ["Project Context", "Received", "Business driver, critical workloads and pilot preference supplied."],
  ["Storage Destination Evidence", "Partial", "Target storage worksheet received; final topology still needs validation."],
  ["Maintenance Windows", "Received", "Wave 1 weekend maintenance window supplied."],
  ["Application Criticality", "Partial", "ERP, SQL and domain controllers identified; owner confirmation pending."],
  ["Network Mapping", "Partial", "Network diagram supplied; Proxmox bridge mapping requires review."],
  ["Backup Evidence", "Missing", "No restore point or coverage export supplied."],
  ["Historical Performance", "Missing", "CPU, RAM, IOPS, latency and throughput history not supplied."],
  ["Dependency Map", "Missing", "No application dependency map supplied."],
] satisfies Array<[string, EvidenceStatus, string]>;

export const contextReceived = ["Project context form", "Maintenance windows", "Storage target notes"];
export const contextMissing = ["Backup export", "Dependency map", "Performance history"];

export const confirmedFindings = [
  "RVTools inventory received",
  "CPU / RAM allocation",
  "Disk allocation",
  "Datastores detected",
  "Snapshots detected",
  "Maintenance windows received",
  "Storage target notes received",
];

export const probableFindings = [
  "Possible domain controllers",
  "SQL / ERP-like workloads",
  "Multi-NIC complexity",
  "Storage-heavy candidates",
  "Older OS candidates",
  "Candidate pilot group",
];

export const missingFindings = [
  "Backup evidence not provided",
  "Dependency map not provided",
  "Historical performance missing",
  "Proxmox target partially validated",
  "Critical app owner confirmation pending",
];

export const riskFindings = [
  ["Backup evidence missing", "Critical"],
  ["3 possible domain controllers", "Critical"],
  ["5 SQL / ERP-like workloads", "Critical"],
  ["ERP marked business-critical from project context", "Critical"],
  ["7 old snapshots", "High"],
  ["4 VMs with disks above 2 TB", "High"],
  ["2 datastores above 85%", "High"],
  ["Maintenance window required before production waves", "High"],
  ["9 multi-NIC VMs", "Medium"],
  ["12 outdated VMware Tools", "Medium"],
  ["6 VMs with network mapping gaps", "Medium"],
] satisfies Array<[string, "Critical" | "High" | "Medium" | "Info"]>;

export const vmMatrix = [
  ["web-portal-01", "Web App", "Low", "Low", "Wave 1"],
  ["fileserver-02", "File Server", "Medium", "Medium", "Validate storage"],
  ["sql-prod-01", "Database", "High", "High", "Manual review + backup validation"],
  ["dc-main-01", "Domain Controller", "High", "High", "Special plan + rebuild option review"],
  ["erp-prod", "ERP", "Critical", "Critical", "Hold until dependencies confirmed"],
] as const;

export const classificationSummary = [
  "38 low-complexity candidates",
  "51 standard validation workloads",
  "22 manual review workloads",
  "15 not recommended for first wave",
];

export const targetSizing = [
  ["Recommended nodes", "3-4"],
  ["RAM target", "1.8-2.5 TB"],
  ["Usable storage target", "70 TB+"],
  ["Backup capacity target", "90 TB"],
  ["HA readiness", "Conditional"],
  ["Network readiness", "Requires validation"],
  ["Storage readiness", "Conditional"],
  ["Sizing confidence", "Medium"],
] as const;

export const advisorInputs = ["RVTools inventory", "Project context", "Storage destination evidence", "Risk engine findings", "Evidence gaps", "Maintenance windows"];

export const advisorObservations = [
  "Do not start with ERP or domain controllers",
  "Backup evidence missing blocks critical production waves",
  "Storage-heavy workloads require manual validation",
  "Low-risk internal services are good pilot candidates",
  "Dependency mapping is required before Wave 3",
  "Target readiness remains conditional",
];

export const guidedQuestions = [
  "Which workloads are tied to ERP, billing or customer-facing services?",
  "Are recent restore points available for SQL, ERP and file servers?",
  "Should domain controllers be migrated, rebuilt or handled with a special plan?",
  "Are VLAN mappings confirmed on the Proxmox target?",
  "What maintenance windows are available for Wave 2 and Wave 3?",
  "Which workloads can be retired or rebuilt instead of migrated?",
];

export const sampleAnswers = [
  "ERP is business-critical",
  "SQL requires backup validation",
  "Domain controllers require special plan",
  "Low-risk internal tools can be piloted first",
  "Weekend maintenance window available for Wave 1",
];

export const advisorOutputs = ["Context updated", "Wave plan adjusted", "Required validations added", "Confidence unchanged until backup evidence is supplied"];

export const migrationWaves = [
  ["Wave 0 - Pilot", "3 low-risk internal VMs", "Validate import path, network mapping, backup / restore and boot checks."],
  ["Wave 1 - Low Risk", "Web apps, test/dev, non-critical internal services", "Advisor note: good first wave after pilot."],
  ["Wave 2 - Standard Production", "App servers and internal tools with validated storage", "Advisor note: require confirmed maintenance window."],
  ["Wave 3 - Critical Systems", "SQL, ERP, domain controllers, file servers", "Only after backup evidence, dependencies and rollback plan are validated."],
  ["Hold", "ERP, unknown dependencies, missing backup evidence", "Storage-heavy workloads wait for validation."],
  ["Retire / Rebuild", "Older or non-strategic workloads", "Avoid moving technical debt by default."],
] as const;

export const requiredValidations = [
  "Validate backup coverage and recent restore points",
  "Confirm application dependencies for ERP and SQL workloads",
  "Review domain controllers under a dedicated migration or rebuild plan",
  "Validate storage-heavy VMs individually",
  "Confirm Proxmox target capacity, HA and network assumptions",
  "Execute pilot wave before critical systems",
  "Confirm maintenance windows with application owners",
  "Collect missing dependency map before Wave 3",
];

export const reportSections = [
  "Executive Summary",
  "Evidence Received",
  "User-Provided Context",
  "Evidence Missing",
  "Readiness Score",
  "Evidence Confidence Score",
  "VM Complexity Matrix",
  "Target / Storage Readiness",
  "Senior Migration Advisor Notes",
  "Guided Questions",
  "Migration Waves",
  "No-Go Items",
  "Required Validations",
  "Next Evidence to Collect",
];

export const reportStatuses = [
  ["Senior Advisor Notes", "Generated"],
  ["Guided Questions", "Generated"],
  ["Evidence Missing", "Generated"],
  ["Backup Evidence", "Limited"],
  ["Dependency Map", "Missing"],
] satisfies Array<[string, EvidenceStatus]>;

export const decisionPackItems = [
  "Executive PDF Report",
  "Technical Assessment",
  "Evidence Matrix",
  "VM Risk Matrix",
  "Proxmox Target / Storage Readiness",
  "Senior Migration Advisor Notes",
  "Guided Questions",
  "Required Validations",
  "Migration Waves",
  "Next Evidence to Collect",
];

export const reportPreviewPages = [
  "Executive Summary",
  "Readiness + Confidence Scores",
  "Top Risks",
  "Evidence Missing",
  "VM Complexity Matrix",
  "Advisor Notes",
  "Guided Questions",
  "Migration Waves",
  "Required Validations",
  "Next Steps",
];

export const beforeItems = [
  "RVTools with thousands of rows",
  "Unknown workload criticality",
  "Hidden snapshots",
  "Storage risk buried in tabs",
  "Network mapping unclear",
  "No migration order",
];

export const afterItems = [
  "126 VMs analyzed",
  "21 migration risks identified",
  "38 wave-1 candidates",
  "14 high-risk workloads",
  "8 missing evidence items",
  "Migration plan generated",
  "Advisor notes generated",
  "Downloadable decision pack prepared",
];

export const outputCards = [
  ["Executive Decision Report", "Boardroom-ready summary with readiness posture, key risks and next decisions.", FileText],
  ["Technical Assessment", "Detailed infrastructure analysis for VM flags, storage, network, backup and Proxmox target assumptions.", ClipboardList],
  ["VM Risk Matrix", "VM-by-VM classification mapping workloads to complexity, risk level and recommended migration treatment.", BarChart3],
  ["Proxmox Target / Storage Readiness", "Destination sizing, storage readiness, HA assumptions and network readiness signals.", Server],
  ["Migration Wave Plan", "A phased plan grouping workloads into pilot, low-risk, standard production, critical systems, hold and retire/rebuild.", Route],
  ["Evidence Missing Checklist", "A prioritized list of missing backup, dependency, performance or target evidence that affects confidence.", ClipboardCheck],
  ["Required Validations", "Actionable validation list before production workloads move.", ShieldCheck],
  ["Senior Migration Advisor Notes", "Former VMware TAM-led interpretation of risk, wave blockers and migration sequencing.", BrainCircuit],
  ["Guided Questions", "Structured questions that surface missing business, application and operational context.", FileQuestion],
  ["Downloadable Decision Pack", "A full report bundle for leadership, client review, technical planning and MSP pre-sales.", FileSpreadsheet],
] satisfies Array<[string, string, LucideIcon]>;

export const evidenceLibraryCards = [
  ["RVTools Inventory", "RVTools export", "improves inventory scope", "VM risk matrix", Database],
  ["Project Context Form", "Guided context", "improves decision logic", "Advisor notes", ClipboardList],
  ["User-Provided Files", "PDF, XLSX, CSV, MD", "improves project context", "evidence trail", FolderInput],
  ["Storage Destination Evidence", "Storage notes", "improves target readiness", "storage constraints", Layers3],
  ["Proxmox Target Evidence", "Node and HA design", "improves target fit", "sizing assumptions", Server],
  ["Network Diagram", "Network diagram", "improves bridge mapping", "VLAN validation", Network],
  ["Application Criticality", "Criticality CSV", "improves wave treatment", "business risk context", ShieldAlert],
  ["Backup Evidence", "Backup export", "improves confidence", "restore readiness", ShieldCheck],
  ["Dependency Map", "Application map", "improves wave sequence", "critical workload handling", GitBranch],
  ["Performance History", "Metrics export", "improves sizing", "CPU, RAM and IOPS confidence", BarChart3],
  ["Guided Questions", "Senior context", "improves missing evidence", "required validations", FileQuestion],
  ["Senior Advisor Review", "Evidence review", "improves decision quality", "migration guidance", BrainCircuit],
] satisfies Array<[string, string, string, string, LucideIcon]>;

export const integrityCards = [
  ["No production writes", "We analyze exported metadata offline. No write permissions, no production agents.", ShieldCheck],
  ["No automated migration theater", "We do not move VMs or orchestrate conversions. Execution belongs to validated tools and experienced engineers.", Boxes],
  ["No fake zero-downtime promise", "Downtime minimization requires pilot testing, storage sync planning and rollback drills.", AlertTriangle],
  ["No guesswork when evidence is missing", "If backup logs, disk metrics or topology signals are absent, we flag the gap and reduce confidence instead of inventing answers.", ClipboardCheck],
  ["No single magic score", "Readiness and confidence are shown separately so the decision is defensible.", Sparkles],
] satisfies Array<[string, string, LucideIcon]>;
