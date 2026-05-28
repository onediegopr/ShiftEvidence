"use client";

import { AlertTriangle, CheckCircle2, FileSpreadsheet, Lock, Minus, ShieldCheck } from "lucide-react";
import {
  acmeDataset,
  advisoryItems,
  demoDoesNotDo,
  evidenceItems,
  inventoryResults,
  migrationWaves,
  reportSections,
  riskItems,
  safetyBadges,
  signalStream,
  sizingItems,
  vmMatrix,
  type ReplaySeverity,
  type ReplayStep,
} from "./replayData";

type ReplaySceneProps = {
  step: ReplayStep;
};

const severityLabel: Record<ReplaySeverity, string> = {
  info: "Info",
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
  success: "Success",
};

export default function ReplayScene({ step }: ReplaySceneProps) {
  const StepIcon = step.icon;

  return (
    <div className="demo-scene-stage" aria-live="polite">
      <div className="demo-scene-header">
        <div>
          <span className="demo-scene-eyebrow">{step.eyebrow}</span>
          <h2>{step.title}</h2>
          <p>{step.body}</p>
        </div>
        <div className="demo-scene-icon" aria-hidden="true">
          <StepIcon size={30} />
        </div>
      </div>

      {step.id === "upload" && <UploadScene />}
      {step.id === "inventory" && <InventoryScene />}
      {step.id === "coverage" && <CoverageScene />}
      {step.id === "risk" && <RiskScene />}
      {step.id === "matrix" && <MatrixScene />}
      {step.id === "sizing" && <SizingScene />}
      {step.id === "waves" && <WavesScene />}
      {step.id === "advisory" && <AdvisoryScene />}
      {step.id === "report" && <ReportScene />}
    </div>
  );
}

function UploadScene() {
  return (
    <div className="demo-upload-grid">
      <div className="demo-file-card">
        <FileSpreadsheet size={34} />
        <div>
          <strong>{acmeDataset.fileName}</strong>
          <span>ACME Manufacturing Group / synthetic RVTools-style export</span>
        </div>
      </div>
      <div className="demo-progress-card">
        <div className="demo-progress-row">
          <span>Evidence intake</span>
          <strong>Simulated</strong>
        </div>
        <div className="demo-progress-track" aria-hidden="true">
          <span style={{ width: "74%" }} />
        </div>
        <div className="demo-safety-grid">
          {safetyBadges.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="demo-safety-pill">
                <Icon size={15} />
                <span>{item.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function InventoryScene() {
  return (
    <div className="demo-inventory-grid">
      <div className="demo-signal-stream">
        {signalStream.map((signal, index) => (
          <div key={signal} className="demo-signal-line" style={{ animationDelay: `${index * 90}ms` }}>
            <span>[{String(index + 1).padStart(2, "0")}]</span>
            <strong>{signal}</strong>
          </div>
        ))}
      </div>
      <div className="demo-result-grid">
        {inventoryResults.map((item) => (
          <div key={item.label} className="demo-metric-tile">
            <strong>{item.value}</strong>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CoverageScene() {
  return (
    <div className="demo-coverage-grid">
      <div className="demo-confidence-card">
        <span>Evidence Confidence</span>
        <strong>{acmeDataset.evidenceConfidence}%</strong>
        <p>The assessment shows what is known, what is probable and what still needs validation.</p>
      </div>
      <div className="demo-table-wrap">
        <table className="demo-table">
          <thead>
            <tr>
              <th>Evidence</th>
              <th>Status</th>
              <th>Why it matters</th>
            </tr>
          </thead>
          <tbody>
            {evidenceItems.map((item) => (
              <tr key={item.label}>
                <td>{item.label}</td>
                <td>
                  <span className={`demo-status demo-status-${item.status.toLowerCase()}`}>{item.status}</span>
                </td>
                <td>{item.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RiskScene() {
  return (
    <div className="demo-risk-grid">
      {riskItems.map((risk) => (
        <article key={risk.label} className={`demo-risk-card demo-risk-${risk.severity}`}>
          <div>
            <span>{severityLabel[risk.severity]}</span>
            <strong>{risk.label}</strong>
          </div>
          <p>{risk.detail}</p>
        </article>
      ))}
    </div>
  );
}

function MatrixScene() {
  return (
    <div className="demo-table-wrap">
      <table className="demo-table demo-vm-table">
        <thead>
          <tr>
            <th>VM</th>
            <th>Role</th>
            <th>Complexity</th>
            <th>Replay action</th>
          </tr>
        </thead>
        <tbody>
          {vmMatrix.map((vm) => (
            <tr key={vm.vm}>
              <td>{vm.vm}</td>
              <td>{vm.role}</td>
              <td>
                <span className={`demo-status demo-complexity-${vm.complexity.toLowerCase()}`}>{vm.complexity}</span>
              </td>
              <td>{vm.action}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="demo-scene-note">Not every VM should move in the same wave.</p>
    </div>
  );
}

function SizingScene() {
  return (
    <div className="demo-sizing-grid">
      {sizingItems.map((item) => (
        <article key={item.label} className="demo-sizing-card">
          <span>{item.label}</span>
          <strong>{item.value}</strong>
          <p>{item.note}</p>
        </article>
      ))}
      <div className="demo-disclaimer-card">
        <AlertTriangle size={18} />
        <p>Based on allocation, not historical performance. Add monitoring data for higher confidence.</p>
      </div>
    </div>
  );
}

function WavesScene() {
  return (
    <div className="demo-wave-timeline">
      {migrationWaves.map((wave) => (
        <article key={wave.label} className="demo-wave-card">
          <span>{wave.label}</span>
          <strong>{wave.title}</strong>
          <small>{wave.count}</small>
          <p>{wave.description}</p>
        </article>
      ))}
    </div>
  );
}

function AdvisoryScene() {
  return (
    <div className="demo-advisory-layout">
      <div className="demo-advisory-callout">
        <ShieldCheck size={22} />
        <p>
          Backup evidence was not provided. Do not include critical workloads in early waves until restore points are validated.
        </p>
      </div>
      <div className="demo-advisory-grid">
        {advisoryItems.map((item) => (
          <article key={item.title} className="demo-advisory-card">
            <strong>{item.title}</strong>
            <p>{item.body}</p>
          </article>
        ))}
      </div>
      <p className="demo-scene-note">AI Advisory supports the assessment. It does not replace deterministic readiness and confidence scores.</p>
    </div>
  );
}

function ReportScene() {
  return (
    <div className="demo-report-layout">
      <div className="demo-report-preview">
        <div className="demo-report-topline">
          <span>Executive-ready PDF preview</span>
          <strong>{acmeDataset.client}</strong>
        </div>
        <div className="demo-report-score-row">
          <div>
            <span>Readiness Score</span>
            <strong>{acmeDataset.readinessScore}%</strong>
          </div>
          <div>
            <span>Confidence Score</span>
            <strong>{acmeDataset.evidenceConfidence}%</strong>
          </div>
        </div>
        <div className="demo-report-section-grid">
          {reportSections.map((section) => (
            <span key={section}>
              <CheckCircle2 size={14} />
              {section}
            </span>
          ))}
        </div>
      </div>
      <div className="demo-does-not-mini">
        <strong>Clear limitations</strong>
        {demoDoesNotDo.slice(0, 4).map((item) => (
          <span key={item}>
            <Minus size={14} />
            {item}
          </span>
        ))}
        <span>
          <Lock size={14} />
          Simulated demo only.
        </span>
      </div>
    </div>
  );
}
