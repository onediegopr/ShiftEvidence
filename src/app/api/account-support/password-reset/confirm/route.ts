import crypto from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { NextResponse } from "next/server";
import { hashRecoveryValue } from "../../../../../lib/account-recovery";
import { prisma } from "../../../../../lib/prisma";

const INVALID_TOKEN_MESSAGE = "This reset link is invalid or has expired.";
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 128;
const RESET_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

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
      resetRequest.status === "superseded"
    ) {
      return NextResponse.json({ ok: false, message: INVALID_TOKEN_MESSAGE }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);
    const existingAccount = await prisma.account.findFirst({
      where: {
        userId: resetRequest.userId,
        providerId: "credential",
      },
    });

    await prisma.$transaction(async (tx) => {
      if (existingAccount) {
        await tx.account.update({
          where: { id: existingAccount.id },
          data: { password: passwordHash },
        });
      } else {
        await tx.account.create({
          data: {
            id: crypto.randomUUID(),
            accountId: resetRequest.userId!,
            providerId: "credential",
            userId: resetRequest.userId!,
            password: passwordHash,
          },
        });
      }

      await tx.passwordResetRequest.update({
        where: { id: resetRequest.id },
        data: {
          usedAt: new Date(),
          status: "used",
        },
      });

      await tx.passwordResetRequest.updateMany({
        where: {
          userId: resetRequest.userId,
          id: { not: resetRequest.id },
          usedAt: null,
          status: { in: ["pending", "email_sent", "manual_pending"] },
        },
        data: { status: "superseded" },
      });

      await tx.session.deleteMany({
        where: { userId: resetRequest.userId! },
      });

      await tx.auditEvent.create({
        data: {
          userId: resetRequest.userId,
          eventType: "password_reset.completed",
          message: "Password reset completed.",
          metadataJson: {
            resetRequestId: resetRequest.id,
          },
        },
      });
    });

    return NextResponse.json({ ok: true, message: "Password updated. You can sign in now." });
  } catch {
    return NextResponse.json({ ok: false, message: "Unable to reset password." }, { status: 500 });
  }
}
