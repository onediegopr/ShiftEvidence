import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const client = fs.readFileSync(path.join(root, "src/server/ai/aiAdvisoryClient.ts"), "utf8");
const runtimeStatus = fs.readFileSync(path.join(root, "src/server/ai/aiRuntimeStatus.ts"), "utf8");
const pdfRenderer = fs.readFileSync(path.join(root, "src/server/reports/reportPdfRenderer.ts"), "utf8");
const adminStatusRoute = fs.readFileSync(path.join(root, "src/app/api/admin/ai/status/route.ts"), "utf8");

assert(client.includes('emptyOutput(config, "unavailable")'), "missing-key fallback output is not present");
assert(client.includes('emptyOutput(config, "error")'), "provider-error fallback output is not present");
assert(client.includes('error.name === "AbortError"'), "timeout classification is not present");
assert(client.includes('eventType: "ai_advisory_fallback_used"'), "fallback runtime event is not recorded");
assert(client.includes("buildSafeJsonInput(payload, config.maxInputChars)"), "bounded input JSON before provider call is not present");
assert(client.includes("buildAiAdvisoryPrompt(inputJson)"), "provider prompt must be built from the bounded input JSON");

assert(runtimeStatus.includes("secretosExpuestos: false"), "runtime status must report no exposed secrets");
assert(runtimeStatus.includes("archivosCrudosEnviados: false"), "runtime status must report no raw files sent");
assert(runtimeStatus.includes("fallbackDisponible: true"), "runtime status must expose fallback availability");
assert(!runtimeStatus.includes("GEMINI_API_KEY="), "runtime status must not contain secret values");
assert(!runtimeStatus.includes("OPENAI_API_KEY="), "runtime status must not contain secret values");

assert(pdfRenderer.includes('preview.aiAdvisory.providerStatus === "mock"'), "PDF AI section should only include mock/success output");
assert(pdfRenderer.includes('preview.aiAdvisory.providerStatus === "success"'), "PDF AI section should only include mock/success output");
assert(!pdfRenderer.includes("JSON.stringify(preview.aiAdvisory"), "PDF renderer must not dump raw AI JSON");

assert(adminStatusRoute.includes("requireAdminSession"), "AI status route must require admin session");
assert(adminStatusRoute.includes('"Cache-Control": "no-store"'), "AI status route must not be cached");

console.log("AI advisory fallback drill: OK");
