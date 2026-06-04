import path from "node:path";

export const DEFAULT_STORAGE_ROOT = "storage";

export function sanitizeSegment(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    throw new Error("Storage path segment is required.");
  }

  return trimmed.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export function normalizeStorageRelativePath(relativePath: string, errorMessage = "Invalid storage path.") {
  const trimmed = relativePath.trim();

  if (!trimmed) {
    throw new Error(errorMessage);
  }

  const normalized = trimmed.replaceAll("\\", "/");

  if (path.posix.isAbsolute(normalized) || path.win32.isAbsolute(normalized)) {
    throw new Error(errorMessage);
  }

  const segments = normalized.split("/");

  if (segments.some((segment) => segment === "" || segment === "." || segment === "..")) {
    throw new Error(errorMessage);
  }

  return segments.join("/");
}

export function joinStorageRelativePath(...segments: string[]) {
  return normalizeStorageRelativePath(segments.join("/"));
}

function assertInsideStorageRoot(storageRoot: string, absolutePath: string, errorMessage: string) {
  const resolvedRoot = path.resolve(storageRoot);
  const resolvedTarget = path.resolve(absolutePath);
  const rootWithSeparator = resolvedRoot.endsWith(path.sep) ? resolvedRoot : `${resolvedRoot}${path.sep}`;

  if (resolvedTarget !== resolvedRoot && !resolvedTarget.startsWith(rootWithSeparator)) {
    throw new Error(errorMessage);
  }

  return resolvedTarget;
}

export function getStorageRoot() {
  const configuredRoot = process.env.HOSTINGER_STORAGE_ROOT?.trim();

  if (configuredRoot && path.isAbsolute(configuredRoot)) {
    return path.resolve(configuredRoot);
  }

  return path.resolve(process.cwd(), DEFAULT_STORAGE_ROOT);
}

export function assertAbsolutePathInsideStorageRoot(absolutePath: string, errorMessage = "Invalid storage path.") {
  return assertInsideStorageRoot(getStorageRoot(), absolutePath, errorMessage);
}

export function resolveInsideStorageRoot(relativePath: string, errorMessage = "Invalid storage path.") {
  const normalizedRelativePath = normalizeStorageRelativePath(relativePath, errorMessage).replaceAll("/", path.sep);

  const root = getStorageRoot();
  return assertInsideStorageRoot(root, path.resolve(root, normalizedRelativePath), errorMessage);
}

export function toStorageRelativePath(absolutePath: string, errorMessage = "Invalid storage path.") {
  const containedPath = assertAbsolutePathInsideStorageRoot(absolutePath, errorMessage);
  const relative = path.relative(getStorageRoot(), containedPath);
  return normalizeStorageRelativePath(relative.split(path.sep).join("/"), errorMessage);
}
