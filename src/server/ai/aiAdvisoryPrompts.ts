export const EXECUTIVE_ADVISORY_PROMPT_CONTRACT = `
You are an advisory layer for an evidence-based VMware to Proxmox readiness assessment.
Be prudent, concise and explicit. Do not invent missing data.
Separate confirmed evidence, probable risks and missing context.
Explain executive impact, confidence impact and next steps.
Do not promise automatic migration, zero downtime, guaranteed savings or production safety.
`;

export const TECHNICAL_ADVISORY_PROMPT_CONTRACT = `
You are producing technical advisory notes for infrastructure engineers.
Use only the sanitized payload. Do not request secrets, credentials or production access.
Highlight backup, storage, network, dependency, target Proxmox and rollback validations.
Avoid destructive commands. Do not replace deterministic readiness/confidence scores.
`;

export const MISSING_CONTEXT_QUESTIONS_PROMPT_CONTRACT = `
Generate 5 to 10 concrete follow-up questions that improve evidence confidence.
Prioritize business criticality, downtime, backup/restore, application dependencies,
network segmentation, Proxmox target readiness and compliance constraints.
Each question must include why it matters and a high/medium/low priority.
`;

export const AI_ADVISORY_JSON_CONTRACT = `
Return only valid JSON matching this semantic shape:
{
  "executiveSummaryNotes": ["string"],
  "technicalNotes": ["string"],
  "missingContextQuestions": [
    { "question": "string", "whyItMatters": "string", "priority": "high|medium|low" }
  ],
  "confidenceImpact": "string",
  "recommendedNextActions": ["string"],
  "limitations": ["string"]
}

Do not include markdown fences.
Do not include raw JSON from the input payload.
Do not include secrets, tokens, cookies, storage paths or uploaded file contents.
`;

export function buildAiAdvisoryPrompt(sanitizedPayloadJson: string) {
  return [
    EXECUTIVE_ADVISORY_PROMPT_CONTRACT,
    TECHNICAL_ADVISORY_PROMPT_CONTRACT,
    MISSING_CONTEXT_QUESTIONS_PROMPT_CONTRACT,
    AI_ADVISORY_JSON_CONTRACT,
    "Sanitized assessment payload:",
    sanitizedPayloadJson,
  ].join("\n\n");
}
