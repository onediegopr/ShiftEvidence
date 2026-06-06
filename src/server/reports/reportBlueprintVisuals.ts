import { PRINT_REPORT_THEME } from "./reportTheme";
import type {
  BlueprintClientActionPlanItem,
  BlueprintDecisionSummary,
  BlueprintRollbackDecisionNode,
  BlueprintRunbookTimelineStep,
  BlueprintSectionPack,
  BlueprintTargetBlueprint,
  BlueprintValidationMatrixRow,
} from "./reportBlueprintModels";

const MARGIN = 48;
const CONTENT_WIDTH = 499;

const THEME = {
  ink: PRINT_REPORT_THEME.ink,
  muted: PRINT_REPORT_THEME.muted,
  line: PRINT_REPORT_THEME.line,
  panel: PRINT_REPORT_THEME.panel,
  blue: PRINT_REPORT_THEME.blue,
  green: PRINT_REPORT_THEME.green,
  amber: PRINT_REPORT_THEME.amber,
  red: PRINT_REPORT_THEME.red,
};

type Tone = BlueprintValidationMatrixRow["tone"];

function toneColor(tone: Tone) {
  if (tone === "good") return THEME.green;
  if (tone === "critical") return THEME.red;
  if (tone === "warning") return THEME.amber;
  return THEME.blue;
}

function ensureSpace(doc: PDFKit.PDFDocument, needed = 120) {
  if (doc.y + needed > doc.page.height - MARGIN) {
    doc.addPage();
  }
}

function sectionHeader(doc: PDFKit.PDFDocument, title: string, subtitle: string) {
  ensureSpace(doc, 68);
  doc.moveDown(0.5);
  doc.fillColor(THEME.ink).font("Helvetica-Bold").fontSize(15).text(title, MARGIN, doc.y, {
    width: CONTENT_WIDTH,
  });
  doc.moveDown(0.2);
  doc.fillColor(THEME.muted).font("Helvetica").fontSize(9.5).text(subtitle, MARGIN, doc.y, {
    width: CONTENT_WIDTH,
    lineGap: 2,
  });
  doc.moveDown(0.45);
}

function drawPill(doc: PDFKit.PDFDocument, x: number, y: number, text: string, tone: Tone | "info") {
  const color = tone === "good" ? THEME.green : tone === "critical" ? THEME.red : tone === "warning" ? THEME.amber : THEME.blue;
  const background =
    tone === "good" ? "#e8f8ef" : tone === "critical" ? "#fff1f2" : tone === "warning" ? "#fff7e5" : "#eaf2ff";
  const width = Math.min(160, 12 + text.length * 5.8);
  doc.roundedRect(x, y, width, 18, 9).fillAndStroke(background, color);
  doc.fillColor(color).font("Helvetica-Bold").fontSize(7.5).text(text, x, y + 4.25, {
    width,
    align: "center",
  });
  return width;
}

function drawCard(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  w: number,
  h: number,
  title: string,
  bodyLines: string[],
  tone: Tone | "info" = "info",
  pill?: string,
) {
  doc.roundedRect(x, y, w, h, 10).fillAndStroke("#ffffff", THEME.line);
  doc.rect(x, y, 6, h).fill(toneColor(tone as Tone));
  if (pill) {
    drawPill(doc, x + 14, y + 12, pill, tone);
  }
  doc.fillColor(THEME.ink).font("Helvetica-Bold").fontSize(10.5).text(title, x + 14, y + (pill ? 36 : 14), {
    width: w - 28,
  });
  doc.fillColor(THEME.muted).font("Helvetica").fontSize(8.2).text(bodyLines.join(" "), x + 14, y + (pill ? 54 : 34), {
    width: w - 28,
    lineGap: 1.6,
  });
}

export function renderBlueprintDecisionSummary(doc: PDFKit.PDFDocument, summary: BlueprintDecisionSummary) {
  const recommendationX = MARGIN + 110;
  const recommendationWidth = CONTENT_WIDTH - 124;
  doc.font("Helvetica-Bold").fontSize(8.5);
  const recommendationTextHeight = doc.heightOfString(summary.recommendation, {
    width: recommendationWidth - 20,
    align: "left",
  });
  const recommendationHeight = Math.max(50, recommendationTextHeight + 18);
  doc.font("Helvetica-Bold").fontSize(9.3);
  const blockerBodyHeight = doc.heightOfString(summary.blocker, {
    width: CONTENT_WIDTH - 48,
    lineGap: 1.2,
  });
  const blockerHeight = Math.max(48, blockerBodyHeight + 28);
  doc.font("Helvetica").fontSize(8.9);
  const nextActionBodyHeight = doc.heightOfString(summary.nextAction, {
    width: CONTENT_WIDTH - 48,
    lineGap: 1.2,
  });
  const nextActionHeight = Math.max(44, nextActionBodyHeight + 26);
  const panelHeight = recommendationHeight + blockerHeight + nextActionHeight + 106;
  ensureSpace(doc, panelHeight + 120);
  sectionHeader(doc, "Blueprint Decision Summary", summary.subtitle);
  const startY = doc.y;
  const cardX = MARGIN + 14;
  const cardW = CONTENT_WIDTH - 28;
  const cardTextW = cardW - 20;
  const recommendationY = startY + 64;
  const blockerY = recommendationY + recommendationHeight + 14;
  const nextActionY = blockerY + blockerHeight + 10;
  doc.roundedRect(MARGIN, startY, CONTENT_WIDTH, panelHeight, 12).fillAndStroke(THEME.panel, THEME.line);
  doc.fillColor(THEME.ink).font("Helvetica-Bold").fontSize(12.5).text(summary.headline, MARGIN + 14, startY + 14, {
    width: CONTENT_WIDTH - 28,
  });
  doc.fillColor(THEME.muted).font("Helvetica").fontSize(9.5).text(summary.decisionNote, MARGIN + 14, startY + 36, {
    width: CONTENT_WIDTH - 28,
    lineGap: 2,
  });
  drawPill(doc, MARGIN + 14, startY + 70, "Decision", "info");
  doc.roundedRect(recommendationX, recommendationY, recommendationWidth, recommendationHeight, 10).fillAndStroke("#eefdf5", THEME.green);
  doc.fillColor(THEME.green).font("Helvetica-Bold").fontSize(8.5).text(summary.recommendation, recommendationX + 10, recommendationY + 8, {
    width: recommendationWidth - 20,
    lineGap: 1.2,
  });
  doc.roundedRect(cardX, blockerY, cardW, blockerHeight, 10).fillAndStroke("#fff6f3", THEME.red);
  doc.fillColor(THEME.red).font("Helvetica-Bold").fontSize(8).text("MAIN BLOCKER", cardX + 10, blockerY + 8, {
    width: cardTextW,
    characterSpacing: 0.6,
  });
  doc.fillColor(THEME.ink).font("Helvetica-Bold").fontSize(9.3).text(summary.blocker, cardX + 10, blockerY + 22, {
    width: cardTextW,
    lineGap: 1.2,
  });
  doc.roundedRect(cardX, nextActionY, cardW, nextActionHeight, 10).fillAndStroke("#f8fbff", THEME.blue);
  doc.fillColor(THEME.blue).font("Helvetica-Bold").fontSize(8).text("BEST NEXT ACTION", cardX + 10, nextActionY + 8, {
    width: cardTextW,
    characterSpacing: 0.6,
  });
  doc.fillColor(THEME.ink).font("Helvetica").fontSize(8.9).text(summary.nextAction, cardX + 10, nextActionY + 22, {
    width: cardTextW,
    lineGap: 1.2,
  });
  doc.y = startY + panelHeight + 12;
}

export function renderBlueprintTargetBlueprint(doc: PDFKit.PDFDocument, target: BlueprintTargetBlueprint) {
  sectionHeader(doc, "Proxmox Target Blueprint", "Recommended target posture, not final execution approval.");
  ensureSpace(doc, 300);
  const startY = doc.y;
  const gap = 12;
  const cardW = (CONTENT_WIDTH - gap) / 2;
  const cardH = 84;
  const items: Array<[string, string, Tone, string]> = [
    ["Recommended nodes", target.recommendedNodes, "good", "Cluster"],
    ["Storage landing", target.storageLanding, "info", "Storage"],
    ["HA assumption", target.haAssumption, "warning", "Availability"],
    ["PBS / backup stance", target.pbsBackupStance, "warning", "Backup"],
    ["Network readiness", target.networkReadinessStatus, "info", "Network"],
    ["Caveat", target.caveat, "critical", "Constraint"],
  ];

  items.forEach(([title, value, tone, pill], index) => {
    const row = Math.floor(index / 2);
    const col = index % 2;
    const x = MARGIN + col * (cardW + gap);
    const y = startY + row * (cardH + gap);
    drawCard(doc, x, y, cardW, cardH, title, [value], tone, pill);
  });
  doc.y = startY + 3 * cardH + 2 * gap + 10;
}

export function renderBlueprintValidationMatrix(doc: PDFKit.PDFDocument, rows: BlueprintValidationMatrixRow[]) {
  sectionHeader(doc, "Validation Matrix", "Evidence areas, required checks, current status and gate impact.");
  ensureSpace(doc, 56 + rows.length * 48);
  const startY = doc.y;
  const headers = ["Evidence area", "Required validation", "Status", "Owner / action", "Gate impact"];
  const widths = [100, 122, 78, 109, 90];
  const rowH = 48;

  let x = MARGIN;
  doc.roundedRect(MARGIN, startY, CONTENT_WIDTH, 28, 8).fillAndStroke(THEME.panel, THEME.line);
  headers.forEach((header, index) => {
    const width = widths[index];
    doc.fillColor(THEME.ink).font("Helvetica-Bold").fontSize(8.4).text(header, x + 6, startY + 9, {
      width: width - 12,
      align: index === 2 ? "center" : "left",
    });
    if (index < headers.length - 1) {
      doc.strokeColor(THEME.line).moveTo(x + width, startY).lineTo(x + width, startY + 28).stroke();
    }
    x += width;
  });

  let rowY = startY + 28;
  rows.forEach((row, index) => {
    const rowTone = toneColor(row.tone);
    doc.roundedRect(MARGIN, rowY + 2, CONTENT_WIDTH, rowH - 2, 8).fillAndStroke(index % 2 === 0 ? "#ffffff" : "#fbfdff", THEME.line);
    doc.rect(MARGIN, rowY + 2, 4, rowH - 2).fill(rowTone);

    const cells = [row.evidenceArea, row.requiredValidation, row.currentStatus, row.ownerAction, row.gateImpact];
    let cellX = MARGIN;
    cells.forEach((cell, cellIndex) => {
      const width = widths[cellIndex];
      doc.fillColor(cellIndex === 2 ? rowTone : THEME.ink).font(cellIndex === 2 ? "Helvetica-Bold" : "Helvetica").fontSize(8.2).text(cell, cellX + 6, rowY + 9, {
        width: width - 12,
        height: rowH - 14,
        ellipsis: true,
      });
      if (cellIndex < cells.length - 1) {
        doc.strokeColor(THEME.line).moveTo(cellX + width, rowY + 2).lineTo(cellX + width, rowY + rowH).stroke();
      }
      cellX += width;
    });
    rowY += rowH;
  });

  doc.y = rowY + 8;
}

export function renderBlueprintRunbookTimeline(doc: PDFKit.PDFDocument, steps: BlueprintRunbookTimelineStep[]) {
  sectionHeader(doc, "Migration Runbook Timeline", "Pre-flight through hypercare with rollback checkpoints visible.");
  steps.forEach((step, index) => {
    ensureSpace(doc, 92);
    const y = doc.y;
    doc.roundedRect(MARGIN, y, CONTENT_WIDTH, 76, 10).fillAndStroke("#ffffff", THEME.line);
    doc.rect(MARGIN, y, 6, 76).fill(toneColor(step.tone));
    drawPill(doc, MARGIN + 14, y + 12, step.phase, step.tone);
    doc.fillColor(THEME.ink).font("Helvetica-Bold").fontSize(10.5).text(step.focus, MARGIN + 14, y + 35, {
      width: CONTENT_WIDTH - 28,
    });
    doc.fillColor(THEME.muted).font("Helvetica").fontSize(8.2).text(`Owner action: ${step.ownerAction}`, MARGIN + 14, y + 51, {
      width: CONTENT_WIDTH - 28,
    });
    doc.fillColor(THEME.muted).font("Helvetica").fontSize(8).text(`Gate: ${step.gate}`, MARGIN + 14, y + 64, {
      width: CONTENT_WIDTH - 28,
    });
    doc.y = y + 86;
    if (index < steps.length - 1) {
      doc.fillColor(THEME.muted).font("Helvetica").fontSize(12).text("v", MARGIN + CONTENT_WIDTH / 2 - 3, doc.y - 3, {
        width: 12,
        align: "center",
      });
      doc.y += 8;
    }
  });
}

export function renderBlueprintRollbackDecisionTree(doc: PDFKit.PDFDocument, nodes: BlueprintRollbackDecisionNode[]) {
  sectionHeader(doc, "Rollback Decision Tree", "Make rollback triggers, owners and next actions explicit.");
  nodes.forEach((node, index) => {
    ensureSpace(doc, 116);
    const y = doc.y;
    doc.roundedRect(MARGIN, y, CONTENT_WIDTH, 100, 10).fillAndStroke("#ffffff", THEME.line);
    doc.rect(MARGIN, y, 6, 100).fill(toneColor(node.tone));
    drawPill(doc, MARGIN + 14, y + 12, "Trigger", node.tone);
    drawPill(doc, MARGIN + CONTENT_WIDTH - 170, y + 12, node.mode, node.tone);
    doc.fillColor(THEME.ink).font("Helvetica-Bold").fontSize(10.5).text(node.trigger, MARGIN + 14, y + 36, {
      width: CONTENT_WIDTH - 28,
    });
    doc.fillColor(THEME.muted).font("Helvetica").fontSize(8.4).text(`Evidence threshold: ${node.evidenceThreshold}`, MARGIN + 14, y + 57, {
      width: CONTENT_WIDTH - 28,
    });
    doc.fillColor(THEME.muted).font("Helvetica").fontSize(8.4).text(`Decision owner: ${node.decisionOwner}`, MARGIN + 14, y + 71, {
      width: CONTENT_WIDTH - 28,
    });
    doc.fillColor(THEME.muted).font("Helvetica").fontSize(8.2).text(`Next action: ${node.nextAction}`, MARGIN + 14, y + 85, {
      width: CONTENT_WIDTH - 28,
    });
    doc.y = y + 114;
    if (index < nodes.length - 1) {
      doc.fillColor(THEME.muted).font("Helvetica").fontSize(12).text("v", MARGIN + CONTENT_WIDTH / 2 - 3, doc.y - 2, {
        width: 12,
        align: "center",
      });
      doc.y += 6;
    }
  });
}

export function renderBlueprintClientActionPlan(doc: PDFKit.PDFDocument, items: BlueprintClientActionPlanItem[]) {
  sectionHeader(doc, "Client Action Plan", "Priority, owner and evidence required before each wave.");
  items.forEach((item) => {
    ensureSpace(doc, 110);
    const y = doc.y;
    doc.roundedRect(MARGIN, y, CONTENT_WIDTH, 94, 10).fillAndStroke("#ffffff", THEME.line);
    doc.rect(MARGIN, y, 6, 94).fill(toneColor(item.tone));
    drawPill(doc, MARGIN + 14, y + 12, item.priority, item.tone);
    drawPill(doc, MARGIN + CONTENT_WIDTH - 160, y + 12, item.beforeWave, item.tone);
    doc.fillColor(THEME.ink).font("Helvetica-Bold").fontSize(10).text(item.action, MARGIN + 14, y + 36, {
      width: CONTENT_WIDTH - 28,
    });
    doc.fillColor(THEME.muted).font("Helvetica").fontSize(8.3).text(`Owner: ${item.owner}`, MARGIN + 14, y + 57, {
      width: CONTENT_WIDTH - 28,
    });
    doc.fillColor(THEME.muted).font("Helvetica").fontSize(8.3).text(`Evidence required: ${item.evidenceRequired}`, MARGIN + 14, y + 71, {
      width: CONTENT_WIDTH - 28,
    });
    doc.y = y + 108;
  });
}

export function renderBlueprintSectionPack(doc: PDFKit.PDFDocument, pack: BlueprintSectionPack) {
  renderBlueprintDecisionSummary(doc, pack.summary);
  renderBlueprintTargetBlueprint(doc, pack.target);
  renderBlueprintValidationMatrix(doc, pack.validationMatrix);
  renderBlueprintRunbookTimeline(doc, pack.runbookTimeline);
  renderBlueprintRollbackDecisionTree(doc, pack.rollbackDecisionTree);
  renderBlueprintClientActionPlan(doc, pack.clientActionPlan);
}
