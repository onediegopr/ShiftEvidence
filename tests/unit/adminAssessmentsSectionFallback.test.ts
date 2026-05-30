import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { resolveAdminSection } from "../../src/server/admin/adminConsoleService";

function readAdminConsoleService() {
  return readFileSync(
    join(process.cwd(), "src", "server", "admin", "adminConsoleService.ts"),
    "utf8",
  );
}

describe("admin assessments section loader", () => {
  it("uses current EvidenceFile field names for additional evidence", () => {
    const service = readAdminConsoleService();

    expect(service).toContain("originalFilename: true");
    expect(service).toContain("sizeBytes: true");
    expect(service).not.toContain("filename: true");
    expect(service).not.toContain("fileSize: true");
  });

  it("does not rely on the nested workspace.ownerUser relation", () => {
    const service = readAdminConsoleService();

    expect(service).not.toContain("ownerUser:");
    expect(service).toContain("ownerUserId: true");
  });

  it("keeps assessments failures isolated to section-level fallback", async () => {
    const result = await resolveAdminSection({
      sectionKey: "assessments",
      title: "Evaluaciones",
      errorKey: "admin_assessments_failed",
      message: "La lista de evaluaciones no pudo cargarse en esta vista administrativa.",
      fallback: [] as string[],
      load: async () => {
        throw new Error("simulated optional assessments loader failure");
      },
    });

    expect(result.ok).toBe(false);
    expect(result.data).toEqual([]);
    if (!result.ok) {
      expect(result.sectionKey).toBe("assessments");
      expect(result.errorKey).toBe("admin_assessments_failed");
    }
  });

  it("does not keep stale Storage migration copy in admin page", () => {
    const adminPage = readFileSync(
      join(process.cwd(), "src", "app", "dashboard", "admin", "page.tsx"),
      "utf8",
    );

    expect(adminPage).not.toContain("Las metricas de Storage/Ceph no estan disponibles hasta aplicar las migraciones Storage");
    expect(adminPage).not.toContain("Las métricas de Storage/Ceph no están disponibles hasta aplicar las migraciones Storage");
  });
});
