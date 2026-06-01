import { Prisma } from "@prisma/client";
import { prisma } from "../../../lib/prisma";
import { INPUT_LIMITS, normalizeOptionalTextInput } from "../../validation/inputLimits";

export type BillingMatchUserCandidate = {
  id: string;
  email: string;
  name: string;
};

export type BillingMatchWorkspaceCandidate = {
  id: string;
  name: string;
  companyName: string | null;
  ownerEmail: string;
};

export type BillingMatchAssessmentCandidate = {
  id: string;
  title: string;
  clientLabel: string | null;
  workspaceId: string;
  workspaceName: string;
};

export type BillingAdminMatchCandidates = {
  users: BillingMatchUserCandidate[];
  workspaces: BillingMatchWorkspaceCandidate[];
  assessments: BillingMatchAssessmentCandidate[];
};

function normalizeQuery(value: string | null | undefined) {
  return normalizeOptionalTextInput(value, "Billing match search", INPUT_LIMITS.shortText);
}

function buildUserWhere(query: string | null, customerEmail: string | null): Prisma.UserWhereInput {
  const filters: Prisma.UserWhereInput[] = [];

  if (query) {
    filters.push({
      OR: [
        { email: { contains: query, mode: "insensitive" } },
        { name: { contains: query, mode: "insensitive" } },
      ],
    });
  }

  if (customerEmail) {
    filters.push({
      email: {
        equals: customerEmail,
        mode: "insensitive",
      },
    });
  }

  return filters.length > 0 ? { OR: filters } : {};
}

function buildWorkspaceWhere(query: string | null): Prisma.WorkspaceWhereInput {
  if (!query) return {};

  return {
    OR: [
      { id: { contains: query, mode: "insensitive" } },
      { name: { contains: query, mode: "insensitive" } },
      { companyName: { contains: query, mode: "insensitive" } },
      { ownerUser: { email: { contains: query, mode: "insensitive" } } },
    ],
  };
}

function buildAssessmentWhere(query: string | null): Prisma.AssessmentWhereInput {
  return {
    archivedAt: null,
    ...(query
      ? {
          OR: [
            { id: { contains: query, mode: "insensitive" } },
            { title: { contains: query, mode: "insensitive" } },
            { clientLabel: { contains: query, mode: "insensitive" } },
            { workspace: { name: { contains: query, mode: "insensitive" } } },
            { workspace: { ownerUser: { email: { contains: query, mode: "insensitive" } } } },
          ],
        }
      : {}),
  };
}

export async function getBillingAdminMatchCandidates(params?: {
  query?: string | null;
  customerEmail?: string | null;
  limit?: number;
}): Promise<BillingAdminMatchCandidates> {
  const query = normalizeQuery(params?.query);
  const customerEmail = normalizeQuery(params?.customerEmail)?.toLowerCase() ?? null;
  const limit = Math.min(Math.max(params?.limit ?? 8, 1), 20);

  const [users, workspaces, assessments] = await Promise.all([
    prisma.user.findMany({
      where: buildUserWhere(query, customerEmail),
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        email: true,
        name: true,
      },
    }),
    prisma.workspace.findMany({
      where: buildWorkspaceWhere(query),
      orderBy: { updatedAt: "desc" },
      take: limit,
      select: {
        id: true,
        name: true,
        companyName: true,
        ownerUser: {
          select: {
            email: true,
          },
        },
      },
    }),
    prisma.assessment.findMany({
      where: buildAssessmentWhere(query),
      orderBy: { updatedAt: "desc" },
      take: limit,
      select: {
        id: true,
        title: true,
        clientLabel: true,
        workspaceId: true,
        workspace: {
          select: {
            name: true,
          },
        },
      },
    }),
  ]);

  return {
    users: users.map((user) => ({
      id: user.id,
      email: user.email,
      name: user.name,
    })),
    workspaces: workspaces.map((workspace) => ({
      id: workspace.id,
      name: workspace.name,
      companyName: workspace.companyName,
      ownerEmail: workspace.ownerUser.email,
    })),
    assessments: assessments.map((assessment) => ({
      id: assessment.id,
      title: assessment.title,
      clientLabel: assessment.clientLabel,
      workspaceId: assessment.workspaceId,
      workspaceName: assessment.workspace.name,
    })),
  };
}
