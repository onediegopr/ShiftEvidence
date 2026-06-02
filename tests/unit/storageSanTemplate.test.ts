import { readFileSync } from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import {
  STORAGE_SAN_CSV_COLUMNS,
  STORAGE_SAN_RECORD_TYPES,
  STORAGE_SAN_SCHEMA,
} from "../../src/server/evidence/schemas/storageSanSchema";

const templateDir = path.join(process.cwd(), "public", "templates", "storage");

describe("Storage/SAN customer templates", () => {
  it("ships a CSV template with the parser-required columns", () => {
    const csv = readFileSync(path.join(templateDir, "shift-storage-san-template.csv"), "utf8");
    const header = csv.split(/\r?\n/)[0].split(",");

    expect(header).toEqual([...STORAGE_SAN_CSV_COLUMNS]);
    for (const recordType of STORAGE_SAN_RECORD_TYPES) {
      expect(csv).toContain(recordType);
    }
  });

  it("ships a JSON template with safety flags and schema metadata", () => {
    const json = JSON.parse(readFileSync(path.join(templateDir, "shift-storage-san-template.json"), "utf8"));

    expect(json.templateVersion).toBe("0.1.0");
    expect(json.owner).toBe("Shift Evidence");
    expect(json.schema).toBe(STORAGE_SAN_SCHEMA);
    expect(json.source).toMatchObject({
      owner: "Shift Evidence",
      mode: "customer-provided",
    });
    expect(json.safety).toMatchObject({
      persistentCredentialsStored: false,
      rawSecretsIncluded: false,
      networkUploadPerformed: false,
    });
    expect(json.entities).toMatchObject({
      arrays: expect.any(Array),
      pools: expect.any(Array),
      volumes: expect.any(Array),
      luns: expect.any(Array),
      datastoreMappings: expect.any(Array),
      performanceSamples: expect.any(Array),
      replication: expect.any(Array),
      snapshotPolicies: expect.any(Array),
      targetStorageCandidates: expect.any(Array),
    });
  });
});
