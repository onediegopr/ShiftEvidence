import Link from "next/link";
import { AlertTriangle, BadgePercent, CalendarClock, DollarSign, RefreshCcw, ShieldCheck } from "lucide-react";
import type { buildAssessmentLicensingAnalysisSummary } from "../../server/assessments/licensingCostExposureService";
import {
  runLicensingAnalysisAction,
  saveLicensingAnalysisPreferencesAction,
  skipLicensingAnalysisAction,
} from "../../app/dashboard/assessments/[id]/actions";

type LicensingCostExposurePanelProps = {
  assessmentId: string;
  summary: Awaited<ReturnType<typeof buildAssessmentLicensingAnalysisSummary>>;
  canShowAdminPricingLink: boolean;
};

function money(value: unknown) {
  if (value === null || value === undefined) return "-";
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return "-";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(parsed);
}

function dateLabel(value: Date | string | null | undefined) {
  if (!value) return "Not available";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function statusLabel(value: string | null | undefined) {
  if (!value) return "Not included";
  const labels: Record<string, string> = {
    blocked: "Blocked",
    broad_scenarios: "Broad scenarios",
    completed: "Completed",
    actual_costs: "Actual costs",
    estimated_from_environment: "Estimated from environment",
    fresh: "Fresh",
    low: "Low",
    medium: "Medium",
    needs_input: "Needs input",
    not_included: "Not included",
    ready: "Ready to analyze",
    skipped: "Skipped",
    stale: "Stale",
    stale_pricing: "Stale pricing",
    unknown: "Unknown",
  };
  return labels[value] ?? value.split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

function tone(value: string | null | undefined) {
  if (value === "completed" || value === "fresh" || value === "high") return "good";
  if (value === "needs_input" || value === "ready" || value === "stale_pricing" || value === "medium" || value === "stale") return "warning";
  if (value === "blocked" || value === "low") return "danger";
  return "neutral";
}

function pill(label: string, status: string | null | undefined) {
  return <span className={`assessment-chip assessment-chip-${tone(status)}`}>{label}</span>;
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function asArray(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value) ? value.filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null && !Array.isArray(item)) : [];
}

function textList(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export function LicensingCostExposurePanel({
  assessmentId,
  summary,
  canShowAdminPricingLink,
}: LicensingCostExposurePanelProps) {
  const analysis = summary.analysis;
  const preferences = summary.preferences;
  const comparison = asRecord(analysis?.comparisonJson);
  const costOfStaying = asRecord(analysis?.costOfStayingJson);
  const timingRisk = asRecord(analysis?.contractTimingRiskJson);
  const missingEvidence = asArray(analysis?.missingEvidenceJson);
  const licensingTraps = asArray(analysis?.licensingTrapsJson);
  const assumptions = textList(analysis?.assumptionsJson);

  return (
    <section id="licensing-cost-exposure-analysis" className="assessment-section glass-card">
      <div className="assessment-section-title">
        <div className="assessment-section-eyebrow">
          <BadgePercent size={18} />
          <span>Optional financial module</span>
        </div>
        <h2>Licensing & Cost Exposure Analysis</h2>
        <p>
          Compare your VMware/Broadcom renewal exposure against Proxmox subscription scenarios using approved pricing
          snapshots and your assessment evidence.
        </p>
      </div>

      <div className="assessment-status-row">
        {pill(statusLabel(analysis?.status), analysis?.status)}
        {pill(`Mode: ${statusLabel(analysis?.mode ?? preferences.mode)}`, analysis?.mode ?? preferences.mode)}
        {pill(`Pricing: ${statusLabel(summary.pricing.freshnessStatus)}`, summary.pricing.freshnessStatus)}
        {pill(summary.pricing.vmwareApprovedAvailable ? "VMware snapshot available" : "VMware snapshot missing", summary.pricing.vmwareApprovedAvailable ? "completed" : "needs_input")}
        {pill(summary.pricing.proxmoxApprovedAvailable ? "Proxmox snapshot available" : "Proxmox snapshot missing", summary.pricing.proxmoxApprovedAvailable ? "completed" : "needs_input")}
      </div>

      <div className="assessment-optional-module-panel">
        <div>
          <h3>Do you want to include licensing and cost exposure analysis in this assessment?</h3>
          <p>
            This module is optional. It improves financial precision, but missing or skipped cost data does not block
            report generation.
          </p>
        </div>
        <div className="assessment-optional-module-meta">
          <span>Detected hosts: {summary.detected.hostCount ?? "missing"}</span>
          <span>Detected sockets: {summary.detected.socketCount ?? "missing"}</span>
          <span>Detected cores: {summary.detected.coreCount ?? "missing"}</span>
          <span>Detected VMs: {summary.detected.vmCount ?? "missing"}</span>
        </div>
      </div>

      <form className="assessment-form-grid assessment-form-grid-wide" action={saveLicensingAnalysisPreferencesAction.bind(null, assessmentId)}>
        <input type="hidden" name="currency" value="USD" />
        <label className="form-label assessment-form-span-2">
          Analysis mode
          <select name="licensingAnalysisMode" className="form-input" defaultValue={preferences.mode}>
            <option value="actual_costs">Yes - I have VMware renewal or contract data</option>
            <option value="estimated_from_environment">Yes - estimate it based on my environment</option>
            <option value="broad_scenarios">Yes - compare broad scenarios only</option>
            <option value="skipped">No - skip cost analysis</option>
          </select>
        </label>
        <label className="form-label">
          Annual VMware/Broadcom cost in USD
          <input
            name="annualVmwareCostUsd"
            className="form-input"
            type="number"
            min="0"
            step="0.01"
            defaultValue={summary.currentInput.annualVmwareCostUsd ?? ""}
          />
        </label>
        <label className="form-label">
          Renewal date
          <input
            name="renewalDate"
            className="form-input"
            type="date"
            defaultValue={preferences.renewalDate ?? ""}
          />
        </label>
        <label className="form-label">
          Migration investment estimate in USD
          <input
            name="migrationInvestmentEstimateUsd"
            className="form-input"
            type="number"
            min="0"
            step="0.01"
            defaultValue={preferences.migrationInvestmentEstimateUsd ?? ""}
          />
        </label>
        <label className="form-label">
          Proxmox support scenario
          <select name="selectedProxmoxSupportScenario" className="form-input" defaultValue={preferences.selectedProxmoxSupportScenario ?? ""}>
            <option value="">Select support scenario</option>
            <option value="community">Community / no subscription</option>
            <option value="supported">Supported subscription</option>
            <option value="premium">Premium / high support</option>
            <option value="not_sure">Not sure yet</option>
          </select>
        </label>
        <div className="assessment-checkbox-grid">
          <label className="assessment-checkbox-row">
            <input type="checkbox" name="hasContract" defaultChecked={preferences.hasContract} />
            <span>I have a VMware/Broadcom contract</span>
          </label>
          <label className="assessment-checkbox-row">
            <input type="checkbox" name="hasRenewalQuote" defaultChecked={preferences.hasRenewalQuote} />
            <span>I have a renewal quote</span>
          </label>
          <label className="assessment-checkbox-row">
            <input type="checkbox" name="includeEscalation" defaultChecked={preferences.includeEscalation} />
            <span>Include 10% YoY Broadcom price escalation</span>
          </label>
        </div>
        <label className="form-label assessment-form-span-2">
          Notes
          <textarea
            name="licensingAnalysisNotes"
            className="form-input assessment-textarea"
            defaultValue={preferences.notes ?? ""}
            placeholder="Add contract, renewal, reseller or procurement context. Amounts must be entered in USD."
          />
        </label>

        <div className="assessment-inline-actions assessment-form-span-2">
          <button type="submit" className="btn btn-secondary">
            Save analysis inputs
            <RefreshCcw size={16} />
          </button>
          <button type="submit" className="btn btn-primary btn-glow" formAction={runLicensingAnalysisAction.bind(null, assessmentId)}>
            Run analysis
            <DollarSign size={16} />
          </button>
          <button type="submit" className="btn btn-secondary" formAction={skipLicensingAnalysisAction.bind(null, assessmentId)}>
            Skip module
          </button>
          {canShowAdminPricingLink ? (
            <Link href="/dashboard/admin/pricing" className="btn btn-secondary">
              Admin pricing
            </Link>
          ) : null}
        </div>
      </form>

      <div className="assessment-table-note">
        This is not a vendor quote. Estimates are based on customer-provided data, approved pricing snapshots and
        assessment evidence. Final pricing must be validated with the customer&apos;s vendor, reseller or procurement channel.
        Storage cost modeling is still in development and is not included in this analysis.
      </div>

      {analysis ? (
        <div className="report-history-grid" style={{ marginTop: "18px" }}>
          <article className="glass-card report-history-card">
            <div className="report-history-header">
              <h3>Financial confidence</h3>
              <ShieldCheck size={18} />
            </div>
            <strong>{analysis.financialConfidenceScore ?? "-"}%</strong>
            <p>{analysis.financialConfidenceLabel ?? "Not calculated"}</p>
            <p>Savings quality: {statusLabel(analysis.savingsQuality)}</p>
          </article>

          <article className="glass-card report-history-card">
            <div className="report-history-header">
              <h3>Cost of staying</h3>
              <DollarSign size={18} />
            </div>
            <p>Annual renewal: {money(costOfStaying.annualRenewalUsd)}</p>
            <p>3-year renewal: {money(costOfStaying.threeYearRenewalUsd)}</p>
            <p>Potential 3-year opportunity loss: {money(costOfStaying.opportunityLossThreeYearUsd)}</p>
          </article>

          <article className="glass-card report-history-card">
            <div className="report-history-header">
              <h3>Contract timing risk</h3>
              <CalendarClock size={18} />
            </div>
            <p>{statusLabel(String(timingRisk.label ?? "Unknown"))}</p>
            <p>Days to renewal: {String(timingRisk.daysToRenewal ?? "unknown")}</p>
            <p>{String(timingRisk.recommendation ?? "Collect renewal date before using timing as a decision factor.")}</p>
          </article>

          <article className="glass-card report-history-card">
            <div className="report-history-header">
              <h3>1 / 3 / 5 year delta</h3>
              <BadgePercent size={18} />
            </div>
            <p>Annual delta: {money(comparison.netDeltaAnnual)}</p>
            <p>3-year delta: {money(comparison.netDeltaThreeYear)}</p>
            <p>5-year delta: {money(comparison.netDeltaFiveYear)}</p>
            <p>Gross savings: {String(comparison.grossSavingsPercent ?? "-")}%</p>
          </article>

          <article className="glass-card report-history-card">
            <div className="report-history-header">
              <h3>Licensing traps</h3>
              <AlertTriangle size={18} />
            </div>
            {licensingTraps.length === 0 ? (
              <p>No major licensing traps detected from available evidence.</p>
            ) : (
              <ul>
                {licensingTraps.slice(0, 5).map((trap, index) => (
                  <li key={`${trap.title}-${index}`}>
                    <strong>{String(trap.title ?? "Potential exposure")}</strong>: {String(trap.description ?? "")}
                  </li>
                ))}
              </ul>
            )}
          </article>

          <article className="glass-card report-history-card">
            <div className="report-history-header">
              <h3>Missing financial evidence</h3>
              <FileWarningIcon />
            </div>
            {missingEvidence.length === 0 ? (
              <p>No major financial evidence gaps were detected.</p>
            ) : (
              <ul>
                {missingEvidence.slice(0, 6).map((item) => (
                  <li key={String(item.key)}>
                    <strong>{String(item.label ?? item.key)}</strong>: {String(item.impact ?? "")}
                  </li>
                ))}
              </ul>
            )}
          </article>

          <article className="glass-card report-history-card assessment-form-span-2">
            <div className="report-history-header">
              <h3>Executive recommendation</h3>
              <ShieldCheck size={18} />
            </div>
            <p>{analysis.executiveRecommendation ?? "Run the analysis to generate an executive recommendation."}</p>
            <p className="assessment-inline-note">Generated: {dateLabel(analysis.generatedAt)}</p>
          </article>

          <article className="glass-card report-history-card assessment-form-span-2">
            <div className="report-history-header">
              <h3>Assumptions</h3>
              <BadgePercent size={18} />
            </div>
            {assumptions.length === 0 ? (
              <p>Run the analysis to persist assumptions.</p>
            ) : (
              <ul>
                {assumptions.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </article>
        </div>
      ) : null}
    </section>
  );
}

function FileWarningIcon() {
  return <AlertTriangle size={18} />;
}
