import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { recordAdminAuditEvent } from "../admin/adminOpsService";
import {
  type LicensingPricingRefreshStatus,
  type LicensingPricingSnapshotInput,
  type LicensingPricingSnapshotStatus,
  type LicensingPricingVendor,
  assertSnapshotUsableForFinancialCalculations,
  normalizePricingStatus,
  normalizeRefreshStatus,
  normalizeUsdCurrency,
  validatePricingSnapshotInput,
  validateSnapshotCanBeApproved,
} from "./licensingPricingValidation";
import {
  STATIC_EUR_USD_RATE,
  buildPricingSourceNote,
  listLicensingPriceItems,
} from "../../lib/licensing/pricingSource";

export const PRICING_INTELLIGENCE_ENABLED_KEY = "pricing_intelligence.enabled";

const FRESHNESS_DAYS = 90;

type AdminActor = {
  actorUserId?: string | null;
  actorEmail?: string | null;
};

type ChangelogParams = AdminActor & {
  snapshotId?: string | null;
  entityType: string;
  entityId?: string | null;
  action: string;
  previousJson?: Prisma.InputJsonValue | null;
  nextJson?: Prisma.InputJsonValue | null;
  source: string;
};

function freshnessCutoff() {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - FRESHNESS_DAYS);
  return cutoff;
}

function adminAuditMetadata(params: {
  snapshotId?: string | null;
  vendor?: string | null;
  status?: string | null;
  itemCount?: number;
  currency?: string | null;
  sourceName?: string | null;
  lastCheckedAt?: Date | null;
}) {
  return {
    snapshotId: params.snapshotId ?? null,
    vendor: params.vendor ?? null,
    status: params.status ?? null,
    itemCount: params.itemCount ?? 0,
    currency: params.currency ?? "USD",
    sourceName: params.sourceName ?? null,
    lastCheckedAt: params.lastCheckedAt?.toISOString() ?? null,
  };
}

export async function getPricingIntelligenceEnabled() {
  const setting = await prisma.systemSetting.findUnique({
    where: { key: PRICING_INTELLIGENCE_ENABLED_KEY },
  });

  if (!setting || typeof setting.valueJson !== "object" || setting.valueJson === null || Array.isArray(setting.valueJson)) {
    return true;
  }

  return (setting.valueJson as Record<string, unknown>).enabled !== false;
}

export async function recordPricingChangeLog(params: ChangelogParams) {
  return prisma.licensingPricingChangeLog.create({
    data: {
      snapshotId: params.snapshotId ?? null,
      entityType: params.entityType,
      entityId: params.entityId ?? null,
      action: params.action,
      previousJson: params.previousJson ?? Prisma.JsonNull,
      nextJson: params.nextJson ?? Prisma.JsonNull,
      source: params.source,
      performedByUserId: params.actorUserId ?? null,
    },
  });
}

export async function listPricingSnapshots(params: {
  vendor?: LicensingPricingVendor;
  status?: LicensingPricingSnapshotStatus;
  take?: number;
} = {}) {
  return prisma.licensingPricingSnapshot.findMany({
    where: {
      vendor: params.vendor,
      status: params.status,
    },
    include: {
      items: {
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    take: params.take ?? 50,
  });
}

export function listApprovedPricingSnapshots(params?: { vendor?: LicensingPricingVendor; take?: number }) {
  return listPricingSnapshots({ vendor: params?.vendor, status: "approved", take: params?.take });
}

export async function listPendingPricingSnapshots(params?: { take?: number }) {
  return prisma.licensingPricingSnapshot.findMany({
    where: {
      status: { in: ["draft", "pending_review"] },
    },
    include: {
      items: {
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    take: params?.take ?? 50,
  });
}

export async function getPricingIntelligenceSummary() {
  const cutoff = freshnessCutoff();
  const [
    enabled,
    approvedCount,
    pendingCount,
    staleSourcesCount,
    lowConfidenceSourcesCount,
    vmwareLastChecked,
    proxmoxLastChecked,
    refreshRuns,
    changeLogs,
  ] = await Promise.all([
    getPricingIntelligenceEnabled(),
    prisma.licensingPricingSnapshot.count({ where: { status: "approved" } }),
    prisma.licensingPricingSnapshot.count({ where: { status: { in: ["draft", "pending_review"] } } }),
    prisma.licensingPricingSnapshot.count({
      where: {
        status: { in: ["approved", "pending_review"] },
        OR: [{ lastCheckedAt: null }, { lastCheckedAt: { lt: cutoff } }],
      },
    }),
    prisma.licensingPricingSnapshot.count({
      where: {
        status: { in: ["draft", "pending_review", "approved"] },
        sourceType: { in: ["placeholder", "market_estimate"] },
      },
    }),
    prisma.licensingPricingSnapshot.findFirst({
      where: { vendor: "vmware", lastCheckedAt: { not: null } },
      orderBy: { lastCheckedAt: "desc" },
      select: { lastCheckedAt: true, sourceName: true, status: true },
    }),
    prisma.licensingPricingSnapshot.findFirst({
      where: { vendor: "proxmox", lastCheckedAt: { not: null } },
      orderBy: { lastCheckedAt: "desc" },
      select: { lastCheckedAt: true, sourceName: true, status: true },
    }),
    prisma.licensingPricingRefreshRun.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.licensingPricingChangeLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  return {
    enabled,
    approvedCount,
    pendingCount,
    staleSourcesCount,
    lowConfidenceSourcesCount,
    vmwareLastChecked,
    proxmoxLastChecked,
    refreshRuns,
    changeLogs,
    freshnessDays: FRESHNESS_DAYS,
  };
}

export async function createDraftPricingSnapshot(params: AdminActor & LicensingPricingSnapshotInput) {
  const normalized = validatePricingSnapshotInput(params);

  const snapshot = await prisma.licensingPricingSnapshot.create({
    data: {
      vendor: normalized.vendor,
      status: normalized.status,
      currency: normalized.currency,
      sourceName: normalized.sourceName,
      sourceUrl: normalized.sourceUrl,
      sourceType: normalized.sourceType,
      lastCheckedAt: normalized.lastCheckedAt,
      effectiveDate: normalized.effectiveDate,
      notesInternal: normalized.notesInternal,
      metadataJson: normalized.metadataJson,
      items: {
        create: normalized.items.map((item) => ({
          vendor: item.vendor,
          productName: item.productName,
          edition: item.edition,
          sku: item.sku,
          metric: item.metric,
          unitPriceUsd: item.unitPriceUsd,
          minUnits: item.minUnits,
          termMonths: item.termMonths,
          assumptionsJson: item.assumptionsJson,
          sourceNote: item.sourceNote,
        })),
      },
    },
    include: { items: true },
  });

  await recordPricingChangeLog({
    actorUserId: params.actorUserId,
    actorEmail: params.actorEmail,
    snapshotId: snapshot.id,
    entityType: "LicensingPricingSnapshot",
    entityId: snapshot.id,
    action: "pricing_snapshot_created",
    nextJson: {
      vendor: snapshot.vendor,
      status: snapshot.status,
      currency: snapshot.currency,
      sourceType: snapshot.sourceType,
      itemCount: snapshot.items.length,
    },
    source: "admin",
  });

  await recordAdminAuditEvent({
    actorUserId: params.actorUserId,
    actorEmail: params.actorEmail,
    eventType: "pricing_snapshot_created",
    entityType: "LicensingPricingSnapshot",
    entityId: snapshot.id,
    message: "Snapshot de pricing creado desde Pricing Intelligence.",
    metadataJson: adminAuditMetadata({
      snapshotId: snapshot.id,
      vendor: snapshot.vendor,
      status: snapshot.status,
      itemCount: snapshot.items.length,
      currency: snapshot.currency,
      sourceName: snapshot.sourceName,
      lastCheckedAt: snapshot.lastCheckedAt,
    }),
  });

  return snapshot;
}

export async function approvePricingSnapshot(params: AdminActor & { snapshotId: string }) {
  const snapshot = await prisma.licensingPricingSnapshot.findUnique({
    where: { id: params.snapshotId },
    include: { items: true },
  });

  if (!snapshot) {
    throw new Error("Snapshot de pricing no encontrado.");
  }

  validateSnapshotCanBeApproved(snapshot);

  const updated = await prisma.licensingPricingSnapshot.update({
    where: { id: snapshot.id },
    data: {
      status: "approved",
      approvedAt: new Date(),
      approvedByUserId: params.actorUserId ?? null,
      rejectedAt: null,
      rejectedByUserId: null,
      rejectionReason: null,
    },
    include: { items: true },
  });

  assertSnapshotUsableForFinancialCalculations(updated.status);

  await recordPricingChangeLog({
    actorUserId: params.actorUserId,
    actorEmail: params.actorEmail,
    snapshotId: updated.id,
    entityType: "LicensingPricingSnapshot",
    entityId: updated.id,
    action: "pricing_snapshot_approved",
    previousJson: { status: snapshot.status },
    nextJson: { status: updated.status },
    source: "admin",
  });

  await recordAdminAuditEvent({
    actorUserId: params.actorUserId,
    actorEmail: params.actorEmail,
    eventType: "pricing_snapshot_approved",
    entityType: "LicensingPricingSnapshot",
    entityId: updated.id,
    message: "Snapshot de pricing aprobado manualmente.",
    metadataJson: adminAuditMetadata({
      snapshotId: updated.id,
      vendor: updated.vendor,
      status: updated.status,
      itemCount: updated.items.length,
      currency: updated.currency,
      sourceName: updated.sourceName,
      lastCheckedAt: updated.lastCheckedAt,
    }),
  });

  return updated;
}

export async function rejectPricingSnapshot(params: AdminActor & { snapshotId: string; rejectionReason: string }) {
  const reason = params.rejectionReason.trim();
  if (!reason) {
    throw new Error("El motivo de rechazo es obligatorio.");
  }

  const snapshot = await prisma.licensingPricingSnapshot.findUnique({
    where: { id: params.snapshotId },
    include: { items: true },
  });

  if (!snapshot) {
    throw new Error("Snapshot de pricing no encontrado.");
  }

  const updated = await prisma.licensingPricingSnapshot.update({
    where: { id: snapshot.id },
    data: {
      status: "rejected",
      rejectedAt: new Date(),
      rejectedByUserId: params.actorUserId ?? null,
      rejectionReason: reason.slice(0, 1000),
    },
    include: { items: true },
  });

  await recordPricingChangeLog({
    actorUserId: params.actorUserId,
    actorEmail: params.actorEmail,
    snapshotId: updated.id,
    entityType: "LicensingPricingSnapshot",
    entityId: updated.id,
    action: "pricing_snapshot_rejected",
    previousJson: { status: snapshot.status },
    nextJson: { status: updated.status, reason: updated.rejectionReason },
    source: "admin",
  });

  await recordAdminAuditEvent({
    actorUserId: params.actorUserId,
    actorEmail: params.actorEmail,
    eventType: "pricing_snapshot_rejected",
    entityType: "LicensingPricingSnapshot",
    entityId: updated.id,
    message: "Snapshot de pricing rechazado manualmente.",
    metadataJson: adminAuditMetadata({
      snapshotId: updated.id,
      vendor: updated.vendor,
      status: updated.status,
      itemCount: updated.items.length,
      currency: updated.currency,
      sourceName: updated.sourceName,
      lastCheckedAt: updated.lastCheckedAt,
    }),
  });

  return updated;
}

export async function archivePricingSnapshot(params: AdminActor & { snapshotId: string }) {
  const snapshot = await prisma.licensingPricingSnapshot.findUnique({
    where: { id: params.snapshotId },
    include: { items: true },
  });

  if (!snapshot) {
    throw new Error("Snapshot de pricing no encontrado.");
  }

  const updated = await prisma.licensingPricingSnapshot.update({
    where: { id: snapshot.id },
    data: { status: "archived" },
    include: { items: true },
  });

  await recordPricingChangeLog({
    actorUserId: params.actorUserId,
    actorEmail: params.actorEmail,
    snapshotId: updated.id,
    entityType: "LicensingPricingSnapshot",
    entityId: updated.id,
    action: "pricing_snapshot_archived",
    previousJson: { status: snapshot.status },
    nextJson: { status: updated.status },
    source: "admin",
  });

  await recordAdminAuditEvent({
    actorUserId: params.actorUserId,
    actorEmail: params.actorEmail,
    eventType: "pricing_snapshot_archived",
    entityType: "LicensingPricingSnapshot",
    entityId: updated.id,
    message: "Snapshot de pricing archivado manualmente.",
    metadataJson: adminAuditMetadata({
      snapshotId: updated.id,
      vendor: updated.vendor,
      status: updated.status,
      itemCount: updated.items.length,
      currency: updated.currency,
      sourceName: updated.sourceName,
      lastCheckedAt: updated.lastCheckedAt,
    }),
  });

  return updated;
}

export async function createPricingRefreshRun(params: AdminActor) {
  return prisma.licensingPricingRefreshRun.create({
    data: {
      status: "running",
      triggeredByUserId: params.actorUserId ?? null,
    },
  });
}

export async function completePricingRefreshRun(params: {
  refreshRunId: string;
  status: LicensingPricingRefreshStatus;
  summary: string;
  detailsJson?: Prisma.InputJsonValue;
  createdDraftSnapshotsCount?: number;
  errorsCount?: number;
}) {
  const status = normalizeRefreshStatus(params.status);
  return prisma.licensingPricingRefreshRun.update({
    where: { id: params.refreshRunId },
    data: {
      status,
      completedAt: new Date(),
      summary: params.summary,
      detailsJson: params.detailsJson ?? Prisma.JsonNull,
      createdDraftSnapshotsCount: params.createdDraftSnapshotsCount ?? 0,
      errorsCount: params.errorsCount ?? 0,
    },
  });
}

export async function runManualPricingRefresh(params: AdminActor) {
  const run = await createPricingRefreshRun(params);
  const checkedAt = new Date();
  const existingCount = await prisma.licensingPricingSnapshot.count();

  if (existingCount > 0) {
    const completedRun = await completePricingRefreshRun({
      refreshRunId: run.id,
      status: "no_changes",
      summary: "No se crearon snapshots nuevos. El refresh manual no aprueba cambios automaticamente.",
      detailsJson: {
        mode: "manual_controlled",
        connectors: "not_configured",
        approvedAutomatically: false,
      },
    });

    await recordAdminAuditEvent({
      actorUserId: params.actorUserId,
      actorEmail: params.actorEmail,
      eventType: "pricing_snapshot_refreshed",
      entityType: "LicensingPricingRefreshRun",
      entityId: completedRun.id,
      message: "Refresh manual de Pricing Intelligence ejecutado sin cambios.",
      metadataJson: {
        status: completedRun.status,
        createdDraftSnapshotsCount: completedRun.createdDraftSnapshotsCount,
        errorsCount: completedRun.errorsCount,
      },
    });

    return completedRun;
  }

  const vmwareItems = listLicensingPriceItems("vmware");
  const proxmoxItems = listLicensingPriceItems("proxmox");

  const snapshots = await Promise.all([
    createDraftPricingSnapshot({
      actorUserId: params.actorUserId,
      actorEmail: params.actorEmail,
      vendor: "vmware",
      status: "pending_review",
      currency: "USD",
      sourceName: vmwareItems[0]?.metadata.sourceName ?? "VMware/Broadcom Benchmark Estimates",
      sourceType: "market_estimate",
      lastCheckedAt: checkedAt,
      notesInternal: "Cargado por refresh administrativo desde fuente central de pricing. Valores estimativos por core para modelado financiero.",
      metadataJson: {
        refreshRunId: run.id,
        approvedAutomatically: false,
        pricingSource: "src/lib/licensing/pricingSource.ts",
        normalizedCurrency: "USD",
      },
      items: vmwareItems.map((item) => ({
        vendor: "vmware" as const,
        productName: item.product,
        edition: item.tier.toUpperCase(),
        metric: item.billingMetric === "cpu" ? "socket" as const : item.billingMetric,
        unitPriceUsd: new Prisma.Decimal(item.normalizedUnitPrice.amount),
        minUnits: item.minUnits ?? null,
        termMonths: 12,
        sourceNote: buildPricingSourceNote(item),
      })),
    }),
    createDraftPricingSnapshot({
      actorUserId: params.actorUserId,
      actorEmail: params.actorEmail,
      vendor: "proxmox",
      status: "pending_review",
      currency: "USD",
      sourceName: proxmoxItems[0]?.metadata.sourceName ?? "Proxmox VE Official List Pricing",
      sourceType: "official",
      lastCheckedAt: checkedAt,
      notesInternal: "Tarifas oficiales de Proxmox Server Solutions desde fuente central, normalizadas de EUR a USD con metadata FX.",
      metadataJson: {
        refreshRunId: run.id,
        approvedAutomatically: false,
        pricingSource: "src/lib/licensing/pricingSource.ts",
        normalizedCurrency: "USD",
        fx: STATIC_EUR_USD_RATE,
      },
      items: proxmoxItems.map((item) => ({
        vendor: "proxmox" as const,
        productName: item.product,
        edition: item.tier.charAt(0).toUpperCase() + item.tier.slice(1),
        metric: item.billingMetric === "cpu" ? "socket" as const : item.billingMetric,
        unitPriceUsd: new Prisma.Decimal(item.normalizedUnitPrice.amount),
        minUnits: item.minUnits ?? null,
        termMonths: 12,
        sourceNote: buildPricingSourceNote(item),
      })),
    }),
  ]);

  const completedRun = await completePricingRefreshRun({
    refreshRunId: run.id,
    status: "completed",
    summary: "Se crearon snapshots de pricing oficiales y estimados de mercado listos para revision y aprobacion admin.",
    detailsJson: {
      mode: "manual_controlled",
      connectors: "local_benchmark_loader",
      approvedAutomatically: false,
      snapshotIds: snapshots.map((snapshot) => snapshot.id),
    },
    createdDraftSnapshotsCount: snapshots.length,
  });

  await recordAdminAuditEvent({
    actorUserId: params.actorUserId,
    actorEmail: params.actorEmail,
    eventType: "pricing_snapshot_refreshed",
    entityType: "LicensingPricingRefreshRun",
    entityId: completedRun.id,
    message: "Refresh manual de Pricing Intelligence cargo snapshots de referencia de mercado.",
    metadataJson: {
      status: completedRun.status,
      createdDraftSnapshotsCount: completedRun.createdDraftSnapshotsCount,
      errorsCount: completedRun.errorsCount,
    },
  });

  return completedRun;
}

export function normalizeSnapshotStatusForDisplay(status: string) {
  return normalizePricingStatus(status);
}

export function normalizeSnapshotCurrencyForDisplay(currency: string) {
  return normalizeUsdCurrency(currency);
}
