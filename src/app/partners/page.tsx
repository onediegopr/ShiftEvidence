import type { Metadata } from "next";
import Link from "next/link";
import { Building2, Handshake, ShieldCheck } from "lucide-react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { marketingPlans, paymentOptionsCopy } from "../../lib/pricingPlans";

export const metadata: Metadata = {
  title: "Partners | Shift Evidence",
  description: "Partner and MSP inquiry path for Shift Evidence.",
};

export default function PartnersPage() {
  const mspPlan = marketingPlans.find((plan) => plan.id === "msp_partner");

  return (
    <>
      <Navbar />
      <main>
        <section className="section" style={{ paddingTop: "8rem" }}>
          <div className="container">
            <div className="section-header" style={{ textAlign: "left", maxWidth: "860px" }}>
              <span className="badge badge-cyan">Partners</span>
              <h1>Support for MSPs and technical partners evaluating migration readiness.</h1>
              <p>
                Shift Evidence can help partner teams structure assessment intake, evidence review, and
                client-facing migration readiness conversations.
              </p>
              <p className="assessment-inline-note" style={{ marginTop: "1rem" }}>
                {marketingPlans.find((plan) => plan.id === "msp_partner")?.paymentNote ?? paymentOptionsCopy.msp}
              </p>
            </div>
            <div className="assessment-summary-grid" style={{ marginTop: "2rem" }}>
              <article className="glass-card assessment-summary-card">
                <Building2 size={24} className="text-cyan" />
                <span className="assessment-summary-label">MSP context</span>
                <strong>Client-ready</strong>
                <p>Use assessment workspaces to separate client evidence and decision context.</p>
              </article>
              <article className="glass-card assessment-summary-card">
                <Handshake size={24} className="text-emerald" />
                <span className="assessment-summary-label">Partner inquiry</span>
                <strong>Manual review</strong>
                <p>Partner requests are routed through support for human review and follow-up.</p>
              </article>
              <article className="glass-card assessment-summary-card">
                <ShieldCheck size={24} style={{ color: "#f59e0b" }} />
                <span className="assessment-summary-label">Boundaries</span>
                <strong>No shared learning</strong>
                <p>Client workspaces and assessments remain isolated from each other.</p>
              </article>
            </div>
            <div className="assessment-inline-actions" style={{ marginTop: "2rem" }}>
              <Link href={mspPlan?.cta.href ?? "/billing/checkout/msp"} className="btn btn-primary btn-glow">
                {mspPlan?.cta.label ?? "Subscribe"}
              </Link>
              <Link href={mspPlan?.secondaryCta.href ?? "/support?category=partner_msp_inquiry"} className="btn btn-secondary">
                {mspPlan?.secondaryCta.label ?? "Request invoice"}
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
