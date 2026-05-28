import fs from "node:fs";
function loadLocalEnvSafe() {
  if (!fs.existsSync(".env.local")) {
    return;
  }

  const content = fs.readFileSync(".env.local", "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separator = line.indexOf("=");
    if (separator < 1) {
      continue;
    }

    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function classifyProviderError(status, body) {
  if (/API_KEY_INVALID|API key not valid|invalid api key/i.test(body)) return "invalid_api_key";
  if (/PERMISSION_DENIED|permission/i.test(body)) return "permission_denied";
  if (/quota|rate/i.test(body)) return "quota_or_rate_limit";
  if (/not found|not supported|model/i.test(body)) return "model_or_endpoint";
  if (status >= 500) return "provider_5xx";
  return "provider_error";
}

function validateAdvisoryShape(value) {
  return Boolean(
    value &&
      typeof value === "object" &&
      Array.isArray(value.executiveSummaryNotes) &&
      Array.isArray(value.technicalNotes) &&
      Array.isArray(value.missingContextQuestions) &&
      typeof value.confidenceImpact === "string" &&
      Array.isArray(value.recommendedNextActions) &&
      Array.isArray(value.limitations),
  );
}

loadLocalEnvSafe();

const provider = process.env.AI_ADVISORY_PROVIDER ?? "none";
const model = process.env.AI_ADVISORY_MODEL ?? "gemini-2.5-flash";
const apiKey = process.env.GEMINI_API_KEY?.trim();
const timeoutMs = Number.parseInt(process.env.AI_ADVISORY_TIMEOUT_MS ?? "15000", 10);
const maxOutputChars = Number.parseInt(process.env.AI_ADVISORY_MAX_OUTPUT_CHARS ?? "6000", 10);

console.log(`provider=${provider}`);
console.log(`model=${model}`);
console.log(`geminiKeyConfigured=${apiKey ? "YES" : "NO"}`);
console.log("geminiKeyPrinted=NO");
console.log(`openAiConfigured=${process.env.OPENAI_API_KEY?.trim() ? "YES" : "NO"}`);

if (provider !== "gemini") {
  console.log("providerStatus=disabled");
  console.log("errorCategory=provider_not_gemini");
  process.exit(1);
}

if (!apiKey) {
  console.log("providerStatus=unavailable");
  console.log("errorCategory=missing_gemini_key");
  process.exit(1);
}

const startedAt = Date.now();
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), Number.isFinite(timeoutMs) ? timeoutMs : 15000);

try {
  const prompt = [
    "Return exactly one valid JSON object and no other text.",
    'The JSON object must be: {"executiveSummaryNotes":["Gemini local smoke reached the real provider."],"technicalNotes":["Synthetic VMware to Proxmox advisory smoke completed."],"missingContextQuestions":[{"question":"Is backup restore proof available?","whyItMatters":"Restore proof affects migration confidence.","priority":"high"}],"confidenceImpact":"Synthetic smoke only; confirms provider connectivity, not customer readiness.","recommendedNextActions":["Keep using sanitized payloads only."],"limitations":["No real customer data was used."]}',
  ].join(" ");
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          maxOutputTokens: Math.max(512, Math.min(maxOutputChars, 2048)),
          temperature: 0.2,
        },
      }),
      signal: controller.signal,
    },
  );

  const body = await response.text();
  if (!response.ok) {
    console.log("providerStatus=error");
    console.log(`httpStatus=${response.status}`);
    console.log(`errorCategory=${classifyProviderError(response.status, body)}`);
    console.log("responsePrinted=NO");
    console.log("secretsPrinted=NO");
    process.exit(1);
  }

  const json = JSON.parse(body);
  const parts = json.candidates?.[0]?.content?.parts;
  const text = Array.isArray(parts) ? parts.map((part) => part.text ?? "").join("\n").trim() : "";
  if (!text) {
    console.log("providerStatus=error");
    console.log(`durationMs=${Date.now() - startedAt}`);
    console.log("errorCategory=empty_response");
    console.log("responsePrinted=NO");
    console.log("secretsPrinted=NO");
    process.exit(1);
  }

  const cleaned = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
  const parsed = JSON.parse(cleaned);
  const outputShapeValid = validateAdvisoryShape(parsed);

  console.log(outputShapeValid ? "providerStatus=success" : "providerStatus=error");
  console.log(`durationMs=${Date.now() - startedAt}`);
  console.log(`outputShapeValid=${outputShapeValid ? "YES" : "NO"}`);
  console.log("responsePrinted=NO");
  console.log("secretsPrinted=NO");
  process.exit(outputShapeValid ? 0 : 1);
} catch (error) {
  console.log("providerStatus=error");
  console.log(`durationMs=${Date.now() - startedAt}`);
  console.log(
    `errorCategory=${
      error?.name === "AbortError" ? "timeout" : error instanceof SyntaxError ? "json_parse" : "parse_or_runtime"
    }`,
  );
  console.log(`errorName=${error?.name ?? "unknown"}`);
  console.log("responsePrinted=NO");
  console.log("secretsPrinted=NO");
  process.exit(1);
} finally {
  clearTimeout(timeout);
}
