"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import {
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  Pause,
  Play,
  RefreshCcw,
  SkipForward,
} from "lucide-react";
import Footer from "../Footer";
import Navbar from "../Navbar";
import {
  advisorInputs,
  advisorObservations,
  advisorOutputs,
  afterItems,
  beforeItems,
  classificationSummary,
  confirmedFindings,
  contextMissing,
  contextReceived,
  decisionPackItems,
  evidenceItems,
  evidenceLibraryCards,
  guidedAnswers,
  guidedQuestions,
  impactMetrics,
  integrityCards,
  migrationWaves,
  missingFindings,
  northbridgeDataset,
  outputCards,
  probableFindings,
  replaySteps,
  reportPreviewPages,
  reportSections,
  reportStatuses,
  requiredValidations,
  riskFindings,
  sampleAnswers,
  targetSizing,
  trustBadges,
  userProvidedFiles,
  vmMatrix,
  type EvidenceStatus,
  type ReplayStep,
} from "./replayData";
import styles from "./DemoReplayPage.module.css";

const FINAL_HOLD_MS = 3000;
const STEP_OFFSETS = replaySteps.map((_step, index) => replaySteps.slice(0, index).reduce((sum, step) => sum + step.durationMs, 0));
const TOTAL_DURATION = replaySteps.reduce((sum, step) => sum + step.durationMs, 0);
const CAPTURE_DURATION = TOTAL_DURATION + FINAL_HOLD_MS;
const FINAL_STEP_INDEX = replaySteps.length - 1;

function subscribeToMotionPreference(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};
  const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  mediaQuery.addEventListener("change", onStoreChange);
  return () => mediaQuery.removeEventListener("change", onStoreChange);
}

function getMotionPreferenceSnapshot() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getServerMotionPreferenceSnapshot() {
  return false;
}

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function getStepIndex(elapsedMs: number) {
  for (let index = replaySteps.length - 1; index >= 0; index -= 1) {
    if (elapsedMs >= STEP_OFFSETS[index]) return index;
  }
  return 0;
}

function formatClock(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function statusClass(status: EvidenceStatus) {
  return styles[`status${status}`];
}

export default function DemoReplayPage({ captureMode = false }: { captureMode?: boolean }) {
  const replayRef = useRef<HTMLElement | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [manualReducedMotion, setManualReducedMotion] = useState<boolean | null>(null);
  const systemReducedMotion = useSyncExternalStore(subscribeToMotionPreference, getMotionPreferenceSnapshot, getServerMotionPreferenceSnapshot);
  const reducedMotion = manualReducedMotion ?? systemReducedMotion;
  const effectiveReducedMotion = captureMode ? false : reducedMotion;
  const playbackDuration = captureMode ? CAPTURE_DURATION : TOTAL_DURATION;
  const displayElapsedMs = Math.min(elapsedMs, TOTAL_DURATION - 1);
  const activeStepIndex = getStepIndex(displayElapsedMs);
  const activeStep = replaySteps[activeStepIndex];
  const activeSceneProgress = Math.min(100, Math.max(0, ((displayElapsedMs - STEP_OFFSETS[activeStepIndex]) / activeStep.durationMs) * 100));
  const totalProgress = Math.min(100, (displayElapsedMs / Math.max(1, TOTAL_DURATION - 1)) * 100);

  useEffect(() => {
    if (!captureMode) return;

    document.body.dataset.captureMode = "true";
    const timeout = window.setTimeout(() => {
      setElapsedMs(0);
      setIsPlaying(true);
    }, 500);

    return () => {
      window.clearTimeout(timeout);
      delete document.body.dataset.captureMode;
    };
  }, [captureMode]);

  useEffect(() => {
    if (!isPlaying) return;

    const interval = window.setInterval(
      () => {
        setElapsedMs((current) => {
          const next = current + (effectiveReducedMotion ? 1000 : 250);
          if (next >= playbackDuration) {
            setIsPlaying(false);
            return playbackDuration;
          }
          return next;
        });
      },
      effectiveReducedMotion ? 700 : 250,
    );

    return () => window.clearInterval(interval);
  }, [effectiveReducedMotion, isPlaying, playbackDuration]);

  const scrollToReplay = () => replayRef.current?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
  const canGoBack = activeStepIndex > 0;
  const canGoNext = activeStepIndex < FINAL_STEP_INDEX;

  const runGuidedReplay = () => {
    scrollToReplay();
    setElapsedMs(0);
    setIsPlaying(true);
  };

  const skipToReport = () => {
    scrollToReplay();
    setElapsedMs(STEP_OFFSETS[FINAL_STEP_INDEX - 1]);
    setIsPlaying(false);
  };

  const goToStep = (index: number) => {
    if (captureMode) return;
    setElapsedMs(STEP_OFFSETS[Math.min(Math.max(index, 0), FINAL_STEP_INDEX)]);
    setIsPlaying(false);
  };

  const page = (
    <main className={cx(styles.page, captureMode && styles.capturePage, !captureMode && reducedMotion && styles.reducedMotion)} data-capture-mode={captureMode ? "true" : undefined}>
      {!captureMode ? (
        <>
          <HeroSection onRunReplay={runGuidedReplay} onSkipToReport={skipToReport} />
          <ImpactStrip />
        </>
      ) : null}

      <section ref={replayRef} id="replay-console" className={cx(styles.replaySection, captureMode && styles.captureReplaySection)}>
        <ReplayConsole
          activeStep={activeStep}
          activeStepIndex={activeStepIndex}
          activeSceneProgress={activeSceneProgress}
          captureMode={captureMode}
          canGoBack={canGoBack}
          canGoNext={canGoNext}
          elapsedMs={displayElapsedMs}
          isPlaying={isPlaying}
          reducedMotion={reducedMotion}
          totalProgress={totalProgress}
          onGoToStep={goToStep}
          onNext={() => goToStep(activeStepIndex + 1)}
          onPlayPause={() => setIsPlaying((value) => !value)}
          onPrevious={() => goToStep(activeStepIndex - 1)}
          onRestart={() => {
            setElapsedMs(0);
            setIsPlaying(false);
          }}
          onSkipToReport={skipToReport}
          onToggleReducedMotion={() => setManualReducedMotion((current) => !(current ?? systemReducedMotion))}
        />
      </section>

      {!captureMode ? (
        <>
          <BeforeAfterSection />
          <ProfessionalOutputsSection />
          <EvidenceExpansionLibrary />
          <IntegrityCommitment />
          <ActionCenter />
          <LegalStrip />
        </>
      ) : null}
    </main>
  );

  if (captureMode) return page;

  return (
    <>
      <Navbar />
      {page}
      <Footer />
    </>
  );
}

function HeroSection({ onRunReplay, onSkipToReport }: { onRunReplay: () => void; onSkipToReport: () => void }) {
  return (
    <section className={styles.hero}>
      <div className={styles.heroGrid}>
        <div className={styles.heroCopy}>
          <div className={styles.badgeRow}>
            <span className={styles.badge}>Simulated replay</span>
            <span className={styles.softBadge}>Evidence-based readiness methodology</span>
          </div>
          <div className={styles.routeLine} aria-label="VMware to Proxmox">
            <span data-vendor="vmware">VMware</span>
            <i />
            <span data-vendor="proxmox">Proxmox</span>
          </div>
          <h1>Senior-grade migration readiness before touching production.</h1>
          <p className={styles.heroLead}>
            Shift Evidence turns RVTools inventory, storage destination evidence and project context into a VMware -&gt; Proxmox readiness decision pack.
          </p>
          <p className={styles.heroBody}>
            Risk signals, evidence confidence, storage readiness, migration waves, reports and a contextual Senior Migration Advisor work together before any production move starts.
          </p>
          <div className={styles.trustBadges}>
            {trustBadges.map((badge) => <span key={badge}>{badge}</span>)}
          </div>
          <div className={styles.heroActions}>
            <button type="button" className={styles.primaryAction} onClick={onRunReplay}><Play size={18} />Run guided replay</button>
            <button type="button" className={styles.secondaryAction} onClick={onSkipToReport}>Open final report<SkipForward size={17} /></button>
            <Link href="/start" className={styles.ghostAction}>Start readiness assessment<ArrowRight size={17} /></Link>
          </div>
        </div>

        <div className={styles.heroVisual} aria-label="Synthetic replay preview">
          <div className={styles.heroVisualTop}>
            <span>Northbridge Industrial Group</span>
            <strong>Former VMware TAM-led readiness methodology</strong>
          </div>
          <div className={styles.heroDataFlow}>
            {["RVTools", "Context", "Advisor", "Waves", "Decision Pack"].map((item, index) => (
              <div key={item} className={styles.heroNode} style={{ animationDelay: `${index * 140}ms` }}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{item}</strong>
              </div>
            ))}
          </div>
          <div className={styles.heroFileShelf} aria-label="Additional user-provided evidence examples">
            {userProvidedFiles.slice(0, 3).map((file) => <span key={file}>{file}</span>)}
          </div>
          <div className={styles.heroScores}>
            <ScoreMini label="Readiness" value="68 / 100" />
            <ScoreMini label="Confidence" value="64 / 100" />
            <ScoreMini label="Decision" value="Conditional Go" />
          </div>
        </div>
      </div>
    </section>
  );
}

function ScoreMini({ label, value }: { label: string; value: string }) {
  return <article><span>{label}</span><strong>{value}</strong></article>;
}

function ImpactStrip() {
  return (
    <section className={styles.impactStrip} aria-label="Replay impact metrics">
      {impactMetrics.map(([label, value]) => <article key={label}><span>{label}</span><strong>{value}</strong></article>)}
    </section>
  );
}

function ReplayConsole({
  activeStep,
  activeStepIndex,
  activeSceneProgress,
  captureMode,
  canGoBack,
  canGoNext,
  elapsedMs,
  isPlaying,
  reducedMotion,
  totalProgress,
  onGoToStep,
  onNext,
  onPlayPause,
  onPrevious,
  onRestart,
  onSkipToReport,
  onToggleReducedMotion,
}: {
  activeStep: ReplayStep;
  activeStepIndex: number;
  activeSceneProgress: number;
  captureMode: boolean;
  canGoBack: boolean;
  canGoNext: boolean;
  elapsedMs: number;
  isPlaying: boolean;
  reducedMotion: boolean;
  totalProgress: number;
  onGoToStep: (index: number) => void;
  onNext: () => void;
  onPlayPause: () => void;
  onPrevious: () => void;
  onRestart: () => void;
  onSkipToReport: () => void;
  onToggleReducedMotion: () => void;
}) {
  return (
    <div className={cx(styles.console, styles[`tone${activeStep.tone}`], captureMode && styles.captureConsole)}>
      <div className={styles.consoleTop}>
        <div>
          <span>Migration Readiness Replay</span>
          <strong>VMware -&gt; Proxmox planning based on infrastructure evidence, project context and Senior Advisor review.</strong>
        </div>
        <div className={styles.consoleMeta}>
          <span>{northbridgeDataset.customer}</span>
          <span>{northbridgeDataset.fileName}</span>
        </div>
      </div>

      {!captureMode ? (
        <div className={styles.controls}>
          <button type="button" className={styles.controlPrimary} onClick={onPlayPause}>{isPlaying ? <Pause size={16} /> : <Play size={16} />}{isPlaying ? "Pause" : "Play"}</button>
          <button type="button" onClick={onPrevious} disabled={!canGoBack}><ChevronLeft size={16} />Previous step</button>
          <button type="button" onClick={onNext} disabled={!canGoNext}>Next step<ChevronRight size={16} /></button>
          <button type="button" onClick={onRestart}><RefreshCcw size={16} />Restart</button>
          <button type="button" onClick={onSkipToReport}><SkipForward size={16} />Skip to report</button>
          <button type="button" onClick={onToggleReducedMotion} aria-pressed={reducedMotion}>Reduced Motion: {reducedMotion ? "On" : "Off"}</button>
          <span>{formatClock(elapsedMs)} / {formatClock(TOTAL_DURATION)}</span>
        </div>
      ) : null}

      <div className={styles.progressBar} aria-hidden="true"><span style={{ width: `${totalProgress}%` }} /></div>

      <div className={styles.consoleBody}>
        <aside className={styles.leftRail}>
          <span className={styles.sceneNumber}>{activeStep.number} / 15</span>
          <h2>{activeStep.leftTitle}</h2>
          <p>{activeStep.leftBody}</p>
          <LeftRailScene step={activeStep} />
        </aside>

        <main className={styles.stage} aria-live="polite">
          <div className={styles.sceneHeader}>
            <span>{activeStep.number} / 15</span>
            <div>
              <h2>{activeStep.title}</h2>
              <p>{activeStep.body}</p>
            </div>
          </div>
          <div className={styles.sceneProgress} aria-label={`Scene progress ${Math.round(activeSceneProgress)} percent`}><span style={{ width: `${activeSceneProgress}%` }} /></div>
          <div className={styles.sceneCanvas} data-scene={activeStep.id}><ReplayScene step={activeStep} /></div>
        </main>

        <aside className={styles.contextRail}>
          <span className={styles.railLabel}>{activeStep.rightTitle}</span>
          <ContextRail step={activeStep} />
        </aside>
      </div>

      {!captureMode ? (
        <nav
          className={styles.stepRail}
          style={{ "--timeline-progress": `${Math.min(totalProgress / 100, 1)}` } as CSSProperties}
          aria-label="Replay steps"
        >
          {replaySteps.map((step, index) => {
            const Icon = step.icon;
            return (
              <button
                key={step.id}
                type="button"
                className={cx(index === activeStepIndex && styles.activeStep, index < activeStepIndex && styles.completeStep)}
                onClick={() => onGoToStep(index)}
                aria-current={index === activeStepIndex ? "step" : undefined}
              >
                <Icon size={14} />
                <span>{step.shortTitle}</span>
              </button>
            );
          })}
        </nav>
      ) : null}
    </div>
  );
}

function LeftRailScene({ step }: { step: ReplayStep }) {
  if (step.id === "advisor") return <RailList title="Advisor observations" items={advisorObservations.slice(0, 4)} />;
  if (step.id === "questions") return <RailList title="Sample answers" items={sampleAnswers} />;
  if (step.id === "waves") return <RailList title="Wave logic" items={["Pilot low-risk services first", "Block ERP until dependencies are confirmed", "Require backup validation before critical waves"]} />;
  if (step.id === "decisionPack") return <RailList title="Use cases" items={["Executive decision", "Technical planning", "MSP pre-sales", "Migration readiness review"]} />;
  if (step.id === "final") return <RailList title="Final guidance" items={["Pilot first", "Validate backups", "Confirm dependencies", "Do not migrate blind"]} />;
  return <RailList title="Assessment inputs" items={["RVTools inventory", "Storage destination evidence", "Project context", "User-provided files", "Guided questions"]} />;
}

function ContextRail({ step }: { step: ReplayStep }) {
  if (step.id === "context") {
    return (
      <>
        <KeyRows rows={contextReceived.map((item) => [item, "Received"])} />
        <RailList title="Missing" items={contextMissing} />
      </>
    );
  }
  if (step.id === "risk") return <KeyRows rows={[["Critical", "4"], ["High", "4"], ["Medium", "3"], ["Info", "0"]]} />;
  if (step.id === "advisor") return <RailList title="Advisor inputs" items={advisorInputs} />;
  if (step.id === "questions") return <RailList title="Advisor output" items={advisorOutputs} />;
  if (step.id === "decisionPack") {
    return (
      <>
        <RailList title="Download pack includes" items={["Executive PDF", "Technical appendix", "Evidence checklist", "Advisor notes", "Wave plan"]} />
        <Link href="/sample-report" className={styles.railCta}>Download full sample report</Link>
      </>
    );
  }
  if (step.id === "final" || step.id === "confidence" || step.id === "assembly") {
    return (
      <>
        <ScoreCard label="Migration Readiness" value={northbridgeDataset.scores.readiness} />
        <ScoreCard label="Evidence Confidence" value={northbridgeDataset.scores.confidence} />
        <div className={styles.decisionPill}>Conditional Go</div>
      </>
    );
  }
  if (step.id === "target") return <KeyRows rows={targetSizing.slice(4)} />;
  return <KeyRows rows={[["RVTools Inventory", "Complete"], ["Project Context", "Received"], ["Storage Evidence", "Partial"], ["Backup Evidence", "Missing"], ["Dependency Map", "Missing"]]} />;
}

function RailList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className={styles.railList}>
      <strong>{title}</strong>
      {items.map((item) => <span key={item}>{item}</span>)}
    </div>
  );
}

function KeyRows({ rows }: { rows: ReadonlyArray<readonly [string, string]> }) {
  return (
    <dl className={styles.keyRows}>
      {rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
    </dl>
  );
}

function ScoreCard({ label, value }: { label: string; value: number }) {
  return (
    <article className={styles.scoreCard}>
      <span>{label}</span>
      <strong>{value} / 100</strong>
      <div><i style={{ width: `${value}%` }} /></div>
    </article>
  );
}

function ReplayScene({ step }: { step: ReplayStep }) {
  if (step.id === "opening") return <OpeningScene />;
  if (step.id === "intake") return <IntakeScene />;
  if (step.id === "context") return <ContextScene />;
  if (step.id === "parse") return <ParseScene />;
  if (step.id === "separation") return <SeparationScene />;
  if (step.id === "confidence") return <ConfidenceScene />;
  if (step.id === "risk") return <RiskScene />;
  if (step.id === "matrix") return <MatrixScene />;
  if (step.id === "target") return <TargetScene />;
  if (step.id === "advisor") return <AdvisorScene />;
  if (step.id === "questions") return <QuestionsScene />;
  if (step.id === "waves") return <WavesScene />;
  if (step.id === "validations") return <ValidationsScene />;
  if (step.id === "assembly") return <AssemblyScene />;
  if (step.id === "decisionPack") return <DecisionPackScene />;
  return <FinalScene />;
}

function OpeningScene() {
  return (
    <section className={styles.openingScene}>
      {["VMware source", "Shift Evidence", "Proxmox target"].map((item, index) => (
        <article key={item} style={{ animationDelay: `${index * 120}ms` }}>
          <span>{String(index + 1).padStart(2, "0")}</span>
          <strong>{item}</strong>
        </article>
      ))}
    </section>
  );
}

function IntakeScene() {
  return (
    <section className={styles.uploadScene}>
      <article className={styles.fileCard}>
        <FileIcon />
        <span>RVTools Inventory Export</span>
        <strong>{northbridgeDataset.fileName}</strong>
        <p>Received from {northbridgeDataset.customer}</p>
      </article>
      <div className={styles.safetyStack}>
        {["No agents", "No mandatory credentials", "No production access", "Evidence-based scoring"].map((item) => <span key={item}>{item}</span>)}
      </div>
    </section>
  );
}

function FileIcon() {
  return <div className={styles.fileIcon}><span /><span /><span /></div>;
}

function ContextScene() {
  return (
    <section className={styles.contextScene}>
      <div className={styles.contextColumns}>
        <EvidenceColumn title="Received" items={["RVTools inventory", "Project context form", "Maintenance windows", "Target storage worksheet"]} tone="confirmed" />
        <EvidenceColumn title="Partial" items={["Proxmox destination evidence", "Network diagram", "Application criticality notes"]} tone="probable" />
        <EvidenceColumn title="Missing" items={["Backup export", "Historical performance", "Dependency map"]} tone="missing" />
      </div>
      <div className={styles.fileChips}>{userProvidedFiles.map((file) => <span key={file}>{file}</span>)}</div>
    </section>
  );
}

function ParseScene() {
  const rows = ["Parsing vInfo...", "Parsing vCPU...", "Parsing vMemory...", "Parsing vDisk...", "Parsing vDatastore...", "Parsing vNetwork...", "Parsing vSnapshot...", "Normalizing inventory..."];
  return (
    <section className={styles.parseScene}>
      <div className={styles.stream}>
        {rows.map((row, index) => <div key={row} style={{ animationDelay: `${index * 90}ms` }}><span>{String(index + 1).padStart(2, "0")}</span><strong>{row}</strong><small>complete</small></div>)}
      </div>
      <div className={styles.inventoryGrid}>
        {Object.entries(northbridgeDataset.inventory).map(([label, value]) => <MetricTile key={label} label={label.replace(/([A-Z])/g, " $1")} value={value} />)}
      </div>
    </section>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return <article className={styles.metricTile}><strong>{value}</strong><span>{label}</span></article>;
}

function SeparationScene() {
  return (
    <section className={styles.separationScene}>
      <EvidenceColumn title="Confirmed" items={confirmedFindings} tone="confirmed" />
      <EvidenceColumn title="Probable" items={probableFindings} tone="probable" />
      <EvidenceColumn title="Missing" items={missingFindings} tone="missing" />
    </section>
  );
}

function EvidenceColumn({ title, items, tone }: { title: string; items: string[]; tone: "confirmed" | "probable" | "missing" }) {
  return <article className={cx(styles.evidenceColumn, styles[tone])}><h3>{title}</h3>{items.map((item) => <span key={item}>{item}</span>)}</article>;
}

function ConfidenceScene() {
  return (
    <section className={styles.confidenceScene}>
      <ScoreCard label="Evidence Confidence" value={64} />
      <div className={styles.evidenceTable}>
        {evidenceItems.map(([label, status, detail]) => <article key={label}><strong>{label}</strong><span className={cx(styles.statusBadge, statusClass(status))}>{status}</span><p>{detail}</p></article>)}
      </div>
    </section>
  );
}

function RiskScene() {
  return <section className={styles.riskScene}>{riskFindings.map(([label, severity]) => <article key={label} className={styles[`risk${severity}`]}><span>{severity}</span><strong>{label}</strong></article>)}</section>;
}

function MatrixScene() {
  return (
    <section className={styles.matrixScene}>
      <div className={styles.vmCards}>
        {vmMatrix.map(([vm, workload, complexity, risk, recommendation]) => <article key={vm}><strong>{vm}</strong><span>{workload}</span><small>{complexity} complexity / {risk} risk</small><em>{recommendation}</em></article>)}
      </div>
      <div className={styles.summaryList}>{classificationSummary.map((item) => <span key={item}>{item}</span>)}</div>
    </section>
  );
}

function TargetScene() {
  return (
    <section className={styles.sizingScene}>
      {targetSizing.map(([label, value]) => <MetricTile key={label} label={label} value={value} />)}
      <article className={styles.conditionalCard}><strong>Conditional sizing</strong><p>Based on current evidence and allocation data. Add target export and performance history for higher confidence.</p></article>
    </section>
  );
}

function AdvisorScene() {
  return (
    <section className={styles.advisorScene}>
      <article className={styles.advisorHero}><span>Senior Migration Advisor</span><strong>Former VMware TAM-led readiness methodology</strong><p>Senior technical review assisted by evidence, not magic AI.</p></article>
      <div className={styles.advisorGrid}>{advisorObservations.map((item) => <span key={item}>{item}</span>)}</div>
    </section>
  );
}

function QuestionsScene() {
  return (
    <section className={styles.questionsScene}>
      <div>{guidedQuestions.map((question, index) => <article key={question}><span>{String(index + 1).padStart(2, "0")}</span><strong>{question}</strong></article>)}</div>
      <div>{guidedAnswers.map(([label, value]) => <article key={label}><span>{label}</span><strong>{value}</strong></article>)}</div>
    </section>
  );
}

function WavesScene() {
  return <section className={styles.wavesScene}>{migrationWaves.map(([label, count, detail], index) => <article key={label} style={{ animationDelay: `${index * 110}ms` }}><span>{label}</span><strong>{count}</strong><p>{detail}</p></article>)}</section>;
}

function ValidationsScene() {
  return <section className={styles.validationsScene}>{requiredValidations.map((item, index) => <article key={item}><span>{String(index + 1).padStart(2, "0")}</span><strong>{item}</strong></article>)}</section>;
}

function AssemblyScene() {
  return (
    <section className={styles.reportScene}>
      <article className={styles.reportCover}><span>VMware -&gt; Proxmox Migration Readiness Report</span><strong>{northbridgeDataset.customer}</strong><p>Senior-grade decision pack generated from evidence, context and Advisor review.</p><KeyRows rows={reportStatuses} /></article>
      <div className={styles.reportSections}>{reportSections.map((section, index) => <span key={section} style={{ animationDelay: `${index * 55}ms` }}><CheckCircle2 size={13} />{section}</span>)}</div>
    </section>
  );
}

function DecisionPackScene() {
  return (
    <section className={styles.decisionPackScene}>
      <article className={styles.reportBundle}><span>Full Migration Readiness Decision Pack</span><strong>Ready for executive review, technical planning and migration decision-making.</strong><div>{decisionPackItems.map((item) => <small key={item}>{item}</small>)}</div></article>
      <div className={styles.previewPages}>{reportPreviewPages.map((page, index) => <span key={page} style={{ animationDelay: `${index * 70}ms` }}>{page}</span>)}</div>
    </section>
  );
}

function FinalScene() {
  return (
    <section className={styles.finalScene}>
      <div className={styles.finalScores}><ScoreCard label="Migration Readiness" value={68} /><ScoreCard label="Evidence Confidence" value={64} /><article className={styles.finalDecision}><span>Decision</span><strong>Conditional Go</strong></article></div>
      <h3>Senior-grade VMware -&gt; Proxmox readiness before touching production.</h3>
      <p>Pilot first. Validate backups. Confirm dependencies. Delay ERP and domain controllers. Do not migrate blind.</p>
      <div className={styles.finalCtas}><Link href="/start">Start readiness assessment</Link><Link href="/sample-report">Download sample report</Link><Link href="/technical-review">Book technical review</Link></div>
    </section>
  );
}

function BeforeAfterSection() {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}><span className={styles.badge}>Before / After</span><h2>From spreadsheet chaos to migration clarity.</h2></div>
      <div className={styles.beforeAfter}>
        <article className={styles.beforePanel}><h3>Before</h3><div className={styles.spreadsheetMock}>{beforeItems.map((item) => <span key={item}>{item}</span>)}</div></article>
        <article className={styles.afterPanel}><h3>After</h3><div className={styles.clarityGrid}>{afterItems.map((item) => <span key={item}>{item}</span>)}</div></article>
      </div>
    </section>
  );
}

function ProfessionalOutputsSection() {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}><span className={styles.badge}>What you get</span><h2>Professional outputs before you commit to a migration path.</h2><p>A readiness assessment turns raw VMware evidence, project context, guided questions and Advisor review into assets your technical team, delivery lead and executive sponsor can all use.</p></div>
      <div className={styles.outputGrid}>{outputCards.map(([title, body, Icon]) => <article key={title}><Icon size={20} /><h3>{title}</h3><p>{body}</p></article>)}</div>
    </section>
  );
}

function EvidenceExpansionLibrary() {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}><span className={styles.badge}>Evidence Expansion Library</span><h2>Add more evidence. Increase confidence.</h2><p>Start with RVTools. Add project context, user-provided files, storage destination evidence, guided questions and Senior Advisor review when you need a stronger decision.</p></div>
      <div className={styles.libraryGrid}>{evidenceLibraryCards.map(([title, input, improves, output, Icon]) => <article key={title}><Icon size={19} /><h3>{title}</h3><div><span>{input}</span><i /><span>{improves}</span><i /><strong>{output}</strong></div></article>)}</div>
    </section>
  );
}

function IntegrityCommitment() {
  return (
    <section className={styles.section}>
      <div className={styles.integrityShell}>
        <div className={styles.sectionHeader}><span className={styles.badge}>No-Nonsense Integrity Commitment</span><h2>Clear boundaries. No migration theater.</h2><p>This replay focuses strictly on pre-flight planning, evidence review and migration risk validation.</p></div>
        <div className={styles.integrityGrid}>{integrityCards.map(([title, body, Icon]) => <article key={title}><Icon size={18} /><strong>{title}</strong><p>{body}</p></article>)}</div>
      </div>
    </section>
  );
}

function ActionCenter() {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}><span className={styles.badge}>Action Center</span><h2>Ready for your environment?</h2><p>Start with your RVTools export or review the full downloadable sample report before booking an assessment.</p></div>
      <div className={styles.actionGrid}>
        <article className={styles.actionPrimary}><span>Start with your VMware evidence</span><h3>Upload or prepare your RVTools inventory export and senior context.</h3><p>Get a structured readiness path: VM risks, storage readiness, Advisor notes, evidence gaps and migration waves.</p><div className={styles.trustBadges}>{["RVTools-based", "Guided questions", "No production access"].map((badge) => <span key={badge}>{badge}</span>)}</div><Link href="/start" className={styles.primaryAction}>Start readiness assessment <ArrowRight size={17} /></Link></article>
        <article className={styles.actionSecondary}><span>Downloadable decision pack</span><h3>Download the full sample report.</h3><p>See evidence coverage, Advisor notes, guided questions, VM risk classification, Proxmox target sizing, required validations and migration waves.</p><Link href="/sample-report" className={styles.downloadAction}>Download full sample report <Download size={17} /></Link><div className={styles.actionLinks}><Link href="/technical-review">Book technical review</Link><Link href="/pricing">View pricing plans</Link></div></article>
      </div>
    </section>
  );
}

function LegalStrip() {
  return <section className={styles.legalStrip}><p>Synthetic replay only. Shift Evidence provides readiness assessment and planning outputs, not automated VM migration, production write access, or guaranteed migration outcomes.</p></section>;
}
