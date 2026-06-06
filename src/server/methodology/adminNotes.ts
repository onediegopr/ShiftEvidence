import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import {
  getMethodologyRuleAssociation,
  getMethodologyNoteAssociationLabel,
  getNotePriorityRank,
  getNoteStatusRank,
  normalizeMethodologyContent,
  normalizeMethodologyOptionalText,
  normalizeMethodologyTitle,
  normalizeMethodologyVersionLabel,
  withMethodologyTransaction,
} from "./persistenceUtils";
import { recordMethodologyChange } from "./changelog";
import type {
  MethodologyAdminNoteFilters,
  MethodologyAdminNoteInput,
  MethodologyAdminNoteRecord,
  MethodologyNoteStatus,
} from "./types";
import type { MethodologyPersistenceDb } from "./persistenceUtils";

function mapAdminNoteRecord(row: {
  id: string;
  versionLabel: string | null;
  domainKey: string | null;
  topicKey: string | null;
  ruleCode: string | null;
  title: string;
  content: string;
  priority: MethodologyAdminNoteRecord["priority"];
  status: MethodologyNoteStatus;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}): MethodologyAdminNoteRecord {
  return {
    id: row.id,
    versionLabel: row.versionLabel,
    domainKey: row.domainKey,
    topicKey: row.topicKey,
    ruleCode: row.ruleCode,
    title: row.title,
    content: row.content,
    priority: row.priority,
    status: row.status,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function buildNoteWhere(filters: MethodologyAdminNoteFilters = {}): Prisma.MethodologyAdminNoteWhereInput {
  const where: Prisma.MethodologyAdminNoteWhereInput = {};

  if (filters.versionLabel) where.versionLabel = filters.versionLabel;
  if (filters.domainKey) where.domainKey = filters.domainKey;
  if (filters.topicKey) where.topicKey = filters.topicKey;
  if (filters.ruleCode) where.ruleCode = filters.ruleCode;
  if (filters.status?.length) where.status = { in: filters.status };
  if (filters.priority?.length) where.priority = { in: filters.priority };
  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: "insensitive" } },
      { content: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  return where;
}

function sortNotes(notes: MethodologyAdminNoteRecord[]) {
  return [...notes].sort(
    (left, right) =>
      getNoteStatusRank(left.status) - getNoteStatusRank(right.status) ||
      getNotePriorityRank(left.priority) - getNotePriorityRank(right.priority) ||
      right.updatedAt.localeCompare(left.updatedAt) ||
      right.createdAt.localeCompare(left.createdAt) ||
      left.title.localeCompare(right.title),
  );
}

export async function listMethodologyAdminNotes(
  filters: MethodologyAdminNoteFilters = {},
  db: MethodologyPersistenceDb = prisma,
): Promise<MethodologyAdminNoteRecord[]> {
  const limit = typeof filters.limit === "number" && filters.limit > 0 ? Math.min(filters.limit, 250) : 100;
  const rows = await db.methodologyAdminNote.findMany({
    where: buildNoteWhere(filters),
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }, { id: "desc" }],
    take: limit,
  });

  return sortNotes(rows.map(mapAdminNoteRecord));
}

export async function getMethodologyAdminNoteById(
  id: string,
  db: MethodologyPersistenceDb = prisma,
): Promise<MethodologyAdminNoteRecord | null> {
  const row = await db.methodologyAdminNote.findUnique({
    where: { id },
  });

  return row ? mapAdminNoteRecord(row) : null;
}

export async function createMethodologyAdminNote(
  input: MethodologyAdminNoteInput,
  actor?: { userId?: string | null; email?: string | null },
  db: MethodologyPersistenceDb = prisma,
): Promise<MethodologyAdminNoteRecord> {
  const versionLabel = normalizeMethodologyVersionLabel(input.versionLabel);
  const domainKey = normalizeMethodologyOptionalText(input.domainKey, "Domain key", 120);
  const topicKey = normalizeMethodologyOptionalText(input.topicKey, "Topic key", 120);
  const ruleCode = normalizeMethodologyOptionalText(input.ruleCode, "Rule code", 120);
  const title = normalizeMethodologyTitle(input.title);
  const content = normalizeMethodologyContent(input.content);
  const priority = input.priority ?? "normal";
  const status = input.status ?? "open";

  const row = await withMethodologyTransaction(db, async (tx) => {
    const created = await tx.methodologyAdminNote.create({
      data: {
        versionLabel,
        domainKey,
        topicKey,
        ruleCode,
        title,
        content,
        priority,
        status,
        createdBy: actor?.email ?? actor?.userId ?? null,
        updatedBy: actor?.email ?? actor?.userId ?? null,
      },
    });

    await recordMethodologyChange(
      {
        versionLabel,
        entityType: "MethodologyAdminNote",
        entityId: created.id,
        entityKey: getMethodologyNoteAssociationLabel({ versionLabel, domainKey, topicKey, ruleCode }),
        changeType: "created",
        summary: `Nota interna creada: ${title}`,
        rationale: getMethodologyRuleAssociation(ruleCode).state === "external" ? "ruleCode externa / no encontrada" : null,
        createdBy: actor?.email ?? actor?.userId ?? null,
      },
      tx,
    );

    return created;
  });

  return mapAdminNoteRecord(row);
}

export async function updateMethodologyAdminNoteStatus(
  id: string,
  status: MethodologyNoteStatus,
  actor?: { userId?: string | null; email?: string | null },
  db: MethodologyPersistenceDb = prisma,
): Promise<MethodologyAdminNoteRecord> {
  const row = await withMethodologyTransaction(db, async (tx) => {
    const existing = await tx.methodologyAdminNote.findUnique({ where: { id } });
    if (!existing) {
      throw new Error("La nota metodológica no existe.");
    }

    const updated = await tx.methodologyAdminNote.update({
      where: { id },
      data: {
        status,
        updatedBy: actor?.email ?? actor?.userId ?? null,
      },
    });

    await recordMethodologyChange(
      {
        versionLabel: updated.versionLabel ?? versionLabelFrom(existing.versionLabel),
        entityType: "MethodologyAdminNote",
        entityId: updated.id,
        entityKey: getMethodologyNoteAssociationLabel(updated),
        changeType: "status_changed",
        summary: `Estado de nota actualizado a ${status}`,
        rationale: `Estado anterior: ${existing.status}`,
        createdBy: actor?.email ?? actor?.userId ?? null,
      },
      tx,
    );

    return updated;
  });

  return mapAdminNoteRecord(row);
}

export async function archiveMethodologyAdminNote(
  id: string,
  actor?: { userId?: string | null; email?: string | null },
  db: MethodologyPersistenceDb = prisma,
): Promise<MethodologyAdminNoteRecord> {
  return updateMethodologyAdminNoteStatus(id, "archived", actor, db);
}

function versionLabelFrom(value: string | null | undefined) {
  return value ?? "Shift Evidence Methodology Bible v2.1";
}
