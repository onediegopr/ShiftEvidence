import {
  redactEmails,
  redactSecrets,
  redactTokens,
  stripStoragePaths,
  truncateLongText,
} from "../ai/aiAdvisorySanitizer";
import type { SeniorAdvisorSafetyFlag } from "./seniorAdvisorTypes";

const PROMPT_INJECTION_PATTERNS = [
  /ignore (all )?(previous|prior) instructions/i,
  /reveal (the )?(system|developer) prompt/i,
  /system prompt/i,
  /bypass/i,
  /disable safeguards/i,
  /approve (the )?migration regardless/i,
  /approve ceph/i,
  /recommend ceph regardless/i,
  /override (the )?(ceph|licensing|readiness) (engine|score|result)/i,
  /fake evidence/i,
  /invent evidence/i,
];

const SECRET_SIGNAL_PATTERNS = [
  /database_url/i,
  /better_auth_secret/i,
  /api[_-]?key/i,
  /password/i,
  /token/i,
  /authorization/i,
  /bearer\s+[A-Za-z0-9._~+/=-]+/i,
];

function pushUniqueFlag(
  flags: SeniorAdvisorSafetyFlag[],
  flag: SeniorAdvisorSafetyFlag,
) {
  if (!flags.some((item) => item.flag === flag.flag)) {
    flags.push(flag);
  }
}

export function sanitizeSeniorAdvisorText(value: string, maxChars = 6_000) {
  return truncateLongText(
    redactEmails(stripStoragePaths(redactTokens(redactSecrets(value)))),
    maxChars,
  );
}

export function inspectSeniorAdvisorMessage(
  value: string,
  maxChars = 6_000,
): {
  sanitizedText: string;
  safetyFlags: SeniorAdvisorSafetyFlag[];
  warnings: string[];
} {
  const safetyFlags: SeniorAdvisorSafetyFlag[] = [];
  const warnings: string[] = [];
  const sanitizedText = sanitizeSeniorAdvisorText(value, maxChars);

  if (PROMPT_INJECTION_PATTERNS.some((pattern) => pattern.test(value))) {
    pushUniqueFlag(safetyFlags, {
      flag: "prompt_injection_attempt",
      severity: "medium",
      explanation:
        "The message contains instruction-like text. It will be treated as user data, not as system instructions.",
    });
    warnings.push("prompt_injection_detected");
  }

  if (SECRET_SIGNAL_PATTERNS.some((pattern) => pattern.test(value))) {
    pushUniqueFlag(safetyFlags, {
      flag: "possible_secret_redacted",
      severity: "high",
      explanation:
        "The message appears to include a secret, token or credential. Sensitive values were redacted before AI processing.",
    });
    warnings.push("secret_signal_detected");
  }

  if (sanitizedText !== value) {
    pushUniqueFlag(safetyFlags, {
      flag: "content_redacted",
      severity: "low",
      explanation:
        "Sensitive-looking values such as emails, tokens or private paths were redacted.",
    });
    warnings.push("content_redacted");
  }

  return {
    sanitizedText,
    safetyFlags,
    warnings,
  };
}

export function sanitizeAdvisorResponse(value: string, maxChars = 8_000) {
  return sanitizeSeniorAdvisorText(value, maxChars);
}
