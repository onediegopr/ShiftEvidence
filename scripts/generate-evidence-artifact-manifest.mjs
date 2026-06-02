import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const publicRoot = path.join(repoRoot, "public");
const manifestPath = path.join(publicRoot, "evidence-artifacts", "manifest.json");
const generatedAt = "2026-06-02T00:00:00.000Z";
const lastReviewedAt = "2026-06-02";
const version = "0.1.0";

const artifacts = [
  {
    key: "vmware-enrichment-collector",
    displayName: "Shift Evidence VMware Enrichment Collector",
    type: "collector",
    moduleKey: "vmware_enrichment",
    path: "/collectors/vmware/shift-vmware-evidence-collector.ps1",
    readmePath: "/collectors/vmware/README.md",
    mode: "read-only",
    platform: "vmware-vsphere",
    language: "PowerShell / PowerCLI",
    outputSchema: "shift-evidence.vmware-enrichment.v1",
    requirement: "VMware PowerCLI with read-only vCenter permissions",
  },
  {
    key: "vmware-enrichment-readme",
    displayName: "Shift Evidence VMware Enrichment Collector README",
    type: "readme",
    moduleKey: "vmware_enrichment",
    path: "/collectors/vmware/README.md",
    mode: "read-only",
    platform: "vmware-vsphere",
    language: "Markdown",
    outputSchema: "shift-evidence.vmware-enrichment.v1",
    requirement: "Review before running collector",
  },
  {
    key: "proxmox-target-collector",
    displayName: "Shift Evidence Proxmox Target Collector",
    type: "collector",
    moduleKey: "proxmox_target",
    path: "/collectors/proxmox/shift-proxmox-target-collector.sh",
    readmePath: "/collectors/proxmox/README.md",
    mode: "read-only",
    platform: "proxmox-ve",
    language: "Bash / pvesh",
    outputSchema: "shift-evidence.proxmox-target.v1",
    requirement: "Proxmox VE node with pvesh read permissions",
  },
  {
    key: "proxmox-target-readme",
    displayName: "Shift Evidence Proxmox Target Collector README",
    type: "readme",
    moduleKey: "proxmox_target",
    path: "/collectors/proxmox/README.md",
    mode: "read-only",
    platform: "proxmox-ve",
    language: "Markdown",
    outputSchema: "shift-evidence.proxmox-target.v1",
    requirement: "Review before running collector",
  },
  {
    key: "backup-evidence-collector",
    displayName: "Shift Evidence Veeam Backup Evidence Collector",
    type: "collector",
    moduleKey: "backup_evidence",
    path: "/collectors/backup/shift-veeam-backup-collector.ps1",
    readmePath: "/collectors/backup/README.md",
    mode: "read-only",
    platform: "veeam-backup-replication",
    language: "PowerShell / Veeam PowerShell",
    outputSchema: "shift-evidence.backup-evidence.v1",
    requirement: "Veeam Backup & Replication PowerShell with read permissions",
  },
  {
    key: "backup-evidence-readme",
    displayName: "Shift Evidence Veeam Backup Evidence Collector README",
    type: "readme",
    moduleKey: "backup_evidence",
    path: "/collectors/backup/README.md",
    mode: "read-only",
    platform: "veeam-backup-replication",
    language: "Markdown",
    outputSchema: "shift-evidence.backup-evidence.v1",
    requirement: "Review before running collector",
  },
  {
    key: "storage-san-template-csv",
    displayName: "Shift Evidence Storage/SAN CSV Template",
    type: "template",
    moduleKey: "storage_san",
    path: "/templates/storage/shift-storage-san-template.csv",
    readmePath: "/templates/storage/README.md",
    mode: "customer-provided",
    platform: "vendor-neutral-storage",
    language: "CSV",
    outputSchema: "shift-evidence.storage-san.v1",
    requirement: "Customer-provided sanitized storage evidence",
  },
  {
    key: "storage-san-template-json",
    displayName: "Shift Evidence Storage/SAN JSON Template",
    type: "template",
    moduleKey: "storage_san",
    path: "/templates/storage/shift-storage-san-template.json",
    readmePath: "/templates/storage/README.md",
    mode: "customer-provided",
    platform: "vendor-neutral-storage",
    language: "JSON",
    outputSchema: "shift-evidence.storage-san.v1",
    requirement: "Customer-provided sanitized storage evidence",
  },
  {
    key: "storage-san-readme",
    displayName: "Shift Evidence Storage/SAN Template README",
    type: "readme",
    moduleKey: "storage_san",
    path: "/templates/storage/README.md",
    mode: "customer-provided",
    platform: "vendor-neutral-storage",
    language: "Markdown",
    outputSchema: "shift-evidence.storage-san.v1",
    requirement: "Review before populating template",
  },
  {
    key: "application-dependency-template-csv",
    displayName: "Shift Evidence Application Dependency CSV Template",
    type: "template",
    moduleKey: "application_dependency",
    path: "/templates/dependencies/shift-application-dependency-template.csv",
    readmePath: "/templates/dependencies/README.md",
    mode: "customer-provided",
    platform: "application-dependency-mapping",
    language: "CSV",
    outputSchema: "shift-evidence.application-dependencies.v1",
    requirement: "Customer-provided sanitized dependency evidence",
  },
  {
    key: "application-dependency-template-json",
    displayName: "Shift Evidence Application Dependency JSON Template",
    type: "template",
    moduleKey: "application_dependency",
    path: "/templates/dependencies/shift-application-dependency-template.json",
    readmePath: "/templates/dependencies/README.md",
    mode: "customer-provided",
    platform: "application-dependency-mapping",
    language: "JSON",
    outputSchema: "shift-evidence.application-dependencies.v1",
    requirement: "Customer-provided sanitized dependency evidence",
  },
  {
    key: "application-dependency-readme",
    displayName: "Shift Evidence Application Dependency Template README",
    type: "readme",
    moduleKey: "application_dependency",
    path: "/templates/dependencies/README.md",
    mode: "customer-provided",
    platform: "application-dependency-mapping",
    language: "Markdown",
    outputSchema: "shift-evidence.application-dependencies.v1",
    requirement: "Review before populating template",
  },
];

function publicFilePath(publicPath) {
  if (!publicPath.startsWith("/")) {
    throw new Error(`Artifact path must be public-root relative: ${publicPath}`);
  }
  return path.join(publicRoot, publicPath.slice(1));
}

function sha256(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

const hydratedArtifacts = artifacts.map((artifact) => {
  const filePath = publicFilePath(artifact.path);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing artifact: ${artifact.path}`);
  }

  const digest = sha256(filePath);
  const shaPath = `${filePath}.sha256`;
  const shaPublicPath = `${artifact.path}.sha256`;
  fs.writeFileSync(shaPath, `${digest}  ${path.basename(filePath)}\n`, "utf8");

  return {
    ...artifact,
    version,
    sha256: digest,
    sha256Path: shaPublicPath,
    sizeBytes: fs.statSync(filePath).size,
    status: "controlled_beta",
    lastReviewedAt,
  };
});

const manifest = {
  schema: "shift-evidence.evidence-artifacts-manifest.v1",
  generatedAt,
  artifacts: hydratedArtifacts,
};

fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

console.log(`Generated ${path.relative(repoRoot, manifestPath)} with ${hydratedArtifacts.length} artifacts`);
