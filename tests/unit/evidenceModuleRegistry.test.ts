import { describe, expect, it } from "vitest";
import { EvidenceModuleKey, EvidenceModuleStatus } from "@prisma/client";
import {
  evidenceModuleStatuses,
  getEvidenceModuleCatalog,
  getEvidenceModuleMetadata,
  warningForMissingModule,
} from "../../src/server/evidence/evidenceModuleRegistry";

describe("evidence module registry", () => {
  it("returns all expected EVIDENCE-1 modules", () => {
    const modules = getEvidenceModuleCatalog();

    expect(modules.map((module) => module.key)).toEqual([
      EvidenceModuleKey.vmware_enrichment,
      EvidenceModuleKey.proxmox_target,
      EvidenceModuleKey.backup_evidence,
      EvidenceModuleKey.storage_san,
      EvidenceModuleKey.application_dependency,
      EvidenceModuleKey.migration_plan_readiness,
    ]);
    expect(modules.every((module) => module.isOptional)).toBe(true);
    expect(modules.every((module) => module.userVisible && module.adminVisible)).toBe(true);
  });

  it("exposes common module states", () => {
    expect(evidenceModuleStatuses).toContain(EvidenceModuleStatus.not_provided);
    expect(evidenceModuleStatuses).toContain(EvidenceModuleStatus.uploaded);
    expect(evidenceModuleStatuses).toContain(EvidenceModuleStatus.parsed_with_warnings);
    expect(evidenceModuleStatuses).toContain(EvidenceModuleStatus.reviewed);
  });

  it("returns confidence warning copy without claiming validation", () => {
    const backup = getEvidenceModuleMetadata(EvidenceModuleKey.backup_evidence);

    expect(backup).not.toBeNull();
    expect(warningForMissingModule(backup!)).toContain("not validated");
  });
});
