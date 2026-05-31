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
              <h1>Flexible plans designed for enterprise infrastructure teams.</h1>
              <p>
                Get consulting-grade insights at a fraction of the cost. Start with our Free Readiness Check, 
                unlock detailed reports, or select optional storage target analyses to match your migration scope.
              </p>
            </div>
            <div className="assessment-summary-grid" style={{ marginTop: "2rem" }}>
              <article className="glass-card assessment-summary-card">
                <BadgePercent size={24} className="text-cyan" />
                <span className="assessment-summary-label">Self-Service Upgrades</span>
                <strong>Start Free & Upgrade</strong>
                <p>Initialize your cluster assessment at no cost. Upgrade to unlock full PDF downloads, VM matrix filters, and AI Advisor access when you need them.</p>
              </article>
              <article className="glass-card assessment-summary-card">
                <FileText size={24} className="text-emerald" />
                <span className="assessment-summary-label">Storage & AI Add-Ons</span>
                <strong>Modular Architecture</strong>
                <p>Customize your deliverables by including optional Ceph suitability checks, ZFS/SAN target evaluations, or booking a technical review session.</p>
              </article>
              <article className="glass-card assessment-summary-card">
                <ShieldCheck size={24} style={{ color: "#f59e0b" }} />
                <span className="assessment-summary-label">Enterprise Invoicing</span>
                <strong>Corporate Purchasing</strong>
                <p>Need custom contract terms, regional compliance checks, or purchase orders? Our billing desk handles invoice routing for corporate accounts.</p>
              </article>
            </div>
            <div className="assessment-inline-actions" style={{ marginTop: "2rem" }}>
              <Link href="/shiftreadiness#pricing" className="btn btn-primary btn-glow">
                Compare Plans & Pricing <ArrowRight size={16} />
              </Link>
              <Link href="/support?category=billing_question" className="btn btn-secondary">
                Contact Billing Support
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
