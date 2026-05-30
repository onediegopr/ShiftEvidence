import { describe, expect, it } from "vitest";
import { buildSeniorAdvisorMemoryUsageMetadata } from "../../src/server/advisor/seniorAdvisorService";
import {
  buildSeniorAdvisorProviderFallbackMessage,
  buildSeniorAdvisorProviderHttpError,
  describeSeniorAdvisorGeminiResponseShape,
  describeSeniorAdvisorOpenCodeGoResponseShape,
  extractSeniorAdvisorGeminiText,
  extractSeniorAdvisorOpenCodeGoText,
  getSeniorAdvisorGeminiModelCandidates,
  getSeniorAdvisorProviderErrorMetadata,
  SeniorAdvisorProviderError,
} from "../../src/server/advisor/seniorAdvisorProviderHandling";
import { SENIOR_ADVISOR_OPERATION_TYPE } from "../../src/server/advisor/seniorAdvisorTypes";
import { AI_RUNTIME_MODE_OPTIONS } from "../../src/server/admin/runtimeSettingsService";
import { getAiAdvisoryConfig, getAiAdvisoryProviderKey } from "../../src/server/ai/aiAdvisoryConfig";

describe("senior advisor service contract", () => {
  it("uses a dedicated AI usage operation type", () => {
    expect(SENIOR_ADVISOR_OPERATION_TYPE).toBe("senior_advisor_message");
  });

  it("builds safe memory usage metadata without raw memory text", () => {
    expect(
      buildSeniorAdvisorMemoryUsageMetadata({
        completion: true,
        inventory: true,
        riskFindings: 1,
        licensing: false,
        clientContext: false,
        storage: true,
        ceph: false,
        evidenceMetadata: 1,
        reports: 0,
        memoryIncluded: true,
        memoryItemCount: 3,
        memoryContextChars: 1200,
        memoryFallbackReason: null,
      }),
    ).toEqual({
      memoryIncluded: true,
      memoryItemCount: 3,
      memoryContextChars: 1200,
      memoryFallbackReason: null,
    });
  });

  it("routes legacy Gemini Advisor models to a supported fallback candidate", () => {
    expect(getSeniorAdvisorGeminiModelCandidates("gemini-1.5-flash")).toEqual([
      "gemini-1.5-flash",
      "gemini-2.5-flash",
    ]);
    expect(getSeniorAdvisorGeminiModelCandidates("gemini-2.5-flash")).toEqual([
      "gemini-2.5-flash",
    ]);
  });

  it("extracts plain text from Gemini Advisor responses", () => {
    const text = extractSeniorAdvisorGeminiText({
      candidates: [
        {
          content: {
            parts: [{ text: "Next step: upload RVTools evidence." }],
          },
        },
      ],
    });

    expect(text).toBe("Next step: upload RVTools evidence.");
  });

  it("extracts text from Gemini SDK-style response wrappers", () => {
    expect(
      extractSeniorAdvisorGeminiText({
        text: () => "Direct SDK text.",
      }),
    ).toBe("Direct SDK text.");

    expect(
      extractSeniorAdvisorGeminiText({
        response: {
          text: () => "Nested SDK text.",
        },
      }),
    ).toBe("Nested SDK text.");
  });

  it("joins multiple Gemini candidate text parts", () => {
    const text = extractSeniorAdvisorGeminiText({
      candidates: [
        {
          content: {
            parts: [{ text: "First action." }, { text: "Second action." }],
          },
        },
      ],
    });

    expect(text).toBe("First action.\nSecond action.");
  });

  it("classifies Gemini safety blocks without crashing", () => {
    expect(() =>
      extractSeniorAdvisorGeminiText({
        candidates: [{ finishReason: "SAFETY" }],
      }),
    ).toThrow(SeniorAdvisorProviderError);

    try {
      extractSeniorAdvisorGeminiText({
        candidates: [{ finishReason: "SAFETY" }],
      });
    } catch (error) {
      expect(error).toBeInstanceOf(SeniorAdvisorProviderError);
      expect((error as SeniorAdvisorProviderError).category).toBe("safety_blocked");
    }
  });

  it("turns provider model errors into actionable fallback copy", async () => {
    const error = await buildSeniorAdvisorProviderHttpError({
      response: new Response(
        JSON.stringify({
          error: {
            status: "NOT_FOUND",
            message: "models/gemini-1.5-flash is not found for this API version.",
          },
        }),
        { status: 404 },
      ),
      provider: "gemini",
      model: "gemini-1.5-flash",
    });

    expect(error.category).toBe("model_unavailable");
    expect(buildSeniorAdvisorProviderFallbackMessage(error)).toContain("configured AI model");
  });

  it("classifies invalid Gemini API keys as provider configuration failures", async () => {
    const error = await buildSeniorAdvisorProviderHttpError({
      response: new Response(
        JSON.stringify({
          error: {
            status: "INVALID_ARGUMENT",
            message: "API key not valid. Please pass a valid API key.",
          },
        }),
        { status: 400 },
      ),
      provider: "gemini",
      model: "gemini-2.5-flash",
    });

    expect(error.category).toBe("config_missing");
    expect(buildSeniorAdvisorProviderFallbackMessage(error)).toContain("configuration is not valid");
  });

  it("keeps safe response-shape metadata for unsupported Gemini responses", () => {
    const response = {
      candidates: [
        {
          finishReason: "STOP",
          content: {
            parts: [{ functionCall: { name: "unsupported" } }],
          },
        },
      ],
    };

    expect(describeSeniorAdvisorGeminiResponseShape(response)).toMatchObject({
      hasCandidates: true,
      candidateCount: 1,
      finishReason: "STOP",
      firstPartTypes: ["functionCall"],
    });

    try {
      extractSeniorAdvisorGeminiText(response);
    } catch (error) {
      expect(error).toBeInstanceOf(SeniorAdvisorProviderError);
      expect((error as SeniorAdvisorProviderError).category).toBe("invalid_response");
      expect(getSeniorAdvisorProviderErrorMetadata(error).responseFirstPartTypes).toBe("functionCall");
    }
  });

  it("classifies empty Gemini candidates separately from unsupported shapes", () => {
    try {
      extractSeniorAdvisorGeminiText({ candidates: [] });
    } catch (error) {
      expect(error).toBeInstanceOf(SeniorAdvisorProviderError);
      expect((error as SeniorAdvisorProviderError).category).toBe("empty_response");
      expect(buildSeniorAdvisorProviderFallbackMessage(error)).toContain("empty provider response");
    }
  });

  it("extracts OpenCode Go OpenAI-compatible chat completion text", () => {
    expect(
      extractSeniorAdvisorOpenCodeGoText({
        choices: [{ message: { content: "Upload RVTools first." } }],
      }),
    ).toBe("Upload RVTools first.");

    expect(
      extractSeniorAdvisorOpenCodeGoText({
        choices: [
          {
            message: {
              content: [
                { type: "text", text: "First action." },
                { type: "text", text: "Second action." },
              ],
            },
          },
        ],
      }),
    ).toBe("First action.\nSecond action.");
  });

  it("keeps safe OpenCode Go response-shape metadata", () => {
    const response = { choices: [{ finish_reason: "stop", message: { content: [{ tool_call: {} }] } }] };

    expect(describeSeniorAdvisorOpenCodeGoResponseShape(response)).toMatchObject({
      hasChoices: true,
      choiceCount: 1,
      finishReason: "stop",
      firstPartTypes: ["tool_call"],
    });

    expect(() => extractSeniorAdvisorOpenCodeGoText({ choices: [] })).toThrow(SeniorAdvisorProviderError);
  });

  it("keeps OpenAI out of admin-selectable runtime modes", () => {
    expect(AI_RUNTIME_MODE_OPTIONS).toEqual(["env", "disabled", "mock", "gemini"]);
    expect(AI_RUNTIME_MODE_OPTIONS).not.toContain("openai");
    expect(AI_RUNTIME_MODE_OPTIONS).not.toContain("opencode_go");
  });

  it("configures Gemini as primary with OpenCode Go fallback", () => {
    const originalEnv = { ...process.env };
    try {
      process.env.AI_ADVISORY_ENABLED = "true";
      process.env.AI_ADVISORY_PROVIDER = "gemini";
      process.env.AI_ADVISORY_MODEL = "gemini-2.5-flash";
      process.env.AI_ADVISORY_FALLBACK_PROVIDER = "opencode_go";
      process.env.AI_ADVISORY_FALLBACK_MODEL = "glm-5.1";
      process.env.OPENCODE_API_KEY = "test-opencode-key";

      const config = getAiAdvisoryConfig();
      expect(config.provider).toBe("gemini");
      expect(config.model).toBe("gemini-2.5-flash");
      expect(config.fallbackProvider).toBe("opencode_go");
      expect(config.fallbackModel).toBe("glm-5.1");
      expect(getAiAdvisoryProviderKey("opencode_go")).toBe("test-opencode-key");
    } finally {
      process.env = originalEnv;
    }
  });
});
