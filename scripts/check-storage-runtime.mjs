import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const DEFAULT_STORAGE_ROOT = "storage";

function parseDotEnvLine(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) {
    return null;
  }

  const separator = trimmed.indexOf("=");
  if (separator === -1) {
    return null;
  }

  const key = trimmed.slice(0, separator).trim();
  const rawValue = trimmed.slice(separator + 1).trim();
  const value = rawValue.replace(/^["']|["']$/g, "");

  return key ? [key, value] : null;
}

async function loadLocalEnvFallback() {
  const envPath = path.join(process.cwd(), ".env.local");
  try {
    const content = await fs.readFile(envPath, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const parsed = parseDotEnvLine(line);
      if (!parsed) {
        continue;
      }

      const [key, value] = parsed;
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // Hostinger normally uses real environment variables instead of .env.local.
  }
}

await loadLocalEnvFallback();

const configuredRoot = process.env.HOSTINGER_STORAGE_ROOT?.trim();
const root = path.resolve(process.cwd(), configuredRoot || DEFAULT_STORAGE_ROOT);
const testDirectory = path.join(root, ".runtime-check");
const testFile = path.join(testDirectory, `storage-check-${crypto.randomBytes(6).toString("hex")}.txt`);
const content = `ShiftReadiness storage check ${new Date().toISOString()}`;

try {
  await fs.mkdir(testDirectory, { recursive: true });
  await fs.writeFile(testFile, content, "utf8");
  const readBack = await fs.readFile(testFile, "utf8");
  if (readBack !== content) {
    throw new Error("Storage readback did not match written content.");
  }
  await fs.rm(testFile, { force: true });
  await fs.rmdir(testDirectory).catch(() => undefined);

  console.log("Storage runtime check");
  console.log(`- storageRootExistsOrCreated: true`);
  console.log(`- writeReadDelete: ok`);
  console.log(`- storageRootAbsolute: ${path.isAbsolute(root)}`);
  console.log("Storage check passed.");
} catch (error) {
  console.error("Storage runtime check failed.");
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
