import type {
  BillingEventStatus,
  BillingOrderStatus,
  BillingPaymentStatus,
  BillingSubscriptionStatus,
} from "@prisma/client";

export type BillingRiskLevel = "bajo" | "medio" | "alto";

export function formatBooleanPresence(value: boolean) {
  return value ? "Presente" : "Ausente";
}

export function formatBooleanYesNo(value: boolean) {
  return value ? "Si" : "No";
}

export function formatBillingRiskLevel(value: BillingRiskLevel) {
  const labels: Record<BillingRiskLevel, string> = {
    bajo: "Bajo",
    medio: "Medio",
    alto: "Alto",
  };

  return labels[value];
}

export function getBillingEventStatusLabel(status: BillingEventStatus) {
  const labels: Record<BillingEventStatus, string> = {
    pending: "Pendiente",
    processed: "Capturado",
    failed: "Fallido",
    ignored: "Ignorado",
  };

  return labels[status];
}

export function getBillingEventStatusTone(status: BillingEventStatus) {
  const tones: Record<BillingEventStatus, "neutral" | "good" | "warning" | "danger"> = {
    pending: "warning",
    processed: "good",
    failed: "danger",
    ignored: "neutral",
  };

  return tones[status];
}

export function getBillingOrderStatusLabel(status: BillingOrderStatus) {
  const labels: Record<BillingOrderStatus, string> = {
    pending: "Pendiente",
    paid: "Pagada",
    refunded: "Reembolsada",
    cancelled: "Cancelada",
  };

  return labels[status];
}

export function getBillingPaymentStatusLabel(status: BillingPaymentStatus) {
  const labels: Record<BillingPaymentStatus, string> = {
    pending: "Pendiente",
    paid: "Pagado",
    refunded: "Reembolsado",
    failed: "Fallido",
  };

  return labels[status];
}

export function getBillingSubscriptionStatusLabel(status: BillingSubscriptionStatus) {
  const labels: Record<BillingSubscriptionStatus, string> = {
    active: "Activa",
    cancelled: "Cancelada",
    expired: "Expirada",
    payment_failed: "Pago fallido",
  };

  return labels[status];
}

export function getBillingCommercialStatusTone(
  status: BillingOrderStatus | BillingPaymentStatus | BillingSubscriptionStatus,
) {
  if (status === "paid" || status === "active") return "good";
  if (status === "pending" || status === "payment_failed") return "warning";
  if (status === "failed" || status === "refunded" || status === "cancelled" || status === "expired") {
    return "danger";
  }

  return "neutral";
}
