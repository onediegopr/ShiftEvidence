import { describe, expect, it } from "vitest";
import { POST } from "../../src/app/api/account-support/password-reset/confirm/route";

function makeResetConfirmRequest(body: string) {
  return new Request("http://localhost:3000/api/account-support/password-reset/confirm", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body,
  });
}

describe("password reset confirm route", () => {
  it("returns a safe 400 response for malformed JSON", async () => {
    const response = await POST(makeResetConfirmRequest("{bad-json"));
    const payload = (await response.json()) as { ok: boolean; message: string };

    expect(response.status).toBe(400);
    expect(payload).toEqual({
      ok: false,
      message: "Invalid request body.",
    });
    expect(JSON.stringify(payload)).not.toMatch(/SyntaxError|stack|password|token/i);
  });

  it("preserves the existing invalid-token response for well-formed JSON", async () => {
    const response = await POST(
      makeResetConfirmRequest(
        JSON.stringify({
          token: "invalid-token",
          password: "SomeSafePassword123!",
        }),
      ),
    );
    const payload = (await response.json()) as { ok: boolean; message: string };

    expect(response.status).toBe(400);
    expect(payload).toEqual({
      ok: false,
      message: "This reset link is invalid or has expired.",
    });
  });
});
