import {
  normalizeSeniorAdvisorPlanKey,
  resolveSeniorAdvisorPlanLimits,
} from "./seniorAdvisorPlanLimits";
import type { SeniorAdvisorPlanKey } from "./seniorAdvisorTypes";

export type AdvisorMemoryPlanLimits = {
  planKey: SeniorAdvisorPlanKey;
  label: string;
  enabled: boolean;
  canUseMemory: boolean;
  maxItemsPerAssessment: number;
  maxOpenQuestions: number;
  maxDecisions: number;
  maxNextSteps: number;
};

const MEMORY_LIMITS: Record<SeniorAdvisorPlanKey, Omit<AdvisorMemoryPlanLimits, "planKey">> = {
  starter: {
    label: "Starter Readiness",
    enabled: false,
    canUseMemory: false,
    maxItemsPerAssessment: 0,
    maxOpenQuestions: 0,
    maxDecisions: 0,
    maxNextSteps: 0,
  },
  internal_qa: {
    label: "Internal QA",
    enabled: true,
    canUseMemory: true,
    maxItemsPerAssessment: 50,
    maxOpenQuestions: 20,
    maxDecisions: 20,
    maxNextSteps: 20,
  },
  readiness_report: {
    label: "Starter Readiness",
    enabled: true,
    canUseMemory: true,
    maxItemsPerAssessment: 25,
    maxOpenQuestions: 10,
    maxDecisions: 10,
    maxNextSteps: 10,
  },
  pro: {
    label: "Professional Assessment",
    enabled: true,
    canUseMemory: true,
    maxItemsPerAssessment: 50,
    maxOpenQuestions: 20,
    maxDecisions: 20,
    maxNextSteps: 20,
  },
  blueprint: {
    label: "Migration Blueprint",
    enabled: true,
    canUseMemory: true,
    maxItemsPerAssessment: 150,
    maxOpenQuestions: 50,
    maxDecisions: 50,
    maxNextSteps: 50,
  },
  partner: {
    label: "MSP Partner",
    enabled: true,
    canUseMemory: true,
    maxItemsPerAssessment: 100,
    maxOpenQuestions: 40,
    maxDecisions: 40,
    maxNextSteps: 40,
  },
};

export function getAdvisorMemoryPlanLimits(
  planKey: SeniorAdvisorPlanKey,
): AdvisorMemoryPlanLimits {
  return {
    planKey,
    ...MEMORY_LIMITS[planKey],
  };
}

export function resolveAdvisorMemoryPlanLimits(params: {
  userEntitlementPlanKey?: string | null;
  assessmentPlanLevel?: string | null;
  workspacePlan?: string | null;
}) {
  const seniorAdvisorPlan = resolveSeniorAdvisorPlanLimits(params);
  return getAdvisorMemoryPlanLimits(seniorAdvisorPlan.planKey);
}

export function normalizeAdvisorMemoryPlanKey(value: string | null | undefined) {
  return normalizeSeniorAdvisorPlanKey(value);
}
