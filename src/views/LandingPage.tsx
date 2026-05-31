"use client";

import { useEffect, useState, type FormEvent } from "react";
import Image from "next/image";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import SavingsCalculator from "../components/SavingsCalculator";
import Features from "../components/Features";
import Process from "../components/Process";
import Footer from "../components/Footer";
import vmwareLogo from "../../images/vmware.svg";
import proxmoxLogo from "../../images/proxmox.svg";
import {
  ArrowRight,
  ShieldCheck,
  HelpCircle,
  BarChart3,
  FileText,
  Shield,
  Layers,
  Search,
  Check,
  TrendingUp,
  ShieldAlert,
  Database,
  FileSpreadsheet,
  DollarSign,
  AlertTriangle,
  Building2,
  Factory,
  HeartPulse,
  Network,
  X,
} from "lucide-react";

const appCopy = {
  methodology: "Methodology",
  credibilityTitle: "Enterprise advisory discipline, powered by specialized AI.",
  credibilityBody:
    "Our methodology was designed from the ground up by a former VMware Technical Account Manager to deliver the same depth of risk review, evidence audit, and architecture design as major specialized consulting firms—at software scale.",
  formerTam: "AI Engine Trained on TAM Methodology",
  formerTamBody: "Simulates real-world enterprise advisory guidelines, not generic chatbot templates.",
  evidence: "No Push-Button Guesswork",
  evidenceBody: "Unlike simple technical parsers, every finding combines configuration facts with contextual policy inputs.",
  noProd: "No production changes",
  noProdBody: "Read-only assessment. Zero agents, zero credentials, zero impact on running workloads.",
  outputs: "Audit-Ready Deliverables",
  outputsBody: "Professional, boardroom-ready reports ready for engineering review and executive sign-off.",
  disclaimer: "Independent methodology. Not affiliated with, endorsed by or certified by VMware/Broadcom.",
  faqTitle: "Frequently Asked Questions",
  ctaTitle: "Start Your VMware Readiness Assessment",
  ctaPain: "VMware exit decisions need evidence, not guesses.",
  ctaBody: "Initialize an evidence-backed audit of cost exposure, migration blockers, storage destination readiness and Ceph suitability today.",
  ctaInput: "Enter corporate email",
  ctaBtn: "Initialize Assessment",
  noAgents: "No ESXi agents required",
  readOnly: "Read-only configuration check",
  footerTag: "Platform",
  resourcesTag: "Resources",
  checklist: "Get Free Migration Checklist",
  footerText: "Stay updated on license saving calculators and pre-migration scripts.",
  copyright: "All rights reserved.",
  footerBottom: "Open-source infrastructure. Enterprise-grade migration readiness.",
  footerLegal:
    "Shift Evidence is an independent assessment service. It is not affiliated with, endorsed by or certified by VMware, Broadcom or Proxmox. VMware, Broadcom and Proxmox names may be trademarks of their respective owners and are used only to describe migration context and compatibility targets.",
} as const;

const landingFaqs = [
  {
    q: "Is this just an automatic parser that converts my configuration files?",
    a: "No. While other tools act as basic parsers or simple calculators, Shift Evidence is the first cognitive AI copilot specifically trained for VMware exits. It takes your RVTools or CSV inventory and combines it with a contextual intake form (workload policies, maintenance constraints, risk appetite) to generate a complete senior consulting assessment.",
  },
  {
    q: "How does this compare to traditional consulting firms or a VMware TAM?",
    a: "Traditional consulting (like IBM, Deloitte, or Accenture) relies on manual human interviews and static templates that take weeks and cost tens of thousands of dollars. Shift Evidence productizes this process, using guardrailed AI to evaluate storage configurations, license deltas, and risk roadmap waves in minutes at a fraction of the cost.",
  },
  {
    q: "Is this target storage recommendation only for Ceph?",
    a: "No. Shift Evidence is storage-agnostic first. It evaluates local ZFS, existing SAN/NAS/NFS and Ceph when relevant. Ceph is never treated as the default recommendation; it requires evidence for hardware, network, failure domains, backup and operational readiness.",
  },
  {
    q: "Do I need a credit card to start?",
    a: "No. You can start with the Free Readiness Check. Paid reports and Pro features are selected when you decide to unlock deeper analysis or delivery outputs.",
  },
  {
    q: "What happens after I buy a report?",
    a: "Your assessment workspace is upgraded to the selected report level. The platform uses the evidence you uploaded to generate the corresponding readiness outputs, and you can continue adding evidence to improve confidence where supported.",
  },
  {
    q: "Can I upgrade later?",
    a: "Yes. You can start with a free assessment and upgrade when you need a full report, storage readiness, Advisor access or blueprint-level planning.",
  },
  {
    q: "Is Storage Readiness included?",
    a: "Storage Destination Readiness is included in Pro-level analysis or higher, depending on the selected plan. It can use manual, agentless Proxmox/Ceph/PBS evidence to improve confidence.",
  },
  {
    q: "Is the Senior Migration Advisor included?",
    a: "The Senior Migration Advisor is available in Pro or higher plans, where it can use assessment context, storage evidence and approved project memory to help explain findings and next steps.",
  },
  {
    q: "Can MSPs or consultants use Shift Evidence with clients?",
    a: "Yes. Partner plans are designed for consultants, MSPs and integrators who need repeatable assessments, client-ready reports and a structured migration readiness workflow.",
  },
  {
    q: "Can I request an invoice or billing support?",
    a: "Yes. Billing questions, invoices and enterprise purchasing requests can be routed through billing support.",
  },
];

const industryEvaluations = [
  {
    id: "manufacturing-readiness",
    caseId: "SECURE DOSSIER #SR-MFR-91",
    readinessScore: 68,
    confidenceScore: 54,
    label: "MANUFACTURING",
    Icon: Factory,
    quote: "A mixed VMware estate with ERP, SQL and file services required wave planning before any Proxmox pilot.",
    tags: ["Renewal", "Cost risk", "Pilot"],
    title: "Manufacturing environment preparing for VMware renewal",
    industry: "Manufacturing / industrial operations",
    scenario:
      "A mixed VMware estate included production file services, database workloads and operational systems under renewal cost pressure.",
    keySignals: [
      "ERP, SQL and file services needed separate risk treatment",
      "Early pilot candidates existed, but not among critical workloads",
      "Backup and dependency evidence would materially change confidence",
      "Financial exposure needed to be separated from technical migration risk",
    ],
    readinessInterpretation:
      "The environment was suitable for an initial readiness assessment, but critical workloads should not enter early waves without backup and dependency validation.",
    evidenceGaps: ["Backup validation", "Application dependency map", "Pilot rollback assumptions"],
    suggestedNextStep: "Run a controlled pilot with low-risk workloads first.",
  },
  {
    id: "financial-services",
    caseId: "SECURE DOSSIER #SR-FIN-33",
    readinessScore: 74,
    confidenceScore: 48,
    label: "FINANCIAL SERVICES",
    Icon: Building2,
    quote: "The inventory looked manageable, but evidence confidence was limited by backup and dependency gaps.",
    tags: ["Evidence", "Risk", "Governance"],
    title: "Financial services environment with limited evidence confidence",
    industry: "Financial services / governed operations",
    scenario:
      "A VMware inventory appeared technically manageable, but approval for production waves depended on stronger operational evidence.",
    keySignals: [
      "VM size alone did not explain migration risk",
      "Missing backup proof lowered confidence",
      "Application dependency mapping was incomplete",
      "Production sequencing required documented validation gates",
    ],
    readinessInterpretation:
      "The assessment could identify candidate groups, but risk was not only VM size - it was missing proof around recovery, dependencies and ownership.",
    evidenceGaps: ["Backup restore evidence", "Application dependency data", "Business owner validation"],
    suggestedNextStep: "Add backup evidence and dependency mapping before approving production waves.",
  },
  {
    id: "healthcare-regulated-operations",
    caseId: "SECURE DOSSIER #SR-MED-84",
    readinessScore: 59,
    confidenceScore: 62,
    label: "HEALTHCARE / REGULATED OPERATIONS",
    Icon: HeartPulse,
    quote: "Migration sequencing depended on business criticality, not only VM metrics.",
    tags: ["Continuity", "Criticality", "Validation"],
    title: "Healthcare-style operation with sensitive workloads",
    industry: "Healthcare / regulated operations",
    scenario:
      "Several workloads required manual review because downtime tolerance, compliance requirements and recovery expectations were not fully documented.",
    keySignals: [
      "Sensitive workloads could not be treated as early candidates",
      "Downtime tolerance was not consistently documented",
      "Recovery expectations needed owner confirmation",
      "Risk interpretation required business context, not just infrastructure metrics",
    ],
    readinessInterpretation:
      "The readiness view separated potential cost pressure from operational risk. Proxmox could be evaluated, but sensitive systems needed explicit validation before any migration wave.",
    evidenceGaps: ["RPO/RTO expectations", "Maintenance windows", "Application owner confirmation"],
    suggestedNextStep: "Validate owners, RPO/RTO expectations and maintenance windows before wave planning.",
  },
  {
    id: "msp-it-services",
    caseId: "SECURE DOSSIER #SR-MSP-15",
    readinessScore: 82,
    confidenceScore: 70,
    label: "MSP / IT SERVICES",
    Icon: Network,
    quote: "A repeatable assessment workflow turned raw RVTools exports into client-ready reports and next steps.",
    tags: ["Clients", "Pipeline", "Qualification"],
    title: "MSP workflow for qualifying VMware to Proxmox opportunities",
    industry: "MSP / IT services",
    scenario:
      "Multiple client environments had different sizes, urgency levels and evidence quality, making pre-sales prioritization difficult.",
    keySignals: [
      "Not every VMware environment justified the same technical effort",
      "Evidence quality helped prioritize follow-up work",
      "Client conversations needed a consistent report structure",
      "Commercial next steps depended on readiness and confidence, not only VM count",
    ],
    readinessInterpretation:
      "Standardized evidence review helped identify which environments were ready for a professional assessment, which needed more data and which required a deeper blueprint.",
    evidenceGaps: ["Client context", "Backup evidence", "Target Proxmox assumptions"],
    suggestedNextStep: "Use readiness reports to qualify blueprint or professional assessment opportunities.",
  },
] as const;

const privacyNote =
  "This is a representative, synthetic/anonymized-style evaluation example. It does not contain customer data and is not a public case study, testimonial, or verified customer review.";

export default function LandingPage() {
  const [ctaEmail, setCtaEmail] = useState("");
  const [selectedEvaluationId, setSelectedEvaluationId] = useState<string | null>(null);
  const selectedEvaluation = industryEvaluations.find((evaluation) => evaluation.id === selectedEvaluationId);

  const handleOpenScanner = () => {
    window.location.href = "/sign-up";
  };

  const handleCtaSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    window.location.href = `/sign-up?email=${encodeURIComponent(ctaEmail)}`;
  };

  useEffect(() => {
    if (!selectedEvaluationId) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedEvaluationId(null);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedEvaluationId]);

  return (
    <>
      <Navbar />

      <main style={{ flexGrow: 1 }}>
        <Hero onOpenScanner={handleOpenScanner} />

        <section id="problem-pain" className="section pain-section">
          <div className="bg-mesh"></div>
          <div className="container">
            <div className="text-center mb-8">
              <div className="badge badge-cyan">The Transition Challenge</div>
              <h2 className="mb-4">Why VMware Exits Stall Before They Start</h2>
              <p className="mx-auto" style={{ maxWidth: "650px" }}>
                Broadcom licensing shifts are forcing teams to rethink vSphere. But moving core hypervisors without solid evidence introduces critical business risks.
              </p>
            </div>

            <div className="pain-grid">
              <div className="pain-card warning">
                <div className="pain-icon-wrapper">
                  <TrendingUp size={22} />
                </div>
                <h3>Broadcom Cost Exposure</h3>
                <p>
                  Unpredictable licensing bundles and steep pricing increases are blowing up IT budgets. Teams are forced to pay for unused features.
                </p>
              </div>

              <div className="pain-card">
                <div className="pain-icon-wrapper">
                  <ShieldAlert size={22} />
                </div>
                <h3>Migration Risk & Downtime</h3>
                <p>
                  Moving live production workloads to Proxmox VE without architectural validation risks data loss, storage mismatches, and system disruption.
                </p>
              </div>

              <div className="pain-card warning">
                <div className="pain-icon-wrapper">
                  <Database size={22} />
                </div>
                <h3>Blind Decisions</h3>
                <p>
                  Without a validated configuration inventory, teams guess target capacity, overlook backup requirements, and miss critical storage dependencies.
                </p>
              </div>
            </div>
          </div>
        </section>


        <section className="credibility-strip">
          <div className="bg-mesh"></div>
          <div className="container">
            <div className="credibility-header">
              <div className="badge badge-cyan">{appCopy.methodology}</div>
              <h2 className="credibility-title">{appCopy.credibilityTitle}</h2>
              <p className="credibility-body">{appCopy.credibilityBody}</p>
            </div>

            <div className="credibility-cards">
              <div className="cred-card">
                <div className="cred-card-icon cred-icon-cyan">
                  <Shield size={22} />
                </div>
                <div className="cred-card-text">
                  <strong>{appCopy.formerTam}</strong>
                  <span>{appCopy.formerTamBody}</span>
                </div>
              </div>
              <div className="cred-card">
                <div className="cred-card-icon cred-icon-cyan">
                  <BarChart3 size={22} />
                </div>
                <div className="cred-card-text">
                  <strong>{appCopy.evidence}</strong>
                  <span>{appCopy.evidenceBody}</span>
                </div>
              </div>
              <div className="cred-card">
                <div className="cred-card-icon cred-icon-emerald">
                  <ShieldCheck size={22} />
                </div>
                <div className="cred-card-text">
                  <strong>{appCopy.noProd}</strong>
                  <span>{appCopy.noProdBody}</span>
                </div>
              </div>
              <div className="cred-card">
                <div className="cred-card-icon cred-icon-cyan">
                  <FileText size={22} />
                </div>
                <div className="cred-card-text">
                  <strong>{appCopy.outputs}</strong>
                  <span>{appCopy.outputsBody}</span>
                </div>
              </div>
            </div>

            <div className="credibility-footer">
              <span className="credibility-disclaimer">{appCopy.disclaimer}</span>
            </div>
          </div>
        </section>

        <section id="readiness-showcase" className="section shiftreadiness-promo-showcase-section">
          <div className="bg-mesh"></div>
          <div className="container">
            <div className="glass-card shiftreadiness-promo-showcase">
              <div className="sr-showcase-copy">
                <div className="badge badge-cyan">AI Advisory Platform</div>
                <h2>AI-guided infrastructure assessments.</h2>
                <p>
                  Shift Evidence models the technical and business realities of your VMware exit. Upload your evidence and complete our contextual intake form to draft your boardroom-ready advisory report in minutes.
                </p>
                
                <ul className="sr-showcase-features">
                  <li>
                    <div className="sr-showcase-feature-icon">
                      <Search size={18} />
                    </div>
                    <div>
                      <strong>Evidence-Based Ingestion</strong>
                      <span>Upload your RVTools or vSphere exports. Zero agents, read-only configuration.</span>
                    </div>
                  </li>
                  <li>
                    <div className="sr-showcase-feature-icon">
                      <BarChart3 size={18} />
                    </div>
                    <div>
                      <strong>Licensing & Cost Exposure</strong>
                      <span>Compare VMware/Broadcom renewal exposure with Proxmox subscription scenarios using approved pricing snapshots. Not a vendor quote.</span>
                    </div>
                  </li>
                  <li>
                    <div className="sr-showcase-feature-icon">
                      <Layers size={18} />
                    </div>
                    <div>
                      <strong>Storage & Ceph Readiness</strong>
                      <span>Evaluate ZFS local, existing NFS/SAN or Ceph with missing evidence, network, backup and operations caveats.</span>
                    </div>
                  </li>
                  <li>
                    <div className="sr-showcase-feature-icon">
                      <FileText size={18} />
                    </div>
                    <div>
                      <strong>Executive PDF Reporting</strong>
                      <span>Generate decision-ready, standardized reports to present internally.</span>
                    </div>
                  </li>
                </ul>

                <div className="sr-showcase-actions">
                  <a href="/sign-up" className="btn btn-primary btn-glow">
                    Start Free Assessment
                    <ArrowRight size={18} />
                  </a>
                  <a href="/demo" className="btn btn-secondary">
                    Watch the readiness replay
                  </a>
                  <a href="/shiftreadiness#pricing" className="btn btn-secondary">
                    View Assessment Plans
                  </a>
                </div>
              </div>

              {/* Right Side: Mini Dashboard Mockup Preview */}
              <div className="sr-showcase-visual">
                <div className="sr-promo-mockup-panel glass-card">
                  <div className="sr-mockup-header">
                    <span className="sr-mockup-dot red"></span>
                    <span className="sr-mockup-dot yellow"></span>
                    <span className="sr-mockup-dot green"></span>
                    <span className="sr-mockup-title">ShiftReadiness Summary</span>
                  </div>

                  <div className="sr-mockup-body">
                    <div className="sr-mockup-main-row">
                      <div className="sr-mockup-gauge-container">
                        <div className="sr-mockup-gauge-circle">
                          <svg width="80" height="80" viewBox="0 0 36 36" className="sr-gauge-svg">
                            <path
                              className="sr-gauge-bg"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none"
                              stroke="rgba(255,255,255,0.06)"
                              strokeWidth="3.2"
                            />
                            <path
                              className="sr-gauge-fill"
                              strokeDasharray="84, 100"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none"
                              stroke="url(#showcaseGrad)"
                              strokeWidth="3.2"
                              strokeLinecap="round"
                            />
                            <defs>
                              <linearGradient id="showcaseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#06b6d4" />
                                <stop offset="100%" stopColor="#8b5cf6" />
                              </linearGradient>
                            </defs>
                          </svg>
                          <div className="sr-gauge-text" style={{ fontSize: '0.9rem' }}>
                            <strong style={{ fontSize: '1.1rem' }}>84%</strong>
                            <span style={{ fontSize: '0.55rem' }}>Score</span>
                          </div>
                        </div>
                        <div className="sr-mockup-badge" style={{ fontSize: '0.65rem', marginTop: '0.45rem' }}>
                          Readiness Score
                        </div>
                      </div>

                      <div className="sr-mockup-metrics">
                        <div className="sr-mockup-metric-card" style={{ padding: '0.6rem 0.85rem' }}>
                          <span className="sr-mockup-label" style={{ fontSize: '0.65rem' }}>Subscription Delta</span>
                          <strong className="sr-mockup-val text-emerald" style={{ fontSize: '1.15rem' }}>-72%</strong>
                        </div>
                        <div className="sr-mockup-metric-card" style={{ padding: '0.6rem 0.85rem' }}>
                          <span className="sr-mockup-label" style={{ fontSize: '0.65rem' }}>Annual Savings</span>
                          <strong className="sr-mockup-val text-cyan" style={{ fontSize: '1.15rem' }}>$148k</strong>
                        </div>
                      </div>
                    </div>

                    <div className="sr-mockup-inventory" style={{ paddingTop: '1rem', marginTop: '0.5rem' }}>
                      <div className="sr-inventory-stat">
                        <span>Workloads</span>
                        <strong style={{ fontSize: '0.82rem' }}>245 VMs</strong>
                      </div>
                      <div className="sr-inventory-stat">
                        <span>Storage</span>
                        <strong style={{ fontSize: '0.82rem' }}>84 TB</strong>
                      </div>
                      <div className="sr-inventory-stat">
                        <span>Risks</span>
                        <strong className="text-warning" style={{ fontSize: '0.82rem' }}>Medium</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <Features />

        <section className="section demo-cta-strip-section">
          <div className="container">
            <div className="glass-card demo-cta-strip">
              <div>
                <div className="badge badge-cyan">Simulated demo</div>
                <h2>See the assessment before you start.</h2>
                <p>
                  Watch a simulated VMware {"->"} Proxmox readiness replay and see how a raw RVTools export becomes a professional migration decision pack: evidence coverage, VM risk classification, Proxmox sizing, migration waves, AI Advisory notes and an executive-ready PDF report.
                </p>
                <div className="demo-mini-badge-row">
                  <span>No agents</span>
                  <span>No production access</span>
                  <span>Starts with RVTools</span>
                  <span>Evidence-based</span>
                </div>
              </div>
              <div className="sample-report-cta-pair">
                <a href="/demo" className="btn btn-primary btn-glow">
                  Watch the readiness replay
                  <ArrowRight size={18} />
                </a>
                <a href="/sample-report" className="btn btn-secondary">
                  View sample report
                </a>
              </div>
            </div>
          </div>
        </section>

        <SavingsCalculator />

        {/* 5. Sample Output / What You Get */}
        <section id="sample-output" className="section sample-output-section">
          <div className="bg-mesh"></div>
          <div className="container">
            <div className="text-center mb-8">
              <div className="badge">Diagnostic Report</div>
              <h2 className="mb-4">Your Migration Baseline: What You Get</h2>
              <p className="mx-auto" style={{ maxWidth: "650px" }}>
                Shift Evidence compiles your cluster configuration and inventory details into actionable, decision-ready reports.
              </p>
            </div>

            <div className="sample-output-grid">
              <div className="sample-card">
                <div className="sample-card-header">
                  <div className="sample-card-icon">
                    <BarChart3 size={20} />
                  </div>
                  <h3>Readiness Scorecard</h3>
                  <p>A standardized compatibility index showing what percentage of your configurations map natively to Proxmox VE targets.</p>
                </div>
                <div className="sample-card-tag">Readiness Score</div>
              </div>

              <div className="sample-card">
                <div className="sample-card-header">
                  <div className="sample-card-icon">
                    <AlertTriangle size={20} />
                  </div>
                  <h3>Migration Blockers</h3>
                  <p>Early warning flags for nested switches, vSAN layouts, incompatible CPU configurations, and raw device mapping dependencies.</p>
                </div>
                <div className="sample-card-tag">Risk Index</div>
              </div>

              <div className="sample-card">
                <div className="sample-card-header">
                  <div className="sample-card-icon">
                    <DollarSign size={20} />
                  </div>
                  <h3>Licensing & Cost Exposure</h3>
                  <p>Directional VMware/Broadcom renewal exposure versus Proxmox subscription scenarios using approved pricing snapshots. Not a vendor quote.</p>
                </div>
                <div className="sample-card-tag">Financial Plan</div>
              </div>

              <div className="sample-card">
                <div className="sample-card-header">
                  <div className="sample-card-icon">
                    <FileSpreadsheet size={20} />
                  </div>
                  <h3>Evidence Gaps Log</h3>
                  <p>Identifies missing backups, undocumented network port groups, and sizing metrics that need validation before staging.</p>
                </div>
                <div className="sample-card-tag">Data Completeness</div>
              </div>

              <div className="sample-card">
                <div className="sample-card-header">
                  <div className="sample-card-icon">
                    <Layers size={20} />
                  </div>
                  <h3>Storage & Ceph Readiness</h3>
                  <p>Evidence-based storage destination view for ZFS local, existing NFS/SAN or Ceph, including missing evidence and operational caveats.</p>
                </div>
                <div className="sample-card-tag">Architecture Target</div>
              </div>

              <div className="sample-card">
                <div className="sample-card-header">
                  <div className="sample-card-icon">
                    <Check size={20} />
                  </div>
                  <h3>Recommended Next Actions</h3>
                  <p>A staged checklist outlining migration wave prioritization, backup validation steps, and pilot cluster targets.</p>
                </div>
                <div className="sample-card-tag">Execution Waves</div>
              </div>
            </div>
          </div>
        </section>

        <Process />

        <section
          id="industry-evaluations"
          className="section industry-evaluations-section"
          aria-labelledby="industry-evaluations-title"
        >
          <div className="bg-mesh"></div>
          <div className="container">
            <div className="industry-evaluations-header">
              <div className="badge badge-cyan">Representative examples</div>
              <h2 id="industry-evaluations-title">What our customers are saying</h2>
              <p>
                Private infrastructure assessments involve sensitive cost and risk data, so these examples are shown by
                industry without company names or identifying details.
              </p>
            </div>

            <div className="industry-evaluation-grid">
              {industryEvaluations.map((evaluation) => {
                const Icon = evaluation.Icon;

                return (
                  <button
                    key={evaluation.id}
                    type="button"
                    className="case-dossier-card"
                    onClick={() => setSelectedEvaluationId(evaluation.id)}
                    aria-haspopup="dialog"
                  >
                    <div className="case-dossier-header">
                      <span className="case-dossier-id">{evaluation.caseId}</span>
                      <span className="case-dossier-badge">
                        <span className="case-dossier-badge-glow" />
                        Anonymized-style
                      </span>
                    </div>

                    <div className="case-dossier-title">
                      <div className="case-dossier-icon">
                        <Icon size={20} />
                      </div>
                      <span className="case-dossier-label">{evaluation.label}</span>
                    </div>

                    <p className="case-dossier-quote">&ldquo;{evaluation.quote}&rdquo;</p>

                    <div className="case-dossier-metrics">
                      <div className="case-dossier-metric-row">
                        <div className="case-dossier-metric-label">
                          <span>Readiness</span>
                          <span>{evaluation.readinessScore}%</span>
                        </div>
                        <div className="case-dossier-metric-track">
                          <div className="case-dossier-metric-fill" style={{ width: `${evaluation.readinessScore}%` }} />
                        </div>
                      </div>
                      <div className="case-dossier-metric-row">
                        <div className="case-dossier-metric-label">
                          <span>Evidence Confidence</span>
                          <span>{evaluation.confidenceScore}%</span>
                        </div>
                        <div className="case-dossier-metric-track">
                          <div className="case-dossier-metric-fill" style={{ width: `${evaluation.confidenceScore}%`, background: 'linear-gradient(90deg, #8b5cf6, #ec4899)' }} />
                        </div>
                      </div>
                    </div>

                    <div className="case-dossier-tags">
                      {evaluation.tags.map((tag) => (
                        <span key={tag} className="case-dossier-tag">{tag}</span>
                      ))}
                    </div>

                    <span className="case-dossier-link">
                      View evaluation
                      <ArrowRight size={15} />
                    </span>
                  </button>
                );
              })}
            </div>

          </div>
        </section>

        <section id="faq" className="section faq-section">
          <div className="container">
            <div className="text-center mb-8">
              <div className="badge badge-cyan">FAQ</div>
              <div className="faq-brands">
                <div className="faq-brand vmware">
                  <Image src={vmwareLogo} alt="VMware Logo" width={18} height={18} className="faq-brand-logo" />
                  VMware
                </div>
                <ArrowRight size={16} className="cta-arrow" />
                <div className="faq-brand proxmox">
                  <Image src={proxmoxLogo} alt="Proxmox Logo" width={18} height={18} className="faq-brand-logo" />
                  Proxmox
                </div>
              </div>
              <h2 className="mb-4">{appCopy.faqTitle}</h2>
            </div>
            <div className="faq-list">
              {landingFaqs.map((faq, index) => (
                <div key={index} className="faq-item">
                  <div className="faq-q">{faq.q}</div>
                  <div className="faq-a">{faq.a}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="final-cta" className="section cta-section" style={{ background: "rgba(6, 9, 19, 0.4)" }}>
          <div className="bg-mesh"></div>
          <div
            className="glow-orb"
            style={{
              top: "20%",
              left: "20%",
              width: "350px",
              height: "350px",
              background: "rgba(184, 54, 59, 0.08)",
            }}
          ></div>
          <div
            className="glow-orb"
            style={{
              bottom: "10%",
              right: "15%",
              width: "300px",
              height: "300px",
              background: "rgba(229, 112, 0, 0.08)",
            }}
          ></div>

          <div className="container">
            <div className="glass-card cta-box">
              <div className="cta-brands">
                <div className="cta-brand vmware">
                  <Image src={vmwareLogo} alt="VMware Logo" width={18} height={18} className="cta-brand-logo" />
                  VMware
                </div>
                <ArrowRight size={18} className="cta-arrow" />
                <div className="cta-brand proxmox">
                  <Image src={proxmoxLogo} alt="Proxmox Logo" width={18} height={18} className="cta-brand-logo" />
                  Proxmox
                </div>
              </div>

              <h2 className="mb-2" style={{ color: "white" }}>
                {appCopy.ctaTitle}
              </h2>
              <p className="cta-subtitle">
                <span className="cta-pain">{appCopy.ctaPain}</span> {appCopy.ctaBody}
              </p>

              <form onSubmit={handleCtaSubmit} className="cta-form">
                <input
                  type="email"
                  placeholder={appCopy.ctaInput}
                  required
                  className="form-input"
                  value={ctaEmail}
                  onChange={(e) => setCtaEmail(e.target.value)}
                />
                <button type="submit" className="btn btn-primary btn-glow cta-btn">
                  {appCopy.ctaBtn}
                  <ArrowRight size={18} />
                </button>
              </form>

              <div className="cta-trust">
                <div className="cta-trust-item">
                  <ShieldCheck size={18} />
                  <span>{appCopy.noAgents}</span>
                </div>
                <div className="cta-trust-item">
                  <HelpCircle size={18} />
                  <span>{appCopy.readOnly}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section" aria-labelledby="public-trust-title" style={{ paddingTop: "3rem" }}>
          <div className="container">
            <div className="glass-card assessment-section">
              <div className="assessment-section-title">
                <div className="assessment-section-eyebrow">
                  <ShieldCheck size={18} />
                  <span>Trust and support</span>
                </div>
                <h2 id="public-trust-title">Clear boundaries before you share migration evidence.</h2>
                <p>
                  Shift Evidence is an independent assessment service with workspace-level separation,
                  no production agents, and explicit support paths for technical, security, privacy, and
                  partner questions.
                </p>
              </div>
              <div className="assessment-preview-grid">
                <article className="assessment-preview-card">
                  <span className="assessment-preview-label">Security</span>
                  <strong>No credentials</strong>
                  <p>Support requests should never include passwords, tokens, secrets, or raw private files.</p>
                </article>
                <article className="assessment-preview-card">
                  <span className="assessment-preview-label">Privacy</span>
                  <strong>Assessment scoped</strong>
                  <p>Project context stays tied to the relevant workspace and assessment boundary.</p>
                </article>
                <article className="assessment-preview-card">
                  <span className="assessment-preview-label">Support</span>
                  <strong>Manual review</strong>
                  <p>Questions are routed through a simple support workflow, without live chat or automated SLA.</p>
                </article>
              </div>
              <div className="assessment-inline-actions">
                <a href="/about" className="btn btn-secondary">
                  About Shift Evidence
                </a>
                <a href="/support" className="dashboard-card-link">
                  Contact support <ArrowRight size={16} />
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="section" aria-labelledby="returning-user-title" style={{ paddingTop: "0" }}>
          <div className="container">
            <div className="glass-card assessment-section">
              <div className="assessment-section-title">
                <div className="assessment-section-eyebrow">
                  <ShieldCheck size={18} />
                  <span>Client access</span>
                </div>
                <h2 id="returning-user-title">Already have an account?</h2>
                <p>
                  Return to your workspace to continue an assessment, review uploaded evidence,
                  access reports, view recent support requests, or continue working with your migration advisor.
                </p>
              </div>
              <div className="assessment-inline-actions">
                <a href="/client-login" className="btn btn-secondary">
                  Go to client login
                </a>
                <a href="/dashboard" className="dashboard-card-link">
                  Return to dashboard <ArrowRight size={16} />
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      {selectedEvaluation ? (
        <div
          className="industry-evaluation-modal-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedEvaluationId(null);
            }
          }}
        >
          <div
            className="glass-card industry-evaluation-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`industry-evaluation-modal-title-${selectedEvaluation.id}`}
          >
            <button
              type="button"
              className="industry-evaluation-modal-close"
              onClick={() => setSelectedEvaluationId(null)}
              aria-label="Close evaluation"
            >
              <X size={18} />
            </button>

            <div className="industry-evaluation-modal-kicker">
              <span>Private evaluation example</span>
              <strong>{selectedEvaluation.industry}</strong>
            </div>

            <h2 id={`industry-evaluation-modal-title-${selectedEvaluation.id}`}>{selectedEvaluation.title}</h2>

            <div className="industry-evaluation-modal-grid">
              <div>
                <h3>Scenario</h3>
                <p>{selectedEvaluation.scenario}</p>
              </div>
              <div>
                <h3>Suggested next step</h3>
                <p>{selectedEvaluation.suggestedNextStep}</p>
              </div>
            </div>

            <div className="industry-evaluation-modal-block">
              <h3>Key signals</h3>
              <ul>
                {selectedEvaluation.keySignals.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="industry-evaluation-modal-block industry-evaluation-result">
              <h3>Readiness interpretation</h3>
              <p>{selectedEvaluation.readinessInterpretation}</p>
            </div>

            <div className="industry-evaluation-modal-block">
              <h3>Evidence gaps</h3>
              <ul>
                {selectedEvaluation.evidenceGaps.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="industry-evaluation-privacy">
              <strong>Disclaimer</strong>
              <p>{privacyNote}</p>
            </div>
          </div>
        </div>
      ) : null}

      <Footer />
    </>
  );
}

