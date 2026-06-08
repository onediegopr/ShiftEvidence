import type { Metadata } from "next";
import Link from "next/link";
import { Database, Lock, ShieldCheck } from "lucide-react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

export const metadata: Metadata = {
  title: "Security and Privacy for Agentless Readiness Assessments",
  description:
    "Shift Evidence starts with exported evidence and does not require agents, mandatory credentials or production write access for the base VMware to Proxmox readiness workflow.",
  alternates: {
    canonical: "https://shiftevidence.com/security",
  },
};

export default function SecurityPage() {
  return (
    <>
      <Navbar />
      <main>
        <section className="section" style={{ paddingTop: "8rem" }}>
          <div className="container">
            <div className="section-header" style={{ textAlign: "left", maxWidth: "860px" }}>
              <span className="badge badge-cyan">Security</span>
              <h1>Assessment support is designed around evidence boundaries and secret avoidance.</h1>
              <p>
                Support requests should never include passwords, API keys, private tokens, credentials,
                or raw private files. Assessment data is scoped to the relevant workspace and assessment.
              </p>
            </div>
            <div className="assessment-summary-grid" style={{ marginTop: "2rem" }}>
              <article className="glass-card assessment-summary-card">
                <Lock size={24} className="text-cyan" />
                <span className="assessment-summary-label">Secrets</span>
                <strong>Do not send</strong>
                <p>Basic filtering blocks common credential patterns in support requests.</p>
              </article>
              <article className="glass-card assessment-summary-card">
                <Database size={24} className="text-emerald" />
                <span className="assessment-summary-label">Scope</span>
                <strong>Workspace bound</strong>
                <p>Authenticated support requests are tied to the current workspace or assessment.</p>
              </article>
              <article className="glass-card assessment-summary-card">
                <ShieldCheck size={24} style={{ color: "#f59e0b" }} />
                <span className="assessment-summary-label">Public support</span>
                <strong>No file upload</strong>
                <p>The public form does not accept attachments or arbitrary assessment ownership claims.</p>
              </article>
            </div>
            <div className="assessment-inline-actions" style={{ marginTop: "2rem" }}>
              <Link href="/support?category=security_privacy" className="btn btn-primary btn-glow">
                Contact security support
              </Link>
              <Link href="/about" className="btn btn-secondary">
                Review trust model
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
