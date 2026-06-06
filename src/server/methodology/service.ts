import { getActiveMethodologyVersion, listMethodologyKnowledgeChunks, listMethodologyRules } from "./registry";
import { searchMethodologyKnowledge } from "./search";
import type {
  MethodologyAdvisorContextInput,
  MethodologyAdvisorContextResult,
  MethodologyClaimFinding,
  MethodologyClaimValidationContext,
  MethodologyClaimValidationResult,
  MethodologyKnowledgeChunk,
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

function makeFinding(
  code: string,
  severity: "warning" | "critical",
  message: string,
  matchedText: string,
  relatedRuleCodes: string[],
): MethodologyClaimFinding {
  return {
    code,
    severity,
    message,
    matchedText,
    relatedRuleCodes: unique(relatedRuleCodes),
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
  const version = getActiveMethodologyVersion();
  const maxChunks = Math.min(Math.max(input.maxChunks ?? DEFAULT_MAX_CHUNKS, 0), HARD_MAX_CHUNKS);
  const searchQuery = [input.question, input.assessmentContext?.environmentSummary].filter(Boolean).join(" / ");
  const searchResult = searchMethodologyKnowledge(searchQuery || input.question, {
    versionId: version.id,
    intendedUses: ["advisor", "scoring", "report", "admin"],
    status: ["active"],
    maxResults: maxChunks,
  });

  const selectedChunks =
    searchResult.hits.length > 0
      ? searchResult.hits.map((hit) => hit.chunk)
      : buildFallbackChunks(maxChunks);

  const keywordRuleCodes = getKeywordRuleCodes(input.question);
  const chunkRuleCodes = collectRuleCodesFromChunks(selectedChunks);
  const ruleCodes = unique([...keywordRuleCodes, ...chunkRuleCodes]);
  const selectedRules = listMethodologyRules({
    versionId: version.id,
    status: ["active"],
    ruleCodes,
  });

  const missingEvidenceWarnings = unique([
    ...(input.assessmentContext?.missingEvidence ?? []).map((item) => `Falta evidencia: ${item}`),
    ...(input.assessmentContext?.keyRisks ?? []).map((item) => `Riesgo declarado: ${item}`),
  ]);

  return {
    version,
    rules: selectedRules,
    chunks: selectedChunks,
    missingEvidenceWarnings,
    searchQuery: searchQuery || input.question,
    limits: {
      maxChunks,
      selectedRules: selectedRules.length,
      selectedChunks: selectedChunks.length,
    },
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
        "No se puede garantizar una migracion sin evidencia completa y cierre de bloqueos.",
        guaranteeMatch[0],
        ["SE-GOV-CONF-001", "SE-GOV-EVID-001"],
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
        "Zero downtime no se debe prometer como hecho si la ventana y la reversa no estan probadas.",
        zeroDowntimeMatch[0],
        ["SE-EXE-RLB-001", "SE-GOV-CONF-001"],
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
        "RVTools o una referencia de inventario no reemplaza un restore test validado.",
        backupRestoreMatch[0],
        ["SE-VMW-BKP-001", "SE-VMW-BKP-004"],
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
          "No se puede declarar listo para migrar mientras existan bloqueos activos o evidencia faltante.",
          readyMatch[0],
          unique([
            ...blockingRuleCodes,
            ...(activeBlockers.length === 0 ? ["SE-GOV-EVID-001"] : []),
          ]),
        ),
      );
    } else {
      findings.push(
        makeFinding(
          "readiness_statement_needs_trace",
          "warning",
          "La afirmacion de readiness deberia citar reglas, evidencias y owner de decision.",
          readyMatch[0],
          ["SE-GOV-SCR-001", "SE-GOV-EVID-001"],
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
        "No se debe decir que no hay bloqueos cuando el contexto aun contiene reglas bloqueantes activas.",
        blockerMatch[0],
        blockingRuleCodes,
      ),
    );
  }

  if ((context.activeBlockingRules?.length ?? 0) > 0 && findings.length === 0) {
    findings.push(
      makeFinding(
        "active_blockers_present",
        "warning",
        "Hay reglas bloqueantes activas en el contexto; la salida debe seguir siendo conservadora.",
        context.activeBlockingRules?.map((rule) => rule.ruleCode).join(", ") ?? "active blockers",
        blockingRuleCodes,
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
