"use client";

import { useState, type FormEvent } from "react";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import SavingsCalculator from "../components/SavingsCalculator";
import Features from "../components/Features";
import Process from "../components/Process";
import Footer from "../components/Footer";
import { assetSrc } from "../lib/assetSrc";
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
  q1: "Is this just an automatic parser that converts my configuration files?",
  a1: "No. While other tools act as basic parsers or simple calculators, Shift Evidence is the first cognitive AI copilot specifically trained for VMware exits. It takes your RVTools or CSV inventory and combines it with a contextual intake form (workload policies, maintenance constraints, risk appetite) to generate a complete senior consulting assessment.",
  q2: "How does this compare to traditional consulting firms or a VMware TAM?",
  a2: "Traditional consulting (like IBM, Deloitte, or Accenture) relies on manual human interviews and static templates that take weeks and cost tens of thousands of dollars. Shift Evidence productizes this process, using guardrailed AI to evaluate storage configurations, license deltas, and risk roadmap waves in minutes at a fraction of the cost.",
  q3: "Is this target storage recommendation only for Ceph?",
  a3: "No. Shift Evidence is fully storage-agnostic. It models storage compatibility across local ZFS, SAN, NAS, and Ceph environments. However, since Ceph is the preferred target for VMware-scale high-availability exits, the engine highlights optimal Ceph cluster target architectures when applicable.",
  ctaTitle: "Start Your VMware Readiness Assessment",
  ctaPain: "VMware exit decisions need evidence, not guesses.",
  ctaBody: "Initialize an evidence-backed audit of cost exposure, migration blockers, and storage target configurations today.",
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

export default function LandingPage() {
  const [ctaEmail, setCtaEmail] = useState("");
  const vmwareLogoSrc = assetSrc(vmwareLogo);
  const proxmoxLogoSrc = assetSrc(proxmoxLogo);

  const handleOpenScanner = () => {
    window.location.href = "/sign-up";
  };

  const handleCtaSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    window.location.href = `/sign-up?email=${encodeURIComponent(ctaEmail)}`;
  };

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
                      <strong>Cost & Savings Engine</strong>
                      <span>Compare current VMware license costs with Proxmox alternatives automatically.</span>
                    </div>
                  </li>
                  <li>
                    <div className="sr-showcase-feature-icon">
                      <Layers size={18} />
                    </div>
                    <div>
                      <strong>Agnostic Storage Scenario Modeling</strong>
                      <span>Validate target storage designs across SAN, NAS, or ZFS, with specific highlights for Ceph configurations.</span>
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
                  <a href="/shiftreadiness" className="btn btn-primary btn-glow">
                    Explore ShiftReadiness Workspace
                    <ArrowRight size={18} />
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
                  <h3>Cost Delta Analysis</h3>
                  <p>Automated subscription comparison calculating your exact savings from removing broadcom-style vCPU licensing surcharges.</p>
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
                  <h3>Proxmox Fit Specifications</h3>
                  <p>Architectural target blueprints recommending storage configurations (ZFS, Ceph, SAN) and VM cluster layouts.</p>
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

        <section id="faq" className="section faq-section">
          <div className="container">
            <div className="text-center mb-8">
              <div className="badge badge-cyan">FAQ</div>
              <div className="faq-brands">
                <div className="faq-brand vmware">
                  <img src={vmwareLogoSrc} alt="" className="faq-brand-logo" />
                  VMware
                </div>
                <ArrowRight size={16} className="cta-arrow" />
                <div className="faq-brand proxmox">
                  <img src={proxmoxLogoSrc} alt="" className="faq-brand-logo" />
                  Proxmox
                </div>
              </div>
              <h2 className="mb-4">{appCopy.faqTitle}</h2>
            </div>
            <div className="faq-list">
              <div className="faq-item">
                <div className="faq-q">{appCopy.q1}</div>
                <div className="faq-a">{appCopy.a1}</div>
              </div>
              <div className="faq-item">
                <div className="faq-q">{appCopy.q2}</div>
                <div className="faq-a">{appCopy.a2}</div>
              </div>
              <div className="faq-item">
                <div className="faq-q">{appCopy.q3}</div>
                <div className="faq-a">{appCopy.a3}</div>
              </div>
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
                  <img src={vmwareLogoSrc} alt="" className="cta-brand-logo" />
                  VMware
                </div>
                <ArrowRight size={18} className="cta-arrow" />
                <div className="cta-brand proxmox">
                  <img src={proxmoxLogoSrc} alt="" className="cta-brand-logo" />
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
      </main>

      <Footer />
    </>
  );
}

