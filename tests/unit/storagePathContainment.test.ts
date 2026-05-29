import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  assertAbsolutePathInsideStorageRoot,
  getStorageRoot,
  resolveInsideStorageRoot,
} from "../../src/server/evidence/localStorageService";

describe("local storage path containment", () => {
  const originalStorageRoot = process.env.HOSTINGER_STORAGE_ROOT;
  const testStorageRoot = path.join(process.cwd(), ".tmp-test-storage-root");

  beforeEach(() => {
    process.env.HOSTINGER_STORAGE_ROOT = testStorageRoot;
  });

  afterEach(() => {
    process.env.HOSTINGER_STORAGE_ROOT = originalStorageRoot;
  });

  it("resolves legitimate relative paths inside the storage root", () => {
    const resolved = resolveInsideStorageRoot(path.join("users", "user-1", "file.txt"));
    const root = getStorageRoot();

    expect(resolved).toBe(path.join(root, "users", "user-1", "file.txt"));
    expect(resolved.startsWith(`${root}${path.sep}`)).toBe(true);
  });

  it("allows legitimate nested subfolders", () => {
    const resolved = resolveInsideStorageRoot(path.join("users", "u", "workspaces", "w", "file.csv"));
    expect(resolved).toContain(`${path.sep}workspaces${path.sep}`);
  });

  it("rejects parent directory traversal", () => {
    expect(() => resolveInsideStorageRoot(path.join("..", "escape.txt"))).toThrow("Invalid storage path.");
  });

  it("rejects absolute external paths", () => {
    const outsidePath = path.resolve(process.cwd(), "outside-storage.txt");
    expect(() => resolveInsideStorageRoot(outsidePath)).toThrow("Invalid storage path.");
  });

  it("rejects deceptive absolute path prefixes", () => {
    const deceptivePrefixPath = path.join(`${getStorageRoot()}2`, "file.txt");
    expect(() => assertAbsolutePathInsideStorageRoot(deceptivePrefixPath)).toThrow("Invalid storage path.");
  });
});
