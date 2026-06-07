"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import {
  Activity,
  ClipboardCheck,
  Database,
  FileSpreadsheet,
  FileText,
  Pause,
  Play,
  RefreshCw,
  ShieldCheck,
  SkipForward,
} from "lucide-react";
import { acmeDataset, auditStream, labScenes, type EvidenceState, type KeyValueRow, type LabScene, type Severity } from "./labData";
import styles from "./MigrationReadinessLab.module.css";

const FINAL_SCENE_INDEX = labScenes.length - 1;
const CAPTURE_FINAL_HOLD_MS = 3000;
const SCENE_OFFSETS = labScenes.map((_scene, index) =>
  labScenes.slice(0, index).reduce((sum, scene) => sum + scene.durationMs, 0),
);
const TOTAL_DURATION = labScenes.reduce((sum, scene) => sum + scene.durationMs, 0);
const CAPTURE_DURATION = TOTAL_DURATION + CAPTURE_FINAL_HOLD_MS;

function subscribeToMotionPreference(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  mediaQuery.addEventListener("change", onStoreChange);
  return () => mediaQuery.removeEventListener("change", onStoreChange);
}

function getMotionPreferenceSnapshot() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getServerMotionPreferenceSnapshot() {
  return false;
}

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function formatClock(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function getSceneIndex(elapsedMs: number, offsets: number[]) {
  for (let index = labScenes.length - 1; index >= 0; index -= 1) {
    if (elapsedMs >= offsets[index]) {
      return index;
    }
  }

  return 0;
}

function SeverityBadge({ severity, label }: { severity: Severity | string; label?: string }) {
  return <span className={cx(styles.badge, styles[`severity-${severity.toLowerCase()}`])}>{label ?? severity}</span>;
}

function StateBadge({ state }: { state: EvidenceState | string }) {
  const key = state.toLowerCase().replace(/\s+/g, "-");
  return <span className={cx(styles.stateBadge, styles[`state-${key}`])}>{state}</span>;
}

function MetricCard({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <article className={styles.metricCard}>
      <span>{label}</span>
      <strong>{value}</strong>
      {note ? <small>{note}</small> : null}
    </article>
  );
}

function TopConsoleBar() {
  return (
    <div className={styles.consoleTopBar}>
      <div>
        <strong>Proxmox Migration Readiness</strong>
        <span>No agents · No credentials · No production access</span>
      </div>
      <div className={styles.consoleRoute}>VMware -&gt; Proxmox Migration Planning</div>
      <div className={styles.replayBadge}>Synthetic Replay</div>
    </div>
  );
}

function LeftSceneRail({ scene, progress }: { scene: LabScene; progress: number }) {
  return (
    <aside className={styles.leftRail} aria-label="Current replay scene">
      <span className={styles.sceneNumber}>{scene.number} / 12</span>
      <h2>{scene.title}</h2>
      <p>{scene.railCopy}</p>
      <div className={styles.statusBlock}>
        <span>Status</span>
        <strong>{scene.status}</strong>
      </div>
      <div className={styles.sceneProgress} aria-label={`Scene progress ${Math.round(progress)} percent`}>
        <span style={{ width: `${progress}%` }} />
      </div>
    </aside>
  );
}

function RightContextRail({ sceneId }: { sceneId: string }) {
  if (sceneId === "intake") {
    return (
      <RightPanel title="Optional evidence">
        <KeyValueList rows={acmeDataset.optionalEvidence} />
        <p className={styles.railNote}>More evidence raises confidence. Missing evidence remains visible.</p>
      </RightPanel>
    );
  }

  if (sceneId === "parse") {
    return (
      <RightPanel title="Inventory detected">
        <div className={styles.railMetrics}>
          {acmeDataset.inventory.map(([label, value]) => (
            <MetricCard key={label} label={label} value={value} />
          ))}
        </div>
      </RightPanel>
    );
  }

  if (sceneId === "confidence") {
    return (
      <RightPanel title="Evidence Confidence">
        <ScoreCard label="Evidence Confidence" score={64} tone="limited" sublabel="Limited evidence" />
        <p className={styles.railNote}>Confidence is measured, not assumed.</p>
      </RightPanel>
    );
  }

  if (sceneId === "risk") {
    return (
      <RightPanel title="Risk signals detected">
        <KeyValueList
          rows={[
            ["Critical", "3"],
            ["High", "3"],
            ["Medium", "3"],
            ["Info", "1"],
            ["Total findings", "10"],
          ]}
        />
      </RightPanel>
    );
  }

  if (sceneId === "sizing") {
    return (
      <RightPanel title="Sizing basis">
        <ul className={styles.checkList}>
          {acmeDataset.sizingBasis.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <StateBadge state="Medium" />
        <p className={styles.railNote}>Based on current evidence and allocation data.</p>
      </RightPanel>
    );
  }

  if (sceneId === "validations") {
    return (
      <RightPanel title="Production migration status">
        <StateBadge state="Conditional" />
        <p className={styles.railNote}>Do not migrate critical workloads until backup and dependencies are validated.</p>
      </RightPanel>
    );
  }

  if (sceneId === "report") {
    return (
      <RightPanel title="Sections generated">
        <KeyValueList rows={acmeDataset.reportSections} />
      </RightPanel>
    );
  }

  if (sceneId === "final" || sceneId === "scores") {
    return (
      <RightPanel title="Decision interpretation">
        <ScoreCard label="Migration Readiness" score={68} tone="medium" sublabel="Medium readiness" />
        <ScoreCard label="Evidence Confidence" score={64} tone="limited" sublabel="Limited evidence" />
        <div className={styles.decisionPill}>Conditional Go</div>
      </RightPanel>
    );
  }

  return (
    <RightPanel title="Assessment boundary">
      <ul className={styles.checkList}>
        <li>Synthetic dataset only</li>
        <li>No real customer data</li>
        <li>No production access</li>
        <li>No automated migration claim</li>
      </ul>
    </RightPanel>
  );
}

function RightPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <aside className={styles.rightRail} aria-label={title}>
      <h3>{title}</h3>
      {children}
    </aside>
  );
}

function KeyValueList({ rows }: { rows: KeyValueRow[] }) {
  return (
    <dl className={styles.keyValueList}>
      {rows.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function ScoreCard({ label, score, tone, sublabel }: { label: string; score: number; tone: "medium" | "limited"; sublabel: string }) {
  return (
    <article className={cx(styles.scoreCard, styles[`score-${tone}`])}>
      <span>{label}</span>
      <strong>{score} / 100</strong>
      <div className={styles.scoreTrack}>
        <i style={{ width: `${score}%` }} />
      </div>
      <small>{sublabel}</small>
    </article>
  );
}

function SceneStage({
  scene,
  hasStarted,
  captureMode,
  onStart,
  onReplay,
}: {
  scene: LabScene;
  hasStarted: boolean;
  captureMode: boolean;
  onStart: () => void;
  onReplay: () => void;
}) {
  return (
    <main className={styles.sceneStage} aria-live="polite">
      <div className={styles.sceneCopy}>
        <span>{scene.label}</span>
        <p>{scene.mainCopy}</p>
      </div>
      <div className={styles.sceneCanvas} data-scene={scene.id}>
        {renderScene(scene.id, hasStarted, captureMode, onStart, onReplay)}
      </div>
    </main>
  );
}

function renderScene(sceneId: string, hasStarted: boolean, captureMode: boolean, onStart: () => void, onReplay: () => void) {
  switch (sceneId) {
    case "standby":
      return <StandbyScene hasStarted={hasStarted} captureMode={captureMode} onStart={onStart} />;
    case "intake":
      return <IntakeScene />;
    case "parse":
      return <ParseScene />;
    case "evidence":
      return <EvidenceSeparationScene />;
    case "confidence":
      return <ConfidenceScene />;
    case "risk":
      return <RiskScene />;
    case "matrix":
      return <MatrixScene />;
    case "scores":
      return <ScoresScene />;
    case "sizing":
      return <SizingScene />;
    case "waves":
      return <WavesScene />;
    case "validations":
      return <ValidationsScene />;
    case "report":
      return <ReportScene />;
    case "final":
      return <FinalScene captureMode={captureMode} onReplay={onReplay} />;
    default:
      return null;
  }
}

function StandbyScene({ hasStarted, captureMode, onStart }: { hasStarted: boolean; captureMode: boolean; onStart: () => void }) {
  const modules = ["Evidence Intake", "Inventory Parser", "Evidence Confidence", "Risk Engine", "VM Matrix", "Migration Waves", "Executive Report"];

  return (
    <section className={styles.standbyGrid}>
      <div className={styles.openingPanel}>
        <span className={styles.labEyebrow}>Migration Readiness Replay</span>
        <h3>Before migrating VMware to Proxmox, know what can break.</h3>
        <p>Evidence-based migration planning. No agents. No production access. No guesswork.</p>
        {captureMode ? null : (
          <button className={styles.primaryControl} type="button" onClick={onStart} data-testid="lab-standby-start">
            <Play size={16} />
            {hasStarted ? "Resume simulated assessment" : "Start simulated assessment"}
          </button>
        )}
      </div>
      <div className={styles.moduleGrid}>
        {modules.map((module) => (
          <article key={module} className={styles.dimModule}>
            <span />
            <strong>{module}</strong>
          </article>
        ))}
      </div>
    </section>
  );
}

function IntakeScene() {
  return (
    <section className={styles.intakeLayout}>
      <article className={styles.fileCard}>
        <FileSpreadsheet size={34} />
        <span>File received</span>
        <h3>{acmeDataset.file.name}</h3>
        <p>{acmeDataset.file.type}</p>
        <KeyValueList
          rows={[
            ["Company", acmeDataset.company],
            ["Size", acmeDataset.file.size],
            ["Status", acmeDataset.file.status],
          ]}
        />
      </article>
      <div className={styles.badgeStack}>
        {["No agents", "No credentials required", "No production access", "Customer-controlled evidence"].map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
    </section>
  );
}

function ParseScene() {
  return (
    <section className={styles.parseLayout}>
      <div className={styles.auditStream}>
        {auditStream.map((line, index) => (
          <div key={line} style={{ animationDelay: `${index * 120}ms` }}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <code>{line}</code>
          </div>
        ))}
      </div>
      <div className={styles.inventoryGrid}>
        {acmeDataset.inventory.map(([label, value]) => (
          <MetricCard key={label} label={label} value={value} />
        ))}
      </div>
    </section>
  );
}

function EvidenceSeparationScene() {
  return (
    <section className={styles.evidenceColumns}>
      <EvidenceColumn title="Confirmed" items={acmeDataset.confirmed} tone="confirmed" />
      <EvidenceColumn title="Probable" items={acmeDataset.probable} tone="probable" />
      <EvidenceColumn title="Missing" items={acmeDataset.missing} tone="missing" />
      <p className={styles.sceneStatement}>Confirmed findings, probable risks and missing evidence are handled separately.</p>
    </section>
  );
}

function EvidenceColumn({ title, items, tone }: { title: string; items: string[]; tone: string }) {
  return (
    <article className={cx(styles.evidenceColumn, styles[`evidence-${tone}`])}>
      <h3>{title}</h3>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </article>
  );
}

function ConfidenceScene() {
  return (
    <section className={styles.confidenceLayout}>
      <table className={styles.labTable}>
        <caption>Evidence area status</caption>
        <thead>
          <tr>
            <th>Evidence Area</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {acmeDataset.evidence.map((row) => (
            <tr key={row.area}>
              <td>{row.area}</td>
              <td>
                <StateBadge state={row.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <ScoreCard label="Evidence Confidence" score={64} tone="limited" sublabel="Limited evidence" />
    </section>
  );
}

function RiskScene() {
  const grouped = {
    critical: acmeDataset.riskFindings.filter((item) => item.severity === "critical"),
    high: acmeDataset.riskFindings.filter((item) => item.severity === "high"),
    medium: acmeDataset.riskFindings.filter((item) => item.severity === "medium"),
    info: acmeDataset.riskFindings.filter((item) => item.severity === "info"),
  };

  return (
    <section className={styles.riskGroups}>
      {Object.entries(grouped).map(([severity, items]) => (
        <article key={severity} className={styles.riskGroup}>
          <SeverityBadge severity={severity} />
          <ul>
            {items.map((item) => (
              <li key={item.text}>{item.text}</li>
            ))}
          </ul>
        </article>
      ))}
    </section>
  );
}

function MatrixScene() {
  return (
    <section className={styles.matrixLayout}>
      <table className={styles.labTable}>
        <caption>VM-by-VM complexity matrix</caption>
        <thead>
          <tr>
            <th>VM</th>
            <th>Workload</th>
            <th>Complexity</th>
            <th>Risk</th>
            <th>Recommendation</th>
          </tr>
        </thead>
        <tbody>
          {acmeDataset.vmMatrix.map((vm) => (
            <tr key={vm.vm}>
              <td>{vm.vm}</td>
              <td>{vm.workload}</td>
              <td>{vm.complexity}</td>
              <td>
                <SeverityBadge severity={vm.risk.toLowerCase()} label={vm.risk} />
              </td>
              <td>{vm.recommendation}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className={styles.summaryCards}>
        {acmeDataset.complexitySummary.map((item) => (
          <article key={item}>{item}</article>
        ))}
      </div>
    </section>
  );
}

function ScoresScene() {
  return (
    <section className={styles.dualScores}>
      <ScoreCard label="Migration Readiness" score={68} tone="medium" sublabel="Medium readiness" />
      <ScoreCard label="Evidence Confidence" score={64} tone="limited" sublabel="Limited evidence" />
      <article className={styles.decisionCard}>
        <span>Decision interpretation</span>
        <strong>Conditional Go</strong>
        <p>Proceed with pilot, targeted validation and remediation before production migration.</p>
      </article>
    </section>
  );
}

function SizingScene() {
  return (
    <section className={styles.sizingGrid}>
      {acmeDataset.sizing.map(([label, value]) => (
        <MetricCard key={label} label={label} value={value} />
      ))}
      <article className={styles.disclaimerCard}>
        <ShieldCheck size={18} />
        <p>Based on current evidence and allocation data. Add historical performance and full target evidence for higher confidence.</p>
      </article>
    </section>
  );
}

function WavesScene() {
  return (
    <section className={styles.wavesLayout}>
      <div className={styles.waveTimeline}>
        {acmeDataset.waves.map((wave) => (
          <article key={wave.name}>
            <span>{wave.name}</span>
            <strong>{wave.detail}</strong>
            <p>{wave.note}</p>
          </article>
        ))}
      </div>
      <div className={styles.vmMoves}>
        {acmeDataset.vmWaveMoves.map((move) => (
          <span key={move}>{move}</span>
        ))}
      </div>
    </section>
  );
}

function ValidationsScene() {
  return (
    <section className={styles.validationsList}>
      <h3>Required validations before production migration</h3>
      <ol>
        {acmeDataset.validations.map((item) => (
          <li key={item}>
            <span>Required</span>
            {item}
          </li>
        ))}
      </ol>
    </section>
  );
}

function ReportScene() {
  const previewSections = ["Executive Summary", "Readiness Score", "Evidence Confidence", "Top Risks", "VM Complexity Matrix", "Migration Waves", "Required Validations", "Proxmox Target Sizing"];

  return (
    <section className={styles.reportLayout}>
      <article className={styles.reportArtifact}>
        <FileText size={26} />
        <span>VMware -&gt; Proxmox Migration Readiness Report</span>
        <h3>Decision Pack Preview</h3>
        <ul>
          {previewSections.map((section) => (
            <li key={section}>{section}</li>
          ))}
        </ul>
      </article>
      <div className={styles.reportPages} aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
    </section>
  );
}

function FinalScene({ captureMode, onReplay }: { captureMode: boolean; onReplay: () => void }) {
  return (
    <section className={styles.finalScene}>
      <div className={styles.finalScores}>
        <ScoreCard label="Migration Readiness" score={68} tone="medium" sublabel="Medium readiness" />
        <ScoreCard label="Evidence Confidence" score={64} tone="limited" sublabel="Limited evidence" />
        <article className={styles.decisionCard}>
          <span>Decision</span>
          <strong>Conditional Go</strong>
        </article>
      </div>
      <h3>Before migrating VMware to Proxmox, know what can break.</h3>
      <p>Move low-risk workloads first. Validate backup and dependencies before critical waves. Do not migrate blind.</p>
      {captureMode ? null : (
        <div className={styles.finalCtas}>
          <Link href="/start">Start readiness assessment</Link>
          <Link href="/sample-report">Download sample report</Link>
          <button type="button" onClick={onReplay}>Replay simulation</button>
        </div>
      )}
      <small>No agents. No mandatory credentials. No production access required.</small>
    </section>
  );
}

function BottomTimeline({
  activeSceneIndex,
  onJump,
}: {
  activeSceneIndex: number;
  onJump: (index: number) => void;
}) {
  return (
    <nav className={styles.bottomTimeline} aria-label="Replay scene timeline">
      {labScenes.map((scene, index) => (
        <button
          key={scene.id}
          type="button"
          className={cx(index === activeSceneIndex && styles.timelineActive, index < activeSceneIndex && styles.timelineComplete)}
          onClick={() => onJump(index)}
          aria-current={index === activeSceneIndex ? "step" : undefined}
        >
          <span>{scene.number}</span>
          {scene.label}
        </button>
      ))}
    </nav>
  );
}

export function MigrationReadinessLab({ captureMode = false }: { captureMode?: boolean }) {
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isStarted, setIsStarted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasFinished, setHasFinished] = useState(false);
  const [manualReducedMotion, setManualReducedMotion] = useState<boolean | null>(null);
  const systemReducedMotion = useSyncExternalStore(
    subscribeToMotionPreference,
    getMotionPreferenceSnapshot,
    getServerMotionPreferenceSnapshot,
  );
  const reducedMotion = manualReducedMotion ?? systemReducedMotion;
  const effectiveReducedMotion = captureMode ? false : reducedMotion;
  const playbackDuration = captureMode ? CAPTURE_DURATION : TOTAL_DURATION;
  const displayElapsedMs = Math.min(elapsedMs, TOTAL_DURATION - 1);

  const activeSceneIndex = getSceneIndex(displayElapsedMs, SCENE_OFFSETS);
  const activeScene = labScenes[activeSceneIndex];
  const sceneElapsed = displayElapsedMs - SCENE_OFFSETS[activeSceneIndex];
  const sceneProgress = Math.min(100, Math.max(0, (sceneElapsed / activeScene.durationMs) * 100));

  useEffect(() => {
    if (!captureMode) {
      return;
    }

    document.body.dataset.captureMode = "true";

    return () => {
      delete document.body.dataset.captureMode;
    };
  }, [captureMode]);

  useEffect(() => {
    if (!captureMode) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setIsStarted(true);
      setHasFinished(false);
      setElapsedMs(SCENE_OFFSETS[1]);
      setIsPlaying(true);
    }, 500);

    return () => window.clearTimeout(timeout);
  }, [captureMode]);

  useEffect(() => {
    if (!isPlaying) {
      return;
    }

    const interval = window.setInterval(
      () => {
        setElapsedMs((current) => {
          const next = current + (effectiveReducedMotion ? 1200 : 250);
          if (next >= playbackDuration) {
            setIsPlaying(false);
            setHasFinished(true);
            return playbackDuration;
          }

          return next;
        });
      },
      effectiveReducedMotion ? 600 : 250,
    );

    return () => window.clearInterval(interval);
  }, [effectiveReducedMotion, isPlaying, playbackDuration]);

  const startAssessment = () => {
    if (captureMode) {
      return;
    }

    setIsStarted(true);
    setHasFinished(false);
    setElapsedMs((current) => (current < SCENE_OFFSETS[1] ? SCENE_OFFSETS[1] : current));
    setIsPlaying(true);
  };

  const pauseReplay = () => {
    if (captureMode) {
      return;
    }

    setIsPlaying((current) => !current);
  };

  const resetReplay = () => {
    if (captureMode) {
      return;
    }

    setElapsedMs(0);
    setIsStarted(false);
    setIsPlaying(false);
    setHasFinished(false);
  };

  const skipToFinal = () => {
    if (captureMode) {
      return;
    }

    setIsStarted(true);
    setIsPlaying(false);
    setHasFinished(true);
    setElapsedMs(SCENE_OFFSETS[FINAL_SCENE_INDEX]);
  };

  const jumpToScene = (index: number) => {
    if (captureMode) {
      return;
    }

    setIsStarted(index > 0);
    setIsPlaying(false);
    setHasFinished(index === FINAL_SCENE_INDEX);
    setElapsedMs(SCENE_OFFSETS[index]);
  };

  return (
    <div
      className={cx(styles.labPage, captureMode && styles.captureMode, !captureMode && reducedMotion && styles.reducedMotion)}
      data-capture-mode={captureMode ? "true" : undefined}
    >
      {captureMode ? null : (
      <header className={styles.labHeader}>
        <div>
          <span className={styles.brand}>Proxmox Migration Readiness</span>
          <span className={styles.headerBadge}>Lab Preview</span>
        </div>
        <p>Synthetic dataset. No real customer data.</p>
      </header>
      )}

      {captureMode ? null : (
      <section className={styles.heroBlock}>
        <span className={styles.previewBadge}>Lab Preview - visual concept under review</span>
        <h1>Migration Readiness Lab</h1>
        <p>See how raw VMware evidence becomes a Proxmox migration decision pack.</p>
      </section>
      )}

      {captureMode ? null : (
      <section className={styles.controlsPanel} aria-label="Replay controls">
        <button className={styles.primaryControl} type="button" onClick={startAssessment} data-testid="lab-start">
          <Play size={16} />
          Start simulated assessment
        </button>
        <button type="button" onClick={pauseReplay} disabled={!isStarted && !hasFinished} data-testid="lab-pause">
          <Pause size={16} />
          {isPlaying ? "Pause" : "Resume"}
        </button>
        <button type="button" onClick={resetReplay} data-testid="lab-replay">
          <RefreshCw size={16} />
          Replay
        </button>
        <button type="button" onClick={skipToFinal} data-testid="lab-skip-final">
          <SkipForward size={16} />
          Skip to final report
        </button>
        <button
          type="button"
          className={cx(styles.motionToggle, reducedMotion && styles.motionToggleActive)}
          onClick={() => setManualReducedMotion((current) => !(current ?? systemReducedMotion))}
          aria-pressed={reducedMotion}
          data-testid="lab-reduced-motion"
        >
          Reduced motion: {reducedMotion ? "On" : "Off"}
        </button>
        <span className={styles.clock}>{formatClock(displayElapsedMs)} / {formatClock(TOTAL_DURATION)}</span>
      </section>
      )}

      <section className={styles.consoleShell} aria-label="Migration Readiness Replay Laboratory Edition">
        <TopConsoleBar />
        <div className={styles.consoleBody}>
          <LeftSceneRail scene={activeScene} progress={sceneProgress} />
          <SceneStage scene={activeScene} hasStarted={isStarted} captureMode={captureMode} onStart={startAssessment} onReplay={resetReplay} />
          <RightContextRail sceneId={activeScene.id} />
        </div>
        {captureMode ? null : <BottomTimeline activeSceneIndex={activeSceneIndex} onJump={jumpToScene} />}
      </section>

      {captureMode ? null : (
      <footer className={styles.labFooter}>
        <div>
          <Activity size={18} />
          <span>Operational console, not marketing animation.</span>
        </div>
        <div>
          <Database size={18} />
          <span>ACME Corp synthetic RVTools dataset only.</span>
        </div>
        <div>
          <ClipboardCheck size={18} />
          <span>Decision: Conditional Go.</span>
        </div>
      </footer>
      )}
    </div>
  );
}
