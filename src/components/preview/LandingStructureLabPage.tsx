import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Cpu,
  Database,
  FileText,
  Layers3,
  Lock,
  MessageCircleQuestion,
  Network,
  SearchCheck,
  Server,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  Waves,
} from "lucide-react";
import Footer from "../Footer";
import Navbar from "../Navbar";
import { marketingPlans } from "../../lib/pricingPlans";

const trustBadges = [
  "No agents",
  "No mandatory credentials",
  "No production access",
  "Starts with RVTools + senior context",
  "Evidence-based scoring",
  "Guided questions and AI-assisted review",
  "Built for companies, MSPs and Proxmox consultants",
];

const heroMetrics = [
  ["Evidence received", "RVTools baseline"],
  ["VMs detected", "126"],
  ["Readiness Score", "64/100"],
  ["Evidence Confidence", "58/100"],
  ["Snapshots detected", "19"],
  ["Migration waves", "5"],
  ["Executive report", "Ready"],
];

const heroAdvisorPoints: Array<{ title: string; copy: string; Icon: LucideIcon }> = [
  {
    title: "Senior discovery",
    copy: "Guided questions capture business, app, backup and migration constraints that RVTools alone cannot know.",
    Icon: MessageCircleQuestion,
  },
  {
    title: "AI-assisted analysis",
    copy: "The platform cross-checks raw evidence, missing signals and risk patterns before producing recommendations.",
    Icon: BrainCircuit,
  },
  {
    title: "Human-grade output",
    copy: "The result feels closer to a senior consultant workshop than a spreadsheet conversion.",
    Icon: Sparkles,
  },
];

const heroSignalRows = [
  ["Discovery questions", "18 answered", "cyan"],
  ["AI cross-checks", "42 signals", "amber"],
  ["Advisor notes", "9 findings", "green"],
];

const tourSteps: Array<{ title: string; copy: string; Icon: LucideIcon }> = [
  {
    title: "Evidence upload",
    copy: "Start with approved VMware evidence and optional context packs.",
    Icon: UploadCloud,
  },
  {
    title: "Inventory detected",
    copy: "Translate raw exports into a readable estate overview.",
    Icon: Server,
  },
  {
    title: "Risk scoring",
    copy: "Classify workload risk before migration assumptions harden.",
    Icon: AlertTriangle,
  },
  {
    title: "Evidence confidence",
    copy: "Separate confirmed findings from missing or partial evidence.",
    Icon: ShieldCheck,
  },
  {
    title: "Migration waves",
    copy: "Group workloads by readiness, blockers and validation needs.",
    Icon: Waves,
  },
  {
    title: "Executive report",
    copy: "Show technical and business stakeholders the same decision pack.",
    Icon: FileText,
  },
];

const explorePaths: Array<{
  title: string;
  copy: string;
  cta: string;
  href: string;
  Icon: LucideIcon;
}> = [
  {
    title: "Take the Product Tour",
    copy: "For visitors who want the fastest explanation of how evidence becomes a decision pack.",
    cta: "Take the Tour",
    href: "/demo/replay",
    Icon: Sparkles,
  },
  {
    title: "Explore Demo Workspace",
    copy: "For technical users who want a deeper read-only walkthrough with synthetic assessments.",
    cta: "Explore Workspace",
    href: "/demo/workspace",
    Icon: Layers3,
  },
  {
    title: "View Sample Report",
    copy: "For buyers who want to judge output quality before uploading their own evidence.",
    cta: "View Sample Report",
    href: "/sample-report",
    Icon: FileText,
  },
  {
    title: "Start with RVTools",
    copy: "For teams ready to begin with their own inventory export and approved context.",
    cta: "Start Free Check",
    href: "/sign-up",
    Icon: UploadCloud,
  },
  {
    title: "View Pricing",
    copy: "For teams comparing Starter, Professional, Blueprint and MSP options.",
    cta: "View Pricing",
    href: "/pricing",
    Icon: ClipboardCheck,
  },
];

const howItWorks = [
  ["Upload evidence", "Start from RVTools and add backup, network, application or target context when available."],
  ["Validate evidence quality", "Surface missing inputs instead of hiding uncertainty inside the result."],
  ["Analyze risk", "Classify workloads, snapshots, storage pressure and technical blockers."],
  ["Generate migration plan", "Build waves, sizing signals and recommended next actions."],
  ["Decide next action", "Use the report for a pilot, blueprint, budget decision or deeper review."],
];

const deliverables: Array<{ title: string; copy: string; Icon: LucideIcon }> = [
  {
    title: "Executive Decision Report",
    copy: "Boardroom-ready summary of readiness, cost exposure, confidence and migration posture.",
    Icon: FileText,
  },
  {
    title: "Technical Assessment",
    copy: "VM risk matrix, inventory findings, snapshots, storage signals and missing evidence.",
    Icon: SearchCheck,
  },
  {
    title: "Proxmox Target Blueprint",
    copy: "Sizing, target assumptions and destination-readiness signals for planning conversations.",
    Icon: Database,
  },
  {
    title: "Migration Wave Plan",
    copy: "Pilot candidates, hold groups, remediation tasks and workload sequencing.",
    Icon: Waves,
  },
  {
    title: "Senior Advisor Notes",
    copy: "Evidence-bound advisory notes that explain what to validate before production moves.",
    Icon: Sparkles,
  },
];

const evidenceRows = [
  ["VMware inventory", "RVTools", "VM classification, snapshots, storage and network signals"],
  ["Backup", "Veeam / CSV", "Backup gaps and restore-readiness context"],
  ["Proxmox target", "API / export / checklist", "Destination readiness and sizing validation"],
  ["Applications", "Form / CSV", "Criticality, dependencies and owners"],
  ["Network", "CSV / NetBox / diagram", "VLAN mapping and migration complexity"],
];

const beforeItems = [
  "RVTools with thousands of rows",
  "Unknown workload criticality",
  "Hidden snapshots",
  "Storage risk buried in tabs",
  "Network mapping unclear",
  "No migration order",
];

const afterItems = [
  "Readiness score",
  "Evidence confidence score",
  "VM risk matrix",
  "Proxmox target sizing",
  "Missing evidence checklist",
  "Migration waves",
  "Executive and technical reports",
];

const faqs = [
  [
    "Is this a migration tool?",
    "No. Shift Evidence helps teams understand readiness, risk and evidence quality before migration execution.",
  ],
  [
    "Do you need access to vCenter?",
    "No mandatory vCenter access is required for the initial path. The assessment can start from RVTools and approved evidence exports.",
  ],
  [
    "Do you touch production?",
    "No. The assessment path is designed around evidence review, scoring and reporting. It does not change production systems.",
  ],
  [
    "What if I only have RVTools?",
    "That is enough to start. Missing backup, network, application or target evidence becomes part of the confidence model.",
  ],
  [
    "Can MSPs use it with clients?",
    "Yes. The MSP path is designed for repeatable client-ready assessment workflows and reviewed business onboarding.",
  ],
  [
    "Can this replace a consultant?",
    "It can replace or accelerate the repetitive discovery, analysis and reporting layer. Complex migrations may still require senior human judgment, pilot testing, architecture decisions and hands-on execution.",
  ],
];

function SectionHeading({
  eyebrow,
  title,
  copy,
}: {
  eyebrow: string;
  title: string;
  copy?: string;
}) {
  return (
    <div className="landing-lab-section-heading">
      <span>{eyebrow}</span>
      <h2>{title}</h2>
      {copy ? <p>{copy}</p> : null}
    </div>
  );
}

export default function LandingStructureLabPage() {
  return (
    <>
      <div className="landing-lab-banner" role="status">
        LAB PREVIEW - Landing structure v1. Not the live homepage.
      </div>
      <Navbar />

      <main className="landing-lab-page">
        <section className="landing-lab-hero" aria-labelledby="landing-lab-hero-title">
          <div className="container landing-lab-hero-grid">
            <div className="landing-lab-hero-copy">
              <span className="landing-lab-kicker">VMware to Proxmox Migration Readiness</span>
              <h1 id="landing-lab-hero-title">Know what can break before the VMware exit.</h1>
              <p className="landing-lab-lead">
                Shift Evidence turns VMware evidence into a senior-grade Proxmox migration assessment:
                guided discovery, AI-assisted risk analysis, VM classification, sizing signals, migration
                waves and executive-ready reports.
              </p>
              <p className="landing-lab-microcopy">
                RVTools is only the starting point. The real value is the consultative layer around it:
                questions, context, evidence quality, assumptions and recommendations a real migration
                advisor would want before production moves.
              </p>

              <div className="landing-lab-advisor-strip" aria-label="Senior advisory layer">
                {heroAdvisorPoints.map(({ title, copy, Icon }) => (
                  <article key={title}>
                    <Icon size={18} />
                    <div>
                      <strong>{title}</strong>
                      <span>{copy}</span>
                    </div>
                  </article>
                ))}
              </div>

              <div className="landing-lab-trust-badges" aria-label="Trust signals">
                {trustBadges.map((badge) => (
                  <span key={badge}>
                    <ShieldCheck size={14} />
                    {badge}
                  </span>
                ))}
              </div>

              <div className="landing-lab-actions">
                <Link href="/demo/replay" className="btn btn-primary btn-glow" aria-label="Take the Product Tour">
                  Take the Product Tour
                  <ArrowRight size={18} />
                </Link>
                <Link href="/sample-report" className="btn btn-secondary">
                  View Sample Report
                </Link>
                <Link href="/sign-up" className="landing-lab-text-link">
                  Start with RVTools + guided context
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>

            <aside className="landing-lab-product-preview" aria-label="Animated product UI lab placeholder">
              <div className="landing-lab-orbit" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
              <div className="landing-lab-preview-top">
                <span>Assessment cockpit preview</span>
                <strong>Motion lab concept</strong>
              </div>
              <div className="landing-lab-live-rail" aria-label="Consulting workflow signals">
                {heroSignalRows.map(([label, value, tone], index) => (
                  <div key={label} className={`landing-lab-signal landing-lab-signal-${tone}`} style={{ animationDelay: `${index * 0.28}s` }}>
                    <span />
                    <div>
                      <strong>{label}</strong>
                      <small>{value}</small>
                    </div>
                  </div>
                ))}
              </div>
              <div className="landing-lab-score-panel">
                <div>
                  <Clock3 size={16} />
                  <span>Readiness</span>
                  <strong>64/100</strong>
                </div>
                <div>
                  <Activity size={16} />
                  <span>Confidence</span>
                  <strong>58/100</strong>
                </div>
              </div>
              <div className="landing-lab-metric-grid">
                {heroMetrics.map(([label, value]) => (
                  <div key={label}>
                    <span>{label}</span>
                    <strong>{value}</strong>
                  </div>
                ))}
              </div>
              <div className="landing-lab-consulting-console" aria-label="Senior consulting layer preview">
                <div>
                  <Cpu size={17} />
                  <span>AI model flags missing backup evidence and snapshot exposure.</span>
                </div>
                <div>
                  <MessageCircleQuestion size={17} />
                  <span>Advisor prompts: criticality, RTO, app owner and wave constraints.</span>
                </div>
              </div>
              <div className="landing-lab-wave-strip" aria-label="Migration wave preview">
                {["Wave 0", "Wave 1", "Wave 2", "Hold", "Report"].map((wave, index) => (
                  <span key={wave} style={{ animationDelay: `${index * 0.12}s` }}>
                    {wave}
                  </span>
                ))}
              </div>
            </aside>
          </div>
        </section>

        <section className="landing-lab-trust-strip" aria-label="Compact trust strip">
          <div className="container">
            <span>RVTools-based assessment</span>
            <span>No agents</span>
            <span>No mandatory vCenter access</span>
            <span>No production changes</span>
            <span>Evidence gaps shown explicitly</span>
          </div>
        </section>

        <section className="landing-lab-section">
          <div className="container">
            <SectionHeading
              eyebrow="Guided tour"
              title="What you will see in 90 seconds"
              copy="A fast path for understanding the product before opening the deeper Demo Workspace."
            />
            <div className="landing-lab-step-grid">
              {tourSteps.map(({ title, copy, Icon }) => (
                <article key={title} className="landing-lab-step-card">
                  <Icon size={20} />
                  <h3>{title}</h3>
                  <p>{copy}</p>
                </article>
              ))}
            </div>
            <div className="landing-lab-centered-action">
              <Link href="/demo/replay" className="btn btn-primary btn-glow">
                Take the Product Tour
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </section>

        <section className="landing-lab-problem">
          <div className="container landing-lab-problem-grid">
            <div>
              <span className="landing-lab-kicker">The real migration question</span>
              <h2>VMware exits fail when teams migrate inventory instead of risk.</h2>
            </div>
            <p>
              Most migration projects start with the wrong question: "Can we import the VM?" The real
              question is: which workloads are safe, which are risky, what evidence is missing, and what
              must be prepared in Proxmox before production moves?
            </p>
          </div>
        </section>

        <section className="landing-lab-section">
          <div className="container">
            <SectionHeading
              eyebrow="Choose your path"
              title="Explore by confidence level"
              copy="Different buyers need different proof before they start. This lab version makes those paths explicit."
            />
            <div className="landing-lab-path-grid">
              {explorePaths.map(({ title, copy, cta, href, Icon }) => (
                <article key={title} className="landing-lab-path-card">
                  <Icon size={22} />
                  <h3>{title}</h3>
                  <p>{copy}</p>
                  <Link href={href}>
                    {cta}
                    <ArrowRight size={15} />
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-lab-section landing-lab-section-alt">
          <div className="container">
            <SectionHeading
              eyebrow="How it works"
              title="From VMware evidence to Proxmox migration decisions."
            />
            <div className="landing-lab-process">
              {howItWorks.map(([title, copy], index) => (
                <article key={title}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <h3>{title}</h3>
                  <p>{copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-lab-section">
          <div className="container">
            <SectionHeading
              eyebrow="Decision pack"
              title="What you receive"
              copy="A tighter grouping of the strongest deliverables from the current landing."
            />
            <div className="landing-lab-deliverable-grid">
              {deliverables.map(({ title, copy, Icon }) => (
                <article key={title} className="landing-lab-deliverable-card">
                  <Icon size={22} />
                  <h3>{title}</h3>
                  <p>{copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-lab-evidence">
          <div className="container landing-lab-evidence-grid">
            <div>
              <span className="landing-lab-kicker">Evidence-based, not magic</span>
              <h2>Evidence-based. Transparent. Conservative.</h2>
              <p>
                We do not pretend to know what the evidence does not prove. Every assessment separates
                confirmed findings, probable risks and missing information.
              </p>
              <strong>Missing evidence becomes part of the report - not a hidden weakness.</strong>
            </div>
            <div className="landing-lab-evidence-table" role="table" aria-label="Evidence sources and outcomes">
              {evidenceRows.map(([source, format, outcome]) => (
                <div key={source} role="row">
                  <span role="cell">{source}</span>
                  <span role="cell">{format}</span>
                  <strong role="cell">{outcome}</strong>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-lab-section">
          <div className="container">
            <SectionHeading eyebrow="Before / After" title="From spreadsheet chaos to migration clarity." />
            <div className="landing-lab-before-after">
              <article>
                <h3>Before</h3>
                <ul>
                  {beforeItems.map((item) => (
                    <li key={item}>
                      <AlertTriangle size={15} />
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
              <article>
                <h3>After</h3>
                <ul>
                  {afterItems.map((item) => (
                    <li key={item}>
                      <CheckCircle2 size={15} />
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            </div>
          </div>
        </section>

        <section className="landing-lab-sample-report">
          <div className="container landing-lab-sample-grid">
            <div>
              <span className="landing-lab-kicker">Sample output</span>
              <h2>See the report before starting your own assessment.</h2>
              <p>
                Review a synthetic but methodology-real sample report showing scores, risks, evidence gaps,
                migration waves and executive-level output.
              </p>
              <div className="landing-lab-actions">
                <Link href="/sample-report" className="btn btn-primary btn-glow">
                  View Sample Report
                  <ArrowRight size={18} />
                </Link>
                <Link href="/demo/workspace" className="btn btn-secondary">
                  Explore Demo Workspace
                </Link>
              </div>
            </div>
            <aside className="landing-lab-report-cover" aria-label="Sample report preview">
              <span>Premium synthetic sample</span>
              <h3>VMware -&gt; Proxmox Migration Readiness</h3>
              <div>
                <strong>64/100</strong>
                <small>Readiness score</small>
              </div>
              <div>
                <strong>23 pages</strong>
                <small>Executive and technical report</small>
              </div>
            </aside>
          </div>
        </section>

        <section className="landing-lab-section landing-lab-section-alt">
          <div className="container">
            <SectionHeading
              eyebrow="Pricing preview"
              title="Choose the decision depth you need"
              copy="This preview reuses existing plan data and existing safe routes. It does not touch checkout or billing logic."
            />
            <div className="landing-lab-pricing-grid">
              {marketingPlans.map((plan) => (
                <article key={plan.id} className={`landing-lab-pricing-card landing-lab-plan-${plan.accent}`}>
                  <span>{plan.name}</span>
                  <strong>{plan.price}</strong>
                  <p>{plan.bestFor}</p>
                  <div>
                    <h3>Includes</h3>
                    <ul>
                      {plan.includes.slice(0, 4).map((item) => (
                        <li key={item}>
                          <CheckCircle2 size={14} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3>Does not include</h3>
                    <ul>
                      {plan.excludes.slice(0, 3).map((item) => (
                        <li key={item}>
                          <Lock size={14} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Link href={plan.cta.href} className="btn btn-secondary">
                    {plan.cta.label}
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-lab-section">
          <div className="container">
            <SectionHeading eyebrow="Essential FAQ" title="The objections that matter first" />
            <div className="landing-lab-faq-grid">
              {faqs.map(([question, answer]) => (
                <article key={question}>
                  <h3>{question}</h3>
                  <p>{answer}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-lab-final-cta">
          <div className="container">
            <Network size={28} />
            <h2>Know what can break before production moves.</h2>
            <div className="landing-lab-actions landing-lab-final-actions">
              <Link href="/demo/replay" className="btn btn-primary btn-glow">
                Take the Product Tour
                <ArrowRight size={18} />
              </Link>
              <Link href="/sample-report" className="btn btn-secondary">
                View Sample Report
              </Link>
              <Link href="/sign-up" className="landing-lab-text-link">
                Start with RVTools + guided context
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
