import type {
  BillingEventStatus,
  BillingGrantStatus,
  BillingOrderStatus,
  BillingPaymentStatus,
  BillingProvider,
  BillingSubscriptionStatus,
  EntitlementKey,
} from "@prisma/client";

export const billingLedgerProviders = ["wise", "stripe"] as const satisfies BillingProvider[];

export const billingEventStatuses = [
  "pending",
  "processed",
  "failed",
  "ignored",
] as const satisfies BillingEventStatus[];

export const billingOrderStatuses = [
  "pending",
  "paid",
  "refunded",
  "cancelled",
] as const satisfies BillingOrderStatus[];

export const billingPaymentStatuses = [
  "pending",
  "paid",
  "refunded",
  "failed",
] as const satisfies BillingPaymentStatus[];

export const billingSubscriptionStatuses = [
  "active",
  "cancelled",
  "expired",
  "payment_failed",
] as const satisfies BillingSubscriptionStatus[];

export const billingGrantStatuses = [
  "pending_review",
  "granted",
  "revoked",
  "rejected",
] as const satisfies BillingGrantStatus[];

export type BillingLedgerProvider = (typeof billingLedgerProviders)[number];

export type BillingLedgerPlanId =
  | "starter_readiness"
  | "professional_assessment"
  | "migration_blueprint"
  | "msp_partner";

export type BillingLedgerOrderIdentity = {
  provider: BillingProvider;
  providerOrderId: string;
};

export type BillingLedgerEventIdentity = {
  provider: BillingProvider;
  providerEventId: string;
  eventType: string;
};

export type BillingLedgerSubscriptionIdentity = {
  provider: BillingProvider;
  providerSubscriptionId: string;
};

export type BillingLedgerContext = {
  customerEmail?: string | null;
  userId?: string | null;
  workspaceId?: string | null;
  assessmentId?: string | null;
};

export type BillingLedgerEntitlementDraft = BillingLedgerContext & {
  billingOrderId?: string | null;
  billingSubscriptionId?: string | null;
  entitlementKey: EntitlementKey;
  source?: string | null;
};
