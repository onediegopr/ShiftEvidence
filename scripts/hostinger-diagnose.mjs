import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const requiredEnvVars = [
  "DATABASE_URL",
  "BETTER_AUTH_SECRET",
  "BETTER_AUTH_URL",
  "NEXT_PUBLIC_APP_URL",
  "HOSTINGER_STORAGE_ROOT",
  "MAX_UPLOAD_SIZE_MB",
  "ADMIN_EMAILS",
];

const keyFiles = [
  "package.json",
  "next.config.mjs",
  "next.config.js",
  "prisma/schema.prisma",
  "src/app/page.tsx",
  "src/app/shiftreadiness/page.tsx",
];

const optionalAiEnvVars = [
  "AI_ADVISORY_ENABLED",
  "AI_ADVISORY_PROVIDER",
  "AI_ADVISORY_MODEL",
  "AI_ADVISORY_TIMEOUT_MS",
  "AI_ADVISORY_MAX_INPUT_CHARS",
  "AI_ADVISORY_MAX_OUTPUT_CHARS",
  "GEMINI_API_KEY",
  "OPENAI_API_KEY",
];

function hasValue(name) {
  return Boolean(process.env[name]?.trim());
}

function fileExists(relativePath) {
  return fs.existsSync(path.join(process.cwd(), relativePath));
}

function formatStatus(value) {
  return value ? "present" : "absent";
}

const storageRoot = process.env.HOSTINGER_STORAGE_ROOT?.trim() ?? "";

console.log("Hostinger build diagnostics");
console.log(`- nodeVersion: ${process.version}`);
console.log(`- cwd: ${process.cwd()}`);
console.log(`- platform: ${process.platform}`);
console.log(`- arch: ${process.arch}`);
console.log(`- osRelease: ${os.release()}`);
console.log("");

console.log("Key files");
for (const file of keyFiles) {
  console.log(`- ${file}: ${formatStatus(fileExists(file))}`);
}
console.log("");

console.log("Environment variables");
for (const name of requiredEnvVars) {
  console.log(`- ${name}: ${formatStatus(hasValue(name))}`);
}
console.log("");

console.log("Optional AI advisory variables");
for (const name of optionalAiEnvVars) {
  console.log(`- ${name}: ${formatStatus(hasValue(name))}`);
}
console.log("");

console.log("Storage root");
console.log(`- configured: ${formatStatus(Boolean(storageRoot))}`);
console.log(`- absolute: ${storageRoot ? path.isAbsolute(storageRoot) : "not configured"}`);
console.log("- writeReadDelete: not tested by this diagnostic");
console.log("");

console.log("Notes");
console.log("- This script does not print secret values.");
console.log("- This script does not connect to the database.");
console.log("- This script does not run Prisma.");
console.log("- This script does not run build or start.");
console.log("- Exit code is always 0 so missing values can be inspected safely.");
