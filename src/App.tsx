import { useState } from "react";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import SavingsCalculator from "./components/SavingsCalculator";
import Features from "./components/Features";
import Process from "./components/Process";
import Footer from "./components/Footer";
import ReadinessValidator from "./components/ReadinessValidator";
import { ArrowRight, ShieldCheck, HelpCircle } from "lucide-react";

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

        <SavingsCalculator />

        <Features />

        <Process />

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
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
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
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
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
