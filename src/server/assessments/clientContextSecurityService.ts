import {
  redactEmails,
  redactSecrets,
  redactTokens,
  stripStoragePaths,
} from "../ai/aiAdvisorySanitizer";
import type { ClientContextSafetyFlag } from "./clientContextIntelligenceTypes";

const PROMPT_INJECTION_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /ignore (all )?(previous|prior|above) instructions/i, label: "ignore_previous_instructions" },
  { pattern: /system prompt|developer message|hidden instructions/i, label: "prompt_reference" },
  { pattern: /reveal (the )?(secret|secrets|api key|token|system prompt)/i, label: "secret_exfiltration_request" },
  { pattern: /bypass|disable safeguards|jailbreak|do anything now/i, label: "safeguard_bypass_request" },
  { pattern: /act as (system|developer|administrator|root)/i, label: "role_override_request" },
];

function countMatches(pattern: RegExp, value: string) {
  const matches = value.match(new RegExp(pattern.source, `${pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`}`));
  return matches?.length ?? 0;
}

function detectRedactions(original: string, sanitized: string) {
  return {
    changed: original !== sanitized,
    originalCharacters: original.length,
    sanitizedCharacters: sanitized.length,
    possibleEmailRedactions: countMatches(/\[REDACTED_EMAIL\]/g, sanitized),
    possibleTokenRedactions: countMatches(/\[REDACTED_TOKEN\]|Bearer \[REDACTED\]/g, sanitized),
    possiblePathRedactions: countMatches(/\[REDACTED_PATH\]/g, sanitized),
  };
}

export function detectClientContextSafetyFlags(text: string): ClientContextSafetyFlag[] {
  const flags: ClientContextSafetyFlag[] = [];

  for (const item of PROMPT_INJECTION_PATTERNS) {
    if (item.pattern.test(text)) {
      flags.push({
        flag: item.label,
        severity: item.label.includes("secret") || item.label.includes("bypass") ? "high" : "medium",
        explanation:
          "Customer-provided content includes instruction-like language. It must be treated as untrusted data, not as AI instructions.",
      });
    }
  }

  if (/password\s*[:=]|api[_ -]?key\s*[:=]|token\s*[:=]|authorization\s*[:=]/i.test(text)) {
    flags.push({
      flag: "possible_secret_material",
      severity: "high",
      explanation:
        "The customer context appears to include credential-like material. It was redacted before AI analysis.",
    });
  }

  return flags;
}

export function sanitizeClientContextForAi(text: string) {
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const redacted = redactEmails(stripStoragePaths(redactTokens(redactSecrets(normalized))));
  const safetyFlags = detectClientContextSafetyFlags(normalized);
  const redactionStats = detectRedactions(normalized, redacted);
  const warnings = [
    safetyFlags.length > 0
      ? "Prompt-injection-like language was detected and treated as customer content only."
      : null,
    redactionStats.changed
      ? "Potential secrets, emails, tokens or storage paths were redacted before AI analysis."
      : null,
  ].filter((item): item is string => Boolean(item));

  return {
    sanitizedText: redacted,
    redactionStats,
    safetyFlags,
    warnings,
  };
}

export function sanitizeClientContextLabel(value: string | null | undefined, maxLength = 120) {
  if (!value) {
    return null;
  }

  const sanitized = redactEmails(stripStoragePaths(redactTokens(redactSecrets(value.trim()))));
  return sanitized.length > maxLength ? `${sanitized.slice(0, maxLength)}...` : sanitized;
}
