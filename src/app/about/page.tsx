import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Database, FileText, ShieldCheck } from "lucide-react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

export const metadata: Metadata = {
  title: "About | Shift Evidence",
  description: "About Shift Evidence and the infrastructure migration readiness workflow.",
};

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main>
        <section className="section" style={{ paddingTop: "8rem" }}>
          <div className="container">
            <div className="section-header" style={{ textAlign: "left", maxWidth: "860px" }}>
              <span className="badge badge-cyan">About Shift Evidence</span>
              <h1>Independent readiness review for infrastructure migration decisions.</h1>
              <p>
                Shift Evidence helps technical leaders and service providers turn VMware to Proxmox
                migration questions into structured assessments, evidence review, risk signals, and
                next-step planning.
              </p>
            </div>

            <div className="assessment-summary-grid" style={{ marginTop: "2rem" }}>
              <article className="glass-card assessment-summary-card">
                <Database size={24} className="text-cyan" />
                <span className="assessment-summary-label">Evidence first</span>
                <strong>Structured inputs</strong>
                <p>Assessments are scoped around inventory, business context, cost exposure, and readiness signals.</p>
              </article>
              <article className="glass-card assessment-summary-card">
                <ShieldCheck size={24} className="text-emerald" />
                <span className="assessment-summary-label">Private by design</span>
                <strong>No shared learning</strong>
                <p>Workspace and assessment boundaries are kept separate; customer evidence is not used across clients.</p>
              </article>
              <article className="glass-card assessment-summary-card">
                <FileText size={24} style={{ color: "#f59e0b" }} />
                <span className="assessment-summary-label">Decision support</span>
                <strong>Migration clarity</strong>
                <p>The product focuses on migration readiness, risk review, and practical follow-up actions.</p>
              </article>
            </div>
          </div>
        </section>

        <section className="section" style={{ paddingTop: 0 }}>
          <div className="container">
            <div className="glass-card assessment-section">
              <div className="assessment-section-title">
                <div className="assessment-section-eyebrow">
                  <CheckCircle2 size={18} />
                  <span>Trust model</span>
                </div>
                <h2>What Shift Evidence does and does not do</h2>
                <p>
                  Shift Evidence is an independent assessment service. It does not replace a production
                  migration runbook, vendor support contract, legal review, or final architecture sign-off.
                </p>
              </div>
              <div className="assessment-lists-grid">
                <article className="glass-card assessment-subcard">
                  <h3>Included</h3>
                  <ul className="assessment-bullet-list">
                    <li>Assessment workspace and evidence intake.</li>
                    <li>Readiness, cost, licensing, and infrastructure context review.</li>
                    <li>Senior Advisor guidance based on the assessment context.</li>
                    <li>Manual support paths for report, privacy, and partner questions.</li>
                  </ul>
                </article>
                <article className="glass-card assessment-subcard">
                  <h3>Not included</h3>
                  <ul className="assessment-bullet-list">
                    <li>Live migration execution or emergency incident response.</li>
                    <li>Formal vendor certification or endorsement.</li>
                    <li>Public launch guarantees, billing provider commitments, or managed SLA.</li>
                    <li>Storage of secrets, credentials, or raw private files in support requests.</li>
                  </ul>
                </article>
              </div>
              <div className="assessment-inline-actions">
                <Link href="/support" className="btn btn-primary btn-glow">
                  Contact support
                </Link>
                <Link href="/dashboard" className="btn btn-secondary">
                  Open dashboard
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
