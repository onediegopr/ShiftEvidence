import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  Database,
  Eye,
  FileSearch,
  Handshake,
  Layers3,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

export const metadata: Metadata = {
  title: "About Shift Evidence",
  description:
    "Learn how Shift Evidence applies former VMware TAM-led readiness methodology to VMware to Proxmox migration planning and evidence-based decision support.",
  alternates: {
    canonical: "https://shiftevidence.com/about",
  },
};

const trustSignals = [
  "No agents required",
  "No mandatory credentials",
  "No production access",
  "Evidence-based scoring",
];

const operatingCards = [
  {
    Icon: Database,
    eyebrow: "Evidence first",
    title: "Structured infrastructure review",
    copy:
      "We start with RVTools, add senior context and surface the signals that matter for readiness, confidence, storage fit and migration risk.",
  },
  {
    Icon: ShieldCheck,
    eyebrow: "Private by design",
    title: "Customer boundaries stay intact",
    copy:
      "Workspace and assessment scope remain separated. We do not treat one customer's evidence as reusable learning for another client.",
  },
  {
    Icon: FileSearch,
    eyebrow: "Decision support",
    title: "Assessment before execution",
    copy:
      "Shift Evidence is designed to help teams qualify what looks ready, what needs validation and what should not move yet.",
  },
];

const expertiseAreas = [
  "Environment Assessment & Modernization Readiness",
  "Platform Migration & Transformation",
  "Virtualization & High Availability Architectures",
  "Enterprise Networking & Critical Connectivity",
  "Storage, Resilience & Operational Continuity",
  "Critical Applications, Modernization & Development",
  "Crisis and Major Incident Management",
  "Enterprise Architecture & Strategic Planning",
  "Cost Optimization & Operational Efficiency",
  "Mentoring and Technical Talent Development",
];

const methodologyPrinciples = ["Evidence first", "Risk before execution", "Decision-ready outputs"];

const methodologySteps = [
  {
    number: "01",
    title: "Capture the usable baseline",
    copy:
      "Inventory, snapshots, datastore signals and selected context are organized into a bounded readiness workspace.",
  },
  {
    number: "02",
    title: "Separate readiness from confidence",
    copy:
      "We score what the evidence supports today while clearly showing where missing inputs reduce confidence.",
  },
  {
    number: "03",
    title: "Translate signals into blockers and waves",
    copy:
      "Storage, backup, network and workload constraints become decision-quality findings instead of hidden assumptions.",
  },
  {
    number: "04",
    title: "Produce a migration decision pack",
    copy:
      "The output feels closer to a senior workshop than a parser: risk framing, priorities, next actions and blueprint-ready planning cues.",
  },
];

const audienceCards = [
  {
    Icon: Building2,
    title: "Companies under VMware pressure",
    copy:
      "For internal teams that need a faster, safer way to understand what can move, what needs more proof and what should stay blocked.",
  },
  {
    Icon: Handshake,
    title: "MSPs and delivery partners",
    copy:
      "For service providers that need a client-ready deliverable before quoting or scoping a Proxmox engagement.",
  },
  {
    Icon: Layers3,
    title: "Proxmox consultants",
    copy:
      "For specialists who want a structured front-end assessment layer before architecture, wave planning and remediation work.",
  },
];

const includedList = [
  "Assessment workspace and evidence intake.",
  "Readiness, cost, licensing and infrastructure context review.",
  "Senior Advisor guidance tied to the assessment context.",
  "Structured outputs for risk review, wave logic and next-step decisions.",
];

const excludedList = [
  "Live migration execution or emergency incident response.",
  "Formal vendor certification or endorsement.",
  "Zero-downtime guarantees or automated migration claims.",
  "Support requests containing secrets, credentials or raw private files.",
];

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="about-page">
        <section className="section about-hero-section">
          <div className="container">
            <div className="about-hero-shell">
              <div className="about-hero-copy">
                <span className="badge badge-cyan">About Shift Evidence</span>
                <div className="about-hero-route">
                  <span>VMware</span>
                  <ArrowRight size={16} />
                  <span>Proxmox</span>
                </div>
                <h1>Independent migration readiness review before anyone touches production.</h1>
                <p className="about-hero-lead">
                  Shift Evidence helps technical leaders, MSPs and Proxmox delivery partners turn
                  migration pressure into a controlled evidence review, a senior-grade decision
                  pack and a clearer blueprint for what happens next.
                </p>
                <div className="about-trust-strip">
                  {trustSignals.map((signal) => (
                    <span key={signal}>
                      <CheckCircle2 size={15} />
                      {signal}
                    </span>
                  ))}
                </div>
                <div className="about-hero-actions">
                  <Link href="/sample-report" className="btn btn-primary btn-glow">
                    Review the decision pack
                  </Link>
                  <Link href="/security" className="btn btn-secondary">
                    See security boundaries
                  </Link>
                </div>
              </div>

              <aside className="about-hero-panel">
                <div className="about-panel-topline">
                  <Sparkles size={16} />
                  <span>Independent readiness engine</span>
                </div>
                <h2>What the platform is built to do</h2>
                <p>
                  Convert exported infrastructure evidence into a bounded review of readiness,
                  confidence, blockers, storage fit and migration posture without pretending to
                  execute the migration itself.
                </p>
                <div className="about-panel-grid">
                  <article>
                    <strong>Inventory</strong>
                    <span>RVTools baseline, snapshots, datastore and host signals</span>
                  </article>
                  <article>
                    <strong>Context</strong>
                    <span>Business constraints, backup status, target assumptions</span>
                  </article>
                  <article>
                    <strong>Risk</strong>
                    <span>Evidence gaps, wave blockers, continuity and storage cautions</span>
                  </article>
                  <article>
                    <strong>Output</strong>
                    <span>Decision pack, next actions and blueprint planning cues</span>
                  </article>
                </div>
                <div className="about-panel-footer">
                  <span>
                    <Eye size={15} />
                    We qualify what the evidence supports now.
                  </span>
                  <span>
                    <ClipboardCheck size={15} />
                    Missing evidence stays visible instead of hidden.
                  </span>
                </div>
              </aside>
            </div>
          </div>
        </section>

        <section className="section about-signals-section">
          <div className="container">
            <div className="about-editorial-head">
              <span className="about-kicker">Operating model</span>
              <h2>Built for assessment quality, not migration theater.</h2>
              <p>
                The product sits in the space between raw parser output and expensive, slow manual
                workshops. It keeps the methodology evidence-bound while still feeling guided and
                senior.
              </p>
            </div>
            <div className="about-card-grid">
              {operatingCards.map(({ Icon, eyebrow, title, copy }) => (
                <article key={title} className="about-feature-card">
                  <div className="about-feature-eyebrow">
                    <Icon size={18} />
                    <span>{eyebrow}</span>
                  </div>
                  <h3>{title}</h3>
                  <p>{copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section about-practice-section">
          <div className="container">
            <div className="about-practice-shell">
              <div className="about-editorial-head">
                <span className="about-kicker">Team profile</span>
                <h2>Built around senior infrastructure methodology.</h2>
                <p>
                  Shift Evidence is built around a senior infrastructure consulting approach:
                  evidence first, operational risk first, and clear migration decisions before
                  execution.
                </p>
                <div className="about-practice-principles">
                  {methodologyPrinciples.map((principle) => (
                    <span key={principle}>{principle}</span>
                  ))}
                </div>
              </div>
              <div className="about-practice-profile">
                <div className="about-practice-profile-copy">
                  <span>Multidisciplinary senior experience</span>
                  <p>
                    Behind the platform is a multidisciplinary senior technology consulting
                    profile with more than 28 years of hands-on experience per senior member
                    across enterprise infrastructure, platform modernization, virtualization,
                    migration planning, critical architectures, automation, security, operational
                    continuity and strategic technology transformation.
                  </p>
                  <p>
                    The methodology reflects real consulting work: assessment and discovery,
                    evidence review, gap analysis, migration readiness, modernization planning,
                    executive reporting, technical recommendations and client-ready deliverables.
                  </p>
                </div>
                <div className="about-practice-stat">
                  <strong>28+</strong>
                  <span>years of hands-on senior experience per senior member</span>
                </div>
              </div>
              <div className="about-practice-grid">
                {expertiseAreas.map((area, index) => (
                  <article key={area} className="about-practice-card">
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <strong>{area}</strong>
                  </article>
                ))}
              </div>
              <div className="about-practice-note">
                <strong>Conservative by design:</strong>
                <span>
                  the goal is not to promise automatic migrations or unrealistic certainty. The
                  goal is to show what the available evidence proves, what remains uncertain, what
                  risks must be addressed, and what should happen before production workloads move.
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="section about-methodology-section">
          <div className="container">
            <div className="about-methodology-shell">
              <div className="about-methodology-copy">
                <span className="about-kicker">Methodology</span>
                <h2>How Shift Evidence turns exported signals into migration decisions.</h2>
                <p>
                  We do not hide behind a black-box score. The workflow is designed so teams can
                  see what was supplied, what is still missing and why those gaps affect decisions.
                </p>
              </div>
              <div className="about-methodology-steps">
                {methodologySteps.map((step) => (
                  <article key={step.number} className="about-method-step">
                    <span className="about-method-step-number">{step.number}</span>
                    <div>
                      <h3>{step.title}</h3>
                      <p>{step.copy}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="section about-boundaries-section">
          <div className="container">
            <div className="about-boundaries-shell">
              <div className="about-editorial-head about-editorial-head-tight">
                <span className="about-kicker">Trust model</span>
                <h2>What Shift Evidence does and does not do.</h2>
                <p>
                  Shift Evidence is an independent assessment service. It does not replace a
                  production runbook, vendor support contract, legal review or final architecture
                  sign-off.
                </p>
              </div>
              <div className="assessment-lists-grid about-boundaries-grid">
                <article className="glass-card assessment-subcard about-boundary-card about-boundary-card-positive">
                  <h3>Included</h3>
                  <ul className="assessment-bullet-list">
                    {includedList.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </article>
                <article className="glass-card assessment-subcard about-boundary-card about-boundary-card-negative">
                  <h3>Not included</h3>
                  <ul className="assessment-bullet-list">
                    {excludedList.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </article>
              </div>
            </div>
          </div>
        </section>

        <section className="section about-audience-section">
          <div className="container">
            <div className="about-editorial-head">
              <span className="about-kicker">Who it serves</span>
              <h2>Made for the people who have to justify the next migration decision.</h2>
              <p>
                The goal is not to look clever. It is to help serious operators move from pressure
                and uncertainty toward bounded, reviewable next steps.
              </p>
            </div>
            <div className="about-card-grid about-card-grid-audience">
              {audienceCards.map(({ Icon, title, copy }) => (
                <article key={title} className="about-feature-card about-feature-card-audience">
                  <Icon size={22} />
                  <h3>{title}</h3>
                  <p>{copy}</p>
                </article>
              ))}
            </div>
            <div className="assessment-inline-actions about-page-actions">
              <Link href="/support" className="btn btn-primary btn-glow">
                Contact support
              </Link>
              <Link href="/dashboard" className="btn btn-secondary">
                Open dashboard
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
