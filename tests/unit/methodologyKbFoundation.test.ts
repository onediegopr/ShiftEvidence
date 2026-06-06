import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  buildMethodologyContextForAdvisor,
  getActiveMethodologyVersion,
  getMethodologyAdminSnapshot,
  getRuleByCode,
  listMethodologyDomains,
  listMethodologyKnowledgeChunks,
  listMethodologyRules,
  searchMethodologyKnowledge,
  validateMethodologyClaims,
} from "../../src/server/methodology";

describe("methodology knowledge base foundation", () => {
  it("exposes the active v2.1 seed and the required domain/rule baseline", () => {
    const version = getActiveMethodologyVersion();
    const snapshot = getMethodologyAdminSnapshot();
    const ruleCodes = listMethodologyRules().map((rule) => rule.ruleCode);

    expect(version.status).toBe("active");
    expect(version.versionLabel).toBe("Shift Evidence Methodology Bible v2.1");
    expect(listMethodologyDomains()).toHaveLength(11);
    expect(snapshot.domainCount).toBe(11);
    expect(snapshot.topicCount).toBe(36);
    expect(snapshot.ruleCount).toBe(69);
    expect(snapshot.chunkCount).toBe(33);
    expect(snapshot.sourceDocumentCount).toBe(6);
    expect(snapshot.openNoteCount).toBe(3);
    expect(snapshot.ragState).toBe("indexado");
    expect(ruleCodes).toEqual(
      expect.arrayContaining([
        "SE-VMW-STO-001",
        "SE-VMW-SNP-001",
        "SE-VMW-RAM-001",
        "SE-VMW-BKP-001",
        "SE-VMW-BKP-004",
        "SE-SEC-IMM-001",
        "SE-PVE-CLS-001",
        "SE-PVE-STO-001",
        "SE-SAN-FAB-001",
        "SE-NET-L2-001",
        "SE-APP-DEP-001",
        "SE-TGT-CAP-001",
        "SE-EXE-RLB-001",
        "SE-GOV-SCR-001",
      ]),
    );
  });

  it("finds the backup restore knowledge chunk and its linked rules", () => {
    const result = searchMethodologyKnowledge("backup restore rvtools", {
      maxResults: 3,
      intendedUses: ["advisor", "scoring"],
    });

    expect(result.hits[0]?.chunk.id).toBe("chunk-vmware-backup-restore");
    expect(result.hits[0]?.matchedRuleCodes).toEqual(
      expect.arrayContaining(["SE-VMW-BKP-001", "SE-VMW-BKP-004"]),
    );
  });

  it("builds advisor context with governance rules and relevant chunks", () => {
    const context = buildMethodologyContextForAdvisor({
      question: "VMware backup restore and Proxmox capacity",
      assessmentContext: {
        environmentSummary: "Production migration foundation",
        missingEvidence: ["restore test fechado"],
        keyRisks: ["ventana de cutover estrecha"],
      },
      maxChunks: 4,
    });

    expect(context.version.versionLabel).toBe("Shift Evidence Methodology Bible v2.1");
    expect(context.rules.map((rule) => rule.ruleCode)).toEqual(
      expect.arrayContaining([
        "SE-GOV-SCR-001",
        "SE-GOV-CONF-001",
        "SE-GOV-EVID-001",
        "SE-VMW-BKP-001",
        "SE-VMW-BKP-004",
        "SE-PVE-CLS-001",
        "SE-PVE-STO-001",
        "SE-TGT-CAP-001",
      ]),
    );
    expect(context.chunks.map((chunk) => chunk.id)).toEqual(
      expect.arrayContaining(["chunk-vmware-backup-restore", "chunk-proxmox-target"]),
    );
    expect(context.missingEvidenceWarnings).toEqual(
      expect.arrayContaining([
        "Falta evidencia: restore test fechado",
        "Riesgo declarado: ventana de cutover estrecha",
      ]),
    );
  });

  it("flags overclaims around guaranteed migration, zero downtime and backup restore", () => {
    const blockerRule = getRuleByCode("SE-EXE-RLB-001");
    const result = validateMethodologyClaims(
      "La migracion esta garantizada sin downtime. RVTools confirma el backup restore y el target esta listo para migrar.",
      {
        activeBlockingRules: blockerRule ? [blockerRule] : [],
        missingEvidence: ["restore test fechado", "headroom de capacidad"],
      },
    );

    expect(result.advisoryOnly).toBe(true);
    expect(result.shouldBlock).toBe(true);
    expect(result.findings.map((finding) => finding.code)).toEqual(
      expect.arrayContaining([
        "overclaim_guarantee",
        "overclaim_zero_downtime",
        "overclaim_backup_restore",
        "overclaim_ready_to_migrate",
      ]),
    );
    expect(result.missingEvidenceWarnings).toEqual(
      expect.arrayContaining([
        "Falta evidencia: restore test fechado",
        "Falta evidencia: headroom de capacidad",
        "Regla activa: SE-EXE-RLB-001",
      ]),
    );
  });

  it("keeps the admin console route linked and editable through audited actions", () => {
    const routeSource = readFileSync(
      new URL("../../src/app/dashboard/admin/methodology/page.tsx", import.meta.url),
      "utf8",
    );
    const adminDashboardSource = readFileSync(
      new URL("../../src/app/dashboard/admin/page.tsx", import.meta.url),
      "utf8",
    );

    expect(routeSource).toContain("getCurrentAdminUserForConsole");
    expect(adminDashboardSource).toContain("/dashboard/admin/methodology");
    expect(routeSource).toContain("createMethodologyAdminNoteAction");
    expect(routeSource).toContain("updateMethodologyReviewStatusAction");
    expect(routeSource).toContain("Changelog persistido");
  });

  it("keeps the search and knowledge chunk APIs deterministic", () => {
    expect(listMethodologyKnowledgeChunks({ maxResults: 2 }).length).toBe(2);
    expect(searchMethodologyKnowledge("", { maxResults: 2 }).hits).toHaveLength(2);
  });
});
