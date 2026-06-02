import { readFileSync } from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import {
  APPLICATION_DEPENDENCY_CSV_COLUMNS,
  APPLICATION_DEPENDENCY_RECORD_TYPES,
  APPLICATION_DEPENDENCY_SCHEMA,
} from "../../src/server/evidence/schemas/applicationDependencySchema";

const templateDir = path.join(process.cwd(), "public", "templates", "dependencies");

describe("Application Dependency customer templates", () => {
  it("ships CSV, JSON and README template assets", () => {
    const csv = readFileSync(path.join(templateDir, "shift-application-dependency-template.csv"), "utf8");
    const json = JSON.parse(readFileSync(path.join(templateDir, "shift-application-dependency-template.json"), "utf8"));
    const readme = readFileSync(path.join(templateDir, "README.md"), "utf8");

    expect(csv.split(/\r?\n/)[0].split(",")).toEqual([...APPLICATION_DEPENDENCY_CSV_COLUMNS]);
    for (const recordType of APPLICATION_DEPENDENCY_RECORD_TYPES) {
      expect(csv).toContain(recordType);
      expect(readme).toContain(recordType);
    }
    expect(json.templateVersion).toBe("0.1.0");
    expect(json.owner).toBe("Shift Evidence");
    expect(json.schema).toBe(APPLICATION_DEPENDENCY_SCHEMA);
    expect(json.source).toMatchObject({ owner: "Shift Evidence", mode: "customer-provided" });
    expect(json.safety).toMatchObject({
      persistentCredentialsStored: false,
      rawSecretsIncluded: false,
      networkUploadPerformed: false,
    });
    expect(readme).toContain("Do not include passwords");
    expect(readme).toContain("does not perform network discovery");
  });
});
