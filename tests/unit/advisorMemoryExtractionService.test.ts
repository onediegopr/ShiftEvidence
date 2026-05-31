import { describe, expect, it } from "vitest";
import {
  buildDecisionMemoryItem,
  buildMemoryCandidateFromUserStatement,
  buildNextStepMemoryItem,
  buildOpenQuestionMemoryItem,
  extractAdvisorMemoryCandidates,
  isDuplicateAdvisorMemoryCandidate,
} from "../../src/server/advisor/advisorMemoryExtractionService";

const scope = {
  assessmentId: "assessment-1",
  workspaceId: "workspace-1",
  conversationId: "conversation-1",
  sourceMessageId: "message-1",
  createdByUserId: "user-1",
};

describe("advisor memory deterministic extraction lite", () => {
  it("builds review-only decision, open question and next step candidates without AI", () => {
    expect(buildDecisionMemoryItem({ ...scope, decision: "We decided to validate Proxmox networking first." })).toMatchObject({
      type: "decision",
      status: "needs_review",
      sourceType: "user_message",
      truthStatus: "customer_reported",
    });

    expect(buildOpenQuestionMemoryItem({ ...scope, question: "Is the target cluster ready?" })).toMatchObject({
      type: "open_question",
      status: "needs_review",
      truthStatus: "missing",
    });

    expect(buildNextStepMemoryItem({ ...scope, nextStep: "Upload RVTools inventory." })).toMatchObject({
      type: "next_step",
      status: "needs_review",
      truthStatus: "advisor_generated",
    });
  });

  it("ignores trivial and random short messages", () => {
    expect(extractAdvisorMemoryCandidates({ ...scope, role: "user", content: "ok" })).toEqual([]);
    expect(extractAdvisorMemoryCandidates({ ...scope, role: "user", content: "ccvxc" })).toEqual([]);
  });

  it("extracts explicit user decisions conservatively", () => {
    const [candidate] = extractAdvisorMemoryCandidates({
      ...scope,
      role: "user",
      content: "Lo damos por valido: no avanzar con Ceph hasta validar red.",
    });

    expect(candidate).toMatchObject({
      type: "decision",
      status: "needs_review",
      sourceType: "user_message",
      truthStatus: "customer_reported",
      extractionRule: "user_decision",
    });
  });

  it("extracts constraints and next steps from user messages", () => {
    const candidates = extractAdvisorMemoryCandidates({
      ...scope,
      role: "user",
      content: "No tocar DB y hay que subir RVTools antes del siguiente smoke.",
    });

    expect(candidates.map((item) => item.type)).toEqual(["next_step", "constraint"]);
    expect(candidates.every((item) => item.status === "needs_review")).toBe(true);
  });

  it("extracts open questions from question-like user messages", () => {
    const [candidate] = extractAdvisorMemoryCandidates({
      ...scope,
      role: "user",
      content: "Que falta para avanzar?",
    });

    expect(candidate).toMatchObject({
      type: "open_question",
      sourceType: "user_message",
      truthStatus: "customer_reported",
    });
  });

  it("extracts missing evidence from advisor responses", () => {
    const [candidate] = extractAdvisorMemoryCandidates({
      ...scope,
      role: "assistant",
      sourceMessageId: "assistant-1",
      content: "Missing evidence: RVTools missing, so inventory-driven recommendations are limited.",
      assistantStatus: "completed",
    });

    expect(candidate).toMatchObject({
      type: "evidence_note",
      sourceType: "advisor_message",
      truthStatus: "missing",
      status: "needs_review",
    });
  });

  it("extracts advisor next actions but caps candidates per response", () => {
    const candidates = extractAdvisorMemoryCandidates({
      ...scope,
      role: "assistant",
      sourceMessageId: "assistant-1",
      content: [
        "Next Actions:",
        "- Upload RVTools inventory.",
        "- Validate backup ownership.",
        "- Confirm target storage.",
        "- Review licensing evidence.",
      ].join("\n"),
      assistantStatus: "completed",
    });

    expect(candidates).toHaveLength(3);
    expect(candidates.every((item) => item.truthStatus === "advisor_generated")).toBe(true);
  });

  it("skips secrets, raw file content and failed assistant messages", () => {
    expect(
      extractAdvisorMemoryCandidates({
        ...scope,
        role: "user",
        content: "Hay que validar esto con api_key=secret-value",
      }),
    ).toEqual([]);

    expect(
      extractAdvisorMemoryCandidates({
        ...scope,
        role: "assistant",
        sourceMessageId: "assistant-1",
        content: "Next Actions:\n- Upload RVTools inventory.",
        assistantStatus: "failed",
      }),
    ).toEqual([]);
  });

  it("dedupes same source message and similar title", () => {
    const candidate = extractAdvisorMemoryCandidates({
      ...scope,
      role: "user",
      content: "Hay que subir RVTools antes del smoke.",
    })[0];

    expect(
      isDuplicateAdvisorMemoryCandidate(candidate, [
        {
          id: "memory-1",
          type: candidate.type,
          title: candidate.title,
          summary: "Different wording",
          sourceMessageId: candidate.sourceMessageId,
        },
      ]),
    ).toBe(true);
  });

  it("keeps legacy simple classifier behavior", () => {
    expect(buildMemoryCandidateFromUserStatement({ ...scope, statement: "We decided to defer Ceph." })?.type).toBe("decision");
    expect(buildMemoryCandidateFromUserStatement({ ...scope, statement: "Does the client have a target cluster?" })?.type).toBe("open_question");
    expect(buildMemoryCandidateFromUserStatement({ ...scope, statement: "Next step is upload RVTools." })?.type).toBe("next_step");
    expect(buildMemoryCandidateFromUserStatement({ ...scope, statement: "Hello there." })).toBeNull();
  });
});
