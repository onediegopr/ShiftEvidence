import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  }),
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
  upsertUserProfileFromSession: vi.fn(),
  ensureAssessmentOwnership: vi.fn(),
  memoryService: {
    archiveAdvisorMemoryItem: vi.fn(),
    confirmAdvisorMemoryItem: vi.fn(),
    createAdvisorMemoryItem: vi.fn(),
    getAdvisorMemoryPanelState: vi.fn(),
    rejectAdvisorMemoryItem: vi.fn(),
    resolveAdvisorMemoryItem: vi.fn(),
    supersedeAdvisorMemoryItem: vi.fn(),
  },
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("next/headers", () => ({ headers: vi.fn(async () => new Headers()) }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("../../src/lib/auth", () => ({ auth: mocks.auth }));
vi.mock("../../src/server/user/userProfileService", () => ({
  upsertUserProfileFromSession: mocks.upsertUserProfileFromSession,
}));
vi.mock("../../src/server/assessments/assessmentService", () => ({
  ensureAssessmentOwnership: mocks.ensureAssessmentOwnership,
}));
vi.mock("../../src/server/advisor/advisorMemoryService", () => mocks.memoryService);

import {
  confirmAdvisorMemoryItemAction,
  createAdvisorMemoryItemAction,
  listAdvisorMemoryItemsAction,
  resolveAdvisorMemoryItemAction,
} from "../../src/app/dashboard/assessments/[id]/advisor/memory-actions";

const memoryState = {
  enabled: true,
  available: true,
  lockedReason: null,
  planLabel: "Internal QA",
  maxItemsPerAssessment: 50,
  counts: {
    total: 1,
    active: 1,
    needsReview: 0,
    resolved: 0,
    rejected: 0,
    superseded: 0,
    archived: 0,
    decisions: 1,
    openQuestions: 0,
    nextSteps: 0,
  },
  summary: "1 decisions",
  previewItems: [],
  items: [],
};

describe("advisor memory server actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.api.getSession.mockResolvedValue({
      user: {
        id: "user-1",
        email: "user@example.com",
        name: "User",
        image: null,
      },
    });
    mocks.ensureAssessmentOwnership.mockResolvedValue({
      id: "assessment-1",
      workspaceId: "workspace-1",
    });
    mocks.memoryService.getAdvisorMemoryPanelState.mockResolvedValue(memoryState);
  });

  it("lists memory through the panel state loader", async () => {
    const result = await listAdvisorMemoryItemsAction("assessment-1");

    expect(result.ok).toBe(true);
    expect(result.ok ? result.memory.counts.total : 0).toBe(1);
    expect(mocks.memoryService.getAdvisorMemoryPanelState).toHaveBeenCalledWith({
      assessmentId: "assessment-1",
      userId: "user-1",
    });
  });

  it("confirm and resolve actions call the lifecycle service and revalidate", async () => {
    await confirmAdvisorMemoryItemAction("assessment-1", "memory-1");
    await resolveAdvisorMemoryItemAction("assessment-1", "memory-1");

    expect(mocks.memoryService.confirmAdvisorMemoryItem).toHaveBeenCalledWith("memory-1", "user-1");
    expect(mocks.memoryService.resolveAdvisorMemoryItem).toHaveBeenCalledWith("memory-1", "user-1");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/dashboard/assessments/assessment-1");
  });

  it("creates manual memory scoped to the assessment workspace", async () => {
    const result = await createAdvisorMemoryItemAction({
      assessmentId: "assessment-1",
      type: "decision",
      truthStatus: "customer_reported",
      title: "Decision",
      summary: "Client prefers low downtime.",
    });

    expect(result.ok).toBe(true);
    expect(mocks.memoryService.createAdvisorMemoryItem).toHaveBeenCalledWith({
      userId: "user-1",
      input: expect.objectContaining({
        assessmentId: "assessment-1",
        workspaceId: "workspace-1",
        type: "decision",
        sourceType: "user_message",
      }),
    });
  });

  it("returns safe errors without exposing raw stack traces", async () => {
    mocks.memoryService.confirmAdvisorMemoryItem.mockRejectedValueOnce(
      new Error("Project Memory Vault is not included in this plan."),
    );

    const result = await confirmAdvisorMemoryItemAction("assessment-1", "memory-1");

    expect(result.ok).toBe(false);
    expect(result.message).toBe("Project Memory Vault is not included in this plan.");
  });
});
