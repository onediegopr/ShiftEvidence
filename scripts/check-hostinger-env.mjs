import fs from "node:fs";
import path from "node:path";

const envPath = path.join(process.cwd(), ".env.local");

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

function loadLocalEnvFallback() {
  if (!fs.existsSync(envPath)) {
    return;
  }

  const content = fs.readFileSync(envPath, "utf8");
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
}

function hasValue(name) {
  return Boolean(process.env[name]?.trim());
}

function isLocalUrl(value) {
  return /localhost|127\.0\.0\.1/i.test(value);
}

function parseAdminEmails(value) {
  return value
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter((item) => item.length > 0 && !item.includes("*"));
}

loadLocalEnvFallback();

const required = [
  "DATABASE_URL",
  "BETTER_AUTH_SECRET",
  "BETTER_AUTH_URL",
  "NEXT_PUBLIC_APP_URL",
  "HOSTINGER_STORAGE_ROOT",
  "MAX_UPLOAD_SIZE_MB",
  "ADMIN_EMAILS",
];
const optional = ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"];
const missing = required.filter((name) => !hasValue(name));
const errors = [];
const warnings = [];
const isProduction = process.env.NODE_ENV === "production";

if (missing.length > 0) {
  errors.push(`Missing required variables: ${missing.join(", ")}`);
}

const betterAuthUrl = process.env.BETTER_AUTH_URL ?? "";
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

if (isProduction && (isLocalUrl(betterAuthUrl) || isLocalUrl(appUrl))) {
  errors.push("Production URLs must not point to localhost.");
}

if (betterAuthUrl && appUrl && betterAuthUrl !== appUrl) {
  warnings.push("BETTER_AUTH_URL and NEXT_PUBLIC_APP_URL differ. Confirm this is intentional.");
}

const secret = process.env.BETTER_AUTH_SECRET ?? "";
if (secret && secret.length < 32) {
  warnings.push("BETTER_AUTH_SECRET is shorter than 32 characters.");
}

const uploadLimit = Number(process.env.MAX_UPLOAD_SIZE_MB ?? "");
if (!Number.isFinite(uploadLimit) || uploadLimit <= 0) {
  errors.push("MAX_UPLOAD_SIZE_MB must be a positive number.");
}

const storageRoot = process.env.HOSTINGER_STORAGE_ROOT ?? "";
if (storageRoot && storageRoot.includes(".next")) {
  errors.push("HOSTINGER_STORAGE_ROOT must not point inside .next.");
}
if (storageRoot && storageRoot.includes("node_modules")) {
  errors.push("HOSTINGER_STORAGE_ROOT must not point inside node_modules.");
}
if (storageRoot && storageRoot.includes("public")) {
  warnings.push("HOSTINGER_STORAGE_ROOT should not point inside public.");
}
if (isProduction && storageRoot && !path.isAbsolute(storageRoot)) {
  warnings.push("Production HOSTINGER_STORAGE_ROOT should be an absolute persistent path.");
}

const adminEmails = parseAdminEmails(process.env.ADMIN_EMAILS ?? "");
if (adminEmails.length === 0) {
  warnings.push("ADMIN_EMAILS has no valid emails. Admin route will fail closed.");
}

console.log("Hostinger environment check");
console.log(`- NODE_ENV: ${process.env.NODE_ENV ?? "not set"}`);
console.log(`- requiredPresent: ${required.length - missing.length}/${required.length}`);
console.log(`- optionalPresent: ${optional.filter(hasValue).length}/${optional.length}`);
console.log(`- adminEmailsCount: ${adminEmails.length}`);
console.log(`- storageRootConfigured: ${hasValue("HOSTINGER_STORAGE_ROOT")}`);

for (const warning of warnings) {
  console.warn(`WARNING: ${warning}`);
}

if (errors.length > 0) {
  for (const error of errors) {
    console.error(`ERROR: ${error}`);
  }
  process.exit(1);
}

console.log("Environment check passed without blocking errors.");
