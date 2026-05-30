import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  ensureAssessmentOwnership: vi.fn(),
  getEffectiveUserEntitlement: vi.fn(),
  prisma: {
    assessmentAdvisorMemoryItem: {
      count: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    auditEvent: {
      create: vi.fn(),
    },
  },
}));

vi.mock("../../src/server/assessments/assessmentService", () => ({
  ensureAssessmentOwnership: mocks.ensureAssessmentOwnership,
}));

vi.mock("../../src/server/admin/runtimeSettingsService", () => ({
  getEffectiveUserEntitlement: mocks.getEffectiveUserEntitlement,
}));

vi.mock("../../src/lib/prisma", () => ({ prisma: mocks.prisma }));

import {
  confirmAdvisorMemoryItem,
  createAdvisorMemoryItem,
  supersedeAdvisorMemoryItem,
} from "../../src/server/advisor/advisorMemoryService";
import type { AdvisorMemoryCreateInput } from "../../src/server/advisor/advisorMemoryTypes";

const assessment = {
  id: "assessment-1",
  workspaceId: "workspace-1",
  planLevel: "free",
  workspace: { plan: "free" },
};

const baseInput: AdvisorMemoryCreateInput = {
  assessmentId: "assessment-1",
  workspaceId: "workspace-1",
  type: "decision",
  sourceType: "user_message",
  truthStatus: "customer_reported",
  title: "Decision",
  summary: "User accepted broad licensing estimate because password=secret was unavailable.",
  confidence: 80,
};

function memoryRecord(overrides: Record<string, unknown> = {}) {
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
    summary: "User accepted broad licensing estimate because password=[REDACTED] was unavailable.",
    detailsJson: null,
    tagsJson: [],
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

describe("advisor memory service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.ensureAssessmentOwnership.mockResolvedValue(assessment);
    mocks.getEffectiveUserEntitlement.mockResolvedValue({ planKey: "internal_qa" });
    mocks.prisma.assessmentAdvisorMemoryItem.count.mockResolvedValue(0);
    mocks.prisma.assessmentAdvisorMemoryItem.create.mockResolvedValue(memoryRecord());
    mocks.prisma.assessmentAdvisorMemoryItem.findUnique.mockResolvedValue(memoryRecord({ status: "needs_review" }));
    mocks.prisma.assessmentAdvisorMemoryItem.update.mockResolvedValue(memoryRecord({ status: "active" }));
    mocks.prisma.auditEvent.create.mockResolvedValue({});
  });

  it("creates a sanitized memory item and safe audit metadata", async () => {
    const created = await createAdvisorMemoryItem({
      userId: "user-1",
      input: baseInput,
    });

    expect(created.status).toBe("active");
    expect(mocks.prisma.assessmentAdvisorMemoryItem.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        assessmentId: "assessment-1",
        workspaceId: "workspace-1",
        summary: expect.stringContaining("password=[REDACTED]"),
        status: "active",
      }),
    });
    expect(mocks.prisma.auditEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        eventType: "advisor_memory_item_created",
        metadataJson: expect.not.objectContaining({ summary: expect.any(String) }),
      }),
    });
  });

  it("rejects cross-workspace create attempts", async () => {
    await expect(
      createAdvisorMemoryItem({
        userId: "user-1",
        input: { ...baseInput, workspaceId: "other-workspace" },
      }),
    ).rejects.toThrow("Advisor memory workspace mismatch.");
  });

  it("enforces plan item limits", async () => {
    mocks.prisma.assessmentAdvisorMemoryItem.count.mockResolvedValueOnce(50).mockResolvedValueOnce(0);

    await expect(
      createAdvisorMemoryItem({
        userId: "user-1",
        input: baseInput,
      }),
    ).rejects.toThrow("Project Memory Vault item limit reached");
  });

  it("confirms a needs-review item with ownership and audit event", async () => {
    const confirmed = await confirmAdvisorMemoryItem("memory-1", "user-1");

    expect(confirmed.status).toBe("active");
    expect(mocks.ensureAssessmentOwnership).toHaveBeenCalledWith({
      userId: "user-1",
      assessmentId: "assessment-1",
    });
    expect(mocks.prisma.assessmentAdvisorMemoryItem.update).toHaveBeenCalledWith({
      where: { id: "memory-1" },
      data: { status: "active", resolvedAt: undefined },
    });
    expect(mocks.prisma.auditEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ eventType: "advisor_memory_item_confirmed" }),
    });
  });

  it("supersedes an active item and links the replacement", async () => {
    mocks.prisma.assessmentAdvisorMemoryItem.findUnique.mockResolvedValueOnce(
      memoryRecord({ id: "old-memory", status: "active", version: 2 }),
    );
    mocks.prisma.assessmentAdvisorMemoryItem.create.mockResolvedValueOnce(
      memoryRecord({ id: "new-memory", version: 1 }),
    );
    mocks.prisma.assessmentAdvisorMemoryItem.update
      .mockResolvedValueOnce(memoryRecord({ id: "old-memory", status: "superseded", version: 2 }))
      .mockResolvedValueOnce(memoryRecord({ id: "new-memory", supersedesId: "old-memory", version: 3 }));

    const result = await supersedeAdvisorMemoryItem({
      oldId: "old-memory",
      userId: "user-1",
      newInput: {
        ...baseInput,
        title: "Updated decision",
        summary: "Updated customer-reported decision.",
      },
    });

    expect(result.superseded.status).toBe("superseded");
    expect(result.replacement).toMatchObject({
      id: "new-memory",
      supersedesId: "old-memory",
      version: 3,
    });
    expect(mocks.prisma.auditEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ eventType: "advisor_memory_item_superseded" }),
    });
  });
});
