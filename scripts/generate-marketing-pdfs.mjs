import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import PDFDocument from "pdfkit";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const outputDir = path.join(repoRoot, "public", "marketing");
const brandConfig = JSON.parse(fs.readFileSync(path.join(repoRoot, "src", "config", "brand-assets.json"), "utf8"));

const logoPath = path.join(repoRoot, "public", brandConfig.public.pdfLogo.replace(/^\//, ""));

const files = {
  brief: path.join(outputDir, "shift-evidence-product-brief-v1.pdf"),
  brochure: path.join(outputDir, "shift-evidence-product-brochure-v1.pdf"),
  blueprint: path.join(outputDir, "migration-blueprint-overview-v1.pdf"),
};

const palette = {
  ink: "#F8FAFC",
  muted: "#AFC3D8",
  quiet: "#7F95AD",
  navy: "#07111F",
  panel: "#0C1828",
  panel2: "#10243A",
  cyan: "#22D3EE",
  proxmox: "#E57000",
  vmware: "#607078",
  violet: "#8B5CF6",
  green: "#34D399",
  amber: "#F59E0B",
  border: "#1E3955",
  white: "#FFFFFF",
};

const prices = [
  ["Starter Readiness", "USD 490", "First evidence checkpoint"],
  ["Professional Assessment", "USD 1,500", "Decision pack and risk matrix"],
  ["Migration Blueprint", "From USD 3,500", "Waves, gates and rollback framing"],
  ["MSP Partner", "From USD 799/month", "Reusable client-ready workflow"],
];

const safeBoundaries = [
  "No production write access",
  "No agent installation requirement",
  "No automated migration execution",
  "No zero downtime promise",
  "No dependency claims without evidence",
];

fs.mkdirSync(outputDir, { recursive: true });

function createDoc(filePath, metadata) {
  const doc = new PDFDocument({
    autoFirstPage: false,
    size: "LETTER",
    margin: 42,
    compress: false,
    info: {
      Title: metadata.title,
      Author: "Shift Evidence",
      Subject: metadata.subject,
      Keywords: "VMware, Proxmox, migration readiness, assessment, Shift Evidence",
      CreationDate: new Date("2026-06-06T00:00:00Z"),
      ModDate: new Date("2026-06-06T00:00:00Z"),
    },
  });
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);
  return { doc, done: new Promise((resolve, reject) => stream.on("finish", resolve).on("error", reject)) };
}

function addPage(doc, title, sectionLabel = "") {
  doc.addPage({ size: "LETTER", margins: { top: 42, right: 42, bottom: 18, left: 42 } });
  const { width, height } = doc.page;
  doc.rect(0, 0, width, height).fill(palette.navy);
  doc.save();
  doc.opacity(0.18);
  doc.circle(width - 60, 70, 170).fill(palette.cyan);
  doc.circle(58, height - 70, 180).fill(palette.violet);
  doc.opacity(1);
  doc.restore();
  doc.strokeColor("#10233A").lineWidth(0.6);
  for (let x = 0; x < width; x += 48) doc.moveTo(x, 0).lineTo(x, height).stroke();
  for (let y = 0; y < height; y += 48) doc.moveTo(0, y).lineTo(width, y).stroke();

  brandLockup(doc, 42, 30);
  doc.font("Helvetica-Bold").fontSize(8).fillColor(palette.quiet).text(sectionLabel.toUpperCase(), width - 214, 35, {
    width: 170,
    align: "right",
  });
  doc.moveTo(42, 72).lineTo(width - 42, 72).strokeColor(palette.border).lineWidth(0.8).stroke();
  if (title) {
    doc.font("Helvetica-Bold").fontSize(18).fillColor(palette.ink).text(title, 42, 88, { width: width - 84 });
  }
}

function brandLockup(doc, x, y) {
  if (fs.existsSync(logoPath)) {
    doc.image(logoPath, x, y - 4, { width: 30, height: 30 });
  } else {
    doc.roundedRect(x, y, 28, 28, 8).fill(palette.cyan);
  }
  doc.font("Helvetica-Bold").fontSize(13).fillColor(palette.ink).text("Shift Evidence", x + 38, y + 2);
  doc.font("Helvetica").fontSize(7.5).fillColor(palette.muted).text("VMware to Proxmox readiness", x + 38, y + 18);
}

function footer(doc, label) {
  const { width, height } = doc.page;
  doc.moveTo(42, height - 48).lineTo(width - 42, height - 48).strokeColor(palette.border).lineWidth(0.8).stroke();
  doc.font("Helvetica").fontSize(8).fillColor(palette.quiet).text(label, 42, height - 35, { width: 300 });
  doc.text(`Page ${doc.bufferedPageRange().count}`, width - 120, height - 35, { width: 78, align: "right" });
}

function pill(doc, text, x, y, color = palette.cyan) {
  const width = doc.widthOfString(text, { size: 8 }) + 22;
  doc.roundedRect(x, y, width, 22, 11).fillAndStroke(`${color}22`, `${color}66`);
  doc.font("Helvetica-Bold").fontSize(8).fillColor(color).text(text.toUpperCase(), x + 11, y + 7);
  return width;
}

function hero(doc, kicker, heading, body, options = {}) {
  const top = options.top ?? 112;
  pill(doc, kicker, 42, top, options.color ?? palette.cyan);
  const headingY = top + 36;
  const headingWidth = options.width ?? 510;
  const headingSize = options.size ?? 38;
  doc.font("Helvetica-Bold").fontSize(headingSize).fillColor(palette.ink).text(heading, 42, headingY, {
    width: headingWidth,
    lineGap: -1,
  });
  const headingHeight = doc.heightOfString(heading, { width: headingWidth, lineGap: -1 });
  const bodyY = Math.max(top + (options.bodyOffset ?? 148), headingY + headingHeight + 24);
  doc.font("Helvetica").fontSize(12.5).fillColor(palette.muted).text(body, 42, bodyY, {
    width: options.bodyWidth ?? 470,
    lineGap: 4,
  });
}

function sectionTitle(doc, x, y, kicker, title, body, color = palette.cyan) {
  pill(doc, kicker, x, y, color);
  const titleY = y + 35;
  const titleWidth = 500;
  doc.font("Helvetica-Bold").fontSize(24).fillColor(palette.ink).text(title, x, titleY, { width: titleWidth });
  const titleHeight = doc.heightOfString(title, { width: titleWidth });
  doc.font("Helvetica").fontSize(11).fillColor(palette.muted).text(body, x, titleY + titleHeight + 12, {
    width: 490,
    lineGap: 3,
  });
}

function card(doc, x, y, w, h, title, body, color = palette.cyan, eyebrow = "") {
  doc.roundedRect(x, y, w, h, 18).fillAndStroke(palette.panel, `${color}66`);
  doc.circle(x + 24, y + 29, 9).fill(`${color}`);
  doc.font("Helvetica-Bold").fontSize(7.5).fillColor(color).text(eyebrow.toUpperCase(), x + 42, y + 16, { width: w - 58 });
  doc.font("Helvetica-Bold").fontSize(13).fillColor(palette.ink).text(title, x + 42, y + 30, { width: w - 58 });
  doc.font("Helvetica").fontSize(9.5).fillColor(palette.muted).text(body, x + 20, y + 58, { width: w - 40, lineGap: 3 });
}

function bulletList(doc, items, x, y, width, color = palette.cyan, gap = 30) {
  let cursor = y;
  items.forEach((item) => {
    doc.circle(x + 4, cursor + 6, 3).fill(color);
    doc.font("Helvetica").fontSize(10).fillColor(palette.muted).text(item, x + 16, cursor, { width, lineGap: 2 });
    cursor += gap;
  });
  return cursor;
}

function miniFlow(doc, x, y, steps) {
  const w = 152;
  steps.forEach((step, index) => {
    const sx = x + index * (w + 18);
    card(doc, sx, y, w, 106, step.title, step.body, step.color, `0${index + 1}`);
    if (index < steps.length - 1) {
      doc.moveTo(sx + w + 4, y + 54).lineTo(sx + w + 15, y + 54).strokeColor(step.color).lineWidth(2).stroke();
    }
  });
}

function priceCards(doc, x, y) {
  prices.forEach((plan, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const px = x + col * 250;
    const py = y + row * 102;
    const color = [palette.cyan, palette.green, palette.proxmox, palette.violet][index];
    doc.roundedRect(px, py, 230, 82, 16).fillAndStroke(palette.panel, `${color}66`);
    doc.font("Helvetica-Bold").fontSize(8).fillColor(color).text(plan[0].toUpperCase(), px + 18, py + 16, { width: 190 });
    doc.font("Helvetica-Bold").fontSize(18).fillColor(palette.ink).text(plan[1], px + 18, py + 32, { width: 190 });
    doc.font("Helvetica").fontSize(8.8).fillColor(palette.muted).text(plan[2], px + 18, py + 58, { width: 190 });
  });
}

function radar(doc, cx, cy, radius) {
  const axes = [
    ["Evidence", 0.76, palette.cyan],
    ["Storage", 0.67, palette.proxmox],
    ["Risk", 0.88, palette.amber],
    ["Sizing", 0.82, palette.green],
    ["Waves", 0.73, palette.violet],
  ];
  for (let ring = 1; ring <= 4; ring++) {
    const r = (radius * ring) / 4;
    doc.circle(cx, cy, r).strokeColor("#203A57").lineWidth(0.8).stroke();
  }
  const points = axes.map(([, value], index) => {
    const angle = -Math.PI / 2 + (index * Math.PI * 2) / axes.length;
    return [cx + Math.cos(angle) * radius * value, cy + Math.sin(angle) * radius * value, angle];
  });
  doc.moveTo(points[0][0], points[0][1]);
  points.slice(1).forEach(([x, y]) => doc.lineTo(x, y));
  doc.closePath().fillAndStroke("#22D3EE33", palette.cyan);
  axes.forEach(([label, value, color], index) => {
    const angle = -Math.PI / 2 + (index * Math.PI * 2) / axes.length;
    const lx = cx + Math.cos(angle) * (radius + 34);
    const ly = cy + Math.sin(angle) * (radius + 34);
    doc.moveTo(cx, cy).lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius).strokeColor("#1D3550").stroke();
    doc.circle(points[index][0], points[index][1], 4).fill(color);
    doc.font("Helvetica-Bold").fontSize(8).fillColor(color).text(`${label} ${Math.round(value * 100)}`, lx - 34, ly - 5, {
      width: 68,
      align: "center",
    });
  });
}

function boundaryPanel(doc, x, y, w) {
  doc.roundedRect(x, y, w, 164, 18).fillAndStroke("#190F14", "#F59E0B88");
  doc.font("Helvetica-Bold").fontSize(12).fillColor(palette.amber).text("Integrity boundaries", x + 18, y + 17);
  bulletList(doc, safeBoundaries, x + 18, y + 43, w - 44, palette.amber, 24);
}

async function save(doc, done, label) {
  footer(doc, label);
  doc.end();
  await done;
}

async function generateBrief() {
  const { doc, done } = createDoc(files.brief, {
    title: "Shift Evidence Product Brief v1",
    subject: "One-page product brief for VMware to Proxmox readiness assessment",
  });
  addPage(doc, "", "Product brief v1");
  hero(
    doc,
    "Product brief",
    "Evidence-backed VMware to Proxmox decisions.",
    "Shift Evidence turns RVTools exports and guided senior context into a risk-qualified readiness pack for teams planning a VMware exit.",
    { size: 31, bodyOffset: 128, bodyWidth: 455 },
  );
  card(doc, 42, 330, 165, 126, "What it solves", "Blind migration pressure, hidden storage constraints and unsupported VM edge cases before they become project blockers.", palette.amber, "Problem");
  card(doc, 222, 330, 165, 126, "How it works", "Raw evidence is normalized, scored against target models and explained through a bounded advisor layer.", palette.cyan, "Engine");
  card(doc, 402, 330, 165, 126, "What buyers get", "Executive summary, technical findings, risk matrix, storage suitability, missing evidence and staged planning guidance.", palette.green, "Output");
  priceCards(doc, 42, 482);
  doc.font("Helvetica-Bold").fontSize(11).fillColor(palette.ink).text("Use this brief when:", 42, 678);
  bulletList(doc, ["A stakeholder needs the short version.", "An MSP needs a pre-sales leave-behind."], 42, 702, 510, palette.cyan, 24);
  await save(doc, done, "Shift Evidence product brief v1");
}

async function generateBrochure() {
  const { doc, done } = createDoc(files.brochure, {
    title: "Shift Evidence Product Brochure v1",
    subject: "Full product brochure for VMware to Proxmox migration readiness",
  });

  addPage(doc, "", "Product brochure v1");
  hero(
    doc,
    "VMware to Proxmox",
    "From exported evidence to migration decisions.",
    "A productized readiness system for teams that need risk, cost exposure, storage destination suitability and migration planning signals before committing to execution.",
    { size: 40, bodyOffset: 156 },
  );
  miniFlow(doc, 42, 390, [
    { title: "Evidence intake", body: "Start with RVTools and guided senior context.", color: palette.cyan },
    { title: "Risk model", body: "Map compute, storage, network and operating system signals.", color: palette.proxmox },
    { title: "Decision pack", body: "Generate boardroom-ready outputs and next-step gates.", color: palette.green },
  ]);

  addPage(doc, "The transition challenge", "01 / Problem");
  sectionTitle(doc, 42, 118, "Why it exists", "VMware exits fail when teams migrate inventory instead of risk.", "Broadcom licensing pressure can create urgency, but a rushed hypervisor transition can amplify hidden storage, network, backup and application dependency problems.", palette.amber);
  card(doc, 42, 260, 245, 124, "Commercial trigger", "Licensing pressure changes timing, not engineering reality. A financial event still needs technical qualification.", palette.amber, "Broadcom pressure");
  card(doc, 325, 260, 245, 124, "Storage blind spots", "RVTools can show allocations, but target fit needs datastore, performance and destination storage context.", palette.proxmox, "Storage");
  card(doc, 42, 420, 245, 124, "Transformation blockers", "Unsupported VM flags, nested network patterns and backup gaps can block early migration waves.", palette.violet, "Dependencies");
  card(doc, 325, 420, 245, 124, "Advisor guardrails", "If evidence is missing, confidence drops. The system surfaces the gap instead of inventing certainty.", palette.cyan, "Integrity");
  boundaryPanel(doc, 42, 584, 528);

  addPage(doc, "What Shift Evidence does", "02 / Product");
  sectionTitle(doc, 42, 118, "Decision engine", "A readiness layer between raw exports and migration action.", "Shift Evidence does not move VMs. It translates exported metadata and guided context into a practical decision pack for executives, engineers and MSP workshops.", palette.cyan);
  miniFlow(doc, 42, 272, [
    { title: "Normalize", body: "Clean VMware export evidence into structured assessment inputs.", color: palette.cyan },
    { title: "Evaluate", body: "Compare inputs against target compatibility and risk models.", color: palette.proxmox },
    { title: "Explain", body: "Produce bounded advisor language and missing evidence guidance.", color: palette.violet },
  ]);
  radar(doc, 306, 560, 110);

  addPage(doc, "How the assessment lifecycle works", "03 / Workflow");
  sectionTitle(doc, 42, 112, "Lifecycle", "A structured path from data upload to audit-ready decisions.", "The workflow keeps consulting judgment, infrastructure evidence and AI assistance separated enough to remain reviewable.", palette.green);
  miniFlow(doc, 42, 252, [
    { title: "Upload", body: "RVTools export starts the evidence baseline.", color: palette.cyan },
    { title: "Context", body: "Guided questions capture target, constraints and operational assumptions.", color: palette.violet },
    { title: "Model", body: "Compatibility and risk layers score what is known and unknown.", color: palette.proxmox },
  ]);
  miniFlow(doc, 42, 410, [
    { title: "Review", body: "Advisor explains findings without claiming unsupported certainty.", color: palette.amber },
    { title: "Package", body: "Reports, checklist and risk matrix become the decision pack.", color: palette.green },
    { title: "Plan", body: "Blueprint adds waves, gates and rollback framing when scoped.", color: palette.cyan },
  ]);

  addPage(doc, "What the decision pack includes", "04 / Deliverables");
  sectionTitle(doc, 42, 108, "Outputs", "Executive clarity and technical substance in one package.", "Deliverables are designed to support budget, risk, architecture and migration sequencing conversations.", palette.proxmox);
  const deliverables = [
    ["Readiness Score", "Standardized compatibility ranking and confidence posture.", palette.cyan],
    ["VM Risk Matrix", "VM-by-VM classification for early candidates and blockers.", palette.violet],
    ["Storage Suitability", "ZFS, NFS, SAN or Ceph target-fit cautions.", palette.proxmox],
    ["Missing Evidence", "Validation tasks where confidence needs more proof.", palette.amber],
    ["Migration Waves", "Staged guidance when Blueprint scope is selected.", palette.green],
    ["Boardroom PDF", "Executive and technical narrative for sign-off.", palette.cyan],
  ];
  deliverables.forEach(([title, body, color], index) => {
    const x = 42 + (index % 2) * 272;
    const y = 245 + Math.floor(index / 2) * 116;
    card(doc, x, y, 250, 92, title, body, color, "Deliverable");
  });

  addPage(doc, "Evidence model and advisor boundaries", "05 / Evidence");
  sectionTitle(doc, 42, 112, "Evidence first", "AI is used after structured infrastructure evidence is evaluated.", "The advisor layer explains scored findings, but it stays anchored to approved assumptions and validated inputs. Missing inputs remain visible.", palette.violet);
  card(doc, 42, 258, 245, 116, "Raw evidence", "RVTools baseline, VM flags, snapshots, datastore signals and export metadata.", palette.cyan, "Input");
  card(doc, 325, 258, 245, 116, "Guided context", "Target hypervisor plans, storage preference, constraints, ownership and project timing.", palette.green, "Senior context");
  card(doc, 42, 410, 245, 116, "Methodology model", "Compute, licensing, storage, continuity and migration sequencing rules.", palette.proxmox, "TAM");
  card(doc, 325, 410, 245, 116, "Bounded advisor", "Explains evidence and uncertainty. It does not replace engineering sign-off.", palette.violet, "AI");
  boundaryPanel(doc, 42, 572, 528);

  addPage(doc, "Scoring and decision model", "06 / Scores");
  sectionTitle(doc, 42, 112, "Decision model", "Scores are confidence tools, not magic absolutes.", "Readiness depends on compatibility, missing evidence, target constraints and operational risk. Confidence falls when critical evidence is absent.", palette.cyan);
  radar(doc, 180, 410, 124);
  card(doc, 340, 262, 220, 98, "Readiness", "How well the known estate maps to the target plan.", palette.green, "Score");
  card(doc, 340, 384, 220, 98, "Confidence", "How much the result depends on verified versus assumed evidence.", palette.cyan, "Evidence");
  card(doc, 340, 506, 220, 98, "Blockers", "Items that should be validated or remediated before early waves.", palette.amber, "Risk");

  addPage(doc, "Packages and pricing truth", "07 / Packages");
  sectionTitle(doc, 42, 112, "Commercial model", "Start small, escalate only when the evidence justifies depth.", "Pricing is kept explicit so stakeholders understand whether they are buying a checkpoint, a decision pack, a scoped blueprint or a partner workflow.", palette.green);
  priceCards(doc, 42, 256);
  doc.font("Helvetica-Bold").fontSize(13).fillColor(palette.ink).text("Payment and fulfillment notes", 42, 504);
  bulletList(doc, [
    "Manual invoice and controlled onboarding are the default business paths.",
    "Card checkout is controlled and can be enabled only after approval.",
    "Blueprint engagements are scoped before payment.",
  ], 42, 532, 500, palette.green);

  addPage(doc, "Security, trust and fit", "08 / Trust");
  sectionTitle(doc, 42, 112, "Trust model", "Designed for offline, pre-flight assessment work.", "Shift Evidence is built for evidence review before production migration execution begins. It does not request production credentials for the marketing PDF workflow.", palette.cyan);
  card(doc, 42, 260, 245, 116, "Security posture", "Agentless intake and read-only evidence handling reduce production exposure.", palette.cyan, "Security");
  card(doc, 325, 260, 245, 116, "Best-fit teams", "Infrastructure leads, MSPs, consultants and executives planning a VMware exit.", palette.green, "Audience");
  card(doc, 42, 420, 245, 116, "Not a migration tool", "It does not orchestrate VM moves, conversions, cutovers or production writes.", palette.amber, "Boundary");
  card(doc, 325, 420, 245, 116, "Not a black box", "Findings remain connected to evidence, assumptions and missing validation.", palette.violet, "Governance");

  addPage(doc, "Next steps", "09 / CTA");
  sectionTitle(doc, 42, 112, "Use this brochure", "Share the product overview before committing to a migration path.", "The best next step is to inspect the public sample report, explore the synthetic demo workspace, or start a readiness assessment with exported evidence.", palette.proxmox);
  card(doc, 42, 260, 245, 112, "View sample report", "shiftevidence.com/sample-report", palette.cyan, "Proof");
  card(doc, 325, 260, 245, 112, "Explore demo workspace", "shiftevidence.com/demo/workspace", palette.violet, "Demo");
  card(doc, 42, 420, 245, 112, "Compare pricing", "shiftevidence.com/pricing", palette.green, "Plans");
  card(doc, 325, 420, 245, 112, "Start assessment", "shiftevidence.com/sign-up", palette.proxmox, "Action");

  await save(doc, done, "Shift Evidence product brochure v1");
}

async function generateBlueprintOverview() {
  const { doc, done } = createDoc(files.blueprint, {
    title: "Migration Blueprint Overview v1",
    subject: "Overview of the scoped Migration Blueprint planning layer",
  });

  addPage(doc, "", "Migration Blueprint overview v1");
  hero(
    doc,
    "Migration Blueprint",
    "When readiness becomes a migration planning problem.",
    "Blueprint extends the Professional Assessment into scoped waves, validation gates, rollback expectations, remediation priorities and technical review language.",
    { size: 36, bodyOffset: 150, color: palette.proxmox },
  );
  miniFlow(doc, 42, 386, [
    { title: "Risk qualified", body: "Start from scored findings and missing evidence.", color: palette.cyan },
    { title: "Wave scoped", body: "Group workloads by risk, dependencies and ownership.", color: palette.proxmox },
    { title: "Review ready", body: "Frame gates, rollback assumptions and next decisions.", color: palette.green },
  ]);

  addPage(doc, "Why Blueprint exists", "01 / Why");
  sectionTitle(doc, 42, 118, "Planning layer", "A report can reveal risk. A blueprint helps organize the response.", "When the VMware exit is already real, stakeholders need a practical migration plan structure rather than only readiness findings.", palette.proxmox);
  card(doc, 42, 280, 245, 124, "Before Blueprint", "The team understands current blockers, unknowns and likely target-fit constraints.", palette.cyan, "Assessment");
  card(doc, 325, 280, 245, 124, "With Blueprint", "The team receives wave framing, validation gates and rollback language for planning discussions.", palette.proxmox, "Plan");
  boundaryPanel(doc, 42, 462, 528);

  addPage(doc, "What Blueprint adds", "02 / Scope");
  sectionTitle(doc, 42, 112, "Scope", "From evidence-backed findings to migration planning structure.", "Blueprint is scoped work. It is not a fixed automation package, and it does not replace implementation engineering.", palette.green);
  const additions = [
    ["Wave plan", "Candidate waves grouped by risk, dependencies, ownership and validation needs.", palette.green],
    ["Pilot framing", "Early candidates and conditions that make pilots safer to attempt.", palette.cyan],
    ["Rollback assumptions", "Rollback expectations and evidence gaps that need attention before execution.", palette.amber],
    ["Technical review", "Senior review language for architecture and stakeholder alignment.", palette.violet],
  ];
  additions.forEach(([title, body, color], index) => card(doc, 42 + (index % 2) * 272, 260 + Math.floor(index / 2) * 132, 250, 104, title, body, color, "Blueprint"));

  addPage(doc, "Blueprint visual spine", "03 / Model");
  sectionTitle(doc, 42, 112, "Model", "A structured spine for conversations that otherwise become chaotic.", "The overview below shows how the planning layer connects scored evidence, target readiness and implementation sequencing.", palette.cyan);
  radar(doc, 306, 420, 145);
  doc.font("Helvetica").fontSize(10.5).fillColor(palette.muted).text("The radar is illustrative: real values depend on uploaded evidence, target assumptions and missing validation.", 84, 610, { width: 440, align: "center" });

  addPage(doc, "When to request Blueprint", "04 / Trigger");
  sectionTitle(doc, 42, 112, "Decision trigger", "Request Blueprint when the migration decision is active, not hypothetical.", "Use it when leadership, engineering and delivery teams need a shared plan structure before execution work begins.", palette.amber);
  bulletList(doc, [
    "There is executive pressure to exit VMware, but the technical path is not yet validated.",
    "The team needs migration waves rather than only a readiness score.",
    "Storage target choices, rollback assumptions or backup evidence need explicit planning language.",
    "An MSP or consulting team needs a client-ready migration workshop artifact.",
  ], 62, 266, 480, palette.amber);
  card(doc, 92, 442, 420, 112, "Pricing", "Migration Blueprint starts at From USD 3,500 and is scoped before payment so the plan matches the real engagement depth.", palette.proxmox, "Commercial");

  addPage(doc, "What Blueprint does not promise", "05 / Boundaries");
  sectionTitle(doc, 42, 112, "Integrity", "Clear boundaries protect the buyer and the delivery team.", "Blueprint is a planning artifact, not an implementation guarantee. It supports better decisions before migration execution.", palette.violet);
  boundaryPanel(doc, 42, 250, 528);
  card(doc, 42, 430, 245, 110, "No production execution", "Blueprint does not move workloads, modify clusters or operate cutovers.", palette.amber, "Boundary");
  card(doc, 325, 430, 245, 110, "No invented certainty", "Unknowns stay visible until evidence is provided or validated.", palette.cyan, "Evidence");

  addPage(doc, "Next step", "06 / CTA");
  sectionTitle(doc, 42, 112, "Move forward", "Use Blueprint after the evidence says planning depth is justified.", "Start with a Professional Assessment or discuss scope directly when the business case and migration pressure are already clear.", palette.proxmox);
  priceCards(doc, 42, 270);
  card(doc, 92, 520, 420, 100, "Request scope discussion", "shiftevidence.com/pricing or shiftevidence.com/technical-review", palette.proxmox, "Action");

  await save(doc, done, "Shift Evidence Migration Blueprint overview v1");
}

await generateBrief();
await generateBrochure();
await generateBlueprintOverview();

console.log("Generated marketing PDFs:");
Object.values(files).forEach((filePath) => console.log(`- ${path.relative(repoRoot, filePath)}`));
