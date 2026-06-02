import PDFDocument from "pdfkit/js/pdfkit.standalone.js";
import { NextResponse } from "next/server";
import { getDemoScenarioBySlug } from "../../../../server/demo/demoDatasets";

export const runtime = "nodejs";

function sanitizeDownloadName(filename: string) {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/_+/g, "_");
}

function writeSection(doc: PDFKit.PDFDocument, title: string, items: string[]) {
  doc.moveDown(0.8);
  doc.fontSize(15).fillColor("#111827").text(title);
  doc.moveDown(0.25);
  doc.fontSize(10).fillColor("#374151");
  for (const item of items) {
    doc.text(`• ${item}`, { indent: 12 });
  }
}

function renderScenarioPdf(scenario: NonNullable<ReturnType<typeof getDemoScenarioBySlug>>) {
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ margin: 54, size: "A4", info: { Title: scenario.name } });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc
      .fontSize(12)
      .fillColor("#0f766e")
      .text("Shift Evidence Demo Workspace", { align: "left" })
      .moveDown(0.5)
      .fontSize(24)
      .fillColor("#111827")
      .text("Synthetic Demo Report", { align: "left" })
      .moveDown(0.3)
      .fontSize(18)
      .text(scenario.name)
      .moveDown(0.4)
      .fontSize(10)
      .fillColor("#4b5563")
      .text("Generated from synthetic sample data. Not based on a real company or real infrastructure.")
      .moveDown(1);

    doc
      .fontSize(11)
      .fillColor("#111827")
      .text(`Readiness score: ${scenario.readinessScore}/100`)
      .text(`Evidence confidence score: ${scenario.confidenceScore}/100`)
      .text(`Synthetic scope: ${scenario.vmCount} VMs, ${scenario.hostCount} hosts, ${scenario.datastoreCount} datastores`)
      .text(`Primary risk: ${scenario.mainRisk}`);

    writeSection(doc, "Evidence received", scenario.evidenceReceived);
    writeSection(doc, "Evidence missing", scenario.evidenceMissing);
    writeSection(doc, "Top risks", scenario.topRisks);
    writeSection(doc, "Recommendations", scenario.recommendations);

    doc.addPage();
    doc.fontSize(18).fillColor("#111827").text("Migration Recommendation Plan");
    doc.moveDown(0.5);
    for (const wave of scenario.migrationWaves) {
      doc
        .fontSize(12)
        .fillColor("#0f766e")
        .text(`${wave.label}: ${wave.title} (${wave.workloadCount})`)
        .fontSize(10)
        .fillColor("#374151")
        .text(wave.description)
        .moveDown(0.45);
    }

    doc.moveDown(0.8).fontSize(18).fillColor("#111827").text("Senior AI Advisor - Demo Transcript");
    doc.fontSize(10).fillColor("#4b5563").text("Synthetic transcript only. No Gemini/OpenAI provider call was made.");
    for (const item of scenario.advisorTranscript) {
      doc
        .moveDown(0.5)
        .fontSize(11)
        .fillColor("#111827")
        .text(`Q: ${item.question}`)
        .fontSize(10)
        .fillColor("#374151")
        .text(`A: ${item.answer}`);
    }

    doc
      .moveDown(1)
      .fontSize(9)
      .fillColor("#991b1b")
      .text(scenario.disclaimer)
      .text("Demo Workspace is read-only. Uploads, edits, billing, admin and live AI Advisor are disabled.");

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
