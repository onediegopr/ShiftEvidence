import Link from "next/link";
import Image from "next/image";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Brain,
  CheckCircle2,
  Database,
  Download,
  Lock,
  ShieldCheck,
  Sparkles,
  Waves,
} from "lucide-react";
import Footer from "../Footer";
import Navbar from "../Navbar";
import DemoWorkspaceBanner from "./DemoWorkspaceBanner";
import { demoScenarios, demoWorkspaceCopy, getPrimaryDemoScenario, type DemoScenario } from "../../server/demo/demoDatasets";
import vmwareLogo from "../../../images/vmware.svg";
import proxmoxLogo from "../../../images/proxmox.svg";

const disabledActions = [
  "Uploading your own files",
  "Creating new assessments",
  "Editing forms or evidence",
  "Live AI Advisor chat",
  "Admin, billing and entitlement actions",
];

const unlocks = [
  "Private assessment workspace",
  "RVTools and approved evidence upload",
  "Persistent report generation",
  "Live Senior Advisor within plan limits",
  "Customer-specific risk scoring",
  "Commercial support and upgrade paths",
];

const workspaceHeroSignals = [
  "Read-only synthetic dataset",
  "VM risk and evidence confidence",
  "Waves, sizing and report outputs",
];

const workspaceRadarAxes = [
  { label: "Risk mapping", score: 88, detail: "21 blocker patterns", tone: "blue", angle: -96, reach: 0.78, cardClassName: "demo-workspace-web-node-1" },
  { label: "Storage fit", score: 67, detail: "9 datastore paths", tone: "violet", angle: -28, reach: 1.02, cardClassName: "demo-workspace-web-node-2" },
  { label: "Target sizing", score: 82, detail: "4-wave landing plan", tone: "emerald", angle: 18, reach: 1.14, cardClassName: "demo-workspace-web-node-3" },
  { label: "Decision pack", score: 93, detail: "Board-ready PDF", tone: "cyan", angle: 72, reach: 0.92, cardClassName: "demo-workspace-web-node-4" },
  { label: "Advisor depth", score: 76, detail: "8 scenario overlays", tone: "violet", angle: 142, reach: 0.84, cardClassName: "demo-workspace-web-node-5" },
  { label: "RVTools intake", score: 61, detail: "74 VMs baseline", tone: "blue", angle: 204, reach: 1.08, cardClassName: "demo-workspace-web-node-6" },
];

const workspaceRadarFootnotes = [
  "Public synthetic dataset",
  "Bias-weighted decision surface",
  "Visible score-to-signal bias",
];

function polarPoint(angleDegrees: number, radius: number) {
  const radians = (angleDegrees * Math.PI) / 180;
  return {
    x: 50 + Math.cos(radians) * radius,
    y: 50 + Math.sin(radians) * radius,
  };
}

function toSvgPoint(point: { x: number; y: number }) {
  return `${point.x.toFixed(2)},${point.y.toFixed(2)}`;
}

const workspaceRadarRingScales = [0.28, 0.48, 0.68, 0.88];
const workspaceRadarRingPolygons = workspaceRadarRingScales.map((scale) =>
  workspaceRadarAxes.map((axis) => toSvgPoint(polarPoint(axis.angle, axis.reach * 37 * scale))).join(" "),
);
const workspaceRadarPolygon = workspaceRadarAxes
  .map((axis) => toSvgPoint(polarPoint(axis.angle, 10 + axis.reach * 28 * (axis.score / 100))))
  .join(" ");
const workspaceRadarGeometry = workspaceRadarAxes.map((axis) => {
  const tip = polarPoint(axis.angle, axis.reach * 37.5);
  const value = polarPoint(axis.angle, 10 + axis.reach * 28 * (axis.score / 100));
  return {
    ...axis,
    tip,
    value,
  };
});

const workspaceIntroCards = [
  {
    Icon: Database,
    eyebrow: "What this demo is",
    title: "A synthetic workspace with real product structure",
    copy: demoWorkspaceCopy.intro,
    bullets: ["Scored scenarios", "Synthetic transcripts", "Downloadable reports"],
  },
  {
    Icon: BarChart3,
    eyebrow: "What you can explore",
    title: "The full decision pack flow",
    copy: "Open synthetic scenarios to inspect readiness, confidence, risk matrices, storage concerns and migration waves.",
    bullets: [
      "Readiness and confidence scores",
      "VM risk matrix and evidence gaps",
      "Licensing and cost exposure",
    ],
  },
  {
    Icon: Lock,
    eyebrow: "What is intentionally disabled",
    title: "Safe public preview boundaries",
    copy: demoWorkspaceCopy.disabled,
    bullets: disabledActions,
  },
];

function scoreTone(score: number) {
  if (score >= 75) return "good";
  if (score >= 55) return "warning";
  return "danger";
}

function ScenarioCard({ scenario }: { scenario: DemoScenario }) {
  return (
    <article className="glass-card demo-workspace-scenario-card" id={scenario.slug}>
      <div className="demo-workspace-card-top">
        <div>
          <div className="demo-workspace-badges">
            {scenario.badges.map((badge) => (
              <span key={badge}>{badge}</span>
            ))}
          </div>
          <h3>{scenario.name}</h3>
          <p>{scenario.description}</p>
        </div>
        <div className="demo-workspace-vm-count">
          <strong>{scenario.vmCount}</strong>
          <span>synthetic VMs</span>
        </div>
      </div>

      <div className="demo-workspace-score-row">
        <div className={`demo-workspace-score demo-score-${scoreTone(scenario.readinessScore)}`}>
          <span>Readiness</span>
          <strong>{scenario.readinessScore}/100</strong>
        </div>
        <div className={`demo-workspace-score demo-score-${scoreTone(scenario.confidenceScore)}`}>
          <span>Confidence</span>
          <strong>{scenario.confidenceScore}/100</strong>
        </div>
        <div className="demo-workspace-score">
          <span>Main risk</span>
          <strong>{scenario.mainRisk}</strong>
        </div>
      </div>

      <div className="demo-workspace-card-grid">
        <div>
          <h4>Evidence received</h4>
          <ul>
            {scenario.evidenceReceived.map((item) => (
              <li key={item}><CheckCircle2 size={14} />{item}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4>Evidence missing</h4>
          <ul>
            {scenario.evidenceMissing.map((item) => (
              <li key={item}><AlertTriangle size={14} />{item}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="demo-workspace-actions">
        <a href={`#detail-${scenario.slug}`} className="btn btn-primary btn-glow">
          View Demo Assessment
          <ArrowRight size={16} />
        </a>
        <a href={scenario.report.downloadPath} className="btn btn-secondary">
          Download Demo Report
          <Download size={16} />
        </a>
      </div>
    </article>
  );
}

function ScenarioDetail({ scenario }: { scenario: DemoScenario }) {
  return (
    <section id={`detail-${scenario.slug}`} className="section demo-workspace-detail-section">
      <div className="container">
        <article className="glass-card demo-workspace-detail">
          <div className="demo-workspace-detail-heading">
            <div>
              <div className="badge badge-cyan">Synthetic demo assessment</div>
              <h2>{scenario.name}</h2>
              <p>{scenario.description}</p>
              <div className="demo-badge-row">
                <span>Synthetic demo data</span>
                <span>Read-only</span>
                <span>Not a real company</span>
                <span>No customer data</span>
              </div>
            </div>
            <a href={scenario.report.downloadPath} className="btn btn-primary btn-glow">
              Download {scenario.report.filename}
              <Download size={16} />
            </a>
          </div>

          <div className="demo-workspace-metric-strip">
            <span><strong>{scenario.vmCount}</strong> VMs</span>
            <span><strong>{scenario.hostCount}</strong> hosts</span>
            <span><strong>{scenario.datastoreCount}</strong> datastores</span>
            <span><strong>{scenario.readinessScore}/100</strong> readiness</span>
            <span><strong>{scenario.confidenceScore}/100</strong> confidence</span>
          </div>

          <div className="demo-workspace-detail-grid">
            <section>
              <h3><AlertTriangle size={18} /> Top risks</h3>
              <ul className="demo-workspace-list">
                {scenario.topRisks.map((risk) => (
                  <li key={risk}>{risk}</li>
                ))}
              </ul>
            </section>
            <section>
              <h3><ShieldCheck size={18} /> Recommendations</h3>
              <ul className="demo-workspace-list">
                {scenario.recommendations.map((recommendation) => (
                  <li key={recommendation}>{recommendation}</li>
                ))}
              </ul>
            </section>
          </div>

          <section className="demo-workspace-wave-panel">
            <h3><Waves size={18} /> Migration Recommendation Plan</h3>
            <div className="demo-workspace-wave-grid">
              {scenario.migrationWaves.map((wave) => (
                <article key={`${scenario.slug}-${wave.label}`}>
                  <span>{wave.label}</span>
                  <strong>{wave.title}</strong>
                  <small>{wave.workloadCount}</small>
                  <p>{wave.description}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="demo-workspace-advisor">
            <div className="demo-workspace-panel-title">
              <Brain size={20} />
              <div>
                <h3>Senior AI Advisor - Demo Transcript</h3>
                <p>
                  This is a synthetic conversation showing how the Advisor explains migration risks inside a paid
                  assessment. Live chat is disabled in demo mode.
                </p>
              </div>
            </div>
            <div className="demo-workspace-transcript">
              {scenario.advisorTranscript.map((item) => (
                <article key={item.question}>
                  <strong>{item.question}</strong>
                  <p>{item.answer}</p>
                </article>
              ))}
            </div>
          </section>

          <p className="demo-workspace-disclaimer">{scenario.disclaimer}</p>
        </article>
      </div>
    </section>
  );
}

export default function DemoWorkspacePage() {
  const primary = getPrimaryDemoScenario();

  return (
    <>
      <Navbar />
      <main className="shiftreadiness-page demo-page demo-workspace-page">
        <DemoWorkspaceBanner />
        <section className="section demo-workspace-hero">
          <div className="bg-mesh" />
          <div className="container demo-workspace-hero-grid">
            <div className="demo-workspace-hero-copy">
              <div className="demo-workspace-route-line" aria-hidden="true">
                <span className="demo-workspace-route-pill demo-workspace-route-pill-vmware">
                  <Image src={vmwareLogo} alt="" width={16} height={16} />
                  VMware
                </span>
                <span className="demo-workspace-route-arrow">
                  <ArrowRight size={14} />
                </span>
                <span className="demo-workspace-route-pill demo-workspace-route-pill-proxmox">
                  <Image src={proxmoxLogo} alt="" width={16} height={16} />
                  Proxmox
                </span>
              </div>
              <div className="demo-workspace-kicker-row">
                <div className="badge badge-cyan">Demo Workspace</div>
                <p className="assessment-inline-note">Synthetic, read-only product tour</p>
              </div>
              <h1>{demoWorkspaceCopy.title}</h1>
              <p className="demo-hero-subtitle">{demoWorkspaceCopy.subtitle}</p>
              <p className="demo-hero-body">
                Explore a complete synthetic VMware -&gt; Proxmox readiness assessment before purchasing. No upload
                required. No credentials. No production access. This demo is read-only and uses synthetic infrastructure
                data.
              </p>
              <div className="demo-workspace-signal-strip" aria-label="Workspace signals">
                {workspaceHeroSignals.map((signal) => (
                  <span key={signal}>{signal}</span>
                ))}
              </div>
              <div className="demo-workspace-action-deck">
                <a href={`#${primary.slug}`} className="btn btn-primary btn-glow demo-workspace-primary-action">
                  <span>
                    <strong>Explore a Sample Assessment</strong>
                    <small>Open the flagship synthetic scenario and inspect the full decision pack</small>
                  </span>
                  <ArrowRight size={18} />
                </a>
                <div className="demo-workspace-secondary-actions">
                  <Link href="/demo/replay" className="demo-workspace-action-card">
                    <span>Watch Quick Simulation</span>
                    <small>Start with the guided 90-second replay</small>
                  </Link>
                  <Link href="/pricing" className="demo-workspace-action-card">
                    <span>View Plans</span>
                    <small>See what unlocks in a paid assessment</small>
                  </Link>
                  <Link href="/sign-up" className="demo-workspace-action-card demo-workspace-action-card-accent">
                    <span>Start a Paid Assessment</span>
                    <small>Create your own private workspace</small>
                  </Link>
                </div>
              </div>
            </div>

            <aside className="glass-card demo-workspace-orbit" aria-label="Demo Workspace summary">
                <div className="demo-workspace-orbit-head">
                  <div>
                    <span className="demo-workspace-orbit-kicker">Assessment preview</span>
                    <h2>Readiness signal surface</h2>
                  </div>
                  <div className="demo-workspace-orbit-badge">Synthetic telemetry</div>
                </div>
              <div className="demo-workspace-web-shell">
                <svg className="demo-workspace-web-lines" viewBox="0 0 100 100" aria-hidden="true">
                  {workspaceRadarRingPolygons.map((points, index) => (
                    <polygon key={points} points={points} className={`demo-workspace-web-ring demo-workspace-web-ring-${index + 1}`} />
                  ))}
                  {workspaceRadarGeometry.map((axis) => (
                    <g key={`axis-${axis.label}`}>
                      <line x1="50" y1="50" x2={axis.tip.x.toFixed(2)} y2={axis.tip.y.toFixed(2)} className="demo-workspace-web-axis" />
                      <circle cx={axis.tip.x.toFixed(2)} cy={axis.tip.y.toFixed(2)} r="1.65" className={`demo-workspace-web-tip demo-workspace-web-tip-${axis.tone}`} />
                      <circle cx={axis.value.x.toFixed(2)} cy={axis.value.y.toFixed(2)} r="1.25" className={`demo-workspace-web-value demo-workspace-web-value-${axis.tone}`} />
                    </g>
                  ))}
                  <polygon points={workspaceRadarPolygon} className="demo-workspace-web-surface" />
                </svg>
                <div className="demo-workspace-orbit-core">
                  <Sparkles size={24} />
                  <strong>6-axis</strong>
                  <span>migration signal mix</span>
                  <small>Scores weighted by evidence depth</small>
                </div>
                <div className="demo-workspace-web-node-grid">
                  {workspaceRadarGeometry.map((node) => (
                    <article key={node.label} className={`demo-workspace-web-node demo-workspace-web-node-${node.tone} ${node.cardClassName}`}>
                      <small>{node.label}</small>
                      <strong>{node.score}/100</strong>
                      <span>{node.detail}</span>
                      <div className="demo-workspace-web-node-bar" aria-hidden="true">
                        <div className="demo-workspace-web-node-bar-fill" style={{ width: `${node.score}%` }} />
                      </div>
                    </article>
                  ))}
                </div>
              </div>
              <div className="demo-workspace-orbit-metrics">
                {workspaceRadarGeometry.map((metric) => (
                  <div key={`metric-${metric.label}`} className={`demo-workspace-orbit-metric demo-workspace-orbit-metric-${metric.tone}`}>
                    <span>{metric.label}</span>
                    <strong>{metric.score}</strong>
                  </div>
                ))}
              </div>
              <div className="demo-workspace-orbit-footer">
                {workspaceRadarFootnotes.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
            </aside>
          </div>
        </section>

        <section className="section demo-workspace-explainer">
          <div className="container demo-workspace-info-grid">
            {workspaceIntroCards.map(({ Icon, eyebrow, title, copy, bullets }) => (
              <article key={title} className="glass-card demo-workspace-info-card">
                <div className="demo-workspace-info-head">
                  <div className="demo-workspace-info-icon">
                    <Icon size={18} />
                  </div>
                  <div>
                    <span>{eyebrow}</span>
                    <h2>{title}</h2>
                  </div>
                </div>
                <p>{copy}</p>
                <ul>
                  {bullets.map((item) => (
                    <li key={item}>
                      <CheckCircle2 size={14} />
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="section demo-workspace-selector">
          <div className="container">
            <div className="shiftreadiness-section-heading">
              <div className="badge badge-cyan">Choose a synthetic scenario</div>
              <h2>Explore the product without getting a free product.</h2>
              <p>
                Every scenario is synthetic, read-only and designed to demonstrate methodology, not to analyze your
                infrastructure.
              </p>
            </div>
            <div className="demo-workspace-scenario-grid">
              {demoScenarios.map((scenario) => (
                <ScenarioCard key={scenario.slug} scenario={scenario} />
              ))}
            </div>
          </div>
        </section>

        {demoScenarios.map((scenario) => (
          <ScenarioDetail key={scenario.slug} scenario={scenario} />
        ))}

        <section className="section demo-workspace-unlock">
          <div className="container">
            <article className="glass-card sample-report-inline-cta">
              <div>
                <div className="badge badge-cyan">What you unlock in a paid assessment</div>
                <h2>Ready to run this on your own evidence?</h2>
                <p>
                  Demo Workspace shows the methodology. Paid assessments unlock private uploads, persistent reports,
                  live Advisor access within plan limits and customer-specific evidence analysis.
                </p>
                <div className="demo-workspace-unlock-grid">
                  {unlocks.map((item) => (
                    <span key={item}><CheckCircle2 size={14} />{item}</span>
                  ))}
                </div>
              </div>
              <div className="shiftreadiness-actions">
                <Link href="/sign-up" className="btn btn-primary btn-glow">
                  Start a Paid Assessment
                  <ArrowRight size={16} />
                </Link>
                <Link href="/pricing" className="btn btn-secondary">
                  View Plans
                </Link>
              </div>
            </article>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
