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
  mapStripeWebhookPayloadToBusinessLedger,
  type StripeMappedOrder,
  type StripeMappedPayment,
  type StripeMappedSubscription,
} from "../webhooks/stripeWebhookMapper";

type DbClient = PrismaClient | Prisma.TransactionClient;

const UNKNOWN_STRIPE_PLAN_ID = "stripe_unknown_plan";

export type StripeBusinessLedgerProcessingResult = {
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

  return "stripe_business_ledger_processing_failed";
}

function joinWarnings(warnings: string[]) {
  const unique = [...new Set(warnings.map((warning) => warning.trim()).filter(Boolean))];
  return unique.length > 0 ? unique.join("; ").slice(0, 500) : null;
}

function canCreateOrder(order: StripeMappedOrder) {
  return Boolean(order.providerOrderId && order.amountCents !== null);
}

function canCreateSubscription(subscription: StripeMappedSubscription) {
  return Boolean(subscription.providerSubscriptionId);
}

function planIdOrReview(planId: string | null) {
  return planId ?? UNKNOWN_STRIPE_PLAN_ID;
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

async function upsertOrder(db: DbClient, order: StripeMappedOrder, warnings: string[]) {
  if (!canCreateOrder(order)) {
    warnings.push("order_skipped_missing_required_fields");
    return null;
  }

  const existing = await db.billingOrder.findUnique({
    where: {
      provider_providerOrderId: {
        provider: "stripe",
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
        planId: planIdOrReview(order.planId),
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

  return db.billingOrder.create({
    data: buildBillingOrderCreateData({
      provider: "stripe",
      providerOrderId: order.providerOrderId,
      providerCheckoutId: order.providerCheckoutId,
      providerCustomerId: order.providerCustomerId,
      productId: order.productId,
      variantId: order.variantId,
      planId: planIdOrReview(order.planId),
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

async function findPaymentOrder(db: DbClient, payment: StripeMappedPayment, order: BillingOrder | null) {
  if (order) return order;
  if (!payment.providerOrderId) return null;

  return db.billingOrder.findUnique({
    where: {
      provider_providerOrderId: {
        provider: "stripe",
        providerOrderId: payment.providerOrderId,
      },
    },
  });
}

async function upsertPayment(
  db: DbClient,
  payment: StripeMappedPayment,
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
        provider: "stripe",
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
      provider: "stripe",
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
  subscription: StripeMappedSubscription,
  warnings: string[],
) {
  if (!canCreateSubscription(subscription)) {
    warnings.push("subscription_skipped_missing_required_fields");
    return null;
  }

  const existing = await db.billingSubscription.findUnique({
    where: {
      provider_providerSubscriptionId: {
        provider: "stripe",
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
        planId: planIdOrReview(subscription.planId),
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

  return db.billingSubscription.create({
    data: buildBillingSubscriptionCreateData({
      provider: "stripe",
      providerSubscriptionId: subscription.providerSubscriptionId,
      providerCustomerId: subscription.providerCustomerId,
      planId: planIdOrReview(subscription.planId),
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

async function processMappedStripeEvent(params: {
  db: DbClient;
  billingEvent: BillingEvent;
  rawBody: string;
}): Promise<StripeBusinessLedgerProcessingResult> {
  const mapped = mapStripeWebhookPayloadToBusinessLedger(params.rawBody);
  const warnings = [...mapped.warnings];

  if (mapped.liveMode) {
    warnings.push("live_event_skipped_not_approved");
    await updateEventWarnings(params.db, params.billingEvent.id, warnings);
    return {
      order: null,
      payment: null,
      subscription: null,
      warnings,
      skipped: true,
    };
  }

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

  return runInTransaction(params.db, async (tx) => {
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
}

export async function processStripeBillingEvent(params: {
  db: DbClient;
  billingEvent: BillingEvent;
  rawBody: string;
}): Promise<StripeBusinessLedgerProcessingResult> {
  if (params.billingEvent.provider !== "stripe") {
    return {
      order: null,
      payment: null,
      subscription: null,
      warnings: ["business_ledger_skipped_non_stripe_provider"],
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
    return await processMappedStripeEvent(params);
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
