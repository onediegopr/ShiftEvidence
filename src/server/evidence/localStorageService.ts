import { createHash, randomBytes } from "crypto";
import { mkdir, readFile, rm, writeFile } from "fs/promises";
import path from "path";
import { sanitizeOriginalFilename } from "./uploadValidation";

const DEFAULT_STORAGE_ROOT = "storage";

function sanitizeSegment(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    throw new Error("Storage path segment is required.");
  }

  return trimmed.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export function getStorageRoot() {
  const configuredRoot = process.env.HOSTINGER_STORAGE_ROOT?.trim();

  if (configuredRoot && path.isAbsolute(configuredRoot)) {
    return path.normalize(configuredRoot);
  }

  return path.join(/*turbopackIgnore: true*/ process.cwd(), DEFAULT_STORAGE_ROOT);
}

async function ensureDirectoryExists(directoryPath: string) {
  await mkdir(directoryPath, {
    recursive: true,
  });
}

function toRelativePath(absolutePath: string) {
  const root = getStorageRoot();
  const relative = path.relative(root, absolutePath);
  return relative.split(path.sep).join("/");
}

function buildAssessmentUploadDirectory(params: {
  userId: string;
  workspaceId: string;
  assessmentId: string;
  evidenceType: string;
}) {
  const root = getStorageRoot();
  const userSegment = sanitizeSegment(params.userId);
  const workspaceSegment = sanitizeSegment(params.workspaceId);
  const assessmentSegment = sanitizeSegment(params.assessmentId);
  const evidenceSegment = sanitizeSegment(params.evidenceType);

  return path.join(
    root,
    "users",
    userSegment,
    "workspaces",
    workspaceSegment,
    "assessments",
    assessmentSegment,
    "uploads",
    evidenceSegment,
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
  const root = getStorageRoot();
  await ensureDirectoryExists(root);

  const directoryPath = buildAssessmentUploadDirectory({
    userId: params.userId,
    workspaceId: params.workspaceId,
    assessmentId: params.assessmentId,
    evidenceType: params.evidenceType,
  });

  await ensureDirectoryExists(directoryPath);

  const storedFilename = buildSafeStoredFilename({
    evidenceType: params.evidenceType,
    originalFilename: params.originalFilename,
    extension: params.extension,
  });
  const absolutePath = path.join(directoryPath, storedFilename);

  await writeFile(absolutePath, params.buffer);

  return {
    storedFilename,
    absolutePath,
    relativePath: toRelativePath(absolutePath),
    fileHash: await calculateSha256(params.buffer),
    sizeBytes: params.buffer.byteLength,
    mimeType: params.mimeType?.trim() || null,
  };
}

export function resolveEvidenceAbsolutePath(relativePath: string) {
  const root = getStorageRoot();
  const normalizedRelativePath = relativePath.replaceAll("/", path.sep);
  const absolutePath = path.resolve(root, normalizedRelativePath);
  const rootWithSeparator = root.endsWith(path.sep) ? root : `${root}${path.sep}`;

  if (absolutePath !== root && !absolutePath.startsWith(rootWithSeparator)) {
    throw new Error("Invalid evidence path.");
  }

  return absolutePath;
}

export async function readEvidenceFile(relativePath: string) {
  const absolutePath = resolveEvidenceAbsolutePath(relativePath);
  return readFile(absolutePath);
}

export async function deletePhysicalFileIfExists(relativePath: string) {
  const absolutePath = resolveEvidenceAbsolutePath(relativePath);
  await rm(absolutePath, {
    force: true,
  });
}
