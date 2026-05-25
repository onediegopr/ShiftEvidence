import { prisma } from "../../lib/prisma";

export async function ensureDefaultWorkspace(params: {
  userId: string;
  companyName?: string | null;
  userDisplayName?: string | null;
}) {
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
        companyName: params.companyName ?? params.userDisplayName ?? null,
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
