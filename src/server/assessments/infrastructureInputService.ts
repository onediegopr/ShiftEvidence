import { prisma } from "../../lib/prisma";
import { ensureAssessmentOwnership, type AssessmentDetail } from "./assessmentService";
import { INPUT_LIMITS, normalizeOptionalTextInput } from "../validation/inputLimits";

export type InfrastructureCompleteness = "missing" | "partial" | "complete";

const trackedFields = [
  "vmCount",
  "hostCount",
  "clusterCount",
  "socketCount",
  "coreCount",
  "totalRamGb",
  "storageFootprintTb",
  "usedStorageTb",
  "snapshotCount",
  "criticalWorkloadCount",
  "largeVmCount",
  "poweredOffVmCount",
] as const;

export function validateInfrastructureInputCompleteness(input: {
  vmCount?: number | null;
  hostCount?: number | null;
  clusterCount?: number | null;
  socketCount?: number | null;
  coreCount?: number | null;
  totalRamGb?: number | null;
  storageFootprintTb?: number | null;
  usedStorageTb?: number | null;
  snapshotCount?: number | null;
  criticalWorkloadCount?: number | null;
  largeVmCount?: number | null;
  poweredOffVmCount?: number | null;
}) {
  const filled = trackedFields.filter((field) => {
    const value = input[field];
    return value !== null && value !== undefined;
  });

  if (filled.length === 0) {
    return "missing" satisfies InfrastructureCompleteness;
  }

  if (filled.length === trackedFields.length) {
    return "complete" satisfies InfrastructureCompleteness;
  }

  return "partial" satisfies InfrastructureCompleteness;
}

export async function getInfrastructureInput(params: {
  userId: string;
  assessmentId: string;
}) {
  const assessment = await ensureAssessmentOwnership(params);
  return prisma.assessmentInfrastructureInput.findUnique({
    where: {
      assessmentId: assessment.id,
    },
  });
}

export async function upsertInfrastructureInput(params: {
  userId: string;
  assessmentId: string;
  input: {
    vmCount?: number | null;
    hostCount?: number | null;
    clusterCount?: number | null;
    socketCount?: number | null;
    coreCount?: number | null;
    totalRamGb?: number | null;
    storageFootprintTb?: number | null;
    usedStorageTb?: number | null;
    snapshotCount?: number | null;
    criticalWorkloadCount?: number | null;
    largeVmCount?: number | null;
    poweredOffVmCount?: number | null;
    notes?: string | null;
  };
}) {
  const assessment = await ensureAssessmentOwnership(params);

  const usedStorageTb = params.input.usedStorageTb ?? null;
  const storageFootprintTb = params.input.storageFootprintTb ?? null;
  if (
    usedStorageTb !== null &&
    storageFootprintTb !== null &&
    usedStorageTb > storageFootprintTb
  ) {
    throw new Error("Used storage TB cannot exceed total storage footprint TB.");
  }

  const criticalWorkloadCount = params.input.criticalWorkloadCount ?? null;
  const largeVmCount = params.input.largeVmCount ?? null;
  const poweredOffVmCount = params.input.poweredOffVmCount ?? null;
  const vmCount = params.input.vmCount ?? null;
  const notes = normalizeOptionalTextInput(params.input.notes, "Infrastructure notes", INPUT_LIMITS.notes);

  if (criticalWorkloadCount !== null && vmCount !== null && criticalWorkloadCount > vmCount) {
    throw new Error("Critical workload count cannot exceed VM count.");
  }

  if (largeVmCount !== null && vmCount !== null && largeVmCount > vmCount) {
    throw new Error("Large VM count cannot exceed VM count.");
  }

  if (poweredOffVmCount !== null && vmCount !== null && poweredOffVmCount > vmCount) {
    throw new Error("Powered-off VM count cannot exceed VM count.");
  }

  const input = await prisma.assessmentInfrastructureInput.upsert({
    where: {
      assessmentId: assessment.id,
    },
    create: {
      assessmentId: assessment.id,
      vmCount,
      hostCount: params.input.hostCount ?? null,
      clusterCount: params.input.clusterCount ?? null,
      socketCount: params.input.socketCount ?? null,
      coreCount: params.input.coreCount ?? null,
      totalRamGb: params.input.totalRamGb ?? null,
      storageFootprintTb,
      usedStorageTb,
      snapshotCount: params.input.snapshotCount ?? null,
      criticalWorkloadCount,
      largeVmCount,
      poweredOffVmCount,
      notes,
    },
    update: {
      vmCount,
      hostCount: params.input.hostCount ?? null,
      clusterCount: params.input.clusterCount ?? null,
      socketCount: params.input.socketCount ?? null,
      coreCount: params.input.coreCount ?? null,
      totalRamGb: params.input.totalRamGb ?? null,
      storageFootprintTb,
      usedStorageTb,
      snapshotCount: params.input.snapshotCount ?? null,
      criticalWorkloadCount,
      largeVmCount,
      poweredOffVmCount,
      notes,
    },
  });

  await prisma.auditEvent.create({
    data: {
      userId: params.userId,
      workspaceId: assessment.workspaceId,
      assessmentId: assessment.id,
      eventType: "infrastructure_input_updated",
      message: "Updated manual infrastructure intake.",
      metadataJson: {
        hasVmCount: params.input.vmCount !== null && params.input.vmCount !== undefined,
        hasStorageFootprint: params.input.storageFootprintTb !== null && params.input.storageFootprintTb !== undefined,
      },
    },
  });

  return input;
}

export function buildInfrastructureStatus(
  infrastructureInput: Awaited<ReturnType<typeof getInfrastructureInput>>,
): InfrastructureCompleteness {
  return validateInfrastructureInputCompleteness(infrastructureInput ?? {});
}

export function getInfrastructureStatusLabel(status: InfrastructureCompleteness) {
  switch (status) {
    case "complete":
      return "Complete";
    case "partial":
      return "Partial";
    default:
      return "Missing";
  }
}

export function getInfrastructureInputSummary(assessment: AssessmentDetail) {
  const input = assessment.infrastructureInput;
  const status = buildInfrastructureStatus(input);

  return {
    status,
    label: getInfrastructureStatusLabel(status),
    values: input,
  };
}
