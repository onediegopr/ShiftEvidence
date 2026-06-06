export const METHODOLOGY_VERSION_STATUSES = ["draft", "active", "archived"] as const;
export type MethodologyVersionStatus = (typeof METHODOLOGY_VERSION_STATUSES)[number];

export const METHODOLOGY_RULE_SEVERITIES = [
  "blocking",
  "critical",
  "high",
  "medium",
  "low",
  "info",
] as const;
export type MethodologyRuleSeverity = (typeof METHODOLOGY_RULE_SEVERITIES)[number];

export const METHODOLOGY_DOCUMENT_TYPES = ["bible", "strategy", "runbook", "checklist", "note", "other"] as const;
export type MethodologyDocumentType = (typeof METHODOLOGY_DOCUMENT_TYPES)[number];

export const METHODOLOGY_INTENDED_USES = ["advisor", "scoring", "report", "admin", "sales", "all"] as const;
export type MethodologyIntendedUse = (typeof METHODOLOGY_INTENDED_USES)[number];

export const METHODOLOGY_EMBEDDING_STATUSES = ["pending", "indexed", "skipped", "failed"] as const;
export type MethodologyEmbeddingStatus = (typeof METHODOLOGY_EMBEDDING_STATUSES)[number];

export const METHODOLOGY_RECORD_STATUSES = ["draft", "active", "archived"] as const;
export type MethodologyRecordStatus = (typeof METHODOLOGY_RECORD_STATUSES)[number];

export const METHODOLOGY_NOTE_PRIORITIES = ["low", "normal", "high", "critical"] as const;
export type MethodologyNotePriority = (typeof METHODOLOGY_NOTE_PRIORITIES)[number];

export const METHODOLOGY_NOTE_STATUSES = ["open", "incorporated", "dismissed", "archived"] as const;
export type MethodologyNoteStatus = (typeof METHODOLOGY_NOTE_STATUSES)[number];

export const METHODOLOGY_USAGE_SURFACES = [
  "documentation",
  "advisor",
  "scoring",
  "pdf",
  "rag",
  "admin",
] as const;
export type MethodologyUsageSurface = (typeof METHODOLOGY_USAGE_SURFACES)[number];

export type MethodologyVersion = {
  id: string;
  versionLabel: string;
  title: string;
  status: MethodologyVersionStatus;
  sourceDocumentName: string;
  effectiveFrom: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type MethodologyDomain = {
  id: string;
  versionId: string;
  key:
    | "governance_scoring"
    | "vmware"
    | "proxmox_ve"
    | "san_storage"
    | "networking"
    | "applications_dependencies"
    | "target_readiness"
    | "migration_security"
    | "execution_cutover_rollback"
    | "remediation_catalog"
    | "operational_checklists";
  label: string;
  description: string;
  order: number;
};

export type MethodologyTopic = {
  id: string;
  versionId: string;
  domainId: string;
  key: string;
  title: string;
  summary: string;
  order: number;
};

export type MethodologyRule = {
  id: string;
  versionId: string;
  domainId: string;
  topicId?: string | null;
  ruleCode: string;
  title: string;
  severity: MethodologyRuleSeverity;
  evidenceRequired: string[];
  conditionText: string;
  impact: string;
  remediation: string;
  scoringImpact: string;
  confidenceImpact: string;
  automationPotential: string;
  sourceSection: string;
  status: MethodologyRecordStatus;
  usageSurface?: MethodologyUsageSurface[];
  createdAt: string;
  updatedAt: string;
};

export type MethodologySourceDocument = {
  id: string;
  versionId: string;
  title: string;
  filename: string;
  documentType: MethodologyDocumentType;
  checksum?: string | null;
  uploadedBy?: string | null;
  status: MethodologyRecordStatus;
  createdAt: string;
};

export type MethodologyKnowledgeChunk = {
  id: string;
  versionId: string;
  domainId?: string | null;
  topicId?: string | null;
  sourceDocumentId?: string | null;
  chunkKey: string;
  title: string;
  content: string;
  tags: string[];
  intendedUse: MethodologyIntendedUse;
  embeddingStatus: MethodologyEmbeddingStatus;
  status: MethodologyRecordStatus;
  relatedRuleCodes?: string[];
  createdAt: string;
  updatedAt: string;
};

export type MethodologyChangeLogEntry = {
  id: string;
  versionId: string;
  entityType: string;
  entityId: string;
  changeType: string;
  summary: string;
  rationale: string;
  createdBy?: string | null;
  createdAt: string;
};

export type MethodologyAdminNote = {
  id: string;
  versionId: string;
  domainId?: string | null;
  topicId?: string | null;
  title: string;
  content: string;
  priority: MethodologyNotePriority;
  status: MethodologyNoteStatus;
  createdAt: string;
  updatedAt: string;
};

export type MethodologyKnowledgeSearchFilters = {
  versionId?: string;
  domainIds?: string[];
  topicIds?: string[];
  sourceDocumentIds?: string[];
  intendedUses?: MethodologyIntendedUse[];
  status?: MethodologyRecordStatus[];
  embeddingStatuses?: MethodologyEmbeddingStatus[];
  maxResults?: number;
};

export type MethodologyKnowledgeSearchHit = {
  chunk: MethodologyKnowledgeChunk;
  score: number;
  matchedTerms: string[];
  matchedRuleCodes: string[];
  reason: string;
};

export type MethodologyKnowledgeSearchResult = {
  query: string;
  total: number;
  hits: MethodologyKnowledgeSearchHit[];
};

export type MethodologyRuleFilters = {
  versionId?: string;
  domainIds?: string[];
  topicIds?: string[];
  severities?: MethodologyRuleSeverity[];
  status?: MethodologyRecordStatus[];
  ruleCodes?: string[];
  usageSurfaces?: MethodologyUsageSurface[];
  maxResults?: number;
};

export type MethodologyClaimValidationContext = {
  activeBlockingRules?: MethodologyRule[];
  missingEvidence?: string[];
  assessmentSummary?: string | null;
};

export type MethodologyClaimFinding = {
  code: string;
  severity: "warning" | "critical";
  message: string;
  matchedText: string;
  relatedRuleCodes: string[];
};

export type MethodologyClaimValidationResult = {
  advisoryOnly: true;
  ok: boolean;
  shouldBlock: boolean;
  summary: string;
  findings: MethodologyClaimFinding[];
  missingEvidenceWarnings: string[];
};

export type MethodologyAdvisorContextInput = {
  question: string;
  assessmentContext?: {
    environmentSummary?: string | null;
    readinessScore?: number | null;
    confidenceScore?: number | null;
    keyRisks?: string[];
    missingEvidence?: string[];
  };
  maxChunks?: number;
};

export type MethodologyAdvisorContextResult = {
  version: MethodologyVersion;
  rules: MethodologyRule[];
  chunks: MethodologyKnowledgeChunk[];
  missingEvidenceWarnings: string[];
  searchQuery: string;
  limits: {
    maxChunks: number;
    selectedRules: number;
    selectedChunks: number;
  };
};

export type MethodologyAdminSnapshot = {
  version: MethodologyVersion;
  domainCount: number;
  topicCount: number;
  ruleCount: number;
  chunkCount: number;
  sourceDocumentCount: number;
  openNoteCount: number;
  ragState: "preparado" | "no indexado" | "indexado";
  scoringState: "seed" | "conectado" | "parcial";
  advisorState: "preparado" | "conectado" | "parcial";
  pdfState: "preparado" | "conectado" | "parcial";
  domains: MethodologyDomain[];
  topics: MethodologyTopic[];
  rules: MethodologyRule[];
  knowledgeChunks: MethodologyKnowledgeChunk[];
  sourceDocuments: MethodologySourceDocument[];
  changeLog: MethodologyChangeLogEntry[];
  notes: MethodologyAdminNote[];
  featureNotes: string[];
};
