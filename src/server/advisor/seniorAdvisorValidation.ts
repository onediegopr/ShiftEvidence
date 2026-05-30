import type { SeniorAdvisorPlanLimits } from "./seniorAdvisorTypes";

export type SeniorAdvisorValidationResult =
  | { ok: true; normalizedMessage: string }
  | { ok: false; code: "empty_message" | "message_too_long"; message: string };

export function validateSeniorAdvisorUserMessage(params: {
  message: unknown;
  limits: SeniorAdvisorPlanLimits;
}): SeniorAdvisorValidationResult {
  if (typeof params.message !== "string") {
    return {
      ok: false,
      code: "empty_message",
      message: "Enter a question for the Senior Migration Advisor.",
    };
  }

  const normalizedMessage = params.message.trim();
  if (!normalizedMessage) {
    return {
      ok: false,
      code: "empty_message",
      message: "Enter a question for the Senior Migration Advisor.",
    };
  }

  if (
    params.limits.maxUserMessageChars > 0 &&
    normalizedMessage.length > params.limits.maxUserMessageChars
  ) {
    return {
      ok: false,
      code: "message_too_long",
      message: `Your message is too long for this plan. Keep it under ${params.limits.maxUserMessageChars.toLocaleString(
        "en-US",
      )} characters.`,
    };
  }

  return { ok: true, normalizedMessage };
}
