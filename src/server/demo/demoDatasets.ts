export const DEMO_WORKSPACE_ROUTE = "/demo";
export const DEMO_USER_EMAIL = "demo@shiftevidence.com";

export type DemoScenario = {
  slug: string;
  name: string;
  description: string;
  badges: string[];
  vmCount: number;
  hostCount: number;
  datastoreCount: number;
  readinessScore: number;
  confidenceScore: number;
  mainRisk: string;
  evidenceReceived: string[];
  evidenceMissing: string[];
  topRisks: string[];
  recommendations: string[];
  migrationWaves: Array<{
    label: string;
    title: string;
    description: string;
    workloadCount: string;
  }>;
  advisorTranscript: Array<{
    question: string;
    answer: string;
  }>;
  report: {
    filename: string;
    downloadPath: string;
  };
  disclaimer: string;
  paidCta: string;
};

const sharedDisclaimer =
  "Synthetic Demo Report. Generated from synthetic sample data. Not based on a real company or real infrastructure.";

export const demoWorkspaceCopy = {
  title: "Explore a complete Demo Workspace before purchasing.",
  subtitle:
    "See how Shift Evidence turns synthetic VMware evidence into readiness scores, risk matrices, migration waves, business continuity findings, cost exposure, Advisor notes and downloadable reports.",
  intro:
    "A read-only sample workspace built with synthetic infrastructure data. It lets you explore the structure, methodology and outputs of a Shift Evidence assessment before purchasing.",
  disabled:
    "Uploads, edits, live AI Advisor, billing, admin and assessment creation are intentionally disabled in Demo Workspace.",
};

export const demoScenarios: DemoScenario[] = [
  {
    slug: "balanced-mid-market",
    name: "Balanced Mid-Market VMware Exit",
    description: "A typical mid-market VMware estate with normal gaps, moderate risk and a practical migration path.",
    badges: ["Primary demo", "Balanced risk", "Cost exposure"],
    vmCount: 74,
    hostCount: 5,
    datastoreCount: 9,
    readinessScore: 76,
    confidenceScore: 68,
    mainRisk: "Moderate evidence gaps",
    evidenceReceived: ["RVTools inventory", "Basic technical context", "Partial Proxmox target sizing", "Storage summary"],
    evidenceMissing: ["Application dependency map", "Formal restore validation", "Detailed network bridge mapping"],
    topRisks: ["A few large disks need wave planning", "Backup proof is incomplete", "Network mapping requires owner review"],
    recommendations: ["Start with a non-critical pilot", "Validate backup restore evidence", "Confirm target storage design before production waves"],
    migrationWaves: [
      { label: "Wave 0", title: "Pilot", workloadCount: "6 VMs", description: "Validate import, rollback and operator runbook with low-risk services." },
      { label: "Wave 1", title: "Standard workloads", workloadCount: "28 VMs", description: "Move simple web, utility and test workloads after pilot acceptance." },
      { label: "Wave 2", title: "Production apps", workloadCount: "31 VMs", description: "Requires backup and network evidence to be confirmed." },
      { label: "Hold", title: "Manual review", workloadCount: "9 VMs", description: "Large disks, database-like workloads and incomplete dependency mapping." },
    ],
    advisorTranscript: [
      { question: "Which workloads should not be in the first migration wave?", answer: "Database-like, large-disk and dependency-unknown workloads should wait until backup restore proof and application owner validation are complete." },
      { question: "Why is confidence lower than readiness?", answer: "The inventory is usable, but backup, dependency and final target mapping evidence are incomplete. Readiness can be promising while confidence remains conditional." },
      { question: "What evidence should we collect next?", answer: "Collect restore validation, application dependency mapping and final Proxmox storage/network design." },
    ],
    report: { filename: "balanced-mid-market-demo-report.pdf", downloadPath: "/demo/reports/balanced-mid-market" },
    disclaimer: sharedDisclaimer,
    paidCta: "Start a paid assessment to upload your own RVTools export and generate a private decision pack.",
  },
  {
    slug: "storage-risk-heavy",
    name: "Storage Risk Heavy",
    description: "Storage pressure, large disks and destination uncertainty make storage design the decision gate.",
    badges: ["Storage-heavy", "Conditional Go", "Ceph caution"],
    vmCount: 96,
    hostCount: 8,
    datastoreCount: 12,
    readinessScore: 58,
    confidenceScore: 63,
    mainRisk: "Storage destination risk",
    evidenceReceived: ["RVTools inventory", "Storage/SAN summary", "Growth assumptions", "Partial target preference"],
    evidenceMissing: ["Dedicated storage network evidence", "OSD/failure-domain design", "PBS capacity proof"],
    topRisks: ["Datastores above 85% utilization", "Large disks increase migration windows", "Ceph is not justified without design evidence"],
    recommendations: ["Run storage design review", "Validate PBS and shared storage plan", "Treat Ceph as conditional, not default"],
    migrationWaves: [
      { label: "Wave 0", title: "Storage pilot", workloadCount: "4 VMs", description: "Measure backup, restore and storage behavior before wider planning." },
      { label: "Wave 1", title: "Small stateless workloads", workloadCount: "18 VMs", description: "Only after capacity pressure is remediated." },
      { label: "Wave 2", title: "Storage-sensitive workloads", workloadCount: "42 VMs", description: "Requires target storage validation." },
      { label: "Hold", title: "Large-disk workloads", workloadCount: "32 VMs", description: "Hold until growth, PBS and destination evidence are complete." },
    ],
    advisorTranscript: [
      { question: "Is Ceph recommended for this environment?", answer: "No default recommendation is made. Ceph remains conditional until node count, OSD layout, network design and operational capability are proven." },
      { question: "What is the main business continuity risk?", answer: "Capacity pressure and unproven destination storage may extend migration windows or create rollback pressure." },
      { question: "What should we validate first?", answer: "Validate storage network, PBS capacity, shared storage requirements and failure-domain design." },
    ],
    report: { filename: "storage-risk-heavy-demo-report.pdf", downloadPath: "/demo/reports/storage-risk-heavy" },
    disclaimer: sharedDisclaimer,
    paidCta: "Use a paid assessment to validate real storage evidence and target architecture.",
  },
  {
    slug: "backup-evidence-missing",
    name: "Backup Evidence Missing",
    description: "A technically migrable estate whose confidence is constrained by missing restore evidence.",
    badges: ["Backup gap", "Low confidence", "RPO/RTO"],
    vmCount: 42,
    hostCount: 4,
    datastoreCount: 6,
    readinessScore: 69,
    confidenceScore: 42,
    mainRisk: "Missing backup proof",
    evidenceReceived: ["RVTools inventory", "Basic workload labels", "Snapshot inventory"],
    evidenceMissing: ["Backup coverage export", "Restore-point evidence", "RPO/RTO validation", "Backup repository capacity"],
    topRisks: ["Critical workloads cannot be approved without restore proof", "Snapshots may hide backup process gaps", "RPO/RTO assumptions are unknown"],
    recommendations: ["Collect Veeam or backup export", "Validate restore tests", "Block critical production waves until proof exists"],
    migrationWaves: [
      { label: "Wave 0", title: "Evidence collection", workloadCount: "All critical VMs", description: "Collect backup and restore proof before production planning." },
      { label: "Wave 1", title: "Non-critical pilot", workloadCount: "8 VMs", description: "Move only after rollback method is documented." },
      { label: "Hold", title: "Critical workloads", workloadCount: "16 VMs", description: "Do not move until backup evidence is validated." },
    ],
    advisorTranscript: [
      { question: "How does missing backup evidence affect the migration plan?", answer: "It lowers confidence and keeps critical workloads out of production waves until restore validation is documented." },
      { question: "Can readiness be acceptable while confidence is low?", answer: "Yes. The inventory can look technically manageable, but missing recovery proof makes the recommendation conditional." },
      { question: "What evidence should we collect next?", answer: "Backup job status, restore points, repository capacity and at least one documented restore test." },
    ],
    report: { filename: "backup-evidence-missing-demo-report.pdf", downloadPath: "/demo/reports/backup-evidence-missing" },
    disclaimer: sharedDisclaimer,
    paidCta: "Start a paid assessment to upload backup evidence and increase decision confidence.",
  },
  {
    slug: "critical-sql-erp",
    name: "Critical SQL / ERP Workloads",
    description: "A conservative scenario with database, ERP, identity and file services that require human review.",
    badges: ["Critical workloads", "BC risk", "Hold list"],
    vmCount: 68,
    hostCount: 6,
    datastoreCount: 8,
    readinessScore: 54,
    confidenceScore: 61,
    mainRisk: "Business continuity risk",
    evidenceReceived: ["RVTools inventory", "Critical workload labels", "Partial maintenance windows", "Basic backup notes"],
    evidenceMissing: ["Application dependencies", "SQL performance baselines", "Rollback owner approval"],
    topRisks: ["SQL and ERP should not be early-wave candidates", "Identity systems need special handling", "Maintenance windows require business approval"],
    recommendations: ["Create Wave 0 pilot", "Hold SQL/ERP until dependency mapping", "Document rollback and owner approval"],
    migrationWaves: [
      { label: "Wave 0", title: "Pilot only", workloadCount: "5 VMs", description: "Use low-impact candidates to validate process." },
      { label: "Wave 1", title: "Utility workloads", workloadCount: "17 VMs", description: "Move after dependency review." },
      { label: "Wave 3", title: "Critical production", workloadCount: "22 VMs", description: "SQL, ERP, identity and file services require manual validation." },
      { label: "Hold", title: "Business-critical", workloadCount: "9 VMs", description: "Hold until RPO/RTO and rollback are approved." },
    ],
    advisorTranscript: [
      { question: "What should we validate before moving SQL workloads?", answer: "Validate backup restore, performance baseline, application dependencies, maintenance windows and rollback ownership." },
      { question: "Which workloads should not be in Wave 1?", answer: "SQL, ERP, domain controllers and shared file services should be excluded from early waves." },
      { question: "Which findings require human review?", answer: "Critical workload classification, downtime tolerance, and dependency mapping all require human approval." },
    ],
    report: { filename: "critical-sql-erp-demo-report.pdf", downloadPath: "/demo/reports/critical-sql-erp" },
    disclaimer: sharedDisclaimer,
    paidCta: "Use a paid assessment for critical workload planning and stakeholder-ready reporting.",
  },
  {
    slug: "proxmox-target-partial",
    name: "Proxmox Target Partial Readiness",
    description: "The VMware source is partially migrable, but the target Proxmox design is not complete enough.",
    badges: ["Target readiness", "PBS gap", "Conditional Go"],
    vmCount: 58,
    hostCount: 6,
    datastoreCount: 7,
    readinessScore: 62,
    confidenceScore: 66,
    mainRisk: "Target architecture incomplete",
    evidenceReceived: ["RVTools inventory", "Initial Proxmox node count", "Partial HA plan", "Storage preference"],
    evidenceMissing: ["Final PBS plan", "Bridge/VLAN mapping", "Capacity headroom proof", "HA test evidence"],
    topRisks: ["Destination capacity may be insufficient", "PBS readiness is incomplete", "Network mapping is not validated"],
    recommendations: ["Remediate target sizing", "Validate HA/PBS", "Confirm network bridge design before migration"],
    migrationWaves: [
      { label: "Wave 0", title: "Target validation", workloadCount: "Infrastructure only", description: "Validate target HA, storage and backup design." },
      { label: "Wave 1", title: "Small workloads", workloadCount: "14 VMs", description: "Only after target readiness gates pass." },
      { label: "Hold", title: "Capacity-sensitive", workloadCount: "24 VMs", description: "Hold until destination capacity is proven." },
    ],
    advisorTranscript: [
      { question: "Is the Proxmox target ready?", answer: "It is partially ready. HA intent exists, but PBS, capacity headroom and network bridge mapping are not proven." },
      { question: "What blocks production migration?", answer: "Target storage, backup and network evidence are the main blockers." },
      { question: "What should be remediated first?", answer: "Finalize target sizing, PBS design and VLAN/bridge mapping." },
    ],
    report: { filename: "proxmox-target-partial-demo-report.pdf", downloadPath: "/demo/reports/proxmox-target-partial" },
    disclaimer: sharedDisclaimer,
    paidCta: "Start a paid assessment to validate source and target readiness together.",
  },
  {
    slug: "msp-client-sample",
    name: "MSP Client Sample",
    description: "A client-ready sample for consultants and MSPs who need repeatable readiness evidence.",
    badges: ["MSP", "Client-ready", "Partner workflow"],
    vmCount: 33,
    hostCount: 3,
    datastoreCount: 5,
    readinessScore: 82,
    confidenceScore: 74,
    mainRisk: "Client evidence follow-up",
    evidenceReceived: ["RVTools inventory", "Client business context", "Backup summary", "Target preference"],
    evidenceMissing: ["Final owner sign-off", "Dependency owner matrix", "Procurement timeline"],
    topRisks: ["Client approval gates need documentation", "Dependency ownership is incomplete", "Pricing assumptions need confirmation"],
    recommendations: ["Use report for client review", "Confirm dependency owners", "Prepare partner/MSP plan discussion"],
    migrationWaves: [
      { label: "Wave 0", title: "MSP pilot", workloadCount: "4 VMs", description: "Demonstrate migration process to client stakeholders." },
      { label: "Wave 1", title: "Low-risk client workloads", workloadCount: "16 VMs", description: "Good candidates for a managed first wave." },
      { label: "Wave 2", title: "Standard production", workloadCount: "11 VMs", description: "Move after owner sign-off." },
    ],
    advisorTranscript: [
      { question: "How should an MSP use this report?", answer: "Use it to structure the client conversation around evidence, risk, next data collection and commercial next steps." },
      { question: "What evidence is missing for the client?", answer: "Dependency owners, final target design and procurement timeline need confirmation." },
      { question: "Is this white-label?", answer: "This demo is partner-compatible but not a real white-label implementation." },
    ],
    report: { filename: "msp-client-sample-demo-report.pdf", downloadPath: "/demo/reports/msp-client-sample" },
    disclaimer: sharedDisclaimer,
    paidCta: "Explore partner/MSP plans for repeatable client readiness workflows.",
  },
  {
    slug: "low-evidence-low-confidence",
    name: "Low Evidence / Low Confidence Assessment",
    description: "A deliberately sparse scenario showing the difference between readiness and confidence.",
    badges: ["Low evidence", "Honest scoring", "Next evidence"],
    vmCount: 27,
    hostCount: 3,
    datastoreCount: 4,
    readinessScore: 67,
    confidenceScore: 34,
    mainRisk: "Evidence too limited",
    evidenceReceived: ["Basic RVTools inventory"],
    evidenceMissing: ["Backup evidence", "Target design", "Network mapping", "Application dependencies", "Business criticality", "Cost assumptions"],
    topRisks: ["Analysis should not overclaim", "Missing evidence hides workload risk", "Business continuity impact is unknown"],
    recommendations: ["Collect target design", "Add backup and dependency evidence", "Use confidence score to drive next data collection"],
    migrationWaves: [
      { label: "Wave 0", title: "Evidence collection", workloadCount: "All VMs", description: "Collect more evidence before approving production waves." },
      { label: "Pilot", title: "Tiny pilot only", workloadCount: "2-3 VMs", description: "Only non-critical candidates after rollback is documented." },
      { label: "Hold", title: "Production", workloadCount: "Most VMs", description: "Production remains blocked by low confidence." },
    ],
    advisorTranscript: [
      { question: "Why is confidence lower than readiness?", answer: "The known inventory does not look impossible, but too much key evidence is missing to make a strong recommendation." },
      { question: "What should we collect next?", answer: "Backup proof, Proxmox target design, network mapping, dependency map and business criticality labels." },
      { question: "What should the report avoid saying?", answer: "It should avoid claiming production readiness or zero-downtime feasibility." },
    ],
    report: { filename: "low-evidence-low-confidence-demo-report.pdf", downloadPath: "/demo/reports/low-evidence-low-confidence" },
    disclaimer: sharedDisclaimer,
    paidCta: "Use a paid assessment to turn low-confidence inventory into evidence-backed decisions.",
  },
  {
    slug: "enterprise-multisite",
    name: "Enterprise Multi-Site Complexity",
    description: "A larger multi-site estate with network mapping, dependency gaps and complex wave planning.",
    badges: ["Enterprise", "Multi-site", "Complex waves"],
    vmCount: 236,
    hostCount: 12,
    datastoreCount: 22,
    readinessScore: 61,
    confidenceScore: 57,
    mainRisk: "Multi-site complexity",
    evidenceReceived: ["RVTools inventory", "Partial site labels", "Storage summary", "Initial migration constraints"],
    evidenceMissing: ["Complete VLAN mapping", "Application dependency map", "Cross-site failover evidence", "Performance history"],
    topRisks: ["Application dependencies are incomplete", "Network mapping varies by site", "Business continuity validation needs human review"],
    recommendations: ["Plan by site and dependency group", "Run dependency discovery", "Require human review before final wave approval"],
    migrationWaves: [
      { label: "Wave 0", title: "Site pilot", workloadCount: "8 VMs", description: "Pilot per site to validate network and runbook assumptions." },
      { label: "Wave 1", title: "Site A low-risk", workloadCount: "42 VMs", description: "Low-dependency workloads in primary site." },
      { label: "Wave 2", title: "Site B/C standard", workloadCount: "86 VMs", description: "Requires VLAN and dependency confirmation." },
      { label: "Wave 3", title: "Shared services", workloadCount: "44 VMs", description: "Requires cross-site continuity plan." },
      { label: "Hold", title: "Complex dependencies", workloadCount: "56 VMs", description: "Hold until dependency map and failover evidence are complete." },
    ],
    advisorTranscript: [
      { question: "Which findings require human review?", answer: "Cross-site failover, app dependencies, VLAN mapping and business owner sequencing need human review." },
      { question: "How should waves be organized?", answer: "Group by site, dependency cluster and operational criticality, not just VM size." },
      { question: "What is the biggest hidden risk?", answer: "Incomplete dependency mapping can cause technically successful VM moves to fail operationally." },
    ],
    report: { filename: "enterprise-multisite-demo-report.pdf", downloadPath: "/demo/reports/enterprise-multisite" },
    disclaimer: sharedDisclaimer,
    paidCta: "Use a paid assessment to validate enterprise evidence and produce a stakeholder-ready migration plan.",
  },
];

export function getDemoScenarioBySlug(slug: string) {
  return demoScenarios.find((scenario) => scenario.slug === slug) ?? null;
}

export function getPrimaryDemoScenario() {
  return demoScenarios[0];
}
