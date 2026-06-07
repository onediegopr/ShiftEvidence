import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Download,
  Eye,
  FileText,
  Lock,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { HeroEvidenceSnapshot } from "../heroSnapshot/HeroEvidenceSnapshot";
import { trustBadges } from "../heroSnapshot/HeroSnapshotData";
import styles from "../heroSnapshot/HeroSnapshot.module.css";

type HeroLabPageProps = {
  captureMode?: boolean;
};

export function HeroLabPage({ captureMode = false }: HeroLabPageProps) {
  if (captureMode) {
    return (
      <main className={styles.capturePage} data-capture-mode="true">
        <HeroEvidenceSnapshot captureMode />
      </main>
    );
  }

  return (
    <main className={styles.page} data-capture-mode="false">
      <div className={styles.atmosphere} aria-hidden="true" />

      <header className={styles.labHeader}>
        <div>
          <span>Hero Lab Preview</span>
          <strong>Landing hero visual prototype</strong>
        </div>
        <Link href="/laboratorio" className={styles.labLink}>
          Back to readiness lab
        </Link>
      </header>

      <section className={styles.heroShell} aria-labelledby="hero-lab-title">
        <div className={styles.copyPanel}>
          <div className={styles.eyebrow}>
            <Sparkles size={16} />
            <span>VMware -&gt; Proxmox Readiness Assessment</span>
          </div>

          <h1 id="hero-lab-title">Senior-grade migration readiness before touching production.</h1>
          <p className={styles.supportingLine}>Before migrating VMware to Proxmox, know what can break.</p>
          <p className={styles.subheadline}>
            Shift Evidence turns RVTools inventory, storage destination evidence and project context into a VMware -&gt; Proxmox readiness decision pack:
            risk signals, evidence confidence, storage readiness, migration waves, reports and a contextual Senior Migration Advisor.
          </p>

          <div className={styles.trustGrid} aria-label="Trust and differentiation points">
            {trustBadges.map((badge, index) => {
              const Icon = index % 3 === 0 ? ShieldCheck : index % 3 === 1 ? Lock : BadgeCheck;
              return (
                <span key={badge}>
                  <Icon size={14} />
                  {badge}
                </span>
              );
            })}
          </div>

          <div className={styles.actions} aria-label="Hero actions">
            <Link href="/start" className={styles.primaryAction}>
              Start readiness assessment
              <ArrowRight size={17} />
            </Link>
            <Link href="/demo/replay" className={styles.secondaryAction}>
              <Eye size={17} />
              Watch the replay
            </Link>
            <Link href="/sample-report" className={styles.secondaryAction}>
              <Download size={17} />
              Download sample report
            </Link>
          </div>
        </div>

        <div className={styles.visualPanel}>
          <div className={styles.visualIntro}>
            <span>
              <FileText size={15} />
              Hero Evidence Snapshot
            </span>
            <strong>Short commercial snapshot, not a full replay demo.</strong>
          </div>
          <HeroEvidenceSnapshot />
        </div>
      </section>
    </main>
  );
}
