import crypto from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { NextResponse } from "next/server";
import { hashRecoveryValue } from "../../../../../lib/account-recovery";
import { prisma } from "../../../../../lib/prisma";

const INVALID_TOKEN_MESSAGE = "This reset link is invalid or has expired.";
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 128;
const RESET_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const ACTIVE_RESET_STATUSES = ["pending", "email_sent", "manual_pending"];

class InvalidResetTokenError extends Error {}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      token?: unknown;
      password?: unknown;
    };
    const token = String(body.token ?? "");
    const password = String(body.password ?? "");

    if (!token || !RESET_TOKEN_PATTERN.test(token)) {
      return NextResponse.json({ ok: false, message: INVALID_TOKEN_MESSAGE }, { status: 400 });
    }

    if (password.length < PASSWORD_MIN_LENGTH) {
      return NextResponse.json(
        { ok: false, message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters.` },
        { status: 400 },
      );
    }

    if (password.length > PASSWORD_MAX_LENGTH) {
      return NextResponse.json(
        { ok: false, message: `Password must be ${PASSWORD_MAX_LENGTH} characters or fewer.` },
        { status: 400 },
      );
    }

    const tokenHash = hashRecoveryValue(token);
    const resetRequest = await prisma.passwordResetRequest.findUnique({
      where: { tokenHash },
    });

    if (
      !resetRequest ||
      !resetRequest.userId ||
      resetRequest.usedAt ||
      !resetRequest.expiresAt ||
      resetRequest.expiresAt < new Date() ||
      !ACTIVE_RESET_STATUSES.includes(resetRequest.status)
    ) {
      return NextResponse.json({ ok: false, message: INVALID_TOKEN_MESSAGE }, { status: 400 });
    }

    const userId = resetRequest.userId;
    const passwordHash = await hashPassword(password);
    const completedAt = new Date();

    await prisma.$transaction(async (tx) => {
      const existingAccount = await tx.account.findFirst({
        where: {
          userId,
          providerId: "credential",
        },
      });

      if (existingAccount) {
        await tx.account.update({
          where: { id: existingAccount.id },
          data: { password: passwordHash },
        });
      } else {
        await tx.account.create({
          data: {
            id: crypto.randomUUID(),
            accountId: userId,
            providerId: "credential",
            userId,
            password: passwordHash,
          },
        });
      }

      const claimedResetRequest = await tx.passwordResetRequest.updateMany({
        where: {
          id: resetRequest.id,
          userId,
          tokenHash,
          usedAt: null,
          expiresAt: { gte: completedAt },
          status: { in: ACTIVE_RESET_STATUSES },
        },
        data: {
          usedAt: completedAt,
          status: "used",
        },
      });

      if (claimedResetRequest.count !== 1) {
        throw new InvalidResetTokenError();
      }

      await tx.passwordResetRequest.updateMany({
        where: {
          userId,
          id: { not: resetRequest.id },
          usedAt: null,
          status: { in: ACTIVE_RESET_STATUSES },
        },
        data: { status: "superseded" },
      });

      await tx.session.deleteMany({
        where: { userId },
      });

      await tx.auditEvent.create({
        data: {
          userId,
          eventType: "password_reset.completed",
          message: "Password reset completed.",
          metadataJson: {
            resetRequestId: resetRequest.id,
          },
        },
      });
    });

    return NextResponse.json({ ok: true, message: "Password updated. You can sign in now." });
  } catch (error) {
    if (error instanceof InvalidResetTokenError) {
      return NextResponse.json({ ok: false, message: INVALID_TOKEN_MESSAGE }, { status: 400 });
    }

    return NextResponse.json({ ok: false, message: "Unable to reset password." }, { status: 500 });
  }
}
