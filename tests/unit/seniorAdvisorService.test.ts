import { describe, expect, it } from "vitest";
import {
  buildSeniorAdvisorProviderFallbackMessage,
  buildSeniorAdvisorProviderHttpError,
  extractSeniorAdvisorGeminiText,
  getSeniorAdvisorGeminiModelCandidates,
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
});
