import type { BillingInvoiceRequestStatus } from "@prisma/client";
import { getBillingPlanByCheckoutSlug, type BillingCheckoutSlug, type BillingPlanConfig } from "../../config/billing";
import { prisma } from "../../lib/prisma";
import { INPUT_LIMITS, normalizeOptionalTextInput, normalizeRequiredTextInput } from "../validation/inputLimits";

export const billingInvoiceRequestStatuses = ["pending", "invoice_sent", "payment_received", "cancelled", "rejected"] as const satisfies BillingInvoiceRequestStatus[];
export type BillingInvoiceRequestStatusInput = (typeof billingInvoiceRequestStatuses)[number];

const terminalInvoiceRequestStatuses = new Set<BillingInvoiceRequestStatusInput>(["payment_received", "cancelled", "rejected"]);

function readFormValue(formData: FormData, name: string) {
  return formData.get(name);
}

function normalizeEmail(value: unknown) {
  const email = normalizeRequiredTextInput(value, "Email", INPUT_LIMITS.email).toLowerCase();
  if (!email.includes("@") || email.startsWith("@") || email.endsWith("@")) {
    throw new Error("Enter a valid billing email.");
  }
  return email;
}

function requireInvoicePlan(slug: string): BillingPlanConfig & { checkoutSlug: BillingCheckoutSlug } {
  const plan = getBillingPlanByCheckoutSlug(slug);
  if (!plan || !plan.invoiceEligible || !plan.checkoutSlug) {
    throw new Error("This bank transfer invoice route is not available for the selected plan.");
  }
  return plan as BillingPlanConfig & { checkoutSlug: BillingCheckoutSlug };
}

export function getBillingInvoicePlanBySlug(slug: string) {
  try {
    return requireInvoicePlan(slug);
  } catch {
    return null;
  }
}

export async function createBillingInvoiceRequest(params: { planSlug: string; formData: FormData; userId?: string | null; workspaceId?: string | null }) {
  const plan = requireInvoicePlan(params.planSlug);
  if (readFormValue(params.formData, "manualInvoiceConsent") !== "accepted") {
    throw new Error("Confirm that you understand this is a manual invoice and bank transfer request.");
  }

  const customerEmail = normalizeEmail(readFormValue(params.formData, "customerEmail"));
  const contactName = normalizeRequiredTextInput(readFormValue(params.formData, "contactName"), "Contact name", INPUT_LIMITS.shortText);
  const companyName = normalizeRequiredTextInput(readFormValue(params.formData, "companyName"), "Company name", INPUT_LIMITS.companyName);
  const country = normalizeOptionalTextInput(readFormValue(params.formData, "country"), "Country", INPUT_LIMITS.shortText);
  const taxId = normalizeOptionalTextInput(readFormValue(params.formData, "taxId"), "Tax ID", INPUT_LIMITS.shortText);
  const purchaseOrder = normalizeOptionalTextInput(readFormValue(params.formData, "purchaseOrder"), "Purchase order", INPUT_LIMITS.shortText);
  const notes = normalizeOptionalTextInput(readFormValue(params.formData, "notes"), "Notes", INPUT_LIMITS.notes);

  const request = await prisma.billingInvoiceRequest.create({
    data: {
      planId: plan.id,
      planSlug: plan.checkoutSlug,
      planName: plan.displayName,
      amountCents: Math.round(plan.priceAmountUsd * 100),
      currency: plan.currency,
      cadence: plan.cadence,
      customerEmail,
      contactName,
      companyName,
      country,
      taxId,
      purchaseOrder,
      notes,
      userId: params.userId ?? null,
      workspaceId: params.workspaceId ?? null,
      provider: "wise",
      status: "pending",
    },
  });

  await prisma.auditEvent.create({
    data: {
      userId: params.userId ?? null,
      workspaceId: params.workspaceId ?? null,
      eventType: "billing.invoice_request.created",
      message: `Created manual bank transfer invoice request for ${plan.displayName}.`,
      metadataJson: { billingInvoiceRequestId: request.id, planId: plan.id, planSlug: plan.checkoutSlug, provider: "wise" },
    },
  });

  return request;
}

export async function listBillingInvoiceRequestsForAdmin(limit = 25) {
  return prisma.billingInvoiceRequest.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      user: { select: { id: true, email: true, name: true } },
      workspace: { select: { id: true, name: true, companyName: true } },
      assessment: { select: { id: true, title: true } },
    },
  });
}

export async function getBillingInvoiceRequestSummary() {
  const [total, pending, invoiceSent, paymentReceived] = await Promise.all([
    prisma.billingInvoiceRequest.count(),
    prisma.billingInvoiceRequest.count({ where: { status: "pending" } }),
    prisma.billingInvoiceRequest.count({ where: { status: "invoice_sent" } }),
    prisma.billingInvoiceRequest.count({ where: { status: "payment_received" } }),
  ]);
  return { total, pending, invoiceSent, paymentReceived };
}

function parseStatus(value: FormDataEntryValue | null): BillingInvoiceRequestStatusInput {
  if (typeof value !== "string" || !billingInvoiceRequestStatuses.includes(value as BillingInvoiceRequestStatusInput)) {
    throw new Error("Select a valid invoice request status.");
  }
  return value as BillingInvoiceRequestStatusInput;
}

function assertAllowedStatusChange(currentStatus: BillingInvoiceRequestStatusInput, nextStatus: BillingInvoiceRequestStatusInput) {
  if (currentStatus !== nextStatus && terminalInvoiceRequestStatuses.has(currentStatus)) {
    throw new Error("Terminal invoice requests cannot be changed from the admin console.");
  }
}

function getStatusTimestampPatch(status: BillingInvoiceRequestStatusInput) {
  const now = new Date();
  switch (status) {
    case "invoice_sent": return { invoiceSentAt: now };
    case "payment_received": return { paymentReceivedAt: now };
    case "cancelled": return { cancelledAt: now };
    case "rejected": return { rejectedAt: now };
    case "pending": return {};
  }
}

export async function updateBillingInvoiceRequestFromAdmin(params: { adminUserId: string; adminEmail: string; formData: FormData }) {
  const id = normalizeRequiredTextInput(readFormValue(params.formData, "billingInvoiceRequestId"), "Invoice request ID", INPUT_LIMITS.shortText);
  const nextStatus = parseStatus(params.formData.get("status"));
  const internalNotes = normalizeOptionalTextInput(readFormValue(params.formData, "internalNotes"), "Internal notes", INPUT_LIMITS.notes);
  const existing = await prisma.billingInvoiceRequest.findUnique({ where: { id } });
  if (!existing) throw new Error("Invoice request not found.");

  assertAllowedStatusChange(existing.status, nextStatus);
  const updated = await prisma.billingInvoiceRequest.update({ where: { id }, data: { status: nextStatus, internalNotes, ...getStatusTimestampPatch(nextStatus) } });

  await prisma.auditEvent.create({
    data: {
      userId: params.adminUserId,
      workspaceId: updated.workspaceId,
      assessmentId: updated.assessmentId,
      eventType: "billing.invoice_request.status_updated",
      message: `Admin ${params.adminEmail} updated invoice request ${updated.id} to ${nextStatus}.`,
      metadataJson: { billingInvoiceRequestId: updated.id, previousStatus: existing.status, nextStatus, provider: updated.provider, autoGrant: false },
    },
  });

  return updated;
}