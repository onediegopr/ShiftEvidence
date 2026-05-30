import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { resolveAdminSection } from "../../src/server/admin/adminConsoleService";

describe("admin console section fallback", () => {
  it("returns section data when the loader succeeds", async () => {
    const result = await resolveAdminSection({
      sectionKey: "summary_metrics",
      title: "Metricas principales",
      errorKey: "admin_summary_metrics_failed",
      message: "Fallback local.",
      fallback: { totalUsers: 0 },
      load: async () => ({ totalUsers: 7 }),
    });

    expect(result).toEqual({ ok: true, data: { totalUsers: 7 } });
  });

  it("returns fallback data instead of throwing when a section loader fails", async () => {
    const result = await resolveAdminSection({
      sectionKey: "assessments",
      title: "Evaluaciones",
      errorKey: "admin_assessments_failed",
      message: "No se pudo cargar la lista de evaluaciones.",
      fallback: [] as string[],
      load: async () => {
        throw new Error("PrismaClientValidationError");
      },
    });

    expect(result).toEqual({
      ok: false,
      data: [],
      sectionKey: "assessments",
      title: "Evaluaciones",
      errorKey: "admin_assessments_failed",
      message: "No se pudo cargar la lista de evaluaciones.",
    });
  });

  it("does not keep stale copy about pending Storage migrations", () => {
    const adminPage = readFileSync(
      join(process.cwd(), "src", "app", "dashboard", "admin", "page.tsx"),
      "utf8",
    );

    expect(adminPage).not.toContain("Las metricas de Storage/Ceph no estan disponibles hasta aplicar las migraciones Storage");
    expect(adminPage).not.toContain("Las métricas de Storage/Ceph no están disponibles hasta aplicar las migraciones Storage");
  });
});
