import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const outputDir = path.join(repoRoot, "synthetic-data");

const scenarios = [
  {
    slug: "northbridge-small-clean",
    title: "Northbridge Small Clean Pilot",
    profile: "small_clean",
    vms: 18,
    hosts: 3,
    clusters: 1,
    planLevel: "pilot_ready",
    confidence: "high",
    blockers: 0,
    coverage: { rvtools: true, vmwareEnrichment: true, proxmoxTarget: true, backupEvidence: true, storageSan: true, applicationDependencies: true },
    gates: ["backup_restore_evidence:pass", "target_capacity:pass", "dependency_mapping:pass", "network_mapping:pass"],
  },
  {
    slug: "atlas-medium-mixed-risk",
    title: "Atlas Medium Mixed Risk",
    profile: "medium_mixed_risk",
    vms: 74,
    hosts: 5,
    clusters: 2,
    planLevel: "conditional_waves",
    confidence: "medium",
    blockers: 2,
    coverage: { rvtools: true, vmwareEnrichment: true, proxmoxTarget: true, backupEvidence: false, storageSan: true, applicationDependencies: true },
    gates: ["backup_restore_evidence:fail", "target_capacity:warning", "dependency_mapping:pass", "network_mapping:warning"],
  },
  {
    slug: "meridian-large-enterprise",
    title: "Meridian Large Enterprise",
    profile: "large_enterprise",
    vms: 236,
    hosts: 12,
    clusters: 4,
    planLevel: "phased_assessment_required",
    confidence: "medium",
    blockers: 3,
    coverage: { rvtools: true, vmwareEnrichment: true, proxmoxTarget: true, backupEvidence: true, storageSan: true, applicationDependencies: false },
    gates: ["backup_restore_evidence:warning", "target_capacity:warning", "dependency_mapping:fail", "network_mapping:warning"],
  },
  {
    slug: "orion-no-backup",
    title: "Orion No Backup Evidence",
    profile: "backup_missing",
    vms: 42,
    hosts: 4,
    clusters: 1,
    planLevel: "blocked_until_backup_evidence",
    confidence: "low",
    blockers: 2,
    coverage: { rvtools: true, vmwareEnrichment: true, proxmoxTarget: true, backupEvidence: false, storageSan: true, applicationDependencies: true },
    gates: ["backup_restore_evidence:fail", "target_capacity:pass", "dependency_mapping:warning", "network_mapping:pass"],
  },
  {
    slug: "delta-target-insufficient",
    title: "Delta Target Insufficient",
    profile: "target_insufficient",
    vms: 58,
    hosts: 6,
    clusters: 2,
    planLevel: "blocked_until_target_redesign",
    confidence: "medium",
    blockers: 2,
    coverage: { rvtools: true, vmwareEnrichment: true, proxmoxTarget: true, backupEvidence: true, storageSan: true, applicationDependencies: true },
    gates: ["backup_restore_evidence:pass", "target_capacity:fail", "dependency_mapping:pass", "network_mapping:warning"],
  },
  {
    slug: "apollo-storage-constrained",
    title: "Apollo Storage Constrained",
    profile: "storage_constrained",
    vms: 96,
    hosts: 8,
    clusters: 2,
    planLevel: "conditional_after_storage_review",
    confidence: "medium",
    blockers: 1,
    coverage: { rvtools: true, vmwareEnrichment: true, proxmoxTarget: true, backupEvidence: true, storageSan: true, applicationDependencies: true },
    gates: ["backup_restore_evidence:pass", "target_capacity:warning", "dependency_mapping:pass", "network_mapping:pass"],
  },
  {
    slug: "helix-dependency-heavy",
    title: "Helix Dependency Heavy",
    profile: "dependency_heavy",
    vms: 121,
    hosts: 7,
    clusters: 3,
    planLevel: "blocked_until_dependency_mapping",
    confidence: "low",
    blockers: 3,
    coverage: { rvtools: true, vmwareEnrichment: true, proxmoxTarget: true, backupEvidence: true, storageSan: false, applicationDependencies: false },
    gates: ["backup_restore_evidence:warning", "target_capacity:warning", "dependency_mapping:fail", "network_mapping:warning"],
  },
  {
    slug: "phoenix-advanced-ready",
    title: "Phoenix Advanced Ready",
    profile: "advanced_ready",
    vms: 154,
    hosts: 9,
    clusters: 3,
    planLevel: "advanced_waves_ready",
    confidence: "high",
    blockers: 0,
    coverage: { rvtools: true, vmwareEnrichment: true, proxmoxTarget: true, backupEvidence: true, storageSan: true, applicationDependencies: true },
    gates: ["backup_restore_evidence:pass", "target_capacity:pass", "dependency_mapping:pass", "network_mapping:pass"],
  },
];

const modules = [
  "rvtools",
  "vmware-enrichment",
  "proxmox-target",
  "backup-evidence",
  "storage-san",
  "application-dependencies",
  "migration-plan",
  "expected-summaries",
];

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function writeText(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, data, "utf8");
}

function csv(rows) {
  return `${rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n")}\n`;
}

function vmRows(scenario) {
  const roles = ["web", "utility", "sql", "domain", "file", "erp", "monitoring", "legacy"];
  const count = Math.min(scenario.vms, 16);
  return Array.from({ length: count }, (_, index) => {
    const role = roles[index % roles.length];
    const critical = ["sql", "domain", "erp"].includes(role);
    return [
      `${scenario.slug.split("-")[0]}-${role}-${String(index + 1).padStart(2, "0")}`,
      role,
      critical ? "critical" : index % 5 === 0 ? "medium" : "low",
      index % 4 === 0 ? "true" : "false",
      critical ? "Wave 3" : index % 3 === 0 ? "Wave 0" : "Wave 1",
    ];
  });
}

function scenarioDir(slug) {
  return path.join(outputDir, "scenarios", slug);
}

for (const scenario of scenarios) {
  const root = scenarioDir(scenario.slug);
  for (const moduleName of modules) {
    fs.mkdirSync(path.join(root, moduleName), { recursive: true });
  }

  writeJson(path.join(root, "manifest.json"), {
    id: scenario.slug,
    title: scenario.title,
    profile: scenario.profile,
    synthetic: true,
    safeForPublicDemo: true,
    generatedBy: "scripts/generate-synthetic-evidence-datasets.mjs",
    scope: { vms: scenario.vms, hosts: scenario.hosts, clusters: scenario.clusters },
    evidenceCoverage: scenario.coverage,
    expectedPlan: {
      planLevel: scenario.planLevel,
      confidence: scenario.confidence,
      blockingGates: scenario.blockers,
    },
  });

  writeText(
    path.join(root, "rvtools", "rvtools-like.csv"),
    csv([
      ["vm_name", "role", "criticality", "snapshot_present", "recommended_wave"],
      ...vmRows(scenario),
    ]),
  );

  writeJson(path.join(root, "vmware-enrichment", "vmware-enrichment.json"), {
    source: "synthetic_vmware_enrichment",
    clusterCount: scenario.clusters,
    hostCount: scenario.hosts,
    evidenceNotes: [
      "Synthetic cluster inventory only.",
      "No production credentials, paths or customer identifiers are included.",
    ],
    riskSignals: {
      snapshotsObserved: scenario.profile.includes("clean") ? 1 : Math.max(6, Math.round(scenario.vms / 8)),
      legacyOsObserved: scenario.profile.includes("advanced") ? 2 : Math.round(scenario.vms / 12),
      oversizedVmCandidates: Math.round(scenario.vms / 18),
    },
  });

  writeJson(path.join(root, "proxmox-target", "proxmox-target.json"), {
    source: "synthetic_proxmox_target",
    nodes: Math.max(3, Math.ceil(scenario.hosts / 2)),
    storageDesign: scenario.profile.includes("storage") ? "shared_storage_under_review" : "validated_shared_storage",
    pbsConfigured: scenario.coverage.backupEvidence,
    haEnabled: !scenario.profile.includes("target_insufficient"),
    capacityHeadroomPercent: scenario.profile.includes("target_insufficient") ? 8 : scenario.profile.includes("storage") ? 14 : 28,
  });

  writeJson(path.join(root, "backup-evidence", "backup-evidence.json"), {
    source: "synthetic_backup_evidence",
    provided: scenario.coverage.backupEvidence,
    restoreTests: scenario.coverage.backupEvidence ? (scenario.profile.includes("clean") || scenario.profile.includes("advanced") ? "recent" : "partial") : "missing",
    protectedCriticalWorkloadsPercent: scenario.coverage.backupEvidence ? (scenario.confidence === "high" ? 96 : 68) : 0,
    notes: scenario.coverage.backupEvidence
      ? ["Synthetic restore evidence is present for QA coverage."]
      : ["Backup evidence intentionally omitted to exercise blocked plan behavior."],
  });

  writeText(
    path.join(root, "storage-san", "storage-san.csv"),
    csv([
      ["datastore", "type", "used_percent", "risk", "note"],
      [`${scenario.slug}-san-a`, "SAN", scenario.profile.includes("storage") ? 88 : 62, scenario.profile.includes("storage") ? "high" : "low", "Synthetic shared storage row"],
      [`${scenario.slug}-nfs-b`, "NFS", scenario.profile.includes("target") ? 84 : 55, scenario.profile.includes("target") ? "high" : "low", "Synthetic NFS row"],
      [`${scenario.slug}-archive`, "Local", 34, "low", "Synthetic archive row"],
    ]),
  );

  writeText(
    path.join(root, "application-dependencies", "application-dependencies.csv"),
    csv([
      ["source_vm", "target_service", "dependency_type", "criticality", "known_owner"],
      [`${scenario.slug}-web-01`, `${scenario.slug}-sql-03`, "database", "high", scenario.coverage.applicationDependencies ? "true" : "false"],
      [`${scenario.slug}-erp-06`, `${scenario.slug}-domain-04`, "identity", "critical", scenario.coverage.applicationDependencies ? "true" : "false"],
      [`${scenario.slug}-file-05`, `${scenario.slug}-backup-01`, "backup", "medium", "true"],
    ]),
  );

  writeJson(path.join(root, "migration-plan", "expected-gates.json"), {
    planLevel: scenario.planLevel,
    confidence: scenario.confidence,
    gates: scenario.gates.map((entry) => {
      const [key, status] = entry.split(":");
      return {
        key,
        status,
        recommendation:
          status === "pass"
            ? "Keep evidence attached and validate during wave planning."
            : status === "warning"
              ? "Review before early production waves."
              : "Do not approve production wave until remediated.",
      };
    }),
  });

  writeJson(path.join(root, "expected-summaries", "expected-summary.json"), {
    title: scenario.title,
    scope: `${scenario.vms} VMs / ${scenario.hosts} hosts / ${scenario.clusters} clusters`,
    expectedDecision:
      scenario.blockers === 0
        ? "Synthetic evidence supports controlled pilot planning."
        : "Synthetic evidence keeps one or more migration gates blocked.",
    missingEvidence: Object.entries(scenario.coverage)
      .filter(([, present]) => !present)
      .map(([key]) => key),
  });
}

writeJson(path.join(outputDir, "index.json"), {
  generatedBy: "scripts/generate-synthetic-evidence-datasets.mjs",
  synthetic: true,
  scenarioCount: scenarios.length,
  scenarios: scenarios.map(({ slug, title, profile, vms, hosts, clusters, planLevel, confidence, blockers }) => ({
    slug,
    title,
    profile,
    scope: { vms, hosts, clusters },
    planLevel,
    confidence,
    blockingGates: blockers,
  })),
});

writeText(
  path.join(outputDir, "README.md"),
  `# Synthetic Evidence Dataset Library

This directory contains deterministic, synthetic evidence packs for ShiftReadiness QA, demos, sample reports and parser regression tests.

## Safety

- No customer data.
- No production credentials.
- No secrets, tokens, cookies or environment variables.
- No private storage paths.
- No real internal network inventory.
- The files are safe for public demo and documentation usage.

## Included Modules

- RVTools-like CSV inventory.
- VMware enrichment JSON.
- Proxmox target JSON.
- Backup evidence JSON.
- Storage/SAN CSV.
- Application dependency CSV.
- Expected Migration Recommendation Plan gates.
- Expected summary metadata.

## Scenarios

${scenarios.map((scenario) => `- \`${scenario.slug}\`: ${scenario.title} (${scenario.planLevel}, ${scenario.confidence} confidence).`).join("\n")}

## Regenerate

\`\`\`bash
npm run synthetic:evidence
\`\`\`
`,
);

console.log(`Generated ${scenarios.length} synthetic evidence scenarios in ${path.relative(repoRoot, outputDir)}`);
