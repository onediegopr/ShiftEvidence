import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Database,
  FileSpreadsheet,
  FileText,
  Layers3,
  Network,
  Server,
  ShieldCheck,
} from "lucide-react";
import {
  advisorNotes,
  confidenceGaps,
  contextCards,
  decisionPackSections,
  evidenceBadges,
  migrationWaves,
  riskSignals,
  snapshotMetrics,
} from "./HeroSnapshotData";
import styles from "./HeroSnapshot.module.css";

type HeroEvidenceSnapshotProps = {
  captureMode?: boolean;
  compactMobile?: boolean;
};

export function HeroEvidenceSnapshot({ captureMode = false, compactMobile = false }: HeroEvidenceSnapshotProps) {
  return (
    <div
      className={`${captureMode ? styles.captureFrame : styles.snapshotFrame} ${compactMobile ? styles.compactMobileFrame : ""}`}
      aria-label="Hero Evidence Snapshot animated product visual"
    >
      <div className={styles.snapshotGlow} aria-hidden="true" />
      <div className={styles.infrastructureMap} aria-hidden="true">
        <span className={styles.sourceNode}>VMware source</span>
        <span className={styles.inventoryNode}>VM inventory</span>
        <span className={styles.storageNode}>Storage</span>
        <span className={styles.networkNode}>Network</span>
        <span className={styles.targetNode}>Proxmox target</span>
      </div>

      <article className={styles.fileCard}>
        <div>
          <FileSpreadsheet size={18} />
          <span>RVTools Inventory</span>
        </div>
        <strong>rvtools_export_northbridge_industrial.xlsx</strong>
        <div className={styles.badgeRow}>
          {evidenceBadges.map((badge) => (
            <em key={badge}>{badge}</em>
          ))}
        </div>
      </article>

      <article className={styles.consoleCard}>
        <div className={styles.consoleHeader}>
          <span>Migration Readiness Snapshot</span>
          <strong>Conditional Go</strong>
        </div>
        <div className={styles.customerBlock}>
          <span>Northbridge Industrial Group</span>
          <small>rvtools_export_northbridge_industrial.xlsx</small>
        </div>
        <div className={styles.metricGrid}>
          {snapshotMetrics.map((metric) => (
            <div key={metric.label}>
              <strong>{metric.value}</strong>
              <span>{metric.label}</span>
            </div>
          ))}
        </div>
        <div className={styles.scoreStack}>
          <ScoreRow label="Readiness" value={68} tone="cyan" />
          <ScoreRow label="Evidence Confidence" value={64} tone="teal" />
        </div>
      </article>

      <section className={styles.contextCluster} aria-label="Context evidence cards">
        {contextCards.map((card, index) => {
          const Icon = index === 0 ? FileText : index === 1 ? Database : index === 2 ? Layers3 : ShieldCheck;
          return (
            <article key={card.title}>
              <Icon size={15} />
              <div>
                <strong>{card.title}</strong>
                <span>{card.file}</span>
                <small>{card.detail}</small>
              </div>
            </article>
          );
        })}
      </section>

      <article className={styles.riskPanel}>
        <div className={styles.panelTitle}>
          <AlertTriangle size={16} />
          <span>Risk signals</span>
          <strong>21 detected</strong>
        </div>
        {riskSignals.map((risk) => (
          <div key={risk.label} className={styles.riskRow}>
            <span>{risk.label}</span>
            <em>{risk.severity}</em>
          </div>
        ))}
      </article>

      <article className={styles.confidencePanel}>
        <span>Evidence Confidence</span>
        <strong>64 / 100</strong>
        <div className={styles.confidenceRing} aria-hidden="true"><i /></div>
        <ul>
          {confidenceGaps.map((gap) => (
            <li key={gap}>{gap}</li>
          ))}
        </ul>
        <small>Confidence adjusted</small>
      </article>

      <article className={styles.advisorCard}>
        <div>
          <ClipboardCheck size={17} />
          <span>Senior Migration Advisor</span>
        </div>
        <strong>Former VMware TAM-led methodology</strong>
        <ul>
          {advisorNotes.map((note) => (
            <li key={note}>
              <CheckCircle2 size={13} />
              {note}
            </li>
          ))}
        </ul>
      </article>

      <section className={styles.waveTimeline} aria-label="Migration waves mini timeline">
        {migrationWaves.map((wave, index) => (
          <div key={wave.label}>
            <span>{wave.label}</span>
            <small>{wave.detail}</small>
            {index < migrationWaves.length - 1 ? <ArrowRight size={13} aria-hidden="true" /> : null}
          </div>
        ))}
        <div className={styles.vmDots} aria-hidden="true">
          {Array.from({ length: 10 }).map((_, index) => (
            <i key={index} />
          ))}
        </div>
      </section>

      <article className={styles.reportSheet}>
        <div>
          <FileText size={17} />
          <span>Decision Pack</span>
          <strong>Report ready</strong>
        </div>
        {decisionPackSections.map((section) => (
          <p key={section}>{section}</p>
        ))}
      </article>

      <div className={styles.finalMessage}>
        <Server size={17} />
        <span>Do not migrate blind</span>
        <Network size={17} />
      </div>
    </div>
  );
}

function ScoreRow({ label, value, tone }: { label: string; value: number; tone: "cyan" | "teal" }) {
  return (
    <div className={styles.scoreRow}>
      <span>{label}</span>
      <strong>{value} / 100</strong>
      <i className={styles[tone]} style={{ width: `${value}%` }} />
    </div>
  );
}
