import { ArrowRight } from "lucide-react";
import { useState } from "react";

export default function Footer() {
  const [newsletterStatus, setNewsletterStatus] = useState<string | null>(null);
  const copy = {
    brand:
      "Enterprise-grade VMware to Proxmox readiness assessments. Evidence review, custom analysis, and data-loss risk guidance before migration.",
    platform: "Platform",
    resources: "Resources",
    checklist: "Get Free Migration Checklist",
    stay: "Stay updated on license saving calculators and pre-migration scripts.",
    copyright: "All rights reserved.",
    bottom: "Open-source infrastructure. Enterprise-grade migration readiness.",
    legal:
      "Shift Evidence is an independent assessment service. It is not affiliated with, endorsed by or certified by VMware, Broadcom or Proxmox. VMware, Broadcom and Proxmox names may be trademarks of their respective owners and are used only to describe migration context and compatibility targets.",
  } as const;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setNewsletterStatus("Thank you. We will reach out with migration readiness resources shortly.");
  };

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <a
              href="#"
              className="logo-container"
              style={{ marginBottom: "0.5rem" }}
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle
                  cx="12"
                  cy="16"
                  r="8"
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="2.5"
                />
                <path
                  d="M12 16H24M24 16L20 12M24 16L20 20"
                  stroke="#8b5cf6"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>Shift Evidence</span>
            </a>
            <p style={{ fontSize: "0.85rem" }}>{copy.brand}</p>
          </div>

          <div className="footer-links-col">
            <h4 className="footer-links-title">{copy.platform}</h4>
            <ul className="footer-links-list">
              <li>
                <a href="#savings">Savings Calculator</a>
              </li>
              <li>
                <a href="#features">Core Features</a>
              </li>
              <li>
                <a href="#comparison">VMware vs Proxmox</a>
              </li>
              <li>
                <a href="#process">Migration Pipeline</a>
              </li>
            </ul>
          </div>

          <div className="footer-links-col">
            <h4 className="footer-links-title">{copy.resources}</h4>
            <ul className="footer-links-list">
              <li>
                <a href="#">Subscription Cost Whitepaper</a>
              </li>
              <li>
                <a href="#">Ceph Sizing Guide</a>
              </li>
              <li>
                <a href="#">Proxmox Backup Server (PBS) Setup</a>
              </li>
              <li>
                <a href="#">Broadcom Price Updates</a>
              </li>
            </ul>
          </div>

          <div className="footer-links-col">
            <h4 className="footer-links-title">{copy.checklist}</h4>
            <p style={{ fontSize: "0.85rem" }}>{copy.stay}</p>
            <form
              onSubmit={handleSubmit}
              className="cta-form"
              style={{ marginTop: "0.5rem", width: "100%", gap: "0.5rem" }}
            >
              <input
                type="email"
                name="workEmail"
                autoComplete="email"
                placeholder="you@company.com"
                required
                className="form-input"
                style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}
              />
              <button
                type="submit"
                className="btn btn-primary"
                style={{ padding: "0.5rem 1rem", borderRadius: "9999px" }}
                aria-label="Request migration readiness resources"
              >
                <ArrowRight size={16} />
              </button>
            </form>
            {newsletterStatus ? (
              <p className="auth-success" role="status" aria-live="polite" style={{ marginTop: "0.75rem" }}>
                {newsletterStatus}
              </p>
            ) : null}
          </div>
        </div>

        <div className="footer-bottom">
          <span>
            &copy; {new Date().getFullYear()} Shift Evidence. {copy.copyright}
          </span>
          <span>{copy.bottom}</span>
        </div>

        <div className="footer-legal">
          <p>{copy.legal}</p>
        </div>
      </div>
    </footer>
  );
}
