import { describe, expect, it, vi } from "vitest";
import {
  createMethodologyAdminNote,
  listMethodologyAdminNotes,
  updateMethodologyAdminNoteStatus,
} from "../../src/server/methodology/adminNotes";
import { getMethodologyRuleAssociation } from "../../src/server/methodology/persistenceUtils";
import {
  createReviewItemFromNote,
  listMethodologyReviewItems,
  updateMethodologyReviewStatus,
} from "../../src/server/methodology/reviewWorkflow";
import { listMethodologyChangeLog, recordMethodologyChange } from "../../src/server/methodology/changelog";
import type { MethodologyPersistenceDb } from "../../src/server/methodology/persistenceUtils";

function createMockDb() {
  const db = {
    methodologyAdminNote: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    methodologyReviewItem: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    methodologyChangeLog: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  } as unknown as MethodologyPersistenceDb & {
    methodologyAdminNote: {
      create: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
    methodologyReviewItem: {
      create: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
    methodologyChangeLog: {
      create: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
    };
    $transaction: ReturnType<typeof vi.fn>;
  };

  db.$transaction = vi.fn(async (callback: (tx: MethodologyPersistenceDb) => Promise<unknown>) => callback(db));
  return db;
}

function makeDate(value: string) {
  return new Date(value);
}

describe("methodology persistence services", () => {
  it("recognizes internal, external and empty rule associations", () => {
    expect(getMethodologyRuleAssociation("SE-VMW-BKP-001").state).toBe("internal");
    expect(getMethodologyRuleAssociation("NO-EXISTE-001").state).toBe("external");
    expect(getMethodologyRuleAssociation(null).state).toBe("none");
  });

  it("creates and lists internal notes with an audited changelog entry", async () => {
    const db = createMockDb();
    db.methodologyAdminNote.create.mockResolvedValueOnce({
      id: "note-1",
      versionLabel: "Shift Evidence Methodology Bible v2.1",
      domainKey: "vmware",
      topicKey: "backup_restore",
      ruleCode: "SE-VMW-BKP-001",
      title: "Restore validation",
      content: "Check restore evidence before approval.",
      priority: "high",
      status: "open",
      createdBy: "admin@example.invalid",
      updatedBy: "admin@example.invalid",
      createdAt: makeDate("2026-06-06T10:00:00.000Z"),
      updatedAt: makeDate("2026-06-06T10:00:00.000Z"),
    });
    db.methodologyChangeLog.create.mockResolvedValueOnce({
      id: "chg-1",
      versionLabel: "Shift Evidence Methodology Bible v2.1",
      entityType: "MethodologyAdminNote",
      entityId: "note-1",
      entityKey: "Version Shift Evidence Methodology Bible v2.1 | Dominio vmware | Tema backup_restore | SE-VMW-BKP-001 - Backup Restore",
      changeType: "created",
      summary: "Nota interna creada: Restore validation",
      rationale: null,
      createdBy: "admin@example.invalid",
      createdAt: makeDate("2026-06-06T10:00:01.000Z"),
    });

    const created = await createMethodologyAdminNote(
      {
        versionLabel: "Shift Evidence Methodology Bible v2.1",
        domainKey: "vmware",
        topicKey: "backup_restore",
        ruleCode: "SE-VMW-BKP-001",
        title: "Restore validation",
        content: "Check restore evidence before approval.",
        priority: "high",
      },
      { userId: "admin-1", email: "admin@example.invalid" },
      db,
    );

    expect(created.id).toBe("note-1");
    expect(db.methodologyAdminNote.create).toHaveBeenCalledTimes(1);
    expect(db.methodologyChangeLog.create).toHaveBeenCalledTimes(1);
    expect(db.methodologyChangeLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          entityType: "MethodologyAdminNote",
          changeType: "created",
        }),
      }),
    );

    db.methodologyAdminNote.findMany.mockResolvedValueOnce([
      {
        id: "note-1",
        versionLabel: "Shift Evidence Methodology Bible v2.1",
        domainKey: "vmware",
        topicKey: "backup_restore",
        ruleCode: "SE-VMW-BKP-001",
        title: "Restore validation",
        content: "Check restore evidence before approval.",
        priority: "high",
        status: "open",
        createdBy: "admin@example.invalid",
        updatedBy: "admin@example.invalid",
        createdAt: makeDate("2026-06-06T10:00:00.000Z"),
        updatedAt: makeDate("2026-06-06T10:00:00.000Z"),
      },
    ]);

    const notes = await listMethodologyAdminNotes({ limit: 10 }, db);
    expect(notes).toHaveLength(1);
    expect(notes[0]?.title).toBe("Restore validation");
  });

  it("updates note status and archives through the same audited workflow", async () => {
    const db = createMockDb();
    db.methodologyAdminNote.findUnique.mockResolvedValueOnce({
      id: "note-2",
      versionLabel: "Shift Evidence Methodology Bible v2.1",
      domainKey: "vmware",
      topicKey: "capacity",
      ruleCode: null,
      title: "Capacity headroom",
      content: "Need room before migration.",
      priority: "normal",
      status: "open",
      createdBy: "admin@example.invalid",
      updatedBy: "admin@example.invalid",
      createdAt: makeDate("2026-06-06T10:00:00.000Z"),
      updatedAt: makeDate("2026-06-06T10:00:00.000Z"),
    });
    db.methodologyAdminNote.update.mockResolvedValueOnce({
      id: "note-2",
      versionLabel: "Shift Evidence Methodology Bible v2.1",
      domainKey: "vmware",
      topicKey: "capacity",
      ruleCode: null,
      title: "Capacity headroom",
      content: "Need room before migration.",
      priority: "normal",
      status: "incorporated",
      createdBy: "admin@example.invalid",
      updatedBy: "admin@example.invalid",
      createdAt: makeDate("2026-06-06T10:00:00.000Z"),
      updatedAt: makeDate("2026-06-06T10:01:00.000Z"),
    });
    db.methodologyChangeLog.create.mockResolvedValueOnce({
      id: "chg-2",
      versionLabel: "Shift Evidence Methodology Bible v2.1",
      entityType: "MethodologyAdminNote",
      entityId: "note-2",
      entityKey: "Version Shift Evidence Methodology Bible v2.1 | Dominio vmware | Tema capacity",
      changeType: "status_changed",
      summary: "Estado de nota actualizado a incorporated",
      rationale: "Estado anterior: open",
      createdBy: "admin@example.invalid",
      createdAt: makeDate("2026-06-06T10:01:01.000Z"),
    });

    const updated = await updateMethodologyAdminNoteStatus(
      "note-2",
      "incorporated",
      { userId: "admin-1", email: "admin@example.invalid" },
      db,
    );

    expect(updated.status).toBe("incorporated");
    expect(db.methodologyAdminNote.update).toHaveBeenCalledTimes(1);
    expect(db.methodologyChangeLog.create).toHaveBeenCalledTimes(1);
  });

  it("creates review items from notes and updates their workflow state", async () => {
    const db = createMockDb();
    db.methodologyReviewItem.create.mockResolvedValueOnce({
      id: "review-1",
      sourceNoteId: "note-3",
      versionLabel: "Shift Evidence Methodology Bible v2.1",
      itemType: "rule",
      itemKey: "SE-VMW-BKP-001",
      title: "Restore validation - Revision metodologica",
      description: "Check restore evidence before approval.",
      rationale: "Creada a partir de la nota note-3",
      priority: "high",
      status: "proposed",
      decisionReason: null,
      decidedBy: null,
      decidedAt: null,
      createdBy: "admin@example.invalid",
      updatedBy: "admin@example.invalid",
      createdAt: makeDate("2026-06-06T10:00:00.000Z"),
      updatedAt: makeDate("2026-06-06T10:00:00.000Z"),
    });
    db.methodologyChangeLog.create.mockResolvedValueOnce({
      id: "chg-3",
      versionLabel: "Shift Evidence Methodology Bible v2.1",
      entityType: "MethodologyReviewItem",
      entityId: "review-1",
      entityKey: "Version Shift Evidence Methodology Bible v2.1 | Dominio vmware | Tema backup_restore | SE-VMW-BKP-001 - Backup Restore",
      changeType: "created_from_note",
      summary: "Item de revision creado desde nota: Restore validation",
      rationale: "Creada a partir de la nota note-3",
      createdBy: "admin@example.invalid",
      createdAt: makeDate("2026-06-06T10:00:01.000Z"),
    });

    const review = await createReviewItemFromNote(
      {
        id: "note-3",
        versionLabel: "Shift Evidence Methodology Bible v2.1",
        domainKey: "vmware",
        topicKey: "backup_restore",
        ruleCode: "SE-VMW-BKP-001",
        title: "Restore validation",
        content: "Check restore evidence before approval.",
        priority: "high",
        status: "open",
        createdBy: "admin@example.invalid",
        updatedBy: "admin@example.invalid",
        createdAt: "2026-06-06T10:00:00.000Z",
        updatedAt: "2026-06-06T10:00:00.000Z",
      },
      {},
      { userId: "admin-1", email: "admin@example.invalid" },
      db,
    );

    expect(review.id).toBe("review-1");
    expect(db.methodologyReviewItem.create).toHaveBeenCalledTimes(1);
    expect(db.methodologyChangeLog.create).toHaveBeenCalledTimes(1);

    db.methodologyReviewItem.findUnique.mockResolvedValueOnce({
      id: "review-1",
      sourceNoteId: "note-3",
      versionLabel: "Shift Evidence Methodology Bible v2.1",
      itemType: "rule",
      itemKey: "SE-VMW-BKP-001",
      title: "Restore validation - Revision metodologica",
      description: "Check restore evidence before approval.",
      rationale: "Creada a partir de la nota note-3",
      priority: "high",
      status: "proposed",
      decisionReason: null,
      decidedBy: null,
      decidedAt: null,
      createdBy: "admin@example.invalid",
      updatedBy: "admin@example.invalid",
      createdAt: makeDate("2026-06-06T10:00:00.000Z"),
      updatedAt: makeDate("2026-06-06T10:00:00.000Z"),
    });
    db.methodologyReviewItem.update.mockResolvedValueOnce({
      id: "review-1",
      sourceNoteId: "note-3",
      versionLabel: "Shift Evidence Methodology Bible v2.1",
      itemType: "rule",
      itemKey: "SE-VMW-BKP-001",
      title: "Restore validation - Revision metodologica",
      description: "Check restore evidence before approval.",
      rationale: "Creada a partir de la nota note-3",
      priority: "high",
      status: "approved",
      decisionReason: "Evidence reviewed by admin",
      decidedBy: "admin@example.invalid",
      decidedAt: makeDate("2026-06-06T10:05:00.000Z"),
      createdBy: "admin@example.invalid",
      updatedBy: "admin@example.invalid",
      createdAt: makeDate("2026-06-06T10:00:00.000Z"),
      updatedAt: makeDate("2026-06-06T10:05:00.000Z"),
    });
    db.methodologyChangeLog.create.mockResolvedValueOnce({
      id: "chg-4",
      versionLabel: "Shift Evidence Methodology Bible v2.1",
      entityType: "MethodologyReviewItem",
      entityId: "review-1",
      entityKey: "SE-VMW-BKP-001",
      changeType: "status_changed",
      summary: "Estado de revision actualizado a approved",
      rationale: "Evidence reviewed by admin",
      createdBy: "admin@example.invalid",
      createdAt: makeDate("2026-06-06T10:05:01.000Z"),
    });

    const updated = await updateMethodologyReviewStatus(
      "review-1",
      { status: "approved", decisionReason: "Evidence reviewed by admin" },
      { userId: "admin-1", email: "admin@example.invalid" },
      db,
    );

    expect(updated.status).toBe("approved");
    expect(updated.decidedAt).toBeTruthy();
    expect(db.methodologyReviewItem.update).toHaveBeenCalledTimes(1);

    db.methodologyReviewItem.findMany.mockResolvedValueOnce([
      {
        id: "review-1",
        sourceNoteId: "note-3",
        versionLabel: "Shift Evidence Methodology Bible v2.1",
        itemType: "rule",
        itemKey: "SE-VMW-BKP-001",
        title: "Restore validation - Revision metodologica",
        description: "Check restore evidence before approval.",
        rationale: "Creada a partir de la nota note-3",
        priority: "high",
        status: "approved",
        decisionReason: "Evidence reviewed by admin",
        decidedBy: "admin@example.invalid",
        decidedAt: makeDate("2026-06-06T10:05:00.000Z"),
        createdBy: "admin@example.invalid",
        updatedBy: "admin@example.invalid",
        createdAt: makeDate("2026-06-06T10:00:00.000Z"),
        updatedAt: makeDate("2026-06-06T10:05:00.000Z"),
      },
    ]);

    const reviewList = await listMethodologyReviewItems({ limit: 5 }, db);
    expect(reviewList).toHaveLength(1);
  });

  it("records and lists the persisted methodology changelog", async () => {
    const db = createMockDb();
    db.methodologyChangeLog.create.mockResolvedValueOnce({
      id: "chg-5",
      versionLabel: "Shift Evidence Methodology Bible v2.1",
      entityType: "MethodologyAdminNote",
      entityId: "note-5",
      entityKey: "Version Shift Evidence Methodology Bible v2.1",
      changeType: "created",
      summary: "Nota interna creada",
      rationale: null,
      createdBy: "admin@example.invalid",
      createdAt: makeDate("2026-06-06T10:00:00.000Z"),
    });
    db.methodologyChangeLog.findMany.mockResolvedValueOnce([
      {
        id: "chg-5",
        versionLabel: "Shift Evidence Methodology Bible v2.1",
        entityType: "MethodologyAdminNote",
        entityId: "note-5",
        entityKey: "Version Shift Evidence Methodology Bible v2.1",
        changeType: "created",
        summary: "Nota interna creada",
        rationale: null,
        createdBy: "admin@example.invalid",
        createdAt: makeDate("2026-06-06T10:00:00.000Z"),
      },
    ]);

    const recorded = await recordMethodologyChange(
      {
        versionLabel: "Shift Evidence Methodology Bible v2.1",
        entityType: "MethodologyAdminNote",
        entityId: "note-5",
        entityKey: "Version Shift Evidence Methodology Bible v2.1",
        changeType: "created",
        summary: "Nota interna creada",
        createdBy: "admin@example.invalid",
      },
      db,
    );

    expect(recorded.id).toBe("chg-5");

    const logEntries = await listMethodologyChangeLog({ versionLabel: "Shift Evidence Methodology Bible v2.1" }, db);
    expect(logEntries).toHaveLength(1);
    expect(logEntries[0]?.summary).toBe("Nota interna creada");
  });
});
