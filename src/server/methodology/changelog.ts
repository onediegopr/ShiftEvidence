import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import {
  normalizeMethodologyChangeSummary,
  normalizeMethodologyChangeType,
  normalizeMethodologyCreatedBy,
  normalizeMethodologyEntityKey,
  normalizeMethodologyEntityType,
  normalizeMethodologyRationale,
  normalizeMethodologyVersionLabel,
  toIsoString,
} from "./persistenceUtils";
import type {
  MethodologyChangeLogFilters,
  MethodologyChangeLogInput,
  MethodologyChangeLogRecord,
} from "./types";
import type { MethodologyPersistenceDb } from "./persistenceUtils";

function mapChangeLogRecord(row: {
  id: string;
  versionLabel: string;
  entityType: string;
  entityId: string | null;
  entityKey: string | null;
  changeType: string;
  summary: string;
  rationale: string | null;
  createdBy: string | null;
  createdAt: Date;
}): MethodologyChangeLogRecord {
  return {
    id: row.id,
    versionLabel: row.versionLabel,
    entityType: row.entityType,
    entityId: row.entityId,
    entityKey: row.entityKey,
    changeType: row.changeType,
    summary: row.summary,
    rationale: row.rationale,
    createdBy: row.createdBy,
    createdAt: toIsoString(row.createdAt),
  };
}

function buildChangeWhere(filters: MethodologyChangeLogFilters = {}): Prisma.MethodologyChangeLogWhereInput {
  const where: Prisma.MethodologyChangeLogWhereInput = {};

  if (filters.versionLabel) where.versionLabel = filters.versionLabel;
  if (filters.entityType) where.entityType = filters.entityType;
  if (filters.entityKey) where.entityKey = filters.entityKey;
  if (filters.changeType) where.changeType = filters.changeType;

  return where;
}

export async function recordMethodologyChange(
  input: MethodologyChangeLogInput,
  db: MethodologyPersistenceDb = prisma,
): Promise<MethodologyChangeLogRecord> {
  const versionLabel = normalizeMethodologyVersionLabel(input.versionLabel);
  const entityType = normalizeMethodologyEntityType(input.entityType);
  const summary = normalizeMethodologyChangeSummary(input.summary);
  const rationale = normalizeMethodologyRationale(input.rationale, "Rationale");
  const entityId = normalizeMethodologyEntityKey(input.entityId);
  const entityKey = normalizeMethodologyEntityKey(input.entityKey);
  const createdBy = normalizeMethodologyCreatedBy(input.createdBy);

  const row = await db.methodologyChangeLog.create({
    data: {
      versionLabel,
      entityType,
      entityId,
      entityKey,
      changeType: normalizeMethodologyChangeType(input.changeType),
      summary,
      rationale,
      createdBy,
    },
  });

  return mapChangeLogRecord(row);
}

export async function listMethodologyChangeLog(
  filters: MethodologyChangeLogFilters = {},
  db: MethodologyPersistenceDb = prisma,
): Promise<MethodologyChangeLogRecord[]> {
  const limit = typeof filters.limit === "number" && filters.limit > 0 ? Math.min(filters.limit, 250) : 100;
  const rows = await db.methodologyChangeLog.findMany({
    where: buildChangeWhere(filters),
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit,
  });

  return rows.map(mapChangeLogRecord);
}
