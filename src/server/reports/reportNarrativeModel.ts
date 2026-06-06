import type { ReportDesignSystemType } from "./reportDesignSystem";
import type { MigrationRecommendationPlan } from "./migrationPlanTypes";
import {
  buildBackupMissingNarrative,
  buildCombinedScoreNarrative,
  buildDependencyMissingNarrative,
  buildMissingEvidenceNarrative,
  buildPerformanceMissingNarrative,
  buildPilotFirstNarrative,
  buildPremiumNarrative,
  buildProxmoxTargetNarrative,
  buildRemediationFirstNarrative,
} from "./reportNarrativeCopy";
import type { ReportPreviewData } from "./reportPreviewService";

export type ReportDecisionStatus = "Go" | "Conditional Go" | "Pilot First" | "Remediate First" | "No-Go / Hold";

export type ReportEvidenceStatus = "complete" | "partial" | "missing" | "not_provided" | "not_applicable";

export type ReportNarrativeEvidenceCoverage = {
  rvtools: ReportEvidenceStatus;
  questionnaire: ReportEvidenceStatus;
  backup: ReportEvidenceStatus;
  proxmoxTarget: ReportEvidenceStatus;
  network: ReportEvidenceStatus;
  cmdb: ReportEvidenceStatus;
  performance: ReportEvidenceStatus;
};

export type ReportNarrativeRisk = {
  title: string;
  area: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  evidence: string;
  whyItMatters: string;
  recommendation: string;
  narrative: string;
};

export type ReportNarrativeMissingEvidence = {
  area: string;
  status: Exclude<ReportEvidenceStatus, "complete" | "not_applicable">;
  impact: string;
  recommendation: string;
  narrative: string;
};

export type ReportNarrativeWave = {
  label: string;
  stage: "pilot" | "wave_1" | "wave_2" | "wave_3" | "hold" | "retire_rebuild";
  riskBand: "low" | "medium" | "high" | "critical" | "hold";
  rationale: string;
  candidateBasis: string;
};

export type ReportNarrativeVmRiskDistribution = {
  critical: number;
  high: number;
  medium: number;
  low: number;
  info: number;
  totalAnalyzed: number;
};

export type ReportNarrativeModel = {
  reportType: ReportDesignSystemType;
  clientName: string | null;
  assessmentName: string;
  generatedAt: string;
  readinessScore: number | null;
  confidenceScore: number | null;
  decisionStatus: ReportDecisionStatus;
  decisionNarrative: string;
  evidenceCoverage: ReportNarrativeEvidenceCoverage;
  topRisks: ReportNarrativeRisk[];
  missingEvidence: ReportNarrativeMissingEvidence[];
  vmRiskDistribution: ReportNarrativeVmRiskDistribution;
  migrationWaves: ReportNarrativeWave[];
  pilotCandidates: string[];
  holdItems: string[];
  requiredValidations: string[];
  nextSteps: string[];
  assumptions: string[];
  methodologyNotes: string[];
};

const BACKUP_PATTERNS = ["backup", "veeam", "restore", "rpo", "rto"];
const PROXMOX_PATTERNS = ["proxmox", "target cluster", "target sizing", "target node", "target readiness", "landing zone"];
const NETWORK_PATTERNS = ["network", "vlan", "firewall", "ipam", "netbox", "switch", "subnet"];
const CMDB_PATTERNS = ["cmdb", "dependency", "application relationship", "application owner", "migration group", "service chain"];
const PERFORMANCE_PATTERNS = ["performance", "utilization", "throughput", "latency", "history", "cpu history", "memory history"];

function uniq(values: Array<string | null | undefined>) {
  return [...new Set(values.map((value) => value?.trim()).filter((value): value is string => Boolean(value)))];
}

function toSentence(value: string) {
  const text = value.trim().replace(/\s+/g, " ");
  if (!text) {
    return "";
  }
  return /[.!?]$/.test(text) ? text : `${text}.`;
}

function listMentions(values: string[], patterns: string[]) {
  const haystack = values.map((value) => value.toLowerCase());
  return haystack.some((value) => patterns.some((pattern) => value.includes(pattern)));
}

function derivePreviewReportType(preview: ReportPreviewData): ReportDesignSystemType {
  switch (preview.planLabel) {
    case "Starter Readiness":
      return "starter_readiness_report";
    case "Professional Assessment":
      return "professional_assessment_report";
    case "Migration Blueprint":
      return "migration_blueprint_report";
    case "Partner":
      return "msp_white_label_report";
    default:
      return preview.planRank >= 2 ? "public_sample_report" : "deep_technical_report";
  }
}

function derivedPlanReportType(plan: MigrationRecommendationPlan): ReportDesignSystemType {
  if (plan.planLevel === "advanced_plan") {
    return "migration_blueprint_report";
  }

  if (plan.planLevel === "technical_plan") {
    return "professional_assessment_report";
  }

  if (plan.planLevel === "preliminary_plan") {
    return "starter_readiness_report";
  }

  return "deep_technical_report";
}

function normalizeDecisionStatus(
  value: string | null | undefined,
  scores: { readiness: number | null; confidence: number | null; criticalSignals: number },
): ReportDecisionStatus {
  const normalized = value?.toLowerCase() ?? "";

  if (normalized.includes("no-go") || normalized.includes("hold")) {
    return "No-Go / Hold";
  }
  if (normalized.includes("remediate")) {
    return "Remediate First";
  }
  if (normalized.includes("pilot")) {
    return "Pilot First";
  }
  if (normalized.includes("conditional")) {
    return "Conditional Go";
  }
  if (normalized === "go" || normalized.startsWith("go ")) {
    return "Go";
  }

  if (scores.criticalSignals > 0 || (scores.readiness ?? 0) < 35) {
    return "Remediate First";
  }
  if ((scores.readiness ?? 0) >= 80 && (scores.confidence ?? 0) >= 75) {
    return "Conditional Go";
  }
  return "Pilot First";
}

function buildDecisionNarrative(
  decisionStatus: ReportDecisionStatus,
  mainBlocker: string,
  nextAction: string,
  readinessScore: number | null,
  confidenceScore: number | null,
) {
  if (decisionStatus === "Remediate First" || decisionStatus === "No-Go / Hold") {
    return [
      buildRemediationFirstNarrative(mainBlocker, nextAction),
      buildCombinedScoreNarrative({ readinessScore, confidenceScore }),
    ].join(" ");
  }

  if (decisionStatus === "Pilot First") {
    return [
      buildPilotFirstNarrative(mainBlocker, nextAction),
      buildCombinedScoreNarrative({ readinessScore, confidenceScore }),
    ].join(" ");
  }

  if (decisionStatus === "Go") {
    return [
      "Decision: Go. Current evidence supports a controlled execution path, but only with maintained validation discipline and explicit rollback criteria.",
      buildCombinedScoreNarrative({ readinessScore, confidenceScore }),
    ].join(" ");
  }

  return [
    `Decision: ${decisionStatus}. Proceed only after the current leading blocker is addressed: ${toSentence(mainBlocker)}`,
    buildCombinedScoreNarrative({ readinessScore, confidenceScore }),
    toSentence(nextAction),
  ].join(" ");
}

function getEvidenceCoverageFromPreview(preview: ReportPreviewData): ReportNarrativeEvidenceCoverage {
  const received = [...preview.evidenceOverview.received];
  const missing = [
    ...preview.evidenceOverview.missing,
    ...preview.missingEvidence,
    ...preview.migrationContext.missingContext,
  ];

  const rvtools: ReportEvidenceStatus =
    preview.evidenceOverview.sourceIndicator === "parsed" || preview.evidenceOverview.sourceIndicator === "mixed"
      ? "complete"
      : preview.evidenceOverview.sourceIndicator === "manual"
        ? "partial"
        : "not_provided";

  const questionnaire: ReportEvidenceStatus =
    preview.migrationContext.coverage.status === "strong"
      ? "complete"
      : preview.migrationContext.coverage.status === "partial" || preview.migrationContext.coverage.status === "limited"
        ? "partial"
        : "not_provided";

  const backup: ReportEvidenceStatus = listMentions(received, BACKUP_PATTERNS)
    ? "complete"
    : listMentions(missing, BACKUP_PATTERNS)
      ? "missing"
      : "not_provided";

  const proxmoxTarget: ReportEvidenceStatus = listMentions(received, PROXMOX_PATTERNS)
    ? "complete"
    : preview.storageDestinationReadiness.included
      ? "partial"
      : listMentions(missing, PROXMOX_PATTERNS)
        ? "missing"
        : "not_provided";

  const network: ReportEvidenceStatus = listMentions(received, NETWORK_PATTERNS)
    ? "complete"
    : listMentions(missing, NETWORK_PATTERNS)
      ? "missing"
      : preview.storageDestinationReadiness.included
        ? "partial"
        : "not_provided";

  const cmdb: ReportEvidenceStatus = listMentions(received, CMDB_PATTERNS)
    ? "complete"
    : listMentions(missing, CMDB_PATTERNS)
      ? "missing"
      : "not_provided";

  const performance: ReportEvidenceStatus = listMentions(received, PERFORMANCE_PATTERNS)
    ? "complete"
    : listMentions(missing, PERFORMANCE_PATTERNS)
      ? "missing"
      : "not_provided";

  return {
    rvtools,
    questionnaire,
    backup,
    proxmoxTarget,
    network,
    cmdb,
    performance,
  };
}

function getEvidenceCoverageFromPlan(plan: MigrationRecommendationPlan): ReportNarrativeEvidenceCoverage {
  const coverage = plan.evidenceSummary.evidenceCoverage;
  return {
    rvtools: coverage.baseInventory ? "complete" : "missing",
    questionnaire: coverage.clientContext ? "partial" : "not_provided",
    backup: coverage.backupEvidence ? "complete" : "missing",
    proxmoxTarget: coverage.proxmoxTarget ? "complete" : "missing",
    network: coverage.storageSanEvidence ? "partial" : "not_provided",
    cmdb: coverage.applicationDependencies ? "complete" : "missing",
    performance: "not_provided",
  };
}

function mapFindingSeverity(value: string | null | undefined): ReportNarrativeRisk["severity"] {
  switch (value) {
    case "critical":
    case "high":
    case "medium":
    case "low":
    case "info":
      return value;
    default:
      return "medium";
  }
}

function mapPlanGateSeverity(value: string | null | undefined): ReportNarrativeRisk["severity"] {
  switch (value) {
    case "critical":
    case "high":
    case "medium":
    case "low":
    case "info":
      return value;
    default:
      return "medium";
  }
}

function buildTopRisksFromPreview(preview: ReportPreviewData): ReportNarrativeRisk[] {
  if (preview.topFindings.length > 0) {
    return preview.topFindings.slice(0, 8).map((finding) => {
      const evidence = finding.description || "Current assessment evidence produced this signal.";
      const whyItMatters = finding.recommendation
        ? `This issue can affect migration safety, sequencing or target fit until ${finding.recommendation.toLowerCase()}`
        : "This issue can affect migration safety, sequencing or target fit until validated.";
      const recommendation = finding.recommendation || "Validate the finding before approving production migration waves.";

      return {
        title: finding.title,
        area: finding.category,
        severity: mapFindingSeverity(finding.severity),
        evidence,
        whyItMatters,
        recommendation,
        narrative: buildPremiumNarrative({
          finding: finding.title,
          evidence,
          whyItMatters,
          recommendation,
          ownerAction: "Assign an infrastructure or application owner to validate and close this blocker before execution.",
        }),
      };
    });
  }

  return preview.missingEvidence.slice(0, 4).map((item) => ({
    title: item,
    area: "missing_evidence",
    severity: "medium",
    evidence: "The current preview does not contain validated evidence for this area.",
    whyItMatters: "Missing evidence lowers confidence and can change migration sequencing or target assumptions.",
    recommendation: "Collect and validate the missing evidence before treating the report as production-ready.",
    narrative: buildMissingEvidenceNarrative({
      area: item,
      impact: "Confidence is reduced until this evidence is supplied and checked.",
      recommendation: "Collect this evidence before production wave approval.",
    }),
  }));
}

function buildTopRisksFromPlan(plan: MigrationRecommendationPlan): ReportNarrativeRisk[] {
  const gateRisks = plan.gates
    .filter((gate) => gate.status === "fail" || gate.status === "warning" || gate.status === "insufficient_evidence")
    .slice(0, 8)
    .map((gate) => ({
      title: gate.key,
      area: gate.evidenceSource,
      severity: mapPlanGateSeverity(gate.severity),
      evidence: gate.explanation,
      whyItMatters: gate.blocksProductionWave
        ? "This gate can block production migration waves until the condition is resolved."
        : "This gate limits how confidently the current wave strategy can be approved.",
      recommendation: gate.recommendation,
      narrative: buildPremiumNarrative({
        finding: `${gate.key} is currently ${gate.status.replace(/_/g, " ")}.`,
        evidence: gate.explanation,
        whyItMatters: gate.blocksProductionWave
          ? "The migration plan cannot safely approve production movement while this gate remains unresolved."
          : "The migration plan remains conditional while this gate is unresolved.",
        recommendation: gate.recommendation,
        ownerAction: "Resolve or validate this gate before authorizing downstream migration waves.",
      }),
    }));

  if (gateRisks.length > 0) {
    return gateRisks;
  }

  return plan.evidenceSummary.blockers.slice(0, 4).map((blocker) => ({
    title: blocker,
    area: "migration_plan",
    severity: "medium",
    evidence: blocker,
    whyItMatters: "The standalone plan remains constrained until this blocker is closed.",
    recommendation: "Resolve the blocker before expanding beyond pilot scope.",
    narrative: buildPremiumNarrative({
      finding: blocker,
      evidence: blocker,
      whyItMatters: "This condition limits the defensibility of later migration waves.",
      recommendation: "Resolve the blocker before advancing the plan.",
      ownerAction: "Assign an owner and expected validation date.",
    }),
  }));
}

function buildMissingEvidenceFromCoverage(coverage: ReportNarrativeEvidenceCoverage) {
  const missingItems: ReportNarrativeMissingEvidence[] = [];

  const addMissing = (
    area: string,
    status: Exclude<ReportEvidenceStatus, "complete" | "not_applicable">,
    impact: string,
    recommendation: string,
    narrative: string,
  ) => {
    missingItems.push({ area, status, impact, recommendation, narrative });
  };

  if (coverage.backup !== "complete") {
    addMissing(
      "backup evidence",
      coverage.backup === "partial" ? "partial" : coverage.backup === "not_provided" ? "not_provided" : "missing",
      "Rollback readiness, restore confidence and continuity posture remain unverified for critical workloads.",
      "Validate backup jobs, retention and restore points before approving production waves.",
      buildBackupMissingNarrative(),
    );
  }

  if (coverage.proxmoxTarget !== "complete") {
    addMissing(
      "Proxmox target readiness",
      coverage.proxmoxTarget === "partial" ? "partial" : coverage.proxmoxTarget === "not_provided" ? "not_provided" : "missing",
      "Target capacity, storage fit and HA assumptions may still hide landing-zone blockers.",
      "Supply target-node, storage and HA evidence before treating sequencing as production-ready.",
      buildProxmoxTargetNarrative(coverage.proxmoxTarget),
    );
  }

  if (coverage.cmdb !== "complete") {
    addMissing(
      "application dependency evidence",
      coverage.cmdb === "partial" ? "partial" : coverage.cmdb === "not_provided" ? "not_provided" : "missing",
      "Wave sequencing may still hide service coupling, business windows or application-level blockers.",
      "Collect dependency and ownership evidence before scheduling shared or business-critical systems.",
      buildDependencyMissingNarrative(),
    );
  }

  if (coverage.performance !== "complete") {
    addMissing(
      "performance history",
      coverage.performance === "partial" ? "partial" : coverage.performance === "not_provided" ? "not_provided" : "missing",
      "Sizing, burst tolerance and storage landing assumptions may be under-modeled.",
      "Collect representative CPU, memory, storage and backup performance history before final architecture approval.",
      buildPerformanceMissingNarrative(),
    );
  }

  if (coverage.network !== "complete") {
    addMissing(
      "network mapping",
      coverage.network === "partial" ? "partial" : coverage.network === "not_provided" ? "not_provided" : "missing",
      "Multi-NIC workloads, VLAN dependencies and firewall expectations may still alter wave order.",
      "Validate VLAN, firewall and network landing assumptions before approving production groups.",
      buildMissingEvidenceNarrative({
        area: "network mapping",
        impact: "Workloads can look simple in inventory while still requiring manual network validation.",
        recommendation: "Validate network landing details before approving production migration waves.",
      }),
    );
  }

  return missingItems;
}

function buildPreviewMissingEvidence(preview: ReportPreviewData, coverage: ReportNarrativeEvidenceCoverage) {
  const coverageDerived = buildMissingEvidenceFromCoverage(coverage);
  const existingAreas = new Set(coverageDerived.map((item) => item.area.toLowerCase()));
  const extras = uniq(preview.missingEvidence).flatMap((item) => {
    if (existingAreas.has(item.toLowerCase())) {
      return [];
    }

    return [
      {
        area: item,
        status: "missing" as const,
        impact: "This evidence gap lowers confidence and can change recommendations after review.",
        recommendation: "Collect and validate this evidence before widening migration scope.",
        narrative: buildMissingEvidenceNarrative({
          area: item,
          impact: "Confidence remains conditional while this evidence is absent.",
          recommendation: "Collect this evidence before approving production migration waves.",
        }),
      },
    ];
  });

  return [...coverageDerived, ...extras].slice(0, 10);
}

function buildPlanMissingEvidence(plan: MigrationRecommendationPlan, coverage: ReportNarrativeEvidenceCoverage) {
  const coverageDerived = buildMissingEvidenceFromCoverage(coverage);
  const extras = plan.sections
    .filter((section) => section.limitations.length > 0)
    .slice(0, 4)
    .map((section) => ({
      area: section.title,
      status: "partial" as const,
      impact: section.limitations[0] ?? "This area still carries evidence limitations.",
      recommendation: section.actionItems[0] ?? "Collect more evidence before expanding plan scope.",
      narrative: buildMissingEvidenceNarrative({
        area: section.title,
        impact: section.limitations[0] ?? "This area still carries evidence limitations.",
        recommendation: section.actionItems[0] ?? "Collect more evidence before expanding plan scope.",
      }),
    }));

  return [...coverageDerived, ...extras].slice(0, 10);
}

function buildVmRiskDistributionFromPreview(preview: ReportPreviewData): ReportNarrativeVmRiskDistribution {
  return {
    critical: preview.findingCounts.critical,
    high: preview.findingCounts.high,
    medium: preview.findingCounts.medium,
    low: preview.findingCounts.low,
    info: preview.findingCounts.info,
    totalAnalyzed: preview.environmentSummary.vmCount,
  };
}

function buildVmRiskDistributionFromPlan(plan: MigrationRecommendationPlan): ReportNarrativeVmRiskDistribution {
  return {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0,
    totalAnalyzed: plan.evidenceSummary.inventory.vmCount,
  };
}

function buildMigrationWavesFromPreview(preview: ReportPreviewData): ReportNarrativeWave[] {
  const rows = preview.vmMatrixPreview.rows;
  const low = rows.filter((row) => row.riskLevel === "low" || row.riskLevel === "info").slice(0, 3);
  const medium = rows.filter((row) => row.riskLevel === "medium").slice(0, 3);
  const high = rows.filter((row) => row.riskLevel === "high" || row.riskLevel === "critical").slice(0, 3);

  return [
    {
      label: "Wave 0 - Pilot",
      stage: "pilot",
      riskBand: "low",
      candidateBasis: low.length > 0 ? low.map((row) => row.vmName).join(", ") : "Select low-risk, non-critical pilot candidates.",
      rationale: "Validate import, network mapping, backup restore and rollback mechanics before any production movement.",
    },
    {
      label: "Wave 1 - Low complexity",
      stage: "wave_1",
      riskBand: "low",
      candidateBasis: low.length > 0 ? low.map((row) => row.vmName).join(", ") : "Not enough VM-level evidence yet.",
      rationale: "Move simple workloads only after pilot success and validated backup assumptions.",
    },
    {
      label: "Wave 2 - Standard production",
      stage: "wave_2",
      riskBand: "medium",
      candidateBasis: medium.length > 0 ? medium.map((row) => row.vmName).join(", ") : "Requires owner and dependency validation.",
      rationale: "Use normal change windows and post-cutover checks for workloads without critical blockers.",
    },
    {
      label: "Wave 3 - Critical systems",
      stage: "wave_3",
      riskBand: "high",
      candidateBasis: high.length > 0 ? high.map((row) => row.vmName).join(", ") : "Critical workloads remain review-bound.",
      rationale: "Require application owner review, rollback criteria and restore proof before production scheduling.",
    },
    {
      label: "Hold / Remediate first",
      stage: "hold",
      riskBand: "hold",
      candidateBasis:
        preview.findingCounts.critical > 0
          ? `${preview.findingCounts.critical} critical finding(s) currently block clean execution.`
          : "Use this lane for workloads with missing dependency, backup or target evidence.",
      rationale: "Do not schedule cutover until the blocking evidence or remediation task is closed.",
    },
  ];
}

function buildMigrationWavesFromPlan(plan: MigrationRecommendationPlan): ReportNarrativeWave[] {
  const baseWaves = plan.evidenceSummary.waveInputs.slice(0, 4).map((wave, index) => ({
    label: index === 0 ? "Wave 0 - Pilot" : `Wave ${index}`,
    stage: index === 0 ? ("pilot" as const) : index === 1 ? ("wave_1" as const) : index === 2 ? ("wave_2" as const) : ("wave_3" as const),
    riskBand: wave.mode === "functional_validated" ? ("medium" as const) : wave.mode === "functional_candidate" ? ("high" as const) : ("low" as const),
    candidateBasis: wave.label,
    rationale: wave.explanation,
  }));

  return [
    ...baseWaves,
    {
      label: "Hold / Remediate first",
      stage: "hold",
      riskBand: "hold",
      candidateBasis:
        plan.evidenceSummary.blockers[0] ?? "Use this lane for workloads that remain blocked by evidence or gate failures.",
      rationale: "Do not authorize production movement until deterministic blockers and missing evidence are resolved.",
    },
  ];
}

function buildRequiredValidationsFromPreview(preview: ReportPreviewData, missingEvidence: ReportNarrativeMissingEvidence[]) {
  return uniq([
    ...missingEvidence.map((item) => item.recommendation),
    "Validate backup and restore readiness for representative workloads.",
    "Validate application ownership and business criticality before production waves.",
    "Validate Proxmox target sizing, storage landing and HA assumptions.",
    "Validate network, VLAN and firewall mapping for multi-NIC or critical systems.",
  ]).slice(0, 8);
}

function buildRequiredValidationsFromPlan(plan: MigrationRecommendationPlan, missingEvidence: ReportNarrativeMissingEvidence[]) {
  return uniq([
    ...missingEvidence.map((item) => item.recommendation),
    ...plan.evidenceSummary.remediationItems,
    ...plan.gates.filter((gate) => gate.blocksProductionWave).map((gate) => gate.recommendation),
  ]).slice(0, 8);
}

function buildAssumptionsFromPreview(preview: ReportPreviewData) {
  return uniq([
    ...preview.licensingCostExposure.assumptions,
    ...preview.customerContextIntelligence.assumptions,
    ...preview.storageDestinationReadiness.assumptions,
    ...preview.assessmentCoverage.limitations,
  ]).slice(0, 12);
}

function buildAssumptionsFromPlan(plan: MigrationRecommendationPlan) {
  return uniq([
    ...plan.sections.flatMap((section) => section.limitations),
    ...plan.gates
      .filter((gate) => gate.status === "insufficient_evidence")
      .map((gate) => `Insufficient evidence remains for ${gate.key.replace(/_/g, " ")}.`),
  ]).slice(0, 12);
}

function buildMethodologyNotes() {
  return [
    "No agents are required for the assessment baseline.",
    "No mandatory credentials or production write access are required to generate the initial decision pack.",
    "Readiness score and evidence confidence score are intentionally separate.",
    "Missing evidence is treated as a meaningful finding, not hidden behind fake certainty.",
    "This report does not guarantee zero downtime or automated migration success.",
  ];
}

export function buildReportNarrativeModelFromPreview(
  preview: ReportPreviewData,
  options?: {
    generatedAt?: Date | string;
  },
): ReportNarrativeModel {
  const evidenceCoverage = getEvidenceCoverageFromPreview(preview);
  const topRisks = buildTopRisksFromPreview(preview);
  const missingEvidence = buildPreviewMissingEvidence(preview, evidenceCoverage);
  const decisionStatus = normalizeDecisionStatus(preview.recommendedDecision, {
    readiness: preview.readinessScore,
    confidence: preview.confidenceScore,
    criticalSignals: preview.findingCounts.critical,
  });
  const holdItems = uniq([
    ...topRisks.filter((risk) => risk.severity === "critical" || risk.severity === "high").map((risk) => risk.title),
    ...missingEvidence.filter((item) => item.area.toLowerCase().includes("backup") || item.area.toLowerCase().includes("dependency")).map((item) => item.area),
  ]).slice(0, 6);
  const nextSteps = uniq([
    ...preview.upgradeRecommendations,
    ...preview.upgradeButtons.map((button) => button.description),
    "Use the report to define a controlled pilot before approving production waves.",
  ]).slice(0, 8);
  const mainBlocker = holdItems[0] ?? topRisks[0]?.title ?? missingEvidence[0]?.area ?? "evidence gaps remain unresolved";
  const bestNextAction = nextSteps[0] ?? "Collect the missing evidence and validate the first pilot scope.";

  return {
    reportType: derivePreviewReportType(preview),
    clientName: preview.clientLabel,
    assessmentName: preview.assessmentTitle,
    generatedAt:
      options?.generatedAt instanceof Date
        ? options.generatedAt.toISOString()
        : typeof options?.generatedAt === "string"
          ? options.generatedAt
          : new Date().toISOString(),
    readinessScore: preview.readinessScore,
    confidenceScore: preview.confidenceScore,
    decisionStatus,
    decisionNarrative: buildDecisionNarrative(
      decisionStatus,
      mainBlocker,
      bestNextAction,
      preview.readinessScore,
      preview.confidenceScore,
    ),
    evidenceCoverage,
    topRisks,
    missingEvidence,
    vmRiskDistribution: buildVmRiskDistributionFromPreview(preview),
    migrationWaves: buildMigrationWavesFromPreview(preview),
    pilotCandidates:
      preview.vmMatrixPreview.rows
        .filter((row) => row.riskLevel === "low" || row.riskLevel === "info")
        .slice(0, 4)
        .map((row) => row.vmName) ?? [],
    holdItems,
    requiredValidations: buildRequiredValidationsFromPreview(preview, missingEvidence),
    nextSteps,
    assumptions: buildAssumptionsFromPreview(preview),
    methodologyNotes: buildMethodologyNotes(),
  };
}

function confidenceScoreFromPlan(plan: MigrationRecommendationPlan) {
  switch (plan.confidence) {
    case "high":
      return 82;
    case "medium":
      return 61;
    case "low":
    default:
      return 38;
  }
}

function readinessScoreFromPlan(plan: MigrationRecommendationPlan) {
  switch (plan.planLevel) {
    case "advanced_plan":
      return 82;
    case "technical_plan":
      return 68;
    case "preliminary_plan":
      return 54;
    case "plan_not_available":
    default:
      return 28;
  }
}

export function buildReportNarrativeModelFromMigrationPlan(
  plan: MigrationRecommendationPlan,
  options?: {
    generatedAt?: Date | string;
  },
): ReportNarrativeModel {
  const evidenceCoverage = getEvidenceCoverageFromPlan(plan);
  const topRisks = buildTopRisksFromPlan(plan);
  const missingEvidence = buildPlanMissingEvidence(plan, evidenceCoverage);
  const readinessScore = readinessScoreFromPlan(plan);
  const confidenceScore = confidenceScoreFromPlan(plan);
  const criticalSignals = plan.gates.filter((gate) => gate.severity === "critical" || gate.status === "fail").length;
  const decisionStatus = normalizeDecisionStatus(plan.executiveDecision, {
    readiness: readinessScore,
    confidence: confidenceScore,
    criticalSignals,
  });
  const holdItems = uniq([
    ...plan.gates.filter((gate) => gate.blocksProductionWave).map((gate) => gate.key),
    ...plan.evidenceSummary.blockers,
  ]).slice(0, 6);
  const nextSteps = uniq([
    ...plan.aiNarrative.nextStepsNarrative,
    ...plan.evidenceSummary.remediationItems,
    "Use the plan to validate gate closures before authorizing production migration waves.",
  ]).slice(0, 8);
  const mainBlocker = holdItems[0] ?? topRisks[0]?.title ?? missingEvidence[0]?.area ?? "plan evidence is still incomplete";
  const bestNextAction = nextSteps[0] ?? "Close the open blocker before expanding beyond pilot scope.";

  return {
    reportType: derivedPlanReportType(plan),
    clientName: plan.evidenceSummary.clientLabel,
    assessmentName: plan.evidenceSummary.assessmentTitle,
    generatedAt:
      options?.generatedAt instanceof Date
        ? options.generatedAt.toISOString()
        : typeof options?.generatedAt === "string"
          ? options.generatedAt
          : plan.generatedAt,
    readinessScore,
    confidenceScore,
    decisionStatus,
    decisionNarrative: buildDecisionNarrative(decisionStatus, mainBlocker, bestNextAction, readinessScore, confidenceScore),
    evidenceCoverage,
    topRisks,
    missingEvidence,
    vmRiskDistribution: buildVmRiskDistributionFromPlan(plan),
    migrationWaves: buildMigrationWavesFromPlan(plan),
    pilotCandidates: plan.evidenceSummary.waveInputs
      .filter((wave) => wave.mode === "technical_only" || wave.mode === "functional_candidate")
      .slice(0, 3)
      .map((wave) => wave.label),
    holdItems,
    requiredValidations: buildRequiredValidationsFromPlan(plan, missingEvidence),
    nextSteps,
    assumptions: buildAssumptionsFromPlan(plan),
    methodologyNotes: buildMethodologyNotes(),
  };
}
