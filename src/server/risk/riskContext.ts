import type { AssessmentDetail } from "../assessments/assessmentService";
import { getParsedInventorySnapshot } from "../rvtools/rvtoolsInventoryService";

export type InventoryDrivenCostRiskSource = "manual" | "parsed_inventory" | "mixed";

export type InventoryCountSet = {
  vmCount: number | null;
  hostCount: number | null;
  datastoreCount: number | null;
  snapshotCount: number | null;
  storageFootprintTb: number | null;
  usedStorageTb: number | null;
};

export type InventoryDrivenCostRiskContext = {
  source: InventoryDrivenCostRiskSource;
  parsedInventory: ReturnType<typeof getParsedInventorySnapshot>;
  manualCounts: InventoryCountSet;
  parsedCounts: InventoryCountSet;
  referenceCounts: InventoryCountSet;
  mismatchWarnings: string[];
  hasManualInputs: boolean;
  hasParsedInventory: boolean;
  sourceLabel: string;
};

function hasManualAssessmentInputs(assessment: AssessmentDetail) {
  const infrastructure = assessment.infrastructureInput;
  const assumptions = assessment.costRiskAssumptions;

  return Boolean(
    infrastructure ||
      assumptions ||
      assessment.storageReadinessInput,
  );
}

function mismatchPercent(left: number, right: number) {
  const baseline = Math.max(Math.abs(right), 1);
  return Math.abs(left - right) / baseline;
}

function isMeaningfulNumber(value: number | null | undefined) {
  return value !== null && value !== undefined && !Number.isNaN(value);
}

export function buildInventoryDrivenCostRiskContext(assessment: AssessmentDetail): InventoryDrivenCostRiskContext {
  const parsedInventory = getParsedInventorySnapshot(assessment);
  const summary = parsedInventory?.summary ?? null;

  const manualCounts: InventoryCountSet = {
    vmCount: assessment.infrastructureInput?.vmCount ?? assessment.costRiskAssumptions?.vmCount ?? null,
    hostCount: assessment.infrastructureInput?.hostCount ?? null,
    datastoreCount: null,
    snapshotCount: assessment.infrastructureInput?.snapshotCount ?? null,
    storageFootprintTb: assessment.infrastructureInput?.storageFootprintTb ?? null,
    usedStorageTb: assessment.infrastructureInput?.usedStorageTb ?? null,
  };

  const parsedCounts: InventoryCountSet = {
    vmCount: summary?.vmCount ?? null,
    hostCount: summary?.hostCount ?? null,
    datastoreCount: summary?.datastoreCount ?? null,
    snapshotCount: summary?.snapshotCount ?? null,
    storageFootprintTb: (() => {
      const totalProvisionedGb = summary?.totalProvisionedGb;
      return typeof totalProvisionedGb === "number" && !Number.isNaN(totalProvisionedGb)
        ? totalProvisionedGb / 1024
        : null;
    })(),
    usedStorageTb: (() => {
      const totalUsedGb = summary?.totalUsedGb;
      return typeof totalUsedGb === "number" && !Number.isNaN(totalUsedGb)
        ? totalUsedGb / 1024
        : null;
    })(),
  };

  const hasParsedInventory = Boolean(parsedInventory && summary);
  const hasManualInputs = hasManualAssessmentInputs(assessment);
  const source: InventoryDrivenCostRiskSource =
    hasParsedInventory && hasManualInputs ? "mixed" : hasParsedInventory ? "parsed_inventory" : "manual";

  const referenceCounts: InventoryCountSet = {
    vmCount: parsedCounts.vmCount ?? manualCounts.vmCount ?? null,
    hostCount: parsedCounts.hostCount ?? manualCounts.hostCount ?? null,
    datastoreCount: parsedCounts.datastoreCount ?? null,
    snapshotCount: parsedCounts.snapshotCount ?? manualCounts.snapshotCount ?? null,
    storageFootprintTb: parsedCounts.storageFootprintTb ?? manualCounts.storageFootprintTb ?? null,
    usedStorageTb: parsedCounts.usedStorageTb ?? manualCounts.usedStorageTb ?? null,
  };

  const mismatchWarnings: string[] = [];

  if (isMeaningfulNumber(manualCounts.vmCount) && isMeaningfulNumber(parsedCounts.vmCount)) {
    const diff = mismatchPercent(manualCounts.vmCount!, parsedCounts.vmCount!);
    if (diff > 0.2) {
      mismatchWarnings.push(
        `Manual VM count differs from parsed RVTools inventory by ${Math.round(diff * 100)}%.`,
      );
    }
  }

  if (isMeaningfulNumber(manualCounts.hostCount) && isMeaningfulNumber(parsedCounts.hostCount)) {
    const diff = mismatchPercent(manualCounts.hostCount!, parsedCounts.hostCount!);
    if (diff > 0.2) {
      mismatchWarnings.push(
        `Manual host count differs from parsed RVTools inventory by ${Math.round(diff * 100)}%.`,
      );
    }
  }

  if (isMeaningfulNumber(manualCounts.storageFootprintTb) && isMeaningfulNumber(parsedCounts.storageFootprintTb)) {
    const diff = mismatchPercent(manualCounts.storageFootprintTb!, parsedCounts.storageFootprintTb!);
    if (diff > 0.2) {
      mismatchWarnings.push(
        `Manual storage footprint differs from parsed RVTools inventory by ${Math.round(diff * 100)}%.`,
      );
    }
  }

  const sourceLabel =
    source === "parsed_inventory"
      ? "Parsed RVTools inventory"
      : source === "mixed"
        ? "Parsed RVTools inventory + manual cost assumptions"
        : "Manual input";

  return {
    source,
    parsedInventory,
    manualCounts,
    parsedCounts,
    referenceCounts,
    mismatchWarnings,
    hasManualInputs,
    hasParsedInventory,
    sourceLabel,
  };
}
