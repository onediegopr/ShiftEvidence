import PDFDocument from "pdfkit/js/pdfkit.standalone.js";
import { PassThrough } from "stream";
import fs from "node:fs";
import path from "node:path";
import type { ReportPreviewData } from "./reportPreviewService";
import type { ReportCoverageRow } from "./reportCoverageSection";
import { PRINT_REPORT_THEME, PRINT_TONE_COLORS, type ReportTone } from "./reportTheme";

export type PdfReportRenderInput = {
  assessmentTitle: string;
  clientLabel: string | null;
  workspaceName: string;
  reportTypeLabel: string;
  generatedAt: Date;
  generatedByLabel: string;
  reportPreview: ReportPreviewData;
  reportBranding?: PdfReportBrandingInput | null;
};

export type PdfReportBrandLogo = {
  label: string;
  mimeType: "image/png" | "image/jpeg";
  buffer: Buffer;
};

export type PdfReportBrandingInput = {
  audience: "own_company" | "client";
  companyName: string | null;
  clientName: string | null;
  companyLogo: PdfReportBrandLogo | null;
  clientLogo: PdfReportBrandLogo | null;
  whiteLabel: boolean;
};

type Tone = ReportTone;

const MARGIN = 44;
const THEME = {
  ...PRINT_REPORT_THEME,
  navy: PRINT_REPORT_THEME.panelStrong,
  navy2: PRINT_REPORT_THEME.tableHeader,
};

const TONE_COLORS = PRINT_TONE_COLORS;
const BRAND_ICON_LIGHT_PATH = path.join(process.cwd(), "public", "brand", "shift-evidence-icon-light-transparent.png");
const BRAND_ICON_DARK_PATH = path.join(process.cwd(), "public", "brand", "shift-evidence-icon-dark-transparent.png");

function getShiftEvidenceBrandIcon(dark = false) {
  const preferredPath = dark ? BRAND_ICON_DARK_PATH : BRAND_ICON_LIGHT_PATH;
  try {
    if (fs.existsSync(preferredPath)) {
      return fs.readFileSync(preferredPath);
    }
  } catch {
    return null;
  }

  return null;
}

function drawShiftEvidenceMark(doc: PDFKit.PDFDocument, x: number, y: number, size: number) {
  const scale = size / 32;
  const strokeWidth = Math.max(1, 2.5 * scale);

  doc
    .circle(x + 12 * scale, y + 16 * scale, 8 * scale)
    .lineWidth(strokeWidth)
    .strokeColor("#06b6d4")
    .stroke();

  doc
    .moveTo(x + 12 * scale, y + 16 * scale)
    .lineTo(x + 24 * scale, y + 16 * scale)
    .moveTo(x + 24 * scale, y + 16 * scale)
    .lineTo(x + 20 * scale, y + 12 * scale)
    .moveTo(x + 24 * scale, y + 16 * scale)
    .lineTo(x + 20 * scale, y + 20 * scale)
    .lineWidth(strokeWidth)
    .lineCap("round")
    .lineJoin("round")
    .strokeColor("#8b5cf6")
    .stroke();
}

function drawShiftEvidenceWordmark(doc: PDFKit.PDFDocument, x: number, y: number, dark = false) {
  const brandIcon = getShiftEvidenceBrandIcon(dark);
  if (brandIcon) {
    try {
      doc.image(brandIcon, x, y - 2, {
        fit: [28, 28],
        align: "center",
        valign: "center",
      });
    } catch {
      drawShiftEvidenceMark(doc, x, y, 24);
    }
  } else {
    drawShiftEvidenceMark(doc, x, y, 24);
  }
  doc.fillColor(dark ? "#ffffff" : THEME.ink).font("Helvetica-Bold").fontSize(11).text("Shift Evidence", x + 32, y + 1);
  doc.fillColor(dark ? "#cbd5e1" : THEME.muted).font("Helvetica").fontSize(8).text("Powered readiness reports", x + 32, y + 15);
}

function drawLogoPanel(params: {
  doc: PDFKit.PDFDocument;
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  name: string | null;
  logo: PdfReportBrandLogo | null;
}) {
  const { doc, x, y, w, h, title, name, logo } = params;
  doc.roundedRect(x, y, w, h, 10).fillAndStroke(THEME.paper, THEME.line);
  doc.fillColor(THEME.cyan).font("Helvetica-Bold").fontSize(7.3).text(safeText(title).toUpperCase(), x + 12, y + 10, {
    width: w - 24,
  });
  doc.fillColor(THEME.ink).font("Helvetica-Bold").fontSize(9).text(safeText(name ?? "Not provided"), x + 12, y + 24, {
    width: w - 24,
  });

  const logoY = y + 44;
  const logoH = h - 56;
  if (logo) {
    try {
      doc.image(logo.buffer, x + 12, logoY, {
        fit: [w - 24, logoH],
        align: "center",
        valign: "center",
      });
    } catch {
      doc.fillColor(THEME.faint).font("Helvetica").fontSize(8).text("Logo could not be embedded", x + 12, logoY + 8, {
        width: w - 24,
      });
    }
  } else {
    doc.fillColor(THEME.faint).font("Helvetica").fontSize(8).text("Logo not provided", x + 12, logoY + 8, {
      width: w - 24,
    });
  }
}

function drawCoverBranding(doc: PDFKit.PDFDocument, input: PdfReportRenderInput, x: number, y: number) {
  const branding = input.reportBranding;
  if (!branding || (!branding.companyLogo && !branding.clientLogo && !branding.companyName && !branding.clientName)) {
    doc.fillColor(THEME.muted).font("Helvetica").fontSize(9).text("Report branding: Shift Evidence / ShiftReadiness", x, y, {
      width: contentWidth(doc),
    });
    return;
  }

  const panelW = (contentWidth(doc) - 18) / 2;
  drawLogoPanel({
    doc,
    x,
    y,
    w: panelW,
    h: 82,
    title: branding.audience === "client" ? "Partner / consultant" : "Company",
    name: branding.companyName,
    logo: branding.companyLogo,
  });
  drawLogoPanel({
    doc,
    x: x + panelW + 18,
    y,
    w: panelW,
    h: 82,
    title: branding.audience === "client" ? "End client" : "Client / assessment",
    name: branding.audience === "client" ? branding.clientName : input.clientLabel,
    logo: branding.audience === "client" ? branding.clientLogo : null,
  });
  doc.fillColor(THEME.muted).font("Helvetica").fontSize(8).text("White-label output. Powered by Shift Evidence.", x, y + 92, {
    width: contentWidth(doc),
  });
}

function safeText(value: string | number | null | undefined) {
  const text = value === null || value === undefined ? "Not provided" : String(value);
  const normalized = text
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u2192/g, "->")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/\u2026/g, "...");

  return Array.from(normalized)
    .map((char) => {
      const code = char.charCodeAt(0);
      return code >= 32 && code <= 126 ? char : "?";
    })
    .join("");
}

function money(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "Not available";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function percent(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "Not available";
  }

  return `${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 1,
  }).format(value)}%`;
}

function number(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "Not available";
  }

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 1,
  }).format(value);
}

function dateLabel(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(value);
}

function contentWidth(doc: PDFKit.PDFDocument) {
  return doc.page.width - MARGIN * 2;
}

function bottomLimit(doc: PDFKit.PDFDocument) {
  return doc.page.height - 76;
}

function getScoreLabel(value: number | null | undefined, kind: "readiness" | "confidence") {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return kind === "readiness" ? "Readiness not scored" : "Evidence not scored";
  }

  if (kind === "readiness") {
    if (value >= 75) return "High readiness";
    if (value >= 50) return "Medium readiness";
    return "Low readiness";
  }

  if (value >= 70) return "Strong evidence";
  if (value >= 45) return "Moderate evidence";
  return "Limited evidence";
}

function getScoreTone(value: number | null | undefined): Tone {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "neutral";
  }

  if (value >= 75) return "good";
  if (value >= 50) return "warning";
  return "danger";
}

function getSeverityTone(severity: string | null | undefined): Tone {
  switch (severity) {
    case "critical":
    case "high":
      return "danger";
    case "medium":
      return "warning";
    case "low":
      return "good";
    default:
      return "neutral";
  }
}

function titleCase(value: string | null | undefined) {
  if (!value) {
    return "Not provided";
  }

  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function addContentPage(doc: PDFKit.PDFDocument, section: string, title: string, subtitle?: string) {
  doc.addPage();
  doc.rect(0, 0, doc.page.width, 64).fill(THEME.navy);
  doc.strokeColor(THEME.line).lineWidth(0.7).moveTo(0, 64).lineTo(doc.page.width, 64).stroke();
  doc
    .fillColor(THEME.cyan)
    .font("Helvetica-Bold")
    .fontSize(8)
    .text(safeText(section).toUpperCase(), MARGIN, 18, { characterSpacing: 1.1 });
  doc.fillColor(THEME.ink).font("Helvetica-Bold").fontSize(15).text(safeText(title), MARGIN, 33);
  if (subtitle) {
    doc.fillColor(THEME.muted).font("Helvetica").fontSize(8.5).text(safeText(subtitle), MARGIN + 250, 35, {
      width: doc.page.width - MARGIN * 2 - 250,
      align: "right",
    });
  }
  doc.y = 92;
  doc.x = MARGIN;
}

function ensureSpace(doc: PDFKit.PDFDocument, needed: number, title: string) {
  if (doc.y + needed > bottomLimit(doc)) {
    addContentPage(doc, "Continued", title);
  }
}

function badge(doc: PDFKit.PDFDocument, text: string, tone: Tone, x = doc.x, y = doc.y) {
  const colors = TONE_COLORS[tone];
  const label = safeText(text).toUpperCase();
  const width = Math.max(64, doc.widthOfString(label) + 16);
  doc.roundedRect(x, y, width, 18, 9).fillAndStroke(colors.fill, colors.stroke);
  doc.fillColor(colors.text).font("Helvetica-Bold").fontSize(7).text(label, x + 8, y + 5, {
    width: width - 16,
    align: "center",
  });
  return width;
}

function h2(doc: PDFKit.PDFDocument, text: string, note?: string) {
  doc.moveDown(0.2);
  doc.x = MARGIN;
  doc.fillColor(THEME.ink).font("Helvetica-Bold").fontSize(17).text(safeText(text), MARGIN, doc.y, {
    width: contentWidth(doc),
  });
  if (note) {
    doc.moveDown(0.15);
    doc.fillColor(THEME.muted).font("Helvetica").fontSize(9.5).text(safeText(note), MARGIN, doc.y, {
      width: contentWidth(doc),
      lineGap: 2,
    });
  }
  doc.moveDown(0.55);
}

function paragraph(doc: PDFKit.PDFDocument, text: string, options?: PDFKit.Mixins.TextOptions) {
  doc.x = MARGIN;
  doc.fillColor(THEME.ink).font("Helvetica").fontSize(9.5).text(safeText(text), MARGIN, doc.y, {
    width: contentWidth(doc),
    lineGap: 2,
    ...options,
  });
}

function callout(doc: PDFKit.PDFDocument, text: string, tone: Tone = "info") {
  const colors = TONE_COLORS[tone];
  const y = doc.y;
  doc.roundedRect(MARGIN, y, contentWidth(doc), 54, 8).fillAndStroke(colors.fill, colors.stroke);
  doc.fillColor(colors.text).font("Helvetica-Bold").fontSize(9).text("Evidence note", MARGIN + 16, y + 11);
  doc.fillColor(THEME.ink).font("Helvetica").fontSize(9).text(safeText(text), MARGIN + 16, y + 27, {
    width: contentWidth(doc) - 32,
    lineGap: 2,
  });
  doc.y = y + 68;
}

function metricCard(params: {
  doc: PDFKit.PDFDocument;
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  value: string;
  note?: string;
  tone?: Tone;
}) {
  const { doc, x, y, w, h, label, value, note, tone = "neutral" } = params;
  const colors = TONE_COLORS[tone];
  doc.roundedRect(x, y, w, h, 10).fillAndStroke(THEME.panel, colors.stroke);
  doc.rect(x, y, 5, h).fill(colors.text);
  doc.fillColor(THEME.muted).font("Helvetica-Bold").fontSize(7.5).text(safeText(label).toUpperCase(), x + 14, y + 12, {
    width: w - 24,
  });
  doc.fillColor(THEME.ink).font("Helvetica-Bold").fontSize(18).text(safeText(value), x + 14, y + 28, {
    width: w - 24,
    height: 24,
  });
  if (note) {
    doc.fillColor(THEME.muted).font("Helvetica").fontSize(8).text(safeText(note), x + 14, y + 56, {
      width: w - 24,
      height: h - 62,
      lineGap: 1,
    });
  }
}

function twoColumnList(params: {
  doc: PDFKit.PDFDocument;
  leftTitle: string;
  leftItems: string[];
  rightTitle: string;
  rightItems: string[];
}) {
  const { doc, leftTitle, leftItems, rightTitle, rightItems } = params;
  const gap = 18;
  const colW = (contentWidth(doc) - gap) / 2;
  const top = doc.y;
  const leftH = Math.max(170, 32 + leftItems.slice(0, 8).length * 24);
  const rightH = Math.max(170, 32 + rightItems.slice(0, 8).length * 24);
  const boxH = Math.max(leftH, rightH);

  function drawColumn(x: number, title: string, items: string[], tone: Tone) {
    doc.roundedRect(x, top, colW, boxH, 10).fillAndStroke("#ffffff", THEME.line);
    badge(doc, title, tone, x + 14, top + 14);
    let y = top + 46;
    const visible = items.length > 0 ? items.slice(0, 8) : ["Not available in current evidence"];
    visible.forEach((item) => {
      doc.circle(x + 18, y + 4, 2).fill(TONE_COLORS[tone].text);
      doc.fillColor(THEME.ink).font("Helvetica").fontSize(8.8).text(safeText(item), x + 28, y, {
        width: colW - 42,
        lineGap: 1,
      });
      y += 24;
    });
    if (items.length > visible.length) {
      doc.fillColor(THEME.muted).font("Helvetica").fontSize(8).text(`+ ${items.length - visible.length} more`, x + 28, y, {
        width: colW - 42,
      });
    }
  }

  drawColumn(MARGIN, leftTitle, leftItems, "good");
  drawColumn(MARGIN + colW + gap, rightTitle, rightItems, "warning");
  doc.y = top + boxH + 20;
}

function bulletList(doc: PDFKit.PDFDocument, items: string[], maxItems = 10, continuationTitle = "List") {
  const visible = items.length > 0 ? items.slice(0, maxItems) : ["Not available in current evidence"];
  visible.forEach((item) => {
    ensureSpace(doc, 32, continuationTitle);
    doc.circle(MARGIN + 4, doc.y + 5, 2).fill(THEME.cyan);
    doc.fillColor(THEME.ink).font("Helvetica").fontSize(9.2).text(safeText(item), MARGIN + 16, doc.y, {
      width: contentWidth(doc) - 16,
      lineGap: 2,
    });
    doc.moveDown(0.45);
  });
}

function shouldIncludeAiAdvisory(preview: ReportPreviewData) {
  return (
    (preview.aiAdvisory.providerStatus === "mock" || preview.aiAdvisory.providerStatus === "success") &&
    (preview.aiAdvisory.executiveSummaryNotes.length > 0 ||
      preview.aiAdvisory.technicalNotes.length > 0 ||
      preview.aiAdvisory.missingContextQuestions.length > 0)
  );
}

function keyValueTable(doc: PDFKit.PDFDocument, rows: Array<[string, string]>) {
  rows.forEach(([key, value], index) => {
    doc.font("Helvetica-Bold").fontSize(8.8);
    const keyHeight = doc.heightOfString(safeText(key), { width: 150 });

    doc.font("Helvetica").fontSize(8.8);
    const valueHeight = doc.heightOfString(safeText(value), { width: contentWidth(doc) - 190 });

    const textHeight = Math.max(keyHeight, valueHeight);
    const paddingY = 8;
    const rowH = Math.max(24, textHeight + paddingY);

    ensureSpace(doc, rowH + 8, "Table");
    const y = doc.y;
    if (index % 2 === 0) {
      doc.rect(MARGIN, y - 3, contentWidth(doc), rowH).fill("#f8fafc");
    }
    doc.fillColor(THEME.slate).font("Helvetica-Bold").fontSize(8.8).text(safeText(key), MARGIN + 10, y + 3, {
      width: 150,
    });
    doc.fillColor(THEME.ink).font("Helvetica").fontSize(8.8).text(safeText(value), MARGIN + 172, y + 3, {
      width: contentWidth(doc) - 190,
    });
    doc.y = y + rowH;
  });
  doc.moveDown(0.5);
}

function coverageTable(doc: PDFKit.PDFDocument, rows: ReportCoverageRow[]) {
  const headers = ["Area", "Status", "Required", "Impact"];
  const widths = [126, 76, 72, 248];
  const startX = MARGIN;
  const headerY = doc.y;

  doc.rect(startX, headerY, contentWidth(doc), 24).fill(THEME.navy2);
  let x = startX + 8;
  headers.forEach((header, index) => {
    doc.fillColor(THEME.ink).font("Helvetica-Bold").fontSize(8).text(header, x, headerY + 8, {
      width: widths[index],
    });
    x += widths[index];
  });
  doc.y = headerY + 30;

  rows.forEach((row, index) => {
    ensureSpace(doc, 56, "Assessment Coverage & Assumptions");
    const y = doc.y;
    if (index % 2 === 0) {
      doc.rect(startX, y - 4, contentWidth(doc), 50).fill("#f8fafc");
    }

    x = startX + 8;
    doc.fillColor(THEME.ink).font("Helvetica-Bold").fontSize(8.2).text(safeText(row.area), x, y, {
      width: widths[0] - 10,
      height: 38,
      lineGap: 1,
    });
    x += widths[0];
    badge(doc, row.status, row.tone, x, y - 1);
    x += widths[1];
    doc.fillColor(THEME.slate).font("Helvetica-Bold").fontSize(8).text(safeText(row.required), x, y + 2, {
      width: widths[2] - 8,
      height: 20,
    });
    x += widths[2];
    doc.fillColor(THEME.muted).font("Helvetica").fontSize(7.7).text(safeText(row.impact), x, y, {
      width: widths[3] - 12,
      height: 40,
      lineGap: 1,
    });
    doc.y = y + 52;
  });
}

function addCoverageSection(doc: PDFKit.PDFDocument, preview: ReportPreviewData) {
  const coverage = preview.assessmentCoverage;

  addContentPage(doc, "Section 2A", coverage.title, "Evidence coverage, assumptions and limitations");
  paragraph(doc, coverage.intro);
  doc.moveDown(0.8);

  const cardY = doc.y;
  metricCard({
    doc,
    x: MARGIN,
    y: cardY,
    w: 130,
    h: 82,
    label: "Assessment Progress",
    value: `${coverage.completionPercent}%`,
    note: "Assessment module progress",
    tone: getScoreTone(coverage.completionPercent),
  });
  metricCard({
    doc,
    x: MARGIN + 136,
    y: cardY,
    w: 132,
    h: 82,
    label: "Context Precision",
    value: `${coverage.reportConfidencePercent}%`,
    note: "Evidence and context strength",
    tone: getScoreTone(coverage.reportConfidencePercent),
  });
  metricCard({
    doc,
    x: MARGIN + 280,
    y: cardY,
    w: 108,
    h: 82,
    label: "Required",
    value: coverage.requiredModulesLabel,
    note: "Required module status",
    tone: coverage.requiredModulesLabel === "Complete" ? "good" : "warning",
  });
  metricCard({
    doc,
    x: MARGIN + 400,
    y: cardY,
    w: 108,
    h: 82,
    label: "Report",
    value: coverage.reportGenerationLabel,
    note: "Generation status",
    tone: coverage.reportGenerationLabel === "Generated" ? "good" : "neutral",
  });
  doc.y = cardY + 108;

  h2(doc, "Module coverage");
  coverageTable(doc, coverage.rows);
  doc.moveDown(0.6);

  ensureSpace(doc, 120, "Report Limitations continued");
  h2(doc, "Report Limitations");
  bulletList(doc, coverage.limitations, 9, "Report Limitations continued");
  ensureSpace(doc, 84, "Report Limitations continued");
  callout(doc, coverage.usdNote, "info");
}

function findingCard(doc: PDFKit.PDFDocument, finding: ReportPreviewData["topFindings"][number]) {
  ensureSpace(doc, 96, "Top Findings");
  const y = doc.y;
  const h = 88;
  const tone = getSeverityTone(finding.severity);
  doc.roundedRect(MARGIN, y, contentWidth(doc), h, 9).fillAndStroke("#ffffff", TONE_COLORS[tone].stroke);
  doc.rect(MARGIN, y, 5, h).fill(TONE_COLORS[tone].text);
  badge(doc, titleCase(finding.severity), tone, MARGIN + 14, y + 12);
  doc.fillColor(THEME.ink).font("Helvetica-Bold").fontSize(10.5).text(safeText(finding.title), MARGIN + 110, y + 12, {
    width: contentWidth(doc) - 124,
    height: 16,
  });
  doc.fillColor(THEME.muted).font("Helvetica").fontSize(8).text(
    safeText(`${finding.entityName ?? "Assessment"} | ${titleCase(finding.category)} | ${titleCase(finding.source)}`),
    MARGIN + 110,
    y + 30,
    { width: contentWidth(doc) - 124 },
  );
  doc.fillColor(THEME.ink).font("Helvetica").fontSize(8.6).text(safeText(finding.description), MARGIN + 14, y + 50, {
    width: contentWidth(doc) - 28,
    height: 28,
    lineGap: 1,
  });
  if (finding.recommendation) {
    doc.fillColor(THEME.slate).font("Helvetica-Bold").fontSize(8).text("Recommendation: ", MARGIN + 14, y + 76, {
      continued: true,
      width: contentWidth(doc) - 28,
    });
    doc.fillColor(THEME.ink).font("Helvetica").text(safeText(finding.recommendation), {
      width: contentWidth(doc) - 118,
    });
  }
  doc.y = y + h + 12;
}

function vmRiskTable(doc: PDFKit.PDFDocument, rows: ReportPreviewData["vmMatrixPreview"]["rows"]) {
  const headers = ["VM", "Risk", "Reason", "Action"];
  const widths = [120, 62, 190, 150];
  const startX = MARGIN;
  const rowH = 34;
  const headerY = doc.y;

  doc.rect(startX, headerY, contentWidth(doc), 24).fill(THEME.navy2);
  let x = startX + 8;
  headers.forEach((header, index) => {
    doc.fillColor(THEME.ink).font("Helvetica-Bold").fontSize(8).text(header, x, headerY + 8, {
      width: widths[index],
    });
    x += widths[index];
  });
  doc.y = headerY + 28;

  rows.slice(0, 12).forEach((row, index) => {
    ensureSpace(doc, rowH + 16, "VM Risk Matrix");
    const y = doc.y;
    if (index % 2 === 0) {
      doc.rect(startX, y - 3, contentWidth(doc), rowH).fill("#f8fafc");
    }
    x = startX + 8;
    doc.fillColor(THEME.ink).font("Helvetica-Bold").fontSize(8).text(safeText(row.vmName), x, y, {
      width: widths[0] - 8,
      height: 18,
    });
    x += widths[0];
    badge(doc, titleCase(row.riskLevel), getSeverityTone(row.riskLevel), x, y - 1);
    x += widths[1];
    doc.fillColor(THEME.ink).font("Helvetica").fontSize(7.8).text(safeText(row.mainReason), x, y, {
      width: widths[2] - 10,
      height: 24,
      lineGap: 1,
    });
    x += widths[2];
    doc.fillColor(THEME.muted).font("Helvetica").fontSize(7.8).text(
      safeText(row.recommendation ?? "Validate in pilot wave before production cutover."),
      x,
      y,
      { width: widths[3] - 10, height: 24, lineGap: 1 },
    );
    doc.y = y + rowH;
  });
}

function getWhatThisMeans(input: PdfReportRenderInput) {
  const preview = input.reportPreview;
  const output = [
    `Recommended decision: ${preview.recommendedDecision}.`,
    `Readiness and confidence are separate signals. Current readiness is ${getScoreLabel(preview.readinessScore, "readiness").toLowerCase()}, while evidence confidence is ${preview.evidenceConfidenceLabel.toLowerCase()}.`,
    "This assessment is based on the evidence provided. Missing evidence is explicitly shown because it changes confidence and migration risk.",
  ];

  if (preview.findingCounts.critical + preview.findingCounts.high > 0) {
    output.push("Critical and high findings should be reviewed before any production migration window is planned.");
  }

  if (preview.evidenceOverview.sourceIndicator === "limited") {
    output.push("The current evidence set is limited; treat conclusions as preliminary and prioritize evidence collection.");
  }

  return output.slice(0, 5);
}

function getImmediateActions(input: PdfReportRenderInput) {
  const preview = input.reportPreview;
  const actions = new Set<string>();

  preview.costRiskPreview.recommendations.slice(0, 3).forEach((item) => actions.add(item));
  preview.upgradeRecommendations.slice(0, 2).forEach((item) => actions.add(item));

  if (preview.missingEvidence.length > 0) {
    actions.add("Collect missing evidence before treating this as a migration blueprint.");
  }

  actions.add("Run a pilot import and rollback validation before any production migration.");
  actions.add("Confirm application owners and maintenance windows for critical workloads.");

  return [...actions].slice(0, 5);
}

function waveRows(preview: ReportPreviewData) {
  const rows = preview.vmMatrixPreview.rows;
  const low = rows.filter((row) => row.riskLevel === "low" || row.riskLevel === "info").slice(0, 3);
  const medium = rows.filter((row) => row.riskLevel === "medium").slice(0, 3);
  const high = rows.filter((row) => row.riskLevel === "high" || row.riskLevel === "critical").slice(0, 3);

  return [
    ["Wave 0 - Pilot", low.length > 0 ? low.map((row) => row.vmName).join(", ") : "Select low-risk, non-critical candidates after inventory validation.", "Validate import, network mapping, backup restore and rollback mechanics."],
    ["Wave 1 - Low-risk candidates", low.length > 0 ? low.map((row) => row.vmName).join(", ") : "Not enough VM-level evidence yet.", "Move simple workloads only after pilot success."],
    ["Wave 2 - Standard production", medium.length > 0 ? medium.map((row) => row.vmName).join(", ") : "Requires dependency and owner validation.", "Use normal change windows and post-cutover checks."],
    ["Wave 3 - Critical/manual review", high.length > 0 ? high.map((row) => row.vmName).join(", ") : "Hold critical workloads until business validation is complete.", "Require application owner review, rollback plan and backup restore proof."],
    ["Hold / Remediate first", preview.findingCounts.critical > 0 ? `${preview.findingCounts.critical} critical finding(s) require remediation.` : "Use this lane for workloads with missing dependency, backup or target sizing evidence.", "Do not schedule cutover until blocking evidence is resolved."],
  ];
}

function waveTable(doc: PDFKit.PDFDocument, rows: string[][]) {
  const headers = ["Wave", "Candidate basis", "Required validation"];
  const widths = [118, 206, 198];
  const startX = MARGIN;
  const headerY = doc.y;

  doc.rect(startX, headerY, contentWidth(doc), 24).fill(THEME.navy2);
  let x = startX + 8;
  headers.forEach((header, index) => {
    doc.fillColor(THEME.ink).font("Helvetica-Bold").fontSize(8).text(header, x, headerY + 8, {
      width: widths[index],
    });
    x += widths[index];
  });
  doc.y = headerY + 30;

  rows.forEach((row, index) => {
    ensureSpace(doc, 58, "Migration Wave Preview");
    const y = doc.y;
    if (index % 2 === 0) {
      doc.rect(startX, y - 4, contentWidth(doc), 52).fill("#f8fafc");
    }

    x = startX + 8;
    doc.fillColor(THEME.ink).font("Helvetica-Bold").fontSize(8.5).text(safeText(row[0]), x, y, {
      width: widths[0] - 10,
      height: 36,
      lineGap: 1,
    });
    x += widths[0];
    doc.fillColor(THEME.ink).font("Helvetica").fontSize(8).text(safeText(row[1]), x, y, {
      width: widths[1] - 12,
      height: 42,
      lineGap: 1,
    });
    x += widths[1];
    doc.fillColor(THEME.muted).font("Helvetica").fontSize(8).text(safeText(row[2]), x, y, {
      width: widths[2] - 12,
      height: 42,
      lineGap: 1,
    });
    doc.y = y + 54;
  });
}

function shouldRenderFullLicensingSection(input: PdfReportRenderInput) {
  return input.reportTypeLabel !== "PDF Preview";
}

function getLicensingStatusTone(value: string | null | undefined): Tone {
  switch (value) {
    case "completed":
    case "fresh":
    case "high":
      return "good";
    case "ready":
    case "needs_input":
    case "stale_pricing":
    case "stale":
    case "medium":
    case "limited":
      return "warning";
    case "blocked":
    case "low":
      return "danger";
    default:
      return "neutral";
  }
}

function shouldRenderFullCustomerContextSection(input: PdfReportRenderInput) {
  return input.reportTypeLabel !== "PDF Preview";
}

function getCustomerContextStatusTone(value: string | null | undefined): Tone {
  switch (value) {
    case "completed":
    case "high":
      return "good";
    case "pending":
    case "stale":
    case "ai_disabled":
    case "budget_blocked":
    case "plan_restricted":
    case "medium":
    case "limited":
      return "warning";
    case "failed":
    case "low":
      return "danger";
    default:
      return "neutral";
  }
}

function boolLabel(value: boolean | null | undefined) {
  if (value === true) {
    return "Yes";
  }

  if (value === false) {
    return "No";
  }

  return "Unknown";
}

function shouldRenderFullStorageSection(input: PdfReportRenderInput) {
  return input.reportTypeLabel !== "PDF Preview";
}

function getStorageStatusTone(value: string | null | undefined): Tone {
  switch (value) {
    case "completed":
    case "analyzed":
    case "submitted":
    case "ceph_applies":
    case "ceph_does_not_apply":
    case "high":
      return "good";
    case "draft":
    case "ready_for_analysis":
    case "pending":
    case "stale":
    case "ai_disabled":
    case "budget_blocked":
    case "plan_restricted":
    case "ceph_conditional":
    case "ceph_overkill":
    case "not_enough_evidence":
    case "medium":
    case "limited":
      return "warning";
    case "failed":
    case "ceph_underdesigned":
    case "low":
      return "danger";
    default:
      return "neutral";
  }
}

function scoreValue(value: number | null | undefined) {
  return value === null || value === undefined ? "Not scored" : `${value}/100`;
}

function addStorageDestinationReadinessSection(doc: PDFKit.PDFDocument, input: PdfReportRenderInput) {
  const section = input.reportPreview.storageDestinationReadiness;
  const fullSection = shouldRenderFullStorageSection(input);

  if (!fullSection && !section.included) {
    return;
  }

  addContentPage(
    doc,
    fullSection ? "Section 2B" : "Preview",
    "Storage Destination Readiness",
    fullSection ? "Target storage path, missing evidence and Ceph suitability" : "Storage readiness teaser for the full report",
  );

  paragraph(
    doc,
    "This section evaluates the storage destination path for the VMware -> Proxmox migration. It separates source storage evidence, target storage assumptions, missing validations and Ceph suitability when applicable.",
  );
  doc.moveDown(0.8);

  if (!section.included) {
    callout(doc, "Storage Destination Readiness was not included for this assessment. Core report generation is not blocked by this optional module.", "info");
    return;
  }

  const cardY = doc.y;
  metricCard({
    doc,
    x: MARGIN,
    y: cardY,
    w: 122,
    h: 86,
    label: "Analysis status",
    value: titleCase(section.status),
    note: "Optional storage layer",
    tone: getStorageStatusTone(section.status),
  });
  metricCard({
    doc,
    x: MARGIN + 130,
    y: cardY,
    w: 126,
    h: 86,
    label: "Destination readiness",
    value: scoreValue(section.storageDestinationReadiness ?? section.storageReadinessScore),
    note: "Target clarity signal",
    tone: getScoreTone(section.storageDestinationReadiness ?? section.storageReadinessScore),
  });
  metricCard({
    doc,
    x: MARGIN + 264,
    y: cardY,
    w: 116,
    h: 86,
    label: "Storage confidence",
    value: scoreValue(section.storageEvidenceConfidence),
    note: "Storage evidence only",
    tone: getScoreTone(section.storageEvidenceConfidence),
  });
  metricCard({
    doc,
    x: MARGIN + 388,
    y: cardY,
    w: 120,
    h: 86,
    label: "Migration risk",
    value: scoreValue(section.storageMigrationRisk),
    note: "Higher means riskier",
    tone: section.storageMigrationRisk !== null && section.storageMigrationRisk >= 70 ? "danger" : section.storageMigrationRisk !== null && section.storageMigrationRisk >= 45 ? "warning" : "neutral",
  });
  doc.y = cardY + 110;

  keyValueTable(doc, [
    ["Current storage type", titleCase(section.currentStorageType ?? "unknown")],
    ["Target preference", titleCase(section.targetStoragePreference ?? "not_decided")],
    ["Ceph status", section.ceph.status ? titleCase(section.ceph.status) : section.ceph.requestedOrConsidered ? "Not evaluated yet" : "Not selected"],
    ["Ceph next step", section.ceph.recommendedNextStep ? titleCase(section.ceph.recommendedNextStep) : "Not applicable"],
  ]);

  h2(doc, "Storage interpretation");
  paragraph(
    doc,
    section.interpretedStorageSummary ??
      "Storage destination inputs are available, but no interpreted storage summary has been persisted yet.",
  );
  doc.moveDown(0.6);

  if (!fullSection) {
    h2(doc, "Preview highlights");
    bulletList(
      doc,
      [
        ...section.missingStorageEvidence.slice(0, 2).map((item) => `${titleCase(item.priority)} priority: ${item.item}. ${item.whyItMatters}`),
        section.ceph.status ? `Ceph status: ${titleCase(section.ceph.status)}.` : null,
      ].filter((item): item is string => Boolean(item)),
      4,
      "Storage Preview continued",
    );
    callout(doc, "Full Storage Destination Readiness detail is reserved for the full readiness report. Raw storage narrative and file contents are not reproduced.", "info");
    return;
  }

  h2(doc, "Source Storage Summary");
  bulletList(
    doc,
    section.sourceStorageSummary.length > 0
      ? section.sourceStorageSummary.map((item) => `${item.item}. Evidence: ${item.evidence ?? "Storage evidence requires validation."} Confidence: ${titleCase(item.confidence)}. Source: ${titleCase(item.source)}.`)
      : ["No source storage summary was persisted. Use RVTools datastore evidence and storage context to improve this section."],
    8,
    "Source Storage Summary continued",
  );

  h2(doc, "Destination Storage Options");
  bulletList(
    doc,
    section.destinationOptions.length > 0
      ? section.destinationOptions.map((item) => `${titleCase(item.option)} - ${titleCase(item.suitability)}. ${item.rationale}${item.missingEvidence.length > 0 ? ` Missing: ${item.missingEvidence.join(", ")}.` : ""}`)
      : ["No destination option analysis has been persisted yet."],
    7,
    "Destination Storage Options continued",
  );

  h2(doc, "Storage Constraints");
  bulletList(
    doc,
    section.storageConstraints.length > 0
      ? section.storageConstraints.map((item) => `${titleCase(item.type)}: ${item.constraint}. Impact: ${item.impact ?? "Validate impact before target design."}`)
      : ["No storage constraints were persisted."],
    7,
    "Storage Constraints continued",
  );

  h2(doc, "Missing Storage Evidence");
  bulletList(
    doc,
    section.missingStorageEvidence.length > 0
      ? section.missingStorageEvidence.map((item) => `${titleCase(item.priority)} priority: ${item.item}. ${item.whyItMatters}`)
      : ["No high-priority storage evidence gaps were persisted."],
    8,
    "Missing Storage Evidence continued",
  );

  h2(doc, "Storage Contradictions / Items to Validate");
  bulletList(
    doc,
    section.storageContradictions.length > 0
      ? section.storageContradictions.map((item) => `${item.title}: ${item.description} Recommended validation: ${item.validationRecommendation}`)
      : ["No storage contradictions were persisted."],
    6,
    "Storage Validation Items continued",
  );

  if (section.ceph.requestedOrConsidered) {
    h2(doc, "Ceph Suitability & Operations Readiness");
    callout(
      doc,
      "Ceph is evaluated only when the evidence supports it. Customer preference for Ceph is not treated as a technical recommendation.",
      "warning",
    );
    const cephCardY = doc.y;
    metricCard({
      doc,
      x: MARGIN,
      y: cephCardY,
      w: 122,
      h: 86,
      label: "Ceph status",
      value: section.ceph.status ? titleCase(section.ceph.status) : "Not evaluated",
      note: "Deterministic engine",
      tone: getStorageStatusTone(section.ceph.status),
    });
    metricCard({
      doc,
      x: MARGIN + 130,
      y: cephCardY,
      w: 126,
      h: 86,
      label: "Suitability",
      value: scoreValue(section.ceph.suitabilityScore),
      note: "Ceph fit",
      tone: getScoreTone(section.ceph.suitabilityScore),
    });
    metricCard({
      doc,
      x: MARGIN + 264,
      y: cephCardY,
      w: 116,
      h: 86,
      label: "Operations",
      value: scoreValue(section.ceph.operationsReadinessScore),
      note: "Skills/support",
      tone: getScoreTone(section.ceph.operationsReadinessScore),
    });
    metricCard({
      doc,
      x: MARGIN + 388,
      y: cephCardY,
      w: 120,
      h: 86,
      label: "Evidence",
      value: scoreValue(section.ceph.evidenceConfidenceScore),
      note: "Ceph-specific",
      tone: getScoreTone(section.ceph.evidenceConfidenceScore),
    });
    doc.y = cephCardY + 110;
    paragraph(doc, section.ceph.summary ?? "Ceph was considered, but no persisted Ceph summary is available yet.");
    doc.moveDown(0.6);
    keyValueTable(doc, [
      ["Capacity fit", scoreValue(section.ceph.capacityFitScore)],
      ["Network readiness", scoreValue(section.ceph.networkReadinessScore)],
      ["Failure domains", scoreValue(section.ceph.failureDomainReadinessScore)],
      ["Backup/PBS readiness", scoreValue(section.ceph.backupReadinessScore)],
      ["Operational skills", scoreValue(section.ceph.operationalSkillsScore)],
      ["Recommended next step", section.ceph.recommendedNextStep ? titleCase(section.ceph.recommendedNextStep) : "Not provided"],
    ]);
    h2(doc, "Ceph findings");
    bulletList(
      doc,
      section.ceph.findings.length > 0
        ? section.ceph.findings.map((item) => `${titleCase(item.severity)} - ${item.title}: ${item.impact} Recommendation: ${item.recommendation}`)
        : ["No Ceph findings were persisted."],
      8,
      "Ceph Findings continued",
    );
    h2(doc, "Ceph remediations");
    bulletList(
      doc,
      section.ceph.remediations.length > 0
        ? section.ceph.remediations.map((item) => `${titleCase(item.priority)} priority: ${item.action}. ${item.reason} Required before Ceph: ${boolLabel(item.requiredBeforeCeph)}.`)
        : ["No Ceph remediations were persisted."],
      8,
      "Ceph Remediations continued",
    );
    h2(doc, "Ceph missing evidence");
    bulletList(
      doc,
      section.ceph.missingEvidence.length > 0
        ? section.ceph.missingEvidence.map((item) => `${titleCase(item.priority)} priority: ${item.item}. ${item.whyItMatters}`)
        : ["No Ceph-specific missing evidence was persisted."],
      8,
      "Ceph Missing Evidence continued",
    );
  } else {
    callout(doc, "Ceph was not selected or strongly signaled for this assessment. Storage Destination Readiness remains agnostic.", "info");
  }

  h2(doc, "Next storage questions");
  bulletList(
    doc,
    section.nextStorageQuestions.length > 0
      ? section.nextStorageQuestions.map((item) => `${titleCase(item.priority)} priority: ${item.question} Reason: ${item.reason}`)
      : ["No storage next questions were persisted."],
    6,
    "Storage Next Questions continued",
  );

  h2(doc, "Additional storage evidence");
  bulletList(
    doc,
    section.additionalStorageEvidence.length > 0
      ? section.additionalStorageEvidence.map((item) => `${item.filename ?? "Unnamed file"}: ${titleCase(item.classification)}; status: ${titleCase(item.analysisStatus)}; included: ${boolLabel(item.included)}.`)
      : ["No storage evidence files were classified for this assessment."],
    8,
    "Storage Evidence Metadata continued",
  );

  h2(doc, "Storage assumptions and disclaimers");
  bulletList(doc, [...section.assumptions, ...section.disclaimers], 10, "Storage Disclaimers continued");
}

function addCustomerContextIntelligenceSection(doc: PDFKit.PDFDocument, input: PdfReportRenderInput) {
  const section = input.reportPreview.customerContextIntelligence;
  const fullSection = shouldRenderFullCustomerContextSection(input);

  if (!fullSection && !section.included) {
    return;
  }

  addContentPage(
    doc,
    fullSection ? "Section 2E" : "Preview",
    "Customer Context Intelligence",
    fullSection ? "Structured interpretation of customer-provided context" : "Customer context teaser for the full report",
  );

  paragraph(
    doc,
    "This section summarizes customer-provided context in a structured form. It reflects what the customer described and what the AI interpreted from that context. It should be validated against technical evidence before making migration decisions.",
  );
  doc.moveDown(0.8);

  if (!section.included) {
    callout(doc, "No client context analysis was included. Report generation is not blocked by this optional module.", "info");
    return;
  }

  const cardY = doc.y;
  metricCard({
    doc,
    x: MARGIN,
    y: cardY,
    w: 122,
    h: 86,
    label: "Analysis status",
    value: titleCase(section.status),
    note: "Optional context layer",
    tone: getCustomerContextStatusTone(section.status),
  });
  metricCard({
    doc,
    x: MARGIN + 130,
    y: cardY,
    w: 126,
    h: 86,
    label: "Context completeness",
    value: section.contextCompletenessScore !== null ? `${section.contextCompletenessScore}/100` : "Not scored",
    note: "Business context quality",
    tone: getScoreTone(section.contextCompletenessScore),
  });
  metricCard({
    doc,
    x: MARGIN + 264,
    y: cardY,
    w: 116,
    h: 86,
    label: "Business confidence",
    value: titleCase(section.businessContextConfidence ?? "unknown"),
    note: "Not technical evidence",
    tone: getCustomerContextStatusTone(section.businessContextConfidence),
  });
  metricCard({
    doc,
    x: MARGIN + 388,
    y: cardY,
    w: 120,
    h: 86,
    label: "Generated",
    value: section.generatedAt ? dateLabel(new Date(section.generatedAt)) : "Not generated",
    note: section.modelUsed ? `Model: ${section.modelUsed}` : "No model metadata",
    tone: section.generatedAt ? "neutral" : "warning",
  });
  doc.y = cardY + 110;

  h2(doc, "Context Provided - Interpreted Summary");
  paragraph(doc, section.interpretedSummary ?? "Client context was submitted but no interpreted summary was persisted.");
  doc.moveDown(0.8);

  if (!fullSection) {
    h2(doc, "Preview highlights");
    bulletList(
      doc,
      [
        ...section.businessPriorities.slice(0, 3).map((item) => `${item.priority}: ${item.evidence ?? "Customer-reported priority."}`),
        ...section.validationItems.slice(0, 2).map((item) => `Validate: ${item.item}`),
      ],
      5,
      "Customer Context Preview continued",
    );
    callout(doc, "Full Customer Context Intelligence detail is reserved for the full readiness report. Raw client narrative is not reproduced.", "info");
    return;
  }

  h2(doc, "Business priorities");
  bulletList(
    doc,
    section.businessPriorities.length > 0
      ? section.businessPriorities.map((item) => `${item.priority}. Evidence: ${item.evidence ?? "Customer-reported context."} Confidence: ${titleCase(item.confidence)}. Source: ${titleCase(item.source)}.`)
      : ["No business priorities were extracted from the persisted analysis."],
    7,
    "Business Priorities continued",
  );

  h2(doc, "Migration constraints");
  bulletList(
    doc,
    section.migrationConstraints.length > 0
      ? section.migrationConstraints.map((item) => `${titleCase(item.type)}: ${item.constraint}. Impact: ${item.impact ?? "Validate impact with the customer."} Source: ${titleCase(item.source)}.`)
      : ["No migration constraints were extracted from the persisted analysis."],
    7,
    "Migration Constraints continued",
  );

  h2(doc, "Critical workloads mentioned");
  if (section.criticalWorkloads.length === 0) {
    callout(doc, "No critical workloads were extracted from the customer context analysis.", "info");
  } else {
    keyValueTable(
      doc,
      section.criticalWorkloads.slice(0, 8).map((item) => [
        item.name,
        `${item.reason ?? "No reason persisted."} Validation needed: ${boolLabel(item.validationNeeded)}. Source: ${titleCase(item.source)}.`,
      ]),
    );
  }

  h2(doc, "Customer-reported risks");
  bulletList(
    doc,
    section.customerReportedRisks.length > 0
      ? section.customerReportedRisks.map((item) => `${titleCase(item.severity)}: ${item.risk}. ${item.rationale ?? "No rationale persisted."} Validation needed: ${boolLabel(item.validationNeeded)}.`)
      : ["No customer-reported risks were extracted from the persisted analysis."],
    7,
    "Customer-Reported Risks continued",
  );

  h2(doc, "Contradictions / Items to validate");
  bulletList(
    doc,
    [
      ...section.contradictions.map((item) => `${item.title}: ${item.description} Recommended validation: ${item.validationRecommendation ?? "Validate with structured evidence."}`),
      ...section.validationItems.map((item) => `${titleCase(item.priority)} priority: ${item.item}. ${item.whyItMatters ?? "Validation is required before using this context operationally."}${item.recommendedOwner ? ` Owner: ${item.recommendedOwner}.` : ""}`),
    ],
    10,
    "Context Validation Items continued",
  );

  h2(doc, "Impact on assessment");
  bulletList(
    doc,
    section.reportImpact.length > 0
      ? section.reportImpact.map((item) => `${titleCase(item.area)}: ${item.impact} Score impact: ${boolLabel(item.shouldAffectScore)}. ${item.note ?? "Treat as advisory unless validated."}`)
      : ["No specific report impact items were extracted from the persisted analysis."],
    6,
    "Context Impact continued",
  );

  h2(doc, "Next questions");
  bulletList(
    doc,
    section.nextQuestions.length > 0
      ? section.nextQuestions.map((item) => `${titleCase(item.priority)} priority: ${item.question}${item.reason ? ` Reason: ${item.reason}` : ""}`)
      : ["No next questions were extracted from the persisted analysis."],
    8,
    "Customer Context Next Questions continued",
  );

  h2(doc, "Additional evidence summary");
  bulletList(
    doc,
    section.additionalEvidenceSummary.length > 0
      ? section.additionalEvidenceSummary.map((item) => `${item.filename ?? "Unnamed file"}: ${titleCase(item.classification)}; status: ${titleCase(item.analysisStatus)}; included: ${boolLabel(item.included)}.`)
      : ["No additional evidence metadata was linked to Customer Context Intelligence."],
    8,
    "Additional Evidence Summary continued",
  );

  if (section.safetyFlags.length > 0) {
    h2(doc, "Context handling notes");
    bulletList(
      doc,
      section.safetyFlags.map((item) => `${titleCase(item.severity)}: ${item.flag}. ${item.explanation ?? "Review as context-handling metadata."}`),
      6,
      "Context Handling Notes continued",
    );
  }

  h2(doc, "Disclaimers");
  bulletList(doc, section.disclaimers, 6, "Customer Context Disclaimer continued");
}

function scenarioRows(label: string, scenario: ReportPreviewData["licensingCostExposure"]["vmwareScenario"]) {
  if (!scenario) {
    return [
      [`${label} scenario`, "Not enough approved pricing evidence to calculate a reliable scenario."],
    ] satisfies Array<[string, string]>;
  }

  return [
    [`${label} source`, `${scenario.label} (${titleCase(scenario.source)})`],
    [`${label} annual`, money(scenario.annualUsd)],
    [`${label} 3-year`, money(scenario.threeYearUsd)],
    [`${label} 5-year`, money(scenario.fiveYearUsd)],
    [`${label} confidence`, titleCase(scenario.confidence)],
  ] satisfies Array<[string, string]>;
}

function licensingComparisonTable(doc: PDFKit.PDFDocument, preview: ReportPreviewData) {
  const section = preview.licensingCostExposure;
  const vmware = section.vmwareScenario;
  const proxmox = section.proxmoxScenario;
  const comparison = section.comparison;

  if (!vmware || !proxmox || !comparison) {
    callout(doc, "Not enough approved pricing evidence to calculate a reliable comparison.", "warning");
    return;
  }

  const rows = [
    ["Year 1", money(vmware.annualUsd), money(proxmox.annualUsd), money(comparison.annualDeltaUsd)],
    ["Year 3", money(vmware.threeYearUsd), money(proxmox.threeYearUsd), money(comparison.threeYearDeltaUsd)],
    ["Year 5", money(vmware.fiveYearUsd), money(proxmox.fiveYearUsd), money(comparison.fiveYearDeltaUsd)],
  ];
  const headers = ["Horizon", "VMware/Broadcom", "Proxmox", "Difference"];
  const widths = [88, 150, 142, 142];
  const startX = MARGIN;
  const headerY = doc.y;

  doc.rect(startX, headerY, contentWidth(doc), 24).fill(THEME.navy2);
  let x = startX + 8;
  headers.forEach((header, index) => {
    doc.fillColor(THEME.ink).font("Helvetica-Bold").fontSize(8).text(header, x, headerY + 8, {
      width: widths[index],
    });
    x += widths[index];
  });
  doc.y = headerY + 30;

  rows.forEach((row, index) => {
    ensureSpace(doc, 38, "Licensing & Cost Exposure Analysis");
    const y = doc.y;
    if (index % 2 === 0) {
      doc.rect(startX, y - 4, contentWidth(doc), 32).fill("#f8fafc");
    }
    x = startX + 8;
    row.forEach((cell, cellIndex) => {
      doc.fillColor(cellIndex === 0 ? THEME.slate : THEME.ink)
        .font(cellIndex === 0 ? "Helvetica-Bold" : "Helvetica")
        .fontSize(8.6)
        .text(safeText(cell), x, y + 3, {
          width: widths[cellIndex] - 10,
          height: 20,
        });
      x += widths[cellIndex];
    });
    doc.y = y + 34;
  });
  doc.moveDown(0.5);
}

function addLicensingCostExposureSection(doc: PDFKit.PDFDocument, input: PdfReportRenderInput) {
  const section = input.reportPreview.licensingCostExposure;
  const fullSection = shouldRenderFullLicensingSection(input);

  if (!fullSection && !section.included) {
    return;
  }

  addContentPage(
    doc,
    fullSection ? "Section 4A" : "Preview",
    "Licensing & Cost Exposure Analysis",
    fullSection ? "Financial exposure, evidence quality and pricing caveats" : "Financial teaser for the full report",
  );

  paragraph(
    doc,
    "This section compares VMware/Broadcom renewal exposure against Proxmox subscription scenarios using customer-provided data, approved pricing snapshots and assessment evidence. It is not a vendor quote.",
  );
  doc.moveDown(0.8);

  if (!section.included) {
    callout(doc, "Licensing & Cost Exposure Analysis was not included or has not been generated for this assessment. Report generation is not blocked by this optional module.", "info");
    return;
  }

  const cardY = doc.y;
  metricCard({
    doc,
    x: MARGIN,
    y: cardY,
    w: 122,
    h: 86,
    label: "Status",
    value: titleCase(section.status),
    note: `Mode: ${titleCase(section.mode ?? "unknown")}`,
    tone: getLicensingStatusTone(section.status),
  });
  metricCard({
    doc,
    x: MARGIN + 130,
    y: cardY,
    w: 126,
    h: 86,
    label: "Financial confidence",
    value: section.financialConfidenceScore !== null ? `${section.financialConfidenceScore}/100` : "Not scored",
    note: section.financialConfidenceLabel ?? "Not calculated",
    tone: getScoreTone(section.financialConfidenceScore),
  });
  metricCard({
    doc,
    x: MARGIN + 264,
    y: cardY,
    w: 116,
    h: 86,
    label: "Savings quality",
    value: titleCase(section.savingsQuality ?? "unknown"),
    note: "Financial evidence quality",
    tone: getLicensingStatusTone(section.savingsQuality),
  });
  metricCard({
    doc,
    x: MARGIN + 388,
    y: cardY,
    w: 120,
    h: 86,
    label: "Timing risk",
    value: section.contractTimingRisk?.label ?? "Unknown",
    note: section.contractTimingRisk?.daysToRenewal !== null && section.contractTimingRisk?.daysToRenewal !== undefined
      ? `${section.contractTimingRisk.daysToRenewal} days to renewal`
      : "Renewal date missing",
    tone: getSeverityTone(section.contractTimingRisk?.severity),
  });
  doc.y = cardY + 110;

  if (!fullSection) {
    h2(doc, "Financial summary");
    keyValueTable(doc, [
      ["Pricing freshness", titleCase(section.pricingFreshnessStatus ?? "unknown")],
      ["Annual delta", money(section.comparison?.annualDeltaUsd)],
      ["3-year delta", money(section.comparison?.threeYearDeltaUsd)],
      ["Executive recommendation", section.executiveRecommendation?.title ?? "Run the full analysis before using financial conclusions."],
    ]);
    callout(doc, "Full Licensing & Cost Exposure detail is reserved for the full readiness report. The preview does not expose the complete financial section.", "info");
    return;
  }

  h2(doc, "Executive recommendation");
  keyValueTable(doc, [
    ["Recommendation", section.executiveRecommendation?.title ?? "No recommendation generated"],
    ["Rationale", section.executiveRecommendation?.description ?? "Run the analysis to generate an executive recommendation."],
    ["Pricing freshness", titleCase(section.pricingFreshnessStatus ?? "unknown")],
    ["Currency", "USD"],
  ]);

  h2(doc, "VMware/Broadcom exposure");
  keyValueTable(doc, scenarioRows("VMware/Broadcom", section.vmwareScenario));
  if (section.vmwareScenario?.warnings.length) {
    bulletList(doc, section.vmwareScenario.warnings, 4, "VMware/Broadcom warnings continued");
  }

  h2(doc, "Proxmox scenario");
  keyValueTable(doc, scenarioRows("Proxmox", section.proxmoxScenario));
  if (section.proxmoxScenario?.warnings.length) {
    bulletList(doc, section.proxmoxScenario.warnings, 4, "Proxmox warnings continued");
  }

  h2(doc, "1 / 3 / 5-year comparison");
  licensingComparisonTable(doc, input.reportPreview);
  if (section.comparison?.notes.length) {
    bulletList(doc, section.comparison.notes, 5, "Comparison notes continued");
  }

  h2(doc, "Cost of staying");
  keyValueTable(doc, [
    ["Summary", section.costOfStaying?.summary ?? "Cost of staying was not quantified from available evidence."],
    ["Annual renewal exposure", money(section.costOfStaying?.annualUsd)],
    ["3-year renewal exposure", money(section.costOfStaying?.threeYearUsd)],
    ["5-year renewal exposure", money(section.costOfStaying?.fiveYearUsd)],
    ["Potential 3-year opportunity loss", money(section.costOfStaying?.opportunityLossThreeYearUsd)],
  ]);

  h2(doc, "Contract timing risk");
  keyValueTable(doc, [
    ["Severity", section.contractTimingRisk?.label ?? "Unknown"],
    ["Days to renewal", section.contractTimingRisk?.daysToRenewal === null || section.contractTimingRisk?.daysToRenewal === undefined ? "Unknown" : number(section.contractTimingRisk.daysToRenewal)],
    ["Recommendation", section.contractTimingRisk?.recommendation ?? "Collect renewal date before using timing as a decision factor."],
  ]);

  h2(doc, "Cost exposure findings");
  bulletList(
    doc,
    section.licensingTraps.length > 0
      ? section.licensingTraps.map((trap) => `${titleCase(trap.severity)}: ${trap.title}. ${trap.description}${trap.recommendation ? ` Recommendation: ${trap.recommendation}` : ""}`)
      : ["No major cost exposure findings were persisted."],
    7,
    "Cost Exposure Findings continued",
  );

  h2(doc, "Missing financial evidence");
  bulletList(
    doc,
    section.missingEvidence.length > 0
      ? section.missingEvidence.map((item) => `${item.label}: ${item.impact} Recommendation: ${item.recommendation}`)
      : ["No major financial evidence gaps were persisted."],
    8,
    "Missing Financial Evidence continued",
  );

  h2(doc, "Pricing snapshot used");
  bulletList(
    doc,
    section.pricingSnapshotUsed.length > 0
      ? section.pricingSnapshotUsed.map((snapshot) =>
          `${titleCase(snapshot.vendor)}: ${snapshot.sourceName ?? snapshot.snapshotId ?? "Approved snapshot"}; last checked: ${snapshot.lastCheckedAt ?? "not provided"}; status: ${snapshot.status ?? "approved"}.`,
        )
      : ["No approved pricing snapshot reference was persisted with this analysis."],
    6,
    "Pricing Snapshot Used continued",
  );

}

function addPageNumbers(doc: PDFKit.PDFDocument) {
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i += 1) {
    doc.switchToPage(i);
    const pageNo = i + 1;
    const footerLineY = doc.page.height - 86;
    const footerTextY = doc.page.height - 74;
    doc
      .strokeColor("#e2e8f0")
      .lineWidth(0.5)
      .moveTo(MARGIN, footerLineY)
      .lineTo(doc.page.width - MARGIN, footerLineY)
      .stroke();
    doc.fillColor(THEME.faint).font("Helvetica").fontSize(8).text("Powered by Shift Evidence | ShiftReadiness - Evidence-based readiness assessment", MARGIN, footerTextY, {
      width: 360,
      lineBreak: false,
    });
    doc.fillColor(THEME.faint).font("Helvetica").fontSize(8).text(`Page ${pageNo} of ${range.count}`, doc.page.width - 150, footerTextY, {
      width: 106,
      align: "right",
      lineBreak: false,
    });
  }
}

export async function renderPdfReportBuffer(input: PdfReportRenderInput) {
  const doc = new PDFDocument({
    size: "A4",
    margin: MARGIN,
    compress: true,
    autoFirstPage: false,
    bufferPages: true,
  });

  const sink = new PassThrough();
  const chunks: Buffer[] = [];

  return await new Promise<Buffer>((resolve, reject) => {
    doc.on("error", reject);
    sink.on("data", (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    sink.on("error", reject);
    sink.on("end", () => {
      resolve(Buffer.concat(chunks));
    });

    doc.pipe(sink);

    const preview = input.reportPreview;
    const generatedDate = dateLabel(input.generatedAt);
    const reportKind =
      input.reportTypeLabel === "PDF Preview"
        ? "Preview Report"
        : input.reportTypeLabel === "Readiness Report"
          ? "Readiness Report"
          : "Executive + Technical Assessment";

    doc.addPage();
    doc.rect(0, 0, doc.page.width, doc.page.height).fill(THEME.paper);
    doc.rect(0, 0, doc.page.width, 168).fill(THEME.panel);
    doc.rect(0, 168, doc.page.width, 6).fill(THEME.cyan);
    drawShiftEvidenceWordmark(doc, MARGIN, 48);
    doc.fillColor(THEME.cyan).font("Helvetica-Bold").fontSize(8).text("SHIFTREADINESS REPORT", MARGIN, 78, {
      characterSpacing: 2,
    });
    doc.fillColor(THEME.ink).font("Helvetica-Bold").fontSize(30).text("VMware to Proxmox", MARGIN, 90);
    doc.fillColor(THEME.ink).font("Helvetica-Bold").fontSize(26).text("Readiness Assessment", MARGIN, 124);
    doc.fillColor(THEME.muted).font("Helvetica").fontSize(12).text("Infrastructure readiness before you migrate.", MARGIN, 186);
    doc.fillColor(THEME.ink).font("Helvetica-Bold").fontSize(18).text(safeText(input.assessmentTitle), MARGIN, 252, {
      width: contentWidth(doc),
    });
    doc.fillColor(THEME.muted).font("Helvetica").fontSize(10).text(
      safeText(`${input.clientLabel ?? "Current assessment"} | Workspace: ${input.workspaceName}`),
      MARGIN,
      282,
      { width: contentWidth(doc) },
    );
    metricCard({
      doc,
      x: MARGIN,
      y: 342,
      w: 156,
      h: 88,
      label: "Report type",
      value: reportKind,
      note: input.reportTypeLabel,
      tone: "info",
    });
    metricCard({
      doc,
      x: MARGIN + 176,
      y: 342,
      w: 156,
      h: 88,
      label: "Generated",
      value: generatedDate,
      note: input.generatedByLabel,
      tone: "neutral",
    });
    metricCard({
      doc,
      x: MARGIN + 352,
      y: 342,
      w: 156,
      h: 88,
      label: "Decision",
      value: preview.recommendedDecision,
      note: "Preliminary, evidence-based signal",
      tone: getScoreTone(preview.readinessScore),
    });
    drawCoverBranding(doc, input, MARGIN, 452);
    doc.fillColor(THEME.muted).font("Helvetica").fontSize(9.5).text(
      "Confidential / Evidence-based assessment. This report is generated from the evidence available at assessment time.",
      MARGIN,
      input.reportBranding ? 562 : 510,
      { width: contentWidth(doc), lineGap: 2 },
    );

    addContentPage(doc, "Section 1", "Executive Summary", reportKind);
    h2(doc, "Decision signal", "A clear stakeholder view of migration readiness and confidence.");
    metricCard({
      doc,
      x: MARGIN,
      y: doc.y,
      w: 120,
      h: 86,
      label: "Readiness",
      value: preview.readinessScore !== null ? `${preview.readinessScore}/100` : "Not scored",
      note: getScoreLabel(preview.readinessScore, "readiness"),
      tone: getScoreTone(preview.readinessScore),
    });
    metricCard({
      doc,
      x: MARGIN + 136,
      y: doc.y,
      w: 120,
      h: 86,
      label: "Confidence",
      value: preview.confidenceScore !== null ? `${preview.confidenceScore}/100` : preview.evidenceConfidenceLabel,
      note: getScoreLabel(preview.confidenceScore, "confidence"),
      tone: getScoreTone(preview.confidenceScore),
    });
    metricCard({
      doc,
      x: MARGIN + 272,
      y: doc.y,
      w: 236,
      h: 86,
      label: "Recommendation",
      value: preview.recommendedDecision,
      note: "Requires validation before production migration.",
      tone: getSeverityTone(preview.costRiskPreview.riskLevel),
    });
    doc.y += 110;
    h2(doc, "What this means");
    bulletList(doc, getWhatThisMeans(input), 5);
    h2(doc, "Immediate actions");
    bulletList(doc, getImmediateActions(input), 5);

    addContentPage(doc, "Section 2", "Evidence Overview", "Evidence received, missing evidence and confidence impact");
    callout(doc, "This assessment is based on the evidence provided. Missing evidence is explicitly shown because it changes confidence and migration risk.", "info");
    keyValueTable(doc, [
      ["Source indicator", titleCase(preview.evidenceOverview.sourceIndicator)],
      ["Evidence confidence", preview.evidenceConfidenceLabel],
      ["Confidence implication", preview.evidenceOverview.confidenceImplication],
      ["Cost / Risk source", preview.sourceLabel],
      ["Migration context coverage", `${preview.migrationContext.coverage.overallPercent}% - ${titleCase(preview.migrationContext.coverage.status)}`],
    ]);
    twoColumnList({
      doc,
      leftTitle: "Evidence received",
      leftItems: preview.evidenceOverview.received,
      rightTitle: "Evidence missing",
      rightItems: preview.evidenceOverview.missing,
    });

    addCoverageSection(doc, preview);
    addStorageDestinationReadinessSection(doc, input);

    addContentPage(doc, "Section 2C", "Migration Context Summary", "Human project context and confidence impact");
    h2(doc, "Context coverage", "Missing context is treated as evidence gap, not a hard error.");
    keyValueTable(doc, [
      ["Overall coverage", `${preview.migrationContext.coverage.overallPercent}%`],
      ["Context status", titleCase(preview.migrationContext.coverage.status)],
      ["Missing key context", `${preview.migrationContext.coverage.missingKeyContext.length}`],
      ["Confidence impact", preview.migrationContext.confidenceImpact],
    ]);
    h2(doc, "Important user-provided context");
    bulletList(doc, preview.migrationContext.importantContext, 8);
    h2(doc, "Missing context");
    bulletList(doc, preview.migrationContext.missingContext, 8);

    if (shouldIncludeAiAdvisory(preview)) {
      addContentPage(doc, "Section 2D", "AI Advisory Notes", "Optional sanitized advisory guidance");
      callout(doc, "AI advisory is optional. It does not replace deterministic readiness, confidence or internal risk findings.", "info");
      keyValueTable(doc, [
        ["Provider status", titleCase(preview.aiAdvisory.providerStatus)],
        ["Provider", titleCase(preview.aiAdvisory.provider)],
        ["Model", preview.aiAdvisory.model ?? "Not configured"],
        ["Confidence impact", preview.aiAdvisory.confidenceImpact],
      ]);
      h2(doc, "Executive advisory");
      bulletList(doc, preview.aiAdvisory.executiveSummaryNotes, 5);
      h2(doc, "Technical advisory");
      bulletList(doc, preview.aiAdvisory.technicalNotes, 5);
      h2(doc, "Missing context follow-up");
      bulletList(
        doc,
        preview.aiAdvisory.missingContextQuestions.map(
          (item) => `${titleCase(item.priority)} priority: ${item.question} ${item.whyItMatters}`,
        ),
        7,
      );
      h2(doc, "Limitations");
      bulletList(doc, preview.aiAdvisory.limitations, 5);
    }

    addCustomerContextIntelligenceSection(doc, input);

    addContentPage(doc, "Section 3", "Environment Summary", "Inventory basis and environment scope");
    h2(doc, "Measured environment", "Counts use parsed evidence when available, then manual input as fallback.");
    const cardY = doc.y;
    const cardW = 118;
    const cardGap = 12;
    [
      ["VMs", number(preview.environmentSummary.vmCount), "Virtual machines"],
      ["Hosts", number(preview.environmentSummary.hostCount), "VMware hosts"],
      ["Datastores", number(preview.environmentSummary.datastoreCount), "Datastores"],
      ["Snapshots", number(preview.environmentSummary.snapshotCount), "Snapshots"],
    ].forEach(([label, value, note], index) => {
      metricCard({
        doc,
        x: MARGIN + index * (cardW + cardGap),
        y: cardY,
        w: cardW,
        h: 82,
        label,
        value,
        note,
        tone: index === 3 && preview.environmentSummary.snapshotCount > 20 ? "warning" : "neutral",
      });
    });
    doc.y = cardY + 106;
    keyValueTable(doc, [
      ["Powered on VMs", number(preview.environmentSummary.poweredOnVmCount)],
      ["Powered off VMs", number(preview.environmentSummary.poweredOffVmCount)],
      ["Provisioned storage (GB)", number(preview.environmentSummary.totalProvisionedGb)],
      ["Used storage (GB)", number(preview.environmentSummary.totalUsedGb)],
      ["Source", preview.sourceLabel],
      ["Confidence note", preview.evidenceOverview.confidenceImplication],
    ]);

    addContentPage(doc, "Section 4", "Readiness and Confidence Scores", "Interpret readiness separately from evidence strength");
    h2(doc, "Score interpretation");
    const hasLicensingCostExposure = Boolean(preview.licensingCostExposure?.included);
    keyValueTable(doc, [
      ["Readiness score", preview.readinessScore !== null ? `${preview.readinessScore}/100 - ${getScoreLabel(preview.readinessScore, "readiness")}` : "Not available in current evidence"],
      ["Confidence score", preview.confidenceScore !== null ? `${preview.confidenceScore}/100 - ${getScoreLabel(preview.confidenceScore, "confidence")}` : `${preview.evidenceConfidenceLabel} - numeric score not available`],
      ["Combined interpretation", preview.readinessScore !== null && preview.confidenceScore !== null && preview.readinessScore >= 70 && preview.confidenceScore < 50
        ? "Promising but not proven. Collect stronger evidence before sequencing production waves."
        : preview.readinessScore !== null && preview.confidenceScore !== null && preview.readinessScore < 50 && preview.confidenceScore >= 70
          ? "Confirmed remediation required. Evidence is strong enough to prioritize fixes."
          : "Pilot-first path. Use findings to define a controlled validation plan."],
      ["Risk level", titleCase(preview.costRiskPreview.riskLevel ?? "unknown")],
      ["Annual subscription delta", hasLicensingCostExposure ? "See Licensing & Cost Exposure section" : money(preview.costRiskPreview.annualSubscriptionDelta)],
      ["3-year subscription delta", hasLicensingCostExposure ? "See Licensing & Cost Exposure section" : money(preview.costRiskPreview.threeYearSubscriptionDelta)],
      ["Estimated savings", hasLicensingCostExposure ? "See Licensing & Cost Exposure section" : percent(preview.costRiskPreview.savingsPercent)],
      ["Finding counts", `Critical: ${preview.findingCounts.critical}, High: ${preview.findingCounts.high}, Medium: ${preview.findingCounts.medium}, Low: ${preview.findingCounts.low}`],
    ]);
    callout(doc, "Readiness and confidence are separate. A workload can look technically simple while still requiring business validation.", "warning");

    addLicensingCostExposureSection(doc, input);

    addContentPage(doc, "Section 5", "Top Findings", "Confirmed and probable risk signals");
    if (preview.topFindings.length === 0) {
      callout(doc, "No findings have been generated yet. Generate inventory-driven risk insights before treating the report as evidence-based.", "warning");
    } else {
      preview.topFindings.slice(0, 10).forEach((finding) => findingCard(doc, finding));
    }

    addContentPage(doc, "Section 6", "VM Risk Matrix", "Top VM-level migration risk signals");
    if (preview.vmMatrixPreview.rows.length === 0) {
      callout(doc, "No VM-level matrix is available yet because parsed inventory is limited.", "warning");
    } else {
      vmRiskTable(doc, preview.vmMatrixPreview.rows);
      doc.moveDown(0.7);
      doc.x = MARGIN;
      paragraph(doc, "The matrix is a technical signal only. Application dependency evidence can change migration grouping and wave order.");
    }

    addContentPage(doc, "Section 7", "Migration Wave Preview", "Technical sequencing model, not a final cutover plan");
    callout(doc, "Wave planning is technical unless application dependency evidence is provided.", "warning");
    waveTable(doc, waveRows(preview));

    addContentPage(doc, "Section 8", "Required Validations", "Checklist before production migration");
    bulletList(doc, [
      "Backup and restore validation for representative workloads.",
      "Application owner review and business criticality confirmation.",
      "Proxmox target sizing validation.",
      "Storage architecture validation.",
      "Network, VLAN and firewall mapping.",
      "Pilot import test with rollback proof.",
      "Maintenance window and communication plan.",
      "Rollback plan and go/no-go criteria.",
    ]);

    addContentPage(doc, "Section 9", "Next Evidence and Next Steps", "What to collect and how to progress");
    h2(doc, "Next evidence to collect");
    bulletList(doc, [
      "Veeam or backup platform export, including restore points and job status.",
      "Proxmox target read-only export or sizing assumptions.",
      "NetBox, IPAM or network map for VLAN and dependency review.",
      "CMDB or application dependency list.",
      "Performance history for critical workloads.",
      "PowerCLI custom export for exceptions not visible in RVTools.",
    ]);
    h2(doc, "Next steps");
    bulletList(doc, [
      "Upload more evidence and regenerate the report.",
      "Review missing evidence with infrastructure and application owners.",
      "Request Starter Readiness or Professional Assessment access when evidence is sufficient.",
      "Prepare a pilot wave before any production migration.",
      "Request a Migration Blueprint only after target architecture and dependency evidence are available.",
    ]);
    callout(
      doc,
      input.reportTypeLabel === "PDF Preview"
        ? "Preview report: commercial sections may remain locked. This is not a final certified report."
        : "Readiness report: use this as an evidence-based planning artifact, not as authorization to migrate without validation.",
      "info",
    );

    addContentPage(doc, "Appendix", "Limitations and Disclaimer", "Conservative by design");
    h2(doc, "What this report does not claim");
    bulletList(doc, [
      "It does not guarantee zero downtime.",
      "It does not prove restore readiness without backup evidence.",
      "It does not provide a complete dependency map unless dependency evidence is provided.",
      "It does not validate final Proxmox architecture without target evidence.",
      "It does not authorize production migration activity.",
    ]);
    h2(doc, "Operating principle");
    paragraph(doc, "Missing backup evidence does not mean backups are absent. It means this assessment cannot verify restore readiness.");
    paragraph(doc, "Do not migrate critical workloads before pilot import, backup restore validation and rollback planning.");

    const customerContextSection = preview.customerContextIntelligence;
    if (customerContextSection) {
      if (customerContextSection.assumptions && customerContextSection.assumptions.length > 0) {
        h2(doc, "Customer Context Intelligence Assumptions");
        bulletList(doc, customerContextSection.assumptions, 8, "Customer Context Assumptions continued");
      }

      if (customerContextSection.disclaimers && customerContextSection.disclaimers.length > 0) {
        h2(doc, "Customer Context Intelligence Disclaimer");
        bulletList(doc, customerContextSection.disclaimers, 6, "Customer Context Disclaimer continued");
      }
    }

    const storageSection = preview.storageDestinationReadiness;
    if (storageSection) {
      if (storageSection.assumptions && storageSection.assumptions.length > 0) {
        h2(doc, "Storage Destination Readiness Assumptions");
        bulletList(doc, storageSection.assumptions, 8, "Storage Assumptions continued");
      }

      if (storageSection.disclaimers && storageSection.disclaimers.length > 0) {
        h2(doc, "Storage Destination Readiness Disclaimer");
        bulletList(doc, storageSection.disclaimers, 8, "Storage Disclaimer continued");
      }
    }

    const licSection = preview.licensingCostExposure;
    if (licSection) {
      if (licSection.assumptions && licSection.assumptions.length > 0) {
        h2(doc, "Licensing & Cost Exposure Assumptions");
        bulletList(doc, licSection.assumptions, 10, "Licensing Assumptions continued");
      }

      if (licSection.included) {
        h2(doc, "Licensing Pricing Snapshots");
        bulletList(
          doc,
          licSection.pricingSnapshotUsed.length > 0
            ? licSection.pricingSnapshotUsed.map((snapshot) =>
                `${titleCase(snapshot.vendor)}: ${snapshot.sourceName ?? snapshot.snapshotId ?? "Approved snapshot"}; last checked: ${snapshot.lastCheckedAt ?? "not provided"}; status: ${snapshot.status ?? "approved"}${snapshot.notes ? `; ${snapshot.notes}` : ""}`,
              )
            : ["No approved pricing snapshot reference was persisted with this analysis."],
          8,
          "Pricing Snapshot Used continued",
        );
      }

      if (licSection.disclaimers && licSection.disclaimers.length > 0) {
        h2(doc, "Licensing Disclaimer");
        bulletList(doc, licSection.disclaimers, 6, "Licensing Disclaimer continued");
      }
    }

    addPageNumbers(doc);
    doc.end();
  });
}
