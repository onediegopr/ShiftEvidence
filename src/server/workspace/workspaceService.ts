import { prisma } from "../../lib/prisma";
import { INPUT_LIMITS, normalizeOptionalTextInput } from "../validation/inputLimits";

export async function ensureDefaultWorkspace(params: {
  userId: string;
  companyName?: string | null;
  userDisplayName?: string | null;
}) {
  const companyName = normalizeOptionalTextInput(params.companyName, "Company name", INPUT_LIMITS.companyName);
  const userDisplayName = normalizeOptionalTextInput(params.userDisplayName, "User display name", INPUT_LIMITS.companyName);

  const existing = await prisma.workspace.findFirst({
    where: {
      ownerUserId: params.userId,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  if (existing) {
    return existing;
  }

  return prisma.$transaction(async (tx) => {
    const workspace = await tx.workspace.create({
      data: {
        ownerUserId: params.userId,
        name: "Default Readiness Workspace",
        companyName: companyName ?? userDisplayName,
        plan: "free",
        billingStatus: "none",
        members: {
          create: {
            userId: params.userId,
            role: "owner",
          },
        },
      },
    });

    await tx.auditEvent.create({
      data: {
        userId: params.userId,
        workspaceId: workspace.id,
        eventType: "workspace.created",
        message: "Created default readiness workspace.",
      },
    });

    return workspace;
  });
}
