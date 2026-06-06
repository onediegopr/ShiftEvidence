import PDFDocument from "pdfkit/js/pdfkit.standalone.js";
import { PassThrough } from "stream";
import { BRAND_WORDMARK, readPrimaryBrandLogoBuffer } from "../brand/brandAssetService";
import type { MigrationRecommendationPlan, MigrationPlanGate } from "./migrationPlanTypes";
import { PRINT_REPORT_THEME } from "./reportTheme";

const MARGIN = 48;
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
const SHIFT_EVIDENCE_LOGO = readPrimaryBrandLogoBuffer();

function drawBrandHeader(doc: PDFKit.PDFDocument) {
  const labelX = SHIFT_EVIDENCE_LOGO ? MARGIN + 30 : MARGIN;

  if (SHIFT_EVIDENCE_LOGO) {
    try {
      doc.image(SHIFT_EVIDENCE_LOGO, MARGIN, MARGIN - 1, {
        fit: [22, 22],
        align: "center",
        valign: "center",
      });
    } catch {
      // Keep the wordmark if the image cannot be embedded.
    }
  }

  doc.fillColor(THEME.ink).font("Helvetica-Bold").fontSize(10).text(BRAND_WORDMARK.toUpperCase(), labelX, MARGIN + 1);
  doc.fillColor(THEME.muted).font("Helvetica").fontSize(8).text("Migration planning report", labelX, MARGIN + 15);
}

function safeText(value: string | number | null | undefined) {
  const text = value === null || value === undefined ? "Not provided" : String(value);
  return Array.from(
    text
      .replace(/[\u2013\u2014]/g, "-")
      .replace(/\u2192/g, "->")
      .replace(/[\u201c\u201d]/g, '"')
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/\u2026/g, "..."),
  )
    .map((char) => {
      const code = char.charCodeAt(0);
      return code >= 32 && code <= 126 ? char : "?";
    })
    .join("");
}

function contentWidth(doc: PDFKit.PDFDocument) {
  return doc.page.width - MARGIN * 2;
}

function ensureSpace(doc: PDFKit.PDFDocument, needed = 90) {
  if (doc.y + needed > doc.page.height - MARGIN) {
    doc.addPage();
  }
}

function heading(doc: PDFKit.PDFDocument, title: string) {
  ensureSpace(doc, 70);
  doc.moveDown(0.7);
  doc.fillColor(THEME.ink).font("Helvetica-Bold").fontSize(15).text(safeText(title), MARGIN, doc.y, {
    width: contentWidth(doc),
  });
  doc.moveDown(0.35);
  doc.strokeColor(THEME.line).lineWidth(1).moveTo(MARGIN, doc.y).lineTo(doc.page.width - MARGIN, doc.y).stroke();
  doc.moveDown(0.5);
}

function paragraph(doc: PDFKit.PDFDocument, text: string) {
  ensureSpace(doc, 42);
  doc.fillColor(THEME.muted).font("Helvetica").fontSize(9.5).text(safeText(text), MARGIN, doc.y, {
    width: contentWidth(doc),
    lineGap: 2,
  });
  doc.moveDown(0.35);
}

function bulletList(doc: PDFKit.PDFDocument, items: string[], empty = "No items.") {
  const list = items.length > 0 ? items : [empty];
  list.slice(0, 12).forEach((item) => {
    ensureSpace(doc, 28);
    doc.fillColor(THEME.ink).font("Helvetica").fontSize(9).text(`- ${safeText(item)}`, MARGIN + 8, doc.y, {
      width: contentWidth(doc) - 8,
      lineGap: 1.5,
    });
  });
  doc.moveDown(0.25);
}

function gateTone(gate: MigrationPlanGate) {
  if (gate.status === "pass") return THEME.green;
  if (gate.status === "fail") return THEME.red;
  if (gate.status === "warning" || gate.status === "insufficient_evidence") return THEME.amber;
  return THEME.blue;
}

function drawGate(doc: PDFKit.PDFDocument, gate: MigrationPlanGate) {
  ensureSpace(doc, 78);
  const y = doc.y;
  doc.roundedRect(MARGIN, y, contentWidth(doc), 64, 8).fillAndStroke("#ffffff", THEME.line);
  doc.fillColor(gateTone(gate)).font("Helvetica-Bold").fontSize(8).text(safeText(gate.status.toUpperCase()), MARGIN + 12, y + 10, {
    width: 110,
  });
  doc.fillColor(THEME.ink).font("Helvetica-Bold").fontSize(10).text(safeText(gate.key), MARGIN + 120, y + 9, {
    width: contentWidth(doc) - 132,
  });
  doc.fillColor(THEME.muted).font("Helvetica").fontSize(8.5).text(safeText(gate.explanation), MARGIN + 12, y + 27, {
    width: contentWidth(doc) - 24,
  });
  doc.fillColor(THEME.muted).font("Helvetica").fontSize(8).text(`Recommendation: ${safeText(gate.recommendation)}`, MARGIN + 12, y + 45, {
    width: contentWidth(doc) - 24,
  });
  doc.y = y + 74;
}

function addPageNumbers(doc: PDFKit.PDFDocument) {
  const range = doc.bufferedPageRange();
  for (let index = range.start; index < range.start + range.count; index += 1) {
    doc.switchToPage(index);
    doc.fillColor(THEME.muted).font("Helvetica").fontSize(8).text(
      `Page ${index + 1} of ${range.count}`,
      MARGIN,
      doc.page.height - 32,
      {
        align: "right",
        width: contentWidth(doc),
      },
    );
  }
}

export async function renderMigrationPlanPdfBuffer(plan: MigrationRecommendationPlan) {
  const doc = new PDFDocument({
    size: "A4",
    margin: MARGIN,
    bufferPages: true,
    info: {
      Title: "Shift Evidence Migration Recommendation Plan",
      Author: "Shift Evidence",
    },
  });
  const stream = new PassThrough();
  const chunks: Buffer[] = [];
  stream.on("data", (chunk: Buffer) => chunks.push(chunk));
  const finished = new Promise<Buffer>((resolve, reject) => {
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
  doc.pipe(stream);

  drawBrandHeader(doc);
  doc.fillColor(THEME.ink).font("Helvetica-Bold").fontSize(24).text("Migration Recommendation Plan", MARGIN, 96, {
    width: contentWidth(doc),
  });
  doc.fillColor(THEME.muted).font("Helvetica").fontSize(12).text(safeText(plan.evidenceSummary.assessmentTitle), MARGIN, 132, {
    width: contentWidth(doc),
  });
  doc.moveDown(2);
  doc.roundedRect(MARGIN, 184, contentWidth(doc), 112, 10).fillAndStroke(THEME.panel, THEME.line);
  doc.fillColor(THEME.ink).font("Helvetica-Bold").fontSize(13).text(safeText(plan.executiveDecision), MARGIN + 16, 204, {
    width: contentWidth(doc) - 32,
  });
  doc.fillColor(THEME.muted).font("Helvetica").fontSize(10).text(`Plan level: ${safeText(plan.planLevel)} | Confidence: ${safeText(plan.confidence)} | AI narrative: ${plan.aiNarrative.providerStatus}`, MARGIN + 16, 252, {
    width: contentWidth(doc) - 32,
  });
  doc.fillColor(THEME.muted).font("Helvetica").fontSize(8.5).text("Evidence-based output. Missing backup, target, storage or dependency evidence limits recommendation depth. Deterministic gates override narrative.", MARGIN + 16, 272, {
    width: contentWidth(doc) - 32,
  });
  doc.y = 330;

  heading(doc, "Evidence Coverage");
  bulletList(doc, Object.entries(plan.evidenceSummary.evidenceCoverage).map(([key, present]) => `${key}: ${present ? "present" : "missing"}`));

  heading(doc, "Gates");
  plan.gates.forEach((gate) => drawGate(doc, gate));

  heading(doc, "Critical Blockers");
  bulletList(doc, plan.evidenceSummary.blockers, "No critical deterministic blockers found.");

  heading(doc, "Required Remediation");
  bulletList(doc, plan.evidenceSummary.remediationItems, "No remediation items generated.");

  heading(doc, "Wave Strategy");
  plan.evidenceSummary.waveInputs.forEach((wave) => paragraph(doc, `${wave.label}: ${wave.explanation}`));

  heading(doc, "Go / No-Go Checklist");
  const goNoGo = plan.sections.find((section) => section.key === "go_no_go");
  bulletList(doc, goNoGo?.actionItems ?? []);

  heading(doc, "Next Steps");
  bulletList(doc, plan.aiNarrative.nextStepsNarrative);

  heading(doc, "Open Evidence Requests");
  const open = plan.sections.find((section) => section.key === "open_evidence_requests");
  bulletList(doc, open?.actionItems ?? []);

  addPageNumbers(doc);
  doc.end();
  return finished;
}
