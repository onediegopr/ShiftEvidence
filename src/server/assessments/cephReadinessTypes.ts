export const CEPH_READINESS_ENGINE_VERSION = "ceph-readiness-engine-v1";

export type CephSuitabilityStatus =
  | "ceph_applies"
  | "ceph_does_not_apply"
  | "ceph_conditional"
  | "ceph_overkill"
  | "ceph_underdesigned"
  | "not_enough_evidence";

export type CephFindingSeverity = "critical" | "high" | "medium" | "low" | "info";

export type CephFindingCategory =
  | "nodes"
  | "osds"
  | "network"
  | "capacity"
  | "failure_domains"
  | "backup"
  | "operations"
  | "support"
  | "workload"
  | "evidence";

export type CephRecommendedNextStep =
  | "proceed_to_ceph_blueprint"
  | "collect_more_evidence"
  | "use_zfs_or_existing_shared_storage"
  | "remediate_before_ceph"
  | "avoid_ceph_for_this_case"
  | "run_pilot_first";

export type CephReadinessScores = {
  cephSuitabilityScore: number;
  cephOperationsReadinessScore: number;
  cephEvidenceConfidenceScore: number;
  capacityFitScore: number;
  networkReadinessScore: number;
  failureDomainReadinessScore: number;
  backupReadinessScore: number;
  operationalSkillsScore: number;
};

export type CephReadinessFinding = {
  severity: CephFindingSeverity;
  category: CephFindingCategory;
  title: string;
  description: string;
  impact: string;
  recommendation: string;
};

export type CephRemediation = {
  priority: "high" | "medium" | "low";
  action: string;
  reason: string;
  requiredBeforeCeph: boolean;
};

export type CephMissingEvidence = {
  item: string;
  whyItMatters: string;
  priority: "high" | "medium" | "low";
};

export type CephReadinessResult = CephReadinessScores & {
  status: CephSuitabilityStatus;
  summary: string;
  decisionRationale: string[];
  findings: CephReadinessFinding[];
  remediations: CephRemediation[];
  missingEvidence: CephMissingEvidence[];
  assumptions: string[];
  recommendedNextStep: CephRecommendedNextStep;
  engineVersion: typeof CEPH_READINESS_ENGINE_VERSION;
  generatedAt: string;
};

export type CephEvidenceFileSignal = {
  classification: string;
  analysisStatus: string;
  included: boolean;
};

export type CephRvtoolsDatastoreSummary = {
  totalCapacityGb: number | null;
  usedGb: number | null;
  freeGb: number | null;
  datastoreCount: number;
  highUsageDatastoreCount: number;
  snapshotCount: number;
  snapshotRisk: boolean;
  largestVmGb: number | null;
  vmCount: number;
};

export type CephStorageContextSignals = {
  cephPositiveSignals: string[];
  cephRiskSignals: string[];
  missingEvidence: string[];
  operationalSignals: string[];
};

export type CephEvidenceInput = {
  wantsCeph: boolean;
  targetPreference: string | null;
  hasProxmoxTarget: boolean | null;
  needsHighAvailability: boolean | null;
  requiresSharedStorage: boolean | null;
  hasPbs: boolean | null;
  hasMinimumThreeNodes: boolean | null;
  hasDedicatedStorageNetwork: boolean | null;
  hasCephExperience: boolean | null;
  hasVendorOrPartnerSupport: boolean | null;
  currentStorageType: string | null;
  estimatedGrowthPercent3y: number | null;
  downtimeTolerance: string | null;
  rvtoolsDatastoreSummary: CephRvtoolsDatastoreSummary;
  storageContextSignals: CephStorageContextSignals;
  evidenceFiles: CephEvidenceFileSignal[];
  hasCephEvidence: boolean;
  hasNetworkEvidence: boolean;
  hasHardwareEvidence: boolean;
  hasBackupEvidence: boolean;
  hasTargetDesignEvidence: boolean;
};
