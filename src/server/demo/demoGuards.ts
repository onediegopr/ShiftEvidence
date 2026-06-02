import { DEMO_USER_EMAIL } from "./demoDatasets";

export const DEMO_READ_ONLY_MESSAGE =
  "Demo mode is read-only. This action is available in paid assessments.";

export const DEMO_UPLOAD_BLOCK_MESSAGE =
  "Demo mode is read-only. To upload your own RVTools export, start a paid assessment.";

export const DEMO_DISABLED_MESSAGE =
  "This action is intentionally disabled in the Demo Workspace. Nothing is broken - demo mode does not allow changes to synthetic data.";

export const DEMO_ADVISOR_BLOCK_MESSAGE =
  "Live AI Advisor is available in paid assessments. This demo shows a synthetic Advisor transcript.";

export type DemoMutationKind =
  | "create_assessment"
  | "upload_evidence"
  | "edit_assessment"
  | "delete_evidence"
  | "live_advisor"
  | "memory"
  | "billing"
  | "admin"
  | "entitlement"
  | "report_generation";

export class DemoModeMutationError extends Error {
  code = "demo_mode_read_only";

  constructor(message = DEMO_READ_ONLY_MESSAGE) {
    super(message);
    this.name = "DemoModeMutationError";
  }
}

export function normalizeDemoEmail(email: string | null | undefined) {
  return (email ?? "").trim().toLowerCase();
}

export function isDemoUserEmail(email: string | null | undefined) {
  return normalizeDemoEmail(email) === DEMO_USER_EMAIL;
}

export function isDemoAssessmentId(assessmentId: string | null | undefined) {
  return Boolean(assessmentId?.startsWith("demo-john-") || assessmentId?.startsWith("demo-viviana-"));
}

export function isDemoMode(params: {
  email?: string | null;
  assessmentId?: string | null;
  explicitDemo?: boolean;
}) {
  return Boolean(params.explicitDemo || isDemoUserEmail(params.email) || isDemoAssessmentId(params.assessmentId));
}

export function getDemoBlockedMessage(kind: DemoMutationKind) {
  switch (kind) {
    case "upload_evidence":
      return DEMO_UPLOAD_BLOCK_MESSAGE;
    case "live_advisor":
      return DEMO_ADVISOR_BLOCK_MESSAGE;
    case "billing":
    case "admin":
    case "entitlement":
    case "memory":
    case "report_generation":
      return DEMO_DISABLED_MESSAGE;
    default:
      return DEMO_READ_ONLY_MESSAGE;
  }
}

export function assertNotDemoMode(params: {
  email?: string | null;
  assessmentId?: string | null;
  explicitDemo?: boolean;
  kind?: DemoMutationKind;
}) {
  if (isDemoMode(params)) {
    throw new DemoModeMutationError(getDemoBlockedMessage(params.kind ?? "edit_assessment"));
  }
}
