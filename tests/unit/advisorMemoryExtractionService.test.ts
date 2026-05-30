import { describe, expect, it } from "vitest";
import {
  buildDecisionMemoryItem,
  buildMemoryCandidateFromUserStatement,
  buildNextStepMemoryItem,
  buildOpenQuestionMemoryItem,
} from "../../src/server/advisor/advisorMemoryExtractionService";

const scope = {
  assessmentId: "assessment-1",
  workspaceId: "workspace-1",
  conversationId: "conversation-1",
  sourceMessageId: "message-1",
  createdByUserId: "user-1",
};

describe("advisor memory deterministic extraction placeholders", () => {
  it("builds decision, open question and next step candidates without AI", () => {
    expect(buildDecisionMemoryItem({ ...scope, decision: "We decided to validate Proxmox networking first." })).toMatchObject({
      type: "decision",
      sourceType: "user_message",
      truthStatus: "customer_reported",
    });

    expect(buildOpenQuestionMemoryItem({ ...scope, question: "Is the target cluster ready?" })).toMatchObject({
      type: "open_question",
      truthStatus: "missing",
    });

    expect(buildNextStepMemoryItem({ ...scope, nextStep: "Upload RVTools inventory." })).toMatchObject({
      type: "next_step",
      truthStatus: "advisor_generated",
    });
  });

  it("classifies simple user statements deterministically", () => {
    expect(buildMemoryCandidateFromUserStatement({ ...scope, statement: "We decided to defer Ceph." })?.type).toBe("decision");
    expect(buildMemoryCandidateFromUserStatement({ ...scope, statement: "Does the client have a target cluster?" })?.type).toBe("open_question");
    expect(buildMemoryCandidateFromUserStatement({ ...scope, statement: "Next step is upload RVTools." })?.type).toBe("next_step");
    expect(buildMemoryCandidateFromUserStatement({ ...scope, statement: "Hello there." })).toBeNull();
  });
});
