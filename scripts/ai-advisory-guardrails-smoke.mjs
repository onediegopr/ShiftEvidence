import assert from "node:assert/strict";

const SECRET_VALUE_PATTERN =
  /\b(database_url|password|passwd|pwd|secret|token|cookie|authorization|bearer|reset token)\s*[:=]\s*[^\s,;]+/gi;
const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const WINDOWS_PATH_PATTERN = /[A-Z]:\\(?:[^\\/:*?"<>|\r\n]+\\)+[^\\/:*?"<>|\r\n]*/gi;
const UNIX_STORAGE_PATH_PATTERN = /\/(?:home|var|mnt|storage|private|uploads|tmp)\/[^\s"'<>]+/gi;

function sanitize(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") {
    return value
      .replace(SECRET_VALUE_PATTERN, "$1=[REDACTED]")
      .replace(/\bBearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [REDACTED]")
      .replace(/\b[A-Fa-f0-9]{32,}\b/g, "[REDACTED_TOKEN]")
      .replace(EMAIL_PATTERN, "[REDACTED_EMAIL]")
      .replace(WINDOWS_PATH_PATTERN, "[REDACTED_PATH]")
      .replace(UNIX_STORAGE_PATH_PATTERN, "[REDACTED_PATH]");
  }
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) return value.map(sanitize);
  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !/raw|content|buffer|blob|bytes|worksheet|rows|csv|xlsx/i.test(key))
        .map(([key, item]) => [
          key,
          /database_url|secret|password|token|cookie|authorization|bearer|relativePath|storedFilename|fileHash/i.test(key)
            ? "[REDACTED]"
            : sanitize(item),
        ]),
    );
  }
  return null;
}

const fixture = {
  DATABASE_URL: "postgres://user:pass@example.neon.tech/db",
  password: "password=supersecret",
  cookie: "session=abc",
  bearer: "Bearer abcdefghijklmnopqrstuvwxyz123456",
  resetToken: "abcdefabcdefabcdefabcdefabcdefabcdef",
  email: "qa@example.com",
  relativePath: "/private/storage/users/u1/report.pdf",
  rawUploadedFileContent: "vm,cpu,ram\nsecret-row",
  nested: {
    note: "stored at C:\\Users\\diego\\private\\storage\\file.xlsx with token=abc123",
  },
};

const output = JSON.stringify(sanitize(fixture));

assert(!output.includes("postgres://"), "DATABASE_URL value leaked");
assert(!output.includes("supersecret"), "password value leaked");
assert(!output.includes("qa@example.com"), "email leaked");
assert(!output.includes("private\\storage"), "Windows storage path leaked");
assert(!output.includes("/private/storage"), "Unix storage path leaked");
assert(!output.includes("secret-row"), "raw file content leaked");
assert(output.includes("[REDACTED]"), "redaction marker missing");

console.log("AI advisory guardrails smoke: OK");
