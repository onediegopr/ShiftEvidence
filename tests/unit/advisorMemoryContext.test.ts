import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  prisma: {
    assessmentAdvisorMemoryItem: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("../../src/lib/prisma", () => ({ prisma: mocks.prisma }));

import { buildAdvisorMemoryContext } from "../../src/server/advisor/advisorMemoryService";

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
});
