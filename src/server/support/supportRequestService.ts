import {
  SupportRequestCategory,
  SupportRequestPriority,
  SupportRequestSource,
  SupportRequestStatus,
} from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { ensureAssessmentOwnership } from "../assessments/assessmentService";
import { parseOptionalString, parseRequiredString } from "../assessments/formUtils";
import { recordAdminAuditEvent } from "../admin/adminOpsService";
import { assertRateLimit } from "../security/rateLimit";
import { INPUT_LIMITS } from "../validation/inputLimits";

export const SUPPORT_CONTACTS = {
  info: "info@shiftevidence.com",
  support: "support@shiftevidence.com",
  billing: "billing@shiftevidence.com",
  partners: "partners@shiftevidence.com",
} as const;

export const SUPPORT_CATEGORY_OPTIONS = [
  { value: SupportRequestCategory.general_question, label: "General question" },
  { value: SupportRequestCategory.assessment_report_question, label: "Assessment or report question" },
  { value: SupportRequestCategory.technical_issue, label: "Technical issue" },
  { value: SupportRequestCategory.billing_question, label: "Billing or plan question" },
  { value: SupportRequestCategory.partner_msp_inquiry, label: "Partner / MSP inquiry" },
  { value: SupportRequestCategory.security_privacy, label: "Security or privacy" },
  { value: SupportRequestCategory.data_deletion_request, label: "Data deletion request" },
] as const;

const CATEGORY_VALUES = new Set(Object.values(SupportRequestCategory));
const STATUS_VALUES = new Set(Object.values(SupportRequestStatus));
const PRIORITY_VALUES = new Set(Object.values(SupportRequestPriority));

const SECRET_LIKE_PATTERN =
  /(-----BEGIN|DATABASE_URL|OPENAI_API_KEY|GEMINI_API_KEY|RESEND_API_KEY|HOSTINGER|password\s*=|token\s*=|api[_-]?key\s*=|secret\s*=)/i;

function parseCategory(
  value: FormDataEntryValue | null,
  fallback: SupportRequestCategory = SupportRequestCategory.general_question,
) {
  const raw = typeof value === "string" ? value.trim() : "";
  return CATEGORY_VALUES.has(raw as SupportRequestCategory) ? (raw as SupportRequestCategory) : fallback;
}

function parseStatus(value: FormDataEntryValue | null) {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!STATUS_VALUES.has(raw as SupportRequestStatus)) {
    throw new Error("Estado de soporte invalido.");
  }
  return raw as SupportRequestStatus;
}

function parsePriority(value: FormDataEntryValue | null) {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!PRIORITY_VALUES.has(raw as SupportRequestPriority)) {
    throw new Error("Prioridad de soporte invalida.");
  }
  return raw as SupportRequestPriority;
}

function assertNoSecrets(value: string, fieldName: string) {
  if (SECRET_LIKE_PATTERN.test(value)) {
    throw new Error(`${fieldName} appears to include a secret, token, password, or raw credential. Please remove it before sending.`);
  }
}

function parseSupportPayload(formData: FormData, options?: { requireEmail?: boolean; categoryFallback?: SupportRequestCategory }) {
  const category = parseCategory(formData.get("category"), options?.categoryFallback);
  const subject = parseRequiredString(formData.get("subject"), "Subject", {
    maxLength: INPUT_LIMITS.assessmentTitle,
  });
  const message = parseRequiredString(formData.get("message"), "Message", {
    maxLength: INPUT_LIMITS.description,
  });
  const contactName = parseOptionalString(formData.get("contactName"), {
    fieldName: "Name",
    maxLength: INPUT_LIMITS.shortText,
  });
  const contactEmail = parseOptionalString(formData.get("contactEmail"), {
    fieldName: "Email",
    maxLength: INPUT_LIMITS.email,
  });
  const companyName = parseOptionalString(formData.get("companyName"), {
    fieldName: "Company",
    maxLength: INPUT_LIMITS.companyName,
  });

  if (options?.requireEmail && !contactEmail) {
    throw new Error("Email is required.");
  }
  if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
    throw new Error("Please enter a valid email address.");
  }

  assertNoSecrets(subject, "Subject");
  assertNoSecrets(message, "Message");

  return {
    category,
    subject,
    message,
    contactName,
    contactEmail,
    companyName,
  };
}

export async function createPublicSupportRequest(formData: FormData, options?: { clientIp?: string }) {
  const payload = parseSupportPayload(formData, { requireEmail: true });
  const context = parseOptionalString(formData.get("context"), {
    fieldName: "Context",
    maxLength: INPUT_LIMITS.shortText,
  });

  await Promise.all([
    assertRateLimit({
      limiter: "publicSupportIp",
      keyParts: [options?.clientIp ?? "unknown"],
    }),
    assertRateLimit({
      limiter: "publicSupportEmail",
      keyParts: [payload.contactEmail ?? "unknown"],
    }),
  ]);

  return prisma.supportRequest.create({
    data: {
      ...payload,
      source: SupportRequestSource.public_support_page,
      metadataJson: context ? { context } : undefined,
    },
  });
}

export async function createDashboardSupportRequest(params: {
  userId: string;
  userEmail: string;
  workspaceId: string;
  formData: FormData;
}) {
  const payload = parseSupportPayload(params.formData, {
    requireEmail: false,
    categoryFallback: SupportRequestCategory.general_question,
  });

  return prisma.supportRequest.create({
    data: {
      ...payload,
      contactEmail: payload.contactEmail ?? params.userEmail,
      source: SupportRequestSource.user_dashboard,
      userId: params.userId,
      workspaceId: params.workspaceId,
    },
  });
}

export async function createAssessmentSupportRequest(params: {
  userId: string;
  userEmail: string;
  assessmentId: string;
  formData: FormData;
}) {
  const assessment = await ensureAssessmentOwnership({
    userId: params.userId,
    assessmentId: params.assessmentId,
  });
  const payload = parseSupportPayload(params.formData, {
    requireEmail: false,
    categoryFallback: SupportRequestCategory.assessment_report_question,
  });

  return prisma.supportRequest.create({
    data: {
      ...payload,
      contactEmail: payload.contactEmail ?? params.userEmail,
      source: SupportRequestSource.assessment_detail,
      userId: params.userId,
      workspaceId: assessment.workspaceId,
      assessmentId: assessment.id,
      metadataJson: {
        assessmentTitle: assessment.title,
        clientLabel: assessment.clientLabel,
      },
    },
  });
}

export function getSupportRequestFallback() {
  return {
    summary: {
      open: 0,
      triage: 0,
      waitingOnUser: 0,
      resolved: 0,
      closed: 0,
      highPriority: 0,
      total: 0,
    },
    recent: [],
  };
}

export async function getAdminSupportRequests() {
  const [groups, highPriority, recent] = await Promise.all([
    prisma.supportRequest.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.supportRequest.count({
      where: {
        status: { in: [SupportRequestStatus.open, SupportRequestStatus.triage, SupportRequestStatus.waiting_on_user] },
        priority: { in: [SupportRequestPriority.high, SupportRequestPriority.urgent] },
      },
    }),
    prisma.supportRequest.findMany({
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 30,
      include: {
        user: { select: { email: true, name: true } },
        workspace: { select: { name: true, companyName: true } },
        assessment: { select: { id: true, title: true, clientLabel: true } },
      },
    }),
  ]);

  const countByStatus = new Map(groups.map((item) => [item.status, item._count._all]));
  const summary = {
    open: countByStatus.get(SupportRequestStatus.open) ?? 0,
    triage: countByStatus.get(SupportRequestStatus.triage) ?? 0,
    waitingOnUser: countByStatus.get(SupportRequestStatus.waiting_on_user) ?? 0,
    resolved: countByStatus.get(SupportRequestStatus.resolved) ?? 0,
    closed: countByStatus.get(SupportRequestStatus.closed) ?? 0,
    highPriority,
    total: groups.reduce((sum, item) => sum + item._count._all, 0),
  };

  return { summary, recent };
}

export async function updateSupportRequestFromAdmin(params: {
  actorUserId: string;
  actorEmail: string;
  formData: FormData;
}) {
  const supportRequestId = parseRequiredString(params.formData.get("supportRequestId"), "Support request ID", {
    maxLength: INPUT_LIMITS.shortText,
  });
  const status = parseStatus(params.formData.get("status"));
  const priority = parsePriority(params.formData.get("priority"));
  const adminNotes = parseOptionalString(params.formData.get("adminNotes"), {
    fieldName: "Notas internas",
    maxLength: INPUT_LIMITS.comment,
  });
  const now = new Date();

  const updated = await prisma.supportRequest.update({
    where: { id: supportRequestId },
    data: {
      status,
      priority,
      adminNotes,
      resolvedAt: status === SupportRequestStatus.resolved ? now : undefined,
      closedAt: status === SupportRequestStatus.closed ? now : undefined,
    },
  });

  await recordAdminAuditEvent({
    actorUserId: params.actorUserId,
    actorEmail: params.actorEmail,
    eventType: "support_request_updated",
    entityType: "support_request",
    entityId: updated.id,
    message: "Solicitud de soporte actualizada desde consola admin.",
    metadataJson: {
      status,
      priority,
      source: updated.source,
      category: updated.category,
    },
  });

  return updated;
}
