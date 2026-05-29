export const INPUT_LIMITS = {
  companyName: 216,
  assessmentTitle: 288,
  shortText: 288,
  description: 3600,
  notes: 3600,
  comment: 3600,
  manualTechnicalContext: 9000,
  email: 320,
  url: 2048,
  currency: 12,
} as const;

export function normalizeTextInput(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function assertMaxLength(value: string, max: number, fieldLabel: string) {
  if (value.length > max) {
    throw new Error(`${fieldLabel} must be ${max} characters or less.`);
  }
}

export function normalizeOptionalTextInput(
  value: unknown,
  fieldLabel: string,
  maxLength: number,
): string | null {
  const normalized = normalizeTextInput(value);
  if (!normalized) {
    return null;
  }

  assertMaxLength(normalized, maxLength, fieldLabel);
  return normalized;
}

export function normalizeRequiredTextInput(
  value: unknown,
  fieldLabel: string,
  maxLength: number,
): string {
  const normalized = normalizeTextInput(value);
  if (!normalized) {
    throw new Error(`${fieldLabel} is required.`);
  }

  assertMaxLength(normalized, maxLength, fieldLabel);
  return normalized;
}
