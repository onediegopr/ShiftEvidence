import PDFDocument from "pdfkit";
import { PassThrough } from "stream";
import type { ReportPreviewData } from "./reportPreviewService";

export type PdfReportRenderInput = {
  assessmentTitle: string;
  clientLabel: string | null;
  workspaceName: string;
  reportTypeLabel: string;
  generatedAt: Date;
  generatedByLabel: string;
  reportPreview: ReportPreviewData;
};

function money(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "—";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function percent(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "—";
  }

  return `${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 1,
  }).format(value)}%`;
}

function number(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "—";
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

function addSectionHeader(doc: PDFKit.PDFDocument, title: string, subtitle?: string) {
  doc.moveDown(0.4);
  doc.font("Helvetica-Bold").fontSize(16).fillColor("#0f172a").text(title, { continued: false });
  if (subtitle) {
    doc.moveDown(0.2);
    doc.font("Helvetica").fontSize(9.5).fillColor("#475569").text(subtitle);
  }
  doc.moveDown(0.4);
}

function addBodyLines(doc: PDFKit.PDFDocument, lines: string[]) {
  lines.forEach((line) => {
    doc.font("Helvetica").fontSize(10.5).fillColor("#0f172a").text(line, {
      lineGap: 2,
    });
    doc.moveDown(0.15);
  });
}

function addBulletList(doc: PDFKit.PDFDocument, items: string[]) {
  items.forEach((item) => {
    doc.font("Helvetica").fontSize(10.5).fillColor("#0f172a").text(`• ${item}`, {
      indent: 0,
      lineGap: 2,
    });
    doc.moveDown(0.1);
  });
}

function addKeyValue(doc: PDFKit.PDFDocument, label: string, value: string) {
  doc.font("Helvetica-Bold").fontSize(10.5).fillColor("#334155").text(label, {
    continued: true,
  });
  doc.font("Helvetica").fillColor("#0f172a").text(` ${value}`);
}

function addSectionTable(doc: PDFKit.PDFDocument, rows: Array<[string, string]>) {
  rows.forEach(([label, value]) => addKeyValue(doc, label, value));
}

function addFinding(doc: PDFKit.PDFDocument, finding: ReportPreviewData["topFindings"][number]) {
  doc.roundedRect(doc.x, doc.y, 500, 72, 8).strokeColor("#cbd5e1").stroke();
  doc.moveDown(0.15);
  doc.font("Helvetica-Bold").fontSize(11).fillColor("#0f172a").text(finding.title);
  doc.font("Helvetica").fontSize(9.5).fillColor("#475569").text(
    `${finding.entityName ?? "Assessment"} • ${finding.category.toUpperCase()} • ${finding.severity.toUpperCase()}`,
  );
  doc.font("Helvetica").fontSize(9.5).fillColor("#0f172a").text(finding.description, {
    width: 500,
  });
  if (finding.recommendation) {
    doc.font("Helvetica-Bold").fontSize(9.5).fillColor("#334155").text("Recommendation: ", {
      continued: true,
    });
    doc.font("Helvetica").fillColor("#0f172a").text(finding.recommendation, {
      width: 500,
    });
  }
  doc.moveDown(0.5);
}

function ensurePageSpace(doc: PDFKit.PDFDocument, minY = 120) {
  if (doc.y > doc.page.height - minY) {
    doc.addPage();
  }
}

export async function renderPdfReportBuffer(input: PdfReportRenderInput) {
  const doc = new PDFDocument({
    size: "A4",
    margin: 48,
    compress: true,
    autoFirstPage: false,
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

    const { reportPreview } = input;
    const latestEvidence = reportPreview.visibleFindings.length > 0 ? "Evidence-driven preview" : "Preliminary preview";
    const generatedDate = dateLabel(input.generatedAt);

    doc.addPage();
    doc.rect(0, 0, doc.page.width, 120).fill("#0f172a");
    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(24).text("ShiftReadiness", 48, 38);
    doc.font("Helvetica").fontSize(15).text("Preliminary PDF Preview", 48, 70);
    doc.font("Helvetica").fontSize(11).text(input.reportTypeLabel, 48, 94);

    doc.moveDown(2);
    doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(18).text(input.assessmentTitle);
    doc.font("Helvetica").fontSize(10.5).fillColor("#475569").text(
      `${input.clientLabel ?? "Current assessment"} • Workspace: ${input.workspaceName} • Generated: ${generatedDate} • ${input.generatedByLabel}`,
    );
    doc.moveDown(0.6);
    doc.font("Helvetica").fontSize(10.5).fillColor("#334155").text(
      "Preliminary report preview generated from current assessment data. This is not final engineering validation and does not replace a migration plan, review, or approval.",
      {
        width: doc.page.width - 96,
      },
    );

    addSectionHeader(doc, "Executive Summary", "A short view for stakeholders and reviewers.");
    addBodyLines(doc, reportPreview.executiveSummary);
    addSectionTable(doc, [
      ["Readiness score", `${reportPreview.completionScore}/100`],
      ["Confidence", reportPreview.evidenceConfidenceLabel],
      ["Risk level", reportPreview.costRiskPreview.riskLevel ?? "low"],
      ["Signal", latestEvidence],
    ]);

    addSectionHeader(doc, "Environment Summary", "Measured inventory extracted from the current evidence.");
    addSectionTable(doc, [
      ["VMs", number(reportPreview.environmentSummary.vmCount)],
      ["Hosts", number(reportPreview.environmentSummary.hostCount)],
      ["Datastores", number(reportPreview.environmentSummary.datastoreCount)],
      ["Snapshots", number(reportPreview.environmentSummary.snapshotCount)],
      ["Powered on", number(reportPreview.environmentSummary.poweredOnVmCount)],
      ["Powered off", number(reportPreview.environmentSummary.poweredOffVmCount)],
      ["Provisioned GB", number(reportPreview.environmentSummary.totalProvisionedGb)],
      ["Used GB", number(reportPreview.environmentSummary.totalUsedGb)],
    ]);

    addSectionHeader(doc, "Cost / Risk Summary", "Preliminary cost delta and savings signal based on current assumptions.");
    addSectionTable(doc, [
      ["Source", reportPreview.sourceLabel],
      ["Annual delta", money(reportPreview.costRiskPreview.annualSubscriptionDelta)],
      ["3-year delta", money(reportPreview.costRiskPreview.threeYearSubscriptionDelta)],
      ["Savings", percent(reportPreview.costRiskPreview.savingsPercent)],
      ["Readiness label", reportPreview.costRiskPreview.readinessLabel ?? "—"],
      ["Missing evidence", reportPreview.costRiskPreview.missingEvidence.length > 0 ? "Yes" : "No"],
    ]);

    addSectionHeader(doc, "Top Findings", "The most relevant preliminary risk signals.");
    const findings = reportPreview.topFindings.slice(0, 10);
    if (findings.length === 0) {
      doc.font("Helvetica").fontSize(10.5).fillColor("#475569").text("No findings have been generated yet.");
    } else {
      findings.forEach((finding) => {
        ensurePageSpace(doc, 180);
        addFinding(doc, finding);
      });
    }

    addSectionHeader(doc, "VM Risk Matrix Preview", "A limited sample of VM-level findings.");
    const matrixRows = reportPreview.vmMatrixPreview.rows.slice(0, 12);
    if (matrixRows.length === 0) {
      doc.font("Helvetica").fontSize(10.5).fillColor("#475569").text("No parsed VMs are available for the preview.");
    } else {
      matrixRows.forEach((row) => {
        ensurePageSpace(doc, 80);
        doc.font("Helvetica-Bold").fontSize(10.5).fillColor("#0f172a").text(row.vmName);
        doc.font("Helvetica").fontSize(9.5).fillColor("#475569").text(
          `Power: ${row.powerState ?? "—"} • Guest OS: ${row.guestOs ?? "—"} • Risk: ${row.riskLevel.toUpperCase()} • Reason: ${row.mainReason}`,
          {
            width: doc.page.width - 96,
          },
        );
        doc.moveDown(0.3);
      });
    }

    addSectionHeader(doc, "Missing Evidence", "Signals still required for a fuller readiness report.");
    if (reportPreview.missingEvidence.length === 0) {
      doc.font("Helvetica").fontSize(10.5).fillColor("#475569").text("No key evidence is missing for the current preview.");
    } else {
      addBulletList(doc, reportPreview.missingEvidence);
    }

    addSectionHeader(doc, "Locked Sections", "What remains gated until the relevant plan is unlocked.");
    if (reportPreview.lockedSections.length === 0) {
      doc.font("Helvetica").fontSize(10.5).fillColor("#475569").text("No locked sections are currently configured.");
    } else {
      reportPreview.lockedSections.slice(0, 8).forEach((section) => {
        ensurePageSpace(doc, 120);
        doc.font("Helvetica-Bold").fontSize(10.5).fillColor("#0f172a").text(section.title);
        doc.font("Helvetica").fontSize(9.5).fillColor("#475569").text(section.description);
        doc.font("Helvetica").fontSize(9.5).fillColor("#0f172a").text(`Requires: ${section.access === "locked" ? "locked" : "preview"}`);
        doc.moveDown(0.2);
      });
    }

    addSectionHeader(doc, "Disclaimer", "Preliminary PDF only.");
    addBodyLines(doc, [
      "This document is a generated readiness preview, not a certified report.",
      "It is based on the data currently available in the assessment and may change as more evidence is uploaded or parsed.",
      "It does not authorize or execute any migration activity.",
    ]);

    doc.end();
  });
}

