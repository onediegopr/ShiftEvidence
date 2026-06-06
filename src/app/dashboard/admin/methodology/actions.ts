"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { recordAdminAuditEvent } from "../../../../server/admin/adminOpsService";
import { requireAdmin } from "../../../../server/admin/adminAuth";
import {
  archiveMethodologyAdminNote,
  createMethodologyAdminNote,
  getMethodologyAdminNoteById,
  updateMethodologyAdminNoteStatus,
} from "../../../../server/methodology/adminNotes";
import {
  createReviewItemFromNote,
  updateMethodologyReviewStatus,
} from "../../../../server/methodology/reviewWorkflow";
import {
  METHODOLOGY_NOTE_PRIORITIES,
  METHODOLOGY_NOTE_STATUSES,
  METHODOLOGY_REVIEW_STATUSES,
} from "../../../../server/methodology/types";
import { parseOptionalString, safeRedirectError } from "../../../../server/assessments/formUtils";
import { INPUT_LIMITS } from "../../../../server/validation/inputLimits";

const NOTE_STATUS_SET = new Set(METHODOLOGY_NOTE_STATUSES);
const NOTE_PRIORITY_SET = new Set(METHODOLOGY_NOTE_PRIORITIES);
const REVIEW_STATUS_SET = new Set(METHODOLOGY_REVIEW_STATUSES);

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readOptionalText(formData: FormData, key: string, fieldName: string, maxLength: number) {
  return parseOptionalString(formData.get(key), { fieldName, maxLength });
}

function parseNoteStatus(value: string) {
  if (!NOTE_STATUS_SET.has(value as (typeof METHODOLOGY_NOTE_STATUSES)[number])) {
    throw new Error("Estado de nota invalido.");
  }

  return value as (typeof METHODOLOGY_NOTE_STATUSES)[number];
}

function parseReviewStatus(value: string) {
  if (!REVIEW_STATUS_SET.has(value as (typeof METHODOLOGY_REVIEW_STATUSES)[number])) {
    throw new Error("Estado de revision invalido.");
  }

  return value as (typeof METHODOLOGY_REVIEW_STATUSES)[number];
}

function parsePriority(value: string) {
  if (!NOTE_PRIORITY_SET.has(value as (typeof METHODOLOGY_NOTE_PRIORITIES)[number])) {
    throw new Error("Prioridad invalida.");
  }

  return value as (typeof METHODOLOGY_NOTE_PRIORITIES)[number];
}

function redirectWithError(message: string, anchor = "#notas") {
  redirect(`/dashboard/admin/methodology?error=${safeRedirectError(message)}${anchor}`);
}

async function withAdminSession() {
  return requireAdmin();
}

export async function createMethodologyAdminNoteAction(formData: FormData) {
  const session = await withAdminSession();

  try {
    const title = readText(formData, "title");
    const content = readText(formData, "content");
    const versionLabel = readOptionalText(formData, "versionLabel", "Version label", INPUT_LIMITS.shortText) ?? undefined;
    const domainKey = readOptionalText(formData, "domainKey", "Domain key", INPUT_LIMITS.shortText);
    const topicKey = readOptionalText(formData, "topicKey", "Topic key", INPUT_LIMITS.shortText);
    const ruleCode = readOptionalText(formData, "ruleCode", "Rule code", INPUT_LIMITS.shortText);
    const priority = parsePriority(readText(formData, "priority") || "normal");

    const note = await createMethodologyAdminNote(
      {
        title,
        content,
        versionLabel,
        domainKey,
        topicKey,
        ruleCode,
        priority,
      },
      {
        userId: session.user.id,
        email: session.user.email,
      },
    );

    await recordAdminAuditEvent({
      actorUserId: session.user.id,
      actorEmail: session.user.email,
      eventType: "methodology_note_created",
      entityType: "MethodologyAdminNote",
      entityId: note.id,
      message: "Nota interna de metodologia creada.",
      metadataJson: {
        versionLabel: note.versionLabel,
        domainKey: note.domainKey,
        topicKey: note.topicKey,
        ruleCode: note.ruleCode,
        priority: note.priority,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo crear la nota.";
    redirectWithError(message);
  }

  revalidatePath("/dashboard/admin/methodology");
  redirect("/dashboard/admin/methodology#notas");
}

export async function updateMethodologyAdminNoteStatusAction(formData: FormData) {
  const session = await withAdminSession();

  try {
    const noteId = readText(formData, "noteId");
    const status = parseNoteStatus(readText(formData, "status"));
    const note = await updateMethodologyAdminNoteStatus(
      noteId,
      status,
      {
        userId: session.user.id,
        email: session.user.email,
      },
    );

    await recordAdminAuditEvent({
      actorUserId: session.user.id,
      actorEmail: session.user.email,
      eventType: "methodology_note_status_changed",
      entityType: "MethodologyAdminNote",
      entityId: note.id,
      message: "Estado de nota interna actualizado.",
      metadataJson: {
        status: note.status,
        versionLabel: note.versionLabel,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo actualizar la nota.";
    redirectWithError(message);
  }

  revalidatePath("/dashboard/admin/methodology");
  redirect("/dashboard/admin/methodology#notas");
}

export async function archiveMethodologyAdminNoteAction(formData: FormData) {
  const session = await withAdminSession();

  try {
    const noteId = readText(formData, "noteId");
    const note = await archiveMethodologyAdminNote(
      noteId,
      {
        userId: session.user.id,
        email: session.user.email,
      },
    );

    await recordAdminAuditEvent({
      actorUserId: session.user.id,
      actorEmail: session.user.email,
      eventType: "methodology_note_archived",
      entityType: "MethodologyAdminNote",
      entityId: note.id,
      message: "Nota interna archivada.",
      metadataJson: {
        versionLabel: note.versionLabel,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo archivar la nota.";
    redirectWithError(message);
  }

  revalidatePath("/dashboard/admin/methodology");
  redirect("/dashboard/admin/methodology#notas");
}

export async function createReviewItemFromNoteAction(formData: FormData) {
  const session = await withAdminSession();

  try {
    const noteId = readText(formData, "noteId");
    const note = await getMethodologyAdminNoteById(noteId);
    if (!note) {
      throw new Error("La nota metodologica no existe.");
    }

    const review = await createReviewItemFromNote(
      note,
      {},
      {
        userId: session.user.id,
        email: session.user.email,
      },
    );

    await recordAdminAuditEvent({
      actorUserId: session.user.id,
      actorEmail: session.user.email,
      eventType: "methodology_review_created",
      entityType: "MethodologyReviewItem",
      entityId: review.id,
      message: "Item de revision creado desde nota interna.",
      metadataJson: {
        sourceNoteId: note.id,
        itemType: review.itemType,
        versionLabel: review.versionLabel,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo crear el item de revision.";
    redirectWithError(message);
  }

  revalidatePath("/dashboard/admin/methodology");
  redirect("/dashboard/admin/methodology#revision");
}

export async function updateMethodologyReviewStatusAction(formData: FormData) {
  const session = await withAdminSession();

  try {
    const reviewId = readText(formData, "reviewId");
    const status = parseReviewStatus(readText(formData, "status"));
    const decisionReason = readOptionalText(formData, "decisionReason", "Decision reason", INPUT_LIMITS.description);
    const review = await updateMethodologyReviewStatus(
      reviewId,
      {
        status,
        decisionReason,
      },
      {
        userId: session.user.id,
        email: session.user.email,
      },
    );

    await recordAdminAuditEvent({
      actorUserId: session.user.id,
      actorEmail: session.user.email,
      eventType: "methodology_review_status_changed",
      entityType: "MethodologyReviewItem",
      entityId: review.id,
      message: "Estado de item de revision actualizado.",
      metadataJson: {
        status: review.status,
        versionLabel: review.versionLabel,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo actualizar la revision.";
    redirectWithError(message);
  }

  revalidatePath("/dashboard/admin/methodology");
  redirect("/dashboard/admin/methodology#revision");
}
