import { SupportRequestCategory } from "@prisma/client";

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
