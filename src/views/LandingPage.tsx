"use client";

import { useState, type FormEvent } from "react";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import SavingsCalculator from "../components/SavingsCalculator";
import Features from "../components/Features";
import Process from "../components/Process";
import Footer from "../components/Footer";
import ReadinessValidator from "../components/ReadinessValidator";
import vmwareLogo from "../../images/vmware.svg";
import proxmoxLogo from "../../images/proxmox.svg";
import {
  ArrowRight,
  ShieldCheck,
  HelpCircle,
  BarChart3,
  FileText,
  Shield,
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

        <section className="section shiftreadiness-promo-section">
          <div className="container">
            <div className="glass-card shiftreadiness-promo">
              <div className="shiftreadiness-promo-copy">
                <div className="badge badge-cyan">New product</div>
                <h2>ShiftReadiness</h2>
                <p>
                  A technical readiness workspace for VMware &rarr; Proxmox
                  cost, risk and architecture decisions.
                </p>
              </div>
              <a href="/shiftreadiness" className="btn btn-primary btn-glow">
                Explore ShiftReadiness
                <ArrowRight size={18} />
              </a>
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

        <SavingsCalculator />
        <Features />
        <Process />

        <section id="faq" className="section faq-section">
          <div className="container">
            <div className="text-center mb-8">
              <div className="badge badge-cyan">FAQ</div>
              <div className="faq-brands">
                <div className="faq-brand vmware">
                  <img src={vmwareLogo} alt="" className="faq-brand-logo" />
                  VMware
                </div>
                <ArrowRight size={16} className="cta-arrow" />
                <div className="faq-brand proxmox">
                  <img src={proxmoxLogo} alt="" className="faq-brand-logo" />
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
                  <img src={vmwareLogo} alt="" className="cta-brand-logo" />
                  VMware
                </div>
                <ArrowRight size={18} className="cta-arrow" />
                <div className="cta-brand proxmox">
                  <img src={proxmoxLogo} alt="" className="cta-brand-logo" />
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

