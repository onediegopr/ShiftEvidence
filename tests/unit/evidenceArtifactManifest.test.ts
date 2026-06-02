import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const manifestPath = path.join(process.cwd(), "public", "evidence-artifacts", "manifest.json");
const validModuleKeys = new Set([
  "vmware_enrichment",
  "proxmox_target",
  "backup_evidence",
  "storage_san",
  "application_dependency",
]);
const validTypes = new Set(["collector", "template", "readme", "sample", "schema"]);
const validStatuses = new Set(["beta", "controlled_beta", "internal", "deprecated", "future"]);

function readManifest() {
  return JSON.parse(fs.readFileSync(manifestPath, "utf8")) as {
    schema: string;
    generatedAt: string;
    artifacts: Array<{
      key: string;
      displayName: string;
      type: string;
      moduleKey: string;
      version: string;
      path: string;
      readmePath?: string;
      sha256: string;
      sha256Path: string;
      sizeBytes: number;
      mode: string;
      platform: string;
      language: string;
      outputSchema: string;
      status: string;
      lastReviewedAt: string;
      requirement: string;
    }>;
  };
}

function publicPathToFile(publicPath: string) {
  expect(publicPath).toMatch(/^\//);
  expect(publicPath).not.toContain("\\");
  expect(publicPath).not.toContain("C:");
  return path.join(process.cwd(), "public", publicPath.slice(1));
}

function sha256(filePath: string) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

describe("evidence artifact manifest", () => {
  it("lists versioned public artifacts with safe metadata", () => {
    const manifest = readManifest();

    expect(manifest.schema).toBe("shift-evidence.evidence-artifacts-manifest.v1");
    expect(manifest.generatedAt).toBe("2026-06-02T00:00:00.000Z");
    expect(manifest.artifacts.length).toBeGreaterThanOrEqual(12);

    for (const artifact of manifest.artifacts) {
      expect(artifact.key).toMatch(/^[a-z0-9-]+$/);
      expect(artifact.displayName).toContain("Shift Evidence");
      expect(validTypes).toContain(artifact.type);
      expect(validModuleKeys).toContain(artifact.moduleKey);
      expect(artifact.version).toBe("0.1.0");
      expect(artifact.sha256).toMatch(/^[a-f0-9]{64}$/);
      expect(artifact.sizeBytes).toBeGreaterThan(0);
      expect(["read-only", "customer-provided"]).toContain(artifact.mode);
      expect(artifact.outputSchema).toMatch(/^shift-evidence\./);
      expect(validStatuses).toContain(artifact.status);
      expect(artifact.lastReviewedAt).toBe("2026-06-02");
      expect(artifact.requirement.length).toBeGreaterThan(10);
    }
  });

  it("matches each manifest checksum to the actual file and .sha256 file", () => {
    const manifest = readManifest();

    for (const artifact of manifest.artifacts) {
      const filePath = publicPathToFile(artifact.path);
      const checksumPath = publicPathToFile(artifact.sha256Path);

      expect(fs.existsSync(filePath), artifact.path).toBe(true);
      expect(fs.existsSync(checksumPath), artifact.sha256Path).toBe(true);
      expect(sha256(filePath)).toBe(artifact.sha256);
      expect(fs.readFileSync(checksumPath, "utf8")).toContain(artifact.sha256);

      if (artifact.readmePath) {
        expect(fs.existsSync(publicPathToFile(artifact.readmePath))).toBe(true);
      }
    }
  });

  it("does not expose private filesystem paths or secrets in manifest", () => {
    const contents = fs.readFileSync(manifestPath, "utf8");

    expect(contents).not.toMatch(/C:\\Users\\/i);
    expect(contents).not.toMatch(/\/home\/[^/\s]+/i);
    expect(contents).not.toMatch(/DATABASE_URL|GEMINI_API_KEY|OPENAI_API_KEY|BETTER_AUTH_SECRET/i);
    expect(contents).not.toMatch(/eyJ[a-zA-Z0-9_-]{20,}/);
  });
});
