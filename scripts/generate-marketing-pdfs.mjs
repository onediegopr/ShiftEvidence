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
  briefV2: path.join(outputDir, "shift-evidence-product-brief.pdf"),
  brochureV2: path.join(outputDir, "shift-evidence-product-brochure.pdf"),
  blueprintV2: path.join(outputDir, "migration-blueprint-overview.pdf"),
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
  card(doc, 92, 442, 420, 112, "Pricing", "Blueprint engagements start from USD 3,500. Scope is confirmed before payment so the plan matches the real engagement depth.", palette.proxmox, "Commercial");

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

const paletteV2 = {
  paper: "#FBFAF6",
  white: "#FFFFFF",
  ink: "#17202A",
  text: "#344054",
  muted: "#667085",
  quiet: "#98A2B3",
  line: "#D8DEE8",
  soft: "#F1F5F9",
  cyan: "#0891B2",
  cyanSoft: "#E6F7FB",
  proxmox: "#D86613",
  proxmoxSoft: "#FFF3E8",
  violet: "#6D5BD0",
  violetSoft: "#F1EEFF",
  green: "#187A5B",
  greenSoft: "#EAF7F0",
  amber: "#B7791F",
  amberSoft: "#FFF6E6",
};

const v2Packages = [
  ["Starter", "USD 490", "First evidence checkpoint", paletteV2.cyan, paletteV2.cyanSoft],
  ["Professional", "USD 1,500", "Decision pack and VM risk matrix", paletteV2.green, paletteV2.greenSoft],
  ["Blueprint", "From USD 3,500", "Waves, gates and rollback framing", paletteV2.proxmox, paletteV2.proxmoxSoft],
  ["MSP Partner", "From USD 799/month", "Repeatable client-ready workflow", paletteV2.violet, paletteV2.violetSoft],
];

const v2Boundaries = [
  "No production writes or migration execution",
  "No agents or mandatory credentials for assessment intake",
  "No zero downtime promise",
  "Missing evidence lowers confidence instead of being guessed",
];

function createV2Doc(filePath, metadata) {
  const doc = new PDFDocument({
    autoFirstPage: false,
    size: "LETTER",
    margins: { top: 54, right: 54, bottom: 18, left: 54 },
    compress: false,
    info: {
      Title: metadata.title,
      Author: "Shift Evidence",
      Subject: metadata.subject,
      Keywords: "VMware, Proxmox, migration readiness, brochure, Shift Evidence",
      CreationDate: new Date("2026-06-06T00:00:00Z"),
      ModDate: new Date("2026-06-06T00:00:00Z"),
    },
  });
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);
  return {
    doc,
    pageNumber: 0,
    done: new Promise((resolve, reject) => stream.on("finish", resolve).on("error", reject)),
  };
}

function addV2Page(ctx, sectionLabel = "") {
  const { doc } = ctx;
  ctx.pageNumber += 1;
  doc.addPage({ size: "LETTER", margins: { top: 54, right: 54, bottom: 18, left: 54 } });
  const { width, height } = doc.page;
  doc.rect(0, 0, width, height).fill(paletteV2.paper);
  doc.rect(0, 0, width, 12).fill(paletteV2.cyan);
  doc.rect(0, 12, width * 0.34, 3).fill(paletteV2.proxmox);
  doc.rect(0, 15, width * 0.18, 2).fill(paletteV2.violet);
  doc.circle(width - 68, 78, 118).fill("#EEF7FA");
  doc.circle(width - 32, 118, 74).fill("#FFF4EA");
  v2Brand(doc, 54, 36);
  doc.font("Helvetica-Bold").fontSize(7.5).fillColor(paletteV2.quiet).text(sectionLabel.toUpperCase(), width - 226, 42, {
    width: 172,
    align: "right",
    characterSpacing: 0.7,
  });
  doc.moveTo(54, height - 45).lineTo(width - 54, height - 45).strokeColor(paletteV2.line).lineWidth(0.6).stroke();
  doc.font("Helvetica").fontSize(7.5).fillColor(paletteV2.quiet).text("Shift Evidence", 54, height - 34);
  doc.text(`Page ${ctx.pageNumber}`, width - 104, height - 34, { width: 50, align: "right" });
}

function v2Brand(doc, x, y) {
  if (fs.existsSync(logoPath)) {
    doc.image(logoPath, x, y - 2, { width: 24, height: 24 });
  }
  doc.font("Helvetica-Bold").fontSize(11).fillColor(paletteV2.ink).text("Shift Evidence", x + 32, y);
  doc.font("Helvetica").fontSize(7.2).fillColor(paletteV2.muted).text("VMware to Proxmox readiness", x + 32, y + 14);
}

function v2Rule(doc, x, y, w, color = paletteV2.cyan) {
  doc.moveTo(x, y).lineTo(x + w, y).strokeColor(color).lineWidth(1.2).stroke();
}

function v2Kicker(doc, text, x, y, color = paletteV2.cyan, fill = paletteV2.cyanSoft) {
  const w = doc.widthOfString(text.toUpperCase(), { size: 7.5 }) + 20;
  doc.roundedRect(x, y, w, 20, 10).fillAndStroke(fill, `${color}88`);
  doc.font("Helvetica-Bold").fontSize(7.5).fillColor(color).text(text.toUpperCase(), x + 10, y + 6, {
    characterSpacing: 0.4,
  });
  return w;
}

function v2SoftTint(color) {
  if (color === paletteV2.cyan) return paletteV2.cyanSoft;
  if (color === paletteV2.proxmox) return paletteV2.proxmoxSoft;
  if (color === paletteV2.violet) return paletteV2.violetSoft;
  if (color === paletteV2.green) return paletteV2.greenSoft;
  if (color === paletteV2.amber) return paletteV2.amberSoft;
  return paletteV2.soft;
}

function v2Heading(doc, text, x, y, width, size = 34) {
  doc.font("Helvetica-Bold").fontSize(size).fillColor(paletteV2.ink).text(text, x, y, {
    width,
    lineGap: 2,
  });
  return doc.heightOfString(text, { width, lineGap: 2 });
}

function v2Body(doc, text, x, y, width, options = {}) {
  doc.font(options.bold ? "Helvetica-Bold" : "Helvetica").fontSize(options.size ?? 10.5).fillColor(options.color ?? paletteV2.text).text(text, x, y, {
    width,
    lineGap: options.lineGap ?? 4,
    align: options.align ?? "left",
  });
  return doc.heightOfString(text, { width, lineGap: options.lineGap ?? 4 });
}

function v2SectionIntro(doc, kicker, title, body, color = paletteV2.cyan) {
  v2Kicker(doc, kicker, 54, 104, color, v2SoftTint(color));
  const titleHeight = v2Heading(doc, title, 54, 140, 470, 29);
  v2Body(doc, body, 54, 150 + titleHeight, 430, { size: 11, color: paletteV2.muted });
}

function v2Card(doc, x, y, w, h, title, body, options = {}) {
  const color = options.color ?? paletteV2.cyan;
  const fill = options.fill ?? paletteV2.white;
  doc.roundedRect(x, y, w, h, 12).fillAndStroke(fill, options.border ?? paletteV2.line);
  doc.rect(x, y, 4, h).fill(color);
  if (options.label) {
    doc.font("Helvetica-Bold").fontSize(7).fillColor(color).text(options.label.toUpperCase(), x + 18, y + 14, {
      width: w - 36,
      characterSpacing: 0.5,
    });
  }
  doc.font("Helvetica-Bold").fontSize(options.titleSize ?? 12.5).fillColor(paletteV2.ink).text(title, x + 18, y + (options.label ? 29 : 17), {
    width: w - 36,
    lineGap: 2,
  });
  doc.font("Helvetica").fontSize(options.bodySize ?? 9).fillColor(paletteV2.text).text(body, x + 18, y + (options.label ? 54 : 42), {
    width: w - 36,
    lineGap: 3,
  });
}

function v2Bullets(doc, items, x, y, width, color = paletteV2.cyan, gap = 28) {
  let cursor = y;
  items.forEach((item) => {
    doc.circle(x + 3, cursor + 6, 2.6).fill(color);
    v2Body(doc, item, x + 14, cursor, width - 14, { size: 9.5, color: paletteV2.text, lineGap: 2 });
    cursor += gap;
  });
  return cursor;
}

function v2PackageTable(doc, x, y, w, compact = false) {
  const rowH = compact ? 50 : 60;
  const colW = w / 2 - 8;
  v2Packages.forEach(([name, price, note, color, fill], index) => {
    const px = x + (index % 2) * (colW + 16);
    const py = y + Math.floor(index / 2) * (rowH + 12);
    doc.roundedRect(px, py, colW, rowH, 12).fillAndStroke(fill, paletteV2.line);
    doc.rect(px, py, 4, rowH).fill(color);
    doc.font("Helvetica-Bold").fontSize(7).fillColor(color).text(name.toUpperCase(), px + 14, py + 11, {
      width: colW - 28,
      characterSpacing: 0.5,
    });
    doc.font("Helvetica-Bold").fontSize(compact ? 15 : 17).fillColor(paletteV2.ink).text(price, px + 14, py + 25, {
      width: colW - 28,
    });
    doc.font("Helvetica").fontSize(8).fillColor(paletteV2.muted).text(note, px + 14, py + (compact ? 40 : 45), {
      width: colW - 28,
    });
  });
}

function v2Flow(doc, x, y, steps) {
  const w = 118;
  steps.forEach((step, index) => {
    const sx = x + index * 130;
    doc.roundedRect(sx, y, w, 86, 12).fillAndStroke(step.fill, `${step.color}55`);
    doc.font("Helvetica-Bold").fontSize(8).fillColor(step.color).text(`0${index + 1}`, sx + 14, y + 14);
    doc.font("Helvetica-Bold").fontSize(11.2).fillColor(paletteV2.ink).text(step.title, sx + 14, y + 28, { width: w - 28 });
    doc.font("Helvetica").fontSize(8).fillColor(paletteV2.text).text(step.body, sx + 14, y + 50, { width: w - 28, lineGap: 2 });
    if (index < steps.length - 1) {
      doc.moveTo(sx + w + 5, y + 43).lineTo(sx + w + 21, y + 43).strokeColor(paletteV2.line).lineWidth(1.2).stroke();
    }
  });
}

function v2ScoreDiagram(doc, x, y) {
  const items = [
    ["Readiness", "Can this estate move safely?", 76, paletteV2.cyan],
    ["Confidence", "How complete is the evidence?", 58, paletteV2.proxmox],
    ["Blockers", "What must not enter Wave 1?", 31, paletteV2.violet],
  ];
  items.forEach(([label, note, value, color], index) => {
    const py = y + index * 70;
    doc.font("Helvetica-Bold").fontSize(10).fillColor(paletteV2.ink).text(label, x, py);
    doc.font("Helvetica").fontSize(8.5).fillColor(paletteV2.muted).text(note, x, py + 15, { width: 160 });
    doc.roundedRect(x + 190, py + 3, 180, 12, 6).fill("#E8EDF3");
    doc.roundedRect(x + 190, py + 3, 180 * (value / 100), 12, 6).fill(color);
    doc.font("Helvetica-Bold").fontSize(10).fillColor(color).text(`${value}/100`, x + 380, py + 1, { width: 60 });
  });
}

function v2BoundaryStrip(doc, x, y, w, options = {}) {
  const height = options.height ?? 104;
  const gap = options.gap ?? 18;
  doc.roundedRect(x, y, w, height, 14).fillAndStroke(paletteV2.amberSoft, "#E4C27B");
  doc.font("Helvetica-Bold").fontSize(11).fillColor(paletteV2.amber).text("Operational boundaries", x + 18, y + 16);
  v2Bullets(doc, v2Boundaries, x + 18, y + 40, w - 36, paletteV2.amber, gap);
}

async function saveV2(ctx) {
  ctx.doc.end();
  await ctx.done;
}

async function generateBriefV2() {
  const ctx = createV2Doc(files.briefV2, {
    title: "Shift Evidence Product Brief",
    subject: "Print-first one-page product brief for VMware to Proxmox readiness",
  });
  const { doc } = ctx;
  addV2Page(ctx, "Product brief");
  v2Kicker(doc, "Print-first brief", 54, 102, paletteV2.proxmox, paletteV2.proxmoxSoft);
  const titleHeight = v2Heading(doc, "Before migrating VMware to Proxmox, know what can break.", 54, 137, 460, 31);
  v2Body(doc, "A printable one-page overview for VMware-to-Proxmox readiness decisions.", 54, 148 + titleHeight, 448, {
    size: 11.2,
    color: paletteV2.text,
  });
  v2Rule(doc, 54, 260, 500, paletteV2.line);
  v2Card(doc, 54, 284, 156, 118, "What it is", "A pre-migration assessment system for VMware exits, built around evidence, risk qualification and decision-ready output.", {
    color: paletteV2.cyan,
    fill: paletteV2.white,
    label: "Positioning",
  });
  v2Card(doc, 228, 284, 156, 118, "Who it helps", "Infrastructure leaders, MSPs and consultants who need clarity before proposals, pilots or migration waves.", {
    color: paletteV2.violet,
    fill: paletteV2.white,
    label: "Audience",
  });
  v2Card(doc, 402, 284, 156, 118, "What you get", "Readiness Score, Evidence Confidence, VM risk matrix, storage suitability, missing evidence and wave guidance.", {
    color: paletteV2.green,
    fill: paletteV2.white,
    label: "Outputs",
  });
  doc.font("Helvetica-Bold").fontSize(12).fillColor(paletteV2.ink).text("Package ladder", 54, 434);
  v2PackageTable(doc, 54, 456, 500, true);
  v2BoundaryStrip(doc, 54, 596, 500, { height: 96, gap: 16 });
  doc.font("Helvetica-Bold").fontSize(10.5).fillColor(paletteV2.proxmox).text("Next step", 54, 724);
  doc.font("Helvetica").fontSize(9.2).fillColor(paletteV2.text).text("Review the sample report or start with exported RVTools evidence. shiftevidence.com/sample-report", 120, 724, {
    width: 410,
  });
  await saveV2(ctx);
}

async function generateBrochureV2() {
  const ctx = createV2Doc(files.brochureV2, {
    title: "Shift Evidence Product Brochure",
    subject: "Light, print-first product brochure for VMware to Proxmox readiness",
  });
  const { doc } = ctx;

  addV2Page(ctx, "Product brochure");
  v2Kicker(doc, "VMware to Proxmox", 54, 108, paletteV2.proxmox, paletteV2.proxmoxSoft);
  const coverHeight = v2Heading(doc, "Before migration, separate inventory from risk.", 54, 146, 455, 35);
  v2Body(doc, "Shift Evidence is a technical-commercial readiness assessment for teams planning a VMware exit. It converts exported evidence and guided context into a clear decision pack before production is touched.", 54, 160 + coverHeight, 424, {
    size: 11.3,
    color: paletteV2.text,
  });
  v2Flow(doc, 54, 398, [
    { title: "Upload evidence", body: "Start with RVTools and guided context.", color: paletteV2.cyan, fill: paletteV2.cyanSoft },
    { title: "Model risk", body: "Evaluate compute, storage, network and gaps.", color: paletteV2.proxmox, fill: paletteV2.proxmoxSoft },
    { title: "Decide next", body: "Review findings, confidence and waves.", color: paletteV2.green, fill: paletteV2.greenSoft },
  ]);
  v2BoundaryStrip(doc, 54, 542, 500);

  addV2Page(ctx, "01 / Problem");
  v2SectionIntro(doc, "Migration problem", "VMware exits fail when urgency outruns evidence.", "Licensing pressure can force timing, but the migration still succeeds or fails on architecture, storage, dependencies, backup proof and operational readiness.", paletteV2.proxmox);
  v2Card(doc, 54, 282, 230, 118, "Commercial pressure", "Broadcom cost pressure creates the business trigger. It does not remove the need for technical qualification.", { color: paletteV2.proxmox, fill: paletteV2.proxmoxSoft, label: "Trigger" });
  v2Card(doc, 322, 282, 230, 118, "Hidden technical risk", "RVTools helps, but datastore boundaries, storage performance, backup evidence and network edge cases still need interpretation.", { color: paletteV2.cyan, fill: paletteV2.cyanSoft, label: "Reality" });
  doc.font("Helvetica-Bold").fontSize(20).fillColor(paletteV2.ink).text("\"Do not migrate the spreadsheet. Migrate the risk model.\"", 86, 458, { width: 420, align: "center" });
  v2Body(doc, "The assessment exists to slow down the dangerous parts: unsupported assumptions, vague confidence and early-wave blockers.", 110, 526, 370, { align: "center", color: paletteV2.muted });

  addV2Page(ctx, "02 / Product");
  v2SectionIntro(doc, "What it does", "A decision layer between raw exports and migration execution.", "Shift Evidence structures VMware evidence into readiness findings, confidence language, missing evidence tasks and planning guidance. It does not move workloads.", paletteV2.cyan);
  v2Flow(doc, 76, 300, [
    { title: "Normalize", body: "Clean exported infrastructure evidence.", color: paletteV2.cyan, fill: paletteV2.cyanSoft },
    { title: "Evaluate", body: "Compare against target compatibility models.", color: paletteV2.violet, fill: paletteV2.violetSoft },
    { title: "Explain", body: "Produce bounded recommendations.", color: paletteV2.green, fill: paletteV2.greenSoft },
  ]);
  v2Card(doc, 54, 468, 500, 112, "The practical output", "A package that executives can read, technical teams can validate, and MSPs can use to structure a workshop or proposal.", {
    color: paletteV2.proxmox,
    fill: paletteV2.white,
    label: "Decision pack",
  });

  addV2Page(ctx, "03 / Workflow");
  v2SectionIntro(doc, "How it works", "A compact lifecycle from evidence to decision.", "The workflow keeps raw evidence, senior context and advisor language separated enough to remain auditable.", paletteV2.green);
  const workflow = [
    ["1", "RVTools baseline", "Inventory, VM flags, snapshots and datastore signals."],
    ["2", "Guided context", "Target plan, constraints, owners and assumptions."],
    ["3", "Risk model", "Compatibility, confidence, storage and blocker checks."],
    ["4", "Decision pack", "Report, gaps, waves and next-step framing."],
  ];
  workflow.forEach(([num, title, body], index) => {
    const y = 268 + index * 86;
    doc.circle(76, y + 24, 18).fill(index % 2 ? paletteV2.proxmoxSoft : paletteV2.cyanSoft).strokeColor(index % 2 ? paletteV2.proxmox : paletteV2.cyan).stroke();
    doc.font("Helvetica-Bold").fontSize(12).fillColor(index % 2 ? paletteV2.proxmox : paletteV2.cyan).text(num, 71, y + 18);
    doc.font("Helvetica-Bold").fontSize(14).fillColor(paletteV2.ink).text(title, 116, y + 8);
    v2Body(doc, body, 116, y + 31, 390, { size: 9.6, color: paletteV2.text });
    if (index < workflow.length - 1) doc.moveTo(76, y + 46).lineTo(76, y + 82).strokeColor(paletteV2.line).stroke();
  });

  addV2Page(ctx, "04 / Evidence");
  v2SectionIntro(doc, "Evidence model", "Confidence depends on what is uploaded and verified.", "RVTools starts the assessment. Additional backup, storage, target and dependency evidence improves confidence and narrows the unknowns.", paletteV2.violet);
  const evidence = [
    ["RVTools", "Inventory, VM flags, snapshots and datastore signals.", paletteV2.cyan, paletteV2.cyanSoft],
    ["Backup evidence", "Restore coverage and continuity confidence when supplied.", paletteV2.green, paletteV2.greenSoft],
    ["Target plan", "Proxmox node, storage and HA assumptions.", paletteV2.proxmox, paletteV2.proxmoxSoft],
    ["Dependencies", "Application relationships that influence wave sequencing.", paletteV2.violet, paletteV2.violetSoft],
  ];
  evidence.forEach(([title, body, color, fill], index) => {
    v2Card(doc, 54 + (index % 2) * 258, 282 + Math.floor(index / 2) * 134, 232, 104, title, body, {
      color,
      fill,
      label: "Evidence",
    });
  });
  v2Body(doc, "Missing evidence is not hidden. It is surfaced as a validation task and reflected in Evidence Confidence.", 84, 584, 440, {
    size: 11,
    color: paletteV2.ink,
    align: "center",
  });

  addV2Page(ctx, "05 / Deliverables");
  v2SectionIntro(doc, "What you receive", "Outputs for executive, technical and planning conversations.", "The deliverable is not a raw parser dump. It is a structured decision pack with risk language, confidence and next steps.", paletteV2.proxmox);
  const deliverablesV2 = [
    ["Readiness Score", "Target compatibility and risk posture."],
    ["Evidence Confidence", "How complete the supporting proof is."],
    ["VM Risk Matrix", "VM-by-VM migration complexity bands."],
    ["Storage Suitability", "ZFS, NFS, SAN or Ceph cautions."],
    ["Missing Evidence", "Specific tasks to improve confidence."],
    ["Migration Waves", "Staged guidance by risk and ownership."],
  ];
  deliverablesV2.forEach(([title, body], index) => {
    const x = 54 + (index % 2) * 258;
    const y = 260 + Math.floor(index / 2) * 106;
    v2Card(doc, x, y, 232, 82, title, body, {
      color: [paletteV2.cyan, paletteV2.proxmox, paletteV2.violet, paletteV2.green, paletteV2.amber, paletteV2.cyan][index],
      fill: paletteV2.white,
      label: "Output",
      bodySize: 8.8,
    });
  });

  addV2Page(ctx, "06 / Scores");
  v2SectionIntro(doc, "Decision model", "Readiness and confidence are intentionally separate.", "A workload can look technically compatible while confidence remains low because backup, dependency or performance evidence is missing.", paletteV2.cyan);
  v2ScoreDiagram(doc, 70, 292);
  v2Card(doc, 70, 528, 420, 106, "How to read the scores", "Readiness answers what appears technically suitable. Evidence Confidence answers how much proof supports that answer. The decision pack keeps both visible.", {
    color: paletteV2.violet,
    fill: paletteV2.violetSoft,
    label: "Interpretation",
  });

  addV2Page(ctx, "07 / Packages");
  v2SectionIntro(doc, "Package comparison", "Buy the amount of decision depth the migration actually needs.", "Start with a checkpoint, move into a decision pack, or scope Blueprint when the project needs waves, gates and rollback framing.", paletteV2.green);
  v2PackageTable(doc, 54, 282, 500);
  v2Card(doc, 54, 548, 500, 92, "Payment posture", "Manual invoice and controlled onboarding remain the default business paths. Blueprint engagements are scoped before payment.", {
    color: paletteV2.green,
    fill: paletteV2.white,
    label: "Commercial note",
  });

  addV2Page(ctx, "08 / Why teams use it");
  v2SectionIntro(doc, "Use cases", "A calmer way to qualify high-pressure VMware exits.", "The brochure should support conversations before a proposal, migration pilot or executive decision meeting.", paletteV2.violet);
  v2Card(doc, 54, 278, 230, 120, "Infrastructure teams", "Clarify blockers, missing evidence and target suitability before execution planning.", { color: paletteV2.cyan, fill: paletteV2.cyanSoft, label: "Buyer" });
  v2Card(doc, 322, 278, 230, 120, "MSPs and consultants", "Bring a repeatable evidence workflow into pre-sales and client workshops.", { color: paletteV2.violet, fill: paletteV2.violetSoft, label: "Partner" });
  v2Card(doc, 54, 432, 498, 110, "Executives", "Understand cost exposure, readiness posture and why a pilot or Blueprint may be required before migration execution.", { color: paletteV2.proxmox, fill: paletteV2.proxmoxSoft, label: "Decision makers" });

  addV2Page(ctx, "09 / Security");
  v2SectionIntro(doc, "Trust model", "Pre-flight assessment without production writes.", "The intake is designed around exported evidence and guided context. The system does not require agents, mandatory credentials or production access for the assessment workflow.", paletteV2.cyan);
  v2BoundaryStrip(doc, 54, 270, 500);
  v2Card(doc, 54, 420, 230, 112, "Agentless posture", "Starts with exported metadata and optional evidence. It is not a production control plane.", { color: paletteV2.cyan, fill: paletteV2.white, label: "Security" });
  v2Card(doc, 322, 420, 230, 112, "Evidence-bound language", "If evidence is missing, the output lowers confidence rather than inventing certainty.", { color: paletteV2.green, fill: paletteV2.white, label: "Governance" });

  addV2Page(ctx, "10 / Next steps");
  v2SectionIntro(doc, "Next steps", "Use the public sample, demo workspace or assessment intake.", "The best next step depends on the buyer stage: inspect proof, explore the workflow, or upload evidence for a real readiness assessment.", paletteV2.proxmox);
  v2Card(doc, 54, 280, 232, 104, "View sample report", "shiftevidence.com/sample-report", { color: paletteV2.cyan, fill: paletteV2.cyanSoft, label: "Proof" });
  v2Card(doc, 320, 280, 232, 104, "Explore demo", "shiftevidence.com/demo/workspace", { color: paletteV2.violet, fill: paletteV2.violetSoft, label: "Demo" });
  v2Card(doc, 54, 424, 232, 104, "Compare pricing", "shiftevidence.com/pricing", { color: paletteV2.green, fill: paletteV2.greenSoft, label: "Plans" });
  v2Card(doc, 320, 424, 232, 104, "Start assessment", "shiftevidence.com/sign-up", { color: paletteV2.proxmox, fill: paletteV2.proxmoxSoft, label: "Action" });

  await saveV2(ctx);
}

async function generateBlueprintOverviewV2() {
  const ctx = createV2Doc(files.blueprintV2, {
    title: "Migration Blueprint Overview",
    subject: "Print-first overview of the Migration Blueprint planning layer",
  });
  const { doc } = ctx;

  addV2Page(ctx, "Blueprint overview");
  v2Kicker(doc, "Migration Blueprint", 54, 108, paletteV2.proxmox, paletteV2.proxmoxSoft);
  const coverHeight = v2Heading(doc, "Turn readiness findings into a migration planning spine.", 54, 145, 452, 33);
  v2Body(doc, "Blueprint extends the Professional Assessment into waves, validation gates, rollback expectations, remediation priorities and technical review language.", 54, 160 + coverHeight, 424, {
    size: 11.2,
  });
  v2PackageTable(doc, 54, 428, 500, true);
  v2Card(doc, 54, 606, 500, 92, "Blueprint engagements start from USD 3,500.", "Scope is confirmed before payment so the planning artifact matches migration complexity, evidence quality and workshop depth.", {
    color: paletteV2.proxmox,
    fill: paletteV2.proxmoxSoft,
    label: "Commercial framing",
  });

  addV2Page(ctx, "01 / Why");
  v2SectionIntro(doc, "Why it exists", "A readiness report reveals risk. Blueprint organizes the response.", "When the VMware exit is active, teams need more than findings: they need wave logic, gate language and rollback assumptions before execution planning.", paletteV2.proxmox);
  v2Card(doc, 54, 290, 230, 118, "Professional", "Clarifies readiness, confidence, blockers, VM risk and missing evidence.", { color: paletteV2.cyan, fill: paletteV2.cyanSoft, label: "Decision pack" });
  v2Card(doc, 322, 290, 230, 118, "Blueprint", "Adds migration planning structure: waves, validation gates, rollback framing and action planning.", { color: paletteV2.proxmox, fill: paletteV2.proxmoxSoft, label: "Planning layer" });
  v2Body(doc, "Blueprint is useful when the decision to move is real, but the migration path needs disciplined sequencing.", 100, 486, 400, { size: 13, align: "center", color: paletteV2.ink });

  addV2Page(ctx, "02 / Adds beyond Professional");
  v2SectionIntro(doc, "Scope", "What Blueprint adds beyond the decision pack.", "Blueprint turns assessment evidence into migration planning conversations that executives, technical leads and delivery teams can review together.", paletteV2.green);
  const components = [
    ["Validation gates", "What must be proven before a wave proceeds.", paletteV2.cyan, paletteV2.cyanSoft],
    ["Migration waves", "Workloads grouped by risk, ownership and dependency depth.", paletteV2.green, paletteV2.greenSoft],
    ["Rollback framing", "Decision gates, owners and expected reversal conditions.", paletteV2.proxmox, paletteV2.proxmoxSoft],
    ["Action plan", "Remediation priorities and workshop-ready next steps.", paletteV2.violet, paletteV2.violetSoft],
  ];
  components.forEach(([title, body, color, fill], index) => {
    v2Card(doc, 54 + (index % 2) * 258, 276 + Math.floor(index / 2) * 132, 232, 104, title, body, { color, fill, label: "Planning" });
  });

  addV2Page(ctx, "03 / Planning components");
  v2SectionIntro(doc, "Planning spine", "A consulting-grade artifact for the pre-execution phase.", "The goal is not to automate migration. The goal is to make the next engineering decisions explicit and evidence-bound.", paletteV2.violet);
  v2Flow(doc, 56, 288, [
    { title: "Pilot", body: "Pick candidates and proof gates.", color: paletteV2.cyan, fill: paletteV2.cyanSoft },
    { title: "Waves", body: "Sequence by risk and ownership.", color: paletteV2.green, fill: paletteV2.greenSoft },
    { title: "Runbook", body: "Frame cutover and rollback logic.", color: paletteV2.proxmox, fill: paletteV2.proxmoxSoft },
  ]);
  v2Card(doc, 82, 474, 420, 104, "The value", "Blueprint reduces ambiguity before implementation teams commit to timelines, hardware assumptions, rollback posture or migration wave promises.", {
    color: paletteV2.violet,
    fill: paletteV2.violetSoft,
    label: "Why it matters",
  });

  addV2Page(ctx, "04 / What buyers receive");
  v2SectionIntro(doc, "Deliverables", "A planning package, not a migration script.", "Blueprint outputs are designed for review, sign-off and workshop alignment before execution tooling enters the picture.", paletteV2.cyan);
  v2Bullets(doc, [
    "Migration wave outline with candidate grouping.",
    "Pilot candidate and gate assumptions.",
    "Rollback expectation language.",
    "Remediation roadmap and missing evidence actions.",
    "Technical review summary for leadership and delivery.",
    "Executive migration plan framing.",
  ], 74, 286, 444, paletteV2.cyan, 42);

  addV2Page(ctx, "05 / When to request");
  v2SectionIntro(doc, "Decision trigger", "Request Blueprint when migration planning is already on the table.", "It is most useful when the business case is active and the team needs a shared planning artifact before committing to implementation scope.", paletteV2.proxmox);
  v2Card(doc, 54, 292, 500, 98, "Good fit", "Leadership is pressing for a VMware exit, but the engineering team needs wave planning, validation gates and rollback clarity.", {
    color: paletteV2.green,
    fill: paletteV2.greenSoft,
    label: "Use Blueprint when",
  });
  v2Card(doc, 54, 428, 500, 98, "Not the right fit", "The team only needs a first checkpoint or has not gathered enough evidence for planning depth.", {
    color: paletteV2.amber,
    fill: paletteV2.amberSoft,
    label: "Use Professional first when",
  });

  addV2Page(ctx, "06 / Boundaries");
  v2SectionIntro(doc, "What it does not promise", "Clear boundaries make the plan more credible.", "Blueprint supports readiness and planning. It does not execute workloads, promise zero downtime or replace implementation engineering.", paletteV2.amber);
  v2BoundaryStrip(doc, 54, 284, 500);
  v2Card(doc, 54, 440, 230, 102, "No automated migration", "Execution belongs to specialized tooling and experienced engineers.", { color: paletteV2.amber, fill: paletteV2.white, label: "Boundary" });
  v2Card(doc, 322, 440, 230, 102, "Pilot still required", "Confidence depends on evidence quality, validation and rollback drills.", { color: paletteV2.cyan, fill: paletteV2.white, label: "Evidence" });

  addV2Page(ctx, "07 / CTA");
  v2SectionIntro(doc, "Next step", "Use Blueprint when the assessment says planning depth is justified.", "Start with a Professional Assessment or request a scope discussion when migration pressure and technical complexity are already clear.", paletteV2.proxmox);
  v2Card(doc, 54, 304, 232, 104, "Review sample report", "shiftevidence.com/sample-report", { color: paletteV2.cyan, fill: paletteV2.cyanSoft, label: "Proof" });
  v2Card(doc, 320, 304, 232, 104, "Discuss Blueprint", "shiftevidence.com/technical-review", { color: paletteV2.proxmox, fill: paletteV2.proxmoxSoft, label: "Scope" });
  v2Card(doc, 54, 462, 498, 104, "Commercial note", "Blueprint engagements start from USD 3,500. Scope is confirmed before payment. The plan does not claim zero downtime or automated execution.", {
    color: paletteV2.green,
    fill: paletteV2.white,
    label: "Pricing truth",
  });

  await saveV2(ctx);
}

await generateBriefV2();
await generateBrochureV2();
await generateBlueprintOverviewV2();

console.log("Generated marketing PDFs:");
Object.values(files).forEach((filePath) => console.log(`- ${path.relative(repoRoot, filePath)}`));
