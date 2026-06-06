import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import PDFDocument from "pdfkit";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const outputDir = path.join(repoRoot, "public", "sample-reports");
const outputPath = path.join(outputDir, "proxmox-migration-readiness-sample-report.pdf");
const versionedOutputPath = path.join(outputDir, "proxmox-migration-readiness-premium-sample-report-v2.pdf");
const brandAssetsConfigPath = path.join(repoRoot, "src", "config", "brand-assets.json");
const brandAssets = JSON.parse(fs.readFileSync(brandAssetsConfigPath, "utf8"));
const primaryBrandLogoPath = path.join(repoRoot, "public", brandAssets.public.pdfLogo.replace(/^\//, ""));
const primaryBrandLogo = fs.existsSync(primaryBrandLogoPath) ? fs.readFileSync(primaryBrandLogoPath) : null;
const brandWordmark = brandAssets.wordmark;

const colors = {
  ink: "#101828",
  muted: "#526173",
  faint: "#8a97a8",
  line: "#d8e1ec",
  paper: "#ffffff",
  panel: "#f6f8fb",
  panelStrong: "#edf6fb",
  tableHeader: "#eaf2f8",
  cyan: "#0891b2",
  cyanSoft: "#e7f8fb",
  green: "#047857",
  greenSoft: "#e9f8f1",
  amber: "#b45309",
  amberSoft: "#fff4df",
  red: "#b91c1c",
  redSoft: "#fff0f0",
  purple: "#5b4b8a",
};

const dataset = {
  client: "Northbridge Industrial Group",
  reportTitle: "Proxmox Migration Readiness",
  subtitle: "Full Premium Synthetic Sample Report",
  readiness: 64,
  confidence: 58,
  storageReadiness: 52,
  businessContinuity: 46,
  scope: [
    ["VMs analyzed", "126"],
    ["ESXi hosts", "6"],
    ["Clusters", "3"],
    ["Datastores", "14"],
    ["VLANs", "22"],
    ["Port groups", "38"],
    ["Snapshots", "19"],
    ["Critical workloads", "14"],
  ],
  workloadMix: [
    ["Web / utility", "34", "Good Wave 1 candidates after pilot validation."],
    ["SQL / database", "12", "Requires backup restore evidence and performance review."],
    ["ERP / line of business", "4", "Hold until dependency and rollback plans are signed off."],
    ["Domain services", "6", "Special sequencing, identity rollback and replication checks required."],
    ["File / storage-heavy", "18", "Storage target and throughput validation required."],
    ["Legacy / unknown owner", "11", "Discovery and retirement review recommended."],
  ],
  evidence: [
    ["RVTools inventory", "Received", "High", "Inventory baseline is usable."],
    ["Technical context", "Received", "Medium", "Enough for a first decision pack."],
    ["Backup restore evidence", "Missing", "Low", "Blocks critical workloads."],
    ["Application dependencies", "Partial", "Low", "ERP, SQL and identity dependencies need mapping."],
    ["Performance history", "Missing", "Low", "Sizing confidence remains limited."],
    ["Network / VLAN mapping", "Partial", "Medium", "Port groups known; target design pending."],
    ["Proxmox target design", "Partial", "Medium", "Node count known; storage and network need validation."],
  ],
  datastores: [
    ["ds-prod-san-01", "SAN", "88%", "High", "Above 80%; capacity and migration window risk."],
    ["ds-vsan-cluster-a", "vSAN", "82%", "High", "Above 80%; validate evacuation and target design."],
    ["ds-file-nfs-02", "NFS", "76%", "Medium", "Near threshold; monitor growth."],
    ["ds-archive-local", "Local", "41%", "Low", "Retire/archive candidates possible."],
    ["ds-sql-san-03", "SAN", "79%", "Medium", "Below threshold but SQL-heavy."],
  ],
  licensing: {
    hosts: 6,
    socketsPerHost: 2,
    coresPerSocket: 24,
    sockets: 12,
    rawCores: 288,
    minimumBillableCores: 192,
    billableCores: 288,
    vmwareUnitPriceUsd: 350,
    vmwareAnnualUsd: 100800,
    proxmoxUnitPriceEur: 1020,
    fxRate: 1.08,
    proxmoxUnitPriceUsd: 1101.6,
    proxmoxAnnualUsd: 13219,
    annualSavingsUsd: 87581,
    threeYearSavingsUsd: 262743,
  },
  risks: [
    ["Backup evidence missing", "Critical", "Business continuity", "No restore tests supplied", "Run restore validation before SQL/ERP/DC waves", "Wave 0"],
    ["Application dependencies incomplete", "High", "Migration sequencing", "ERP and SQL links partially known", "Build dependency map and owner sign-off", "Wave 0"],
    ["Datastores above 80%", "High", "Storage capacity", "2 key datastores above threshold", "Validate target capacity and evacuation plan", "Before Wave 1"],
    ["Old snapshots detected", "High", "Operational hygiene", "19 snapshots in RVTools-style evidence", "Clean up or approve exceptions", "Before pilot"],
    ["Network target incomplete", "Medium", "Cutover risk", "VLAN mapping partial", "Confirm Proxmox bridge/VLAN design", "Wave 0"],
    ["Performance history missing", "Medium", "Sizing confidence", "No time-series utilization evidence", "Collect CPU/RAM/IOPS history", "Before production"],
  ],
  workloads: [
    ["web-portal-01", "Web app", "Low", "Migrate after pilot", "Wave 1", "Low dependency and rollback-friendly."],
    ["fileserver-02", "File server", "Medium", "Validate storage first", "Wave 2", "Storage-heavy and user-facing."],
    ["sql-prod-01", "Database", "High", "Manual review", "Wave 3", "Requires restore test and performance baseline."],
    ["dc-main-01", "Domain controller", "High", "Special plan", "Wave 3", "Identity sequencing and rollback required."],
    ["erp-prod", "ERP", "Critical", "Hold", "Hold", "Do not move until dependencies and backups are proven."],
    ["backup-proxy", "Backup service", "High", "Rebuild or redesign", "Wave 0", "Backup chain is part of rollback posture."],
    ["monitoring", "Monitoring", "Low", "Pilot candidate", "Wave 0", "Useful for observing migration tests."],
    ["legacy-app", "Unknown legacy app", "Medium", "Retire/rehost review", "Retire", "Ownership and business use unclear."],
  ],
  waves: [
    ["Wave 0", "Validation / pilot", "Monitoring, utility workloads, import test", "Restore test, target network, rollback plan"],
    ["Wave 1", "Low-risk workloads", "Web, utility, low-dependency services", "Pilot success and owner approval"],
    ["Wave 2", "Standard production", "File services and standard apps", "Storage throughput, backup proof, dependency map"],
    ["Wave 3", "Critical systems", "SQL, ERP, identity", "Executive go/no-go, restore tests, maintenance windows"],
    ["Hold", "Blocked workloads", "ERP and unknown-owner systems", "Dependency evidence and rollback maturity"],
    ["Retire", "Decommission candidates", "Legacy/unused workloads", "Business owner confirmation"],
  ],
  roadmap: [
    ["Backup restore validation", "P0", "High", "Medium", "Infrastructure / backup owner", "Before Wave 0 exit"],
    ["Application dependency map", "P0", "High", "Medium", "Application owners", "Before Wave 1"],
    ["Storage target design review", "P1", "High", "Medium", "Platform team", "Before Wave 1"],
    ["VLAN and bridge mapping", "P1", "Medium", "Low", "Network team", "Before pilot import"],
    ["Snapshot cleanup", "P1", "Medium", "Low", "VM owners", "Before production waves"],
    ["Performance baseline collection", "P2", "Medium", "Medium", "Operations", "Before sizing approval"],
  ],
  memory: [
    ["Decision", "ERP is excluded from Wave 1 until dependency and rollback evidence are approved."],
    ["Decision", "SQL workloads require backup restore validation before production migration planning."],
    ["Decision", "Wave 0 will be used for import testing and operational runbook rehearsal."],
    ["Pending", "Confirm final Proxmox node count, CPU/RAM headroom and subscription tier."],
    ["Pending", "Review Storage Destination Readiness design before choosing Ceph, NFS or SAN."],
  ],
};

const totalPages = 23;

fs.mkdirSync(outputDir, { recursive: true });

const doc = new PDFDocument({
  size: "A4",
  margin: 44,
  compress: false,
  info: {
    Title: "Full Premium Synthetic Sample Readiness Report",
    Author: "Shift Evidence",
    Subject: "Synthetic VMware to Proxmox premium readiness sample report",
    Keywords: "synthetic, sample, VMware, Proxmox, readiness, storage, licensing, advisor",
  },
});

const stream = fs.createWriteStream(outputPath);
doc.pipe(stream);

let pageNumber = 0;

function safeText(value) {
  return String(value ?? "")
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u2192/g, "->")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/\u2026/g, "...");
}

function currency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function drawBrandIcon(x, y, size = 24) {
  if (primaryBrandLogo) {
    try {
      doc.image(primaryBrandLogo, x, y, {
        fit: [size, size],
        align: "center",
        valign: "center",
      });
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

function drawPublicBrandIcon(pdfDoc, x, y, size = 24) {
  if (primaryBrandLogo) {
    try {
      pdfDoc.image(primaryBrandLogo, x, y, {
        fit: [size, size],
        align: "center",
        valign: "center",
      });
      return true;
    } catch {
      return false;
    }
  }

  return false;
}

function footer() {
  const y = doc.page.height - 70;
  doc.font("Helvetica").fontSize(7.5).fillColor(colors.faint).text(
    "Shift Evidence - full premium synthetic sample - no customer data - no production access",
    44,
    y,
    { width: 390, lineBreak: false },
  );
  doc.text(`${pageNumber} / ${totalPages}`, 500, y, { width: 50, align: "right", lineBreak: false });
}

function header(kicker) {
  doc.rect(0, 0, doc.page.width, 62).fill(colors.panelStrong);
  doc.strokeColor(colors.line).lineWidth(0.7).moveTo(0, 62).lineTo(doc.page.width, 62).stroke();
  const hasBrandIcon = drawBrandIcon(44, 18, 20);
  doc.fillColor(colors.ink).font("Helvetica-Bold").fontSize(8).text(brandWordmark.toUpperCase(), hasBrandIcon ? 70 : 44, 23, { characterSpacing: 1.3 });
  doc.fillColor(colors.muted).font("Helvetica").fontSize(8).text(safeText(kicker).toUpperCase(), 315, 24, { width: 236, align: "right" });
}

function addPage(title, kicker = "Full Premium Synthetic Sample Report", subtitle = "") {
  if (pageNumber > 0) {
    footer();
    doc.addPage();
  }
  pageNumber += 1;
  header(kicker);
  doc.y = 88;
  doc.x = 44;
  doc.fillColor(colors.ink).font("Helvetica-Bold").fontSize(22).text(safeText(title), 44, 88, { width: 500 });
  if (subtitle) {
    doc.moveDown(0.2);
    doc.fillColor(colors.muted).font("Helvetica").fontSize(10).text(safeText(subtitle), 44, doc.y, { width: 500, lineGap: 2 });
  }
  doc.moveDown(0.8);
}

function paragraph(text, options = {}) {
  doc.fillColor(colors.ink).font("Helvetica").fontSize(options.size ?? 10.2).text(safeText(text), 44, doc.y, {
    width: options.width ?? 506,
    lineGap: options.lineGap ?? 3,
  });
  doc.moveDown(options.after ?? 0.6);
}

function callout(text, tone = "info") {
  const palette = tone === "danger"
    ? [colors.redSoft, colors.red]
    : tone === "warning"
      ? [colors.amberSoft, colors.amber]
      : tone === "good"
        ? [colors.greenSoft, colors.green]
        : [colors.cyanSoft, colors.cyan];
  const y = doc.y;
  doc.roundedRect(44, y, 506, 62, 10).fillAndStroke(palette[0], palette[1]);
  doc.fillColor(palette[1]).font("Helvetica-Bold").fontSize(8).text("READINESS NOTE", 60, y + 12);
  doc.fillColor(colors.ink).font("Helvetica").fontSize(9.4).text(safeText(text), 60, y + 29, { width: 474, lineGap: 2 });
  doc.y = y + 78;
}

function miniMetric(x, y, w, label, value, note = "", tone = "info") {
  const accent = tone === "danger" ? colors.red : tone === "warning" ? colors.amber : tone === "good" ? colors.green : colors.cyan;
  doc.roundedRect(x, y, w, 76, 10).fillAndStroke(colors.panel, colors.line);
  doc.fillColor(accent).font("Helvetica-Bold").fontSize(7.5).text(safeText(label).toUpperCase(), x + 12, y + 11, { width: w - 24 });
  doc.fillColor(colors.ink).font("Helvetica-Bold").fontSize(18).text(safeText(value), x + 12, y + 28, { width: w - 24 });
  if (note) {
    doc.fillColor(colors.muted).font("Helvetica").fontSize(7.6).text(safeText(note), x + 12, y + 53, { width: w - 24 });
  }
}

function twoColumnCards(items) {
  let x = 44;
  let y = doc.y;
  items.forEach(([title, body, tone], index) => {
    const accent = tone === "danger" ? colors.red : tone === "warning" ? colors.amber : tone === "good" ? colors.green : colors.cyan;
    doc.roundedRect(x, y, 238, 90, 10).fillAndStroke(colors.panel, colors.line);
    doc.fillColor(accent).font("Helvetica-Bold").fontSize(8).text(safeText(title).toUpperCase(), x + 14, y + 13, { width: 210 });
    doc.fillColor(colors.ink).font("Helvetica").fontSize(9.2).text(safeText(body), x + 14, y + 33, { width: 210, lineGap: 2 });
    x += 268;
    if (index % 2 === 1) {
      x = 44;
      y += 108;
    }
  });
  doc.y = y + (items.length % 2 === 0 ? 102 : 108);
}

function table(title, headers, rows, widths, options = {}) {
  doc.fillColor(colors.ink).font("Helvetica-Bold").fontSize(13).text(safeText(title), 44, doc.y);
  doc.moveDown(0.35);
  const startX = 44;
  let y = doc.y;
  const rowH = options.rowH ?? 32;
  doc.roundedRect(startX, y, widths.reduce((a, b) => a + b, 0), 24, 7).fill(colors.tableHeader);
  let x = startX;
  headers.forEach((head, index) => {
    doc.fillColor(colors.ink).font("Helvetica-Bold").fontSize(7.3).text(safeText(head), x + 6, y + 8, { width: widths[index] - 12 });
    x += widths[index];
  });
  y += 24;
  rows.forEach((row, rowIndex) => {
    x = startX;
    doc.rect(startX, y, widths.reduce((a, b) => a + b, 0), rowH).fill(rowIndex % 2 === 0 ? "#ffffff" : "#f7fafc");
    row.forEach((cell, index) => {
      doc.fillColor(index === 0 ? colors.ink : colors.muted).font(index === 0 ? "Helvetica-Bold" : "Helvetica").fontSize(options.fontSize ?? 7.8).text(safeText(cell), x + 6, y + 7, {
        width: widths[index] - 12,
        lineGap: 1,
      });
      x += widths[index];
    });
    y += rowH;
  });
  doc.y = y + 18;
}

function bullets(title, items) {
  doc.fillColor(colors.ink).font("Helvetica-Bold").fontSize(13).text(safeText(title), 44, doc.y);
  doc.moveDown(0.4);
  items.forEach((item) => {
    const y = doc.y;
    doc.circle(50, y + 5, 3).fill(colors.cyan);
    doc.fillColor(colors.ink).font("Helvetica").fontSize(9.4).text(safeText(item), 62, y, { width: 480, lineGap: 2 });
    doc.moveDown(0.55);
  });
  doc.moveDown(0.25);
}

function coverPage() {
  pageNumber = 1;
  doc.rect(0, 0, doc.page.width, doc.page.height).fill(colors.paper);
  doc.rect(0, 0, doc.page.width, 120).fill(colors.panelStrong);
  doc.circle(510, 120, 190).fillOpacity(0.12).fill(colors.cyan).fillOpacity(1);
  doc.circle(80, 740, 170).fillOpacity(0.08).fill("#8b5cf6").fillOpacity(1);
  const hasBrandIcon = drawBrandIcon(48, 40, 32);
  doc.fillColor(colors.ink).font("Helvetica-Bold").fontSize(12).text(brandWordmark.toUpperCase(), hasBrandIcon ? 84 : 48, 49, { characterSpacing: 1.4 });
  doc.fillColor(colors.cyan).font("Helvetica-Bold").fontSize(11).text("Full Premium Synthetic Sample Report", 48, 118);
  doc.fillColor(colors.ink).font("Helvetica-Bold").fontSize(42).text(dataset.reportTitle, 48, 152, { width: 470, lineGap: -3 });
  doc.fillColor(colors.muted).font("Helvetica").fontSize(15).text("VMware -> Proxmox migration decision pack", 48, 264);
  doc.fillColor(colors.ink).font("Helvetica-Bold").fontSize(18).text(dataset.client, 48, 318);
  doc.fillColor(colors.muted).font("Helvetica").fontSize(11).text("Synthetic industrial environment. No customer data. No production access. No migration execution.", 48, 348, { width: 460, lineGap: 3 });
  miniMetric(48, 430, 150, "Readiness", `${dataset.readiness}/100`, "Medium posture", "warning");
  miniMetric(222, 430, 150, "Confidence", `${dataset.confidence}/100`, "Limited evidence", "warning");
  miniMetric(396, 430, 150, "Storage", `${dataset.storageReadiness}/100`, "Needs validation", "danger");
  doc.roundedRect(48, 542, 498, 132, 12).fillAndStroke(colors.panel, colors.line);
  doc.fillColor(colors.cyan).font("Helvetica-Bold").fontSize(9).text("PREMIUM SAMPLE MODULES", 68, 564);
  doc.fillColor(colors.ink).font("Helvetica").fontSize(10.4).text(
    "Migration readiness, Storage Destination Readiness, Licensing & Cost Exposure, Business Continuity Risk, VM Risk Matrix, Senior AI Advisor, Project Memory and executive recommendations.",
    68,
    586,
    { width: 456, lineGap: 4 },
  );
  doc.fillColor(colors.muted).font("Helvetica").fontSize(9).text(
    "Professional Assessment: evidence-backed report and VM decision pack. Migration Blueprint: scoped waves, validation gates, rollback expectations and remediation planning.",
    68,
    638,
    { width: 456, lineGap: 3 },
  );
}

coverPage();

addPage("Executive Summary", "Section 1", "A board-ready view of migration posture, confidence and go/no-go constraints.");
paragraph("Northbridge Industrial Group has a medium VMware -> Proxmox migration readiness posture. The inventory is usable for planning, but the evidence base is not strong enough to approve critical production waves.");
twoColumnCards([
  ["Can advance", "A controlled Wave 0 and selected low-risk Wave 1 workloads can proceed after import and rollback validation.", "good"],
  ["Must not advance", "ERP, SQL, domain controllers and storage-heavy systems should not enter early waves without backup and dependency evidence.", "danger"],
  ["Executive recommendation", "Use the premium report to approve a pilot, not a broad production migration.", "warning"],
  ["Commercial takeaway", "Licensing exposure is meaningful, but savings should not override readiness and continuity risk.", "info"],
]);
bullets("What executives should take from this page", [
  "Readiness and evidence confidence are separate decision signals.",
  "Savings estimates remain directional until procurement and technical assumptions are validated.",
  "Critical workloads remain gated by backup, dependency, storage and rollback evidence.",
]);
callout("Recommended decision: approve a controlled pilot, require backup restore evidence, finalize storage design and use go/no-go gates before production waves.", "warning");

addPage("Assessment Scope", "Section 2", "What this synthetic premium sample includes and what evidence remains missing.");
table("Evidence evaluated", ["Evidence", "Status", "Confidence", "Impact"], dataset.evidence, [145, 75, 80, 206], { rowH: 34 });
bullets("Premium modules represented", [
  "VMware -> Proxmox Migration Readiness and migration wave planning.",
  "Storage Destination Readiness with Ceph/shared storage considerations.",
  "Licensing & Cost Exposure with VMware billable cores and Proxmox annual cost.",
  "Business Continuity Risk, Senior AI Advisor Q&A and Project Memory decisions.",
]);

addPage("Environment Overview", "Section 3", "Synthetic industrial estate with partial 24/7 operations and mixed criticality.");
let metricX = 44;
let metricY = doc.y;
dataset.scope.forEach(([label, value], index) => {
  miniMetric(metricX, metricY, 112, label, value);
  metricX += 126;
  if ((index + 1) % 4 === 0) {
    metricX = 44;
    metricY += 94;
  }
});
doc.y = metricY + 96;
table("Workload categories", ["Category", "Count", "Interpretation"], dataset.workloadMix, [130, 60, 316], { rowH: 34 });

addPage("Migration Readiness Score", "Section 4", "Readiness and evidence confidence are intentionally separate.");
miniMetric(44, doc.y, 155, "Migration Readiness Score", `${dataset.readiness}/100`, "Medium readiness", "warning");
miniMetric(220, doc.y, 155, "Evidence Confidence Score", `${dataset.confidence}/100`, "Limited confidence", "warning");
miniMetric(396, doc.y, 155, "Business Continuity", `${dataset.businessContinuity}/100`, "Needs work", "danger");
doc.y += 102;
paragraph("A 64/100 readiness score means there are viable migration candidates, not that the full environment is production-ready. Confidence is limited because backup restore evidence, dependency maps and performance history are incomplete.");
callout("A readiness score is not a migration approval. It is a decision signal that must be paired with evidence confidence, continuity risk and owner sign-off.", "warning");

addPage("Evidence Confidence Score", "Section 5", "How missing evidence changes the migration recommendation.");
paragraph("The assessment confidence score is 58/100. RVTools-style inventory and technical context are enough to plan a pilot, but not enough to authorize critical workload migration.");
table("Evidence confidence matrix", ["Evidence", "Signal", "Confidence", "Action"], dataset.evidence, [135, 80, 75, 216], { rowH: 34 });
bullets("Recommended next evidence", [
  "Backup export and representative restore test result.",
  "Application dependency map with owners and maintenance windows.",
  "Target Proxmox storage and network design assumptions.",
  "Performance history for SQL, ERP, file and identity workloads.",
]);
callout("Backup evidence, dependency mapping and performance history are the highest-impact confidence gaps.", "danger");

addPage("VMware -> Proxmox Technical Readiness", "Section 6", "Technical blockers and pilot candidates.");
twoColumnCards([
  ["Pilot candidates", "Monitoring, web utility systems and low-dependency workloads can be used for import testing.", "good"],
  ["Manual review", "SQL, ERP, domain controllers and file servers require workload-specific validation.", "warning"],
  ["Blockers", "Unknown dependencies, untested restores and storage capacity risk block broad migration.", "danger"],
  ["Runbook need", "Every wave needs rollback steps, owner approval and acceptance criteria.", "info"],
]);
bullets("Technical considerations", [
  "Domain controllers require identity replication, DNS and rollback sequencing.",
  "SQL workloads require restore tests, performance baselines and maintenance windows.",
  "ERP workloads require dependency maps, business owner approval and go/no-go criteria.",
  "Storage-heavy file servers require target throughput and capacity validation.",
]);

addPage("Storage Destination Readiness", "Section 7", "Storage is treated as a first-class migration risk, not an afterthought.");
miniMetric(44, doc.y, 155, "Storage Readiness", `${dataset.storageReadiness}/100`, "Conditional", "danger");
miniMetric(220, doc.y, 155, "High usage threshold", "80%", "Central threshold", "warning");
miniMetric(396, doc.y, 155, "Datastores > 80%", "2", "Capacity risk", "danger");
doc.y += 104;
table("Storage signals", ["Datastore", "Type", "Used", "Risk", "Action"], dataset.datastores, [105, 55, 48, 55, 243], { rowH: 34, fontSize: 7.2 });
callout("Storage sizing is not a quote. Storage design requires validation, and storage does not directly impact licensing cost.", "warning");

addPage("Ceph / Shared Storage Considerations", "Section 8", "Ceph is evaluated, never assumed as the default target.");
twoColumnCards([
  ["Ceph candidate?", "Conditional. It may fit if node count, network, disks and failure domains are validated.", "warning"],
  ["NFS / SAN", "May be appropriate if existing shared storage is retained or target storage is externally managed.", "info"],
  ["ZFS local", "Potential fit for smaller waves or non-HA workloads, depending on RTO/RPO requirements.", "info"],
  ["PBS / backup", "Backup architecture must be validated before production cutover.", "danger"],
]);
bullets("Ceph validation requirements", [
  "At least three suitable nodes and clear failure domain design.",
  "Dedicated storage network and latency/throughput testing.",
  "OSD layout, disk class and capacity headroom validation.",
  "Operational ownership for monitoring, recovery and expansion.",
]);

addPage("Licensing & Cost Exposure", "Section 9", "Directional economics, not a contractual quote.");
const licensingRows = [
  ["VMware sockets", `${dataset.licensing.hosts} hosts x ${dataset.licensing.socketsPerHost} sockets = ${dataset.licensing.sockets}`, "Inventory-derived estimate"],
  ["VMware billable cores", `max(${dataset.licensing.rawCores} raw cores, sockets * 16 = ${dataset.licensing.minimumBillableCores}) = ${dataset.licensing.billableCores}`, "Current model"],
  ["VMware annual estimate", `${dataset.licensing.billableCores} cores x ${currency(dataset.licensing.vmwareUnitPriceUsd)} = ${currency(dataset.licensing.vmwareAnnualUsd)}`, "Reference estimate"],
  ["Proxmox annual cost", `${dataset.licensing.sockets} sockets x ${currency(dataset.licensing.proxmoxUnitPriceUsd)} = ${currency(dataset.licensing.proxmoxAnnualUsd)}`, "Normalized unit price USD"],
  ["Annual savings estimate", currency(dataset.licensing.annualSavingsUsd), "Directional only"],
];
table("Licensing model", ["Item", "Calculation", "Note"], licensingRows, [130, 260, 116], { rowH: 38, fontSize: 7.3 });
callout(`FX assumption: EUR->USD ${dataset.licensing.fxRate}. VMware pricing is an estimate/reference, Proxmox pricing is an estimate by tier, and storage does not impact licensing cost.`, "warning");

addPage("Business Continuity Risk", "Section 10", "What can interrupt service during migration waves.");
table("Continuity risk review", ["Risk", "Level", "Why it matters", "Required control"], [
  ["Downtime risk", "High", "Critical systems lack approved windows", "Wave-level maintenance and rollback plan"],
  ["Backup maturity", "Critical", "Restore tests not supplied", "Evidence of successful restore tests"],
  ["Rollback maturity", "High", "No signed rollback plan for SQL/ERP", "Rollback runbook and owner approval"],
  ["Dependency mapping", "High", "Application links partially known", "Dependency map before Wave 1"],
  ["Performance risk", "Medium", "No historical IOPS/CPU trend", "Collect baseline before sizing sign-off"],
  ["Key person risk", "Medium", "Operational knowledge may be concentrated", "Assign owners and decision log"],
], [100, 62, 170, 174], { rowH: 38, fontSize: 7.2 });

addPage("VM Risk Matrix", "Section 11", "A consultative matrix connects evidence to action.");
table("Risk matrix", ["Risk", "Severity", "Area", "Evidence", "Recommended action", "Phase"], dataset.risks, [96, 52, 82, 105, 126, 45], { rowH: 42, fontSize: 6.8 });

addPage("Workload Classification", "Section 12", "Example workload-level migration recommendations.");
table("Workload decisions", ["VM", "Role", "Complexity", "Recommendation", "Wave", "Reason"], dataset.workloads, [80, 78, 58, 96, 52, 142], { rowH: 38, fontSize: 6.9 });

addPage("Proxmox Target / Sizing Preview", "Section 13", "Sizing is directional until performance evidence is added.");
miniMetric(44, doc.y, 155, "Recommended nodes", "3-4", "HA-capable target", "info");
miniMetric(220, doc.y, 155, "RAM target", "1.8-2.5 TB", "Allocation-based", "info");
miniMetric(396, doc.y, 155, "Usable storage", "70 TB+", "Validate growth", "warning");
doc.y += 104;
table("Target readiness", ["Dimension", "Preview", "Validation required"], [
  ["Backup capacity", "90 TB", "Retention, restore testing, PBS design"],
  ["HA readiness", "Conditional", "Shared storage or replicated design"],
  ["Network readiness", "Requires mapping", "Bridge/VLAN, MTU and storage traffic separation"],
  ["Subscription tier", "Premium sample assumption", "Confirm support tier and socket count"],
], [120, 145, 241], { rowH: 36 });
callout("Sizing without performance history has limited confidence. Capacity, IOPS and growth assumptions must be validated before purchase or production migration.", "warning");

addPage("Recommended Migration Path", "Section 14", "Phased go/no-go gates keep the migration controlled.");
table("Migration path", ["Phase", "Purpose", "Candidate scope", "Evidence to unlock"], dataset.waves, [70, 92, 150, 194], { rowH: 40, fontSize: 7.1 });
callout("Do not use estimated savings alone as a go/no-go criterion. Each wave should pass evidence, rollback and owner approval gates.", "danger");

addPage("Remediation Roadmap", "Section 15", "Prioritized fixes before production movement.");
table("Roadmap", ["Action", "Priority", "Impact", "Effort", "Owner", "Due before"], dataset.roadmap, [118, 46, 52, 52, 118, 120], { rowH: 38, fontSize: 6.9 });

addPage("Senior AI Advisor Insights", "Section 16", "Synthetic premium advisor narrative, not a real customer conversation.");
paragraph("The Senior AI Advisor layer summarizes the decision pressure, highlights unresolved evidence gaps and proposes next actions. In a real assessment it supports, but does not replace, deterministic scoring or expert review.");
twoColumnCards([
  ["Advisor summary", "The environment is a good pilot candidate but not ready for broad critical workload migration.", "info"],
  ["Focus area", "Backups, dependencies and target storage design are the three strongest blockers.", "warning"],
  ["Decision point", "Approve Wave 0 only if import tests and rollback evidence are tracked.", "good"],
  ["Advisor warning", "Do not let licensing savings accelerate ERP or SQL before continuity evidence exists.", "danger"],
]);

addPage("Senior AI Advisor Q&A Highlights", "Section 17A", "Synthetic Q&A examples showing consultative value.");
table("Advisor Q&A", ["Question", "Synthetic advisor answer"], [
  ["Which workloads should we migrate first?", "Start with web, monitoring and low-dependency utility workloads. Exclude SQL, ERP and domain controllers from early waves until restore tests and rollback paths are validated."],
  ["Is our current backup posture enough?", "Not for critical workloads. Restore tests, backup evidence and rollback validation are missing, so production waves should remain gated."],
  ["What should we fix before production?", "Dependency map, backup restore points, VLAN mapping, target capacity, pilot import test and snapshot cleanup."],
], [170, 336], { rowH: 70, fontSize: 7.5 });

addPage("Senior AI Advisor Q&A Highlights", "Section 17B", "Ceph and management approval questions.");
table("Advisor Q&A continued", ["Question", "Synthetic advisor answer"], [
  ["Can we use Ceph as destination storage?", "Only after capacity, performance, failure domains, disk class and dedicated storage networking are validated. Ceph is not the default recommendation."],
  ["What should management see before approval?", "Readiness score, confidence gaps, licensing exposure, annual savings estimate, VM Risk Matrix, pilot plan, remediation roadmap and explicit go/no-go criteria."],
], [170, 336], { rowH: 78, fontSize: 7.5 });
callout("These are synthetic Advisor examples. They are not a real customer chat log and do not include customer data.", "info");

addPage("Project Memory / Decisions Captured", "Section 18", "Premium continuity value across assessment decisions.");
table("Decision memory", ["Type", "Captured item"], dataset.memory, [85, 421], { rowH: 40, fontSize: 8 });
paragraph("Project Memory helps teams preserve why decisions were made, what remains pending and which assumptions must be revisited before the next wave.", { size: 10 });

addPage("Assumptions & Disclaimers", "Section 19", "Boundaries that keep the sample safe and honest.");
bullets("Sample boundaries", [
  "Synthetic sample only. No customer data, no production access and no real customer conversation.",
  "Shift Evidence does not migrate VMs and does not guarantee zero downtime.",
  "Pricing is an estimate/reference, not a financial quote or vendor contract.",
  `FX is static for this sample: EUR->USD ${dataset.licensing.fxRate}.`,
  "VMware billable cores and Proxmox annual cost are shown for directional planning.",
  "Storage design requires validation and does not directly impact licensing cost.",
  "Backup and dependency gaps reduce confidence and can block production migration waves.",
  "Advisor output supports deterministic scoring and expert review; it does not replace them.",
]);

addPage("Appendix / Calculation Notes", "Section 20", "Transparent assumptions behind the synthetic sample.");
table("Calculation notes", ["Area", "Assumption"], [
  ["VMware billable cores", "VMware billable cores = max(raw cores, sockets * 16)."],
  ["Proxmox annual cost", "Proxmox annual cost = sockets * normalized unit price USD."],
  ["Storage threshold", "Datastores at or above 80% are flagged as high usage."],
  ["Savings", "Annual savings estimate = VMware annual estimate - Proxmox annual estimate."],
  ["Confidence", "Missing backup, dependency, network and performance evidence reduce confidence."],
], [150, 356], { rowH: 42 });

addPage("Ready To Assess Your Own Environment?", "Final CTA", "Use the premium sample to understand the deliverable before uploading approved evidence.");
paragraph("Start your own readiness assessment, upload approved VMware evidence and use the premium report to support internal decision-making before migration spend or production movement.");
twoColumnCards([
  ["Watch 90-second simulation", "See the value path quickly before opening the full demo workspace.", "info"],
  ["Explore Demo Workspace", "Review synthetic scenarios, risk matrices, Advisor notes and demo PDFs.", "good"],
  ["Start Professional Assessment", "Create a workspace and upload approved evidence for your environment.", "warning"],
  ["Request Migration Blueprint", "Use expert review when waves, gates and rollback assumptions require deeper planning.", "info"],
]);
doc.fillColor(colors.ink).font("Helvetica-Bold").fontSize(14).text("shiftevidence.com/demo/replay", 44, 585);
doc.text("shiftevidence.com/demo/workspace", 44, 615);
doc.text("shiftevidence.com/pricing", 44, 645);
doc.text("shiftevidence.com/contact", 44, 675);

footer();
doc.end();

await new Promise((resolve, reject) => {
  stream.on("finish", resolve);
  stream.on("error", reject);
});

function normalizePdf(filePath, idSeed) {
  const deterministicPdfId = `/ID [<${idSeed}> <${idSeed}>]`;
  const pdfContent = fs.readFileSync(filePath, "latin1");
  fs.writeFileSync(
    filePath,
    pdfContent
      .replace(/\/ID \[<[^>]{32}> <[^>]{32}>\]/, deterministicPdfId)
      .replace(/D:\d{14}Z/g, "D:20260531000000Z"),
    "latin1",
  );
}

function generatePublicSampleVariant(filePath) {
  const publicTotalPages = 13;
  const publicDoc = new PDFDocument({
    size: "A4",
    margin: 44,
    compress: false,
    info: {
      Title: "Public Synthetic Sample Readiness Report",
      Author: "Shift Evidence",
      Subject: "Synthetic VMware to Proxmox public readiness sample report",
      Keywords: "synthetic, public sample, VMware, Proxmox, readiness, evidence",
    },
  });
  const publicStream = fs.createWriteStream(filePath);
  publicDoc.pipe(publicStream);
  let publicPageNumber = 0;

  function publicFooter() {
    const y = publicDoc.page.height - 70;
    publicDoc.font("Helvetica").fontSize(7.5).fillColor(colors.faint).text(
      "Shift Evidence - public synthetic sample - no customer data - no production access",
      44,
      y,
      { width: 390, lineBreak: false },
    );
    publicDoc.text(`${publicPageNumber} / ${publicTotalPages}`, 500, y, { width: 50, align: "right", lineBreak: false });
  }

  function publicHeader(kicker) {
    publicDoc.rect(0, 0, publicDoc.page.width, 62).fill(colors.panelStrong);
    publicDoc.strokeColor(colors.line).lineWidth(0.7).moveTo(0, 62).lineTo(publicDoc.page.width, 62).stroke();
    const hasBrandIcon = drawPublicBrandIcon(publicDoc, 44, 18, 20);
    publicDoc.fillColor(colors.ink).font("Helvetica-Bold").fontSize(8).text(brandWordmark.toUpperCase(), hasBrandIcon ? 70 : 44, 23, { characterSpacing: 1.3 });
    publicDoc.fillColor(colors.muted).font("Helvetica").fontSize(8).text(safeText(kicker).toUpperCase(), 315, 24, { width: 236, align: "right" });
  }

  function publicAddPage(title, kicker = "Public Synthetic Sample Report", subtitle = "") {
    if (publicPageNumber > 0) {
      publicFooter();
      publicDoc.addPage();
    }
    publicPageNumber += 1;
    publicHeader(kicker);
    publicDoc.y = 88;
    publicDoc.x = 44;
    publicDoc.fillColor(colors.ink).font("Helvetica-Bold").fontSize(22).text(safeText(title), 44, 88, { width: 500 });
    if (subtitle) {
      publicDoc.moveDown(0.2);
      publicDoc.fillColor(colors.muted).font("Helvetica").fontSize(10).text(safeText(subtitle), 44, publicDoc.y, { width: 500, lineGap: 2 });
    }
    publicDoc.moveDown(0.8);
  }

  function publicParagraph(text, options = {}) {
    publicDoc.fillColor(colors.ink).font("Helvetica").fontSize(options.size ?? 10.2).text(safeText(text), 44, publicDoc.y, {
      width: options.width ?? 506,
      lineGap: options.lineGap ?? 3,
    });
    publicDoc.moveDown(options.after ?? 0.6);
  }

  function publicCallout(title, text, tone = "info") {
    const palette = tone === "danger"
      ? [colors.redSoft, colors.red]
      : tone === "warning"
        ? [colors.amberSoft, colors.amber]
        : tone === "good"
          ? [colors.greenSoft, colors.green]
          : [colors.cyanSoft, colors.cyan];
    const y = publicDoc.y;
    publicDoc.roundedRect(44, y, 506, 66, 10).fillAndStroke(palette[0], palette[1]);
    publicDoc.fillColor(palette[1]).font("Helvetica-Bold").fontSize(8).text(safeText(title).toUpperCase(), 60, y + 12);
    publicDoc.fillColor(colors.ink).font("Helvetica").fontSize(9.2).text(safeText(text), 60, y + 29, { width: 474, lineGap: 2 });
    publicDoc.y = y + 82;
  }

  function publicMiniMetric(x, y, w, label, value, note = "", tone = "info") {
    const accent = tone === "danger" ? colors.red : tone === "warning" ? colors.amber : tone === "good" ? colors.green : colors.cyan;
    publicDoc.roundedRect(x, y, w, 76, 10).fillAndStroke(colors.panel, colors.line);
    publicDoc.fillColor(accent).font("Helvetica-Bold").fontSize(7.5).text(safeText(label).toUpperCase(), x + 12, y + 11, { width: w - 24 });
    publicDoc.fillColor(colors.ink).font("Helvetica-Bold").fontSize(18).text(safeText(value), x + 12, y + 28, { width: w - 24 });
    if (note) {
      publicDoc.fillColor(colors.muted).font("Helvetica").fontSize(7.6).text(safeText(note), x + 12, y + 53, { width: w - 24 });
    }
  }

  function publicTable(title, headers, rows, widths, options = {}) {
    publicDoc.fillColor(colors.ink).font("Helvetica-Bold").fontSize(13).text(safeText(title), 44, publicDoc.y);
    publicDoc.moveDown(0.35);
    const startX = 44;
    let y = publicDoc.y;
    const rowH = options.rowH ?? 34;
    publicDoc.roundedRect(startX, y, widths.reduce((a, b) => a + b, 0), 24, 7).fill(colors.tableHeader);
    let x = startX;
    headers.forEach((head, index) => {
      publicDoc.fillColor(colors.ink).font("Helvetica-Bold").fontSize(7.3).text(safeText(head), x + 6, y + 8, { width: widths[index] - 12 });
      x += widths[index];
    });
    y += 24;
    rows.forEach((row, rowIndex) => {
      x = startX;
      publicDoc.rect(startX, y, widths.reduce((a, b) => a + b, 0), rowH).fill(rowIndex % 2 === 0 ? "#ffffff" : "#f7fafc");
      row.forEach((cell, index) => {
        publicDoc.fillColor(index === 0 ? colors.ink : colors.muted).font(index === 0 ? "Helvetica-Bold" : "Helvetica").fontSize(options.fontSize ?? 7.5).text(safeText(cell), x + 6, y + 7, {
          width: widths[index] - 12,
          lineGap: 1,
        });
        x += widths[index];
      });
      y += rowH;
    });
    publicDoc.y = y + 18;
  }

  function publicBullets(title, items) {
    publicDoc.fillColor(colors.ink).font("Helvetica-Bold").fontSize(13).text(safeText(title), 44, publicDoc.y);
    publicDoc.moveDown(0.4);
    items.forEach((item) => {
      const y = publicDoc.y;
      publicDoc.circle(50, y + 5, 3).fill(colors.cyan);
      publicDoc.fillColor(colors.ink).font("Helvetica").fontSize(9.4).text(safeText(item), 62, y, { width: 480, lineGap: 2 });
      publicDoc.moveDown(0.55);
    });
    publicDoc.moveDown(0.25);
  }

  publicPageNumber = 1;
  publicDoc.rect(0, 0, publicDoc.page.width, publicDoc.page.height).fill(colors.paper);
  publicDoc.rect(0, 0, publicDoc.page.width, 120).fill(colors.panelStrong);
  publicDoc.circle(510, 120, 190).fillOpacity(0.12).fill(colors.cyan).fillOpacity(1);
  publicDoc.circle(80, 740, 170).fillOpacity(0.08).fill("#8b5cf6").fillOpacity(1);
  const hasPublicBrandIcon = drawPublicBrandIcon(publicDoc, 48, 40, 32);
  publicDoc.fillColor(colors.ink).font("Helvetica-Bold").fontSize(12).text(brandWordmark.toUpperCase(), hasPublicBrandIcon ? 84 : 48, 49, { characterSpacing: 1.4 });
  publicDoc.fillColor(colors.cyan).font("Helvetica-Bold").fontSize(11).text("Public Synthetic Sample Report", 48, 118);
  publicDoc.fillColor(colors.ink).font("Helvetica-Bold").fontSize(42).text(dataset.reportTitle, 48, 152, { width: 470, lineGap: -3 });
  publicDoc.fillColor(colors.muted).font("Helvetica").fontSize(15).text("VMware -> Proxmox public decision preview", 48, 264);
  publicDoc.fillColor(colors.ink).font("Helvetica-Bold").fontSize(18).text(dataset.client, 48, 318);
  publicDoc.fillColor(colors.muted).font("Helvetica").fontSize(11).text("Synthetic public sample. No customer data. No production access. No migration execution.", 48, 348, { width: 460, lineGap: 3 });
  publicMiniMetric(48, 430, 150, "Readiness", `${dataset.readiness}/100`, "Medium posture", "warning");
  publicMiniMetric(222, 430, 150, "Confidence", `${dataset.confidence}/100`, "Limited evidence", "warning");
  publicMiniMetric(396, 430, 150, "Preview scope", "Public", "Commercial sample", "info");
  publicDoc.roundedRect(48, 542, 498, 118, 12).fillAndStroke(colors.panel, colors.line);
  publicDoc.fillColor(colors.cyan).font("Helvetica-Bold").fontSize(9).text("PUBLIC SAMPLE MODULES", 68, 564);
  publicDoc.fillColor(colors.ink).font("Helvetica").fontSize(10.4).text(
    "Executive Summary, Environment Overview, Readiness Score, Evidence Confidence, Top Risks, Evidence Matrix, VM Classification Preview, Migration Wave Preview, Proxmox Sizing Preview and Next Steps.",
    68,
    586,
    { width: 456, lineGap: 4 },
  );
  publicDoc.fillColor(colors.muted).font("Helvetica").fontSize(9).text(
    "Use this public sample to understand the methodology. Use the premium sample to review deeper storage, licensing, continuity, advisor and blueprint modules.",
    68,
    638,
    { width: 456, lineGap: 3 },
  );

  publicAddPage("Executive Summary", "Section 1", "A concise commercial view of migration posture, confidence and next actions.");
  publicParagraph("Northbridge Industrial Group has a medium VMware -> Proxmox migration readiness posture. This public sample shows how Shift Evidence separates readiness, evidence confidence and migration risk before a customer uploads approved evidence.");
  publicCallout("Public sample purpose", "This version is intentionally shorter than the premium sample. It sells the methodology without exposing every premium module.", "info");
  publicBullets("What this public sample demonstrates", [
    "Readiness and Evidence Confidence are separate decision signals.",
    "Missing evidence is surfaced as decision value, not hidden.",
    "Top risks and migration waves are tied to evidence gates.",
  ]);

  publicAddPage("Environment Overview", "Section 2", "Synthetic environment snapshot used for the public decision preview.");
  let publicMetricX = 44;
  let publicMetricY = publicDoc.y;
  dataset.scope.slice(0, 8).forEach(([label, value], index) => {
    publicMiniMetric(publicMetricX, publicMetricY, 112, label, value);
    publicMetricX += 126;
    if ((index + 1) % 4 === 0) {
      publicMetricX = 44;
      publicMetricY += 94;
    }
  });
  publicDoc.y = publicMetricY + 96;
  publicTable("Workload mix preview", ["Category", "Count", "Interpretation"], dataset.workloadMix.slice(0, 5), [130, 60, 316], { rowH: 34 });

  publicAddPage("Readiness Score", "Section 3", "Readiness is a planning signal, not migration authorization.");
  publicMiniMetric(44, publicDoc.y, 155, "Readiness Score", `${dataset.readiness}/100`, "Medium readiness", "warning");
  publicMiniMetric(220, publicDoc.y, 155, "Evidence Confidence", `${dataset.confidence}/100`, "Limited confidence", "warning");
  publicMiniMetric(396, publicDoc.y, 155, "Storage Preview", `${dataset.storageReadiness}/100`, "Needs validation", "danger");
  publicDoc.y += 104;
  publicParagraph("A 64/100 readiness score means some workloads can be considered for a controlled pilot. It does not mean the full environment is ready for production migration.");
  publicCallout("Decision guardrail", "Do not use estimated savings alone as a go/no-go criterion. Evidence, rollback and owner approval gates still apply.", "warning");

  publicAddPage("Evidence Confidence Score", "Section 4", "Confidence changes how strongly a recommendation can be trusted.");
  publicTable("Evidence matrix preview", ["Evidence", "Status", "Confidence", "Action"], dataset.evidence.slice(0, 6), [135, 80, 75, 216], { rowH: 34 });
  publicBullets("Missing evidence value", [
    "Backup restore evidence blocks critical workload approval.",
    "Application dependency gaps change wave sequencing.",
    "Performance history improves sizing confidence.",
  ]);

  publicAddPage("Top Risks", "Section 5", "Public sample risk view focused on executive action.");
  publicTable("Risk preview", ["Risk", "Severity", "Area", "Recommended action"], dataset.risks.slice(0, 5).map(([risk, severity, area, _evidence, action]) => [risk, severity, area, action]), [135, 70, 110, 191], { rowH: 42, fontSize: 7.1 });
  publicCallout("Business continuity note", "Backup, dependency, rollback and maintenance-window evidence should be validated before critical workloads enter production waves.", "warning");

  publicAddPage("VM Classification Preview", "Section 6", "A small sample of VM-level recommendations.");
  publicTable("Workload decisions preview", ["VM", "Role", "Complexity", "Wave", "Reason"], dataset.workloads.slice(0, 6).map(([vm, role, complexity, _rec, wave, reason]) => [vm, role, complexity, wave, reason]), [85, 80, 70, 68, 203], { rowH: 40, fontSize: 7.1 });

  publicAddPage("Migration Wave Preview", "Section 7", "Waves show sequencing logic without becoming an execution plan.");
  publicTable("Migration waves preview", ["Phase", "Purpose", "Candidate scope", "Evidence to unlock"], dataset.waves.slice(0, 5), [70, 92, 150, 194], { rowH: 40, fontSize: 7.1 });
  publicCallout("No automatic migration", "This report does not migrate workloads. It helps teams decide what evidence must be gathered before migration planning.", "info");

  publicAddPage("Proxmox Sizing Preview", "Section 8", "Directional sizing signals for sales and discovery conversations.");
  publicMiniMetric(44, publicDoc.y, 155, "Recommended nodes", "3-4", "HA-capable target", "info");
  publicMiniMetric(220, publicDoc.y, 155, "RAM target", "1.8-2.5 TB", "Allocation-based", "info");
  publicMiniMetric(396, publicDoc.y, 155, "Usable storage", "70 TB+", "Validate growth", "warning");
  publicDoc.y += 104;
  publicCallout("Sizing guardrail", "Sizing without performance history has limited confidence. Capacity, IOPS and growth assumptions must be validated before purchase or production migration.", "warning");

  publicAddPage("Commercial Bridge", "Section 9", "How the public sample connects to paid deliverables.");
  publicBullets("Professional Assessment", [
    "Private evidence-backed readiness report.",
    "VM risk matrix and migration decision pack.",
    "Evidence confidence, missing evidence and top-risk prioritization.",
  ]);
  publicBullets("Migration Blueprint", [
    "Scoped waves and validation gates.",
    "Rollback expectations and remediation planning.",
    "Deeper review for production migration decisions.",
  ]);

  publicAddPage("What The Premium Sample Adds", "Section 10", "The premium sample v2 remains the deeper technical reference.");
  publicBullets("Premium-only depth", [
    "Storage Destination Readiness and Ceph/shared storage considerations.",
    "Licensing & Cost Exposure and Business Continuity Risk.",
    "Full VM Risk Matrix, Senior AI Advisor Q&A and Project Memory decisions.",
    "Migration Blueprint bridge with validation gates and rollback expectations.",
  ]);
  publicCallout("Different purpose", "Public sample sells the method. Premium sample demonstrates the deeper consulting-style deliverable.", "good");

  publicAddPage("Assumptions & Disclaimers", "Section 11", "Boundaries that keep the sample safe and honest.");
  publicBullets("Public sample boundaries", [
    "Synthetic sample only. No customer data, no production access and no real customer conversation.",
    "Shift Evidence does not migrate VMs and does not guarantee zero downtime.",
    "Pricing and sizing references are estimates, not financial quotes or vendor contracts.",
    "This report does not replace expert validation, pilot testing, restore proof or owner sign-off.",
  ]);

  publicAddPage("Next Steps", "Final CTA", "Move from public sample to controlled evidence-based assessment.");
  publicParagraph("Use this public sample to understand the structure and value path before uploading approved VMware evidence.");
  publicTable("Recommended path", ["Step", "Action", "Purpose"], [
    ["1", "Watch 90-second simulation", "Understand the value path quickly."],
    ["2", "Explore demo workspace", "Review synthetic scenarios and demo reports."],
    ["3", "Start Professional Assessment", "Create a private evidence-backed decision pack."],
    ["4", "Request Migration Blueprint", "Plan waves, gates, rollback and remediation."],
  ], [42, 180, 284], { rowH: 42 });
  publicDoc.fillColor(colors.ink).font("Helvetica-Bold").fontSize(14).text("shiftevidence.com/demo/replay", 44, 565);
  publicDoc.text("shiftevidence.com/demo/workspace", 44, 595);
  publicDoc.text("shiftevidence.com/pricing", 44, 625);
  publicDoc.text("shiftevidence.com/contact", 44, 655);

  publicFooter();
  publicDoc.end();

  return new Promise((resolve, reject) => {
    publicStream.on("finish", resolve);
    publicStream.on("error", reject);
  });
}

normalizePdf(outputPath, "0123456789abcdef0123456789abcdef");
fs.copyFileSync(outputPath, versionedOutputPath);
await generatePublicSampleVariant(outputPath);
normalizePdf(outputPath, "fedcba9876543210fedcba9876543210");

console.log(`Generated ${path.relative(repoRoot, outputPath)} (13 pages, public sample)`);
console.log(`Generated ${path.relative(repoRoot, versionedOutputPath)} (${totalPages} pages, premium sample)`);
