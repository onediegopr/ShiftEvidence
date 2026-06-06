export type ReportCopyEvidenceStatus =
  | "complete"
  | "partial"
  | "missing"
  | "not_provided"
  | "not_applicable";

export type PremiumNarrativeInput = {
  finding: string;
  evidence: string;
  whyItMatters: string;
  recommendation: string;
  ownerAction: string;
};

function sentence(text: string) {
  const normalized = text.trim().replace(/\s+/g, " ");
  if (!normalized) return "";
  return /[.!?]$/.test(normalized) ? normalized : `${normalized}.`;
}

export function buildPremiumNarrative(input: PremiumNarrativeInput) {
  return [
    sentence(input.finding),
    `Evidence: ${sentence(input.evidence)}`,
    `Why it matters: ${sentence(input.whyItMatters)}`,
    `Recommendation: ${sentence(input.recommendation)}`,
    `Owner/action: ${sentence(input.ownerAction)}`,
  ].join(" ");
}

export function buildMissingEvidenceNarrative(params: {
  area: string;
  impact: string;
  recommendation: string;
}) {
  return buildPremiumNarrative({
    finding: `No validated evidence was provided for ${params.area}.`,
    evidence: `${params.area} remains unconfirmed in the current assessment package.`,
    whyItMatters: params.impact,
    recommendation: params.recommendation,
    ownerAction: `Collect and validate ${params.area} evidence before approving production migration waves.`,
  });
}

export function buildBackupMissingNarrative() {
  return buildMissingEvidenceNarrative({
    area: "backup evidence",
    impact:
      "RPO, RTO and restore readiness cannot be confirmed for production-critical workloads, which reduces confidence in rollback planning.",
    recommendation:
      "Validate restore points, failed jobs and retention coverage before placing critical systems into pilot or Wave 1.",
  });
}

export function buildProxmoxTargetNarrative(status: ReportCopyEvidenceStatus) {
  if (status === "complete") {
    return buildPremiumNarrative({
      finding: "Proxmox target evidence is available for planning.",
      evidence: "Target-side readiness details were supplied for capacity and destination review.",
      whyItMatters:
        "Target validation reduces guesswork around storage, HA expectations and landing-zone feasibility.",
      recommendation: "Use the supplied target evidence to confirm pilot sizing and Wave 1 constraints.",
      ownerAction: "Validate final target assumptions with the infrastructure owner before cutover approval.",
    });
  }

  return buildMissingEvidenceNarrative({
    area: "Proxmox target readiness",
    impact:
      "Destination capacity, storage fit and HA assumptions may be incomplete, which can hide landing-zone blockers.",
    recommendation:
      "Supply target node, storage and HA evidence before treating migration sequencing as production-ready.",
  });
}

export function buildDependencyMissingNarrative() {
  return buildMissingEvidenceNarrative({
    area: "application dependency evidence",
    impact:
      "Wave ordering may look technically simple while still hiding application coupling, maintenance windows or service-chain risk.",
    recommendation:
      "Capture dependency and ownership evidence before moving shared or business-critical systems into production waves.",
  });
}

export function buildPerformanceMissingNarrative() {
  return buildMissingEvidenceNarrative({
    area: "performance history",
    impact:
      "Sizing, burst tolerance and storage fit may be under-modeled when historical utilization or throughput signals are absent.",
    recommendation:
      "Collect representative CPU, memory, storage and backup performance signals before finalizing the target architecture.",
  });
}

export function buildCombinedScoreNarrative(params: {
  readinessScore: number | null;
  confidenceScore: number | null;
}) {
  const readiness = params.readinessScore ?? 0;
  const confidence = params.confidenceScore ?? 0;

  if (readiness >= 75 && confidence >= 70) {
    return "Readiness is comparatively strong and evidence confidence is also strong. This supports a controlled pilot-first migration recommendation rather than an unqualified production go-live.";
  }

  if (readiness >= 75 && confidence < 70) {
    return "Technical readiness appears promising, but evidence confidence is weaker than the readiness signal. This is a pilot-first situation, not a production-ready green light.";
  }

  if (readiness < 50 && confidence >= 70) {
    return "Evidence confidence is strong enough to trust the current blockers. The right next step is remediation-first, not acceleration.";
  }

  return "Readiness and confidence remain mixed. Use this assessment to prioritize validations, close evidence gaps and control the scope of early migration waves.";
}

export function buildPilotFirstNarrative(mainBlocker: string, nextAction: string) {
  return `Decision: Pilot First. ${sentence(
    `Proceed with a constrained pilot only after ${mainBlocker.toLowerCase()} is validated`,
  )} ${sentence(nextAction)}`;
}

export function buildRemediationFirstNarrative(mainBlocker: string, nextAction: string) {
  return `Decision: Remediate First. ${sentence(
    `Current evidence supports remediation before production migration because ${mainBlocker.toLowerCase()} remains unresolved`,
  )} ${sentence(nextAction)}`;
}
