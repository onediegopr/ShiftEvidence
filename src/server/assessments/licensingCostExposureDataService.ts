import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { INPUT_LIMITS, normalizeOptionalTextInput } from "../validation/inputLimits";
import { assertNoThirdPartyLicensingText } from "../pricing/licensingPricingValidation";
import type { AssessmentDetail } from "./assessmentService";
import { getLicensingCostContextFromAssessment } from "./costRiskService";
import { summarizePricingFreshness } from "./licensingCostExposureEngine";
import type {
  ApprovedPricingSnapshot,
  LicensingAnalysisInput,
  LicensingAnalysisMode,
  LicensingAnalysisPreferences,
} from "./licensingCostExposureTypes";

export const LICENSING_ANALYSIS_PREFERENCES_JSON_KEY = "licensingAnalysisPreferences";

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toNumber(value: Prisma.Decimal | number | null | undefined) {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseBoolean(value: unknown) {
  return value === true || value === "true" || value === "on" || value === "yes";
}

function parseMode(value: unknown): LicensingAnalysisMode {
  if (
    value === "actual_costs" ||
    value === "estimated_from_environment" ||
    value === "broad_scenarios" ||
    value === "skipped"
  ) {
    return value;
  }

  return "estimated_from_environment";
}

function parseSupportScenario(value: unknown): LicensingAnalysisPreferences["selectedProxmoxSupportScenario"] {
  if (value === "community" || value === "supported" || value === "premium" || value === "not_sure") {
    return value;
  }

  return null;
}

function parseOptionalUsd(value: unknown, fieldName: string) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${fieldName} must be a non-negative USD amount.`);
  }
  return parsed;
}

function parseRenewalDate(value: unknown) {
  const parsed = normalizeOptionalTextInput(value, "Renewal date", INPUT_LIMITS.shortText);
  if (!parsed) return null;
  const date = new Date(`${parsed}T00:00:00.000Z`);
  if (!Number.isFinite(date.getTime())) {
    throw new Error("Renewal date is invalid.");
  }
  return parsed;
}

export function getLicensingAnalysisPreferencesFromAssessment(assessment: AssessmentDetail): LicensingAnalysisPreferences {
  const assumptionsJson = assessment.costRiskAssumptions?.assumptionsJson;
  const root = isPlainObject(assumptionsJson) ? assumptionsJson : {};
  const raw = isPlainObject(root[LICENSING_ANALYSIS_PREFERENCES_JSON_KEY])
    ? root[LICENSING_ANALYSIS_PREFERENCES_JSON_KEY]
    : {};
  const existingContext = getLicensingCostContextFromAssessment(assessment);

  return {
    version: 1,
    mode: parseMode(raw.mode ?? (existingContext.decision === "skipped" ? "skipped" : undefined)),
    renewalDate: typeof raw.renewalDate === "string" ? raw.renewalDate : null,
    hasContract: parseBoolean(raw.hasContract),
    hasRenewalQuote: parseBoolean(raw.hasRenewalQuote),
    includeEscalation: parseBoolean(raw.includeEscalation),
    migrationInvestmentEstimateUsd: typeof raw.migrationInvestmentEstimateUsd === "number" ? raw.migrationInvestmentEstimateUsd : null,
    selectedProxmoxSupportScenario: parseSupportScenario(raw.selectedProxmoxSupportScenario),
    notes: typeof raw.notes === "string" ? raw.notes : existingContext.notes,
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : null,
  };
}

export function parseLicensingAnalysisPreferencesFormData(formData: FormData): LicensingAnalysisPreferences & {
  annualVmwareCostUsd: number | null;
  years: number;
  vmwareLicenseModel: string | null;
  riskTolerance: string | null;
} {
  const currency = normalizeOptionalTextInput(formData.get("currency"), "Currency", INPUT_LIMITS.currency) ?? "USD";
  if (currency.toUpperCase() !== "USD") {
    throw new Error("Licensing analysis requires USD amounts. Please convert values to USD before saving.");
  }

  const notes = normalizeOptionalTextInput(
    formData.get("licensingAnalysisNotes"),
    "Licensing analysis notes",
    INPUT_LIMITS.manualTechnicalContext,
  );
  assertNoThirdPartyLicensingText(notes, "Licensing analysis notes");

  const yearsVal = formData.get("years");
  const years = yearsVal !== null && yearsVal !== "" ? Number(yearsVal) : 3;
  if (!Number.isInteger(years) || years < 1 || years > 10) {
    throw new Error("Years must be an integer between 1 and 10.");
  }

  const vmwareLicenseModel = normalizeOptionalTextInput(
    formData.get("vmwareLicenseModel"),
    "VMware license model",
    INPUT_LIMITS.shortText,
  );
  assertNoThirdPartyLicensingText(vmwareLicenseModel, "VMware license model");

  const riskTolerance = normalizeOptionalTextInput(
    formData.get("riskTolerance"),
    "Risk tolerance",
    INPUT_LIMITS.shortText,
  );
  assertNoThirdPartyLicensingText(riskTolerance, "Risk tolerance");

  return {
    version: 1,
    mode: parseMode(formData.get("licensingAnalysisMode")),
    renewalDate: parseRenewalDate(formData.get("renewalDate")),
    hasContract: parseBoolean(formData.get("hasContract")),
    hasRenewalQuote: parseBoolean(formData.get("hasRenewalQuote")),
    includeEscalation: parseBoolean(formData.get("includeEscalation")),
    migrationInvestmentEstimateUsd: parseOptionalUsd(
      formData.get("migrationInvestmentEstimateUsd"),
      "Migration investment estimate",
    ),
    selectedProxmoxSupportScenario: parseSupportScenario(formData.get("selectedProxmoxSupportScenario")),
    notes,
    updatedAt: new Date().toISOString(),
    annualVmwareCostUsd: parseOptionalUsd(formData.get("annualVmwareCostUsd"), "Annual VMware/Broadcom cost"),
    years,
    vmwareLicenseModel,
    riskTolerance,
  };
}

export function buildLicensingAssumptionsJson(params: {
  assessment: AssessmentDetail;
  preferences: LicensingAnalysisPreferences;
}) {
  const existing = params.assessment.costRiskAssumptions?.assumptionsJson;
  const root = isPlainObject(existing) ? existing : {};

  return {
    ...root,
    [LICENSING_ANALYSIS_PREFERENCES_JSON_KEY]: params.preferences as unknown as Prisma.InputJsonValue,
  } satisfies Prisma.InputJsonObject;
}

function latestInventorySummary(assessment: AssessmentDetail) {
  return assessment.parsedInventorySummaries?.[0] ?? null;
}

function detectedHostCount(assessment: AssessmentDetail) {
  return (
    assessment.infrastructureInput?.hostCount ??
    latestInventorySummary(assessment)?.hostCount ??
    (assessment.parsedHosts?.length ? assessment.parsedHosts.length : null)
  );
}

function detectedSocketCount(assessment: AssessmentDetail) {
  return (
    assessment.costRiskAssumptions?.socketCount ??
    assessment.infrastructureInput?.socketCount ??
    (assessment.parsedHosts?.length
      ? assessment.parsedHosts.reduce((total, host) => total + (host.cpuSockets ?? 0), 0) || null
      : null)
  );
}

function detectedCoreCount(assessment: AssessmentDetail) {
  return (
    assessment.costRiskAssumptions?.coreCount ??
    assessment.infrastructureInput?.coreCount ??
    (assessment.parsedHosts?.length
      ? assessment.parsedHosts.reduce((total, host) => total + (host.cpuCores ?? 0), 0) || null
      : null)
  );
}

function detectedVmCount(assessment: AssessmentDetail) {
  return (
    assessment.costRiskAssumptions?.vmCount ??
    assessment.infrastructureInput?.vmCount ??
    latestInventorySummary(assessment)?.vmCount ??
    (assessment.parsedVMs?.length ? assessment.parsedVMs.length : null)
  );
}

type ApprovedSnapshotRow = Prisma.LicensingPricingSnapshotGetPayload<{
  include: { items: true };
}>;

function mapApprovedSnapshot(snapshot: ApprovedSnapshotRow): ApprovedPricingSnapshot {
  return {
    snapshotId: snapshot.id,
    vendor: snapshot.vendor,
    sourceName: snapshot.sourceName,
    sourceType: snapshot.sourceType,
    lastCheckedAt: snapshot.lastCheckedAt?.toISOString() ?? null,
    approvedAt: snapshot.approvedAt?.toISOString() ?? null,
    itemCount: snapshot.items.length,
    items: snapshot.items.map((item) => ({
      id: item.id,
      snapshotId: item.snapshotId,
      vendor: item.vendor,
      productName: item.productName,
      edition: item.edition,
      metric: item.metric,
      unitPriceUsd: toNumber(item.unitPriceUsd),
      minUnits: item.minUnits,
      termMonths: item.termMonths,
      sourceNote: item.sourceNote,
    })),
  };
}

export function getApprovedPricingSnapshotsForAnalysis() {
  return prisma.licensingPricingSnapshot.findMany({
    where: {
      status: "approved",
      currency: "USD",
    },
    include: {
      items: {
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: [{ approvedAt: "desc" }, { updatedAt: "desc" }],
  });
}

export async function buildLicensingAnalysisInput(assessment: AssessmentDetail): Promise<LicensingAnalysisInput> {
  const preferences = getLicensingAnalysisPreferencesFromAssessment(assessment);
  const licensingContext = getLicensingCostContextFromAssessment(assessment);
  const approvedSnapshots = (await getApprovedPricingSnapshotsForAnalysis()).map(mapApprovedSnapshot);
  const approvedVmwareSnapshots = approvedSnapshots.filter((snapshot) => snapshot.vendor === "vmware");
  const approvedProxmoxSnapshots = approvedSnapshots.filter((snapshot) => snapshot.vendor === "proxmox");

  return {
    assessmentId: assessment.id,
    mode: preferences.mode,
    currency: "USD",
    annualVmwareCostUsd: toNumber(assessment.costRiskAssumptions?.annualVmwareCost),
    estimatedProxmoxCostUsd: toNumber(assessment.costRiskAssumptions?.estimatedProxmoxCost),
    years: assessment.costRiskAssumptions?.years ?? 3,
    hostCount: detectedHostCount(assessment),
    socketCount: detectedSocketCount(assessment),
    coreCount: detectedCoreCount(assessment),
    vmCount: detectedVmCount(assessment),
    hasParsedInventory: Boolean(latestInventorySummary(assessment) || assessment.parsedHosts?.length || assessment.parsedVMs?.length),
    renewalDate: preferences.renewalDate,
    hasContract: preferences.hasContract,
    hasRenewalQuote: preferences.hasRenewalQuote,
    includeEscalation: preferences.includeEscalation,
    migrationInvestmentEstimateUsd: preferences.migrationInvestmentEstimateUsd,
    selectedProxmoxSupportScenario: preferences.selectedProxmoxSupportScenario,
    includeProxmoxEstimate: licensingContext.includeProxmoxEstimate,
    notes: preferences.notes,
    approvedVmwareSnapshots,
    approvedProxmoxSnapshots,
    pricingFreshnessStatus: summarizePricingFreshness({
      vmwareSnapshots: approvedVmwareSnapshots,
      proxmoxSnapshots: approvedProxmoxSnapshots,
    }),
  };
}
