import type { Metadata } from "next";
import { ArrowRight, Check, Minus, Brain } from "lucide-react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { marketingPlans, marketingAddOns } from "../../lib/pricingPlans";

export const metadata: Metadata = {
  title: "Pricing Plans | Shift Evidence",
  description: "Transparent, modular pre-migration assessment plans for infrastructure teams, MSPs, and partners planning VMware exits.",
};

export default function PricingPage() {
  return (
    <>
      <Navbar />
      <main style={{ minHeight: "100vh", background: "var(--bg-dark)" }}>
        {/* Header */}
        <section className="section" style={{ paddingTop: "8rem", paddingBottom: "3rem" }}>
          <div className="container">
            <div className="section-header" style={{ textAlign: "center", maxWidth: "800px", margin: "0 auto" }}>
              <span className="badge badge-cyan">Pricing Models</span>
              <h1 style={{ fontSize: "2.75rem", lineHeight: "1.2", margin: "1rem 0" }}>
                Transparent, modular pricing for infrastructure teams.
              </h1>
              <p style={{ color: "var(--text-muted)", fontSize: "1.1rem", lineHeight: "1.6" }}>
                Start with our Free Readiness Check. Unlock detailed reports or include premium storage and AI advisor tools as needed. No credit card required to start.
              </p>
            </div>
          </div>
        </section>

        {/* 2-Column Spacious Grid for Core Plans */}
        <section className="section" style={{ padding: "0 0 4rem 0" }}>
          <div className="container">
            <div 
              style={{ 
                display: "grid", 
                gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))", 
                gap: "2.5rem",
                maxWidth: "1100px",
                margin: "0 auto"
              }}
            >
              {marketingPlans.slice(0, 4).map((plan) => (
                <article 
                  key={plan.name} 
                  className={`glass-card sr-plan-card sr-plan-${plan.accent}`}
                  style={{ 
                    display: "flex", 
                    flexDirection: "column", 
                    justifyContent: "space-between",
                    padding: "2.5rem",
                    minHeight: "580px",
                    border: plan.accent === "pro" ? "1px solid rgba(139, 92, 246, 0.4)" : "1px solid rgba(255, 255, 255, 0.08)"
                  }}
                >
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
                      <div>
                        <h3 style={{ fontSize: "1.5rem", color: "white", margin: 0 }}>{plan.name}</h3>
                        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "0.5rem", lineHeight: "1.4" }}>
                          {plan.bestFor}
                        </p>
                      </div>
                      <div style={{ fontSize: "1.75rem", fontWeight: "bold", color: "white", whiteSpace: "nowrap" }}>
                        {plan.price}
                      </div>
                    </div>

                    {plan.accent === "pro" && (
                      <div className="badge badge-premium" style={{ width: "100%", justifyContent: "center", marginBottom: "1.5rem" }}>
                        <Brain size={12} className="shield-blink" />
                        <span>Storage Target & AI Advisor Integrated</span>
                      </div>
                    )}

                    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.5rem", borderTop: "1px solid rgba(255, 255, 255, 0.05)", paddingTop: "1.5rem" }}>
                      <div>
                        <h4 style={{ fontSize: "0.85rem", textTransform: "uppercase", color: "var(--text-cyan)", letterSpacing: "0.05em", marginBottom: "0.75rem" }}>Includes</h4>
                        <ul className="sr-list sr-list-includes" style={{ display: "grid", gap: "0.6rem" }}>
                          {plan.includes.map((item) => (
                            <li key={item} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", fontSize: "0.9rem", color: "#e2e8f0" }}>
                              <Check size={14} style={{ color: "var(--text-cyan)", flexShrink: 0, marginTop: "0.15rem" }} />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div style={{ borderTop: "1px dashed rgba(255, 255, 255, 0.05)", paddingTop: "1.2rem" }}>
                        <h4 style={{ fontSize: "0.85rem", textTransform: "uppercase", color: "#ef4444", letterSpacing: "0.05em", marginBottom: "0.75rem" }}>Does Not Include</h4>
                        <ul className="sr-list sr-list-excludes" style={{ display: "grid", gap: "0.6rem" }}>
                          {plan.excludes.map((item) => (
                            <li key={item} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", fontSize: "0.9rem", color: "var(--text-muted)" }}>
                              <Minus size={14} style={{ color: "#ef4444", flexShrink: 0, marginTop: "0.15rem" }} />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: "2rem", borderTop: "1px solid rgba(255, 255, 255, 0.05)", paddingTop: "1.5rem" }}>
                    {plan.upsell && (
                      <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "1rem", lineHeight: "1.4" }}>
                        {plan.upsell}
                      </p>
                    )}
                    <a 
                      href={plan.cta.href} 
                      className="btn btn-primary btn-glow" 
                      style={{ width: "100%", justifyContent: "center" }}
                    >
                      {plan.cta.label}
                      <ArrowRight size={16} />
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Full Width MSP / Partner Section */}
        <section className="section" style={{ padding: "0 0 4rem 0" }}>
          <div className="container">
            <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
              <article 
                className="glass-card sr-plan-partner" 
                style={{ 
                  padding: "3rem", 
                  border: "1px solid rgba(6, 182, 212, 0.3)",
                  background: "linear-gradient(135deg, rgba(6, 182, 212, 0.04), rgba(139, 92, 246, 0.04))"
                }}
              >
                <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "2rem" }}>
                  <div style={{ maxWidth: "650px" }}>
                    <div className="badge badge-cyan" style={{ marginBottom: "0.5rem" }}>Service Providers</div>
                    <h2 style={{ fontSize: "1.75rem", color: "white", margin: 0 }}>
                      {marketingPlans[4].name}
                    </h2>
                    <p style={{ color: "var(--text-muted)", marginTop: "0.5rem", fontSize: "1rem", lineHeight: "1.5" }}>
                      {marketingPlans[4].bestFor}
                    </p>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.5rem", marginTop: "1.5rem" }}>
                      <div>
                        <h4 style={{ color: "var(--text-cyan)", fontSize: "0.85rem", textTransform: "uppercase", marginBottom: "0.5rem" }}>Includes</h4>
                        <ul style={{ display: "grid", gap: "0.5rem" }}>
                          {marketingPlans[4].includes.slice(0, 4).map((item) => (
                            <li key={item} style={{ display: "flex", gap: "0.4rem", fontSize: "0.85rem" }}>
                              <Check size={12} className="text-cyan" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 style={{ color: "#ef4444", fontSize: "0.85rem", textTransform: "uppercase", marginBottom: "0.5rem" }}>Excludes</h4>
                        <ul style={{ display: "grid", gap: "0.5rem" }}>
                          {marketingPlans[4].excludes.slice(0, 2).map((item) => (
                            <li key={item} style={{ display: "flex", gap: "0.4rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                              <Minus size={12} />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: "center", minWidth: "220px", display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div style={{ fontSize: "2rem", fontWeight: "bold", color: "white" }}>
                      {marketingPlans[4].price}
                    </div>
                    <a href={marketingPlans[4].cta.href} className="btn btn-primary btn-glow" style={{ justifyContent: "center" }}>
                      {marketingPlans[4].cta.label}
                      <ArrowRight size={16} />
                    </a>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* Add-Ons Section */}
        <section className="section" style={{ padding: "0 0 6rem 0", borderTop: "1px solid rgba(255, 255, 255, 0.05)" }}>
          <div className="container">
            <div className="text-center mb-8" style={{ marginTop: "4rem" }}>
              <div className="badge">Modular Add-Ons</div>
              <h2 className="mb-4">Enhance your report with specialized review</h2>
              <p className="mx-auto" style={{ maxWidth: "600px", color: "var(--text-muted)" }}>
                Add storage destination validation or review findings directly with a principal systems architect.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "2.5rem", maxWidth: "1000px", margin: "0 auto" }}>
              {marketingAddOns.map((addon) => (
                <article key={addon.name} className="glass-card" style={{ padding: "2.5rem", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", marginBottom: "1.5rem" }}>
                      <div>
                        <h3 style={{ fontSize: "1.25rem", color: "white", margin: 0 }}>{addon.name}</h3>
                        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "0.5rem" }}>{addon.bestFor}</p>
                      </div>
                      <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "white" }}>{addon.price}</div>
                    </div>

                    <div style={{ display: "grid", gap: "1rem", borderTop: "1px solid rgba(255, 255, 255, 0.05)", paddingTop: "1.2rem" }}>
                      <ul style={{ display: "grid", gap: "0.5rem" }}>
                        {addon.includes.slice(0, 4).map((item) => (
                          <li key={item} style={{ display: "flex", gap: "0.4rem", fontSize: "0.85rem", color: "#e2e8f0" }}>
                            <Check size={14} className="text-cyan" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div style={{ marginTop: "1.5rem" }}>
                    <a href={addon.cta.href} className="btn btn-secondary" style={{ width: "100%", justifyContent: "center" }}>
                      {addon.cta.label}
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
