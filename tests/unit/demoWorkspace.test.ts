import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  DEMO_USER_EMAIL,
  demoScenarios,
  getDemoScenarioBySlug,
} from "../../src/server/demo/demoDatasets";
import {
  assertNotDemoMode,
  DEMO_ADVISOR_BLOCK_MESSAGE,
  DEMO_DISABLED_MESSAGE,
  DEMO_READ_ONLY_MESSAGE,
  DEMO_UPLOAD_BLOCK_MESSAGE,
  DemoModeMutationError,
  getDemoBlockedMessage,
  isDemoAssessmentId,
  isDemoMode,
  isDemoUserEmail,
} from "../../src/server/demo/demoGuards";

function readProjectFile(filePath: string) {
  return fs.readFileSync(path.join(process.cwd(), filePath), "utf8");
}

describe("read-only synthetic Demo Workspace", () => {
  it("publishes a demo hub with quick replay and deep workspace paths", () => {
    const hubPage = readProjectFile("src/app/demo/page.tsx");
    const hubComponent = readProjectFile("src/components/demo/DemoHubPage.tsx");

    expect(hubPage).toContain("DemoHubPage");
    expect(hubComponent).toContain("Explore Shift Evidence before you buy");
    expect(hubComponent).toContain('href="/demo/replay"');
    expect(hubComponent).toContain('href="/demo/workspace"');
    expect(hubComponent).toContain("Watch Quick Simulation");
    expect(hubComponent).toContain("Explore a Sample Assessment");
    expect(hubComponent).toContain("Both demos use synthetic data");
  });

  it("publishes the quick Migration Readiness Replay route", () => {
    const replayPage = readProjectFile("src/app/demo/replay/page.tsx");
    const replayComponent = readProjectFile("src/components/demoReplay/DemoReplayPage.tsx");

    expect(replayPage).toContain("DemoReplayExperience");
    expect(replayComponent).toContain("Senior-grade migration readiness before touching production.");
    expect(replayComponent).toContain("Synthetic replay only");
    expect(replayComponent).toContain('href="/sample-report"');
    expect(replayComponent).toContain("Download full sample report");
  });

  it("publishes the deep Demo Workspace route with a quick replay cross-link", () => {
    const workspacePage = readProjectFile("src/app/demo/workspace/page.tsx");
    const workspaceComponent = readProjectFile("src/components/demo/DemoWorkspacePage.tsx");

    expect(workspacePage).toContain("DemoWorkspacePage");
    expect(workspaceComponent).toContain("Start with the guided 90-second replay");
    expect(workspaceComponent).toContain('href="/demo/replay"');
    expect(workspaceComponent).toContain("Watch Quick Simulation");
  });

  it("publishes exactly 8 complete synthetic demo scenarios", () => {
    expect(demoScenarios).toHaveLength(8);
    expect(new Set(demoScenarios.map((scenario) => scenario.slug)).size).toBe(8);

    for (const scenario of demoScenarios) {
      expect(scenario.slug).toMatch(/^[a-z0-9-]+$/);
      expect(scenario.name.length).toBeGreaterThan(6);
      expect(scenario.description.length).toBeGreaterThan(20);
      expect(scenario.readinessScore).toBeGreaterThanOrEqual(0);
      expect(scenario.readinessScore).toBeLessThanOrEqual(100);
      expect(scenario.confidenceScore).toBeGreaterThanOrEqual(0);
      expect(scenario.confidenceScore).toBeLessThanOrEqual(100);
      expect(scenario.evidenceReceived.length).toBeGreaterThan(0);
      expect(scenario.evidenceMissing.length).toBeGreaterThan(0);
      expect(scenario.topRisks.length).toBeGreaterThanOrEqual(3);
      expect(scenario.recommendations.length).toBeGreaterThanOrEqual(3);
      expect(scenario.migrationWaves.length).toBeGreaterThanOrEqual(3);
      expect(scenario.advisorTranscript.length).toBeGreaterThanOrEqual(3);
      expect(scenario.report.filename).toMatch(/demo-report\.pdf$/);
      expect(scenario.report.downloadPath).toBe(`/demo/reports/${scenario.slug}`);
      expect(scenario.disclaimer).toContain("Synthetic Demo Report");
      expect(scenario.disclaimer).toContain("Not based on a real company");
    }
  });

  it("exposes lookup by slug without returning non-demo data", () => {
    expect(getDemoScenarioBySlug(demoScenarios[0].slug)?.slug).toBe(demoScenarios[0].slug);
    expect(getDemoScenarioBySlug("real-customer-assessment")).toBeNull();
  });

  it("renders the required public CTA entry points", () => {
    const expectationsByRoute = {
      "/": {
        file: "src/components/Hero.tsx",
        hrefs: ['href="/demo/replay"', 'href="/sample-report"'],
        labels: ["Watch the replay", "Download sample report"],
      },
      "/shiftreadiness": {
        file: "src/views/ShiftReadinessPage.tsx",
        hrefs: ['href="/demo/replay"', 'href="/demo/workspace"'],
        labels: ["Watch Quick Simulation", "Explore a Sample Assessment"],
      },
      "/pricing": {
        file: "src/app/pricing/page.tsx",
        hrefs: ['href="/demo/workspace"'],
        labels: ["Explore a Sample Assessment"],
      },
      "/sample-report": {
        file: "src/components/sample-report/SampleReportPage.tsx",
        hrefs: ['href="/demo/replay"', 'href="/demo/workspace"'],
        labels: ["Watch Quick Simulation", "Explore a Sample Assessment"],
      },
      "/vmware-to-proxmox-readiness": {
        file: "src/components/googleAdsLanding/GoogleAdsLandingV2.tsx",
        hrefs: ['href="/demo/replay"', 'href: "/demo/workspace"', 'href="/sample-report"', 'href="/start"'],
        labels: ["Watch 90-Second Demo", "Explore workspace", "Download Sample Report", "Start Readiness Assessment"],
      },
    };

    for (const [route, expectation] of Object.entries(expectationsByRoute)) {
      const contents = readProjectFile(expectation.file);
      for (const href of expectation.hrefs) {
        expect(contents, `${route} should link to ${href}`).toContain(href);
      }
      for (const label of expectation.labels) {
        expect(contents, `${route} should render CTA label ${label}`).toContain(label);
      }
    }
  });

  it("keeps the public sample report connected to Professional and Blueprint value", () => {
    const sampleReport = readProjectFile("src/components/sample-report/SampleReportPage.tsx");

    expect(sampleReport).toContain("Full premium synthetic sample");
    expect(sampleReport).toContain("Professional Assessment");
    expect(sampleReport).toContain("Migration Blueprint");
    expect(sampleReport).toContain("Watch Quick Simulation");
    expect(sampleReport).toContain("Explore a Sample Assessment");
    expect(sampleReport).toContain("View pricing");
    expect(sampleReport).toContain("Download premium sample PDF");
  });

  it("keeps demo PDF reports premium, synthetic, and section-complete", () => {
    const demoReportRoute = readProjectFile("src/app/demo/reports/[scenario]/route.ts");

    expect(demoReportRoute).toContain("Synthetic Demo Report");
    expect(demoReportRoute).toContain("Executive Summary");
    expect(demoReportRoute).toContain("Evidence Matrix");
    expect(demoReportRoute).toContain("Top Risks");
    expect(demoReportRoute).toContain("Business Continuity Risk");
    expect(demoReportRoute).toContain("Storage Destination Readiness");
    expect(demoReportRoute).toContain("Licensing & Cost Exposure");
    expect(demoReportRoute).toContain("Migration Recommendation Plan");
    expect(demoReportRoute).toContain("Senior AI Advisor Notes");
    expect(demoReportRoute).toContain("Assumptions, Disclaimers and Next Steps");
    expect(demoReportRoute).toContain("Page ${pageIndex + 1} of ${range.count}");
  });

  it("blocks demo mutations with commercial messages", () => {
    expect(isDemoUserEmail(DEMO_USER_EMAIL)).toBe(true);
    expect(isDemoAssessmentId("demo-john-balanced-mid-market")).toBe(true);
    expect(isDemoMode({ email: DEMO_USER_EMAIL })).toBe(true);
    expect(isDemoMode({ assessmentId: "demo-viviana-balanced-mid-market" })).toBe(true);
    expect(isDemoMode({ email: "customer@example.com", assessmentId: "real-assessment" })).toBe(false);

    expect(() => assertNotDemoMode({ email: DEMO_USER_EMAIL, kind: "create_assessment" })).toThrow(DemoModeMutationError);
    expect(getDemoBlockedMessage("create_assessment")).toBe(DEMO_READ_ONLY_MESSAGE);
    expect(getDemoBlockedMessage("upload_evidence")).toBe(DEMO_UPLOAD_BLOCK_MESSAGE);
    expect(getDemoBlockedMessage("live_advisor")).toBe(DEMO_ADVISOR_BLOCK_MESSAGE);
    expect(getDemoBlockedMessage("admin")).toBe(DEMO_DISABLED_MESSAGE);
  });

  it("keeps demo reports public, synthetic, and separate from private storage paths", () => {
    const forbidden = [/\/api\/assessments/i, /dashboard\/assessments/i, /storage\/uploads/i, /\/uploads\//i, /relativePath/i, /storedFilename/i];

    for (const scenario of demoScenarios) {
      expect(scenario.report.downloadPath).toMatch(/^\/demo\/reports\/[a-z0-9-]+$/);
      for (const pattern of forbidden) {
        expect(scenario.report.downloadPath).not.toMatch(pattern);
      }
    }
  });
});
