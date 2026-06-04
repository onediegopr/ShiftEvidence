import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { mkdir, readFile, rm, stat, writeFile } from "fs/promises";
import path from "node:path";
import { normalizeStorageRelativePath, resolveInsideStorageRoot } from "./storagePaths";

export type StorageDriver = "local" | "r2";

export interface StorageObjectWriteResult {
  absolutePath: string;
  relativePath: string;
  sizeBytes: number;
  mimeType: string | null;
}

export interface StorageObjectHeadResult {
  absolutePath: string;
  relativePath: string;
  sizeBytes: number;
  mimeType: string | null;
  lastModified: Date | null;
  etag: string | null;
}

export interface R2StorageConfig {
  accountId: string;
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
}

function requiredStorageValue(name: string, errorMessage: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(errorMessage);
  }

  return value;
}

export function getStorageDriver(): StorageDriver {
  const configured = process.env.STORAGE_DRIVER?.trim().toLowerCase();

  if (!configured || configured === "local") {
    return "local";
  }

  if (configured === "r2") {
    return "r2";
  }

  throw new Error(`Unsupported STORAGE_DRIVER value "${process.env.STORAGE_DRIVER}". Expected "local" or "r2".`);
}

export function getStorageRelativePath(relativePath: string, errorMessage = "Invalid storage path.") {
  return normalizeStorageRelativePath(relativePath, errorMessage);
}

export function getStorageObjectLocation(relativePath: string) {
  const normalizedRelativePath = getStorageRelativePath(relativePath);

  if (getStorageDriver() === "r2") {
    const bucketName = getActiveR2BucketName();
    return `r2://${bucketName}/${normalizedRelativePath}`;
  }

  return resolveInsideStorageRoot(normalizedRelativePath);
}

export function getR2StorageConfig(): R2StorageConfig {
  const accountId = requiredStorageValue("R2_ACCOUNT_ID", "R2_ACCOUNT_ID is required when STORAGE_DRIVER=r2.");
  const endpoint = requiredStorageValue("R2_S3_ENDPOINT", "R2_S3_ENDPOINT is required when STORAGE_DRIVER=r2.");
  const accessKeyId = requiredStorageValue("R2_ACCESS_KEY_ID", "R2_ACCESS_KEY_ID is required when STORAGE_DRIVER=r2.");
  const secretAccessKey = requiredStorageValue(
    "R2_SECRET_ACCESS_KEY",
    "R2_SECRET_ACCESS_KEY is required when STORAGE_DRIVER=r2.",
  );

  return {
    accountId,
    endpoint,
    accessKeyId,
    secretAccessKey,
    bucketName: getActiveR2BucketName(),
  };
}

function getActiveR2BucketName() {
  const deploymentEnv = process.env.VERCEL_ENV?.trim().toLowerCase();

  if (deploymentEnv === "production") {
    return requiredStorageValue("R2_BUCKET_PROD", "R2_BUCKET_PROD is required when STORAGE_DRIVER=r2 in production.");
  }

  return requiredStorageValue("R2_BUCKET_PREVIEW", "R2_BUCKET_PREVIEW is required when STORAGE_DRIVER=r2.");
}

function createR2Client(config: R2StorageConfig) {
  return new S3Client({
    region: "auto",
    endpoint: config.endpoint,
    forcePathStyle: true,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
}

async function toBufferFromBody(body: unknown) {
  if (!body) {
    return Buffer.alloc(0);
  }

  if (Buffer.isBuffer(body)) {
    return body;
  }

  if (body instanceof Uint8Array) {
    return Buffer.from(body);
  }

  if (body instanceof ArrayBuffer) {
    return Buffer.from(body);
  }

  if (typeof Blob !== "undefined" && body instanceof Blob) {
    return Buffer.from(await body.arrayBuffer());
  }

  const candidate = body as {
    transformToByteArray?: () => Promise<Uint8Array>;
    [Symbol.asyncIterator]?: () => AsyncIterator<Uint8Array>;
  };

  if (typeof candidate.transformToByteArray === "function") {
    return candidate.transformToByteArray().then((bytes) => Buffer.from(bytes));
  }

  if (typeof candidate[Symbol.asyncIterator] === "function") {
    return (async () => {
      const chunks: Buffer[] = [];

      for await (const chunk of candidate as AsyncIterable<Uint8Array>) {
        chunks.push(Buffer.from(chunk));
      }

      return Buffer.concat(chunks);
    })();
  }

  throw new Error("Unsupported R2 object body type.");
}

async function readR2Object(relativePath: string) {
  const config = getR2StorageConfig();
  const client = createR2Client(config);
  const response = await client.send(
    new GetObjectCommand({
      Bucket: config.bucketName,
      Key: relativePath,
    }),
  );

  return toBufferFromBody(response.Body);
}

async function headR2Object(relativePath: string) {
  const config = getR2StorageConfig();
  const client = createR2Client(config);
  const response = await client.send(
    new HeadObjectCommand({
      Bucket: config.bucketName,
      Key: relativePath,
    }),
  );

  return {
    sizeBytes: response.ContentLength ?? 0,
    mimeType: response.ContentType ?? null,
    lastModified: response.LastModified ?? null,
    etag: response.ETag ?? null,
  };
}

async function writeR2Object(relativePath: string, buffer: Buffer, mimeType?: string | null) {
  const config = getR2StorageConfig();
  const client = createR2Client(config);

  await client.send(
    new PutObjectCommand({
      Bucket: config.bucketName,
      Key: relativePath,
      Body: buffer,
      ContentType: mimeType?.trim() || undefined,
      ContentLength: buffer.byteLength,
    }),
  );

  return {
    absolutePath: getStorageObjectLocation(relativePath),
    relativePath,
    sizeBytes: buffer.byteLength,
    mimeType: mimeType?.trim() || null,
  };
}

async function deleteR2Object(relativePath: string) {
  const config = getR2StorageConfig();
  const client = createR2Client(config);

  await client.send(
    new DeleteObjectCommand({
      Bucket: config.bucketName,
      Key: relativePath,
    }),
  );
}

async function ensureLocalStorageParent(relativePath: string) {
  const absolutePath = resolveInsideStorageRoot(relativePath);
  await mkdir(path.dirname(absolutePath), {
    recursive: true,
  });
  return absolutePath;
}

async function writeLocalObject(relativePath: string, buffer: Buffer, mimeType?: string | null) {
  const absolutePath = await ensureLocalStorageParent(relativePath);
  await writeFile(absolutePath, buffer);

  return {
    absolutePath,
    relativePath,
    sizeBytes: buffer.byteLength,
    mimeType: mimeType?.trim() || null,
  };
}

async function readLocalObject(relativePath: string) {
  const absolutePath = resolveInsideStorageRoot(relativePath);
  return readFile(absolutePath);
}

async function headLocalObject(relativePath: string) {
  const absolutePath = resolveInsideStorageRoot(relativePath);
  const fileStat = await stat(absolutePath);

  return {
    sizeBytes: fileStat.size,
    mimeType: null,
    lastModified: fileStat.mtime,
    etag: null,
  };
}

async function deleteLocalObject(relativePath: string) {
  const absolutePath = resolveInsideStorageRoot(relativePath);
  await rm(absolutePath, { force: true });
}

export async function writeStorageObject(relativePath: string, buffer: Buffer, mimeType?: string | null) {
  const normalizedRelativePath = getStorageRelativePath(relativePath);

  if (getStorageDriver() === "r2") {
    return writeR2Object(normalizedRelativePath, buffer, mimeType);
  }

  return writeLocalObject(normalizedRelativePath, buffer, mimeType);
}

export async function readStorageObject(relativePath: string) {
  const normalizedRelativePath = getStorageRelativePath(relativePath);

  if (getStorageDriver() === "r2") {
    return readR2Object(normalizedRelativePath);
  }

  return readLocalObject(normalizedRelativePath);
}

export async function headStorageObject(relativePath: string): Promise<StorageObjectHeadResult> {
  const normalizedRelativePath = getStorageRelativePath(relativePath);

  if (getStorageDriver() === "r2") {
    const r2Object = await headR2Object(normalizedRelativePath);
    return {
      absolutePath: getStorageObjectLocation(normalizedRelativePath),
      relativePath: normalizedRelativePath,
      ...r2Object,
    };
  }

  const localObject = await headLocalObject(normalizedRelativePath);
  return {
    absolutePath: resolveInsideStorageRoot(normalizedRelativePath),
    relativePath: normalizedRelativePath,
    ...localObject,
  };
}

export async function deleteStorageObject(relativePath: string) {
  const normalizedRelativePath = getStorageRelativePath(relativePath);

  if (getStorageDriver() === "r2") {
    await deleteR2Object(normalizedRelativePath);
    return;
  }

  await deleteLocalObject(normalizedRelativePath);
}
