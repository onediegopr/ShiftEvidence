import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import type { AssessmentDetail } from "./assessmentService";
import { ensureAssessmentOwnership } from "./assessmentService";

export const MIGRATION_CONTEXT_JSON_KEY = "migrationContext";

export type MigrationContextStatus = "answered" | "unknown" | "not_applicable" | "skipped";
export type MigrationContextSource = "user_input" | "inferred_from_rvtools" | "missing";
export type MigrationContextInputType = "single" | "multi" | "text";

export type MigrationContextQuestion = {
  id: string;
  sectionId: string;
  label: string;
  type: MigrationContextInputType;
  options?: string[];
  placeholder?: string;
  weight: number;
  keyQuestion?: boolean;
};

export type MigrationContextSection = {
  id: string;
  title: string;
  group: "quick" | "advanced";
  description: string;
  questions: MigrationContextQuestion[];
};

export type MigrationContextAnswer = {
  value: string | string[] | null;
  status: MigrationContextStatus;
  source: MigrationContextSource;
  updatedAt: string | null;
};

export type MigrationContextData = {
  version: 1;
  answers: Record<string, MigrationContextAnswer>;
  updatedAt: string | null;
};

export type MigrationContextCoverage = {
  overallPercent: number;
  status: "strong" | "partial" | "limited" | "missing";
  answeredWeight: number;
  totalWeight: number;
  missingKeyContext: string[];
  sections: Array<{
    id: string;
    title: string;
    percent: number;
    status: "strong" | "partial" | "limited" | "missing";
    missing: string[];
  }>;
};

const unknownOptions = ["Unknown", "I don't know yet", "Not defined"];

export const migrationContextSections: MigrationContextSection[] = [
  {
    id: "quick_context",
    title: "Quick Context",
    group: "quick",
    description: "Fast context that improves report confidence without blocking progress.",
    questions: [
      q("main_migration_objective", "Main migration objective", "single", [
        "Reduce VMware/Broadcom licensing cost",
        "Replace VMware before renewal",
        "Modernize infrastructure",
        "Improve DR/backup posture",
        "Consolidate datacenter",
        "Evaluate Proxmox feasibility",
        "Already decided to migrate",
        "Other",
      ], 5, true),
      q("project_stage", "Project stage", "single", [
        "Initial exploration",
        "Technical evaluation",
        "Decision already made",
        "Proxmox lab exists",
        "Proxmox production target exists",
        "Pilot already started",
        "Urgent due to license/renewal deadline",
      ], 5, true),
      q("target_timeline", "Target timeline", "single", [
        "No fixed date",
        "0-30 days",
        "1-3 months",
        "3-6 months",
        "6+ months",
        "Unknown",
      ], 4, true),
      q("expected_outcome", "Expected outcome from assessment", "multi", [
        "Validate feasibility",
        "Identify migration risks",
        "Size Proxmox target",
        "Build migration waves",
        "Prepare executive decision",
        "Prepare technical migration plan",
        "Compare scenarios",
      ], 4, true),
      textQ("main_concern", "Main concern", "What is the biggest risk or concern in this migration?", 3, true),
    ],
  },
  {
    id: "vmware_environment",
    title: "VMware Environment",
    group: "advanced",
    description: "Scope and VMware-specific signals that RVTools may only partially show.",
    questions: [
      q("vcenter_count", "Number of vCenters", "single", ["1", "2-3", "4+", "Unknown"], 3, true),
      q("vmware_cluster_count", "Number of VMware clusters", "single", ["1", "2-3", "4+", "Unknown"], 3),
      q("approx_esxi_hosts", "Approximate ESXi hosts", "single", ["1-3", "4-8", "9-20", "20+", "Unknown"], 3),
      q("approx_vms_scope", "Approximate VMs in scope", "single", [
        "Less than 25",
        "25-100",
        "100-300",
        "300+",
        "Use RVTools detected count",
        "Unknown",
      ], 3, true),
      q("vmware_versions", "VMware versions", "single", ["6.x", "7.x", "8.x", "Mixed", "Unknown"], 2),
      q("advanced_vmware_features", "Advanced VMware features used", "multi", [
        "vSAN",
        "NSX",
        "DRS",
        "HA",
        "Distributed Switches",
        "vVols",
        "SRM",
        "None",
        "Unknown",
      ], 3, true),
    ],
  },
  {
    id: "storage",
    title: "Storage",
    group: "advanced",
    description: "Current storage risks and destination constraints.",
    questions: [
      q("current_storage_type", "Current VMware storage type", "multi", [
        "Fibre Channel SAN",
        "iSCSI SAN",
        "NFS",
        "vSAN",
        "Local/DAS",
        "Mixed",
        "Unknown",
      ], 4, true),
      q("snapshot_consolidation_issues", "Known snapshot/consolidation issues", "single", ["Yes", "No", "Unknown"], 3),
      q("datastores_near_capacity", "Datastores near capacity", "single", ["Yes", "No", "Unknown"], 3),
      q("large_disk_workloads", "Large disk / file server workloads", "single", ["Yes", "No", "Unknown"], 3),
      textQ("large_disk_workloads_notes", "Large disk workload notes", "Describe if known.", 1),
      q("special_storage_requirements", "Special storage requirements", "multi", [
        "High IOPS",
        "Low latency",
        "Encryption",
        "Replication",
        "Shared HA storage",
        "Unknown",
        "None",
      ], 3),
    ],
  },
  {
    id: "network",
    title: "Network",
    group: "advanced",
    description: "Networking and segmentation details that affect migration waves.",
    questions: [
      q("vmware_switch_type", "VMware switch type", "single", ["Standard switches", "Distributed switches", "Both", "Unknown"], 3, true),
      q("main_vlan_count", "Number of main VLANs/networks", "single", ["1-5", "6-20", "20+", "Unknown"], 3),
      q("important_multi_nic_vms", "Important multi-NIC VMs", "single", ["Yes", "No", "Unknown"], 2),
      q("dmz_segmentation", "DMZ/segmentation/isolated networks", "single", ["Yes", "No", "Unknown"], 3),
      q("network_documentation", "Network documentation available", "multi", ["NetBox", "IPAM", "Excel/CSV", "Diagram", "Firewall export", "None", "Unknown"], 3, true),
      q("critical_firewall_rules", "Critical firewall rules between applications", "single", ["Yes", "No", "Unknown"], 3),
    ],
  },
  {
    id: "backup_dr",
    title: "Backup / DR",
    group: "advanced",
    description: "Backup and recovery proof that changes confidence and go/no-go decisions.",
    questions: [
      q("backup_solution", "Backup solution", "single", ["Veeam", "Commvault", "Nakivo", "Rubrik", "Cohesity", "Proxmox Backup Server", "Scripts/other", "No clear backup", "Unknown"], 5, true),
      q("backup_evidence_available", "Backup evidence/export available", "single", ["Yes", "No", "Not now, maybe later"], 4, true),
      q("last_restore_test", "Last restore test", "single", ["Last 30 days", "1-3 months", "3-12 months", "More than 1 year", "Never", "Unknown"], 4, true),
      q("critical_rpo_rto", "Expected RPO/RTO for critical systems", "single", ["Under 1 hour", "1-4 hours", "4-24 hours", "24+ hours", "Not defined", "Unknown"], 3),
      q("dr_site_replication", "DR site or replication", "single", ["Yes", "No", "Partial", "Unknown"], 3),
    ],
  },
  {
    id: "business_criticality",
    title: "Business Criticality",
    group: "advanced",
    description: "Application context that RVTools cannot infer.",
    questions: [
      q("critical_workload_types", "Critical workload types", "multi", ["ERP", "SQL/Database", "Domain Controllers", "File servers", "Email", "Web apps", "Manufacturing/OT", "Finance/Billing", "Healthcare/Compliance", "Other", "Unknown"], 4, true),
      textQ("critical_apps_list", "Critical VMs/applications list", "Unknown or complete later is accepted.", 3, true),
      q("must_not_migrate_first_wave", "Systems that must not migrate in first wave", "single", ["Yes", "No", "Unknown"], 3),
      textQ("must_not_migrate_first_wave_notes", "First-wave exclusions notes", "Optional details.", 1),
      q("must_migrate_together", "Systems that must migrate together", "single", ["Yes", "No", "Unknown"], 3),
      textQ("must_migrate_together_notes", "Together-migration notes", "Optional details.", 1),
      q("application_owners_identified", "Application owners identified", "single", ["Yes", "No", "Partial", "Unknown"], 3, true),
    ],
  },
  {
    id: "downtime_windows",
    title: "Downtime / Windows",
    group: "advanced",
    description: "Business windows and downtime constraints.",
    questions: [
      q("standard_downtime_tolerance", "Downtime tolerance for standard workloads", "single", ["Under 30 minutes", "30-60 minutes", "1-4 hours", "4-8 hours", "8+ hours", "Not defined", "Unknown"], 3),
      q("critical_downtime_tolerance", "Downtime tolerance for critical workloads", "single", ["Near zero", "Under 30 minutes", "1-2 hours", "Night window", "Weekend window", "Not defined", "Unknown"], 4, true),
      q("maintenance_windows", "Maintenance windows", "single", ["Night", "Weekend", "Monthly", "Not defined", "Other"], 3),
      q("blackout_dates", "Blackout dates / periods", "single", ["Yes", "No", "Unknown"], 2),
      textQ("blackout_dates_notes", "Blackout dates notes", "Optional details.", 1),
    ],
  },
  {
    id: "proxmox_target",
    title: "Proxmox Target",
    group: "advanced",
    description: "Destination readiness and target architecture signals.",
    questions: [
      q("proxmox_status", "Proxmox status", "single", ["Production cluster exists", "Lab exists", "In design", "Not started", "Unknown"], 5, true),
      q("planned_proxmox_nodes", "Planned Proxmox nodes", "single", ["1", "2", "3", "4+", "Not defined", "Unknown"], 3),
      q("planned_proxmox_storage", "Planned Proxmox storage", "multi", ["ZFS local", "Ceph", "NFS", "iSCSI/SAN", "LVM", "Mixed", "Not defined", "Unknown"], 4, true),
      q("proxmox_backup_server", "Proxmox Backup Server", "single", ["Yes", "No", "Not defined", "Unknown"], 3),
      q("ha_required", "HA required", "single", ["Yes", "No", "Partial", "Not defined", "Unknown"], 3),
      q("proxmox_networking_defined", "Proxmox networking defined", "single", ["Yes", "No", "Partial", "Unknown"], 3),
      q("proxmox_target_evidence_available", "Proxmox target export/API evidence available", "single", ["Yes", "No", "Later"], 3),
    ],
  },
  {
    id: "compliance_constraints",
    title: "Compliance / Constraints",
    group: "advanced",
    description: "Controls and data handling limitations.",
    questions: [
      q("compliance_requirements", "Compliance requirements", "multi", ["ISO", "SOC2", "GDPR", "PCI", "HIPAA", "Government", "Financial", "None", "Unknown"], 3),
      q("audit_evidence_requirements", "Audit/evidence requirements", "single", ["Yes", "No", "Unknown"], 3),
      q("data_handling_restrictions", "Data handling restrictions", "multi", ["No sensitive data uploads", "NDA required", "Anonymized data only", "Internal-only", "Unknown", "None"], 3, true),
      q("migration_executor", "Who will execute the migration?", "single", ["Internal team", "External consultant", "MSP", "Need a partner", "Not defined"], 2),
    ],
  },
  {
    id: "free_text",
    title: "Free Text",
    group: "advanced",
    description: "Open-ended context for advisory quality.",
    questions: [
      textQ("biggest_migration_concern", "Biggest migration concern", "Optional free text.", 2),
      textQ("failure_definition", "What would make this project fail?", "Optional free text.", 2),
      textQ("success_definition", "What would make this project successful?", "Optional free text.", 2),
      textQ("assessment_extra_notes", "Anything the assessment should know?", "Optional free text.", 2),
    ],
  },
];

export const migrationContextQuestions = migrationContextSections.flatMap((section) => section.questions);

function q(
  id: string,
  label: string,
  type: "single" | "multi",
  options: string[],
  weight: number,
  keyQuestion = false,
): MigrationContextQuestion {
  return {
    id,
    label,
    type,
    options,
    sectionId: "",
    weight,
    keyQuestion,
  };
}

function textQ(
  id: string,
  label: string,
  placeholder: string,
  weight: number,
  keyQuestion = false,
): MigrationContextQuestion {
  return {
    id,
    label,
    type: "text",
    placeholder,
    sectionId: "",
    weight,
    keyQuestion,
  };
}

for (const section of migrationContextSections) {
  section.questions.forEach((question) => {
    question.sectionId = section.id;
  });
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeAnswer(value: unknown): MigrationContextAnswer {
  if (!isPlainObject(value)) {
    return {
      value: null,
      status: "skipped",
      source: "missing",
      updatedAt: null,
    };
  }

  const rawStatus = value.status;
  const status: MigrationContextStatus =
    rawStatus === "answered" || rawStatus === "unknown" || rawStatus === "not_applicable" || rawStatus === "skipped"
      ? rawStatus
      : "skipped";
  const rawSource = value.source;
  const source: MigrationContextSource =
    rawSource === "user_input" || rawSource === "inferred_from_rvtools" || rawSource === "missing"
      ? rawSource
      : status === "answered"
        ? "user_input"
        : "missing";
  const rawValue = value.value;
  const answerValue =
    typeof rawValue === "string" || Array.isArray(rawValue)
      ? rawValue
      : rawValue === null
        ? null
        : null;

  return {
    value: answerValue,
    status,
    source,
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : null,
  };
}

export function getMigrationContextFromAssessment(assessment: AssessmentDetail): MigrationContextData {
  const assumptionsJson = assessment.costRiskAssumptions?.assumptionsJson;
  const root = isPlainObject(assumptionsJson) ? assumptionsJson : {};
  const rawContext = root[MIGRATION_CONTEXT_JSON_KEY];
  const rawAnswers = isPlainObject(rawContext) && isPlainObject(rawContext.answers) ? rawContext.answers : {};

  const answers: Record<string, MigrationContextAnswer> = {};
  migrationContextQuestions.forEach((question) => {
    answers[question.id] = normalizeAnswer(rawAnswers[question.id]);
  });

  return {
    version: 1,
    answers,
    updatedAt: isPlainObject(rawContext) && typeof rawContext.updatedAt === "string" ? rawContext.updatedAt : null,
  };
}

export function getMigrationContextAnswerLabel(answer: MigrationContextAnswer) {
  if (answer.status === "unknown") return "Unknown";
  if (answer.status === "not_applicable") return "Not applicable";
  if (answer.status === "skipped") return "Skipped";
  if (Array.isArray(answer.value)) return answer.value.join(", ");
  return answer.value || "Answered";
}

function answerHasValue(answer: MigrationContextAnswer) {
  if (Array.isArray(answer.value)) {
    return answer.value.length > 0;
  }
  return typeof answer.value === "string" && answer.value.trim().length > 0;
}

function getAnswerCredit(answer: MigrationContextAnswer, weight: number) {
  if (answer.status === "answered" && answerHasValue(answer)) {
    return weight;
  }
  if (answer.status === "not_applicable") {
    return weight * 0.75;
  }
  return 0;
}

function coverageStatus(percent: number): MigrationContextCoverage["status"] {
  if (percent >= 75) return "strong";
  if (percent >= 45) return "partial";
  if (percent > 0) return "limited";
  return "missing";
}

export function computeMigrationContextCoverage(context: MigrationContextData): MigrationContextCoverage {
  const totalWeight = migrationContextQuestions.reduce((sum, question) => sum + question.weight, 0);
  const answeredWeight = migrationContextQuestions.reduce(
    (sum, question) => sum + getAnswerCredit(context.answers[question.id], question.weight),
    0,
  );
  const overallPercent = totalWeight > 0 ? Math.round((answeredWeight / totalWeight) * 100) : 0;

  const missingKeyContext = migrationContextQuestions
    .filter((question) => question.keyQuestion)
    .filter((question) => getAnswerCredit(context.answers[question.id], question.weight) === 0)
    .map((question) => question.label);

  const sections = migrationContextSections.map((section) => {
    const sectionTotal = section.questions.reduce((sum, question) => sum + question.weight, 0);
    const sectionAnswered = section.questions.reduce(
      (sum, question) => sum + getAnswerCredit(context.answers[question.id], question.weight),
      0,
    );
    const percent = sectionTotal > 0 ? Math.round((sectionAnswered / sectionTotal) * 100) : 0;
    const missing = section.questions
      .filter((question) => question.keyQuestion)
      .filter((question) => getAnswerCredit(context.answers[question.id], question.weight) === 0)
      .map((question) => question.label);

    return {
      id: section.id,
      title: section.title,
      percent,
      status: coverageStatus(percent),
      missing,
    };
  });

  return {
    overallPercent,
    status: coverageStatus(overallPercent),
    answeredWeight,
    totalWeight,
    missingKeyContext,
    sections,
  };
}

export function getImportantMigrationContext(context: MigrationContextData, limit = 8) {
  return migrationContextQuestions
    .map((question) => ({
      question,
      answer: context.answers[question.id],
    }))
    .filter(({ answer }) => answer.status === "answered" && answerHasValue(answer))
    .slice(0, limit)
    .map(({ question, answer }) => `${question.label}: ${getMigrationContextAnswerLabel(answer)}`);
}

export function getMigrationContextConfidenceImpact(coverage: MigrationContextCoverage) {
  if (coverage.status === "strong") {
    return "Project context is strong enough to improve advisory quality and reduce ambiguous missing-evidence assumptions.";
  }
  if (coverage.status === "partial") {
    return "Project context is partially covered. Recommendations can be directional, but migration sequencing still needs missing context.";
  }
  if (coverage.status === "limited") {
    return "Project context is limited. Treat business criticality, downtime and dependency assumptions as review-required.";
  }
  return "Project context is missing. The report must treat human migration constraints as evidence gaps.";
}

export function getMigrationContextMissingEvidence(coverage: MigrationContextCoverage) {
  const missing = coverage.missingKeyContext.slice(0, 12);
  if (missing.length === 0) {
    return ["No key migration context gaps are currently open."];
  }
  return missing.map((item) => `${item} was not provided or was marked unknown/skipped.`);
}

function parseSingleContextValue(value: FormDataEntryValue | null) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

export function parseMigrationContextFormData(formData: FormData): MigrationContextData {
  const now = new Date().toISOString();
  const answers: Record<string, MigrationContextAnswer> = {};

  migrationContextQuestions.forEach((question) => {
    const statusRaw = formData.get(`context.${question.id}.status`);
    const status: MigrationContextStatus =
      statusRaw === "answered" || statusRaw === "unknown" || statusRaw === "not_applicable" || statusRaw === "skipped"
        ? statusRaw
        : "skipped";

    const value: string | string[] | null = question.type === "multi"
      ? formData
        .getAll(`context.${question.id}.value`)
        .filter((entry): entry is string => typeof entry === "string")
        .map((entry) => entry.trim())
        .filter(Boolean)
      : parseSingleContextValue(formData.get(`context.${question.id}.value`));

    const effectiveStatus = status === "answered" && (!value || (Array.isArray(value) && value.length === 0))
      ? "skipped"
      : status;

    answers[question.id] = {
      value,
      status: effectiveStatus,
      source: effectiveStatus === "answered" ? "user_input" : "missing",
      updatedAt: effectiveStatus === "skipped" ? null : now,
    };
  });

  return {
    version: 1,
    answers,
    updatedAt: now,
  };
}

export async function saveMigrationContext(params: {
  userId: string;
  assessmentId: string;
  context: MigrationContextData;
}) {
  const assessment = await ensureAssessmentOwnership(params);
  const existing = assessment.costRiskAssumptions?.assumptionsJson;
  const root = isPlainObject(existing) ? existing : {};
  const assumptionsJson = {
    ...root,
    [MIGRATION_CONTEXT_JSON_KEY]: params.context,
  } satisfies Prisma.InputJsonObject;

  const updated = await prisma.costRiskAssumptions.upsert({
    where: {
      assessmentId: assessment.id,
    },
    create: {
      assessmentId: assessment.id,
      currency: "USD",
      years: 3,
      assumptionsJson,
    },
    update: {
      assumptionsJson,
    },
  });

  const coverage = computeMigrationContextCoverage(params.context);

  await prisma.auditEvent.create({
    data: {
      userId: params.userId,
      workspaceId: assessment.workspaceId,
      assessmentId: assessment.id,
      eventType: "migration_context_updated",
      message: "Updated adaptive migration context.",
      metadataJson: {
        contextCoverage: coverage.overallPercent,
        contextStatus: coverage.status,
        missingKeyContextCount: coverage.missingKeyContext.length,
      },
    },
  });

  return updated;
}

export function getUnknownOptionHint(question: MigrationContextQuestion) {
  if (question.options?.some((option) => unknownOptions.includes(option))) {
    return "Use the explicit Unknown option when that is the current truth.";
  }
  return "If you are not sure, mark the status as Unknown and continue.";
}
