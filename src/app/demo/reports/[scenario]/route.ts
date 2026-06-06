import PDFDocument from "pdfkit/js/pdfkit.standalone.js";
import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { getDemoScenarioBySlug } from "../../../../server/demo/demoDatasets";

export const runtime = "nodejs";

const COLORS = {
  ink: "#111827",
  muted: "#4b5563",
  faint: "#94a3b8",
  line: "#dbe5ee",
  paper: "#ffffff",
  panel: "#f8fafc",
  panelStrong: "#eef9fb",
  cyan: "#0891b2",
  cyanSoft: "#e6f7fb",
  green: "#047857",
  greenSoft: "#e9f8f1",
  amber: "#b45309",
  amberSoft: "#fff4df",
  red: "#b91c1c",
  redSoft: "#fff0f0",
};

function sanitizeDownloadName(filename: string) {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/_+/g, "_");
}

function safeText(value: string | number | null | undefined) {
  return String(value ?? "")
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u2192/g, "->")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/\u2026/g, "...");
}

function scoreTone(score: number): "good" | "warning" | "danger" {
  if (score >= 75) return "good";
  if (score >= 50) return "warning";
  return "danger";
}

function toneColors(tone: "good" | "warning" | "danger" | "info") {
  if (tone === "good") return { fill: COLORS.greenSoft, stroke: COLORS.green, text: COLORS.green };
  if (tone === "danger") return { fill: COLORS.redSoft, stroke: COLORS.red, text: COLORS.red };
  if (tone === "warning") return { fill: COLORS.amberSoft, stroke: COLORS.amber, text: COLORS.amber };
  return { fill: COLORS.cyanSoft, stroke: COLORS.cyan, text: COLORS.cyan };
}

const BRAND_ICON_LIGHT_PATH = path.join(process.cwd(), "public", "brand", "shift-evidence-icon-light-transparent.png");

function getShiftEvidenceBrandIcon() {
  try {
    if (fs.existsSync(BRAND_ICON_LIGHT_PATH)) {
      return fs.readFileSync(BRAND_ICON_LIGHT_PATH);
    }
  } catch {
    return null;
  }

  return null;
}

function drawBrandIcon(doc: PDFKit.PDFDocument, x: number, y: number, size = 24) {
  const icon = getShiftEvidenceBrandIcon();
  if (icon) {
    try {
      doc.image(icon, x, y, {
        fit: [size, size],
        align: "center",
        valign: "center",
      });
      return;
    } catch {
      // Fall through to the vector fallback if the PNG cannot be embedded.
    }
  }

  const scale = size / 32;
  const unit = 10 * scale;
  const gap = 2 * scale;
  const radius = 2.8 * scale;
  const left = x + 1 * scale;
  const top = y + 1 * scale;

  doc.roundedRect(left, top, unit, unit, radius).fill("#17223b");
  doc.roundedRect(left + unit + gap, top, unit, unit, radius).fill("#22d3ee");
  doc.roundedRect(left, top + unit + gap, unit, unit, radius).fill("#5b21b6");

  const arrowX = left + unit + gap * 0.55;
  const arrowY = top + unit + gap + unit * 0.35;
  const arrowEndX = left + unit * 2 + gap * 1.45;
  const arrowEndY = top + unit + gap + unit * 0.02;
  const strokeWidth = Math.max(1.35, 3.2 * scale);

  doc
    .moveTo(arrowX, arrowY)
    .bezierCurveTo(
      left + unit * 1.55,
      top + unit * 2.2,
      left + unit * 1.95,
      top + unit * 1.82,
      arrowEndX,
      arrowEndY,
    )
    .lineTo(arrowEndX, top + unit * 2.02 + gap)
    .lineWidth(strokeWidth)
    .lineCap("round")
    .lineJoin("round")
    .strokeColor("#8b5cf6")
    .stroke();

  doc
    .moveTo(arrowEndX, arrowEndY)
    .lineTo(arrowEndX - 4.15 * scale, arrowEndY)
    .moveTo(arrowEndX, arrowEndY)
    .lineTo(arrowEndX, arrowEndY + 4.15 * scale)
    .lineWidth(strokeWidth)
    .lineCap("round")
    .strokeColor("#8b5cf6")
    .stroke();
}

function addHeader(doc: PDFKit.PDFDocument, title: string) {
  doc.rect(0, 0, doc.page.width, 58).fill(COLORS.panelStrong);
  doc.strokeColor(COLORS.line).lineWidth(0.7).moveTo(0, 58).lineTo(doc.page.width, 58).stroke();
  drawBrandIcon(doc, 54, 13, 24);
  doc.fillColor(COLORS.cyan).font("Helvetica-Bold").fontSize(8).text("SHIFT EVIDENCE", 86, 20, {
    characterSpacing: 1.2,
  });
  doc.fillColor(COLORS.muted).font("Helvetica").fontSize(8).text(safeText(title).toUpperCase(), 286, 21, {
    width: 244,
    align: "right",
  });
}

function addPage(doc: PDFKit.PDFDocument, title: string, subtitle?: string) {
  doc.addPage();
  addHeader(doc, title);
  doc.x = 54;
  doc.y = 86;
  doc.fillColor(COLORS.ink).font("Helvetica-Bold").fontSize(22).text(safeText(title), 54, doc.y, {
    width: 490,
  });
  if (subtitle) {
    doc.moveDown(0.25);
    doc.fillColor(COLORS.muted).font("Helvetica").fontSize(10).text(safeText(subtitle), 54, doc.y, {
      width: 490,
      lineGap: 2,
    });
  }
  doc.moveDown(0.9);
}

function ensureSpace(doc: PDFKit.PDFDocument, needed: number, title: string) {
  if (doc.y + needed > doc.page.height - 88) {
    addPage(doc, `${title} continued`);
  }
}

function metricCard(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  width: number,
  label: string,
  value: string,
  note: string,
  tone: "good" | "warning" | "danger" | "info",
) {
  const palette = toneColors(tone);
  doc.roundedRect(x, y, width, 76, 10).fillAndStroke(COLORS.panel, palette.stroke);
  doc.rect(x, y, 5, 76).fill(palette.text);
  doc.fillColor(COLORS.muted).font("Helvetica-Bold").fontSize(7.4).text(safeText(label).toUpperCase(), x + 14, y + 11, {
    width: width - 26,
  });
  doc.fillColor(COLORS.ink).font("Helvetica-Bold").fontSize(18).text(safeText(value), x + 14, y + 28, {
    width: width - 26,
  });
  doc.fillColor(COLORS.muted).font("Helvetica").fontSize(7.8).text(safeText(note), x + 14, y + 53, {
    width: width - 26,
  });
}

function callout(doc: PDFKit.PDFDocument, title: string, body: string, tone: "good" | "warning" | "danger" | "info" = "info") {
  const palette = toneColors(tone);
  ensureSpace(doc, 78, title);
  const y = doc.y;
  doc.roundedRect(54, y, 486, 64, 10).fillAndStroke(palette.fill, palette.stroke);
  doc.fillColor(palette.text).font("Helvetica-Bold").fontSize(8).text(safeText(title).toUpperCase(), 70, y + 12);
  doc.fillColor(COLORS.ink).font("Helvetica").fontSize(9.1).text(safeText(body), 70, y + 29, {
    width: 454,
    lineGap: 2,
  });
  doc.y = y + 82;
}

function writeSection(doc: PDFKit.PDFDocument, title: string, items: string[], tone: "good" | "warning" | "danger" | "info" = "info") {
  ensureSpace(doc, 70, title);
  doc.fillColor(COLORS.ink).font("Helvetica-Bold").fontSize(15).text(safeText(title), 54, doc.y);
  doc.moveDown(0.35);
  const palette = toneColors(tone);
  for (const item of items.length > 0 ? items : ["Not available in this synthetic scenario."]) {
    ensureSpace(doc, 28, title);
    const y = doc.y;
    doc.circle(60, y + 5, 2.6).fill(palette.text);
    doc.fillColor(COLORS.ink).font("Helvetica").fontSize(9.3).text(safeText(item), 70, y, {
      width: 470,
      lineGap: 2,
    });
    doc.moveDown(0.45);
  }
  doc.moveDown(0.25);
}

function simpleTable(doc: PDFKit.PDFDocument, title: string, headers: string[], rows: string[][], widths: number[]) {
  ensureSpace(doc, 110, title);
  doc.fillColor(COLORS.ink).font("Helvetica-Bold").fontSize(15).text(safeText(title), 54, doc.y);
  doc.moveDown(0.35);
  const startX = 54;
  let y = doc.y;
  doc.roundedRect(startX, y, widths.reduce((sum, width) => sum + width, 0), 24, 7).fill(COLORS.panelStrong);
  let x = startX;
  headers.forEach((header, index) => {
    doc.fillColor(COLORS.ink).font("Helvetica-Bold").fontSize(7.5).text(safeText(header), x + 6, y + 8, {
      width: widths[index] - 12,
    });
    x += widths[index];
  });
  y += 24;

  rows.forEach((row, rowIndex) => {
    const rowH = 46;
    if (y + rowH > doc.page.height - 88) {
      doc.y = y;
      addPage(doc, `${title} continued`);
      y = doc.y;
    }
    x = startX;
    doc.rect(startX, y, widths.reduce((sum, width) => sum + width, 0), rowH).fill(rowIndex % 2 === 0 ? COLORS.paper : COLORS.panel);
    row.forEach((cell, index) => {
      doc.fillColor(index === 0 ? COLORS.ink : COLORS.muted).font(index === 0 ? "Helvetica-Bold" : "Helvetica").fontSize(7.6).text(safeText(cell), x + 6, y + 7, {
        width: widths[index] - 12,
        lineGap: 1,
      });
      x += widths[index];
    });
    y += rowH;
  });
  doc.y = y + 18;
}

function addPageNumbers(doc: PDFKit.PDFDocument) {
  const range = doc.bufferedPageRange();
  for (let pageIndex = range.start; pageIndex < range.start + range.count; pageIndex += 1) {
    doc.switchToPage(pageIndex);
    const footerY = doc.page.height - 66;
    doc.strokeColor(COLORS.line).lineWidth(0.5).moveTo(54, footerY - 10).lineTo(doc.page.width - 54, footerY - 10).stroke();
    doc.fillColor(COLORS.faint).font("Helvetica").fontSize(7.6).text(
      "Shift Evidence Demo Workspace - synthetic report - no customer data - no production access",
      54,
      footerY,
      { width: 390, lineBreak: false },
    );
    doc.fillColor(COLORS.faint).font("Helvetica").fontSize(7.6).text(`Page ${pageIndex + 1} of ${range.count}`, 466, footerY, {
      width: 74,
      align: "right",
      lineBreak: false,
    });
  }
}

function renderScenarioPdf(scenario: NonNullable<ReturnType<typeof getDemoScenarioBySlug>>) {
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({
      margin: 54,
      size: "A4",
      bufferPages: true,
      autoFirstPage: false,
      info: { Title: `${scenario.name} - Shift Evidence Synthetic Demo Report` },
    });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc.addPage();
    doc.rect(0, 0, doc.page.width, doc.page.height).fill(COLORS.paper);
    doc.rect(0, 0, doc.page.width, 152).fill(COLORS.panelStrong);
    doc.rect(0, 152, doc.page.width, 6).fill(COLORS.cyan);
    drawBrandIcon(doc, 54, 38, 38);
    doc.fillColor(COLORS.ink).font("Helvetica-Bold").fontSize(14).text("SHIFT EVIDENCE", 100, 47, {
      characterSpacing: 1.6,
    });
    doc.fillColor(COLORS.cyan).font("Helvetica-Bold").fontSize(9).text("DEMO WORKSPACE", 54, 118, {
      characterSpacing: 1.6,
    });
    doc.fillColor(COLORS.ink).font("Helvetica-Bold").fontSize(32).text("Synthetic Demo Report", 54, 88, {
      width: 470,
      lineGap: -2,
    });
    doc.fillColor(COLORS.ink).font("Helvetica-Bold").fontSize(20).text(safeText(scenario.name), 54, 180, {
      width: 470,
    });
    doc.fillColor(COLORS.muted).font("Helvetica").fontSize(10.5).text(
      "VMware -> Proxmox Migration Readiness sample. Generated from synthetic data only.",
      54,
      210,
      { width: 470, lineGap: 2 },
    );
    metricCard(doc, 54, 286, 150, "Readiness Score", `${scenario.readinessScore}/100`, "Migration posture", scoreTone(scenario.readinessScore));
    metricCard(doc, 222, 286, 150, "Evidence Confidence", `${scenario.confidenceScore}/100`, "Evidence strength", scoreTone(scenario.confidenceScore));
    metricCard(doc, 390, 286, 150, "Scope", `${scenario.vmCount} VMs`, `${scenario.hostCount} hosts / ${scenario.datastoreCount} datastores`, "info");
    doc.y = 388;
    callout(
      doc,
      "Synthetic scope",
      `${scenario.description} Primary risk: ${scenario.mainRisk}. This report is not based on a real company or real infrastructure.`,
      "info",
    );

    addPage(doc, "Executive Summary", "A concise decision view for stakeholders before exploring the full demo workspace.");
    callout(
      doc,
      "Decision signal",
      `Readiness is ${scenario.readinessScore}/100 while evidence confidence is ${scenario.confidenceScore}/100. Treat this as a planning signal, not migration authorization.`,
      scoreTone(scenario.readinessScore),
    );
    writeSection(doc, "What was analyzed", [
      `${scenario.vmCount} synthetic VMs across ${scenario.hostCount} hosts and ${scenario.datastoreCount} datastores.`,
      `Scenario theme: ${scenario.mainRisk}.`,
      "Evidence gaps are shown explicitly instead of being guessed.",
    ]);
    writeSection(doc, "Immediate recommendations", scenario.recommendations, "warning");

    addPage(doc, "Evidence Matrix", "Received and missing evidence are separated because confidence changes the recommendation.");
    simpleTable(
      doc,
      "Evidence received",
      ["Evidence", "Status", "Impact"],
      scenario.evidenceReceived.map((item) => [item, "Received", "Supports initial readiness and wave planning."]),
      [180, 80, 246],
    );
    simpleTable(
      doc,
      "Evidence missing",
      ["Evidence", "Status", "Recommended next evidence"],
      scenario.evidenceMissing.map((item) => [item, "Missing", "Collect before production wave approval."]),
      [180, 80, 246],
    );

    addPage(doc, "Top Risks", "Risk cards connect each finding to impact and follow-up action.");
    writeSection(doc, "Top risk findings", scenario.topRisks, "danger");
    callout(
      doc,
      "Business Continuity Risk",
      "Backup, dependency, rollback and maintenance-window evidence should be validated before critical workloads enter production waves.",
      "warning",
    );
    callout(
      doc,
      "Storage Destination Readiness",
      "Storage and target architecture are treated as decision gates. Ceph, ZFS, NFS or PBS assumptions require evidence before blueprint work.",
      "info",
    );
    callout(
      doc,
      "Licensing & Cost Exposure",
      "The demo illustrates cost exposure framing only. It does not provide a quote, legal advice or guaranteed savings.",
      "info",
    );

    addPage(doc, "Migration Recommendation Plan", "Wave planning is technical sequencing, not a final cutover order.");
    simpleTable(
      doc,
      "Recommended waves",
      ["Wave", "Scope", "Evidence gate"],
      scenario.migrationWaves.map((wave) => [
        `${wave.label}: ${wave.title}`,
        `${wave.workloadCount}. ${wave.description}`,
        wave.label.toLowerCase().includes("hold") ? "Resolve missing evidence before release." : "Pilot, rollback and owner validation required.",
      ]),
      [116, 270, 120],
    );

    addPage(doc, "Senior AI Advisor Notes", "Synthetic advisor examples; no live Gemini/OpenAI call was made.");
    for (const item of scenario.advisorTranscript) {
      ensureSpace(doc, 78, "Senior AI Advisor Notes");
      doc.fillColor(COLORS.cyan).font("Helvetica-Bold").fontSize(8).text("QUESTION", 54, doc.y);
      doc.fillColor(COLORS.ink).font("Helvetica-Bold").fontSize(10).text(safeText(item.question), 54, doc.y + 13, {
        width: 486,
      });
      doc.moveDown(0.35);
      doc.fillColor(COLORS.cyan).font("Helvetica-Bold").fontSize(8).text("SYNTHETIC ADVISOR ANSWER", 54, doc.y);
      doc.fillColor(COLORS.muted).font("Helvetica").fontSize(9.2).text(safeText(item.answer), 54, doc.y + 13, {
        width: 486,
        lineGap: 2,
      });
      doc.moveDown(1);
    }

    addPage(doc, "Assumptions, Disclaimers and Next Steps", "Boundaries keep the demo useful without unsafe claims.");
    writeSection(
      doc,
      "What this demo does not claim",
      [
        "It does not migrate workloads.",
        "It does not guarantee zero downtime, production safety or savings.",
        "It does not replace expert validation, pilot import testing, restore proof or owner sign-off.",
        "It does not use customer data.",
      ],
      "warning",
    );
    callout(doc, "Read-only demo", "Uploads, edits, billing, admin and live AI Advisor are disabled in Demo Workspace.", "info");
    callout(doc, "Next step", scenario.paidCta, "good");

    addPageNumbers(doc);
    doc.end();
  });
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ scenario: string }> },
) {
  const { scenario: slug } = await context.params;
  const scenario = getDemoScenarioBySlug(slug);

  if (!scenario) {
    return NextResponse.json({ error: "Demo scenario not found." }, { status: 404 });
  }

  const buffer = await renderScenarioPdf(scenario);
  const filename = sanitizeDownloadName(scenario.report.filename);

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(buffer.byteLength),
      "Cache-Control": "public, max-age=3600",
    },
  });
}
