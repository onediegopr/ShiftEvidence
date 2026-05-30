export type StorageReadinessPlanKey =
  | "starter"
  | "readiness_report"
  | "pro"
  | "blueprint"
  | "partner";

export type StorageReadinessPlanLimits = {
  planKey: StorageReadinessPlanKey;
  label: string;
  maxStorageContextWords: number;
  maxStorageContextCharacters: number;
  maxStorageEvidenceFiles: number;
  maxFileSizeMb: number;
  cephDeepDiveEnabled: boolean;
  aiStorageAnalysisEnabled: boolean;
};

const DEFAULT_AVERAGE_CHARS_PER_WORD = 10;

const PLAN_LIMITS: Record<
  StorageReadinessPlanKey,
  Omit<StorageReadinessPlanLimits, "planKey">
> = {
  starter: {
    label: "Starter",
    maxStorageContextWords: 1_500,
    maxStorageContextCharacters: 1_500 * DEFAULT_AVERAGE_CHARS_PER_WORD,
    maxStorageEvidenceFiles: 1,
    maxFileSizeMb: 25,
    cephDeepDiveEnabled: false,
    aiStorageAnalysisEnabled: false,
  },
  readiness_report: {
    label: "Readiness Report",
    maxStorageContextWords: 8_000,
    maxStorageContextCharacters: 8_000 * DEFAULT_AVERAGE_CHARS_PER_WORD,
    maxStorageEvidenceFiles: 3,
    maxFileSizeMb: 50,
    cephDeepDiveEnabled: false,
    aiStorageAnalysisEnabled: true,
  },
  pro: {
    label: "Readiness Report Pro",
    maxStorageContextWords: 12_000,
    maxStorageContextCharacters: 12_000 * DEFAULT_AVERAGE_CHARS_PER_WORD,
    maxStorageEvidenceFiles: 5,
    maxFileSizeMb: 50,
    cephDeepDiveEnabled: false,
    aiStorageAnalysisEnabled: true,
  },
  blueprint: {
    label: "Blueprint",
    maxStorageContextWords: 40_000,
    maxStorageContextCharacters: 40_000 * DEFAULT_AVERAGE_CHARS_PER_WORD,
    maxStorageEvidenceFiles: 15,
    maxFileSizeMb: 50,
    cephDeepDiveEnabled: true,
    aiStorageAnalysisEnabled: true,
  },
  partner: {
    label: "Partner / MSP",
    maxStorageContextWords: 50_000,
    maxStorageContextCharacters: 50_000 * DEFAULT_AVERAGE_CHARS_PER_WORD,
    maxStorageEvidenceFiles: 25,
    maxFileSizeMb: 50,
    cephDeepDiveEnabled: true,
    aiStorageAnalysisEnabled: true,
  },
};

function normalizePlanKey(value: string | null | undefined): StorageReadinessPlanKey | null {
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

export function getStorageReadinessPlanLimits(
  planKey: StorageReadinessPlanKey,
): StorageReadinessPlanLimits {
  return {
    planKey,
    ...PLAN_LIMITS[planKey],
  };
}

export function resolveStorageReadinessPlanLimits(params: {
  userEntitlementPlanKey?: string | null;
  assessmentPlanLevel?: string | null;
  workspacePlan?: string | null;
}): StorageReadinessPlanLimits {
  const planKey =
    normalizePlanKey(params.userEntitlementPlanKey) ??
    normalizePlanKey(params.assessmentPlanLevel) ??
    normalizePlanKey(params.workspacePlan) ??
    "starter";

  return getStorageReadinessPlanLimits(planKey);
}

export function formatStorageReadinessLimitLabel(limits: StorageReadinessPlanLimits) {
  return `${limits.label}: up to ${limits.maxStorageContextWords.toLocaleString(
    "en-US",
  )} storage context words and ${limits.maxStorageEvidenceFiles} storage evidence file${
    limits.maxStorageEvidenceFiles === 1 ? "" : "s"
  }.`;
}
