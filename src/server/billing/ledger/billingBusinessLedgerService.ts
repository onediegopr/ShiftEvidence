import type {
  BillingEvent,
  BillingOrder,
  BillingPayment,
  BillingSubscription,
  Prisma,
  PrismaClient,
} from "@prisma/client";
import {
  buildBillingOrderCreateData,
  buildBillingPaymentCreateData,
  buildBillingSubscriptionCreateData,
} from "./billingLedgerService";
import {
  mapLemonWebhookPayloadToBusinessLedger,
  type LemonMappedOrder,
  type LemonMappedPayment,
  type LemonMappedSubscription,
} from "../webhooks/lemonWebhookMapper";

type DbClient = PrismaClient | Prisma.TransactionClient;

export type LemonBusinessLedgerProcessingResult = {
  order: BillingOrder | null;
  payment: BillingPayment | null;
  subscription: BillingSubscription | null;
  warnings: string[];
  skipped: boolean;
};

function toSafeMessage(value: unknown) {
  if (value instanceof Error && value.message.trim()) {
    return value.message.slice(0, 300);
  }

  return "billing_business_ledger_processing_failed";
}

function joinWarnings(warnings: string[]) {
  const unique = [...new Set(warnings.map((warning) => warning.trim()).filter(Boolean))];
  return unique.length > 0 ? unique.join("; ").slice(0, 500) : null;
}

function canCreateOrder(order: LemonMappedOrder) {
  return Boolean(order.planId && order.amountCents !== null);
}

function canCreateSubscription(subscription: LemonMappedSubscription) {
  return Boolean(subscription.planId);
}

async function updateEventWarnings(db: DbClient, billingEventId: string, warnings: string[]) {
  const errorMessage = joinWarnings(warnings);
  if (!errorMessage) return null;

  return db.billingEvent.update({
    where: {
      id: billingEventId,
    },
    data: {
      errorMessage,
    },
  });
}

async function markEventFailed(db: DbClient, billingEventId: string, error: unknown) {
  return db.billingEvent.update({
    where: {
      id: billingEventId,
    },
    data: {
      status: "failed",
      errorMessage: toSafeMessage(error),
      processedAt: new Date(),
    },
  });
}

async function upsertOrder(db: DbClient, order: LemonMappedOrder, warnings: string[]) {
  const existing = await db.billingOrder.findUnique({
    where: {
      provider_providerOrderId: {
        provider: "lemon_squeezy",
        providerOrderId: order.providerOrderId,
      },
    },
  });

  if (existing) {
    return db.billingOrder.update({
      where: {
        id: existing.id,
      },
      data: {
        providerCheckoutId: order.providerCheckoutId ?? existing.providerCheckoutId,
        providerCustomerId: order.providerCustomerId ?? existing.providerCustomerId,
        productId: order.productId ?? existing.productId,
        variantId: order.variantId ?? existing.variantId,
        planId: order.planId ?? existing.planId,
        amountCents: order.amountCents ?? existing.amountCents,
        currency: order.currency,
        status: order.status,
        customerEmail: order.customerEmail ?? existing.customerEmail,
        paidAt: order.paidAt ?? existing.paidAt,
        refundedAt: order.refundedAt ?? existing.refundedAt,
        cancelledAt: order.cancelledAt ?? existing.cancelledAt,
        providerCreatedAt: order.providerCreatedAt ?? existing.providerCreatedAt,
      },
    });
  }

  if (!canCreateOrder(order)) {
    warnings.push("order_skipped_missing_required_fields");
    return null;
  }

  return db.billingOrder.create({
    data: buildBillingOrderCreateData({
      provider: "lemon_squeezy",
      providerOrderId: order.providerOrderId,
      providerCheckoutId: order.providerCheckoutId,
      providerCustomerId: order.providerCustomerId,
      productId: order.productId,
      variantId: order.variantId,
      planId: order.planId!,
      amountCents: order.amountCents!,
      currency: order.currency,
      status: order.status,
      customerEmail: order.customerEmail,
      paidAt: order.paidAt,
      refundedAt: order.refundedAt,
      cancelledAt: order.cancelledAt,
      providerCreatedAt: order.providerCreatedAt,
    }),
  });
}

async function findPaymentOrder(db: DbClient, payment: LemonMappedPayment, order: BillingOrder | null) {
  if (order) return order;
  if (!payment.providerOrderId) return null;

  return db.billingOrder.findUnique({
    where: {
      provider_providerOrderId: {
        provider: "lemon_squeezy",
        providerOrderId: payment.providerOrderId,
      },
    },
  });
}

async function upsertPayment(
  db: DbClient,
  payment: LemonMappedPayment,
  order: BillingOrder | null,
  warnings: string[],
) {
  if (!payment.providerPaymentId) {
    warnings.push("payment_skipped_missing_provider_payment_id");
    return null;
  }

  const paymentOrder = await findPaymentOrder(db, payment, order);
  if (!paymentOrder) {
    warnings.push("payment_skipped_missing_order");
    return null;
  }

  const amountCents = payment.amountCents ?? paymentOrder.amountCents;
  if (amountCents === null) {
    warnings.push("payment_skipped_missing_amount_cents");
    return null;
  }

  const existing = await db.billingPayment.findUnique({
    where: {
      provider_providerPaymentId: {
        provider: "lemon_squeezy",
        providerPaymentId: payment.providerPaymentId,
      },
    },
  });

  if (existing) {
    return db.billingPayment.update({
      where: {
        id: existing.id,
      },
      data: {
        orderId: paymentOrder.id,
        amountCents,
        currency: payment.currency,
        status: payment.status,
        paidAt: payment.paidAt ?? existing.paidAt,
        refundedAt: payment.refundedAt ?? existing.refundedAt,
        failedAt: payment.failedAt ?? existing.failedAt,
      },
    });
  }

  return db.billingPayment.create({
    data: buildBillingPaymentCreateData({
      provider: "lemon_squeezy",
      providerPaymentId: payment.providerPaymentId,
      orderId: paymentOrder.id,
      amountCents,
      currency: payment.currency,
      status: payment.status,
      paidAt: payment.paidAt,
      refundedAt: payment.refundedAt,
      failedAt: payment.failedAt,
    }),
  });
}

async function upsertSubscription(
  db: DbClient,
  subscription: LemonMappedSubscription,
  warnings: string[],
) {
  const existing = await db.billingSubscription.findUnique({
    where: {
      provider_providerSubscriptionId: {
        provider: "lemon_squeezy",
        providerSubscriptionId: subscription.providerSubscriptionId,
      },
    },
  });

  if (existing) {
    return db.billingSubscription.update({
      where: {
        id: existing.id,
      },
      data: {
        providerCustomerId: subscription.providerCustomerId ?? existing.providerCustomerId,
        planId: subscription.planId ?? existing.planId,
        productId: subscription.productId ?? existing.productId,
        variantId: subscription.variantId ?? existing.variantId,
        status: subscription.status,
        customerEmail: subscription.customerEmail ?? existing.customerEmail,
        currentPeriodStart: subscription.currentPeriodStart ?? existing.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd ?? existing.currentPeriodEnd,
        cancelledAt: subscription.cancelledAt ?? existing.cancelledAt,
        expiredAt: subscription.expiredAt ?? existing.expiredAt,
        paymentFailedAt: subscription.paymentFailedAt ?? existing.paymentFailedAt,
        providerCreatedAt: subscription.providerCreatedAt ?? existing.providerCreatedAt,
      },
    });
  }

  if (!canCreateSubscription(subscription)) {
    warnings.push("subscription_skipped_missing_required_fields");
    return null;
  }

  return db.billingSubscription.create({
    data: buildBillingSubscriptionCreateData({
      provider: "lemon_squeezy",
      providerSubscriptionId: subscription.providerSubscriptionId,
      providerCustomerId: subscription.providerCustomerId,
      planId: subscription.planId!,
      productId: subscription.productId,
      variantId: subscription.variantId,
      status: subscription.status,
      customerEmail: subscription.customerEmail,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelledAt: subscription.cancelledAt,
      expiredAt: subscription.expiredAt,
      paymentFailedAt: subscription.paymentFailedAt,
      providerCreatedAt: subscription.providerCreatedAt,
    }),
  });
}

async function runInTransaction<T>(db: DbClient, callback: (tx: DbClient) => Promise<T>) {
  if ("$transaction" in db && typeof db.$transaction === "function") {
    return db.$transaction((tx) => callback(tx as DbClient));
  }

  return callback(db);
}

async function processMappedLemonEvent(params: {
  db: DbClient;
  billingEvent: BillingEvent;
  rawBody: string;
}): Promise<LemonBusinessLedgerProcessingResult> {
  const mapped = mapLemonWebhookPayloadToBusinessLedger(params.rawBody, params.billingEvent.eventType);
  const warnings = [...mapped.warnings];

  if (!mapped.eventType) {
    await updateEventWarnings(params.db, params.billingEvent.id, warnings);
    return {
      order: null,
      payment: null,
      subscription: null,
      warnings,
      skipped: true,
    };
  }

  const result = await runInTransaction(params.db, async (tx) => {
    const order = mapped.order ? await upsertOrder(tx, mapped.order, warnings) : null;
    const subscription = mapped.subscription ? await upsertSubscription(tx, mapped.subscription, warnings) : null;
    const payment = mapped.payment ? await upsertPayment(tx, mapped.payment, order, warnings) : null;

    await updateEventWarnings(tx, params.billingEvent.id, warnings);

    return {
      order,
      payment,
      subscription,
      warnings,
      skipped: !order && !payment && !subscription,
    };
  });

  return result;
}

export async function processLemonBillingEvent(params: {
  db: DbClient;
  billingEvent: BillingEvent;
  rawBody: string;
}): Promise<LemonBusinessLedgerProcessingResult> {
  if (params.billingEvent.provider !== "lemon_squeezy") {
    return {
      order: null,
      payment: null,
      subscription: null,
      warnings: ["business_ledger_skipped_non_lemon_provider"],
      skipped: true,
    };
  }

  if (params.billingEvent.status === "ignored") {
    return {
      order: null,
      payment: null,
      subscription: null,
      warnings: ["business_ledger_skipped_duplicate_event"],
      skipped: true,
    };
  }

  try {
    return await processMappedLemonEvent(params);
  } catch (error) {
    await markEventFailed(params.db, params.billingEvent.id, error);
    return {
      order: null,
      payment: null,
      subscription: null,
      warnings: [toSafeMessage(error)],
      skipped: true,
    };
  }
}
