import type { BillingEventStatus } from "@prisma/client";

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
