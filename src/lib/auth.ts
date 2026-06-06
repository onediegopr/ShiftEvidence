import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { getAuthTrustedOrigins } from "../server/security/trustedOrigins";
import { env } from "./env";
import { prisma } from "./prisma";

type AuthInstance = ReturnType<typeof betterAuth>;

let cachedAuth: AuthInstance | null = null;
const fallbackAuth = {
  handler: async () => new Response("Auth is not configured.", { status: 503 }),
  api: {
    getSession: async () => null,
  },
} as unknown as AuthInstance;

function isAuthConfigured() {
  return Boolean(env.BETTER_AUTH_SECRET && env.BETTER_AUTH_URL);
}

function getAuthInstance(): AuthInstance {
  if (!isAuthConfigured()) {
    return fallbackAuth;
  }

  if (!cachedAuth) {
    cachedAuth = betterAuth({
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
    }) as unknown as AuthInstance;
  }

  return cachedAuth;
}

const authTarget = {
  handler(request: Request) {
    return getAuthInstance().handler(request);
  },
};

export const auth = new Proxy(authTarget, {
  get(target, prop, receiver) {
    if (prop in target) {
      return Reflect.get(target, prop, receiver);
    }

    const instance = getAuthInstance() as Record<PropertyKey, unknown>;
    const value = instance[prop];

    if (typeof value === "function") {
      return value.bind(instance);
    }

    return value;
  },
  has(target, prop) {
    return prop in target || prop === "api";
  },
}) as AuthInstance;
