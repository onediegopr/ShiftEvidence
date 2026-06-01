import { Prisma, type PrismaClient } from "@prisma/client";
import { prisma } from "../../../lib/prisma";
import { createBillingEventIdempotencyKey } from "../ledger/billingIdempotency";
import { buildBillingEventCreateData } from "../ledger/billingLedgerService";
import type { ParsedStripeWebhookEvent } from "./stripeWebhookEvent";

type DbClient = PrismaClient | Prisma.TransactionClient;

function isUniqueConstraintError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

function toSafeErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message.slice(0, 500);
  }

  return "Unknown Stripe webhook persistence error.";
}

export async function persistStripeWebhookEvent(params: {
  event: ParsedStripeWebhookEvent;
  rawBody: string | Buffer;
  db?: DbClient;
}) {
  const db = params.db ?? prisma;
  const idempotencyKey = createBillingEventIdempotencyKey({
    provider: "stripe",
    providerEventId: params.event.providerEventId,
  });

  try {
    const billingEvent = await db.billingEvent.create({
      data: buildBillingEventCreateData({
        provider: "stripe",
        providerEventId: params.event.providerEventId,
        eventType: params.event.eventType,
        rawPayload: params.rawBody,
        safePayloadJson: params.event.safePayloadJson,
        idempotencyKey,
        status: "processed",
        processedAt: new Date(),
      }),
    });

    return {
      outcome: "created" as const,
      billingEvent,
    };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      const billingEvent = await db.billingEvent.update({
        where: {
          idempotencyKey,
        },
        data: {
          status: "ignored",
          errorMessage: null,
          processedAt: new Date(),
        },
      });

      return {
        outcome: "duplicate_ignored" as const,
        billingEvent,
      };
    }

    try {
      const billingEvent = await db.billingEvent.create({
        data: buildBillingEventCreateData({
          provider: "stripe",
          providerEventId: params.event.providerEventId,
          eventType: params.event.eventType,
          rawPayload: params.rawBody,
          safePayloadJson: params.event.safePayloadJson,
          idempotencyKey,
          status: "failed",
          errorMessage: toSafeErrorMessage(error),
        }),
      });

      return {
        outcome: "failed_persisted" as const,
        billingEvent,
      };
    } catch {
      throw error;
    }
  }
}
