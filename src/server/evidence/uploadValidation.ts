import { EvidenceType } from "@prisma/client";

const DEFAULT_MAX_UPLOAD_SIZE_MB = 50;

const evidenceTypeExtensions: Record<EvidenceType, string[]> = {
  rvtools: [".xlsx", ".xls", ".csv"],
  manual_csv: [".csv"],
  veeam: [".xlsx", ".xls", ".csv"],
  proxmox: [".xlsx", ".xls", ".csv"],
  network: [".xlsx", ".xls", ".csv"],
  cmdb: [".xlsx", ".xls", ".csv"],
  other: [".csv", ".txt", ".xlsx", ".xls"],
};

const evidenceTypeMimeTypes: Record<EvidenceType, string[]> = {
  rvtools: [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
    "text/csv",
    "application/csv",
    "application/octet-stream",
  ],
  manual_csv: ["text/csv", "application/csv", "application/octet-stream"],
  veeam: [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
    "text/csv",
    "application/csv",
    "application/octet-stream",
  ],
  proxmox: [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
    "text/csv",
    "application/csv",
    "application/octet-stream",
  ],
  network: [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
    "text/csv",
    "application/csv",
    "application/octet-stream",
  ],
  cmdb: [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
    "text/csv",
    "application/csv",
    "application/octet-stream",
  ],
  other: [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
    "text/csv",
    "application/csv",
    "text/plain",
    "application/octet-stream",
  ],
};

export const allowedEvidenceTypes = Object.values(EvidenceType);

export function getMaxUploadSizeBytes() {
  const configured = Number(process.env.MAX_UPLOAD_SIZE_MB ?? "");

  const maxUploadSizeMb =
    Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_MAX_UPLOAD_SIZE_MB;

  return Math.round(maxUploadSizeMb * 1024 * 1024);
}

export function normalizeExtension(filename: string) {
  const lastDot = filename.lastIndexOf(".");

  if (lastDot < 0) {
    return "";
  }

  return filename.slice(lastDot).trim().toLowerCase();
}

export function inferEvidenceTypeFromForm(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    throw new Error("Evidence type is required.");
  }

  const normalized = value.trim();
  if (!normalized) {
    throw new Error("Evidence type is required.");
  }

  if (!allowedEvidenceTypes.includes(normalized as EvidenceType)) {
    throw new Error("Unsupported evidence type.");
  }

  return normalized as EvidenceType;
}

export function isAllowedEvidenceExtension(evidenceType: EvidenceType, extension: string) {
  return evidenceTypeExtensions[evidenceType].includes(extension.toLowerCase());
}

export function isAllowedMimeType(
  evidenceType: EvidenceType,
  mimeType: string | null | undefined,
  extension: string,
) {
  if (!mimeType) {
    return true;
  }

  const normalizedMime = mimeType.trim().toLowerCase();
  if (!normalizedMime) {
    return true;
  }

  if (normalizedMime === "application/octet-stream") {
    return isAllowedEvidenceExtension(evidenceType, extension);
  }

  return evidenceTypeMimeTypes[evidenceType].includes(normalizedMime);
}

export function sanitizeOriginalFilename(filename: string) {
  const baseName = filename.split(/[\\/]/).pop() ?? filename;
  const sanitized = Array.from(baseName)
    .filter((char) => {
      const code = char.charCodeAt(0);
      return code >= 32 && code !== 127;
    })
    .join("")
    .trim();

  return sanitized || "evidence-file";
}

export function validateEvidenceUpload(params: {
  file: File;
  evidenceType: EvidenceType;
}) {
  const { file, evidenceType } = params;

  if (!file) {
    throw new Error("File is required.");
  }

  if (file.size <= 0) {
    throw new Error("File is empty.");
  }

  const maxUploadSizeBytes = getMaxUploadSizeBytes();
  if (file.size > maxUploadSizeBytes) {
    throw new Error(
      `File is too large. Maximum allowed size is ${Math.round(maxUploadSizeBytes / 1024 / 1024)} MB.`,
    );
  }

  const originalFilename = sanitizeOriginalFilename(file.name);
  const extension = normalizeExtension(originalFilename);

  if (!extension) {
    throw new Error("File extension is required.");
  }

  if (!isAllowedEvidenceExtension(evidenceType, extension)) {
    throw new Error("Unsupported file type for the selected evidence category.");
  }

  if (!isAllowedMimeType(evidenceType, file.type, extension)) {
    throw new Error("Unsupported MIME type for the selected evidence category.");
  }

  return {
    evidenceType,
    originalFilename,
    extension,
    mimeType: file.type?.trim() || null,
    sizeBytes: file.size,
  };
}
