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
    const filesByRoute = {
      "/": "src/components/Hero.tsx",
      "/shiftreadiness": "src/views/ShiftReadinessPage.tsx",
      "/pricing": "src/app/pricing/page.tsx",
      "/sample-report": "src/components/sample-report/SampleReportPage.tsx",
      "/vmware-to-proxmox-readiness": "src/app/vmware-to-proxmox-readiness/page.tsx",
    };

    for (const [route, file] of Object.entries(filesByRoute)) {
      const contents = readProjectFile(file);
      expect(contents, `${route} should link to demo`).toContain('href="/demo"');
      expect(contents, `${route} should render CTA label`).toContain("Explore a Sample Assessment");
    }
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
