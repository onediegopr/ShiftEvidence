"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Home, Play, ShieldCheck } from "lucide-react";
import Footer from "../Footer";
import Navbar from "../Navbar";
import ReplayControls from "./ReplayControls";
import ReplayScene from "./ReplayScene";
import {
  demoDataset,
  demoBadges,
  demoDoesNotDo,
  replaySteps,
  type ReplayStepId,
  whatYouGet,
} from "./replayData";

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
            <div className="badge badge-cyan">Simulated readiness walkthrough</div>
            <h1>Migration Readiness Replay</h1>
            <p className="demo-hero-subtitle">See how a VMware export becomes a Proxmox migration readiness report.</p>
            <p className="demo-hero-body">
              This simulated replay shows how ShiftReadiness analyzes VMware evidence, detects migration risks, identifies missing information, estimates Proxmox sizing and generates an executive-ready report.
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
              <Link href="/sign-up" className="btn btn-secondary" data-event="demo_cta_clicked">
                Start readiness assessment
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>

          <div className="glass-card demo-hero-panel">
            <div className="demo-terminal-header">
              <span className="sr-mockup-dot red" />
              <span className="sr-mockup-dot yellow" />
              <span className="sr-mockup-dot green" />
              <strong>Replay dataset</strong>
            </div>
            <div className="demo-terminal-body">
              <span>client: {demoDataset.client}</span>
              <span>source: {demoDataset.fileName}</span>
              <span>scope: {demoDataset.vmCount} VMs / {demoDataset.hosts} ESXi hosts / {demoDataset.clusters} clusters</span>
              <span>mode: synthetic demo, no backend, no production access</span>
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
            <article className="glass-card demo-before-card">
              <span>Before</span>
              <h3>Raw RVTools spreadsheet</h3>
              <p>Thousands of rows, hidden risk patterns, unclear migration order and incomplete context.</p>
            </article>
            <article className="glass-card demo-after-card">
              <span>After</span>
              <h3>Migration decision pack</h3>
              <div className="demo-after-metrics">
                <strong>{demoDataset.vmCount} VMs analyzed</strong>
                <strong>21 migration risks identified</strong>
                <strong>{demoDataset.waveOneCandidates} wave-1 candidates</strong>
                <strong>{demoDataset.highRiskWorkloads} high-risk workloads</strong>
                <strong>{demoDataset.missingEvidenceItems} missing evidence items</strong>
                <strong>Migration plan generated</strong>
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
          <div className="demo-output-grid">
            {whatYouGet.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.title} className="glass-card demo-output-card">
                  <Icon size={22} />
                  <h3>{item.title}</h3>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section shiftreadiness-section shiftreadiness-section-alt">
        <div className="container">
          <div className="glass-card demo-does-not-card">
            <div>
              <div className="badge">What this demo does not do</div>
              <h2>Clear boundaries. No migration theater.</h2>
              <p>This replay is a product walkthrough, not a migration execution engine.</p>
            </div>
            <div className="demo-does-not-list">
              {demoDoesNotDo.map((item) => (
                <span key={item}>
                  <CheckCircle2 size={15} />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section shiftreadiness-section">
        <div className="container">
          <div className="glass-card sample-report-inline-cta">
            <div>
              <div className="badge badge-cyan">Public sample report</div>
              <h2>Want to see the final deliverable?</h2>
              <p>
                The replay shows the process. The sample report shows the output: executive summary, readiness and
                confidence scores, evidence gaps, VM risk matrix, Proxmox sizing and migration waves.
              </p>
            </div>
            <Link href="/sample-report" className="btn btn-primary btn-glow" data-event="demo_cta_clicked">
              View and download sample report
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      <section className="section shiftreadiness-section shiftreadiness-section-alt">
        <div className="container">
          <div className="glass-card sample-report-inline-cta">
            <div>
              <div className="badge badge-cyan">Readiness offer</div>
              <h2>Want the full assessment offer?</h2>
              <p>
                The replay shows the process. The offer page explains what the readiness assessment includes, what
                evidence is required, what the report delivers and what the platform does not promise.
              </p>
            </div>
            <Link href="/vmware-to-proxmox-readiness" className="btn btn-secondary" data-event="demo_cta_clicked">
              View the readiness assessment offer
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
              <h2>Ready to check your own VMware environment?</h2>
              <p>Start with a readiness assessment, or book a review if you want help interpreting the output.</p>
            </div>
            <div className="sr-final-actions">
              <Link href="/sign-up" className="btn btn-primary btn-glow" data-event="demo_cta_clicked">
                Start readiness assessment
                <ArrowRight size={18} />
              </Link>
              <Link href="/contact" className="btn btn-secondary" data-event="demo_cta_clicked">
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
    <Footer />
    </>
  );
}
