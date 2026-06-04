import { createHash, randomBytes } from "node:crypto";
import { sanitizeOriginalFilename } from "../evidence/uploadValidation";
import {
  getStorageRoot,
  joinStorageRelativePath,
  resolveInsideStorageRoot,
  toStorageRelativePath,
} from "../evidence/storagePaths";
import { deleteStorageObject, readStorageObject, writeStorageObject } from "../evidence/storageService";

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

function buildReportRelativeDirectory(params: {
  userId: string;
  workspaceId: string;
  assessmentId: string;
  reportType: string;
}) {
  return joinStorageRelativePath(
    "users",
    sanitizeSegment(params.userId),
    "workspaces",
    sanitizeSegment(params.workspaceId),
    "assessments",
    sanitizeSegment(params.assessmentId),
    "reports",
    sanitizeSegment(params.reportType),
  );
}

export function buildReportStorageDirectory(params: {
  userId: string;
  workspaceId: string;
  assessmentId: string;
  reportType: string;
}) {
  return resolveInsideStorageRoot(buildReportRelativeDirectory(params), "Invalid report path.");
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
  const relativePath = joinStorageRelativePath(
    buildReportRelativeDirectory({
      userId: params.userId,
      workspaceId: params.workspaceId,
      assessmentId: params.assessmentId,
      reportType: params.reportType,
    }),
    storedFilename,
  );
  const absolutePath = resolveInsideStorageRoot(relativePath, "Invalid report path.");

  return {
    directoryPath,
    storedFilename,
    absolutePath,
    relativePath: toStorageRelativePath(absolutePath),
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
  const relativeDirectoryPath = buildReportRelativeDirectory({
    userId: params.userId,
    workspaceId: params.workspaceId,
    assessmentId: params.assessmentId,
    reportType: params.reportType,
  });

  const storedFilename =
    params.storedFilename ??
    buildSafeReportFilename({
      reportType: params.reportType,
      assessmentTitle: params.assessmentTitle,
      extension: ".pdf",
    });
  const relativePath = joinStorageRelativePath(relativeDirectoryPath, storedFilename);
  const persisted = await writeStorageObject(relativePath, params.buffer, "application/pdf");

  return {
    storedFilename,
    absolutePath: persisted.absolutePath,
    relativePath: persisted.relativePath,
    fileHash: await calculateReportSha256(params.buffer),
    sizeBytes: persisted.sizeBytes,
    mimeType: "application/pdf",
  };
}

export function resolveReportAbsolutePath(relativePath: string) {
  return resolveInsideStorageRoot(relativePath, "Invalid report path.");
}

export async function readReportFile(relativePath: string) {
  return readStorageObject(relativePath);
}

export async function deletePhysicalReportIfExists(relativePath: string) {
  await deleteStorageObject(relativePath);
}
