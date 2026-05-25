import {
  type EntitlementKey,
  type EntitlementStatus,
  type Prisma,
  PrismaClient,
} from "@prisma/client";
import { prisma } from "../../lib/prisma";

export type UnlockType =
  | "readiness_report"
  | "readiness_report_pro"
  | "storage_addon"
  | "technical_review";

type DbClient = PrismaClient | Prisma.TransactionClient;

const unlockTypeToEntitlements: Record<UnlockType, EntitlementKey[]> = {
  readiness_report: ["full_report_unlocked"],
  readiness_report_pro: ["full_report_unlocked", "pro_matrix_unlocked"],
  storage_addon: ["storage_readiness_unlocked"],
  technical_review: ["review_call_unlocked"],
};

export function mapUnlockTypeToEntitlements(unlockType: UnlockType) {
  return unlockTypeToEntitlements[unlockType] ?? [];
}

export function getAssessmentEntitlements(assessment: {
  entitlements?: Array<{
    entitlementKey: EntitlementKey;
    status: EntitlementStatus;
    source: string | null;
    purchasedAt: Date | null;
  }>;
}) {
  return assessment.entitlements ?? [];
}

export function hasEntitlement(
  assessment: {
    entitlements?: Array<{
      entitlementKey: EntitlementKey;
      status: EntitlementStatus;
    }>;
  },
  entitlementKey: EntitlementKey,
) {
  return (assessment.entitlements ?? []).some(
    (entitlement) =>
      entitlement.entitlementKey === entitlementKey && entitlement.status !== "locked",
  );
}

export function getUnlockedEntitlementKeys(assessment: {
  entitlements?: Array<{
    entitlementKey: EntitlementKey;
    status: EntitlementStatus;
  }>;
}) {
  return (assessment.entitlements ?? [])
    .filter((entitlement) => entitlement.status !== "locked")
    .map((entitlement) => entitlement.entitlementKey);
}

export async function grantAssessmentEntitlement(params: {
  assessmentId: string;
  entitlementKey: EntitlementKey;
  source?: string | null;
  grantedAt?: Date;
  tx?: DbClient;
}) {
  const db = params.tx ?? prisma;
  const grantedAt = params.grantedAt ?? new Date();

  return db.assessmentEntitlement.upsert({
    where: {
      assessmentId_entitlementKey: {
        assessmentId: params.assessmentId,
        entitlementKey: params.entitlementKey,
      },
    },
    create: {
      assessmentId: params.assessmentId,
      entitlementKey: params.entitlementKey,
      status: "granted",
      source: params.source ?? "manual_unlock",
      purchasedAt: grantedAt,
    },
    update: {
      status: "granted",
      source: params.source ?? "manual_unlock",
      purchasedAt: grantedAt,
    },
  });
}

export async function revokeAssessmentEntitlement(params: {
  assessmentId: string;
  entitlementKey: EntitlementKey;
  source?: string | null;
  tx?: DbClient;
}) {
  const db = params.tx ?? prisma;
  return db.assessmentEntitlement.upsert({
    where: {
      assessmentId_entitlementKey: {
        assessmentId: params.assessmentId,
        entitlementKey: params.entitlementKey,
      },
    },
    create: {
      assessmentId: params.assessmentId,
      entitlementKey: params.entitlementKey,
      status: "locked",
      source: params.source ?? "manual_unlock",
    },
    update: {
      status: "locked",
      source: params.source ?? "manual_unlock",
      purchasedAt: null,
    },
  });
}

export async function grantEntitlementsForUnlockType(params: {
  assessmentId: string;
  unlockType: UnlockType;
  source?: string | null;
  tx?: DbClient;
}) {
  const entitlementKeys = mapUnlockTypeToEntitlements(params.unlockType);
  const granted = [] as Array<{ entitlementKey: EntitlementKey }>;

  for (const entitlementKey of entitlementKeys) {
    await grantAssessmentEntitlement({
      assessmentId: params.assessmentId,
      entitlementKey,
      source: params.source ?? "manual_unlock",
      tx: params.tx,
    });

    granted.push({ entitlementKey });
  }

  return granted;
}

