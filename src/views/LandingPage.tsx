"use client";

import { useState, type FormEvent } from "react";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import SavingsCalculator from "../components/SavingsCalculator";
import Features from "../components/Features";
import Process from "../components/Process";
import Footer from "../components/Footer";
import ReadinessValidator from "../components/ReadinessValidator";
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
  Check,
  Layers,
  Search,
} from "lucide-react";

const appCopy = {
  methodology: "Methodology",
  credibilityTitle: "Enterprise VMware discipline, without production access.",
  credibilityBody:
    "This independent readiness methodology was developed by a former VMware Technical Account Manager and is designed to bring enterprise-grade risk review, evidence discipline and migration planning structure to VMware to Proxmox decisions.",
  formerTam: "Former VMware TAM-led methodology",
  formerTamBody: "Built from real-world enterprise advisory experience, not guesswork.",
  evidence: "Evidence-based, not guess-based",
  evidenceBody: "Every risk, gap and recommendation is backed by collected infrastructure evidence.",
  noProd: "No production changes",
  noProdBody: "Read-only assessment. Zero agents, zero credentials, zero impact on running workloads.",
  outputs: "Executive + technical outputs",
  outputsBody: "Ready-to-share reports for both engineering teams and business stakeholders.",
  disclaimer: "Independent methodology. Not affiliated with, endorsed by or certified by VMware/Broadcom.",
  faqTitle: "Frequently Asked Questions",
  q1: "Is this assessment certified by VMware or Proxmox?",
  a1: "No. This is an independent readiness assessment. It is not affiliated with, endorsed by or certified by VMware, Broadcom or Proxmox. The methodology was developed by a former VMware Technical Account Manager to bring enterprise-grade risk review and evidence discipline to VMware to Proxmox planning.",
  q2: 'What does "Former VMware TAM-led methodology" mean?',
  a2: "It means the assessment structure was designed from real-world VMware enterprise advisory experience: evidence review, risk classification, migration readiness, gaps, executive communication and validation points. It does not mean VMware officially certifies or endorses the report.",
  q3: "Why does that matter?",
  a3: "VMware to Proxmox migration is not only a technical import task. It requires risk prioritization, evidence quality review, workload classification, business continuity thinking and a clear plan for what should move first, what needs remediation and what should wait.",
  ctaTitle: "Assure Your Proxmox Shift",
  ctaPain: "Stop paying VMware renewal bills.",
  ctaBody: "Run our pre-flight cluster check to receive a detailed compatibility scorecard and technical migration plan.",
  ctaInput: "Enter corporate email",
  ctaBtn: "Initialize Scan",
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
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const vmwareLogoSrc = assetSrc(vmwareLogo);
  const proxmoxLogoSrc = assetSrc(proxmoxLogo);

  const handleOpenScanner = () => setIsScannerOpen(true);
  const handleCloseScanner = () => setIsScannerOpen(false);

  const handleCtaSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsScannerOpen(true);
  };

  return (
    <>
      <Navbar />

      <main style={{ flexGrow: 1 }}>
        <Hero onOpenScanner={handleOpenScanner} />


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

        <SavingsCalculator />
        <Features />
        <Process />

        <section id="readiness-showcase" className="section shiftreadiness-promo-showcase-section">
          <div className="bg-mesh"></div>
          <div className="container">
            <div className="glass-card shiftreadiness-promo-showcase">
              <div className="sr-showcase-copy">
                <div className="badge badge-cyan">Pre-Migration Discovery</div>
                <h2>Before you migrate, understand your readiness first.</h2>
                <p>
                  ShiftReadiness productizes the first phase of a VMware migration assessment. Map your environment, calculate license delta, and spot architectural blockers in minutes at software pricing.
                </p>
                
                <ul className="sr-showcase-features">
                  <li>
                    <div className="sr-showcase-feature-icon">
                      <Search size={18} />
                    </div>
                    <div>
                      <strong>Evidence-Based Intake</strong>
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
                      <strong>Storage Scenario Modeling</strong>
                      <span>Agnostic architectural validation for ZFS, Ceph, SAN, or NAS targets.</span>
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

        <section className="section cta-section" style={{ background: "rgba(6, 9, 19, 0.4)" }}>
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
      <ReadinessValidator isOpen={isScannerOpen} onClose={handleCloseScanner} />
    </>
  );
}

