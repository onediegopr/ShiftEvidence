import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import {
  getMethodologyNoteAssociationLabel,
  getMethodologyReviewDefaultType,
  getReviewStatusRank,
  normalizeMethodologyContent,
  normalizeMethodologyDecisionReason,
  normalizeMethodologyItemKey,
  normalizeMethodologyOptionalText,
  normalizeMethodologyReviewStatus,
  normalizeMethodologyTitle,
  normalizeMethodologyVersionLabel,
  parseMethodologyReviewItemType,
  toIsoString,
  withMethodologyTransaction,
} from "./persistenceUtils";
import { recordMethodologyChange } from "./changelog";
import type {
  MethodologyAdminNoteRecord,
  MethodologyReviewItemFilters,
  MethodologyReviewItemInput,
  MethodologyReviewItemRecord,
  MethodologyReviewStatus,
  MethodologyReviewStatusUpdate,
} from "./types";
import type { MethodologyPersistenceDb } from "./persistenceUtils";

function mapReviewItemRecord(row: {
  id: string;
  sourceNoteId: string | null;
  versionLabel: string;
  itemType: MethodologyReviewItemRecord["itemType"];
  itemKey: string | null;
  title: string;
  description: string;
  rationale: string | null;
  priority: MethodologyReviewItemRecord["priority"];
  status: MethodologyReviewStatus;
  decisionReason: string | null;
  decidedBy: string | null;
  decidedAt: Date | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}): MethodologyReviewItemRecord {
  return {
    id: row.id,
    sourceNoteId: row.sourceNoteId,
    versionLabel: row.versionLabel,
    itemType: row.itemType,
    itemKey: row.itemKey,
    title: row.title,
    description: row.description,
    rationale: row.rationale,
    priority: row.priority,
    status: row.status,
    decisionReason: row.decisionReason,
    decidedBy: row.decidedBy,
    decidedAt: row.decidedAt ? toIsoString(row.decidedAt) : null,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
    createdAt: toIsoString(row.createdAt),
    updatedAt: toIsoString(row.updatedAt),
  };
}

function buildReviewWhere(filters: MethodologyReviewItemFilters = {}): Prisma.MethodologyReviewItemWhereInput {
  const where: Prisma.MethodologyReviewItemWhereInput = {};

  if (filters.versionLabel) where.versionLabel = filters.versionLabel;
  if (filters.itemType) where.itemType = filters.itemType;
  if (filters.sourceNoteId) where.sourceNoteId = filters.sourceNoteId;
  if (filters.status?.length) where.status = { in: filters.status };

  return where;
}

function sortReviewItems(items: MethodologyReviewItemRecord[]) {
  return [...items].sort(
    (left, right) =>
      getReviewStatusRank(left.status) - getReviewStatusRank(right.status) ||
      right.updatedAt.localeCompare(left.updatedAt) ||
      right.createdAt.localeCompare(left.createdAt) ||
      left.title.localeCompare(right.title),
  );
}

function buildReviewDescription(note: MethodologyAdminNoteRecord) {
  return note.content;
}

export async function listMethodologyReviewItems(
  filters: MethodologyReviewItemFilters = {},
  db: MethodologyPersistenceDb = prisma,
): Promise<MethodologyReviewItemRecord[]> {
  const limit = typeof filters.limit === "number" && filters.limit > 0 ? Math.min(filters.limit, 250) : 100;
  const rows = await db.methodologyReviewItem.findMany({
    where: buildReviewWhere(filters),
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }, { id: "desc" }],
    take: limit,
  });

  return sortReviewItems(rows.map(mapReviewItemRecord));
}

export async function getMethodologyReviewItemById(
  id: string,
  db: MethodologyPersistenceDb = prisma,
): Promise<MethodologyReviewItemRecord | null> {
  const row = await db.methodologyReviewItem.findUnique({
    where: { id },
  });

  return row ? mapReviewItemRecord(row) : null;
}

export async function createReviewItemFromNote(
  note: MethodologyAdminNoteRecord,
  input: MethodologyReviewItemInput = {},
  actor?: { userId?: string | null; email?: string | null },
  db: MethodologyPersistenceDb = prisma,
): Promise<MethodologyReviewItemRecord> {
  const versionLabel = normalizeMethodologyVersionLabel(input.versionLabel ?? note.versionLabel);
  const itemType = parseMethodologyReviewItemType(input.itemType ?? getMethodologyReviewDefaultType(note));
  const itemKey = normalizeMethodologyItemKey(input.itemKey ?? note.ruleCode ?? note.topicKey ?? note.domainKey);
  const title = normalizeMethodologyTitle(input.title ?? `${note.title} - Revision metodologica`);
  const description = normalizeMethodologyContent(input.description ?? buildReviewDescription(note));
  const rationale =
    normalizeMethodologyOptionalText(input.rationale, "Rationale", 3600) ??
    `Creada a partir de la nota ${note.id}`;
  const priority = input.priority ?? note.priority;

  const row = await withMethodologyTransaction(db, async (tx) => {
    const created = await tx.methodologyReviewItem.create({
      data: {
        sourceNoteId: note.id,
        versionLabel,
        itemType,
        itemKey,
        title,
        description,
        rationale,
        priority,
        status: "proposed",
        createdBy: actor?.email ?? actor?.userId ?? null,
        updatedBy: actor?.email ?? actor?.userId ?? null,
      },
    });

    await recordMethodologyChange(
      {
        versionLabel,
        entityType: "MethodologyReviewItem",
        entityId: created.id,
        entityKey: getMethodologyNoteAssociationLabel(note),
        changeType: "created_from_note",
        summary: `Item de revision creado desde nota: ${note.title}`,
        rationale,
        createdBy: actor?.email ?? actor?.userId ?? null,
      },
      tx,
    );

    return created;
  });

  return mapReviewItemRecord(row);
}

export async function updateMethodologyReviewStatus(
  id: string,
  statusUpdate: MethodologyReviewStatusUpdate,
  actor?: { userId?: string | null; email?: string | null },
  db: MethodologyPersistenceDb = prisma,
): Promise<MethodologyReviewItemRecord> {
  const status = normalizeMethodologyReviewStatus(statusUpdate.status);
  const decisionReason = normalizeMethodologyDecisionReason(statusUpdate.decisionReason);

  const row = await withMethodologyTransaction(db, async (tx) => {
    const existing = await tx.methodologyReviewItem.findUnique({ where: { id } });
    if (!existing) {
      throw new Error("El item de revision metodologica no existe.");
    }

    const decidedAt = status === "proposed" ? null : new Date();
    const updated = await tx.methodologyReviewItem.update({
      where: { id },
      data: {
        status,
        decisionReason: decisionReason ?? existing.decisionReason,
        decidedAt,
        decidedBy: status === "proposed" ? existing.decidedBy : actor?.email ?? actor?.userId ?? existing.decidedBy ?? null,
        updatedBy: actor?.email ?? actor?.userId ?? null,
      },
    });

    await recordMethodologyChange(
      {
        versionLabel: updated.versionLabel,
        entityType: "MethodologyReviewItem",
        entityId: updated.id,
        entityKey: updated.itemKey ?? updated.sourceNoteId ?? updated.versionLabel,
        changeType: "status_changed",
        summary: `Estado de revision actualizado a ${status}`,
        rationale: decisionReason ?? existing.decisionReason ?? null,
        createdBy: actor?.email ?? actor?.userId ?? null,
      },
      tx,
    );

    return updated;
  });

  return mapReviewItemRecord(row);
}
