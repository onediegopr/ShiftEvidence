export const METHODOLOGY_BLOCK_IDS = [
  "evidence_confidence",
  "readiness_scoring",
  "vm_risk_classification",
  "migration_waves",
  "storage_readiness",
  "ceph_suitability",
  "backup_readiness",
  "network_readiness",
  "business_continuity_risk",
  "no_go_validations",
  "pilot_selection",
  "advisor_boundaries",
] as const;

export type MethodologyBlockId = (typeof METHODOLOGY_BLOCK_IDS)[number];

export const METHODOLOGY_EXPOSURE_LEVELS = [
  "public",
  "advisor_internal",
  "restricted",
] as const;

export type MethodologyExposureLevel = (typeof METHODOLOGY_EXPOSURE_LEVELS)[number];

export const METHODOLOGY_DOMAINS = [
  "evidence",
  "scoring",
  "vm_risk",
  "migration_planning",
  "storage",
  "ceph",
  "backup",
  "network",
  "business_continuity",
  "governance",
  "advisor_safety",
] as const;

export type MethodologyDomain = (typeof METHODOLOGY_DOMAINS)[number];

export const METHODOLOGY_USE_CASES = [
  "explain_methodology",
  "answer_advisor_question",
  "interpret_assessment",
  "generate_next_steps",
  "identify_missing_evidence",
  "plan_migration_waves",
  "evaluate_no_go",
  "select_pilot_candidates",
  "caution_against_overclaiming",
] as const;

export type MethodologyUseCase = (typeof METHODOLOGY_USE_CASES)[number];

export const METHODOLOGY_BLOCK_STATUSES = ["active", "draft", "deprecated"] as const;

export type MethodologyBlockStatus = (typeof METHODOLOGY_BLOCK_STATUSES)[number];

export type MethodologyBlock = {
  id: MethodologyBlockId;
  version: string;
  title: string;
  summary: string;
  content: string;
  domain: MethodologyDomain;
  tags: string[];
  keywords: string[];
  exposureLevel: MethodologyExposureLevel;
  allowedUse: MethodologyUseCase[];
  notAllowedUse: string[];
  safeResponsePatterns?: string[];
  unsafeClaims?: string[];
  evidenceRequired?: string[];
  relatedBlockIds: MethodologyBlockId[];
  lastReviewedAt: string;
  source: string;
  status: MethodologyBlockStatus;
};

export type MethodologyRegistryValidationResult = {
  ok: boolean;
  errors: string[];
  warnings: string[];
  blockCount: number;
  activeBlockCount: number;
};

export type MethodologyRegistryListOptions = {
  activeOnly?: boolean;
  exposureLevels?: MethodologyExposureLevel[];
};

export type MethodologyRetrievalInput = {
  query: string;
  domains?: MethodologyDomain[];
  tags?: string[];
  useCases?: MethodologyUseCase[];
  maxBlocks?: number;
  allowedExposureLevels?: MethodologyExposureLevel[];
  includeRestricted?: boolean;
};

export type MethodologyRetrievalReason = {
  blockId: MethodologyBlockId;
  matchedTags: string[];
  matchedKeywords: string[];
  matchedUseCases: MethodologyUseCase[];
  matchedDomains: MethodologyDomain[];
  score: number;
};

export type MethodologyRetrievalResult = {
  selectedBlocks: MethodologyBlock[];
  reasons: MethodologyRetrievalReason[];
  warnings: string[];
};
