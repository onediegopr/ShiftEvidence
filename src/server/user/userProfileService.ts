import { prisma } from "../../lib/prisma";
import { INPUT_LIMITS, normalizeOptionalTextInput, normalizeRequiredTextInput } from "../validation/inputLimits";

export async function upsertUserProfileFromSession(params: {
  userId: string;
  email: string;
  name?: string | null;
  imageUrl?: string | null;
  authProvider?: string | null;
}) {
  const email = normalizeRequiredTextInput(params.email, "Email", INPUT_LIMITS.email);
  const name = normalizeOptionalTextInput(params.name, "User name", INPUT_LIMITS.shortText);
  const imageUrl = normalizeOptionalTextInput(params.imageUrl, "Profile image URL", INPUT_LIMITS.url);
  const authProvider = normalizeOptionalTextInput(params.authProvider, "Auth provider", INPUT_LIMITS.shortText);

  return prisma.userProfile.upsert({
    where: {
      userId: params.userId,
    },
    create: {
      userId: params.userId,
      email,
      name,
      imageUrl,
      authProvider,
      emailVerified: true,
    },
    update: {
      email,
      name,
      imageUrl,
      authProvider,
    },
  });
}
