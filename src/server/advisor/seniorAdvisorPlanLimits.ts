import type {
  SeniorAdvisorPlanKey,
  SeniorAdvisorPlanLimits,
  SeniorAdvisorUsageState,
} from "./seniorAdvisorTypes";

const PLAN_LIMITS: Record<
  SeniorAdvisorPlanKey,
  Omit<SeniorAdvisorPlanLimits, "planKey">
> = {
  starter: {
    label: "Starter Readiness",
    enabled: false,
    messageLimit: 0,
    maxUserMessageChars: 0,
    maxPromptInputChars: 0,
    maxResponseTokens: 0,
    warningAtPercent: 80,
    deepSynthesisEnabled: false,
    executiveBriefEnabled: false,
    canRequestMoreCredits: false,
    requestMoreCreditsEnabled: false,
    requestMoreCreditsMode: "coming_soon",
  },
  internal_qa: {
    label: "Internal QA",
    enabled: true,
    messageLimit: 25,
    maxUserMessageChars: 3_000,
    maxPromptInputChars: 18_000,
    maxResponseTokens: 900,
    warningAtPercent: 80,
    deepSynthesisEnabled: false,
    executiveBriefEnabled: false,
    canRequestMoreCredits: true,
    requestMoreCreditsEnabled: false,
    requestMoreCreditsMode: "contact_us",
  },
  readiness_report: {
    label: "Starter Readiness",
    enabled: true,
    messageLimit: 25,
    maxUserMessageChars: 3_000,
    maxPromptInputChars: 18_000,
    maxResponseTokens: 900,
    warningAtPercent: 80,
    deepSynthesisEnabled: false,
    executiveBriefEnabled: false,
    canRequestMoreCredits: true,
    requestMoreCreditsEnabled: false,
    requestMoreCreditsMode: "contact_us",
  },
  pro: {
    label: "Professional Assessment",
    enabled: true,
    messageLimit: 40,
    maxUserMessageChars: 4_000,
    maxPromptInputChars: 24_000,
    maxResponseTokens: 1_200,
    warningAtPercent: 80,
    deepSynthesisEnabled: false,
    executiveBriefEnabled: true,
    canRequestMoreCredits: true,
    requestMoreCreditsEnabled: false,
    requestMoreCreditsMode: "contact_us",
  },
  blueprint: {
    label: "Migration Blueprint",
    enabled: true,
    messageLimit: 150,
    maxUserMessageChars: 6_000,
    maxPromptInputChars: 40_000,
    maxResponseTokens: 1_800,
    warningAtPercent: 80,
    deepSynthesisEnabled: true,
    executiveBriefEnabled: true,
    canRequestMoreCredits: true,
    requestMoreCreditsEnabled: false,
    requestMoreCreditsMode: "contact_us",
  },
  partner: {
    label: "MSP Partner",
    enabled: true,
    messageLimit: 100,
    maxUserMessageChars: 5_000,
    maxPromptInputChars: 36_000,
    maxResponseTokens: 1_500,
    warningAtPercent: 80,
    deepSynthesisEnabled: true,
    executiveBriefEnabled: true,
    canRequestMoreCredits: true,
    requestMoreCreditsEnabled: false,
    requestMoreCreditsMode: "contact_us",
  },
};

export function normalizeSeniorAdvisorPlanKey(
  value: string | null | undefined,
): SeniorAdvisorPlanKey | null {
  const normalized = value?.trim().toLowerCase();

  switch (normalized) {
    case "internal_qa":
    case "advisor_qa":
    case "qa":
      return "internal_qa";
    case "admin":
    case "msp_partner":
    case "partner":
      return "partner";
    case "blueprint":
    case "custom_blueprint":
      return "blueprint";
    case "professional":
    case "readiness_report_pro":
    case "pro":
      return "pro";
    case "readiness_report":
      return "readiness_report";
    case "free":
    case "free_preview":
    case "starter":
      return "starter";
    default:
      return null;
  }
}

export function getSeniorAdvisorPlanLimits(
  planKey: SeniorAdvisorPlanKey,
): SeniorAdvisorPlanLimits {
  return {
    planKey,
    ...PLAN_LIMITS[planKey],
  };
}

export function resolveSeniorAdvisorPlanLimits(params: {
  userEntitlementPlanKey?: string | null;
  assessmentPlanLevel?: string | null;
  workspacePlan?: string | null;
}) {
  const planKey =
    normalizeSeniorAdvisorPlanKey(params.userEntitlementPlanKey) ??
    normalizeSeniorAdvisorPlanKey(params.assessmentPlanLevel) ??
    normalizeSeniorAdvisorPlanKey(params.workspacePlan) ??
    "starter";

  return getSeniorAdvisorPlanLimits(planKey);
}

export function buildSeniorAdvisorUsageState(params: {
  limits: SeniorAdvisorPlanLimits;
  messagesUsed: number;
}): SeniorAdvisorUsageState {
  const messagesUsed = Math.max(0, params.messagesUsed);
  const messageLimit = Math.max(0, params.limits.messageLimit);
  const messagesRemaining = params.limits.enabled
    ? Math.max(0, messageLimit - messagesUsed)
    : 0;
  const percentUsed =
    messageLimit > 0 ? Math.min(100, Math.round((messagesUsed / messageLimit) * 100)) : 0;

  return {
    enabled: params.limits.enabled,
    planLabel: params.limits.label,
    messageLimit,
    messagesUsed,
    messagesRemaining,
    percentUsed,
    warningReached: params.limits.enabled && percentUsed >= params.limits.warningAtPercent,
    exhausted: params.limits.enabled ? messagesUsed >= messageLimit : true,
    canRequestMoreCredits: params.limits.canRequestMoreCredits,
    requestMoreCreditsEnabled: params.limits.requestMoreCreditsEnabled,
    requestMoreCreditsMode: params.limits.requestMoreCreditsMode,
  };
}

export function formatSeniorAdvisorLimitLabel(limits: SeniorAdvisorPlanLimits) {
  if (!limits.enabled) {
    return "Senior Migration Advisor is not included in this plan.";
  }

  return `${limits.label}: ${limits.messageLimit.toLocaleString(
    "en-US",
  )} advisor messages per assessment.`;
}
