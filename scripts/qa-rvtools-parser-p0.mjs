import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const repoRoot = process.cwd();
const tmpRoot = path.join(repoRoot, ".tmp", "rvtools-parser-p0");
const outDir = path.join(tmpRoot, "cjs");
const runnerTs = path.join(tmpRoot, "runner.ts");
const runnerJs = path.join(outDir, ".tmp", "rvtools-parser-p0", "runner.js");
const workbookPath = path.join(
  repoRoot,
  "qa-artifacts",
  "hito-10-2-3-rvtools-mapping-review",
  "evidence",
  "rvtools-like-sample.xlsx",
);

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed with exit code ${result.status}`);
  }
}

const runnerSource = String.raw`
import { readFile } from "node:fs/promises";
import { EvidenceType } from "@prisma/client";
import { parseRvtoolsWorkbook } from "../../src/server/rvtools/rvtoolsParserService";

function assertEqual(label: string, actual: unknown, expected: unknown) {
  if (actual !== expected) {
    throw new Error(label + " expected " + expected + " but got " + actual);
  }
}

function summarize(parsed: ReturnType<typeof parseRvtoolsWorkbook>) {
  const warningsByCode = parsed.warnings.reduce<Record<string, number>>((acc, warning) => {
    acc[warning.code] = (acc[warning.code] ?? 0) + 1;
    return acc;
  }, {});
  return {
    sheetRoles: Object.fromEntries(parsed.detections.map((detection) => [detection.sheetName, detection.role])),
    parsedVM: parsed.parsedVMs.length,
    parsedHost: parsed.parsedHosts.length,
    parsedDatastore: parsed.parsedDatastores.length,
    parsedSnapshot: parsed.parsedSnapshots.length,
    summary: parsed.summary,
    warningsByCode,
    datastores: parsed.parsedDatastores.map((datastore) => ({
      name: datastore.datastoreName,
      usagePercent: datastore.usagePercent,
      riskLevel: datastore.riskLevel,
    })),
  };
}

function createCsvBuffer() {
  return Buffer.from([
    "VM,Powerstate,CPUs,MemoryGB,ProvisionedGB,In Use GB,Host,Datastore,Network,OS,Snapshots,ToolsStatus",
    "csv-web-01,poweredOn,2,8,120,75,esxi-01,ds-prod-01,VLAN100,Ubuntu Linux,0,guestToolsCurrent",
    "csv-sql-01,poweredOn,8,64,2048,1600,esxi-02,ds-db-01,VLAN200,Windows Server,1,guestToolsNeedUpgrade",
    "csv-off-01,poweredOff,2,4,80,20,esxi-01,ds-prod-01,VLAN100,Windows Server,0,guestToolsCurrent",
  ].join("\n"), "utf8");
}

async function main() {
  const workbookPath = process.argv[2];
  const workbookBuffer = await readFile(workbookPath);
  const parsedWorkbook = parseRvtoolsWorkbook({
    buffer: workbookBuffer,
    originalFilename: "rvtools-like-sample.xlsx",
    assessmentId: "qa",
    evidenceFileId: "qa",
    evidenceType: EvidenceType.rvtools,
  });
  const workbookSummary = summarize(parsedWorkbook);

  assertEqual("RVTools-like ParsedVM", workbookSummary.parsedVM, 23);
  assertEqual("RVTools-like ParsedHost", workbookSummary.parsedHost, 5);
  assertEqual("RVTools-like ParsedDatastore", workbookSummary.parsedDatastore, 6);
  assertEqual("RVTools-like ParsedSnapshot", workbookSummary.parsedSnapshot, 5);

  const lowFree = workbookSummary.datastores.find((datastore) => datastore.name === "ds-low-free-space");
  if (!lowFree || Math.round(Number(lowFree.usagePercent)) !== 95) {
    throw new Error("Expected ds-low-free-space usage percent to normalize to 95.");
  }

  const csvParsed = parseRvtoolsWorkbook({
    buffer: createCsvBuffer(),
    originalFilename: "sample-rvtools-evidence.csv",
    assessmentId: "csv",
    evidenceFileId: "csv",
    evidenceType: EvidenceType.rvtools,
  });
  const csvSummary = summarize(csvParsed);
  assertEqual("CSV simple ParsedVM", csvSummary.parsedVM, 3);
  assertEqual("CSV simple ParsedHost", csvSummary.parsedHost, 0);
  assertEqual("CSV simple ParsedDatastore", csvSummary.parsedDatastore, 0);
  assertEqual("CSV simple ParsedSnapshot", csvSummary.parsedSnapshot, 0);

  console.log(JSON.stringify({
    workbook: workbookSummary,
    csv: csvSummary,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
`;

if (!existsSync(workbookPath)) {
  throw new Error(`Missing QA workbook: ${workbookPath}`);
}

await rm(tmpRoot, { recursive: true, force: true });
await mkdir(tmpRoot, { recursive: true });
await mkdir(outDir, { recursive: true });
await writeFile(path.join(outDir, "package.json"), JSON.stringify({ type: "commonjs" }, null, 2));
await writeFile(runnerTs, runnerSource);

run("npx", [
  "tsc",
  "--ignoreConfig",
  "--ignoreDeprecations",
  "6.0",
  "--noEmit",
  "false",
  "--noEmitOnError",
  "false",
  "--module",
  "commonjs",
  "--moduleResolution",
  "node",
  "--target",
  "ES2022",
  "--lib",
  "ES2023,DOM",
  "--skipLibCheck",
  "--types",
  "node",
  "--noImplicitAny",
  "false",
  "--esModuleInterop",
  "--resolveJsonModule",
  "--outDir",
  outDir,
  "--rootDir",
  repoRoot,
  runnerTs,
]);

run("node", [runnerJs, workbookPath]);
await rm(tmpRoot, { recursive: true, force: true });
