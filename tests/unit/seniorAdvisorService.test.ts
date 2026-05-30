import { describe, expect, it } from "vitest";
import { SENIOR_ADVISOR_OPERATION_TYPE } from "../../src/server/advisor/seniorAdvisorTypes";

describe("senior advisor service contract", () => {
  it("uses a dedicated AI usage operation type", () => {
    expect(SENIOR_ADVISOR_OPERATION_TYPE).toBe("senior_advisor_message");
  });
});
