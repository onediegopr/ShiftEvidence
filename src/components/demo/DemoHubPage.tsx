import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, Clock3, FileText, Lock, Play, ShieldCheck, Sparkles } from "lucide-react";
import Footer from "../Footer";
import Navbar from "../Navbar";

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
            <div className="demo-hub-copy">
              <div className="badge badge-cyan">Demo funnel</div>
              <h1>Explore Shift Evidence before you buy</h1>
              <p className="demo-hero-subtitle">
                Start with a quick simulation to understand the workflow, or open a read-only Demo Workspace to explore
                synthetic assessment scenarios in depth.
              </p>
              <div className="demo-hub-actions">
                <Link href="/demo/replay" className="btn btn-primary btn-glow">
                  Watch Quick Simulation
                  <Play size={18} />
                </Link>
                <Link href="/demo/workspace" className="btn btn-secondary">
                  Explore a Sample Assessment
                  <FileText size={18} />
                </Link>
              </div>
            </div>

            <aside className="glass-card demo-hub-signal-card" aria-label="Demo safety boundaries">
              <Sparkles size={24} />
              <h2>Two ways to learn. Zero production access.</h2>
              <p>
                Both demos use synthetic data. They do not analyze your infrastructure and do not replace a paid
                assessment.
              </p>
              <div className="demo-hub-safety-grid">
                <span><Lock size={14} /> No backend mutation</span>
                <span><Clock3 size={14} /> Fast or deep path</span>
                <span><ShieldCheck size={14} /> No real AI provider call</span>
              </div>
            </aside>
          </div>
        </section>

        <section className="section demo-hub-choices-section">
          <div className="container demo-hub-choice-grid">
            <DemoChoiceCard
              badge="Quick simulation"
              title="Migration Readiness Replay"
              copy="Watch a fast, guided simulation showing how VMware evidence becomes a Proxmox migration readiness decision pack."
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
