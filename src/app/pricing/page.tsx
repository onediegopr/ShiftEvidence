import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgePercent, FileText, ShieldCheck } from "lucide-react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

export const metadata: Metadata = {
  title: "Pricing | Shift Evidence",
  description: "Shift Evidence pricing overview and readiness plan entry points.",
};

export default function PricingPage() {
  return (
    <>
      <Navbar />
      <main>
        <section className="section" style={{ paddingTop: "8rem" }}>
          <div className="container">
            <div className="section-header" style={{ textAlign: "left", maxWidth: "860px" }}>
              <span className="badge badge-cyan">Pricing</span>
              <h1>Readiness review plans are introduced before checkout is enabled.</h1>
              <p>
                Shift Evidence currently exposes plan comparison and upgrade intent flows. Real billing,
                checkout, and subscription management are not active in this layer.
              </p>
            </div>
            <div className="assessment-summary-grid" style={{ marginTop: "2rem" }}>
              <article className="glass-card assessment-summary-card">
                <BadgePercent size={24} className="text-cyan" />
                <span className="assessment-summary-label">Plan comparison</span>
                <strong>Visible</strong>
                <p>Use the readiness pricing section to compare available assessment paths.</p>
              </article>
              <article className="glass-card assessment-summary-card">
                <FileText size={24} className="text-emerald" />
                <span className="assessment-summary-label">Upgrade intent</span>
                <strong>Tracked</strong>
                <p>Upgrade interest can be recorded without activating real payment processing.</p>
              </article>
              <article className="glass-card assessment-summary-card">
                <ShieldCheck size={24} style={{ color: "#f59e0b" }} />
                <span className="assessment-summary-label">Billing provider</span>
                <strong>Not active</strong>
                <p>No billing provider integration or checkout launch is declared here.</p>
              </article>
            </div>
            <div className="assessment-inline-actions" style={{ marginTop: "2rem" }}>
              <Link href="/shiftreadiness#pricing" className="btn btn-primary btn-glow">
                View plan comparison <ArrowRight size={16} />
              </Link>
              <Link href="/support?category=billing_question" className="btn btn-secondary">
                Ask a billing question
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
