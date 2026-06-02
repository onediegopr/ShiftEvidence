import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { auth } from "../../lib/auth";
import { env } from "../../lib/env";
import { upsertUserProfileFromSession } from "../user/userProfileService";
import { isDemoUserEmail } from "../demo/demoGuards";

function normalizeEmailForAdmin(email: string) {
  return email.trim().toLowerCase();
}

function parseAdminEmails() {
  const emailsStr = env?.ADMIN_EMAILS || "";
  return new Set(
    emailsStr.split(",")
      .map(normalizeEmailForAdmin)
      .filter((email) => Boolean(email) && !email.includes("*")),
  );
}

export function getAdminEmails() {
  return parseAdminEmails();
}

export function isAdminEmail(email: string | null | undefined) {
  if (!email) {
    return false;
  }

  const adminEmails = parseAdminEmails();
  if (adminEmails.size === 0) {
    return false;
  }

  return adminEmails.has(normalizeEmailForAdmin(email));
}

export function isCurrentUserAdmin(email: string | null | undefined) {
  return isAdminEmail(email);
}

export async function getCurrentAdminUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  await upsertUserProfileFromSession({
    userId: session.user.id,
    email: session.user.email,
    name: session.user.name,
    imageUrl: session.user.image ?? null,
    authProvider: "better-auth",
  });

  if (isDemoUserEmail(session.user.email) || !isAdminEmail(session.user.email)) {
    notFound();
  }

  return session;
}

export async function getCurrentAdminUserForConsole() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  await upsertUserProfileFromSession({
    userId: session.user.id,
    email: session.user.email,
    name: session.user.name,
    imageUrl: session.user.image ?? null,
    authProvider: "better-auth",
  });

  return {
    session,
    isAdmin: !isDemoUserEmail(session.user.email) && isAdminEmail(session.user.email),
  };
}

export async function requireAdminSession() {
  return getCurrentAdminUser();
}

export async function requireAdmin() {
  return getCurrentAdminUser();
}
