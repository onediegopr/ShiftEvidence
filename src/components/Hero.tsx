import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Download,
  Eye,
  FileText,
  LockKeyhole,
  MessageCircleQuestion,
  ServerCog,
  Shield,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  UsersRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { HeroEvidenceSnapshot } from "./heroSnapshot/HeroEvidenceSnapshot";
import { trustBadges } from "./heroSnapshot/HeroSnapshotData";
import styles from "./Hero.module.css";

interface HeroProps {
  onOpenScanner: () => void;
}

const trustBadgeIcons: Record<string, LucideIcon> = {
  "Former VMware TAM-led readiness methodology": Shield,
  "No agents": ServerCog,
  "No mandatory credentials": LockKeyhole,
  "No production access": ShieldCheck,
  "Starts with RVTools + senior context": UploadCloud,
  "Evidence-based scoring": BarChart3,
  "Guided questions and AI-assisted review": MessageCircleQuestion,
  "Built for companies, MSPs and Proxmox consultants": UsersRound,
};

const heroProofPoints = [
  { label: "RVTools starts it", value: "Senior context completes it" },
  { label: "Evidence confidence", value: "64 / 100, gaps visible" },
  { label: "Decision output", value: "Conditional Go, not guesswork" },
];

export default function Hero({ onOpenScanner }: HeroProps) {
  void onOpenScanner;

  return (
    <section className={styles.homeHero} aria-labelledby="home-hero-title">
      <div className={styles.heroAtmosphere} aria-hidden="true" />
      <div className={styles.heroGrid}>
        <div className={styles.copyColumn}>
          <div className={styles.routePill} aria-label="VMware to Proxmox Readiness Assessment">
            <Sparkles size={16} />
            <span>VMware -&gt; Proxmox Readiness Assessment</span>
          </div>

          <h1 id="home-hero-title">Senior-grade migration readiness before touching production.</h1>
          <p className={styles.supportingLine}>Before migrating VMware to Proxmox, know what can break.</p>
          <p className={styles.subheadline}>
            Shift Evidence turns RVTools inventory, storage destination evidence and project context into a VMware -&gt; Proxmox readiness decision pack:
            risk signals, evidence confidence, storage readiness, migration waves, reports and a contextual Senior Migration Advisor.
          </p>

          <div className={styles.trustGrid} aria-label="Shift Evidence trust and differentiation points">
            {trustBadges.map((badge) => {
              const Icon = trustBadgeIcons[badge] ?? BadgeCheck;
              return (
                <span key={badge}>
                  <Icon size={14} />
                  {badge}
                </span>
              );
            })}
          </div>

          <div className={styles.actionRow} aria-label="Primary Shift Evidence actions">
            <Link href="/start" className={styles.primaryAction}>
              Start readiness assessment
              <ArrowRight size={18} />
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

          <div className={styles.proofStrip} aria-label="Readiness proof points">
            {heroProofPoints.map((item) => (
              <article key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </article>
            ))}
          </div>
        </div>

        <div className={styles.visualColumn}>
          <div className={styles.visualHeader}>
            <span>
              <FileText size={15} />
              Hero Evidence Snapshot
            </span>
            <strong>VMware source evidence -&gt; Proxmox migration decision pack</strong>
          </div>
          <HeroEvidenceSnapshot compactMobile />
        </div>
      </div>
    </section>
  );
}
