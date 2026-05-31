import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AssessmentDetail } from "../../src/server/assessments/assessmentService";

const mocks = vi.hoisted(() => ({
  prisma: {
    assessmentAdvisorMemoryItem: {
      findMany: vi.fn(),
    },
  },
  getEffectiveUserEntitlement: vi.fn(),
  createAdvisorMemoryItem: vi.fn(),
}));

vi.mock("../../src/lib/prisma", () => ({ prisma: mocks.prisma }));
vi.mock("../../src/server/admin/runtimeSettingsService", () => ({
  getEffectiveUserEntitlement: mocks.getEffectiveUserEntitlement,
}));
vi.mock("../../src/server/advisor/advisorMemoryService", () => ({
  createAdvisorMemoryItem: mocks.createAdvisorMemoryItem,
}));

import { runAdvisorMemoryAutoExtraction } from "../../src/server/advisor/advisorMemoryExtractionService";

describe("advisor memory auto extraction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getEffectiveUserEntitlement.mockResolvedValue({ planKey: "blueprint" });
    mocks.prisma.assessmentAdvisorMemoryItem.findMany.mockResolvedValue([]);
    mocks.createAdvisorMemoryItem.mockImplementation(async ({ input }) => ({
      id: `created-${input.type}`,
      ...input,
      details: null,
      tags: null,
      relatedEntity: null,
      version: 1,
      resolvedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
  });

  it("auto-creates needs_review candidates with safe labels", async () => {
    const result = await runAdvisorMemoryAutoExtraction({
      userId: "user-1",
      assessment: assessmentFixture(),
      conversationId: "conversation-1",
      userMessage: {
        id: "user-message-1",
        content: "Lo damos por valido y hay que subir RVTools antes de avanzar.",
        status: "completed",
      },
      assistantMessage: {
        id: "assistant-message-1",
        content: "Next Actions:\n- Validate backup ownership.",
        status: "completed",
      },
    });

    expect(result.status).toBe("created");
    expect(result.generated).toBeGreaterThan(0);
    expect(mocks.createAdvisorMemoryItem).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        input: expect.objectContaining({
          status: "needs_review",
          sourceMessageId: "user-message-1",
          sourceType: "user_message",
          details: expect.objectContaining({ autoExtracted: true }),
        }),
      }),
    );
  });

  it("respects disabled plan and does not create memory", async () => {
    mocks.getEffectiveUserEntitlement.mockResolvedValue({ planKey: "starter" });

    const result = await runAdvisorMemoryAutoExtraction({
      userId: "user-1",
      assessment: assessmentFixture({ planLevel: "starter", workspace: { plan: "starter" } }),
      conversationId: "conversation-1",
      userMessage: {
        id: "user-message-1",
        content: "Hay que subir RVTools.",
        status: "completed",
      },
    });

    expect(result).toMatchObject({
      status: "disabled",
      generated: 0,
    });
    expect(mocks.createAdvisorMemoryItem).not.toHaveBeenCalled();
  });

  it("dedupes same source message before creating", async () => {
    mocks.prisma.assessmentAdvisorMemoryItem.findMany.mockResolvedValue([
      {
        id: "memory-1",
        type: "next_step",
        title: "Hay que subir RVTools",
        summary: "Hay que subir RVTools.",
        sourceMessageId: "user-message-1",
      },
    ]);

    const result = await runAdvisorMemoryAutoExtraction({
      userId: "user-1",
      assessment: assessmentFixture(),
      conversationId: "conversation-1",
      userMessage: {
        id: "user-message-1",
        content: "Hay que subir RVTools.",
        status: "completed",
      },
    });

    expect(result.generated).toBe(0);
    expect(result.skipped).toBe(1);
    expect(result.reasons).toContain("duplicate");
    expect(mocks.createAdvisorMemoryItem).not.toHaveBeenCalled();
  });

  it("reports failed without throwing if memory lookup fails", async () => {
    mocks.prisma.assessmentAdvisorMemoryItem.findMany.mockRejectedValue(new Error("table missing"));

    const result = await runAdvisorMemoryAutoExtraction({
      userId: "user-1",
      assessment: assessmentFixture(),
      conversationId: "conversation-1",
      userMessage: {
        id: "user-message-1",
        content: "Hay que subir RVTools.",
        status: "completed",
      },
    });

    expect(result.status).toBe("failed");
    expect(mocks.createAdvisorMemoryItem).not.toHaveBeenCalled();
  });
});

function assessmentFixture(overrides: Record<string, unknown> = {}) {
  return {
    id: "assessment-1",
    workspaceId: "workspace-1",
    planLevel: "blueprint",
    workspace: {
      id: "workspace-1",
      plan: "blueprint",
    },
    ...overrides,
  } as unknown as AssessmentDetail;
}
