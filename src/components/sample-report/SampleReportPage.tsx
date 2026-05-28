import Link from "next/link";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Brain,
  CheckCircle2,
  ClipboardList,
  Database,
  FileSpreadsheet,
  FileText,
  Home,
  Layers3,
  Network,
  ShieldCheck,
  Waves,
} from "lucide-react";

const reportStats = [
  ["126", "VMs analyzed"],
  ["6", "ESXi hosts"],
  ["14", "Datastores"],
  ["19", "Snapshots"],
  ["64/100", "Readiness Score"],
  ["58/100", "Evidence Confidence"],
  ["21", "Migration risks"],
  ["8", "Missing evidence items"],
];

const tocItems = [
  "Executive Summary",
  "Evidence Received",
  "Evidence Missing",
  "Readiness Score",
  "Confidence Score",
  "VM Risk Matrix",
  "Storage Risk",
  "Network Risk",
  "Backup Evidence",
  "Application Dependency Gaps",
  "Suggested Migration Waves",
  "Pilot Candidates",
  "Required Validations",
  "AI Advisory Notes",
  "Next Steps",
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

const topRisks = [
  ["Backup evidence missing", "Critical"],
  ["Application dependencies missing", "High"],
  ["Old snapshots detected", "High"],
  ["Large disks above 2 TB", "High"],
  ["Multi-NIC workloads", "Medium"],
  ["Outdated VMware Tools", "Medium"],
  ["Datastores above 85%", "High"],
  ["Critical workloads require manual review", "Critical"],
];

const vmRows = [
  ["web-portal-01", "Web App", "Low", "Wave 1"],
  ["fileserver-02", "File Server", "Medium", "Validate storage"],
  ["sql-prod-01", "Database", "High", "Manual review"],
  ["dc-main-01", "Domain Controller", "High", "Special plan"],
  ["erp-prod", "ERP", "Critical", "Hold"],
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
];

const limitations = [
  "It does not migrate VMs.",
  "It does not guarantee zero downtime.",
  "It does not replace a pilot.",
  "It does not prove backup restorability without backup evidence.",
  "It does not infer application dependencies that were not provided.",
  "It does not use customer data.",
];

export default function SampleReportPage() {
  return (
    <main className="shiftreadiness-page demo-page sample-report-page">
      <section className="section demo-hero sample-report-hero">
        <div className="bg-mesh" />
        <div className="container sample-report-hero-grid">
          <div className="demo-hero-copy">
            <div className="badge badge-cyan">Synthetic public sample</div>
            <h1>Sample Readiness Report</h1>
            <p className="demo-hero-subtitle">
              See what a VMware -&gt; Proxmox readiness assessment looks like before uploading your own data.
            </p>
            <p className="demo-hero-body">
              This public sample uses a synthetic VMware environment to show the type of executive and technical report
              ShiftReadiness can generate: readiness score, confidence score, evidence gaps, VM risk classification,
              Proxmox sizing, migration waves and AI Advisory notes.
            </p>
            <div className="demo-badge-row" aria-label="Sample report safety notes">
              <span>Synthetic sample</span>
              <span>No customer data</span>
              <span>Evidence-based</span>
              <span>No production access</span>
              <span>No migration automation</span>
            </div>
            <div className="shiftreadiness-actions">
              <a href="#sample-structure" className="btn btn-primary btn-glow">
                View sample structure
                <ArrowRight size={18} />
              </a>
              <Link href="/demo" className="btn btn-secondary">
                Watch the readiness replay
              </Link>
              <a
                href="/sample-reports/proxmox-migration-readiness-sample-report.pdf"
                className="btn btn-secondary"
                target="_blank"
                rel="noreferrer"
              >
                Download sample PDF
              </a>
            </div>
          </div>

          <aside className="glass-card sample-report-cover" aria-label="Sample report cover preview">
            <div className="demo-terminal-header">
              <span className="sr-mockup-dot red" />
              <span className="sr-mockup-dot yellow" />
              <span className="sr-mockup-dot green" />
              <strong>Report preview</strong>
            </div>
            <div className="sample-report-cover-body">
              <span className="sample-report-kicker">Synthetic sample report</span>
              <h2>ACME Manufacturing Group</h2>
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
            </div>
          </aside>
        </div>
      </section>

      <section id="sample-structure" className="section shiftreadiness-section">
        <div className="container">
          <div className="shiftreadiness-section-heading">
            <div className="badge badge-cyan">Report foundation</div>
            <h2>A compact view of the future 12-18 page report.</h2>
              <p>
                The downloadable PDF is a synthetic public sample. This page shows the report structure and the decision
                artifacts prospects should expect before uploading their own evidence.
              </p>
          </div>

          <div className="sample-report-stat-grid">
            {reportStats.map(([value, label]) => (
              <article key={label} className="glass-card sample-report-stat">
                <strong>{value}</strong>
                <span>{label}</span>
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
              <h2>Table of contents</h2>
            </div>
            <div className="sample-report-toc">
              {tocItems.map((item, index) => (
                <span key={item}>
                  {String(index + 1).padStart(2, "0")} / {item}
                </span>
              ))}
            </div>
          </article>

          <article className="glass-card sample-report-panel">
            <div className="sample-report-panel-title">
              <FileText size={22} />
              <h2>Executive summary preview</h2>
            </div>
            <p className="sample-report-summary">
              ACME Manufacturing has a medium migration readiness posture based on the evidence provided. The VMware
              inventory is usable for an initial assessment, but backup evidence, application dependency mapping and
              Proxmox target validation are missing or incomplete. Low-risk workloads may be candidates for a pilot,
              while SQL, ERP, domain controller and storage-heavy workloads require manual validation before entering a
              migration wave.
            </p>
          </article>
        </div>
      </section>

      <section className="section shiftreadiness-section">
        <div className="container">
          <div className="sample-report-score-grid">
            <article className="glass-card sample-report-score-card">
              <BarChart3 size={24} />
              <span>Migration Readiness Score</span>
              <strong>64/100</strong>
              <p>Medium readiness</p>
            </article>
            <article className="glass-card sample-report-score-card">
              <ShieldCheck size={24} />
              <span>Evidence Confidence Score</span>
              <strong>58/100</strong>
              <p>Limited evidence</p>
            </article>
            <article className="glass-card sample-report-score-note">
              <AlertTriangle size={22} />
              <p>
                A high readiness score with low confidence is not enough. ShiftReadiness separates migration posture
                from evidence completeness.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="section shiftreadiness-section shiftreadiness-section-alt">
        <div className="container sample-report-grid-stack">
          <TableBlock title="Evidence matrix" icon={<FileSpreadsheet size={22} />} headers={["Evidence", "Status", "Confidence"]} rows={evidenceRows} />
          <CardListBlock title="Top risks" icon={<AlertTriangle size={22} />} items={topRisks} />
          <TableBlock title="VM classification preview" icon={<Layers3 size={22} />} headers={["VM", "Role", "Complexity", "Action"]} rows={vmRows} />
        </div>
      </section>

      <section className="section shiftreadiness-section">
        <div className="container">
          <div className="shiftreadiness-section-heading">
            <div className="badge badge-cyan">Planning previews</div>
            <h2>Waves and sizing are planning inputs, not execution guarantees.</h2>
          </div>
          <div className="sample-report-planning-grid">
            <article className="glass-card sample-report-panel">
              <div className="sample-report-panel-title">
                <Waves size={22} />
                <h3>Migration waves preview</h3>
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
                <h3>Proxmox sizing preview</h3>
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
                Based on allocation, not historical performance. Add monitoring data for higher confidence.
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
              <h2>AI Advisory notes preview</h2>
            </div>
            <p>
              AI Advisory supports the assessment. It does not replace deterministic readiness and confidence scores.
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
              <h2>What this sample does not prove</h2>
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
            <div>
              <div className="badge badge-cyan">Assessment offer</div>
              <h2>Want to understand the full assessment?</h2>
              <p>
                The sample report shows the deliverable. The offer page explains how the assessment works, what evidence
                improves confidence and how to start with your own VMware environment.
              </p>
            </div>
            <Link href="/vmware-to-proxmox-readiness" className="btn btn-secondary">
              View the assessment offer
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      <section className="section shiftreadiness-section demo-final-cta">
        <div className="container">
          <div className="glass-card sr-final-card">
            <div>
              <div className="badge badge-cyan">Ready for your own evidence?</div>
              <h2>Ready to assess your own VMware environment?</h2>
              <p>Use the sample report to set expectations, then start a real readiness assessment with your own exported evidence.</p>
            </div>
            <div className="sr-final-actions">
              <Link href="/sign-up" className="btn btn-primary btn-glow">
                Start readiness assessment
                <ArrowRight size={18} />
              </Link>
              <Link href="/demo" className="btn btn-secondary">
                Watch the replay
                <Waves size={17} />
              </Link>
              <Link href="/contact" className="btn btn-secondary">
                Book readiness review
                <ShieldCheck size={17} />
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
  );
}

function TableBlock({
  title,
  icon,
  headers,
  rows,
}: {
  title: string;
  icon: ReactNode;
  headers: string[];
  rows: string[][];
}) {
  return (
    <article className="glass-card sample-report-panel">
      <div className="sample-report-panel-title">
        {icon}
        <h2>{title}</h2>
      </div>
      <div className="demo-table-wrap">
        <table className="demo-table">
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
                {row.map((cell) => (
                  <td key={cell}>{cell}</td>
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
  icon,
  items,
}: {
  title: string;
  icon: ReactNode;
  items: string[][];
}) {
  return (
    <article className="glass-card sample-report-panel">
      <div className="sample-report-panel-title">
        {icon}
        <h2>{title}</h2>
      </div>
      <div className="sample-report-risk-grid">
        {items.map(([label, severity]) => (
          <div key={label} className="sample-report-risk-card">
            <span>{severity}</span>
            <strong>{label}</strong>
          </div>
        ))}
      </div>
    </article>
  );
}
