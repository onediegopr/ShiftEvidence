import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AssessmentDetail } from "../../src/server/assessments/assessmentService";

const mocks = vi.hoisted(() => ({
  buildAdvisorMemoryPromptContext: vi.fn(),
  loggerWarn: vi.fn(),
}));

vi.mock("../../src/server/advisor/advisorMemoryPromptContext", async () => {
  const actual = await vi.importActual<typeof import("../../src/server/advisor/advisorMemoryPromptContext")>(
    "../../src/server/advisor/advisorMemoryPromptContext",
  );

  return {
    ...actual,
    buildAdvisorMemoryPromptContext: mocks.buildAdvisorMemoryPromptContext,
  };
});

vi.mock("../../src/server/logging/logger", () => ({
  logger: {
    warn: mocks.loggerWarn,
  },
}));

import { buildSeniorAdvisorContextPayloadWithMemory } from "../../src/server/advisor/seniorAdvisorContextService";

describe("senior advisor context memory fallback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keeps advisor context available when memory service fails", async () => {
    mocks.buildAdvisorMemoryPromptContext.mockRejectedValue(new Error("relation missing"));

    const context = await buildSeniorAdvisorContextPayloadWithMemory({
      assessment: assessmentFixture(),
      userId: "user-1",
    });

    expect(context.projectMemory).toMatchObject({
      enabled: true,
      included: false,
      reason: "memory_unavailable",
      itemCount: 0,
    });
    expect(context.assessment.id).toBe("assessment-1");
    expect(mocks.loggerWarn).toHaveBeenCalledWith(
      "advisor_memory_prompt_context_unavailable",
      expect.objectContaining({
        assessmentId: "assessment-1",
        userId: "user-1",
      }),
    );
  });
});

function assessmentFixture() {
  const now = new Date("2026-05-30T12:00:00.000Z");
  return {
    id: "assessment-1",
    workspaceId: "workspace-1",
    title: "Advisor context QA",
    clientLabel: "Client",
    status: "draft",
    planLevel: "readiness_report",
    sourcePlatform: "vmware",
    targetPlatform: "proxmox",
    archivedAt: null,
    createdAt: now,
    updatedAt: now,
    workspace: {
      id: "workspace-1",
      name: "Workspace",
      ownerUserId: "user-1",
      companyName: "Client",
      plan: "readiness_report",
      billingStatus: "none",
    },
    modules: [],
    infrastructureInput: null,
    costRiskAssumptions: null,
    preliminaryResult: null,
    licensingAnalysis: null,
    storageReadinessInput: null,
    storageDestinationReadiness: null,
    storageContext: null,
    storageAnalysis: null,
    clientContext: null,
    clientContextAnalysis: null,
    entitlements: [],
    evidenceFiles: [],
    additionalEvidence: [],
    storageEvidence: [],
    parsedVMs: [],
    parsedHosts: [],
    parsedDatastores: [],
    parsedSnapshots: [],
    parsedInventorySummaries: [],
    riskFindings: [],
    assessmentScore: null,
    auditEvents: [],
    aiUsageEvents: [],
    upgradeEvents: [],
    reports: [],
    unlockRequests: [],
  } as unknown as AssessmentDetail;
}
