export const STORAGE_HIGH_USAGE_THRESHOLD_PERCENT = 80;

export const STORAGE_LOW_FREE_CAPACITY_THRESHOLD_RATIO =
  (100 - STORAGE_HIGH_USAGE_THRESHOLD_PERCENT) / 100;

export function isHighUsageDatastore(params: {
  usagePercent?: number | null;
  capacityGb?: number | null;
  freeGb?: number | null;
}) {
  if (typeof params.usagePercent === "number" && Number.isFinite(params.usagePercent)) {
    return params.usagePercent >= STORAGE_HIGH_USAGE_THRESHOLD_PERCENT;
  }

  return (
    typeof params.capacityGb === "number" &&
    Number.isFinite(params.capacityGb) &&
    params.capacityGb > 0 &&
    typeof params.freeGb === "number" &&
    Number.isFinite(params.freeGb) &&
    params.freeGb / params.capacityGb <= STORAGE_LOW_FREE_CAPACITY_THRESHOLD_RATIO
  );
}
