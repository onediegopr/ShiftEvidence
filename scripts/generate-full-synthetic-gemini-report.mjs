import fs from "node:fs";
import path from "node:path";
import nextEnv from "@next/env";
import { buildAiAdvisoryPrompt } from "../src/server/ai/aiAdvisoryPrompts.ts";
import { renderPdfReportBuffer } from "../src/server/reports/reportPdfRenderer.ts";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const args = new Set(process.argv.slice(2));
const requireRealGemini = args.has("--require-real-gemini");
const outputDirArg = process.argv.find((arg) => arg.startsWith("--output-dir="));
const artifactRelativeDir = outputDirArg?.split("=").slice(1).join("=") || "qa-artifacts/ai-report-1";

process.env.AI_ADVISORY_ENABLED ??= "true";
process.env.AI_ADVISORY_PROVIDER ??= "gemini";
process.env.AI_ADVISORY_MODEL ??= "gemini-1.5-flash";
process.env.AI_ADVISORY_TIMEOUT_MS ??= "15000";
process.env.AI_ADVISORY_MAX_INPUT_CHARS ??= "24000";
process.env.AI_ADVISORY_MAX_OUTPUT_CHARS ??= "6000";

const artifactDir = path.join(process.cwd(), artifactRelativeDir);
fs.mkdirSync(artifactDir, { recursive: true });

const generatedAt = new Date();
const pdfPath = path.join(
  artifactDir,
  requireRealGemini
    ? "northbridge-full-synthetic-gemini-success-readiness-report.pdf"
    : "northbridge-full-synthetic-gemini-readiness-report.pdf",
);
const summaryPath = path.join(artifactDir, "northbridge-synthetic-assessment-evidence-summary.json");
const readmePath = path.join(artifactDir, "README.md");

function emptyAiAdvisory(providerStatus, confidenceImpact) {
  return {
    executiveSummaryNotes: [],
    technicalNotes: [],
    missingContextQuestions: [],
    confidenceImpact,
    recommendedNextActions: [],
    limitations: ["AI advisory is unavailable. Deterministic report sections remain available."],
    providerStatus,
    generatedAt: generatedAt.toISOString(),
    provider: process.env.AI_ADVISORY_PROVIDER ?? "gemini",
    model: process.env.AI_ADVISORY_MODEL ?? "gemini-1.5-flash",
  };
}

function normalizeStringList(value) {
  return Array.isArray(value) ? value.filter((item) => typeof item === "string" && item.trim()).slice(0, 8) : [];
}

function normalizeGeminiJson(value, fallback) {
  if (!value || typeof value !== "object") return fallback;

  const questions = Array.isArray(value.missingContextQuestions)
    ? value.missingContextQuestions
        .filter((item) => item && typeof item === "object" && typeof item.question === "string")
        .map((item) => ({
          question: item.question.trim(),
          whyItMatters: typeof item.whyItMatters === "string" ? item.whyItMatters.trim() : "This can affect migration confidence.",
          priority: item.priority === "high" || item.priority === "medium" || item.priority === "low" ? item.priority : "medium",
        }))
        .slice(0, 10)
    : [];

  return {
    ...fallback,
    executiveSummaryNotes: normalizeStringList(value.executiveSummaryNotes),
    technicalNotes: normalizeStringList(value.technicalNotes),
    missingContextQuestions: questions,
    confidenceImpact:
      typeof value.confidenceImpact === "string" && value.confidenceImpact.trim()
        ? value.confidenceImpact.trim()
        : fallback.confidenceImpact,
    recommendedNextActions: normalizeStringList(value.recommendedNextActions),
    limitations: normalizeStringList(value.limitations).length > 0 ? normalizeStringList(value.limitations) : fallback.limitations,
  };
}

async function generateSyntheticGeminiAdvisory(payload) {
  const provider = process.env.AI_ADVISORY_PROVIDER ?? "gemini";
  const model = process.env.AI_ADVISORY_MODEL ?? "gemini-1.5-flash";
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const timeoutMs = Number.parseInt(process.env.AI_ADVISORY_TIMEOUT_MS ?? "15000", 10);
  const maxInputChars = Number.parseInt(process.env.AI_ADVISORY_MAX_INPUT_CHARS ?? "24000", 10);
  const maxOutputChars = Number.parseInt(process.env.AI_ADVISORY_MAX_OUTPUT_CHARS ?? "6000", 10);
  const fallback = emptyAiAdvisory(
    apiKey ? "error" : "unavailable",
    apiKey
      ? "Gemini advisory failed in the synthetic generator. Deterministic report sections remain available."
      : "Gemini API key is not configured in this local environment. Deterministic report sections remain available.",
  );

  if (provider !== "gemini") {
    return emptyAiAdvisory("disabled", "Synthetic generator requires Gemini provider for this hito.");
  }

  if (!apiKey) {
    return fallback;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const payloadJson = JSON.stringify(payload).slice(0, maxInputChars);
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: buildAiAdvisoryPrompt(payloadJson) }] }],
          generationConfig: {
            responseMimeType: "application/json",
            maxOutputTokens: Math.max(256, Math.min(maxOutputChars, 8192)),
            temperature: 0.2,
          },
        }),
        signal: controller.signal,
      },
    );

    if (!response.ok) {
      return fallback;
    }

    const json = await response.json();
    const text = json.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("\n").trim();
    if (!text) {
      return fallback;
    }

    const parsed = JSON.parse(text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim());
    return {
      ...normalizeGeminiJson(parsed, fallback),
      providerStatus: "success",
      generatedAt: generatedAt.toISOString(),
      provider,
      model,
      limitations: [
        ...normalizeGeminiJson(parsed, fallback).limitations,
        "AI advisory is generated from synthetic sanitized metadata and does not replace deterministic scores.",
      ].slice(0, 8),
    };
  } catch {
    return fallback;
  } finally {
    clearTimeout(timer);
  }
}

const vmNames = [
  ["NBI-DC01", "Windows Server 2019", 4, 16, 180, "ds-prod-01", "PG-MGMT", "none", "current", "critical", "partial", "known", "high", "Hold", "Validate AD FSMO roles, backup restore and migration runbook."],
  ["NBI-DC02", "Windows Server 2019", 4, 16, 180, "ds-prod-02", "PG-MGMT", "none", "current", "critical", "partial", "known", "high", "Hold", "Keep as later wave with rollback and replication checks."],
  ["NBI-ERP01", "Windows Server 2016", 8, 64, 1600, "ds-prod-03", "PG-APP", "none", "current", "critical", "partial", "unknown", "critical", "Hold", "Do not migrate first wave; dependency map and restore test required."],
  ["NBI-SQL01", "Windows Server 2019", 12, 96, 2400, "ds-prod-04", "PG-DB", "none", "current", "critical", "partial", "unknown", "critical", "Hold", "Validate SQL performance, backup consistency and maintenance window."],
  ["NBI-SQL02", "Windows Server 2019", 8, 64, 1900, "ds-prod-04", "PG-DB", "old", "outdated", "critical", "missing", "unknown", "critical", "Hold", "Remove stale snapshots and collect backup evidence before migration."],
  ["NBI-FS01", "Windows Server 2016", 8, 48, 3600, "ds-file-01", "PG-FILE", "none", "current", "high", "partial", "partial", "high", "Manual Review", "Large file server requires storage sizing and cutover plan."],
  ["NBI-FS02", "Windows Server 2016", 8, 48, 2800, "ds-file-02", "PG-FILE", "none", "current", "high", "partial", "partial", "high", "Manual Review", "Validate incremental copy and rollback window."],
  ["NBI-WMS01", "Windows Server 2019", 6, 32, 600, "ds-prod-05", "PG-WAREHOUSE", "none", "current", "critical", "partial", "unknown", "high", "Manual Review", "Warehouse dependencies and downtime tolerance need owner sign-off."],
  ["NBI-WEB01", "Ubuntu 22.04", 4, 16, 120, "ds-web-01", "PG-WEB", "none", "current", "medium", "available", "known", "medium", "Wave 1", "Good candidate after pilot network validation."],
  ["NBI-WEB02", "Ubuntu 22.04", 4, 16, 120, "ds-web-01", "PG-WEB", "none", "current", "medium", "available", "known", "medium", "Wave 1", "Migrate with web tier group after pilot."],
  ["NBI-APP01", "Windows Server 2019", 4, 24, 300, "ds-app-01", "PG-APP", "none", "current", "medium", "partial", "partial", "medium", "Wave 2", "Validate application owner and firewall dependencies."],
  ["NBI-APP02", "Windows Server 2019", 4, 24, 300, "ds-app-01", "PG-APP", "none", "current", "medium", "partial", "partial", "medium", "Wave 2", "Migrate with paired app service."],
  ["NBI-MON01", "Ubuntu 20.04", 2, 8, 80, "ds-tools-01", "PG-MGMT", "none", "current", "low", "available", "known", "low", "Pilot", "Low-risk utility workload for pilot."],
  ["NBI-BKPROXY01", "Windows Server 2019", 4, 16, 200, "ds-tools-01", "PG-BACKUP", "none", "current", "high", "partial", "known", "medium", "Wave 2", "Coordinate with backup cutover and PBS design."],
  ["NBI-LEGACY01", "Windows Server 2008 R2", 2, 8, 160, "ds-legacy-01", "PG-LEGACY", "old", "outdated", "medium", "missing", "unknown", "high", "Manual Review", "Legacy OS requires compatibility and remediation decision."],
  ["NBI-PRINT01", "Windows Server 2016", 2, 8, 120, "ds-util-01", "PG-USER", "none", "current", "low", "available", "known", "low", "Pilot", "Simple utility VM candidate."],
  ["NBI-DHCP01", "Windows Server 2019", 2, 8, 90, "ds-util-01", "PG-MGMT", "none", "current", "medium", "available", "known", "medium", "Wave 1", "Coordinate with network team."],
  ["NBI-INTRANET01", "Ubuntu 20.04", 2, 8, 100, "ds-web-01", "PG-WEB", "none", "current", "low", "available", "known", "low", "Pilot", "Good validation workload."],
  ["NBI-DEVSQL01", "Windows Server 2019", 4, 24, 700, "ds-dev-01", "PG-DEV", "old", "outdated", "low", "available", "partial", "medium", "Wave 1", "Remove snapshot before migration."],
  ["NBI-DEVAPP01", "Ubuntu 22.04", 2, 8, 80, "ds-dev-01", "PG-DEV", "none", "current", "low", "available", "known", "low", "Pilot", "Low-risk dev workload."],
];

while (vmNames.length < 50) {
  const index = vmNames.length + 1;
  const risk = index % 11 === 0 ? "high" : index % 5 === 0 ? "medium" : "low";
  vmNames.push([
    `NBI-UTILITY${String(index).padStart(2, "0")}`,
    index % 2 === 0 ? "Ubuntu 22.04" : "Windows Server 2019",
    risk === "high" ? 6 : 2,
    risk === "high" ? 32 : 8,
    risk === "high" ? 900 : 120,
    `ds-${risk === "high" ? "prod" : "util"}-${(index % 6) + 1}`,
    index % 4 === 0 ? "PG-MULTINIC" : "PG-UTILITY",
    index % 13 === 0 ? "old" : "none",
    index % 7 === 0 ? "outdated" : "current",
    risk === "high" ? "high" : "low",
    index % 6 === 0 ? "partial" : "available",
    index % 8 === 0 ? "unknown" : "known",
    risk,
    risk === "high" ? "Manual Review" : risk === "medium" ? "Wave 2" : "Pilot",
    risk === "high" ? "Validate dependencies and backup before production migration." : "Use as controlled migration candidate.",
  ]);
}

const findings = [
  ["backup", "critical", "Backup evidence incomplete for critical workloads", "Veeam is reported as present, but no export or restore evidence was provided.", "Collect Veeam job/export evidence and validate restore points before production migration."],
  ["application", "critical", "Critical application dependency map missing", "ERP, SQL and warehouse workloads have unknown dependencies.", "Create dependency map and owner-approved migration groups."],
  ["storage", "high", "Two datastores above 85% utilization", "Storage pressure can impact migration windows and target sizing.", "Validate datastore growth, large disks and Proxmox storage design."],
  ["snapshot", "high", "Old snapshots detected", "Seven representative VMs show old snapshot risk.", "Consolidate snapshots before migration."],
  ["network", "high", "VLAN and firewall mapping incomplete", "22 VLANs and 38 port groups are in scope with partial documentation.", "Confirm network mappings before pilot."],
  ["target", "high", "Proxmox target not fully validated", "HA and PBS are planned, but target export/API evidence is not available.", "Validate node count, storage architecture and PBS before migration waves."],
  ["legacy", "medium", "Legacy Windows workloads require manual review", "Windows 2008/2012-era systems may need remediation.", "Decide rehost vs retire vs rebuild before migration."],
  ["tools", "medium", "VMware Tools outdated on multiple VMs", "Twelve VMs are flagged with outdated tools.", "Update tools or validate guest readiness."],
  ["performance", "medium", "Performance history missing", "No historical CPU/RAM/storage latency evidence was provided.", "Collect performance history before sizing final Proxmox nodes."],
  ["downtime", "medium", "Downtime windows vary by workload class", "ERP/SQL/DC systems require special windows and rollback.", "Define wave-specific maintenance windows."],
];

const vmRows = vmNames.map(([name, os, cpu, ram, disk, datastore, network, snapshot, tools, criticality, backup, dependency, risk, wave, recommendation]) => ({
  vmName: name,
  riskLevel: risk === "critical" ? "critical" : risk,
  mainReason: `${os}; ${cpu} vCPU; ${ram} GB RAM; ${disk} GB disk; ${datastore}; ${network}; backup ${backup}; dependency ${dependency}; wave ${wave}.`,
  recommendation,
}));

const payload = {
  assessment: {
    safeReference: "assessment-demo-northbridge-ai-report-1",
    type: "vmware_to_proxmox",
    sourcePlatform: "vmware",
    targetPlatform: "proxmox",
    status: "completed",
    storageReadinessEnabled: true,
  },
  rvtoolsSummary: {
    vmCount: 126,
    hostCount: 6,
    datastoreCount: 14,
    snapshotCount: 19,
    poweredOnVmCount: 112,
    poweredOffVmCount: 14,
    totalProvisionedGb: 76800,
    totalUsedGb: 42100,
  },
  scores: {
    readinessScore: 64,
    confidenceScore: 58,
    inventoryScore: 74,
    costRiskScore: 69,
    riskLevel: "medium",
  },
  riskFindings: findings.map(([category, severity, title, description, recommendation]) => ({
    category,
    severity,
    entityType: "assessment",
    entityName: "Northbridge Industrial Group",
    title,
    description,
    recommendation,
    source: "system",
  })),
  manualMigrationContext: {
    coverage: {
      overallPercent: 72,
      status: "partial",
      missingKeyContext: ["Backup export", "Application dependency map", "Performance history", "Proxmox target export"],
      sections: [
        { id: "quick_context", title: "Quick Context", percent: 100, status: "strong", missing: [] },
        { id: "backup_dr", title: "Backup / DR", percent: 55, status: "partial", missing: ["Backup export", "Restore test evidence"] },
        { id: "network", title: "Network", percent: 65, status: "partial", missing: ["Firewall dependency map"] },
        { id: "proxmox_target", title: "Proxmox Target", percent: 60, status: "partial", missing: ["Target cluster export"] },
      ],
    },
    statusCounts: {
      answered: 34,
      unknown: 9,
      not_applicable: 3,
      skipped: 5,
    },
    importantContext: [
      "Main objective: reduce VMware/Broadcom licensing cost and evaluate Proxmox as primary virtualization platform.",
      "Project stage: technical evaluation before paid migration planning.",
      "Timeline: 3-6 months.",
      "Critical workloads: ERP, SQL production, file servers, domain controllers, warehouse application and reporting.",
      "Backup solution: Veeam reported, but export was not provided.",
      "Proxmox target: 3-4 nodes with HA and PBS planned; storage design under evaluation.",
    ],
    missingContext: [
      "No Veeam export or independent restore validation was provided.",
      "No CMDB or dependency map was provided.",
      "No historical performance evidence was provided.",
      "Proxmox target sizing/export evidence is partial.",
    ],
    answers: [
      { question: "Main migration objective", status: "answered", source: "user_input", value: "Reduce VMware/Broadcom licensing cost and evaluate Proxmox." },
      { question: "Project stage", status: "answered", source: "user_input", value: "Technical evaluation before paid migration planning." },
      { question: "Target timeline", status: "answered", source: "user_input", value: "3-6 months" },
      { question: "Backup export available", status: "unknown", source: "user_input", value: null },
      { question: "Application dependency map", status: "skipped", source: "missing", value: null },
    ],
  },
  assumptions: {
    costRisk: {
      annualSubscriptionDelta: 268000,
      threeYearSubscriptionDelta: 804000,
      savingsPercent: 57,
      riskLevel: "medium",
      readinessLabel: "Pilot-first migration path recommended",
      dataSourceLabel: "Synthetic RVTools-like inventory plus manual context",
    },
    mismatchWarnings: ["Backup evidence and application dependencies are incomplete."],
    referenceCounts: {
      vmCount: 126,
      hostCount: 6,
      clusterCount: 3,
      datastoreCount: 14,
    },
  },
  evidenceReceived: [
    { evidenceType: "rvtools", safeFilenameLabel: "synthetic-northbridge-rvtools-summary", processingStatus: "parsed", sizeBytes: 184000, uploadedAt: generatedAt.toISOString() },
    { evidenceType: "manual_csv", safeFilenameLabel: "synthetic-context-intake", processingStatus: "parsed", sizeBytes: 42000, uploadedAt: generatedAt.toISOString() },
  ],
  evidenceMissing: [
    "Veeam export or restore report",
    "Application dependency map",
    "Firewall rules between critical apps",
    "Performance history for critical workloads",
    "Proxmox target cluster export/API evidence",
    "Final storage design and HA validation",
  ],
  excluded: [
    "raw uploaded files",
    "customer data",
    "secrets",
    "cookies",
    "tokens",
    "private storage paths",
  ],
};

const aiAdvisory = await generateSyntheticGeminiAdvisory(payload);

if (requireRealGemini && aiAdvisory.providerStatus !== "success") {
  console.error(`AI-REPORT-1B requires providerStatus=success, received providerStatus=${aiAdvisory.providerStatus}.`);
  console.error("No secret values were printed. Configure GEMINI_API_KEY in a secure runtime and retry.");
  process.exitCode = 2;
}

const reportPreview = {
  assessmentId: "demo-northbridge-ai-report-1",
  assessmentTitle: "DEMO - Full Synthetic Gemini Report - Northbridge Industrial",
  workspaceName: "Synthetic Demo Workspace",
  clientLabel: "Northbridge Industrial Group (synthetic)",
  planLabel: "Readiness Report Pro",
  planRank: 3,
  reportPreviewStatus: "available",
  fullReportStatus: "unlocked",
  pdfStatus: "generated",
  commercialStatus: {
    hasFullReportUnlocked: true,
    primaryLabel: "Synthetic demo unlocked",
    primaryTone: "good",
    primaryDetail: "Demo artifact only. Not a customer entitlement.",
  },
  completionScore: 86,
  completionStatus: "completed",
  evidenceConfidence: "moderate",
  evidenceConfidenceLabel: "Moderate evidence",
  sourceLabel: "Synthetic RVTools-like inventory plus manual context",
  costRiskPreview: {
    annualSubscriptionDelta: 268000,
    threeYearSubscriptionDelta: 804000,
    savingsPercent: 57,
    riskLevel: "medium",
    readinessLabel: "Pilot-first migration path recommended",
    dataSourceLabel: "Synthetic RVTools-like inventory plus manual context",
    missingEvidence: payload.evidenceMissing,
    recommendations: [
      "Run pilot wave with low-risk utility and web workloads.",
      "Collect Veeam export and restore validation before critical workload migration.",
      "Validate Proxmox HA, PBS and storage target design.",
      "Build dependency map for ERP, SQL and warehouse applications.",
      "Collect performance history for sizing and wave planning.",
    ],
    mismatchWarnings: ["Backup evidence is partial.", "Dependency data is incomplete."],
    referenceCounts: payload.assumptions.referenceCounts,
  },
  costRiskStatus: "partial",
  readinessScore: 64,
  confidenceScore: 58,
  recommendedDecision: "Pilot First",
  evidenceOverview: {
    received: [
      "Synthetic RVTools-like inventory summary",
      "Synthetic manual migration context",
      "Synthetic VM representative matrix",
      "Synthetic cost/risk assumptions",
      "Synthetic risk findings",
    ],
    missing: payload.evidenceMissing,
    sourceIndicator: "mixed",
    confidenceImplication: "Evidence supports a directional pilot-first recommendation, but missing backup, dependency and target evidence limits confidence.",
  },
  environmentSummary: {
    vmCount: 126,
    hostCount: 6,
    datastoreCount: 14,
    snapshotCount: 19,
    poweredOnVmCount: 112,
    poweredOffVmCount: 14,
    totalProvisionedGb: 76800,
    totalUsedGb: 42100,
  },
  migrationContext: {
    coverage: payload.manualMigrationContext.coverage,
    importantContext: payload.manualMigrationContext.importantContext,
    missingContext: payload.manualMigrationContext.missingContext,
    confidenceImpact: "Context is useful but incomplete; missing backup, dependency and target evidence should lower confidence until validated.",
  },
  aiAdvisory,
  executiveSummary: [
    "Northbridge Industrial Group is a synthetic 126-VM VMware estate with 6 hosts, 3 clusters and 14 datastores.",
    "The current recommendation is Pilot First, not direct migration.",
    "Cost pressure supports migration evaluation, but backup, dependency and Proxmox target evidence remain incomplete.",
    "Critical ERP, SQL, domain controller and warehouse workloads should not be first-wave candidates.",
  ],
  technicalSummary: [
    "Representative synthetic inventory includes 50 detailed VMs from a 126-VM estate.",
    "Key technical blockers are backup evidence, dependency mapping, large disks, old snapshots and target storage validation.",
    "Proxmox HA and PBS are planned but not fully evidenced.",
    "Low-risk utility, dev and web workloads are suitable pilot candidates.",
  ],
  missingEvidence: payload.evidenceMissing,
  topFindings: findings.map(([category, severity, title, description, recommendation]) => ({
    category,
    severity,
    entityType: "assessment",
    entityName: "Northbridge Industrial Group",
    title,
    description,
    recommendation,
    source: "system",
  })),
  visibleFindings: [],
  vmMatrixPreview: {
    rows: vmRows,
  },
  findingCounts: {
    critical: 2,
    high: 4,
    medium: 4,
    low: 0,
    info: 0,
  },
  reportCards: [],
  sections: [],
  lockedSections: [],
  upgradeRecommendations: [
    "Unlock full technical review before production migration.",
    "Add backup readiness evidence.",
    "Add Proxmox target validation evidence.",
  ],
  upgradeButtons: [],
};

const pdfBuffer = await renderPdfReportBuffer({
  assessmentTitle: reportPreview.assessmentTitle,
  clientLabel: reportPreview.clientLabel,
  workspaceName: reportPreview.workspaceName,
  reportTypeLabel: "Readiness Report",
  generatedAt,
  generatedByLabel: requireRealGemini ? "AI-REPORT-1B synthetic Gemini success generator" : "AI-REPORT-1 synthetic generator",
  reportPreview,
});

fs.writeFileSync(pdfPath, pdfBuffer);

const pageCount = (pdfBuffer.toString("latin1").match(/\/Type\s*\/Page\b/g) ?? []).length;
const artifactSummary = {
  generatedAt: generatedAt.toISOString(),
  environment: requireRealGemini ? "local synthetic artifact requiring real Gemini" : "local synthetic artifact",
  assessmentId: reportPreview.assessmentId,
  provider: aiAdvisory.provider,
  model: aiAdvisory.model,
  providerStatus: aiAdvisory.providerStatus,
  geminiKeyConfigured: Boolean(process.env.GEMINI_API_KEY),
  openAiConfigured: Boolean(process.env.OPENAI_API_KEY),
  dataset: {
    company: "Northbridge Industrial Group",
    synthetic: true,
    totalVms: 126,
    detailedVms: vmNames.length,
    hosts: 6,
    clusters: 3,
    datastores: 14,
    vlans: 22,
    snapshots: 19,
  },
  pdf: {
    path: pdfPath,
    sizeBytes: pdfBuffer.byteLength,
    pageCount,
  },
  validation: {
    rawCustomerDataUsed: false,
    realUploadedFilesUsed: false,
    secretsPrinted: false,
    openAiUsed: false,
    renderer: "src/server/reports/reportPdfRenderer.ts",
  },
};

fs.writeFileSync(summaryPath, `${JSON.stringify(artifactSummary, null, 2)}\n`);
fs.writeFileSync(
  readmePath,
  `${requireRealGemini ? "# AI-REPORT-1B Synthetic Gemini Success Readiness Report" : "# AI-REPORT-1 Synthetic Gemini Readiness Report"}\n\n` +
    `Generated at: ${generatedAt.toISOString()}\n\n` +
    `Dataset: 100% synthetic/demo Northbridge Industrial Group.\n\n` +
    `Provider: ${aiAdvisory.provider}\n\n` +
    `Model: ${aiAdvisory.model ?? "not configured"}\n\n` +
    `Provider status: ${aiAdvisory.providerStatus}\n\n` +
    `PDF: ${path.basename(pdfPath)}\n\n` +
    `PDF size bytes: ${pdfBuffer.byteLength}\n\n` +
    `Page count: ${pageCount}\n\n` +
    `No customer data, raw uploaded files, secrets, cookies, tokens or private storage paths were used.\n\n` +
    `Require real Gemini: ${requireRealGemini ? "YES" : "NO"}\n\n` +
    `If providerStatus is not success, Gemini real was not available in this run and the hito must remain partial.\n`,
);

console.log(`${requireRealGemini ? "AI-REPORT-1B" : "AI-REPORT-1"} synthetic PDF generated: ${pdfPath}`);
console.log(`providerStatus=${aiAdvisory.providerStatus}`);
console.log(`provider=${aiAdvisory.provider}`);
console.log(`model=${aiAdvisory.model ?? "not configured"}`);
console.log(`pageCount=${pageCount}`);
console.log(`sizeBytes=${pdfBuffer.byteLength}`);

if (requireRealGemini && aiAdvisory.providerStatus !== "success") {
  process.exit(2);
}
