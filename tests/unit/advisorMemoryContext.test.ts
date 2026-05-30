import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  prisma: {
    assessmentAdvisorMemoryItem: {
      findMany: vi.fn(),
    },
  },
  getEffectiveUserEntitlement: vi.fn(),
}));

vi.mock("../../src/lib/prisma", () => ({ prisma: mocks.prisma }));
vi.mock("../../src/server/admin/runtimeSettingsService", () => ({
  getEffectiveUserEntitlement: mocks.getEffectiveUserEntitlement,
}));

import { buildAdvisorMemoryContext } from "../../src/server/advisor/advisorMemoryService";
import { buildAdvisorMemoryPromptContext } from "../../src/server/advisor/advisorMemoryPromptContext";
import type { AssessmentDetail } from "../../src/server/assessments/assessmentService";

function item(overrides: Record<string, unknown>) {
  return {
    id: "memory-1",
    assessmentId: "assessment-1",
    workspaceId: "workspace-1",
    conversationId: null,
    sourceMessageId: null,
    createdByUserId: "user-1",
    type: "decision",
    status: "active",
    sourceType: "user_message",
    truthStatus: "customer_reported",
    title: "Decision",
    summary: "Decision summary",
    detailsJson: null,
    tagsJson: null,
    relatedEntityJson: null,
    confidence: 80,
    version: 1,
    supersedesId: null,
    resolvedAt: null,
    createdAt: new Date("2026-05-30T00:00:00Z"),
    updatedAt: new Date("2026-05-30T00:00:00Z"),
    ...overrides,
  };
}

describe("advisor memory context", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getEffectiveUserEntitlement.mockResolvedValue(null);
  });

  it("includes active labelled memory and excludes rejected/superseded/archived from context", async () => {
    mocks.prisma.assessmentAdvisorMemoryItem.findMany
      .mockResolvedValueOnce([
        item({ id: "decision-1", type: "decision", title: "Decision", truthStatus: "user_confirmed" }),
        item({ id: "question-1", type: "open_question", title: "Question", truthStatus: "missing" }),
        item({ id: "next-1", type: "next_step", title: "Next", sourceType: "advisor_message", truthStatus: "advisor_generated" }),
      ])
      .mockResolvedValueOnce([
        { status: "active", type: "decision" },
        { status: "rejected", type: "decision" },
        { status: "superseded", type: "open_question" },
        { status: "archived", type: "next_step" },
        { status: "needs_review", type: "constraint" },
      ]);

    const context = await buildAdvisorMemoryContext("assessment-1", "workspace-1");

    expect(context.decisions[0]).toMatchObject({
      id: "decision-1",
      sourceType: "user_message",
      truthStatus: "user_confirmed",
    });
    expect(context.openQuestions[0].truthStatus).toBe("missing");
    expect(context.nextSteps[0].sourceType).toBe("advisor_message");
    expect(context.excludedCounts).toEqual({
      rejected: 1,
      superseded: 1,
      archived: 1,
      needsReview: 1,
    });
    expect(mocks.prisma.assessmentAdvisorMemoryItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          assessmentId: "assessment-1",
          workspaceId: "workspace-1",
          status: "active",
        }),
      }),
    );
  });

  it("builds bounded prompt memory with active decisions, questions and labels only", async () => {
    mocks.prisma.assessmentAdvisorMemoryItem.findMany
      .mockResolvedValueOnce([
        item({
          id: "decision-1",
          type: "decision",
          title: "Use Proxmox first",
          summary: "Customer confirmed Proxmox as the target.",
          truthStatus: "user_confirmed",
        }),
        item({
          id: "question-1",
          type: "open_question",
          title: "Who owns backup validation?",
          summary: "Backup owner is still missing.",
          truthStatus: "missing",
        }),
        item({
          id: "constraint-1",
          type: "constraint",
          title: "No weekend cutover",
          summary: "Customer reported a no-weekend operations constraint.",
          truthStatus: "customer_reported",
        }),
      ])
      .mockResolvedValueOnce([
        { status: "active", type: "decision" },
        { status: "rejected", type: "decision" },
        { status: "superseded", type: "open_question" },
        { status: "archived", type: "next_step" },
        { status: "needs_review", type: "constraint" },
      ])
      .mockResolvedValueOnce([
        item({
          id: "other-1",
          type: "customer_preference",
          title: "Preference",
          summary: "Customer prefers phased execution.",
          sourceType: "manual_admin",
          truthStatus: "customer_reported",
        }),
      ]);

    const context = await buildAdvisorMemoryPromptContext({
      userId: "user-1",
      assessment: assessmentFixture(),
    });

    expect(context.included).toBe(true);
    expect(context.decisions[0]).toMatchObject({
      id: "decision-1",
      truthStatus: "user_confirmed",
      sourceType: "user_message",
    });
    expect(context.openQuestions[0].truthStatus).toBe("missing");
    expect(context.constraints[0].truthStatus).toBe("customer_reported");
    expect(context.other[0]).toMatchObject({
      type: "customer_preference",
      sourceType: "manual_admin",
    });
    expect(mocks.prisma.assessmentAdvisorMemoryItem.findMany).toHaveBeenLastCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          assessmentId: "assessment-1",
          workspaceId: "workspace-1",
          status: "active",
          type: { notIn: expect.arrayContaining(["decision", "open_question"]) },
        }),
      }),
    );
  });

  it("respects prompt char limits and redacts sensitive memory text", async () => {
    const long = "Long memory detail ".repeat(80);
    mocks.prisma.assessmentAdvisorMemoryItem.findMany
      .mockResolvedValueOnce(
        ["decision", "open_question", "constraint", "risk_interpretation", "next_step"]
          .flatMap((type) =>
            Array.from({ length: 4 }, (_, index) =>
              item({
                id: `${type}-${index}`,
                type,
                title: `${type} ${index} api_key=secret-value`,
                summary: `${long} C:\\Users\\diego\\private\\secret.txt`,
              }),
            ),
          ),
      )
      .mockResolvedValueOnce([{ status: "active", type: "decision" }])
      .mockResolvedValueOnce([]);

    const context = await buildAdvisorMemoryPromptContext({
      userId: "user-1",
      assessment: assessmentFixture({ planLevel: "readiness_report" }),
    });
    const serialized = JSON.stringify(context);

    expect(context.contextChars).toBeLessThanOrEqual(context.limits.maxChars);
    expect(context.itemCount).toBeGreaterThan(0);
    expect(serialized).not.toContain("secret-value");
    expect(serialized).not.toContain("C:\\Users\\diego\\private\\secret.txt");
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
