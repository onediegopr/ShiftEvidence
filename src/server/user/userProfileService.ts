import { prisma } from "../../lib/prisma";

export async function upsertUserProfileFromSession(params: {
  userId: string;
  email: string;
  name?: string | null;
  imageUrl?: string | null;
  authProvider?: string | null;
}) {
  return prisma.userProfile.upsert({
    where: {
      userId: params.userId,
    },
    create: {
      userId: params.userId,
      email: params.email,
      name: params.name ?? null,
      imageUrl: params.imageUrl ?? null,
      authProvider: params.authProvider ?? null,
      emailVerified: true,
    },
    update: {
      email: params.email,
      name: params.name ?? null,
      imageUrl: params.imageUrl ?? null,
      authProvider: params.authProvider ?? null,
    },
  });
}
