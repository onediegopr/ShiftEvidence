import { describe, expect, it } from "vitest";
import {
  buildSeniorAdvisorProviderFallbackMessage,
  buildSeniorAdvisorProviderHttpError,
  describeSeniorAdvisorGeminiResponseShape,
  extractSeniorAdvisorGeminiText,
  getSeniorAdvisorGeminiModelCandidates,
  getSeniorAdvisorProviderErrorMetadata,
  SeniorAdvisorProviderError,
} from "../../src/server/advisor/seniorAdvisorProviderHandling";
import { SENIOR_ADVISOR_OPERATION_TYPE } from "../../src/server/advisor/seniorAdvisorTypes";

describe("senior advisor service contract", () => {
  it("uses a dedicated AI usage operation type", () => {
    expect(SENIOR_ADVISOR_OPERATION_TYPE).toBe("senior_advisor_message");
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
});
