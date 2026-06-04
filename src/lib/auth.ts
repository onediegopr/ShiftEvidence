import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { getAuthTrustedOrigins } from "../server/security/trustedOrigins";
import { env } from "./env";
import { prisma } from "./prisma";

export const auth = betterAuth({
  appName: "ShiftReadiness",
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: getAuthTrustedOrigins(),
  allowLocalhost: true,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
});
