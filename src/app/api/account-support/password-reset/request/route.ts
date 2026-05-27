import { NextResponse } from "next/server";
import {
  createPasswordResetToken,
  getClientIpHash,
  getPasswordResetExpiry,
  getPasswordResetUrl,
  getUserAgentHash,
  hashRecoveryValue,
  normalizeRecoveryEmail,
  PASSWORD_RESET_NEUTRAL_MESSAGE,
  sendPasswordRecoveryEmail,
  type PasswordRecoveryDeliveryMode,
} from "../../../../../lib/account-recovery";
import { prisma } from "../../../../../lib/prisma";

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: unknown };
    const normalizedEmail = normalizeRecoveryEmail(String(body.email ?? ""));

    if (!isValidEmail(normalizedEmail)) {
      return NextResponse.json({ ok: true, message: PASSWORD_RESET_NEUTRAL_MESSAGE });
    }

    const emailHash = hashRecoveryValue(normalizedEmail);
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (!user) {
      createPasswordResetToken();
      return NextResponse.json({ ok: true, message: PASSWORD_RESET_NEUTRAL_MESSAGE });
    }

    const token = createPasswordResetToken();
    const tokenHash = hashRecoveryValue(token);
    const expiresAt = getPasswordResetExpiry();
    const resetUrl = getPasswordResetUrl(token);
    let deliveryMode: PasswordRecoveryDeliveryMode = "manual";
    let status = "manual_pending";

    await prisma.passwordResetRequest.updateMany({
      where: {
        userId: user.id,
        usedAt: null,
        status: { in: ["pending", "email_sent", "manual_pending"] },
      },
      data: { status: "superseded" },
    });

    const resetRequest = await prisma.passwordResetRequest.create({
      data: {
        userId: user.id,
        emailNormalized: normalizedEmail,
        emailHash,
        tokenHash,
        status,
        deliveryMode,
        expiresAt,
        requestedIpHash: getClientIpHash(request),
        userAgentHash: getUserAgentHash(request),
      },
    });

    try {
      deliveryMode = await sendPasswordRecoveryEmail({
        email: normalizedEmail,
        resetUrl,
      });
      status = deliveryMode === "email" ? "email_sent" : "manual_pending";
    } catch {
      deliveryMode = "manual";
      status = "manual_pending";
    }

    await prisma.passwordResetRequest.update({
      where: { id: resetRequest.id },
      data: { deliveryMode, status },
    });

    await prisma.auditEvent.create({
      data: {
        userId: user.id,
        eventType: "password_reset.requested",
        message: "Password reset requested.",
        metadataJson: {
          deliveryMode,
          status,
        },
      },
    });

    return NextResponse.json({ ok: true, message: PASSWORD_RESET_NEUTRAL_MESSAGE });
  } catch {
    return NextResponse.json({ ok: true, message: PASSWORD_RESET_NEUTRAL_MESSAGE });
  }
}
