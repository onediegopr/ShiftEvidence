import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  ArrowRight,
  Binary,
  CheckCircle2,
  ClipboardCheck,
  Eye,
  FileSearch,
  FileText,
  Gauge,
  Layers3,
  Lock,
  Network,
  Radar,
  Route,
  ShieldCheck,
  Waves,
} from "lucide-react";
import Footer from "../Footer";
import Navbar from "../Navbar";
import { marketingPlans } from "../../lib/pricingPlans";
import styles from "./GoogleAdsLandingV2.module.css";

const trustBadges = [
  "No agents",
  "No mandatory credentials",
  "No production access",
  "Starts with RVTools",
  "Executive + technical reports",
  "Senior-grade methodology",
];

const outputs: Array<[string, string, LucideIcon]> = [
  ["Migration Readiness Score", "A conservative signal for migration planning, not a go-live approval.", Gauge],
  ["Evidence Confidence Score", "Shows how much the assessment can prove with available inputs.", Eye],
  ["VM Risk Matrix", "Workload-level risk framing for snapshots, storage, sizing and unknowns.", Radar],
  ["Migration Waves", "Pilot, ready, remediate and hold groups for staged planning.", Waves],
  ["Pilot Candidates", "Lower-risk candidates surfaced for validation-first migration strategy.", Route],
  ["Executive Report", "Decision-ready summary for leadership and budget conversations.", FileText],
  ["Technical Findings", "Detailed blockers, gaps, assumptions and remediation notes.", FileSearch],
  ["Remediation Checklist", "What to validate before production workloads move.", ClipboardCheck],
];

const proofCards = [
  {
    label: "Demo Replay",
    title: "90-second guided flow",
    copy: "See how VMware evidence becomes a readiness decision pack without touching production.",
    href: "/demo/replay",
    cta: "Watch demo",
  },
  {
    label: "Demo Workspace",
    title: "Read-only synthetic assessment",
    copy: "Explore scenarios, risk signals and reports in a safe synthetic workspace.",
    href: "/demo/workspace",
    cta: "Explore workspace",
  },
  {
    label: "Sample Report",
    title: "Executive + technical output",
    copy: "Review the type of report buyers receive before sending private evidence.",
    href: "/sample-report",
    cta: "View report",
  },
];

const blockers = [
  "Hidden snapshots and stale VM signals",
  "Unclear backup or restore evidence",
  "Storage target assumptions not proven",
  "Network, HA and dependency unknowns",
  "No pilot group or migration order",
  "Executive pressure before technical confidence",
];

const broadcomDrivers = [
  "Licensing uncertainty",
  "Renewal cost pressure",
  "VMware exit strategy",
  "Infrastructure modernization",
  "MSP and consultant opportunity reviews",
];

const steps = [
  ["Upload or provide exported evidence", "Start with RVTools and add project context, backup, network, app or target evidence when available."],
  ["Get evidence-based risk analysis", "Shift Evidence separates confirmed findings, inferred risk and missing proof."],
  ["Decide pilot, remediate or blueprint", "Use readiness outputs to plan waves, blockers, review needs and next actions."],
];

const before = [
  "RVTools spreadsheets",
  "Hidden snapshots",
  "Unclear backup state",
  "Unknown workload criticality",
  "No migration order",
  "Unproven target assumptions",
];

const after = [
  "Readiness score",
  "Confidence score",
  "VM classification",
  "Migration waves",
  "Missing evidence checklist",
  "Executive + technical report",
];

const trustItems = [
  ["No agents", "The base path starts with exported evidence, not installed collectors."],
  ["No mandatory vCenter credentials", "Teams can begin with RVTools and approved files."],
  ["No production access required", "The lab page preserves the assessment-before-execution boundary."],
  ["Customer-controlled evidence", "Missing evidence stays visible instead of being guessed away."],
  ["Synthetic demos available", "Buyers can inspect output quality before private upload."],
  ["Optional collectors only where applicable", "Read-only collectors remain optional and scoped."],
];

const audiences = [
  ["IT Managers", "Need a defensible plan before approving a VMware exit."],
  ["Infrastructure Teams", "Need risk, blockers and sequencing before migration work starts."],
  ["MSPs", "Need repeatable client-ready assessments before workshops and proposals."],
  ["Proxmox Consultants", "Need a stronger discovery layer before architecture and implementation."],
];

const faqs = [
  [
    "Is this a migration tool?",
    "No. Shift Evidence is a readiness assessment and planning layer. It does not execute migrations or convert VMs.",
  ],
  [
    "Do you need access to vCenter?",
    "No mandatory vCenter access is required for the base workflow. The assessment can start with RVTools and approved exported evidence.",
  ],
  [
    "What if we only have RVTools?",
    "That is enough to start. Missing backup, network, application or target evidence becomes part of the confidence model.",
  ],
  [
    "What if we do not have Proxmox built yet?",
    "The report can still identify source-side risk and what target evidence should be validated before migration planning hardens.",
  ],
  [
    "Can MSPs use this with clients?",
    "Yes. The MSP path is designed for repeatable, client-ready readiness assessments and partner workflows.",
  ],
  [
    "How accurate is the assessment?",
    "Accuracy depends on evidence quality. The product separates confirmed facts, inferred risk and missing evidence instead of hiding uncertainty.",
  ],
  [
    "Does this replace a consultant?",
    "No. It can accelerate discovery, risk framing and reporting, but complex migrations may still need senior architecture and hands-on execution.",
  ],
  [
    "What happens after the assessment?",
    "Teams can choose a pilot, remediate blockers, request a technical review, build a migration blueprint or plan migration waves.",
  ],
];

function SectionHeader({ eyebrow, title, copy }: { eyebrow: string; title: string; copy?: string }) {
  return (
    <div className={styles.sectionHeader}>
      <span>{eyebrow}</span>
      <h2>{title}</h2>
      {copy ? <p>{copy}</p> : null}
    </div>
  );
}

export default function GoogleAdsLandingV2() {
  return (
    <>
      <div className={styles.labBanner}>LAB PREVIEW - Google Ads Landing V2. Not the live production landing.</div>
      <Navbar />
      <main className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.gridBackdrop} aria-hidden="true" />
          <div className={`container ${styles.heroGrid}`}>
            <div className={styles.heroCopy}>
              <span className={styles.kicker}>VMware to Proxmox Migration Readiness Assessment</span>
              <h1>Before leaving VMware, know what can break.</h1>
              <p className={styles.lead}>
                Analyze your VMware environment before migrating to Proxmox using exported evidence,
                starting with RVTools. Shift Evidence turns infrastructure signals, project context
                and storage evidence into a senior-grade migration decision pack.
              </p>
              <div className={styles.heroActions}>
                <Link href="/start" className={styles.primaryCta}>
                  Start Readiness Assessment
                  <ArrowRight size={18} />
                </Link>
                <Link href="/demo/replay" className={styles.secondaryCta}>
                  Watch 90-Second Demo
                </Link>
                <Link href="/sample-report" className={styles.secondaryCta}>
                  Download Sample Report
                </Link>
              </div>
              <div className={styles.badgeRail} aria-label="Trust badges">
                {trustBadges.map((badge) => (
                  <span key={badge}>
                    <ShieldCheck size={14} />
                    {badge}
                  </span>
                ))}
              </div>
            </div>

            <aside className={styles.commandPanel} aria-label="Readiness command center preview">
              <div className={styles.panelHeader}>
                <span>Assessment cockpit</span>
                <strong>Evidence live preview</strong>
              </div>
              <div className={styles.scoreCluster}>
                <div>
                  <small>Readiness</small>
                  <strong>64</strong>
                  <span>/100</span>
                </div>
                <div>
                  <small>Confidence</small>
                  <strong>58</strong>
                  <span>/100</span>
                </div>
              </div>
              <div className={styles.signalStack}>
                {[
                  ["RVTools inventory", "Received", "stable"],
                  ["Backup evidence", "Partial", "warn"],
                  ["Storage target", "Needs proof", "risk"],
                  ["Migration waves", "5 groups", "stable"],
                ].map(([label, value, tone]) => (
                  <div key={label} data-tone={tone}>
                    <span>{label}</span>
                    <strong>{value}</strong>
                  </div>
                ))}
              </div>
              <div className={styles.waveLine}>
                {["Pilot", "Wave 1", "Wave 2", "Remediate", "Hold"].map((wave) => (
                  <span key={wave}>{wave}</span>
                ))}
              </div>
            </aside>
          </div>
        </section>

        <section className={styles.outputSection}>
          <div className="container">
            <SectionHeader
              eyebrow="What you receive"
              title="A decision pack built for migration pressure."
              copy="The landing leads with outputs because Google Ads traffic needs to understand value fast."
            />
            <div className={styles.outputGrid}>
              {outputs.map(([title, copy, Icon]) => (
                <article key={title} className={styles.outputCard}>
                  <Icon size={22} />
                  <h3>{title}</h3>
                  <p>{copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.proofSection}>
          <div className={`container ${styles.proofGrid}`}>
            <div>
              <SectionHeader
                eyebrow="Visual proof"
                title="Preview the product before sending private evidence."
                copy="Use existing demos and sample outputs to evaluate the workflow safely."
              />
              <div className={styles.proofCards}>
                {proofCards.map((card) => (
                  <Link key={card.title} href={card.href} className={styles.proofCard}>
                    <span>{card.label}</span>
                    <h3>{card.title}</h3>
                    <p>{card.copy}</p>
                    <strong>
                      {card.cta}
                      <ArrowRight size={15} />
                    </strong>
                  </Link>
                ))}
              </div>
            </div>
            <aside className={styles.reportPreview}>
              <span>Sample decision pack</span>
              <h3>VMware to Proxmox Readiness</h3>
              <div className={styles.reportRows}>
                {["Risk summary", "VM matrix", "Storage readiness", "Advisor notes", "Migration waves"].map((row) => (
                  <div key={row}>
                    <FileText size={15} />
                    <span>{row}</span>
                  </div>
                ))}
              </div>
              <Link href="/sample-report">
                View sample report
                <ArrowRight size={15} />
              </Link>
            </aside>
          </div>
        </section>

        <section className={styles.painSection}>
          <div className={`container ${styles.painGrid}`}>
            <div>
              <span className={styles.kicker}>Do not migrate blind</span>
              <h2>Do not discover migration blockers during migration.</h2>
              <p>
                The hard part is not only importing VMs. The real risk lives in backup proof,
                storage fit, network mapping, HA expectations, workload dependencies and missing
                evidence nobody noticed until the migration window.
              </p>
            </div>
            <div className={styles.blockerGrid}>
              {blockers.map((blocker) => (
                <span key={blocker}>
                  <AlertTriangle size={15} />
                  {blocker}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.marketSection}>
          <div className="container">
            <SectionHeader
              eyebrow="Why now"
              title="Teams are evaluating Proxmox because the VMware path changed."
              copy="This section speaks to Broadcom-era urgency without making legal, financial or guaranteed-savings claims."
            />
            <div className={styles.marketGrid}>
              {broadcomDrivers.map((driver) => (
                <article key={driver}>
                  <Binary size={20} />
                  <h3>{driver}</h3>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.stepsSection}>
          <div className="container">
            <SectionHeader eyebrow="How it works" title="Three steps before production migration decisions." />
            <div className={styles.stepsGrid}>
              {steps.map(([title, copy], index) => (
                <article key={title}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <h3>{title}</h3>
                  <p>{copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.beforeAfterSection}>
          <div className={`container ${styles.beforeAfterGrid}`}>
            <article>
              <h2>Before</h2>
              <ul>
                {before.map((item) => (
                  <li key={item}>
                    <AlertTriangle size={15} />
                    {item}
                  </li>
                ))}
              </ul>
            </article>
            <article>
              <h2>After</h2>
              <ul>
                {after.map((item) => (
                  <li key={item}>
                    <CheckCircle2 size={15} />
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </section>

        <section className={styles.pricingSection}>
          <div className="container">
            <SectionHeader
              eyebrow="Pricing preview"
              title="Start with the level of confidence you need."
              copy="Uses current plan data and existing routes. No checkout, billing or payment logic was changed."
            />
            <div className={styles.pricingGrid}>
              {marketingPlans.map((plan) => (
                <article key={plan.id} className={styles.planCard} data-accent={plan.accent}>
                  <span>{plan.name}</span>
                  <strong>{plan.pricePrefix ? `${plan.pricePrefix} ${plan.price}` : plan.price}</strong>
                  <p>{plan.bestFor}</p>
                  <ul>
                    {plan.includes.slice(0, 4).map((item) => (
                      <li key={item}>
                        <CheckCircle2 size={14} />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Link href={plan.cta.href}>
                    {plan.cta.label}
                    <ArrowRight size={15} />
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.securitySection}>
          <div className={`container ${styles.securityGrid}`}>
            <div>
              <SectionHeader
                eyebrow="Security and trust"
                title="Built for assessment boundaries, not production access."
                copy="The page keeps the safety story explicit for search traffic evaluating a migration vendor."
              />
            </div>
            <div className={styles.trustGrid}>
              {trustItems.map(([title, copy]) => (
                <article key={title}>
                  <Lock size={18} />
                  <h3>{title}</h3>
                  <p>{copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.audienceSection}>
          <div className="container">
            <SectionHeader eyebrow="Who it is for" title="Built for teams that need proof before action." />
            <div className={styles.audienceGrid}>
              {audiences.map(([title, copy]) => (
                <article key={title}>
                  <Layers3 size={20} />
                  <h3>{title}</h3>
                  <p>{copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.faqSection}>
          <div className="container">
            <SectionHeader eyebrow="Commercial FAQ" title="Fast answers for high-intent visitors." />
            <div className={styles.faqGrid}>
              {faqs.map(([question, answer]) => (
                <article key={question}>
                  <h3>{question}</h3>
                  <p>{answer}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.finalCta}>
          <div className="container">
            <Network size={30} />
            <h2>Do not discover migration problems during migration.</h2>
            <p>Start with exported VMware evidence. Leave with risk signals, confidence gaps and a migration decision path.</p>
            <div className={styles.heroActions}>
              <Link href="/start" className={styles.primaryCta}>
                Start Readiness Assessment
                <ArrowRight size={18} />
              </Link>
              <Link href="/sample-report" className={styles.secondaryCta}>
                Download Sample Report
              </Link>
              <Link href="/demo/replay" className={styles.secondaryCta}>
                Watch Demo
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
