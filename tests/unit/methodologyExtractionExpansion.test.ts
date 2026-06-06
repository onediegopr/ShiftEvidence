import { describe, expect, it } from "vitest";
import {
  buildMethodologyAdvisorContext,
  buildMethodologyReportContext,
  getMethodologyAdminSnapshot,
  listMethodologyKnowledgeChunks,
  listMethodologyRules,
  searchMethodologyKnowledge,
  searchMethodologyRules,
  validateMethodologyClaims,
} from "../../src/server/methodology";

const RULE_CODE_PATTERN = /^SE-[A-Z]{3}-[A-Z]{3}-\d{3}$/;
const LEGACY_RULE_CODES = new Set(["SE-GOV-CONF-001", "SE-GOV-EVID-001", "SE-NET-L2-001"]);
const VALID_SEVERITIES = new Set(["blocking", "critical", "high", "medium", "low", "info"]);
const VALID_INTENDED_USES = new Set(["advisor", "scoring", "report", "admin", "sales", "all"]);

describe("methodology extraction expansion", () => {
  it("expands the active rule catalog without duplicates and keeps code patterns stable", () => {
    const rules = listMethodologyRules();
    const ruleCodes = rules.map((rule) => rule.ruleCode);
    const uniqueCodes = new Set(ruleCodes);

    expect(rules).toHaveLength(69);
    expect(uniqueCodes.size).toBe(ruleCodes.length);
    expect(ruleCodes.every((code) => RULE_CODE_PATTERN.test(code) || LEGACY_RULE_CODES.has(code))).toBe(true);
    expect(rules.every((rule) => VALID_SEVERITIES.has(rule.severity))).toBe(true);
    expect(getMethodologyAdminSnapshot().ruleCount).toBe(69);
  });

  it("keeps the expanded chunk catalog valid and search-friendly", () => {
    const chunks = listMethodologyKnowledgeChunks();

    expect(chunks).toHaveLength(33);
    expect(chunks.every((chunk) => VALID_INTENDED_USES.has(chunk.intendedUse))).toBe(true);

    const backupSearch = searchMethodologyKnowledge("backup restore", {
      tags: ["backup"],
      maxResults: 3,
    });
    expect(backupSearch.hits[0]?.chunk.chunkKey ?? "").toContain("backup");

    const targetSearch = searchMethodologyKnowledge("target readiness", {
      ruleCodes: ["SE-TGT-SYN-001"],
      maxResults: 3,
    });
    expect(targetSearch.hits.some((hit) => hit.matchedRuleCodes.includes("SE-TGT-SYN-001"))).toBe(true);
  });

  it("supports exact rule code search plus domain and severity ranking", () => {
    const exact = searchMethodologyRules("SE-VMW-CPU-001", { maxResults: 3 });
    expect(exact.hits[0]?.rule.ruleCode).toBe("SE-VMW-CPU-001");

    const domainSearch = searchMethodologyRules("network", {
      domainIds: ["domain-networking"],
      maxResults: 5,
    });
    expect(domainSearch.hits.length).toBeGreaterThan(0);
    expect(domainSearch.hits.every((hit) => hit.rule.domainId === "domain-networking")).toBe(true);

    const severitySearch = searchMethodologyRules("rollback", {
      severities: ["blocking", "critical"],
      maxResults: 5,
    });
    expect(severitySearch.hits.every((hit) => ["blocking", "critical"].includes(hit.rule.severity))).toBe(true);
  });

  it("builds advisor and report bridge context with safe defaults and feature-flag awareness", () => {
    const advisorBridge = buildMethodologyAdvisorContext({
      question: "VMware backup restore, Proxmox capacity y rollback",
      assessmentSummary: "Escenario expansion methodology",
      missingEvidence: ["restore proof fechado"],
      activeBlockers: ["ventana de cutover estrecha"],
      maxRules: 6,
      maxChunks: 4,
    });

    expect(advisorBridge.methodologyVersion.versionLabel).toBe("Shift Evidence Methodology Bible v2.1");
    expect(advisorBridge.relevantRules.length).toBeGreaterThan(0);
    expect(advisorBridge.relevantChunks.length).toBeGreaterThan(0);
    expect(advisorBridge.safetyCaveats.some((item) => item.includes("feature flag"))).toBe(true);
    expect(advisorBridge.forbiddenClaims).toEqual(expect.arrayContaining(["zero downtime", "replaces consultant"]));
    expect(advisorBridge.suggestedFollowUpQuestions.length).toBeGreaterThan(0);
    expect(advisorBridge.enabled).toBe(false);

    const reportBridge = buildMethodologyReportContext({
      assessmentSummary: "PDF bridge preview",
      missingEvidence: ["restore proof fechado"],
      activeBlockers: ["ventana de cutover estrecha"],
      maxRules: 6,
      maxChunks: 4,
    });

    expect(reportBridge.methodologyNotes.length).toBeGreaterThan(0);
    expect(reportBridge.safeClaims.length).toBeGreaterThan(0);
    expect(reportBridge.ruleTraceExamples.length).toBeGreaterThan(0);
    expect(reportBridge.evidenceConfidenceLanguage).toContain("Confidence");
  });

  it("extends claim safety with unsafe wording suggestions and methodology concepts", () => {
    const result = validateMethodologyClaims(
      "The migration is guaranteed, zero downtime, production safe, fully validated, backup verified without restore evidence, dependencies mapped without dependency evidence, Proxmox target ready without target evidence, performance validated without performance data, automated migration execution, replaces consultant, and RVTools validates backup and dependencies.",
      {
        missingEvidence: ["restore proof fechado"],
      },
    );

    const findingCodes = result.findings.map((finding) => finding.code);
    expect(result.advisoryOnly).toBe(true);
    expect(result.shouldBlock).toBe(true);
    expect(findingCodes).toEqual(
      expect.arrayContaining([
        "overclaim_guarantee",
        "overclaim_zero_downtime",
        "overclaim_production_safe",
        "overclaim_fully_validated",
        "overclaim_backup_without_restore",
        "overclaim_dependencies_without_proof",
        "overclaim_target_ready_without_target_evidence",
        "overclaim_performance_without_data",
        "overclaim_automated_migration",
        "overclaim_replaces_consultant",
        "overclaim_rvtools_generalized",
      ]),
    );
    expect(result.findings.some((finding) => finding.safeAlternative.length > 0)).toBe(true);
    expect(result.findings.some((finding) => finding.relatedMethodologyConcept.length > 0)).toBe(true);
  });
});
