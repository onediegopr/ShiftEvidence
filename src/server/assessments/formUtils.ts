export function parseOptionalString(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function parseRequiredString(value: FormDataEntryValue | null, fieldName: string) {
  const parsed = parseOptionalString(value);

  if (!parsed) {
    throw new Error(`${fieldName} is required.`);
  }

  return parsed;
}

export function parseBooleanField(value: FormDataEntryValue | null) {
  return value === "on" || value === "true" || value === "1";
}

export function parseOptionalNumber(
  value: FormDataEntryValue | null,
  options?: {
    fieldName?: string;
    integer?: boolean;
    min?: number;
    max?: number;
  },
) {
  if (value === null || value === "") {
    return null;
  }

  const raw = typeof value === "string" ? value.trim() : String(value);
  if (!raw) {
    return null;
  }

  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    throw new Error(`${options?.fieldName ?? "Value"} must be a valid number.`);
  }

  if (options?.integer && !Number.isInteger(parsed)) {
    throw new Error(`${options?.fieldName ?? "Value"} must be an integer.`);
  }

  if (typeof options?.min === "number" && parsed < options.min) {
    throw new Error(`${options?.fieldName ?? "Value"} must be greater than or equal to ${options.min}.`);
  }

  if (typeof options?.max === "number" && parsed > options.max) {
    throw new Error(`${options?.fieldName ?? "Value"} must be less than or equal to ${options.max}.`);
  }

  return parsed;
}

export function safeRedirectError(message: string) {
  return encodeURIComponent(message);
}
