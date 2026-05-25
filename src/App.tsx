import { useState } from "react";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import SavingsCalculator from "./components/SavingsCalculator";
import Features from "./components/Features";
import Process from "./components/Process";
import Footer from "./components/Footer";
import ReadinessValidator from "./components/ReadinessValidator";
import {
  ArrowRight,
  ShieldCheck,
  HelpCircle,
  BarChart3,
  FileText,
  Shield,
} from "lucide-react";

export default function App() {
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const handleOpenScanner = () => setIsScannerOpen(true);
  const handleCloseScanner = () => setIsScannerOpen(false);

  const handleCtaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsScannerOpen(true);
  };

  return (
    <>
      {/* Scrollable Main Container */}
      <Navbar onOpenScanner={handleOpenScanner} />

      <main style={{ flexGrow: 1 }}>
        <Hero onOpenScanner={handleOpenScanner} />

        {/* Credibility Strip */}
        <section className="credibility-strip">
          <div className="bg-mesh"></div>
          <div className="container">
            <div className="credibility-header">
              <div className="badge badge-cyan">Methodology</div>
              <h2 className="credibility-title">
                Enterprise VMware discipline, without production access.
              </h2>
              <p className="credibility-body">
                This independent readiness methodology was developed by a former
                VMware Technical Account Manager and is designed to bring
                enterprise-grade risk review, evidence discipline and migration
                planning structure to VMware → Proxmox decisions.
              </p>
            </div>

            <div className="credibility-cards">
              <div className="cred-card">
                <div className="cred-card-icon cred-icon-cyan">
                  <Shield size={22} />
                </div>
                <div className="cred-card-text">
                  <strong>Former VMware TAM-led methodology</strong>
                  <span>
                    Built from real-world enterprise advisory experience, not
                    guesswork.
                  </span>
                </div>
              </div>
              <div className="cred-card">
                <div className="cred-card-icon cred-icon-cyan">
                  <BarChart3 size={22} />
                </div>
                <div className="cred-card-text">
                  <strong>Evidence-based, not guess-based</strong>
                  <span>
                    Every risk, gap and recommendation is backed by collected
                    infrastructure evidence.
                  </span>
                </div>
              </div>
              <div className="cred-card">
                <div className="cred-card-icon cred-icon-emerald">
                  <ShieldCheck size={22} />
                </div>
                <div className="cred-card-text">
                  <strong>No production changes</strong>
                  <span>
                    Read-only assessment. Zero agents, zero credentials, zero
                    impact on running workloads.
                  </span>
                </div>
              </div>
              <div className="cred-card">
                <div className="cred-card-icon cred-icon-cyan">
                  <FileText size={22} />
                </div>
                <div className="cred-card-text">
                  <strong>Executive + technical outputs</strong>
                  <span>
                    Ready-to-share reports for both engineering teams and
                    business stakeholders.
                  </span>
                </div>
              </div>
            </div>

            <div className="credibility-footer">
              <span className="credibility-disclaimer">
                Independent methodology. Not affiliated with, endorsed by or
                certified by VMware/Broadcom.
              </span>
            </div>
          </div>
        </section>

        <SavingsCalculator />

        <Features />

        <Process />

        {/* FAQ Section */}
        <section className="section faq-section">
          <div className="container">
            <div className="text-center mb-8">
              <div className="badge badge-cyan">FAQ</div>
              <h2 className="mb-4">Frequently Asked Questions</h2>
            </div>
            <div className="faq-list">
              <div className="faq-item">
                <div className="faq-q">
                  Is this assessment certified by VMware or Proxmox?
                </div>
                <div className="faq-a">
                  No. This is an independent readiness assessment. It is not
                  affiliated with, endorsed by or certified by VMware, Broadcom
                  or Proxmox. The methodology was developed by a former VMware
                  Technical Account Manager to bring enterprise-grade risk
                  review and evidence discipline to VMware → Proxmox planning.
                </div>
              </div>
              <div className="faq-item">
                <div className="faq-q">
                  What does &ldquo;Former VMware TAM-led methodology&rdquo;
                  mean?
                </div>
                <div className="faq-a">
                  It means the assessment structure was designed from real-world
                  VMware enterprise advisory experience: evidence review, risk
                  classification, migration readiness, gaps, executive
                  communication and validation points. It does not mean VMware
                  officially certifies or endorses the report.
                </div>
              </div>
              <div className="faq-item">
                <div className="faq-q">Why does that matter?</div>
                <div className="faq-a">
                  VMware → Proxmox migration is not only a technical import
                  task. It requires risk prioritization, evidence quality
                  review, workload classification, business continuity thinking
                  and a clear plan for what should move first, what needs
                  remediation and what should wait.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Bottom Call-To-Action (CTA) Section */}
        <section
          className="section cta-section"
          style={{ background: "rgba(6, 9, 19, 0.4)" }}
        >
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
              {/* Mini brand badges */}
              <div className="cta-brands">
                <div className="cta-brand vmware">
                  <svg width="26" height="26" viewBox="0 0 20 20" fill="none">
                    <rect width="20" height="20" rx="4" fill="#b8363b" />
                    <polygon
                      points="10,3 4,16 7.5,16 10,9 12.5,16 16,16"
                      fill="white"
                    />
                  </svg>
                  VMware
                </div>
                <ArrowRight size={18} className="cta-arrow" />
                <div className="cta-brand proxmox">
                  <svg width="26" height="26" viewBox="0 0 20 20" fill="none">
                    <rect width="20" height="20" rx="4" fill="#e57000" />
                    <circle
                      cx="10"
                      cy="10"
                      r="5"
                      fill="none"
                      stroke="white"
                      strokeWidth="1.8"
                    />
                    <circle cx="10" cy="10" r="2" fill="white" />
                  </svg>
                  Proxmox
                </div>
              </div>

              <h2 className="mb-2" style={{ color: "white" }}>
                Assure Your Proxmox Shift
              </h2>
              <p className="cta-subtitle">
                <span className="cta-pain">
                  Stop paying VMware renewal bills.
                </span>{" "}
                Run our pre-flight cluster check to receive a detailed
                compatibility scorecard and technical migration plan.
              </p>

              <form onSubmit={handleCtaSubmit} className="cta-form">
                <input
                  type="email"
                  placeholder="Enter corporate email"
                  required
                  className="form-input"
                />
                <button
                  type="submit"
                  className="btn btn-primary btn-glow cta-btn"
                >
                  Initialize Scan
                  <ArrowRight size={18} />
                </button>
              </form>

              <div className="cta-trust">
                <div className="cta-trust-item">
                  <ShieldCheck size={18} />
                  <span>No ESXi agents required</span>
                </div>
                <div className="cta-trust-item">
                  <HelpCircle size={18} />
                  <span>Read-only configuration check</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {/* Interactive Scan Diagnostic Modal */}
      <ReadinessValidator isOpen={isScannerOpen} onClose={handleCloseScanner} />
    </>
  );
}
