import { existsSync } from "node:fs";
import { rm } from "node:fs/promises";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  deleteStorageObject,
  getR2StorageConfig,
  getStorageDriver,
  getStorageRelativePath,
  headStorageObject,
  readStorageObject,
  writeStorageObject,
} from "../../src/server/evidence/storageService";

const awsMocks = vi.hoisted(() => {
  const send = vi.fn();
  const clientConfig = vi.fn();

  class BaseCommand {
    input: unknown;

    constructor(input: unknown) {
      this.input = input;
    }
  }

  class FakeS3Client {
    send = send;

    constructor(config: unknown) {
      clientConfig(config);
    }
  }

  return {
    send,
    clientConfig,
    BaseCommand,
    FakeS3Client,
  };
});

vi.mock("@aws-sdk/client-s3", () => ({
  DeleteObjectCommand: class DeleteObjectCommand extends awsMocks.BaseCommand {},
  GetObjectCommand: class GetObjectCommand extends awsMocks.BaseCommand {},
  HeadObjectCommand: class HeadObjectCommand extends awsMocks.BaseCommand {},
  PutObjectCommand: class PutObjectCommand extends awsMocks.BaseCommand {},
  S3Client: awsMocks.FakeS3Client,
}));

describe("storage service", () => {
  const originalEnv = {
    STORAGE_DRIVER: process.env.STORAGE_DRIVER,
    HOSTINGER_STORAGE_ROOT: process.env.HOSTINGER_STORAGE_ROOT,
    R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID,
    R2_S3_ENDPOINT: process.env.R2_S3_ENDPOINT,
    R2_BUCKET_PREVIEW: process.env.R2_BUCKET_PREVIEW,
    R2_BUCKET_PROD: process.env.R2_BUCKET_PROD,
    R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
    VERCEL_ENV: process.env.VERCEL_ENV,
  } as const;
  const testStorageRoot = path.join(process.cwd(), ".tmp-storage-service-tests");

  function restoreEnv(name: keyof typeof originalEnv) {
    const value = originalEnv[name];

    if (value === undefined) {
      delete process.env[name];
      return;
    }

    process.env[name] = value;
  }

  beforeEach(async () => {
    awsMocks.send.mockReset();
    awsMocks.clientConfig.mockReset();

    restoreEnv("STORAGE_DRIVER");
    restoreEnv("HOSTINGER_STORAGE_ROOT");
    restoreEnv("R2_ACCOUNT_ID");
    restoreEnv("R2_S3_ENDPOINT");
    restoreEnv("R2_BUCKET_PREVIEW");
    restoreEnv("R2_BUCKET_PROD");
    restoreEnv("R2_ACCESS_KEY_ID");
    restoreEnv("R2_SECRET_ACCESS_KEY");
    restoreEnv("VERCEL_ENV");

    await rm(testStorageRoot, { recursive: true, force: true });
  });

  afterEach(async () => {
    await rm(testStorageRoot, { recursive: true, force: true });

    restoreEnv("STORAGE_DRIVER");
    restoreEnv("HOSTINGER_STORAGE_ROOT");
    restoreEnv("R2_ACCOUNT_ID");
    restoreEnv("R2_S3_ENDPOINT");
    restoreEnv("R2_BUCKET_PREVIEW");
    restoreEnv("R2_BUCKET_PROD");
    restoreEnv("R2_ACCESS_KEY_ID");
    restoreEnv("R2_SECRET_ACCESS_KEY");
    restoreEnv("VERCEL_ENV");
  });

  it("defaults to local storage and rejects unsupported drivers", () => {
    delete process.env.STORAGE_DRIVER;
    expect(getStorageDriver()).toBe("local");

    process.env.STORAGE_DRIVER = "cloud";
    expect(() => getStorageDriver()).toThrow('Unsupported STORAGE_DRIVER value "cloud". Expected "local" or "r2".');
  });

  it("returns a safe relative path and rejects traversal attempts", () => {
    expect(getStorageRelativePath("users/demo/uploads/file.txt")).toBe("users/demo/uploads/file.txt");
    expect(getStorageRelativePath("users\\demo\\uploads\\file.txt")).toBe("users/demo/uploads/file.txt");
    expect(() => getStorageRelativePath("../escape.txt")).toThrow("Invalid storage path.");
    expect(() => getStorageRelativePath("/absolute/escape.txt")).toThrow("Invalid storage path.");
    expect(() => getStorageRelativePath("C:\\escape.txt")).toThrow("Invalid storage path.");
  });

  it("builds R2 config from preview and production env vars", () => {
    process.env.STORAGE_DRIVER = "r2";
    process.env.R2_ACCOUNT_ID = "account-123";
    process.env.R2_S3_ENDPOINT = "https://account-123.r2.cloudflarestorage.com";
    process.env.R2_BUCKET_PREVIEW = "shift-evidence-preview-evidence";
    process.env.R2_BUCKET_PROD = "shift-evidence-prod-evidence";
    process.env.R2_ACCESS_KEY_ID = "preview-access-key";
    process.env.R2_SECRET_ACCESS_KEY = "preview-secret-key";
    delete process.env.VERCEL_ENV;

    expect(getR2StorageConfig()).toEqual({
      accountId: "account-123",
      endpoint: "https://account-123.r2.cloudflarestorage.com",
      accessKeyId: "preview-access-key",
      secretAccessKey: "preview-secret-key",
      bucketName: "shift-evidence-preview-evidence",
    });

    process.env.VERCEL_ENV = "production";

    expect(getR2StorageConfig().bucketName).toBe("shift-evidence-prod-evidence");
  });

  it("writes, reads, heads, and deletes objects on the local filesystem fallback", async () => {
    process.env.STORAGE_DRIVER = "local";
    process.env.HOSTINGER_STORAGE_ROOT = testStorageRoot;

    const relativePath = "users/u-1/workspaces/w-1/assessments/a-1/uploads/network/network.txt";
    const buffer = Buffer.from("local-storage-regression");

    const writeResult = await writeStorageObject(relativePath, buffer, "text/plain");
    const expectedAbsolutePath = path.join(testStorageRoot, ...relativePath.split("/"));

    expect(writeResult.relativePath).toBe(relativePath);
    expect(writeResult.absolutePath).toBe(expectedAbsolutePath);
    expect(writeResult.sizeBytes).toBe(buffer.byteLength);
    expect(writeResult.mimeType).toBe("text/plain");
    expect(existsSync(expectedAbsolutePath)).toBe(true);

    const readResult = await readStorageObject(relativePath);
    expect(readResult.equals(buffer)).toBe(true);

    const headResult = await headStorageObject(relativePath);
    expect(headResult.relativePath).toBe(relativePath);
    expect(headResult.absolutePath).toBe(expectedAbsolutePath);
    expect(headResult.sizeBytes).toBe(buffer.byteLength);
    expect(headResult.mimeType).toBeNull();

    await deleteStorageObject(relativePath);
    expect(existsSync(expectedAbsolutePath)).toBe(false);
  });

  it("uses the Cloudflare R2 client with safe keys and metadata", async () => {
    process.env.STORAGE_DRIVER = "r2";
    process.env.R2_ACCOUNT_ID = "account-123";
    process.env.R2_S3_ENDPOINT = "https://account-123.r2.cloudflarestorage.com";
    process.env.R2_BUCKET_PREVIEW = "shift-evidence-preview-evidence";
    process.env.R2_BUCKET_PROD = "shift-evidence-prod-evidence";
    process.env.R2_ACCESS_KEY_ID = "preview-access-key";
    process.env.R2_SECRET_ACCESS_KEY = "preview-secret-key";
    process.env.VERCEL_ENV = "preview";

    const relativePath = "users/u-1/workspaces/w-1/assessments/a-1/reports/readiness/shiftreadiness.pdf";
    const buffer = Buffer.from("r2-storage-regression");

    awsMocks.send.mockResolvedValueOnce({});

    const writeResult = await writeStorageObject(relativePath, buffer, "application/pdf");
    const putCommand = awsMocks.send.mock.calls[0]?.[0] as { constructor: { name: string }; input: Record<string, unknown> };

    expect(awsMocks.clientConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: "https://account-123.r2.cloudflarestorage.com",
        region: "auto",
        forcePathStyle: true,
      }),
    );
    expect(putCommand.constructor.name).toBe("PutObjectCommand");
    expect(putCommand.input).toEqual(
      expect.objectContaining({
        Bucket: "shift-evidence-preview-evidence",
        Key: relativePath,
        Body: buffer,
        ContentType: "application/pdf",
        ContentLength: buffer.byteLength,
      }),
    );
    expect(writeResult.absolutePath).toBe(`r2://shift-evidence-preview-evidence/${relativePath}`);

    awsMocks.send.mockResolvedValueOnce({ Body: Buffer.from("downloaded-from-r2") });
    const readResult = await readStorageObject(relativePath);
    const getCommand = awsMocks.send.mock.calls[1]?.[0] as { constructor: { name: string }; input: Record<string, unknown> };

    expect(getCommand.constructor.name).toBe("GetObjectCommand");
    expect(getCommand.input).toEqual(
      expect.objectContaining({
        Bucket: "shift-evidence-preview-evidence",
        Key: relativePath,
      }),
    );
    expect(readResult.toString("utf8")).toBe("downloaded-from-r2");

    awsMocks.send.mockResolvedValueOnce({
      ContentLength: 18,
      ContentType: "application/pdf",
      LastModified: new Date("2026-05-30T00:00:00.000Z"),
      ETag: "\"etag-123\"",
    });
    const headResult = await headStorageObject(relativePath);
    const headCommand = awsMocks.send.mock.calls[2]?.[0] as { constructor: { name: string }; input: Record<string, unknown> };

    expect(headCommand.constructor.name).toBe("HeadObjectCommand");
    expect(headCommand.input).toEqual(
      expect.objectContaining({
        Bucket: "shift-evidence-preview-evidence",
        Key: relativePath,
      }),
    );
    expect(headResult.absolutePath).toBe(`r2://shift-evidence-preview-evidence/${relativePath}`);
    expect(headResult.sizeBytes).toBe(18);
    expect(headResult.mimeType).toBe("application/pdf");
    expect(headResult.etag).toBe("\"etag-123\"");

    awsMocks.send.mockResolvedValueOnce({});
    await deleteStorageObject(relativePath);
    const deleteCommand = awsMocks.send.mock.calls[3]?.[0] as { constructor: { name: string }; input: Record<string, unknown> };

    expect(deleteCommand.constructor.name).toBe("DeleteObjectCommand");
    expect(deleteCommand.input).toEqual(
      expect.objectContaining({
        Bucket: "shift-evidence-preview-evidence",
        Key: relativePath,
      }),
    );
  });
});
