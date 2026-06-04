import { createHash, randomBytes } from "node:crypto";
import path from "node:path";
import { sanitizeOriginalFilename } from "./uploadValidation";
import { joinStorageRelativePath, resolveInsideStorageRoot } from "./storagePaths";
import { deleteStorageObject, readStorageObject, writeStorageObject } from "./storageService";

function sanitizeSegment(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    throw new Error("Storage path segment is required.");
  }

  return trimmed.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function buildAssessmentUploadRelativePath(params: {
  userId: string;
  workspaceId: string;
  assessmentId: string;
  evidenceType: string;
}) {
  return joinStorageRelativePath(
    "users",
    sanitizeSegment(params.userId),
    "workspaces",
    sanitizeSegment(params.workspaceId),
    "assessments",
    sanitizeSegment(params.assessmentId),
    "uploads",
    sanitizeSegment(params.evidenceType),
  );
}

export function buildSafeStoredFilename(params: {
  evidenceType: string;
  originalFilename: string;
  extension: string;
}) {
  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, "-")
    .replace("T", "_")
    .replace("Z", "");
  const original = sanitizeOriginalFilename(params.originalFilename);
  const baseName = path
    .parse(original)
    .name.replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 40);
  const randomSuffix = randomBytes(4).toString("hex");
  const evidenceSegment = sanitizeSegment(params.evidenceType);

  return `${evidenceSegment}_${timestamp}_${baseName || "evidence"}_${randomSuffix}${params.extension}`;
}

export async function calculateSha256(buffer: Buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

export async function writeUploadedFile(params: {
  userId: string;
  workspaceId: string;
  assessmentId: string;
  evidenceType: string;
  originalFilename: string;
  extension: string;
  mimeType?: string | null;
  buffer: Buffer;
}) {
  const relativeDirectoryPath = buildAssessmentUploadRelativePath({
    userId: params.userId,
    workspaceId: params.workspaceId,
    assessmentId: params.assessmentId,
    evidenceType: params.evidenceType,
  });

  const storedFilename = buildSafeStoredFilename({
    evidenceType: params.evidenceType,
    originalFilename: params.originalFilename,
    extension: params.extension,
  });
  const relativePath = joinStorageRelativePath(relativeDirectoryPath, storedFilename);
  const persisted = await writeStorageObject(relativePath, params.buffer, params.mimeType);

  return {
    storedFilename,
    absolutePath: persisted.absolutePath,
    relativePath: persisted.relativePath,
    fileHash: await calculateSha256(params.buffer),
    sizeBytes: persisted.sizeBytes,
    mimeType: persisted.mimeType,
  };
}

export function resolveEvidenceAbsolutePath(relativePath: string) {
  return resolveInsideStorageRoot(relativePath, "Invalid evidence path.");
}

export async function readEvidenceFile(relativePath: string) {
  return readStorageObject(relativePath);
}

export async function deletePhysicalFileIfExists(relativePath: string) {
  await deleteStorageObject(relativePath);
}

export { assertAbsolutePathInsideStorageRoot, getStorageRoot, toStorageRelativePath } from "./storagePaths";
