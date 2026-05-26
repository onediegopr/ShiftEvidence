import { type AssessmentDetail } from "./assessmentService";
import { getCostRiskStatus } from "./costRiskService";
import { buildInfrastructureStatus } from "./infrastructureInputService";

export type UploadPrerequisite = {
  key: string;
  label: string;
  description?: string;
  href?: string;
};

export type UploadPrerequisiteResult = {
  canUploadEvidence: boolean;
  missingPrerequisites: UploadPrerequisite[];
};

function hasAssessmentTitle(assessment: AssessmentDetail) {
  return assessment.title.trim().length > 0;
}

export function getEvidenceUploadPrerequisites(assessment: AssessmentDetail): UploadPrerequisiteResult {
  const missingPrerequisites: UploadPrerequisite[] = [];
  const infrastructureStatus = buildInfrastructureStatus(assessment.infrastructureInput);
  const costRiskStatus = getCostRiskStatus(assessment);

  if (!hasAssessmentTitle(assessment)) {
    missingPrerequisites.push({
      key: "assessment_title",
      label: "Assessment basics",
      description: "Add an assessment title before uploading evidence.",
      href: "#assessment-basics",
    });
  }

  if (infrastructureStatus === "missing") {
    missingPrerequisites.push({
      key: "infrastructure_intake",
      label: "Manual infrastructure intake",
      description: "Add baseline environment size or infrastructure context first.",
      href: "#infrastructure-intake",
    });
  }

  if (costRiskStatus === "missing") {
    missingPrerequisites.push({
      key: "cost_risk_assumptions",
      label: "Cost / Risk assumptions",
      description: "Add initial sizing or cost assumptions before attaching evidence.",
      href: "#cost-risk-assumptions",
    });
  }

  return {
    canUploadEvidence: missingPrerequisites.length === 0,
    missingPrerequisites,
  };
}

export function assertCanUploadEvidence(assessment: AssessmentDetail) {
  const prerequisites = getEvidenceUploadPrerequisites(assessment);

  if (!prerequisites.canUploadEvidence) {
    const missing = prerequisites.missingPrerequisites.map((item) => item.label).join(", ");
    throw new Error(`Complete the assessment basics before uploading evidence. Missing: ${missing}.`);
  }

  return prerequisites;
}
