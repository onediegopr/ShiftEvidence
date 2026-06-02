import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Brain,
  CheckCircle2,
  Database,
  Download,
  FileText,
  Lock,
  Network,
  ShieldCheck,
  Sparkles,
  Waves,
} from "lucide-react";
import Footer from "../Footer";
import Navbar from "../Navbar";
import DemoWorkspaceBanner from "./DemoWorkspaceBanner";
import { demoScenarios, demoWorkspaceCopy, getPrimaryDemoScenario, type DemoScenario } from "../../server/demo/demoDatasets";

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
              <div className="badge badge-cyan">Demo Workspace</div>
              <h1>{demoWorkspaceCopy.title}</h1>
              <p className="demo-hero-subtitle">{demoWorkspaceCopy.subtitle}</p>
              <p className="demo-hero-body">
                Explore a complete synthetic VMware -&gt; Proxmox readiness assessment before purchasing. No upload
                required. No credentials. No production access. This demo is read-only and uses synthetic infrastructure
                data.
              </p>
              <div className="shiftreadiness-actions">
                <a href={`#${primary.slug}`} className="btn btn-primary btn-glow">
                  Explore a Sample Assessment
                  <ArrowRight size={18} />
                </a>
                <Link href="/pricing" className="btn btn-secondary">
                  View Plans
                </Link>
                <Link href="/sign-up" className="btn btn-secondary">
                  Start a Paid Assessment
                </Link>
              </div>
            </div>

            <aside className="glass-card demo-workspace-orbit" aria-label="Demo Workspace summary">
              <div className="demo-workspace-orbit-core">
                <Sparkles size={26} />
                <strong>8</strong>
                <span>synthetic scenarios</span>
              </div>
              <div className="demo-workspace-orbit-grid">
                <span><BarChart3 size={16} /> scoring</span>
                <span><Database size={16} /> storage</span>
                <span><Network size={16} /> dependencies</span>
                <span><FileText size={16} /> PDFs</span>
              </div>
            </aside>
          </div>
        </section>

        <section className="section demo-workspace-explainer">
          <div className="container demo-workspace-info-grid">
            <article className="glass-card">
              <h2>What this demo is</h2>
              <p>{demoWorkspaceCopy.intro}</p>
            </article>
            <article className="glass-card">
              <h2>What you can explore</h2>
              <ul>
                {[
                  "Readiness and confidence scores",
                  "VM risk matrix and evidence gaps",
                  "Business continuity risks",
                  "Licensing and cost exposure",
                  "Storage Destination Readiness",
                  "Migration waves and Advisor transcript",
                ].map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
            <article className="glass-card">
              <h2>What is intentionally disabled</h2>
              <ul>
                {disabledActions.map((item) => (
                  <li key={item}><Lock size={14} />{item}</li>
                ))}
              </ul>
            </article>
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
