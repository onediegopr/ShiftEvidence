import { createHash, randomBytes } from "crypto";
import { mkdir, readFile, rm, writeFile } from "fs/promises";
import path from "path";
import { sanitizeOriginalFilename } from "../evidence/uploadValidation";
import {
  assertAbsolutePathInsideStorageRoot,
  getStorageRoot,
  resolveInsideStorageRoot,
} from "../evidence/localStorageService";

function sanitizeSegment(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    throw new Error("Storage path segment is required.");
  }

  return trimmed.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function sanitizeTitle(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "report";
  }

  return trimmed.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/_+/g, "_").slice(0, 60);
}

export function getReportStorageRoot() {
  return getStorageRoot();
}

function ensureDirectoryExists(directoryPath: string) {
  return mkdir(directoryPath, {
    recursive: true,
  });
}

function toRelativePath(absolutePath: string) {
  const root = getReportStorageRoot();
  const containedPath = assertAbsolutePathInsideStorageRoot(absolutePath, "Invalid report path.");
  const relative = path.relative(root, containedPath);
  return relative.split(path.sep).join("/");
}

export function buildReportStorageDirectory(params: {
  userId: string;
  workspaceId: string;
  assessmentId: string;
  reportType: string;
}) {
  return resolveInsideStorageRoot(path.join(
    "users",
    sanitizeSegment(params.userId),
    "workspaces",
    sanitizeSegment(params.workspaceId),
    "assessments",
    sanitizeSegment(params.assessmentId),
    "reports",
    sanitizeSegment(params.reportType),
  ), "Invalid report path.");
}

export function buildSafeReportFilename(params: {
  reportType: string;
  assessmentTitle: string;
  extension?: string;
}) {
  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, "-")
    .replace("T", "_")
    .replace("Z", "");
  const titleSegment = sanitizeTitle(sanitizeOriginalFilename(params.assessmentTitle));
  const reportSegment = sanitizeSegment(params.reportType);
  const randomSuffix = randomBytes(4).toString("hex");
  const extension = params.extension ?? ".pdf";

  return `shiftreadiness_${reportSegment}_${titleSegment}_${timestamp}_${randomSuffix}${extension}`;
}

export async function calculateReportSha256(buffer: Buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

export function prepareReportFileLocation(params: {
  userId: string;
  workspaceId: string;
  assessmentId: string;
  reportType: string;
  assessmentTitle: string;
  extension?: string;
}) {
  const directoryPath = buildReportStorageDirectory({
    userId: params.userId,
    workspaceId: params.workspaceId,
    assessmentId: params.assessmentId,
    reportType: params.reportType,
  });
  const storedFilename = buildSafeReportFilename({
    reportType: params.reportType,
    assessmentTitle: params.assessmentTitle,
    extension: params.extension ?? ".pdf",
  });
  const absolutePath = resolveInsideStorageRoot(path.join(toRelativePath(directoryPath), storedFilename), "Invalid report path.");

  return {
    directoryPath,
    storedFilename,
    absolutePath,
    relativePath: toRelativePath(absolutePath),
  };
}

export async function writeReportFile(params: {
  userId: string;
  workspaceId: string;
  assessmentId: string;
  reportType: string;
  assessmentTitle: string;
  buffer: Buffer;
  storedFilename?: string;
}) {
  const root = getReportStorageRoot();
  await ensureDirectoryExists(root);

  const directoryPath = buildReportStorageDirectory({
    userId: params.userId,
    workspaceId: params.workspaceId,
    assessmentId: params.assessmentId,
    reportType: params.reportType,
  });

  await ensureDirectoryExists(directoryPath);

  const storedFilename =
    params.storedFilename ??
    buildSafeReportFilename({
      reportType: params.reportType,
      assessmentTitle: params.assessmentTitle,
      extension: ".pdf",
    });
  const absolutePath = resolveInsideStorageRoot(path.join(toRelativePath(directoryPath), storedFilename), "Invalid report path.");

  await writeFile(absolutePath, params.buffer);

  return {
    storedFilename,
    absolutePath,
    relativePath: toRelativePath(absolutePath),
    fileHash: await calculateReportSha256(params.buffer),
    sizeBytes: params.buffer.byteLength,
    mimeType: "application/pdf",
  };
}

export function resolveReportAbsolutePath(relativePath: string) {
  return resolveInsideStorageRoot(relativePath, "Invalid report path.");
}

export async function readReportFile(relativePath: string) {
  const absolutePath = resolveReportAbsolutePath(relativePath);
  return readFile(absolutePath);
}

export async function deletePhysicalReportIfExists(relativePath: string) {
  const absolutePath = resolveReportAbsolutePath(relativePath);
  await rm(absolutePath, {
    force: true,
  });
}
