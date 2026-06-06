import Link from "next/link";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowRight,
  Brain,
  BriefcaseBusiness,
  CheckCircle2,
  ClipboardList,
  Database,
  Eye,
  FileSearch,
  FileSpreadsheet,
  FileText,
  Gauge,
  Home,
  Layers3,
  Lock,
  Network,
  Radar,
  ShieldCheck,
  Sparkles,
  Waves,
} from "lucide-react";
import Navbar from "../Navbar";
import Footer from "../Footer";

const reportStats = [
  { value: "126", label: "VMs analyzed", note: "Synthetic industrial footprint", tone: "cyan" },
  { value: "6", label: "ESXi hosts", note: "Mixed estate sample", tone: "cyan" },
  { value: "14", label: "Datastores", note: "Storage topology preview", tone: "violet" },
  { value: "19", label: "Snapshots", note: "Operational clean-up signal", tone: "amber" },
  { value: "64/100", label: "Readiness score", note: "Medium migration posture", tone: "emerald" },
  { value: "58/100", label: "Evidence confidence", note: "Key gaps still visible", tone: "amber" },
  { value: "52/100", label: "Storage readiness", note: "Design still constrained", tone: "violet" },
  { value: "$87.5K", label: "Annual savings estimate", note: "Modeled Broadcom delta", tone: "amber" },
  { value: "23", label: "PDF pages", note: "Boardroom plus technical layers", tone: "cyan" },
] as const;

const reportHighlights = [
  {
    eyebrow: "Public sample",
    title: "Judge the output before sharing your evidence",
    body: "See structure, tone and premium report quality with synthetic data only.",
    note: "Best for pre-sales validation and stakeholder expectation-setting.",
    icon: Eye,
    tone: "cyan",
  },
  {
    eyebrow: "Professional Assessment",
    title: "Turn VMware evidence into a private decision pack",
    body: "Readiness, risk classes, evidence gaps and migration posture for your real environment.",
    note: "Best for cost exposure, technical qualification and go/no-go preparation.",
    icon: FileSearch,
    tone: "emerald",
  },
  {
    eyebrow: "Migration Blueprint",
    title: "Extend the report into controlled execution planning",
    body: "Adds scoped waves, validation gates, rollback expectations and remediation framing.",
    note: "Best for MSPs, partners and internal teams who need an execution playbook next.",
    icon: Radar,
    tone: "violet",
  },
] as const;

const tocItems = [
  "Executive Summary",
  "Assessment Scope",
  "Environment Overview",
  "Readiness Score",
  "Confidence Score",
  "VMware -> Proxmox Technical Readiness",
  "Storage Destination Readiness",
  "Licensing & Cost Exposure",
  "Business Continuity Risk",
  "VM Risk Matrix",
  "Workload Classification",
  "Proxmox Target / Sizing Preview",
  "Recommended Migration Path",
  "Remediation Roadmap",
  "Senior AI Advisor Insights",
  "Senior AI Advisor Q&A Highlights",
  "Project Memory / Decisions Captured",
  "Assumptions & Disclaimers",
];

const evidenceRows = [
  ["RVTools Inventory", "Received", "High confidence"],
  ["Technical Context", "Received", "Medium confidence"],
  ["Backup Evidence", "Missing", "Low confidence"],
  ["Application Dependencies", "Missing", "Low confidence"],
  ["Proxmox Target", "Partial", "Medium confidence"],
  ["Network Mapping", "Partial", "Medium confidence"],
  ["Performance History", "Missing", "Low confidence"],
];

const evidenceExpansionRows = [
  ["Synthetic dataset library", "8 scenarios", "Demo and QA coverage without customer data."],
  ["Migration Recommendation Plan", "Included", "Gates, blockers, remediation, wave strategy and go/no-go sections."],
  ["Print-friendly PDFs", "Applied", "White report pages, readable tables and page numbering for stakeholder review."],
  ["Missing evidence behavior", "Visible", "Missing backup, target, storage or dependency evidence lowers confidence instead of being guessed."],
];

const topRisks = [
  ["Backup evidence missing", "Critical"],
  ["Application dependencies missing", "High"],
  ["Datastores above 80%", "High"],
  ["Old snapshots detected", "High"],
  ["Storage target design incomplete", "High"],
  ["Licensing exposure requires validation", "Medium"],
  ["Critical workloads require manual review", "Critical"],
];

const vmRows = [
  ["web-portal-01", "Web App", "Low", "Wave 1"],
  ["fileserver-02", "File Server", "Medium", "Validate storage"],
  ["sql-prod-01", "Database", "High", "Manual review"],
  ["dc-main-01", "Domain Controller", "High", "Special plan"],
  ["erp-prod", "ERP", "Critical", "Hold"],
  ["backup-proxy", "Backup service", "High", "Wave 0 validation"],
  ["legacy-app", "Legacy app", "Medium", "Retire/rehost review"],
];

const waveItems = [
  ["Wave 0", "Pilot", "Validate assumptions with non-critical candidates."],
  ["Wave 1", "Low-risk workloads", "Move simple workloads after evidence review."],
  ["Wave 2", "Standard production", "Requires dependency and backup validation."],
  ["Wave 3", "Critical systems", "Identity, database and ERP-like workloads."],
  ["Hold", "Not ready", "Blocked until missing evidence is resolved."],
  ["Retire", "Candidates for decommission", "Review before spending migration effort."],
];

const sizingItems = [
  ["Recommended nodes", "3-4"],
  ["RAM target", "1.8-2.5 TB"],
  ["Usable storage", "70 TB+"],
  ["Backup capacity", "90 TB"],
  ["HA readiness", "Conditional"],
  ["Network readiness", "Requires mapping"],
  ["Ceph posture", "Conditional"],
  ["Licensing model", "12 sockets / 288 cores"],
];

const limitations = [
  "It does not migrate VMs.",
  "It does not guarantee zero downtime.",
  "It does not replace a pilot.",
  "It is not a financial quote or vendor contract.",
  "It does not prove backup restorability without backup evidence.",
  "It does not assume Ceph is the default target storage.",
  "It does not infer application dependencies that were not provided.",
  "It does not use customer data.",
];

const scoreCards = [
  {
    label: "Migration Readiness Score",
    value: "64/100",
    footnote: "Medium readiness",
    body: "The environment has viable pilot candidates, but storage architecture and continuity proof still block broader waves.",
    icon: Gauge,
    tone: "emerald",
  },
  {
    label: "Evidence Confidence Score",
    value: "58/100",
    footnote: "Limited evidence",
    body: "Confidence stays intentionally restrained when backup, dependencies or target architecture are missing or partial.",
    icon: ShieldCheck,
    tone: "amber",
  },
] as const;

const summarySignals = [
  {
    title: "Board-ready narrative",
    body: "Financial pressure, technical risk and evidence gaps translated into one decision language.",
    icon: BriefcaseBusiness,
    tone: "cyan",
  },
  {
    title: "Technical signal integrity",
    body: "Risk calls stay tied to received evidence instead of being guessed by a generic spreadsheet or chatbot.",
    icon: Radar,
    tone: "violet",
  },
  {
    title: "Controlled next actions",
    body: "The sample shows exactly how pilots, holds and remediation steps are sequenced before production change.",
    icon: Waves,
    tone: "amber",
  },
] as const;

export default function SampleReportPage() {
  return (
    <>
      <Navbar />
      <main className="shiftreadiness-page demo-page sample-report-page">
        <section className="section demo-hero sample-report-hero">
          <div className="bg-mesh" />
          <div className="container sample-report-hero-grid">
            <div className="demo-hero-copy">
              <div className="sample-report-brand-route" aria-label="VMware to Proxmox route">
                <span className="sample-report-brand sample-report-brand-vmware">VMware</span>
                <span className="sample-report-route-arrow" aria-hidden="true">
                  <ArrowRight size={16} />
                </span>
                <span className="sample-report-brand sample-report-brand-proxmox">Proxmox</span>
              </div>
              <div className="badge badge-cyan">Full premium synthetic sample</div>
              <h1>See the decision pack before you upload your own infrastructure evidence.</h1>
              <p className="demo-hero-subtitle">
                Review the boardroom-ready VMware to Proxmox report, planning logic and risk framing that Shift Evidence
                generates before any production change is approved.
              </p>
              <p className="demo-hero-body">
                This public sample uses a synthetic industrial VMware environment to show the full consulting-style
                output: readiness, storage destination, licensing exposure, continuity risk, VM matrix, migration waves,
                Senior AI Advisor commentary and Project Memory decisions.
              </p>
              <div className="sample-report-signal-strip" aria-label="Sample report signals">
                <article className="glass-card sample-report-signal-card" data-tone="cyan">
                  <Sparkles size={18} />
                  <div>
                    <strong>Synthetic sample</strong>
                    <span>No customer data or tenant exposure</span>
                  </div>
                </article>
                <article className="glass-card sample-report-signal-card" data-tone="violet">
                  <FileText size={18} />
                  <div>
                    <strong>Boardroom-ready PDF</strong>
                    <span>Executive, technical and planning layers together</span>
                  </div>
                </article>
                <article className="glass-card sample-report-signal-card" data-tone="amber">
                  <Lock size={18} />
                  <div>
                    <strong>Evidence-based only</strong>
                    <span>No migration automation or production access required</span>
                  </div>
                </article>
              </div>
              <div className="sample-report-action-grid">
                <a
                  href="/sample-reports/proxmox-migration-readiness-premium-sample-report-v3.pdf"
                  className="btn btn-primary btn-glow sample-report-primary-cta"
                  target="_blank"
                  rel="noreferrer"
                >
                  <ArrowDownToLine size={18} />
                  Download premium sample PDF v3
                </a>
                <Link href="/demo/workspace" className="sample-report-action-card" data-tone="cyan">
                  <strong>Explore Sample Assessment</strong>
                  <span>Open the synthetic workspace behind the report.</span>
                  <ArrowRight size={16} />
                </Link>
                <Link href="/demo/replay" className="sample-report-action-card" data-tone="violet">
                  <strong>Watch Guided Replay</strong>
                  <span>Follow the evidence-to-decision flow in under two minutes.</span>
                  <ArrowRight size={16} />
                </Link>
                <Link href="/pricing" className="sample-report-action-card" data-tone="amber">
                  <strong>View Pricing</strong>
                  <span>Compare assessment and blueprint options before you start.</span>
                  <ArrowRight size={16} />
                </Link>
                <a
                  href="/marketing/shift-evidence-product-brochure-v1.pdf"
                  className="sample-report-action-card"
                  data-tone="cyan"
                  target="_blank"
                  rel="noreferrer"
                >
                  <strong>Download Product Brochure</strong>
                  <span>Share the product overview before a stakeholder review.</span>
                  <ArrowDownToLine size={16} />
                </a>
              </div>
              <p className="assessment-inline-note">
                Professional Assessment focuses on the evidence-backed report and VM-by-VM decision pack. Migration
                Blueprint extends that output into scoped waves, validation gates, rollback expectations and remediation
                planning.
              </p>
            </div>

            <aside className="glass-card sample-report-cover" aria-label="Sample report cover preview">
              <div className="demo-terminal-header">
                <span className="sr-mockup-dot red" />
                <span className="sr-mockup-dot yellow" />
                <span className="sr-mockup-dot green" />
                <strong>Decision pack preview</strong>
              </div>
              <div className="sample-report-cover-body">
                <div className="sample-report-preview-stack">
                  <div className="sample-report-preview-page sample-report-preview-page-back" aria-hidden="true" />
                  <div className="sample-report-preview-page sample-report-preview-page-mid" aria-hidden="true" />
                  <div className="sample-report-preview-page sample-report-preview-page-front">
                    <span className="sample-report-kicker">Premium synthetic sample report</span>
                    <h2>Northbridge Industrial Group</h2>
                    <p>VMware -&gt; Proxmox Migration Readiness Assessment</p>
                    <div className="sample-report-score-strip">
                      <div>
                        <span>Readiness</span>
                        <strong>64/100</strong>
                      </div>
                      <div>
                        <span>Confidence</span>
                        <strong>58/100</strong>
                      </div>
                    </div>
                    <div className="sample-report-preview-modules">
                      <span>Executive summary</span>
                      <span>VM risk matrix</span>
                      <span>Storage readiness</span>
                      <span>Migration waves</span>
                    </div>
                  </div>
                </div>
                <div className="sample-report-preview-footer">
                  <div className="sample-report-preview-footer-card" data-tone="emerald">
                    <span>Advisory depth</span>
                    <strong>Senior TAM-style narrative</strong>
                  </div>
                  <div className="sample-report-preview-footer-card" data-tone="amber">
                    <span>Financial layer</span>
                    <strong>Broadcom pressure + destination delta</strong>
                  </div>
                  <div className="sample-report-preview-footer-card" data-tone="cyan">
                    <span>Integrity guardrail</span>
                    <strong>Missing evidence lowers confidence</strong>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section id="sample-structure" className="section shiftreadiness-section">
          <div className="container">
            <div className="shiftreadiness-section-heading sample-report-heading-tight">
              <div className="badge badge-cyan">Report foundation</div>
              <h2>Understand the deliverable, the evidence depth and the commercial path in one pass.</h2>
              <p>
                The downloadable PDF is a synthetic public sample. It is intentionally richer than the basic preview so
                prospects can evaluate report quality without exposing customer data or confusing the sample with a
                quote.
              </p>
            </div>

            <div className="sample-report-stat-grid">
              {reportStats.map(({ value, label, note, tone }) => (
                <article key={label} className="glass-card sample-report-stat" data-tone={tone}>
                  <strong>{value}</strong>
                  <span>{label}</span>
                  <small>{note}</small>
                </article>
              ))}
            </div>

            <div className="sample-report-offer-bridge" aria-label="Sample report commercial bridge">
              {reportHighlights.map(({ eyebrow, title, body, note, icon: Icon, tone }) => (
                <article key={title} className="glass-card sample-report-offer-card" data-tone={tone}>
                  <div className="sample-report-offer-head">
                    <span>{eyebrow}</span>
                    <Icon size={18} />
                  </div>
                  <h3>{title}</h3>
                  <p>{body}</p>
                  <small>{note}</small>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section shiftreadiness-section shiftreadiness-section-alt">
          <div className="container sample-report-two-col">
            <article className="glass-card sample-report-panel">
              <div className="sample-report-panel-title">
                <ClipboardList size={22} />
                <div>
                  <span className="sample-report-panel-kicker">Inside the PDF</span>
                  <h2>Table of contents</h2>
                </div>
              </div>
              <div className="sample-report-toc">
                {tocItems.map((item, index) => (
                  <span key={item}>
                    <strong>{String(index + 1).padStart(2, "0")}</strong>
                    <em>{item}</em>
                  </span>
                ))}
              </div>
            </article>

            <article className="glass-card sample-report-panel sample-report-summary-panel">
              <div className="sample-report-panel-title">
                <FileText size={22} />
                <div>
                  <span className="sample-report-panel-kicker">Executive layer</span>
                  <h2>Executive summary preview</h2>
                </div>
              </div>
              <p className="sample-report-summary">
                Northbridge Industrial has a medium migration readiness posture based on the evidence provided. The VMware
                inventory is usable for planning, but backup restore evidence, application dependency mapping, storage
                design and production go/no-go criteria remain incomplete. Low-risk workloads may enter a pilot, while
                SQL, ERP, domain controller and storage-heavy workloads require manual validation before production waves.
              </p>
              <div className="sample-report-summary-signals">
                {summarySignals.map(({ title, body, icon: Icon, tone }) => (
                  <div key={title} className="sample-report-summary-signal" data-tone={tone}>
                    <Icon size={18} />
                    <div>
                      <strong>{title}</strong>
                      <span>{body}</span>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </section>

        <section className="section shiftreadiness-section">
          <div className="container">
            <div className="sample-report-score-grid">
              {scoreCards.map(({ label, value, footnote, body, icon: Icon, tone }) => (
                <article key={label} className="glass-card sample-report-score-card" data-tone={tone}>
                  <div className="sample-report-score-head">
                    <Icon size={22} />
                    <span>{label}</span>
                  </div>
                  <strong>{value}</strong>
                  <p>{footnote}</p>
                  <small>{body}</small>
                </article>
              ))}
              <article className="glass-card sample-report-score-note">
                <div className="sample-report-panel-title">
                  <AlertTriangle size={22} />
                  <div>
                    <span className="sample-report-panel-kicker">Interpretation rule</span>
                    <h3>High readiness without high confidence is still a risk.</h3>
                  </div>
                </div>
                <p>
                  Shift Evidence separates migration posture from evidence completeness so teams do not confuse
                  inventory visibility with real operational readiness.
                </p>
                <div className="sample-report-note-pills">
                  <span>Readiness qualifies fit</span>
                  <span>Confidence qualifies trust</span>
                  <span>Missing evidence stays visible</span>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="section shiftreadiness-section shiftreadiness-section-alt">
          <div className="container sample-report-grid-stack">
            <TableBlock
              title="Evidence matrix"
              eyebrow="Coverage layer"
              description="What was supplied, what is missing and how each signal changes the confidence model."
              icon={<FileSpreadsheet size={22} />}
              headers={["Evidence", "Status", "Confidence"]}
              rows={evidenceRows}
            />
            <TableBlock
              title="Evidence expansion coverage"
              eyebrow="Synthetic library"
              description="What the public sample demonstrates beyond the core inventory export."
              icon={<ClipboardList size={22} />}
              headers={["Capability", "Status", "What it demonstrates"]}
              rows={evidenceExpansionRows}
            />
            <CardListBlock
              title="Top risks"
              eyebrow="What blockers look like"
              description="Severity stays explicit so fast decisions do not blur the critical path."
              icon={<AlertTriangle size={22} />}
              items={topRisks}
            />
            <TableBlock
              title="VM classification preview"
              eyebrow="Wave qualification"
              description="Workloads are separated by complexity, not just by inventory count."
              icon={<Layers3 size={22} />}
              headers={["VM", "Role", "Complexity", "Action"]}
              rows={vmRows}
            />
          </div>
        </section>

        <section className="section shiftreadiness-section">
          <div className="container">
            <div className="shiftreadiness-section-heading sample-report-heading-tight">
              <div className="badge badge-cyan">Planning previews</div>
              <h2>Waves, sizing, storage and licensing become planning inputs before they become migration commitments.</h2>
              <p>
                The sample shows how planning logic is exposed early, while still keeping operational guardrails and
                evidence uncertainty visible.
              </p>
            </div>
            <div className="sample-report-planning-grid">
              <article className="glass-card sample-report-panel">
                <div className="sample-report-panel-title">
                  <Waves size={22} />
                  <div>
                    <span className="sample-report-panel-kicker">Execution framing</span>
                    <h3>Migration waves preview</h3>
                  </div>
                </div>
                <div className="sample-report-wave-list">
                  {waveItems.map(([label, title, body]) => (
                    <div key={label}>
                      <span>{label}</span>
                      <strong>{title}</strong>
                      <p>{body}</p>
                    </div>
                  ))}
                </div>
              </article>

              <article className="glass-card sample-report-panel">
                <div className="sample-report-panel-title">
                  <Database size={22} />
                  <div>
                    <span className="sample-report-panel-kicker">Target posture</span>
                    <h3>Proxmox sizing preview</h3>
                  </div>
                </div>
                <div className="sample-report-sizing-grid">
                  {sizingItems.map(([label, value]) => (
                    <div key={label}>
                      <span>{label}</span>
                      <strong>{value}</strong>
                    </div>
                  ))}
                </div>
                <p className="sample-report-disclaimer">
                  Based on synthetic allocation, not historical performance. Add monitoring data and target design for
                  higher confidence.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="section shiftreadiness-section shiftreadiness-section-alt">
          <div className="container sample-report-two-col">
            <article className="glass-card sample-report-panel sample-report-advisory">
              <div className="sample-report-panel-title">
                <Brain size={22} />
                <div>
                  <span className="sample-report-panel-kicker">Advisor preview</span>
                  <h2>Senior AI Advisor layer</h2>
                </div>
              </div>
              <p>
                Senior AI Advisor examples show how the premium report turns evidence gaps into decision questions,
                warnings and next actions. They are synthetic and do not replace deterministic scoring or expert review.
              </p>
              <blockquote>
                Backup evidence was not provided. Do not include critical workloads in early waves until restore points
                are validated. The first pilot should focus on low-risk workloads with clear rollback and backup
                validation.
              </blockquote>
            </article>

            <article className="glass-card sample-report-panel">
              <div className="sample-report-panel-title">
                <Network size={22} />
                <div>
                  <span className="sample-report-panel-kicker">Integrity boundaries</span>
                  <h2>What this sample does not prove</h2>
                </div>
              </div>
              <div className="demo-does-not-list">
                {limitations.map((item) => (
                  <span key={item}>
                    <CheckCircle2 size={15} />
                    {item}
                  </span>
                ))}
              </div>
            </article>
          </div>
        </section>

        <section className="section shiftreadiness-section">
          <div className="container">
            <div className="glass-card sample-report-inline-cta">
              <div className="sample-report-inline-copy">
                <div className="badge badge-cyan">Go beyond the PDF</div>
                <h2>Open the synthetic workspace behind the report.</h2>
                <p>
                  Explore scoring, evidence gaps, Storage Destination Readiness, migration waves and Advisor context in a
                  read-only synthetic assessment before starting your own workspace.
                </p>
              </div>
              <div className="sample-report-inline-actions">
                <Link href="/demo/replay" className="sample-report-inline-link" data-tone="violet">
                  <strong>Watch Quick Simulation</strong>
                  <span>See the evidence-to-decision flow in a guided replay.</span>
                  <ArrowRight size={16} />
                </Link>
                <Link href="/demo/workspace" className="sample-report-inline-link" data-tone="cyan">
                  <strong>Explore Sample Assessment</strong>
                  <span>Inspect the synthetic workspace with the same decision pack logic.</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="section shiftreadiness-section demo-final-cta">
          <div className="container">
            <div className="glass-card sr-final-card sample-report-final-card">
              <div>
                <div className="badge badge-cyan">Ready for your own evidence?</div>
                <h2>Move from synthetic proof to your own VMware readiness assessment.</h2>
                <p>
                  Use the sample report to set expectations, compare plans, then start a real assessment with your own
                  exported evidence and senior context.
                </p>
              </div>
              <div className="sr-final-actions">
                <Link href="/sign-up" className="btn btn-primary btn-glow">
                  Start readiness assessment
                  <ArrowRight size={18} />
                </Link>
                <Link href="/pricing" className="btn btn-secondary">
                  View pricing
                  <Waves size={17} />
                </Link>
                <Link href="/technical-review?source=sample_report" className="btn btn-secondary">
                  Book technical review
                  <ShieldCheck size={17} />
                </Link>
                <Link href="/demo/workspace" className="btn btn-secondary">
                  Explore a Sample Assessment
                  <Eye size={17} />
                </Link>
                <Link href="/" className="btn btn-secondary">
                  Back to home
                  <Home size={17} />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function TableBlock({
  title,
  eyebrow,
  description,
  icon,
  headers,
  rows,
}: {
  title: string;
  eyebrow: string;
  description: string;
  icon: ReactNode;
  headers: string[];
  rows: string[][];
}) {
  return (
    <article className="glass-card sample-report-panel">
      <div className="sample-report-panel-title">
        {icon}
        <div>
          <span className="sample-report-panel-kicker">{eyebrow}</span>
          <h2>{title}</h2>
        </div>
      </div>
      <p className="sample-report-panel-intro">{description}</p>
      <div className="demo-table-wrap">
        <table className="demo-table sample-report-table">
          <thead>
            <tr>
              {headers.map((header) => (
                <th key={header}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.join("-")}>
                {row.map((cell, index) => (
                  <td key={cell}>{renderTableCell(cell, index)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}

function CardListBlock({
  title,
  eyebrow,
  description,
  icon,
  items,
}: {
  title: string;
  eyebrow: string;
  description: string;
  icon: ReactNode;
  items: string[][];
}) {
  return (
    <article className="glass-card sample-report-panel">
      <div className="sample-report-panel-title">
        {icon}
        <div>
          <span className="sample-report-panel-kicker">{eyebrow}</span>
          <h2>{title}</h2>
        </div>
      </div>
      <p className="sample-report-panel-intro">{description}</p>
      <div className="sample-report-risk-grid">
        {items.map(([label, severity]) => (
          <div key={label} className="sample-report-risk-card" data-severity={severity.toLowerCase()}>
            <span>{severity}</span>
            <strong>{label}</strong>
          </div>
        ))}
      </div>
    </article>
  );
}

function renderTableCell(cell: string, columnIndex: number) {
  if (columnIndex === 0) {
    return cell;
  }

  const tone = getCellTone(cell);
  if (!tone) {
    return cell;
  }

  return (
    <span className="sample-report-table-pill" data-tone={tone}>
      {cell}
    </span>
  );
}

function getCellTone(cell: string) {
  const normalized = cell.toLowerCase();
  if (normalized.includes("missing") || normalized.includes("low")) {
    return "amber";
  }
  if (normalized.includes("partial") || normalized.includes("medium")) {
    return "violet";
  }
  if (normalized.includes("received") || normalized.includes("high") || normalized.includes("included") || normalized.includes("applied") || normalized.includes("visible")) {
    return "emerald";
  }
  if (normalized.includes("scenario")) {
    return "cyan";
  }
  return null;
}
