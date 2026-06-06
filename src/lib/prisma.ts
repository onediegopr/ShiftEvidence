import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "./env";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

let prismaClient: PrismaClient | null = globalForPrisma.prisma ?? null;

function getPrismaClient() {
  if (prismaClient) {
    return prismaClient;
  }

  if (!env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required to initialize PrismaClient.");
  }

  prismaClient = new PrismaClient({
    adapter: new PrismaPg({
      connectionString: env.DATABASE_URL,
    }),
  });

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prismaClient;
  }

  return prismaClient;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient();
    const value = Reflect.get(client, prop, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
  set(_target, prop, value) {
    const client = getPrismaClient();
    Reflect.set(client, prop, value, client);
    return true;
  },
}) as PrismaClient;
