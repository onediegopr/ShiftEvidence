import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import PDFDocument from "pdfkit";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const outputDir = path.join(repoRoot, "public", "sample-reports");
const outputPath = path.join(outputDir, "proxmox-migration-readiness-sample-report.pdf");

const totalPages = 15;
const colors = {
  bg: "#06101b",
  panel: "#0d1a2a",
  panel2: "#102238",
  cyan: "#22d3ee",
  emerald: "#34d399",
  amber: "#f59e0b",
  red: "#ef4444",
  white: "#f8fafc",
  muted: "#94a3b8",
  line: "#203246",
};

const dataset = {
  client: "Northbridge Industrial Group",
  scope: [
    ["VMs", "126"],
    ["ESXi hosts", "6"],
    ["Clusters", "3"],
    ["Datastores", "14"],
    ["Port groups", "38"],
    ["VLANs", "22"],
    ["Snapshots", "19"],
  ],
  readiness: "64/100",
  confidence: "58/100",
};

const evidenceRows = [
  ["RVTools Inventory", "Received", "High"],
  ["Technical Context", "Received", "Medium"],
  ["Backup Evidence", "Missing", "Low"],
  ["Application Dependencies", "Missing", "Low"],
  ["Proxmox Target", "Partial", "Medium"],
  ["Network Mapping", "Partial", "Medium"],
  ["Performance History", "Missing", "Low"],
];

const riskRows = [
  ["Backup evidence missing", "Critical"],
  ["Application dependencies missing", "High"],
  ["Old snapshots detected", "High"],
  ["Large disks above 2 TB", "High"],
  ["Multi-NIC workloads", "Medium"],
  ["Outdated VMware Tools", "Medium"],
  ["Datastores above 85%", "High"],
  ["Critical workloads require manual review", "Critical"],
];

const vmRows = [
  ["web-portal-01", "Web App", "Low", "Wave 1"],
  ["fileserver-02", "File Server", "Medium", "Validate storage"],
  ["sql-prod-01", "Database", "High", "Manual review"],
  ["dc-main-01", "Domain Controller", "High", "Special plan"],
  ["erp-prod", "ERP", "Critical", "Hold"],
];

const sizingRows = [
  ["Recommended nodes", "3-4"],
  ["RAM target", "1.8-2.5 TB"],
  ["Usable storage", "70 TB+"],
  ["Backup capacity", "90 TB"],
  ["HA readiness", "Conditional"],
  ["Network readiness", "Requires mapping"],
];

const waveRows = [
  ["Wave 0", "Pilot", "Validate assumptions with non-critical candidates."],
  ["Wave 1", "Low-risk workloads", "Simple workloads after evidence review."],
  ["Wave 2", "Standard production", "Requires dependency and backup validation."],
  ["Wave 3", "Critical systems", "Identity, database and ERP-like systems."],
  ["Hold", "Not ready", "Blocked until missing evidence is resolved."],
  ["Retire", "Decommission candidates", "Review before migration spend is allocated."],
];

const validations = [
  "Backup restore points",
  "Application dependency map",
  "Proxmox target capacity",
  "Network/VLAN mapping",
  "Performance history",
  "Pilot import test",
];

const nextSteps = [
  "Upload RVTools export",
  "Complete technical context",
  "Add backup evidence if available",
  "Validate Proxmox target",
  "Generate full readiness report",
  "Plan pilot wave",
];

const limitations = [
  "It does not migrate VMs.",
  "It does not guarantee zero downtime.",
  "It does not replace a pilot.",
  "It does not prove backup restorability without backup evidence.",
  "It does not infer application dependencies that were not provided.",
  "It does not use customer data.",
];

fs.mkdirSync(outputDir, { recursive: true });

const doc = new PDFDocument({
  size: "A4",
  margin: 42,
  compress: false,
  info: {
    Title: "Proxmox Migration Readiness - Public Synthetic Sample Report",
    Author: "Shift Evidence",
    Subject: "Synthetic VMware to Proxmox readiness sample report",
    Keywords: "synthetic, sample, VMware, Proxmox, readiness",
  },
});

const stream = fs.createWriteStream(outputPath);
doc.pipe(stream);

let pageNumber = 0;

function page(title, eyebrow = "PUBLIC SYNTHETIC SAMPLE REPORT") {
  if (pageNumber > 0) {
    doc.addPage();
  }
  pageNumber += 1;
  paintBackground();
  footer();
  header(eyebrow);
  if (title) {
    doc.fillColor(colors.white).font("Helvetica-Bold").fontSize(24).text(title, 42, 78, { width: 500 });
  }
}

function paintBackground() {
  const { width, height } = doc.page;
  doc.rect(0, 0, width, height).fill(colors.bg);
  doc.circle(width - 60, 120, 190).fillOpacity(0.12).fill(colors.cyan).fillOpacity(1);
  doc.circle(80, height - 80, 150).fillOpacity(0.08).fill(colors.emerald).fillOpacity(1);
}

function header(eyebrow) {
  drawShiftEvidenceMark(42, 29, 18);
  doc.font("Helvetica-Bold").fontSize(8).fillColor(colors.cyan).text(eyebrow, 68, 34, { characterSpacing: 1.2 });
  doc.font("Helvetica").fontSize(8).fillColor(colors.muted).text("Northbridge Industrial Group - synthetic dataset", 330, 34, {
    width: 220,
    align: "right",
  });
  doc.moveTo(42, 56).lineTo(553, 56).strokeColor(colors.line).lineWidth(1).stroke();
}

function footer() {
  const y = doc.page.height - 58;
  doc.font("Helvetica").fontSize(8).fillColor(colors.muted).text("Powered by Shift Evidence. Synthetic sample. No customer data. No production access.", 42, y);
  doc.text(`${pageNumber} / ${totalPages}`, 500, y, { width: 50, align: "right" });
}

function drawShiftEvidenceMark(x, y, size) {
  doc.roundedRect(x, y, size, size, 5).fillAndStroke("#0b2238", colors.cyan);
  doc.circle(x + size * 0.35, y + size * 0.35, size * 0.13).fill(colors.emerald);
  doc.circle(x + size * 0.65, y + size * 0.58, size * 0.13).fill(colors.cyan);
  doc.moveTo(x + size * 0.38, y + size * 0.4).lineTo(x + size * 0.62, y + size * 0.55).strokeColor(colors.white).lineWidth(1).stroke();
}

function drawShiftEvidenceWordmark(x, y) {
  drawShiftEvidenceMark(x, y, 22);
  doc.fillColor(colors.white).font("Helvetica-Bold").fontSize(11).text("Shift Evidence", x + 30, y + 1);
  doc.fillColor(colors.muted).font("Helvetica").fontSize(8).text("Powered readiness reports", x + 30, y + 14);
}

function card(x, y, w, h, title, body, accent = colors.cyan) {
  doc.roundedRect(x, y, w, h, 12).fillAndStroke(colors.panel, colors.line);
  doc.fillColor(accent).font("Helvetica-Bold").fontSize(9).text(title.toUpperCase(), x + 14, y + 14, { width: w - 28 });
  doc.fillColor(colors.white).font("Helvetica").fontSize(11).text(body, x + 14, y + 34, { width: w - 28, lineGap: 3 });
}

function metricCard(x, y, w, label, value, note = "") {
  doc.roundedRect(x, y, w, 86, 12).fillAndStroke(colors.panel, colors.line);
  doc.fillColor(colors.muted).font("Helvetica-Bold").fontSize(8).text(label.toUpperCase(), x + 14, y + 13);
  doc.fillColor(colors.white).font("Helvetica-Bold").fontSize(24).text(value, x + 14, y + 30);
  if (note) {
    doc.fillColor(colors.muted).font("Helvetica").fontSize(9).text(note, x + 14, y + 60, { width: w - 28 });
  }
}

function table(x, y, colWidths, headers, rows) {
  const rowH = 28;
  let cursorY = y;
  doc.roundedRect(x, y, colWidths.reduce((a, b) => a + b, 0), rowH, 8).fill(colors.panel2);
  let cursorX = x;
  headers.forEach((head, index) => {
    doc.fillColor(colors.white).font("Helvetica-Bold").fontSize(8).text(head, cursorX + 8, cursorY + 10, {
      width: colWidths[index] - 16,
    });
    cursorX += colWidths[index];
  });
  cursorY += rowH;
  rows.forEach((row, rowIndex) => {
    cursorX = x;
    doc.rect(x, cursorY, colWidths.reduce((a, b) => a + b, 0), rowH).fill(rowIndex % 2 === 0 ? "#0a1726" : "#0d1d30");
    row.forEach((cell, index) => {
      doc.fillColor(index === 0 ? colors.white : colors.muted).font(index === 0 ? "Helvetica-Bold" : "Helvetica").fontSize(8.5).text(cell, cursorX + 8, cursorY + 9, {
        width: colWidths[index] - 16,
      });
      cursorX += colWidths[index];
    });
    cursorY += rowH;
  });
}

function bulletList(x, y, items, options = {}) {
  const width = options.width ?? 480;
  let cursorY = y;
  items.forEach((item) => {
    doc.circle(x + 4, cursorY + 5, 3).fill(colors.cyan);
    doc.fillColor(colors.white).font("Helvetica").fontSize(11).text(item, x + 18, cursorY, { width, lineGap: 3 });
    cursorY += 30;
  });
}

function sectionText(text, x = 42, y = 130, width = 500) {
  doc.fillColor(colors.muted).font("Helvetica").fontSize(12).text(text, x, y, { width, lineGap: 5 });
}

function callout(text, y, color = colors.cyan) {
  doc.roundedRect(42, y, 511, 78, 12).fillAndStroke("#081827", color);
  doc.fillColor(colors.white).font("Helvetica-Bold").fontSize(11).text(text, 62, y + 20, { width: 470, lineGap: 4 });
}

// 1. Cover
pageNumber = 0;
pageNumber = 1;
paintBackground();
footer();
drawShiftEvidenceWordmark(42, 42);
doc.fillColor(colors.cyan).font("Helvetica-Bold").fontSize(10).text("PUBLIC SYNTHETIC SAMPLE REPORT", 42, 82, { characterSpacing: 1.6 });
doc.fillColor(colors.white).font("Helvetica-Bold").fontSize(42).text("Proxmox Migration Readiness", 42, 120, { width: 450, lineGap: -4 });
doc.fillColor(colors.cyan).font("Helvetica-Bold").fontSize(18).text("VMware -> Proxmox Migration Planning", 42, 232);
sectionText("Northbridge Industrial Group\nBased on synthetic infrastructure evidence. No customer data.", 42, 278, 440);
card(42, 392, 238, 110, "Scope", "126 VMs / 6 ESXi hosts / 3 clusters / 14 datastores", colors.emerald);
card(315, 392, 238, 110, "Use", "Commercial sample for understanding the deliverable before uploading real evidence.", colors.cyan);

// 2. Executive Summary
page("Executive Summary");
sectionText(
  "Northbridge Industrial has a medium migration readiness posture based on the evidence provided. The VMware inventory is usable for an initial assessment, but backup evidence, application dependency mapping and Proxmox target validation are missing or incomplete.",
);
card(42, 250, 240, 118, "Medium readiness", "Low-risk workloads may be candidates for a pilot after validation.", colors.emerald);
card(313, 250, 240, 118, "Limited confidence", "Critical workloads require validation before entering a migration wave.", colors.amber);
callout("Recommendation: do not include SQL, ERP, domain controller or storage-heavy workloads in early waves until restore points and dependencies are validated.", 420, colors.amber);

// 3. Environment Overview
page("Environment Overview");
let x = 42;
let y = 135;
dataset.scope.forEach(([label, value], index) => {
  metricCard(x, y, 150, label, value);
  x += 178;
  if ((index + 1) % 3 === 0) {
    x = 42;
    y += 112;
  }
});
callout("Environment evidence starts with RVTools-style inventory. This sample intentionally keeps backup, dependency and performance evidence incomplete to show how confidence changes.", 470);

// 4. Readiness Score
page("Readiness Score");
metricCard(42, 138, 220, "Migration Readiness Score", dataset.readiness, "Medium readiness");
sectionText(
  "A 64/100 score indicates that some low-risk workloads may be suitable for a pilot after validation. It does not mean the environment is ready for broad migration execution.",
  300,
  142,
  230,
);
card(42, 280, 238, 128, "What looks viable", "Web, utility and low-dependency workloads can be reviewed as early pilot candidates.", colors.emerald);
card(315, 280, 238, 128, "What needs caution", "Identity, database, ERP and large-storage systems should wait for manual validation.", colors.amber);

// 5. Evidence Confidence
page("Evidence Confidence Score");
metricCard(42, 138, 220, "Evidence Confidence Score", dataset.confidence, "Limited evidence");
sectionText(
  "RVTools and technical context are enough for a first assessment, but backups, application dependencies, performance history and final Proxmox target assumptions are incomplete.",
  300,
  142,
  230,
);
callout("A high readiness score with low confidence is not enough. ShiftReadiness separates migration posture from evidence completeness.", 300);

// 6. Evidence Matrix
page("Evidence Matrix");
table(42, 130, [190, 140, 150], ["Evidence", "Status", "Confidence"], evidenceRows);

// 7. Top Risks
page("Top Risks");
x = 42;
y = 130;
riskRows.forEach(([risk, severity], index) => {
  const accent = severity === "Critical" ? colors.red : severity === "High" ? colors.amber : colors.cyan;
  card(x, y, 238, 82, severity, risk, accent);
  x += 273;
  if ((index + 1) % 2 === 0) {
    x = 42;
    y += 104;
  }
});

// 8. VM Classification
page("VM Classification Preview");
table(42, 130, [130, 120, 100, 130], ["VM", "Role", "Complexity", "Action"], vmRows);
callout("Not every VM should move in the same wave. Complexity bands help separate pilot candidates from workloads requiring special planning.", 340);

// 9. Proxmox Sizing
page("Proxmox Sizing Preview");
x = 42;
y = 132;
sizingRows.forEach(([label, value], index) => {
  metricCard(x, y, 150, label, value);
  x += 178;
  if ((index + 1) % 3 === 0) {
    x = 42;
    y += 112;
  }
});
callout("Sizing is based on allocation, not historical performance. Add monitoring data for higher confidence.", 470, colors.amber);

// 10. Migration Waves
page("Migration Wave Preview");
table(42, 130, [95, 145, 240], ["Wave", "Purpose", "Sample guidance"], waveRows);

// 11. AI Advisory
page("AI Advisory Notes");
sectionText(
  "Simulated advisory for sample report. AI Advisory supports the assessment. It does not replace deterministic readiness and confidence scores.",
);
callout(
  "Backup evidence was not provided. Do not include critical workloads in early waves until restore points are validated. The first pilot should focus on low-risk workloads with clear rollback and backup validation.",
  245,
);
card(42, 380, 240, 110, "Confidence impact", "Missing backup and dependency evidence lowers confidence for production waves.", colors.amber);
card(313, 380, 240, 110, "Next questions", "Which applications depend on SQL, ERP and domain controller workloads?", colors.cyan);

// 12. Required Validations
page("Required Validations");
bulletList(58, 140, validations, { width: 430 });
callout("Resolve these items before treating this sample posture as implementation-ready.", 390, colors.amber);

// 13. Next Steps
page("Next Steps");
bulletList(58, 140, nextSteps, { width: 430 });
card(42, 420, 238, 100, "Start", "Upload RVTools and complete technical context.", colors.cyan);
card(315, 420, 238, 100, "Then", "Generate a real readiness report from your own evidence.", colors.emerald);

// 14. Limitations
page("What This Sample Does Not Prove");
bulletList(58, 135, limitations, { width: 450 });
callout("This sample is designed to show the report format and decision value. It is not a migration tool and it does not use customer data.", 430);

// 15. CTA
page("Ready To Assess Your Own Environment?");
sectionText(
  "Use the replay to understand the process, then use this sample to understand the deliverable. When ready, start a real readiness assessment with your own approved evidence.",
);
card(42, 250, 150, 100, "Replay", "Watch the Migration Readiness Replay.", colors.cyan);
card(222, 250, 150, 100, "Assess", "Start a readiness assessment.", colors.emerald);
card(402, 250, 150, 100, "Review", "Book a readiness review.", colors.amber);
doc.fillColor(colors.white).font("Helvetica-Bold").fontSize(15).text("shiftevidence.com/demo", 42, 430);
doc.fillColor(colors.white).font("Helvetica-Bold").fontSize(15).text("shiftevidence.com/sign-up", 42, 460);
doc.fillColor(colors.white).font("Helvetica-Bold").fontSize(15).text("shiftevidence.com/contact", 42, 490);

doc.end();

await new Promise((resolve, reject) => {
  stream.on("finish", resolve);
  stream.on("error", reject);
});

const deterministicPdfId = "/ID [<0123456789abcdef0123456789abcdef> <0123456789abcdef0123456789abcdef>]";
const pdfContent = fs.readFileSync(outputPath, "latin1");
fs.writeFileSync(
  outputPath,
  pdfContent
    .replace(/\/ID \[<[^>]{32}> <[^>]{32}>\]/, deterministicPdfId)
    .replace(/D:\d{14}Z/g, "D:20260528000000Z"),
  "latin1",
);

console.log(`Generated ${path.relative(repoRoot, outputPath)}`);
