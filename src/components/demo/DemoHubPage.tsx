import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import { ArrowRight, Clock3, FileText, Lock, Play, ShieldCheck, Sparkles } from "lucide-react";
import Footer from "../Footer";
import Navbar from "../Navbar";
import proxmoxLogo from "../../../images/proxmox.svg";
import vmwareLogo from "../../../images/vmware.svg";

const quickSimulationBullets = [
  "90-second guided walkthrough",
  "No login",
  "No upload",
  "No production access",
  "Shows the assessment flow quickly",
];

const workspaceBullets = [
  "8 synthetic scenarios",
  "Readiness and confidence scores",
  "Risk matrix and migration waves",
  "Synthetic Advisor transcript",
  "Downloadable demo PDFs",
];

const hubSignals = [
  { value: "2", label: "learning paths" },
  { value: "8", label: "synthetic scenarios" },
  { value: "0", label: "production access" },
  { value: "100%", label: "read-only" },
];

const hubJourney = [
  {
    step: "01",
    title: "Watch the quick replay",
    body: "A short guided flow that shows how the methodology works before a real assessment begins.",
  },
  {
    step: "02",
    title: "Explore the workspace",
    body: "Open the synthetic scenarios, scores, Advisor transcript and downloadable reports in depth.",
  },
  {
    step: "03",
    title: "Check the commercial path",
    body: "Compare plans only after you know which level of evidence and planning depth you need.",
  },
];

function DemoChoiceCard({
  badge,
  title,
  copy,
  bullets,
  href,
  cta,
  icon,
  tone,
}: {
  badge: string;
  title: string;
  copy: string;
  bullets: string[];
  href: string;
  cta: string;
  icon: ReactNode;
  tone: "quick" | "workspace";
}) {
  return (
    <article className={`glass-card demo-hub-choice demo-hub-choice-${tone}`}>
      <div className="demo-hub-choice-orb" aria-hidden="true" />
      <div className="demo-hub-choice-top">
        <span className="demo-hub-choice-icon">{icon}</span>
        <span className="badge badge-cyan">{badge}</span>
      </div>
      <h2>{title}</h2>
      <p>{copy}</p>
      <ul>
        {bullets.map((bullet) => (
          <li key={bullet}>
            <ShieldCheck size={14} />
            {bullet}
          </li>
        ))}
      </ul>
      <Link href={href} className="btn btn-primary btn-glow">
        {cta}
        <ArrowRight size={16} />
      </Link>
    </article>
  );
}

export default function DemoHubPage() {
  return (
    <>
      <Navbar />
      <main className="shiftreadiness-page demo-page demo-hub-page">
        <section className="section demo-hub-hero">
          <div className="bg-mesh" />
          <div className="container demo-hub-hero-grid">
            <div className="demo-hub-copy demo-hero-copy">
              <div className="demo-hub-route-line" aria-hidden="true">
                <span className="demo-hub-route-pill demo-hub-route-pill-vmware">
                  <Image src={vmwareLogo} alt="" width={16} height={16} />
                  VMware
                </span>
                <span className="demo-hub-route-arrow">
                  <ArrowRight size={14} />
                </span>
                <span className="demo-hub-route-pill demo-hub-route-pill-proxmox">
                  <Image src={proxmoxLogo} alt="" width={16} height={16} />
                  Proxmox
                </span>
              </div>
              <div className="demo-hero-kicker-row">
                <div className="badge badge-cyan">Demo funnel</div>
                <p className="assessment-inline-note">Synthetic, read-only product preview</p>
              </div>
              <h1>Explore Shift Evidence before you buy</h1>
              <p className="demo-hub-subtitle demo-hero-subtitle">
                Start with a quick simulation to understand the workflow, or open a read-only Demo Workspace to explore
                synthetic assessment scenarios in depth.
              </p>
              <p className="demo-hub-body demo-hero-body">
                The public demo stays safe by design. It uses synthetic data, avoids production access, and never
                swaps the visitor session for a reserved demo account.
              </p>
              <div className="demo-badge-row demo-hub-signal-strip" aria-label="Demo safety notes">
                {hubSignals.map((signal) => (
                  <span key={signal.label}>
                    <strong>{signal.value}</strong> {signal.label}
                  </span>
                ))}
              </div>
              <div className="demo-hub-action-deck">
                <Link href="/demo/replay" className="btn btn-primary btn-glow demo-hub-primary-action">
                  <span>
                    <strong>Watch Quick Simulation</strong>
                    <small>Follow the guided 90-second replay first</small>
                  </span>
                  <Play size={18} />
                </Link>
                <div className="demo-hub-action-grid">
                  <Link href="/demo/workspace" className="demo-hub-action-card">
                    <span>
                      <strong>Explore Demo Workspace</strong>
                      <small>Inspect scenarios, scores and reports</small>
                    </span>
                    <ArrowRight size={16} />
                  </Link>
                  <Link href="/pricing" className="demo-hub-action-card demo-hub-action-card-accent">
                    <span>
                      <strong>View Pricing</strong>
                      <small>Compare what the paid paths unlock</small>
                    </span>
                    <FileText size={16} />
                  </Link>
                  <Link href="/sample-report" className="demo-hub-action-card">
                    <span>
                      <strong>View Sample Report</strong>
                      <small>See the premium deliverable first</small>
                    </span>
                    <FileText size={16} />
                  </Link>
                </div>
              </div>
            </div>

            <aside className="glass-card demo-hub-signal-card" aria-label="Demo safety boundaries">
              <div className="demo-terminal-header">
                <span className="sr-mockup-dot red" />
                <span className="sr-mockup-dot yellow" />
                <span className="sr-mockup-dot green" />
                <strong>Demo overview</strong>
                <span className="demo-terminal-tag">read only</span>
              </div>
              <div className="demo-hub-signal-card-body">
                <div className="demo-hub-signal-card-title">
                  <span className="demo-hub-signal-kicker">Synthetic preview</span>
                  <h2>Two ways to learn. Zero production access.</h2>
                  <p>
                    Both demos use synthetic data. They do not analyze your infrastructure and do not replace a paid
                    assessment.
                  </p>
                </div>

                <div className="demo-hub-signal-stats">
                  <div className="demo-hub-signal-stat">
                    <strong>2</strong>
                    <span>guided entry points</span>
                  </div>
                  <div className="demo-hub-signal-stat">
                    <strong>0</strong>
                    <span>production writes</span>
                  </div>
                  <div className="demo-hub-signal-stat">
                    <strong>8</strong>
                    <span>synthetic scenarios</span>
                  </div>
                  <div className="demo-hub-signal-stat">
                    <strong>1</strong>
                    <span>safe commercial path</span>
                  </div>
                </div>

                <div className="demo-hub-signal-journey">
                  {hubJourney.map((item) => (
                    <article key={item.title}>
                      <span>{item.step}</span>
                      <div>
                        <strong>{item.title}</strong>
                        <p>{item.body}</p>
                      </div>
                    </article>
                  ))}
                </div>

                <div className="demo-hub-safety-grid">
                  <span><Lock size={14} /> No backend mutation</span>
                  <span><Clock3 size={14} /> Fast or deep path</span>
                  <span><ShieldCheck size={14} /> No real AI provider call</span>
                  <span><Sparkles size={14} /> No session takeover</span>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section className="section demo-hub-choices-section">
          <div className="container demo-hub-choice-grid">
            <DemoChoiceCard
              badge="Quick simulation"
              title="Migration Readiness Replay"
              copy="Watch a fast, guided simulation showing how VMware evidence becomes a Proxmox migration readiness decision pack and blueprint-ready planning path."
              bullets={quickSimulationBullets}
              href="/demo/replay"
              cta="Watch Quick Simulation"
              icon={<Play size={22} />}
              tone="quick"
            />
            <DemoChoiceCard
              badge="Deep exploration"
              title="Demo Workspace"
              copy="Explore a complete read-only workspace with synthetic VMware -> Proxmox scenarios, risk scores, Advisor transcripts and downloadable demo reports."
              bullets={workspaceBullets}
              href="/demo/workspace"
              cta="Explore a Sample Assessment"
              icon={<FileText size={22} />}
              tone="workspace"
            />
          </div>
        </section>

        <section className="section demo-hub-note-section">
          <div className="container">
            <article className="glass-card demo-hub-footer-note">
              <p>
                Both demos use synthetic data. They do not analyze your infrastructure, upload files, access production
                systems, run live AI providers or replace a paid assessment.
              </p>
              <Link href="/pricing" className="btn btn-secondary">
                Compare paid assessment plans
              </Link>
            </article>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
