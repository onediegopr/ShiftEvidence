import type { SupportRequest } from "@prisma/client";
import { env } from "../../lib/env";
import { SUPPORT_CONTACTS } from "./supportConfig";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function canSendSupportNotifications() {
  return Boolean(env.RESEND_API_KEY && env.EMAIL_FROM);
}

export async function sendTechnicalReviewNotificationEmail(params: {
  request: SupportRequest;
  sourceLabel: string;
}) {
  if (!canSendSupportNotifications()) {
    return "skipped";
  }

  const { request, sourceLabel } = params;
  const subject = `[Technical Review] ${request.companyName ?? request.contactName ?? request.contactEmail ?? "New request"}`;
  const safeMessage = escapeHtml(request.message);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: SUPPORT_CONTACTS.info,
      reply_to: request.contactEmail ?? undefined,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6;">
          <h2 style="margin: 0 0 16px;">New Technical Review Request</h2>
          <p style="margin: 0 0 16px;">A visitor requested a technical review from <strong>${escapeHtml(sourceLabel)}</strong>.</p>
          <table style="border-collapse: collapse; width: 100%; margin: 0 0 20px;">
            <tr><td style="padding: 8px; border: 1px solid #cbd5e1;"><strong>Contact</strong></td><td style="padding: 8px; border: 1px solid #cbd5e1;">${escapeHtml(request.contactName ?? "Not provided")}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #cbd5e1;"><strong>Email</strong></td><td style="padding: 8px; border: 1px solid #cbd5e1;">${escapeHtml(request.contactEmail ?? "Not provided")}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #cbd5e1;"><strong>Company</strong></td><td style="padding: 8px; border: 1px solid #cbd5e1;">${escapeHtml(request.companyName ?? "Not provided")}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #cbd5e1;"><strong>Priority</strong></td><td style="padding: 8px; border: 1px solid #cbd5e1;">${escapeHtml(request.priority)}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #cbd5e1;"><strong>Request ID</strong></td><td style="padding: 8px; border: 1px solid #cbd5e1;">${escapeHtml(request.id)}</td></tr>
          </table>
          <h3 style="margin: 0 0 8px;">Message</h3>
          <div style="padding: 14px 16px; border-radius: 12px; background: #eff6ff; border: 1px solid #bfdbfe; white-space: pre-wrap;">${safeMessage}</div>
        </div>
      `,
      text: [
        "New Technical Review Request",
        `Source: ${sourceLabel}`,
        `Contact: ${request.contactName ?? "Not provided"}`,
        `Email: ${request.contactEmail ?? "Not provided"}`,
        `Company: ${request.companyName ?? "Not provided"}`,
        `Priority: ${request.priority}`,
        `Request ID: ${request.id}`,
        "",
        "Message:",
        request.message,
      ].join("\n"),
    }),
  });

  if (!response.ok) {
    throw new Error("Technical review notification email was rejected by the provider.");
  }

  return "sent";
}
