import { getActiveMethodologyVersion, listMethodologyKnowledgeChunks, listMethodologyRules } from "./registry";
import { searchMethodologyKnowledge, searchMethodologyRules } from "./search";
import type {
  MethodologyAdvisorBridgeContextInput,
  MethodologyAdvisorBridgeContextResult,
  MethodologyAdvisorContextInput,
  MethodologyAdvisorContextResult,
  MethodologyReportContextInput,
  MethodologyReportContextResult,
  MethodologyClaimFinding,
  MethodologyClaimValidationContext,
  MethodologyClaimValidationResult,
  MethodologyKnowledgeChunk,
  MethodologyRule,
} from "./types";

const DEFAULT_MAX_CHUNKS = 5;
const HARD_MAX_CHUNKS = 8;

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeCompact(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function unique(values: string[]) {
  return [...new Set(values.filter((value) => value.trim().length > 0))];
}

function getKeywordRuleCodes(question: string) {
  const normalized = normalizeText(question);
  const compact = normalizeCompact(question);
  const ruleCodes = new Set<string>(["SE-GOV-SCR-001", "SE-GOV-CONF-001", "SE-GOV-EVID-001"]);

  if (normalized.includes("vmware") || normalized.includes("storage")) {
    ["SE-VMW-STO-001", "SE-VMW-SNP-001", "SE-VMW-RAM-001", "SE-VMW-BKP-001", "SE-VMW-BKP-004"].forEach((ruleCode) => ruleCodes.add(ruleCode));
  }
  if (normalized.includes("backup") || normalized.includes("restore") || compact.includes("rvtools")) {
    ["SE-VMW-BKP-001", "SE-VMW-BKP-004"].forEach((ruleCode) => ruleCodes.add(ruleCode));
  }
  if (normalized.includes("proxmox") || normalized.includes("pve")) {
    ["SE-PVE-CLS-001", "SE-PVE-STO-001"].forEach((ruleCode) => ruleCodes.add(ruleCode));
  }
  if (normalized.includes("san")) {
    ruleCodes.add("SE-SAN-FAB-001");
  }
  if (normalized.includes("network") || normalized.includes("vlan") || normalized.includes("mtu")) {
    ruleCodes.add("SE-NET-L2-001");
  }
  if (normalized.includes("application") || normalized.includes("dependency") || normalized.includes("app")) {
    ruleCodes.add("SE-APP-DEP-001");
  }
  if (normalized.includes("target") || normalized.includes("capacity") || normalized.includes("readiness")) {
    ruleCodes.add("SE-TGT-CAP-001");
  }
  if (normalized.includes("cutover") || normalized.includes("rollback") || normalized.includes("freeze")) {
    ruleCodes.add("SE-EXE-RLB-001");
  }
  if (normalized.includes("security") || normalized.includes("immutability") || normalized.includes("access")) {
    ruleCodes.add("SE-SEC-IMM-001");
  }

  return [...ruleCodes];
}

function buildFallbackChunks(maxChunks: number): MethodologyKnowledgeChunk[] {
  return listMethodologyKnowledgeChunks({
    maxResults: maxChunks,
    intendedUses: ["advisor", "scoring", "report", "admin"],
    status: ["active"],
  });
}

function collectRuleCodesFromChunks(chunks: MethodologyKnowledgeChunk[]) {
  return unique(chunks.flatMap((chunk) => chunk.relatedRuleCodes ?? []));
}

function collectRuleCodesFromValidationContext(context: MethodologyClaimValidationContext) {
  return unique(context.activeBlockingRules?.map((rule) => rule.ruleCode) ?? []);
}

function prioritizeRulesByCodeOrder(rules: MethodologyRule[], orderedCodes: string[], maxResults: number) {
  const rank = new Map(orderedCodes.map((code, index) => [code, index]));
  return [...rules]
    .sort((a, b) => {
      const aRank = rank.get(a.ruleCode) ?? Number.MAX_SAFE_INTEGER;
      const bRank = rank.get(b.ruleCode) ?? Number.MAX_SAFE_INTEGER;
      return aRank - bRank || a.ruleCode.localeCompare(b.ruleCode);
    })
    .slice(0, maxResults);
}

function makeFinding(
  code: string,
  severity: "warning" | "critical",
  unsafeClaim: string,
  message: string,
  matchedText: string,
  safeAlternative: string,
  relatedRuleCodes: string[],
  relatedMethodologyConcept: string,
): MethodologyClaimFinding {
  return {
    code,
    severity,
    unsafeClaim,
    message,
    matchedText,
    safeAlternative,
    relatedRuleCodes: unique(relatedRuleCodes),
    relatedMethodologyConcept,
  };
}

function findFirstMatch(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match;
    }
  }
  return null;
}

export function buildMethodologyContextForAdvisor(
  input: MethodologyAdvisorContextInput,
): MethodologyAdvisorContextResult {
  const bridge = buildMethodologyAdvisorContext({
    question: input.question,
    assessmentSummary: input.assessmentContext?.environmentSummary,
    missingEvidence: input.assessmentContext?.missingEvidence,
    activeBlockers: input.assessmentContext?.keyRisks,
    maxChunks: input.maxChunks,
  });

  const selectedChunks = bridge.relevantChunks;
  const selectedRules = bridge.relevantRules;
  const searchQuery = bridge.searchQuery;
  const missingEvidenceWarnings = unique([
    ...(input.assessmentContext?.missingEvidence ?? []).map((item) => `Falta evidencia: ${item}`),
    ...(input.assessmentContext?.keyRisks ?? []).map((item) => `Riesgo declarado: ${item}`),
  ]);

  return {
    version: bridge.methodologyVersion,
    rules: selectedRules,
    chunks: selectedChunks,
    missingEvidenceWarnings,
    searchQuery,
    limits: {
      maxChunks: input.maxChunks ?? DEFAULT_MAX_CHUNKS,
      selectedRules: selectedRules.length,
      selectedChunks: selectedChunks.length,
    },
  };
}

export function buildMethodologyAdvisorContext(
  input: MethodologyAdvisorBridgeContextInput,
): MethodologyAdvisorBridgeContextResult {
  const version = getActiveMethodologyVersion();
  const enabled = process.env.ADVISOR_METHODOLOGY_CONTEXT_ENABLED === "true";
  const maxChunks = Math.min(Math.max(input.maxChunks ?? DEFAULT_MAX_CHUNKS, 0), HARD_MAX_CHUNKS);
  const maxRules = Math.min(Math.max(input.maxRules ?? 12, 0), 24);
  const searchQuery = [input.question, input.assessmentSummary].filter(Boolean).join(" / ");
  const textQuery = searchQuery || input.question;
  const ruleSearch = searchMethodologyRules(textQuery, {
    versionId: version.id,
    severities: ["blocking", "critical", "high", "medium"],
    status: ["active"],
    maxResults: maxRules,
  });
  const chunkSearch = searchMethodologyKnowledge(textQuery, {
    versionId: version.id,
    intendedUses: ["advisor", "scoring", "report", "admin", "sales"],
    status: ["active"],
    maxResults: maxChunks,
  });

  const selectedChunks =
    chunkSearch.hits.length > 0
      ? chunkSearch.hits.map((hit) => hit.chunk)
      : buildFallbackChunks(maxChunks);

  const keywordRuleCodes = getKeywordRuleCodes(input.question);
  const chunkRuleCodes = collectRuleCodesFromChunks(selectedChunks);
  const activeRuleCodes = unique([
    ...keywordRuleCodes,
    ...chunkRuleCodes,
    ...ruleSearch.hits.map((hit) => hit.rule.ruleCode),
    ...(input.activeBlockers ?? []),
  ]);
  const selectedRules = listMethodologyRules({
    versionId: version.id,
    status: ["active"],
    ruleCodes: activeRuleCodes,
  });
  const prioritizedRules = prioritizeRulesByCodeOrder(selectedRules, activeRuleCodes, maxRules);
  const safetyCaveats = unique([
    "La KB ampliada no cambia scoring, Advisor ni PDF automaticamente sin feature flag.",
    ...(input.missingEvidence ?? []).map((item) => `Falta evidencia: ${item}`),
    ...(input.activeBlockers ?? []).map((item) => `Bloqueo activo: ${item}`),
  ]);
  const recommendedTone: MethodologyAdvisorBridgeContextResult["recommendedTone"] =
    (input.activeBlockers?.length ?? 0) > 0 || (input.missingEvidence?.length ?? 0) > 0
      ? "conservative"
      : input.assessmentSummary
        ? "balanced"
        : "executive";
  const forbiddenClaims = unique([
    "guaranteed migration",
    "zero downtime",
    "no risk",
    "production safe",
    "fully validated",
    "backup verified without restore evidence",
    "dependencies mapped without dependency evidence",
    "Proxmox target ready without target evidence",
    "performance validated without performance data",
    "automated migration execution",
    "replaces consultant",
  ]);
  const suggestedFollowUpQuestions = unique([
    ...(input.missingEvidence ?? []).map((item) => `What evidence closes ${item}?`),
    ...(input.activeBlockers ?? []).map((item) => `Who owns ${item}?`),
    "What remains open before the next go/no-go gate?",
  ]);

  return {
    methodologyVersion: version,
    relevantRules: prioritizedRules,
    relevantChunks: selectedChunks,
    safetyCaveats,
    recommendedTone,
    forbiddenClaims,
    suggestedFollowUpQuestions,
    searchQuery: textQuery,
    enabled,
  };
}

export function validateMethodologyClaims(
  reportText: string,
  context: MethodologyClaimValidationContext = {},
): MethodologyClaimValidationResult {
  const normalized = normalizeText(reportText);
  const blockingRuleCodes = collectRuleCodesFromValidationContext(context);
  const findings: MethodologyClaimFinding[] = [];

  const guaranteeMatch = findFirstMatch(normalized, [
    /\bguaranteed\b/,
    /\bgarantizad[oa]s?\b/,
    /\b100\b/,
    /\b100 percent\b/,
  ]);
  if (guaranteeMatch) {
    findings.push(
      makeFinding(
        "overclaim_guarantee",
        "critical",
        guaranteeMatch[0],
        "No se puede garantizar una migracion sin evidencia completa y cierre de bloqueos.",
        guaranteeMatch[0],
        "La migracion requiere evidencia completa, cierre de bloqueos y validacion adicional.",
        ["SE-GOV-CONF-001", "SE-GOV-EVID-001"],
        "confidence_missing_evidence",
      ),
    );
  }

  const zeroDowntimeMatch = findFirstMatch(normalized, [
    /\bzero downtime\b/,
    /\bcero downtime\b/,
    /\bsin downtime\b/,
    /\bsin interrupcion\b/,
    /\bno downtime\b/,
  ]);
  if (zeroDowntimeMatch) {
    findings.push(
      makeFinding(
        "overclaim_zero_downtime",
        "critical",
        zeroDowntimeMatch[0],
        "Zero downtime no se debe prometer como hecho si la ventana y la reversa no estan probadas.",
        zeroDowntimeMatch[0],
        "La ventana de migracion y el rollback deben describirse como controlados, no como cero downtime garantizado.",
        ["SE-EXE-RLB-001", "SE-GOV-CONF-001"],
        "rollback_and_gates",
      ),
    );
  }

  const backupRestoreMatch = findFirstMatch(normalized, [
    /\brvtools\b.*\brestore\b/,
    /\brestore\b.*\brvtools\b/,
    /\bbackup restore\b/,
    /\brestore test\b/,
  ]);
  if (backupRestoreMatch) {
    findings.push(
      makeFinding(
        "overclaim_backup_restore",
        "critical",
        backupRestoreMatch[0],
        "RVTools o una referencia de inventario no reemplaza un restore test validado.",
        backupRestoreMatch[0],
        "Un backup solo cuenta como evidencia cuando existe restore test fechado y validado.",
        ["SE-VMW-BKP-001", "SE-VMW-BKP-004"],
        "backup_restore_proof",
      ),
    );
  }

  const readyMatch = findFirstMatch(normalized, [
    /\bready to migrate\b/,
    /\blisto para migrar\b/,
    /\bmigration ready\b/,
    /\bgo[- ]?live ready\b/,
    /\blisto para corte\b/,
  ]);
  if (readyMatch) {
    const activeBlockers = context.activeBlockingRules ?? [];
    if (activeBlockers.length > 0 || (context.missingEvidence?.length ?? 0) > 0) {
      findings.push(
        makeFinding(
          "overclaim_ready_to_migrate",
          "critical",
          readyMatch[0],
          "No se puede declarar listo para migrar mientras existan bloqueos activos o evidencia faltante.",
          readyMatch[0],
          "El estado debe describirse como ready with blockers until the gaps are closed.",
          unique([
            ...blockingRuleCodes,
            ...(activeBlockers.length === 0 ? ["SE-GOV-EVID-001"] : []),
          ]),
          "readiness_with_blockers",
        ),
      );
    } else {
      findings.push(
        makeFinding(
          "readiness_statement_needs_trace",
          "warning",
          readyMatch[0],
          "La afirmacion de readiness deberia citar reglas, evidencias y owner de decision.",
          readyMatch[0],
          "La afirmacion debe citar reglas, evidencias y owner de decision.",
          ["SE-GOV-SCR-001", "SE-GOV-EVID-001"],
          "readiness_trace",
        ),
      );
    }
  }

  const blockerMatch = findFirstMatch(normalized, [/\bno blockers\b/, /\bsin bloqueos\b/, /\bno issues\b/]);
  if (blockerMatch && (context.activeBlockingRules?.length ?? 0) > 0) {
    findings.push(
      makeFinding(
        "blocked_claim",
        "warning",
        blockerMatch[0],
        "No se debe decir que no hay bloqueos cuando el contexto aun contiene reglas bloqueantes activas.",
        blockerMatch[0],
        "Decir que los bloqueos siguen activos y que la decision requiere cierre o override auditable.",
        blockingRuleCodes,
        "blocking_rules_visibility",
      ),
    );
  }

  if ((context.activeBlockingRules?.length ?? 0) > 0 && findings.length === 0) {
    findings.push(
      makeFinding(
        "active_blockers_present",
        "warning",
        context.activeBlockingRules?.map((rule) => rule.ruleCode).join(", ") ?? "active blockers",
        "Hay reglas bloqueantes activas en el contexto; la salida debe seguir siendo conservadora.",
        context.activeBlockingRules?.map((rule) => rule.ruleCode).join(", ") ?? "active blockers",
        "Mantener lenguaje conservador, citar bloqueos y pedir evidencias faltantes.",
        blockingRuleCodes,
        "active_blockers",
      ),
    );
  }

  const unsafePatterns: Array<{
    code: string;
    patterns: RegExp[];
    message: string;
    safeAlternative: string;
    relatedRuleCodes: string[];
    relatedMethodologyConcept: string;
    severity: "warning" | "critical";
  }> = [
    {
      code: "overclaim_no_risk",
      patterns: [/\bno risk\b/, /\bsin riesgo\b/, /\brisk free\b/],
      message: "No se debe afirmar que no hay riesgo sin evidencia completa.",
      safeAlternative: "Describir el riesgo residual y que sigue bajo control, no eliminado.",
      relatedRuleCodes: ["SE-GOV-CONF-001", "SE-GOV-EVID-001"],
      relatedMethodologyConcept: "risk_language",
      severity: "critical",
    },
    {
      code: "overclaim_production_safe",
      patterns: [/\bproduction safe\b/, /\bseguro para produccion\b/, /\bproduction ready\b/],
      message: "Production safe solo se puede usar con evidence y gates cerrados.",
      safeAlternative: "Describir el estado como listo para una decision controlada, no como seguro para produccion.",
      relatedRuleCodes: ["SE-GOV-SCR-001", "SE-EXE-RLB-001"],
      relatedMethodologyConcept: "production_readiness",
      severity: "critical",
    },
    {
      code: "overclaim_fully_validated",
      patterns: [/\bfully validated\b/, /\bcompletamente validado\b/, /\bfully checked\b/],
      message: "Fully validated no corresponde si faltan pruebas o gates.",
      safeAlternative: "Decir que la validacion es parcial o condicionada a las pruebas restantes.",
      relatedRuleCodes: ["SE-GOV-EVID-001", "SE-TGT-SYN-001"],
      relatedMethodologyConcept: "validation_completeness",
      severity: "warning",
    },
    {
      code: "overclaim_backup_without_restore",
      patterns: [/\bbackup verified without restore evidence\b/, /\bbackup verified\b.*\brestore\b/],
      message: "Un backup no se puede dar por verificado sin restore proof fechado.",
      safeAlternative: "Decir que el backup esta pendiente de restore proof validado.",
      relatedRuleCodes: ["SE-VMW-BKP-001", "SE-VMW-BKP-004"],
      relatedMethodologyConcept: "backup_restore_proof",
      severity: "critical",
    },
    {
      code: "overclaim_dependencies_without_proof",
      patterns: [/\bdependencies mapped without dependency evidence\b/, /\bdependencies mapped\b/],
      message: "Mapear dependencias sin evidencia concreta no es suficiente.",
      safeAlternative: "Decir que las dependencias estan parcialmente mapeadas y que falta evidencia de owners o ventanas.",
      relatedRuleCodes: ["SE-APP-DEP-001", "SE-APP-SLA-001"],
      relatedMethodologyConcept: "dependency_mapping",
      severity: "warning",
    },
    {
      code: "overclaim_target_ready_without_target_evidence",
      patterns: [/\bProxmox target ready without target evidence\b/, /\btarget ready\b/],
      message: "No se puede declarar listo el target sin evidencia de capacidad y validacion.",
      safeAlternative: "Decir que el target esta preparado de forma parcial y sujeto a validacion final.",
      relatedRuleCodes: ["SE-PVE-CLS-001", "SE-PVE-PBS-001", "SE-TGT-CMP-001", "SE-TGT-SYN-001"],
      relatedMethodologyConcept: "target_readiness",
      severity: "critical",
    },
    {
      code: "overclaim_performance_without_data",
      patterns: [/\bperformance validated without performance data\b/, /\bperformance validated\b/],
      message: "Performance validated requiere baseline y mediciones comparables.",
      safeAlternative: "Decir que la performance aun necesita baseline o evidencia comparativa.",
      relatedRuleCodes: ["SE-VMW-CPU-001", "SE-EXE-PER-001", "SE-TGT-SYN-001"],
      relatedMethodologyConcept: "performance_validation",
      severity: "warning",
    },
    {
      code: "overclaim_automated_migration",
      patterns: [/\bautomated migration execution\b/, /\bfully automated migration\b/],
      message: "La ejecucion automatizada de la migracion no debe prometerse como hecho.",
      safeAlternative: "Describir la migracion como controlada y con pasos automatizados parciales.",
      relatedRuleCodes: ["SE-EXE-SMK-001", "SE-EXE-WAV-001", "SE-GOV-GAT-002"],
      relatedMethodologyConcept: "execution_control",
      severity: "critical",
    },
    {
      code: "overclaim_replaces_consultant",
      patterns: [/\breplaces consultant\b/, /\bsustituye al consultor\b/],
      message: "No se debe prometer que la KB reemplaza un consultor humano.",
      safeAlternative: "Decir que la KB asiste la decision y aumenta trazabilidad, no que reemplaza el juicio humano.",
      relatedRuleCodes: ["SE-GOV-SCL-001", "SE-GOV-TRC-002"],
      relatedMethodologyConcept: "human_in_the_loop",
      severity: "warning",
    },
    {
      code: "overclaim_rvtools_generalized",
      patterns: [/\brvtools\b.*\b(validate|validates|validated|confirms)\b/],
      message: "RVTools no valida por si sola backup, dependencias ni performance.",
      safeAlternative: "Decir que RVTools aporta inventario, no validacion final de readiness.",
      relatedRuleCodes: ["SE-VMW-BKP-001", "SE-VMW-BKP-004", "SE-APP-DEP-001", "SE-EXE-PER-001"],
      relatedMethodologyConcept: "inventory_vs_validation",
      severity: "critical",
    },
  ];

  for (const spec of unsafePatterns) {
    const match = findFirstMatch(normalized, spec.patterns);
    if (!match) continue;
    findings.push(
      makeFinding(
        spec.code,
        spec.severity,
        match[0],
        spec.message,
        match[0],
        spec.safeAlternative,
        spec.relatedRuleCodes,
        spec.relatedMethodologyConcept,
      ),
    );
  }

  const missingEvidenceWarnings = unique([
    ...(context.missingEvidence ?? []).map((item) => `Falta evidencia: ${item}`),
    ...(context.activeBlockingRules ?? []).map((rule) => `Regla activa: ${rule.ruleCode}`),
  ]);

  const shouldBlock = findings.some((finding) => finding.severity === "critical");
  const summary = shouldBlock
    ? "La afirmacion requiere bloqueo o revision antes de avanzar."
    : findings.length > 0
      ? "Hay advertencias metodologicas que conviene citar en la respuesta."
      : "No se detectaron bloqueos criticos.";

  return {
    advisoryOnly: true,
    ok: findings.length === 0,
    shouldBlock,
    summary,
    findings,
    missingEvidenceWarnings,
  };
}

function buildRuleTraceExamples(rules: MethodologyRule[]) {
  return unique(
    rules.slice(0, 3).map((rule) => `${rule.ruleCode}: ${rule.title} | ${rule.sourceSection}`),
  );
}

export function buildMethodologyReportContext(
  input: MethodologyReportContextInput,
): MethodologyReportContextResult {
  const version = getActiveMethodologyVersion();
  const maxChunks = Math.min(Math.max(input.maxChunks ?? DEFAULT_MAX_CHUNKS, 0), HARD_MAX_CHUNKS);
  const maxRules = Math.min(Math.max(input.maxRules ?? 12, 0), 24);
  const searchQuery = [input.assessmentSummary, ...(input.missingEvidence ?? []), ...(input.activeBlockers ?? [])]
    .filter(Boolean)
    .join(" / ");
  const ruleSearch = searchMethodologyRules(searchQuery || version.versionLabel, {
    versionId: version.id,
    severities: ["blocking", "critical", "high", "medium"],
    status: ["active"],
    maxResults: maxRules,
  });
  const chunkSearch = searchMethodologyKnowledge(searchQuery || version.versionLabel, {
    versionId: version.id,
    intendedUses: ["advisor", "report", "scoring", "admin", "sales", "all"],
    status: ["active"],
    maxResults: maxChunks,
  });

  const relevantRules = ruleSearch.hits.map((hit) => hit.rule);
  const relevantChunks = chunkSearch.hits.map((hit) => hit.chunk);
  const noteRules = relevantRules.slice(0, 3);
  const methodologyNotes = unique([
    "La bridge para PDF debe usar fallback seguro y no depender de DB productiva.",
    "El texto de evidencia debe seguir siendo conservador cuando falte proof.",
    `Reglas relevantes: ${noteRules.map((rule) => rule.ruleCode).join(", ") || "sin reglas priorizadas"}.`,
  ]);
  const evidenceConfidenceLanguage =
    (input.missingEvidence?.length ?? 0) > 0
      ? "Confidence bounded by missing evidence and unresolved gates."
      : "Confidence can be phrased as bounded, not absolute, and still needs rule trace.";
  const missingEvidenceLanguage =
    (input.missingEvidence?.length ?? 0) > 0
      ? `Missing evidence: ${(input.missingEvidence ?? []).join(", ")}.`
      : "No missing evidence explicitly provided.";
  const blockerLanguage =
    (input.activeBlockers?.length ?? 0) > 0
      ? `Active blockers remain open: ${(input.activeBlockers ?? []).join(", ")}.`
      : "No active blockers were provided for this bridge preview.";
  const rollbackLanguage =
    "Rollback language should stay explicit: A/B path, owner, cutoff gate and decision log.";
  const safeClaims = unique([
    "This is a controlled readiness recommendation.",
    "This output is evidence-bound and still subject to go/no-go gates.",
    "The target is conditionally ready, not guaranteed or zero-risk.",
  ]);
  const ruleTraceExamples = buildRuleTraceExamples(relevantRules);

  return {
    methodologyVersion: version,
    methodologyNotes,
    evidenceConfidenceLanguage,
    missingEvidenceLanguage,
    blockerLanguage,
    rollbackLanguage,
    safeClaims,
    ruleTraceExamples,
    relevantRules,
    relevantChunks,
    searchQuery: searchQuery || version.versionLabel,
  };
}
