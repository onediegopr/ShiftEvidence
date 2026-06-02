import { ReportType } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  prisma: {
    systemSetting: {
      findUnique: vi.fn(),
    },
    userEntitlement: {
      findFirst: vi.fn(),
    },
    report: {
      count: vi.fn(),
    },
    auditEvent: {
      create: vi.fn(),
    },
  },
}));

vi.mock("../../src/lib/prisma", () => ({ prisma: mocks.prisma }));
vi.mock("../../src/server/ai/aiUsageService", () => ({
  getAdminAiUsage: vi.fn(),
}));
vi.mock("../../src/server/admin/adminOpsService", () => ({
  getAiBudgetSettings: vi.fn(),
  recordAdminAuditEvent: vi.fn(),
}));

describe("Migration Recommendation Plan entitlement behavior", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.prisma.systemSetting.findUnique.mockResolvedValue(null);
    mocks.prisma.userEntitlement.findFirst.mockResolvedValue(null);
    mocks.prisma.report.count.mockResolvedValue(0);
    mocks.prisma.auditEvent.create.mockResolvedValue({});
  });

  it("blocks blueprint PDF generation without full-report entitlement", async () => {
    const { canGeneratePdf } = await import("../../src/server/admin/runtimeSettingsService");

    const result = await canGeneratePdf({
      userId: "user-1",
      assessmentId: "assessment-1",
      workspaceId: "workspace-1",
      reportType: ReportType.blueprint,
      assessmentFullReportUnlocked: false,
    });

    expect(result.allowed).toBe(false);
    expect(result.code).toBe("pdf_blocked_by_entitlement");
  });

  it("allows blueprint PDF generation with assessment full-report unlock", async () => {
    const { canGeneratePdf } = await import("../../src/server/admin/runtimeSettingsService");

    const result = await canGeneratePdf({
      userId: "user-1",
      assessmentId: "assessment-1",
      workspaceId: "workspace-1",
      reportType: ReportType.blueprint,
      assessmentFullReportUnlocked: true,
    });

    expect(result.allowed).toBe(true);
  });

  it("allows blueprint PDF generation with blueprint plan entitlement", async () => {
    const { canGeneratePdf } = await import("../../src/server/admin/runtimeSettingsService");
    mocks.prisma.userEntitlement.findFirst.mockResolvedValue({
      status: "available",
      planKey: "blueprint",
      fullReportEnabled: false,
      maxPdfReports: null,
    });

    const result = await canGeneratePdf({
      userId: "user-1",
      assessmentId: "assessment-1",
      workspaceId: "workspace-1",
      reportType: ReportType.blueprint,
      assessmentFullReportUnlocked: false,
    });

    expect(result.allowed).toBe(true);
  });

  it("blocks blueprint downloads without entitlement", async () => {
    const { assertCanDownloadReport, OperationalBlockError } = await import("../../src/server/admin/runtimeSettingsService");

    await expect(assertCanDownloadReport({
      userId: "user-1",
      assessmentId: "assessment-1",
      workspaceId: "workspace-1",
      reportType: ReportType.blueprint,
      assessmentFullReportUnlocked: false,
    })).rejects.toBeInstanceOf(OperationalBlockError);
  });
});
