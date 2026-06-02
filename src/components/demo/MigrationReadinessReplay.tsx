"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Play, ShieldCheck, Download, AlertTriangle } from "lucide-react";
import Footer from "../Footer";
import Navbar from "../Navbar";
import ReplayControls from "./ReplayControls";
import ReplayScene from "./ReplayScene";
import {
  demoDataset,
  demoBadges,
  replaySteps,
  type ReplayStepId,
  whatYouGet,
} from "./replayData";

const featureDescriptions: Record<string, string> = {
  "Executive Decision Report": "A high-level business summary presenting the financial impact, readiness posture, and total ROI timeline to secure executive buy-in.",
  "Technical Assessment": "Deep-dive analysis of hardware compatibility, VM flags, and configurations detailing the direct technical path to Proxmox.",
  "VM Risk Matrix": "VM-by-VM classification mapping workloads to complexity bands so you immediately identify low-hanging fruit vs critical blockers.",
  "Proxmox Sizing": "Conservative target sizing (RAM, CPU, storage) mapped to allocation thresholds, preventing over-provisioning and reducing hardware costs.",
  "Migration Wave Plan": "A structured, phased schedule grouping workloads by risk profile and dependencies to ensure controlled, low-impact rollouts.",
  "Evidence Missing Checklist": "A prioritized gaps list highlighting what information is missing (backups, performance metrics) and how it affects risk levels.",
  "AI Advisory Notes": "Context-aware architectural warnings and recommendations that highlight anomalous configurations before they trigger migration failures.",
  "PDF Report": "A polished, self-contained 12-page deliverable ready to be shared with stakeholders, partners, or internal compliance teams.",
};

const evidenceExpansionModules = [
  ["RVTools baseline", "Inventory, VM flags, snapshots and datastore signals."],
  ["Backup evidence", "Restore coverage and continuity confidence when supplied."],
  ["Proxmox target", "Destination node, storage and HA readiness signals."],
  ["Storage / SAN", "Capacity pressure, datastore mapping and target-storage constraints."],
  ["Dependencies", "Application relationships that influence wave sequencing."],
  ["Migration Plan PDF", "Gates, blockers, remediation and go/no-go guidance."],
];

const AUTO_ADVANCE_MS = 4200;
type AudioCue = "tap" | "step" | "warning" | "complete";
type WindowWithWebAudio = Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext };

const warningStepIds = new Set<ReplayStepId>(["coverage", "risk", "sizing"]);

function getStepStateClass(index: number, activeIndex: number, stepId: ReplayStepId) {
  if (index < activeIndex) return "completed";
  if (index === activeIndex) return stepId === "risk" ? "critical" : warningStepIds.has(stepId) ? "warning" : "active";
  return warningStepIds.has(stepId) ? "queued-warning" : "queued";
}

export default function MigrationReadinessReplay() {
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const activeStep = replaySteps[activeStepIndex];

  const playCue = useCallback(
    (cue: AudioCue) => {
      if (!soundEnabled || typeof window === "undefined") {
        return;
      }

      const AudioContextClass = window.AudioContext ?? (window as WindowWithWebAudio).webkitAudioContext;
      if (!AudioContextClass) {
        return;
      }

      const context = audioContextRef.current ?? new AudioContextClass();
      audioContextRef.current = context;

      if (context.state === "suspended") {
        void context.resume();
      }

      const now = context.currentTime;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const cueConfig = {
        tap: { frequency: 440, duration: 0.07, peak: 0.018 },
        step: { frequency: 620, duration: 0.08, peak: 0.016 },
        warning: { frequency: 260, duration: 0.12, peak: 0.018 },
        complete: { frequency: 780, duration: 0.13, peak: 0.018 },
      }[cue];

      oscillator.type = cue === "warning" ? "triangle" : "sine";
      oscillator.frequency.setValueAtTime(cueConfig.frequency, now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(cueConfig.peak, now + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + cueConfig.duration);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(now);
      oscillator.stop(now + cueConfig.duration + 0.02);
    },
    [soundEnabled],
  );

  useEffect(() => {
    if (!isPlaying) {
      return;
    }

    const timer = window.setTimeout(() => {
      setActiveStepIndex((current) => {
        if (current >= replaySteps.length - 1) {
          setIsPlaying(false);
          return current;
        }

        return current + 1;
      });
    }, AUTO_ADVANCE_MS);

    return () => window.clearTimeout(timer);
  }, [activeStepIndex, isPlaying]);

  useEffect(() => {
    if (!soundEnabled) {
      return;
    }

    if (activeStep.id === "report") {
      playCue("complete");
      return;
    }

    playCue(warningStepIds.has(activeStep.id) ? "warning" : "step");
  }, [activeStep.id, playCue, soundEnabled]);

  const progress = useMemo(() => ((activeStepIndex + 1) / replaySteps.length) * 100, [activeStepIndex]);
  const canGoBack = activeStepIndex > 0;
  const canGoNext = activeStepIndex < replaySteps.length - 1;

  const goToStep = (index: number) => {
    setActiveStepIndex(Math.min(Math.max(index, 0), replaySteps.length - 1));
  };

  const skipToReport = () => {
    setIsPlaying(false);
    setActiveStepIndex(replaySteps.length - 1);
  };

  return (
    <>
    <Navbar />
    <main className="shiftreadiness-page demo-page">
      <section className="section demo-hero">
        <div className="bg-mesh" />
        <div className="container demo-hero-grid">
          <div className="demo-hero-copy">
            <div className="badge badge-cyan">Cognitive TAM Methodology</div>
            <h1 className="demo-hero-title">
              Stop Guessing. Map Your <span className="demo-vmware-word">VMware</span> Exit with Precision.
            </h1>
            <p className="demo-hero-subtitle">
              Transition from <span className="demo-vmware-inline">VMware</span> to <span className="demo-proxmox-inline">Proxmox</span> with a productized risk-discovery engine.
            </p>
            <p className="demo-hero-body">
              ShiftReadiness applies our cognitive Target Architecture Mapping (TAM) methodology. We analyze your VMware export data to expose hidden configuration anomalies, flag hypervisor mismatches, and build a phased, risk-adjusted migration plan before you touch production.
            </p>
            <div className="demo-badge-row" aria-label="Demo safety notes">
              {demoBadges.map((badge) => (
                <span key={badge}>{badge}</span>
              ))}
            </div>
            <div className="shiftreadiness-actions">
              <a href="#replay" className="btn btn-primary btn-glow" onClick={() => setIsPlaying(true)} data-event="demo_started">
                Start replay
                <Play size={18} />
              </a>
              <a href="#final-report" className="btn btn-secondary" onClick={skipToReport} data-event="demo_skipped_to_report">
                Skip to final report
              </a>
              <Link href="/sign-up?plan=free" className="btn btn-secondary" data-event="demo_cta_clicked">
                Start Free Assessment
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>

          <div className={`glass-card demo-hero-panel ${isPlaying ? "is-active" : "is-idle"}`}>
            <div className="demo-terminal-aurora" aria-hidden="true" />
            <div className="demo-terminal-scanline" aria-hidden="true" />
            <div className="demo-terminal-header">
              <div className="demo-window-dots" aria-hidden="true">
                <span className={`sr-mockup-dot ${isPlaying ? "green animate-pulse" : "yellow"}`} />
                <span className="sr-mockup-dot green" />
                <span className="sr-mockup-dot red" />
              </div>
              <strong className="demo-terminal-title">
                <span className="demo-terminal-title-kicker">Telemetry engine</span>
                <span>{isPlaying ? "Active migration telemetry" : "Idle, ready to ingest"}</span>
              </strong>
              <span className="demo-terminal-live-chip">
                <span className="demo-terminal-live-dot" />
                {isPlaying ? "Live stream" : "Standby"}
              </span>
            </div>
            <div className="demo-terminal-body">
              <div className="demo-terminal-status-row">
                <span>
                  Status: <strong>{isPlaying ? "STREAMING ENGINE" : "STANDBY"}</strong>
                </span>
                <span className="demo-orbit-light" aria-hidden="true" />
              </div>
              <div className="demo-terminal-spectrum" aria-hidden="true">
                {Array.from({ length: 18 }).map((_, index) => (
                  <i key={index} style={{ animationDelay: `${index * 0.08}s` }} />
                ))}
              </div>
              <span>Target cluster: <strong>{demoDataset.client}</strong></span>
              <span>Source dataset: <strong>{demoDataset.fileName}</strong></span>
              <span>Inventory scope: <strong>{demoDataset.vmCount} VMs / {demoDataset.hosts} Hosts / {demoDataset.clusters} Clusters</strong></span>
              <span>Active scene: <strong className="demo-active-scene">{activeStep.title} ({activeStep.eyebrow})</strong></span>
              <div className="demo-terminal-metrics" aria-label="Telemetry metrics">
                <span><strong>{demoDataset.vmCount}</strong> VMs</span>
                <span><strong>{demoDataset.hosts}</strong> hosts</span>
                <span><strong>{Math.round(progress)}%</strong> mapped</span>
              </div>
              <span className="demo-terminal-methodology">
                Methodology: target architecture mapping, agentless, metadata-only
              </span>
            </div>
          </div>
        </div>
      </section>

      <section id="replay" className="section demo-replay-section">
        <div className="container">
          <div className="demo-replay-shell glass-card">
            <div className="demo-replay-topbar">
              <div>
                <span className="badge badge-cyan">Interactive replay</span>
                <h2>From RVTools export to decision pack.</h2>
                <div className="demo-replay-status-row" aria-label="Replay status legend">
                  <span className="demo-status-light demo-status-light-active">Active</span>
                  <span className="demo-status-light demo-status-light-completed">Completed</span>
                  <span className="demo-status-light demo-status-light-warning">Warning signals</span>
                </div>
              </div>
              <div className="demo-replay-topbar-actions">
                <ReplayControls
                  isPlaying={isPlaying}
                  soundEnabled={soundEnabled}
                  canGoBack={canGoBack}
                  canGoNext={canGoNext}
                  playLabel={activeStepIndex > 0 ? "Resume" : "Play"}
                  onPlayPause={() => {
                    playCue("tap");
                    setIsPlaying((value) => !value);
                  }}
                  onPrevious={() => {
                    playCue("tap");
                    setIsPlaying(false);
                    goToStep(activeStepIndex - 1);
                  }}
                  onNext={() => {
                    playCue("tap");
                    setIsPlaying(false);
                    goToStep(activeStepIndex + 1);
                  }}
                  onRestart={() => {
                    playCue("tap");
                    setIsPlaying(false);
                    setActiveStepIndex(0);
                  }}
                  onSkipToReport={skipToReport}
                  onToggleSound={() => setSoundEnabled((value) => !value)}
                />
                <div className="demo-progress-meter" aria-label={`Replay progress ${Math.round(progress)} percent`}>
                  <span style={{ width: `${progress}%` }} />
                </div>
              </div>
            </div>

            <div className="demo-replay-grid">
              <aside className="demo-step-rail" aria-label="Replay steps">
                {replaySteps.map((step, index) => {
                  const StepIcon = step.icon;
                  const active = index === activeStepIndex;
                  const stepState = getStepStateClass(index, activeStepIndex, step.id);
                  return (
                    <button
                      key={step.id}
                      type="button"
                      className={active ? "demo-step-tab active" : "demo-step-tab"}
                      onClick={() => {
                        setIsPlaying(false);
                        goToStep(index);
                      }}
                    >
                      <StepIcon size={16} />
                      <span className={`demo-step-state-dot demo-step-state-${stepState}`} aria-hidden="true" />
                      <span>{step.title}</span>
                    </button>
                  );
                })}
              </aside>

              <div className="demo-stage-column">
                <ReplayScene step={activeStep} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section shiftreadiness-section shiftreadiness-section-alt">
        <div className="container">
          <div className="shiftreadiness-section-heading">
            <div className="badge">Before / After</div>
            <h2>From spreadsheet chaos to migration clarity.</h2>
          </div>
          <div className="demo-before-after-grid">
            <article className="demo-mock-spreadsheet">
              <div className="demo-spreadsheet-header">
                <span>VM Name</span>
                <span>vCPU</span>
                <span>RAM (GB)</span>
                <span>Alerts/Errors</span>
              </div>
              <div className="demo-spreadsheet-row warning-row">
                <span>sql-prod-01</span>
                <span>16</span>
                <span>64</span>
                <span className="demo-spreadsheet-badge">CRITICAL SNAPSHOTS</span>
              </div>
              <div className="demo-spreadsheet-row">
                <span>web-portal-01</span>
                <span>4</span>
                <span>16</span>
                <span>None</span>
              </div>
              <div className="demo-spreadsheet-row warning-row">
                <span>dc-main-01</span>
                <span>8</span>
                <span>32</span>
                <span className="demo-spreadsheet-badge">NO BACKUP FLAG</span>
              </div>
              <div className="demo-spreadsheet-row blur">
                <span>app-dev-34</span>
                <span>2</span>
                <span>8</span>
                <span>-</span>
              </div>
              <div className="demo-spreadsheet-row blur">
                <span>test-vm-12</span>
                <span>1</span>
                <span>4</span>
                <span>-</span>
              </div>

              <div className="demo-spreadsheet-alert-box">
                <AlertTriangle size={20} />
                <div>
                  <p><strong>Warning:</strong> 7 hidden active snapshots and 12 outdated integration tools found in unmapped columns. Manual calculation required to find actual storage impact.</p>
                </div>
              </div>
            </article>

            <article className="demo-mock-dashboard">
              <div className="demo-dash-score-row">
                <div className="demo-dash-score-item">
                  <span>Readiness Score</span>
                  <strong>{demoDataset.readinessScore}/100</strong>
                </div>
                <div className="demo-dash-score-item">
                  <span>Confidence Score</span>
                  <strong>{demoDataset.evidenceConfidence}/100</strong>
                </div>
              </div>
              <div className="demo-dash-metrics-grid">
                <div className="demo-dash-metric-card">
                  <span>VMs Analyzed</span>
                  <strong>{demoDataset.vmCount} VMs</strong>
                </div>
                <div className="demo-dash-metric-card">
                  <span>Migration Risks</span>
                  <strong>21 Items</strong>
                </div>
              </div>
              <div className="demo-dash-wave-timeline">
                <div className="demo-dash-wave-item">
                  <span>Wave 1 (Low Risk)</span>
                  <strong>{demoDataset.waveOneCandidates} VMs</strong>
                </div>
                <div className="demo-dash-wave-item" style={{ borderColor: 'rgba(139, 92, 246, 0.3)', background: 'rgba(139, 92, 246, 0.08)' }}>
                  <span>Wave 2 (Prod)</span>
                  <strong>44 VMs</strong>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section id="final-report" className="section shiftreadiness-section">
        <div className="container">
          <div className="shiftreadiness-section-heading">
            <div className="badge badge-cyan">What you get</div>
            <h2>Professional outputs before you commit to a migration path.</h2>
          </div>
          <div className="demo-feature-card-grid">
            {whatYouGet.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.title} className="demo-premium-feature-card">
                  <div className="demo-feature-icon-wrapper">
                    <Icon size={22} />
                  </div>
                  <h3>{item.title}</h3>
                  <p>{featureDescriptions[item.title] || "Detailed assessment output report."}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section shiftreadiness-section shiftreadiness-section-alt">
        <div className="container">
          <div className="shiftreadiness-section-heading">
            <div className="badge badge-cyan">Evidence Expansion Library</div>
            <h2>Use synthetic scenarios to see how extra evidence changes confidence.</h2>
            <p>
              The replay now maps to a public synthetic dataset library covering clean pilots, missing backup evidence,
              constrained targets, dependency-heavy environments and advanced-ready scenarios. These examples support
              demos and QA without using customer data.
            </p>
          </div>
          <div className="demo-feature-card-grid">
            {evidenceExpansionModules.map(([title, body]) => (
              <article key={title} className="demo-premium-feature-card">
                <div className="demo-feature-icon-wrapper">
                  <CheckCircle2 size={21} />
                </div>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section shiftreadiness-section shiftreadiness-section-alt">
        <div className="container demo-integrity-container">
          <div className="demo-integrity-card">
            <div className="demo-integrity-header">
              <div className="badge">No-Nonsense Integrity Commitment</div>
              <h2>Clear boundaries. No migration theater.</h2>
              <p style={{ color: '#94a3b8', fontSize: '0.92rem', marginTop: '0.5rem' }}>
                We focus strictly on the pre-flight planning and risk validation phase. ShiftReadiness is designed around clear operational guardrails:
              </p>
            </div>
            <div className="demo-integrity-grid">
              <div className="demo-integrity-item">
                <CheckCircle2 size={16} />
                <span><strong>No Production Writes:</strong> We analyze exported metadata offline. We never request write permissions, credentials, or agent installs on production systems.</span>
              </div>
              <div className="demo-integrity-item">
                <CheckCircle2 size={16} />
                <span><strong>No Automated Migration:</strong> We do not move VMs or orchestrate conversion scripts. Execution belongs to specialized automation tools or experienced engineers.</span>
              </div>
              <div className="demo-integrity-item">
                <CheckCircle2 size={16} />
                <span><strong>Zero Downtime Excluded:</strong> We do not promise zero downtime. True downtime minimization requires a dedicated pilot, storage synchronization, and rollback drills.</span>
              </div>
              <div className="demo-integrity-item">
                <CheckCircle2 size={16} />
                <span><strong>No Guesswork or Inference:</strong> If evidence (like backup logs or disk performance metrics) is not uploaded, we list it as missing, lowering your confidence score rather than guessing.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section shiftreadiness-section demo-final-cta">
        <div className="container">
          <div className="shiftreadiness-section-heading">
            <div className="badge badge-cyan">Action Center</div>
            <h2>Accelerate Your VMware Exit Today</h2>
            <p>Select your path: start your assessment immediately or review a detailed sample report.</p>
          </div>
          
          <div className="demo-conversion-hub">
            <div className="glass-card demo-conversion-main-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div className="badge badge-cyan">Ready for your environment?</div>
                <h3 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'white', margin: '0.5rem 0' }}>Upload Your VMware Evidence</h3>
                <p style={{ color: '#94a3b8', fontSize: '0.92rem', lineHeight: 1.5 }}>
                  Get a structured pre-flight check for your VMware cluster. Start with your RVTools inventory export to discover licensing exposure, sizing issues, and migration readiness scores in minutes.
                </p>
              </div>
              <div className="demo-conversion-actions-row">
                <Link href="/sign-up?plan=free" className="btn btn-primary btn-glow" style={{ width: '100%', justifyContent: 'center' }} data-event="demo_cta_clicked">
                  Start Free Assessment
                  <ArrowRight size={18} />
                </Link>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <Link href="/support?category=general_question&subject=Technical%20Review%20Call" className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} data-event="demo_cta_clicked">
                    Book Technical Review
                    <ShieldCheck size={18} />
                  </Link>
                  <Link href="/pricing" className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} data-event="demo_cta_clicked">
                    View Pricing Plans
                    <ArrowRight size={18} />
                  </Link>
                </div>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div className="badge">Premium Output Sample</div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 600, color: 'white', margin: '0.5rem 0' }}>See the full sample deliverable</h3>
                <p style={{ color: '#94a3b8', fontSize: '0.88rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
                  Download a premium synthetic PDF with storage readiness, licensing exposure, continuity risk, Advisor Q&A, memory decisions and migration waves.
                </p>
              </div>
              
              <div className="demo-download-row">
                <div className="demo-download-info">
                  <strong>Northbridge Industrial Premium Sample</strong>
                  <span>Full synthetic PDF report</span>
                </div>
                <a 
                  href="/sample-reports/proxmox-migration-readiness-premium-sample-report-v2.pdf" 
                  className="btn btn-primary btn-sm btn-glow" 
                  target="_blank" 
                  rel="noreferrer"
                  style={{ padding: '0.5rem 1rem' }}
                >
                  <Download size={16} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
    <Footer />
    </>
  );
}
