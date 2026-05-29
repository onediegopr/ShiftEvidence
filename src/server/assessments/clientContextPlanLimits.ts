export type ClientContextPlanKey =
  | "starter"
  | "readiness_report"
  | "pro"
  | "blueprint"
  | "partner";

export type ClientContextPlanLimits = {
  planKey: ClientContextPlanKey;
  label: string;
  maxWords: number;
  maxCharacters: number;
  maxFiles: number;
  maxFileSizeMb: number;
  additionalEvidenceEnabled: boolean;
  deepAnalysisEnabled: boolean;
  pdfFullSectionEnabled: boolean;
};

const DEFAULT_AVERAGE_CHARS_PER_WORD = 10;

const PLAN_LIMITS: Record<ClientContextPlanKey, Omit<ClientContextPlanLimits, "planKey">> = {
  starter: {
    label: "Starter",
    maxWords: 5_000,
    maxCharacters: 5_000 * DEFAULT_AVERAGE_CHARS_PER_WORD,
    maxFiles: 1,
    maxFileSizeMb: 25,
    additionalEvidenceEnabled: true,
    deepAnalysisEnabled: false,
    pdfFullSectionEnabled: false,
  },
  readiness_report: {
    label: "Readiness Report",
    maxWords: 15_000,
    maxCharacters: 15_000 * DEFAULT_AVERAGE_CHARS_PER_WORD,
    maxFiles: 3,
    maxFileSizeMb: 50,
    additionalEvidenceEnabled: true,
    deepAnalysisEnabled: false,
    pdfFullSectionEnabled: false,
  },
  pro: {
    label: "Readiness Report Pro",
    maxWords: 25_000,
    maxCharacters: 25_000 * DEFAULT_AVERAGE_CHARS_PER_WORD,
    maxFiles: 8,
    maxFileSizeMb: 50,
    additionalEvidenceEnabled: true,
    deepAnalysisEnabled: false,
    pdfFullSectionEnabled: false,
  },
  blueprint: {
    label: "Blueprint",
    maxWords: 50_000,
    maxCharacters: 50_000 * DEFAULT_AVERAGE_CHARS_PER_WORD,
    maxFiles: 20,
    maxFileSizeMb: 50,
    additionalEvidenceEnabled: true,
    deepAnalysisEnabled: false,
    pdfFullSectionEnabled: false,
  },
  partner: {
    label: "Partner / MSP",
    maxWords: 50_000,
    maxCharacters: 50_000 * DEFAULT_AVERAGE_CHARS_PER_WORD,
    maxFiles: 25,
    maxFileSizeMb: 50,
    additionalEvidenceEnabled: true,
    deepAnalysisEnabled: false,
    pdfFullSectionEnabled: false,
  },
};

function normalizePlanKey(value: string | null | undefined): ClientContextPlanKey | null {
  const normalized = value?.trim().toLowerCase();

  switch (normalized) {
    case "admin":
    case "internal_qa":
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

export function getClientContextPlanLimits(planKey: ClientContextPlanKey): ClientContextPlanLimits {
  return {
    planKey,
    ...PLAN_LIMITS[planKey],
  };
}

export function resolveClientContextPlanLimits(params: {
  userEntitlementPlanKey?: string | null;
  assessmentPlanLevel?: string | null;
  workspacePlan?: string | null;
}): ClientContextPlanLimits {
  const planKey =
    normalizePlanKey(params.userEntitlementPlanKey) ??
    normalizePlanKey(params.assessmentPlanLevel) ??
    normalizePlanKey(params.workspacePlan) ??
    "starter";

  return getClientContextPlanLimits(planKey);
}

export function formatClientContextLimitLabel(limits: ClientContextPlanLimits) {
  return `${limits.label}: up to ${limits.maxWords.toLocaleString("en-US")} words and ${limits.maxFiles} additional file${limits.maxFiles === 1 ? "" : "s"}.`;
}
