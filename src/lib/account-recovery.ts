import crypto from "node:crypto";
import { env } from "./env";

export const PASSWORD_RESET_TOKEN_TTL_MINUTES = 60;
export const PASSWORD_RESET_NEUTRAL_MESSAGE =
  "If an account exists, we'll send recovery instructions.";

export type PasswordRecoveryDeliveryMode = "email" | "manual";

export const normalizeRecoveryEmail = (email: string) => email.trim().toLowerCase();

export const createPasswordResetToken = () => crypto.randomBytes(32).toString("base64url");

export const hashRecoveryValue = (value: string) => {
  if (!env.BETTER_AUTH_SECRET) {
    throw new Error("BETTER_AUTH_SECRET is required to hash recovery values.");
  }

  return crypto.createHash("sha256").update(`${env.BETTER_AUTH_SECRET}:${value}`).digest("hex");
};

export const getPasswordResetExpiry = () =>
  new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MINUTES * 60 * 1000);

export const getClientIpHash = (request: Request) => {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();
  const ip = forwardedFor || realIp;

  return ip ? hashRecoveryValue(ip) : null;
};

export const getUserAgentHash = (request: Request) => {
  const userAgent = request.headers.get("user-agent")?.trim();

  return userAgent ? hashRecoveryValue(userAgent) : null;
};

export const getPasswordResetUrl = (token: string) => {
  const baseUrl = env.NEXT_PUBLIC_APP_URL || env.BETTER_AUTH_URL || "http://localhost:3000";
  const url = new URL("/reset-password", baseUrl);
  url.searchParams.set("token", token);
  return url.toString();
};

export const detectRecoveryEmailProvider = () => {
  if (env.RESEND_API_KEY && env.EMAIL_FROM) {
    return "resend";
  }

  return null;
};

export const sendPasswordRecoveryEmail = async ({
  email,
  resetUrl,
}: {
  email: string;
  resetUrl: string;
}): Promise<PasswordRecoveryDeliveryMode> => {
  if (detectRecoveryEmailProvider() !== "resend") {
    return "manual";
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: email,
      subject: "Reset your ShiftReadiness password",
      html: `
        <p>We received a request to reset your ShiftReadiness password.</p>
        <p><a href="${resetUrl}">Reset your password</a></p>
        <p>This link expires in ${PASSWORD_RESET_TOKEN_TTL_MINUTES} minutes and can be used once.</p>
        <p>If you did not request this, you can ignore this email.</p>
      `,
      text: [
        "We received a request to reset your ShiftReadiness password.",
        `Reset your password: ${resetUrl}`,
        `This link expires in ${PASSWORD_RESET_TOKEN_TTL_MINUTES} minutes and can be used once.`,
        "If you did not request this, you can ignore this email.",
      ].join("\n\n"),
    }),
  });

  if (!response.ok) {
    throw new Error("Recovery email provider rejected the request.");
  }

  return "email";
};
