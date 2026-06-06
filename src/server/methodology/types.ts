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

export const METHODOLOGY_REVIEW_ITEM_TYPES = [
  "rule",
  "chunk",
  "topic",
  "domain",
  "claim_validator",
  "scoring",
  "advisor",
  "report",
  "checklist",
  "other",
] as const;
export type MethodologyReviewItemType = (typeof METHODOLOGY_REVIEW_ITEM_TYPES)[number];

export const METHODOLOGY_REVIEW_STATUSES = [
  "proposed",
  "approved",
  "rejected",
  "implemented",
  "archived",
] as const;
export type MethodologyReviewStatus = (typeof METHODOLOGY_REVIEW_STATUSES)[number];

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

export type MethodologyAdminNoteRecord = {
  id: string;
  versionLabel?: string | null;
  domainKey?: string | null;
  topicKey?: string | null;
  ruleCode?: string | null;
  title: string;
  content: string;
  priority: MethodologyNotePriority;
  status: MethodologyNoteStatus;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MethodologyReviewItemRecord = {
  id: string;
  sourceNoteId?: string | null;
  versionLabel: string;
  itemType: MethodologyReviewItemType;
  itemKey?: string | null;
  title: string;
  description: string;
  rationale?: string | null;
  priority: MethodologyNotePriority;
  status: MethodologyReviewStatus;
  decisionReason?: string | null;
  decidedBy?: string | null;
  decidedAt?: string | null;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MethodologyChangeLogRecord = {
  id: string;
  versionLabel: string;
  entityType: string;
  entityId?: string | null;
  entityKey?: string | null;
  changeType: string;
  summary: string;
  rationale?: string | null;
  createdBy?: string | null;
  createdAt: string;
};

export type MethodologyAdminNoteFilters = {
  versionLabel?: string;
  domainKey?: string;
  topicKey?: string;
  ruleCode?: string;
  status?: MethodologyNoteStatus[];
  priority?: MethodologyNotePriority[];
  search?: string;
  limit?: number;
};

export type MethodologyAdminNoteInput = {
  versionLabel?: string;
  domainKey?: string | null;
  topicKey?: string | null;
  ruleCode?: string | null;
  title: string;
  content: string;
  priority?: MethodologyNotePriority;
  status?: MethodologyNoteStatus;
};

export type MethodologyReviewItemFilters = {
  versionLabel?: string;
  itemType?: MethodologyReviewItemType;
  status?: MethodologyReviewStatus[];
  sourceNoteId?: string;
  limit?: number;
};

export type MethodologyReviewItemInput = {
  versionLabel?: string;
  itemType?: MethodologyReviewItemType;
  itemKey?: string | null;
  title?: string;
  description?: string;
  rationale?: string | null;
  priority?: MethodologyNotePriority;
};

export type MethodologyReviewStatusUpdate = {
  status: MethodologyReviewStatus;
  decisionReason?: string | null;
};

export type MethodologyChangeLogFilters = {
  versionLabel?: string;
  entityType?: string;
  entityKey?: string;
  changeType?: string;
  limit?: number;
};

export type MethodologyChangeLogInput = {
  versionLabel: string;
  entityType: string;
  entityId?: string | null;
  entityKey?: string | null;
  changeType: string;
  summary: string;
  rationale?: string | null;
  createdBy?: string | null;
};

export type MethodologyKnowledgeSearchFilters = {
  versionId?: string;
  domainIds?: string[];
  topicIds?: string[];
  sourceDocumentIds?: string[];
  tags?: string[];
  ruleCodes?: string[];
  text?: string;
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

export type MethodologyRuleSearchFilters = {
  versionId?: string;
  domainIds?: string[];
  topicIds?: string[];
  severities?: MethodologyRuleSeverity[];
  status?: MethodologyRecordStatus[];
  ruleCodes?: string[];
  usageSurfaces?: MethodologyUsageSurface[];
  text?: string;
  maxResults?: number;
};

export type MethodologyRuleSearchHit = {
  rule: MethodologyRule;
  score: number;
  matchedTerms: string[];
  reason: string;
};

export type MethodologyRuleSearchResult = {
  query: string;
  total: number;
  hits: MethodologyRuleSearchHit[];
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
  unsafeClaim: string;
  message: string;
  matchedText: string;
  safeAlternative: string;
  relatedRuleCodes: string[];
  relatedMethodologyConcept: string;
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

export type MethodologyAdvisorBridgeContextInput = {
  question: string;
  assessmentSummary?: string | null;
  missingEvidence?: string[];
  activeBlockers?: string[];
  maxRules?: number;
  maxChunks?: number;
};

export type MethodologyAdvisorBridgeContextResult = {
  methodologyVersion: MethodologyVersion;
  relevantRules: MethodologyRule[];
  relevantChunks: MethodologyKnowledgeChunk[];
  safetyCaveats: string[];
  recommendedTone: "conservative" | "balanced" | "executive";
  forbiddenClaims: string[];
  suggestedFollowUpQuestions: string[];
  searchQuery: string;
  enabled: boolean;
};

export type MethodologyReportContextInput = {
  assessmentSummary?: string | null;
  missingEvidence?: string[];
  activeBlockers?: string[];
  maxRules?: number;
  maxChunks?: number;
};

export type MethodologyReportContextResult = {
  methodologyVersion: MethodologyVersion;
  methodologyNotes: string[];
  evidenceConfidenceLanguage: string;
  missingEvidenceLanguage: string;
  blockerLanguage: string;
  rollbackLanguage: string;
  safeClaims: string[];
  ruleTraceExamples: string[];
  relevantRules: MethodologyRule[];
  relevantChunks: MethodologyKnowledgeChunk[];
  searchQuery: string;
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
