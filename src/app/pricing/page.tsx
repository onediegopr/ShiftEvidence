import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Brain,
  Building2,
  Check,
  Eye,
  Lock,
  Minus,
  Radar,
  Receipt,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import {
  getBillingCadenceLabel,
  getPaymentOptionLabel,
  marketingAddOns,
  marketingPlans,
  paymentOptionsCopy,
} from "../../lib/pricingPlans";

export const metadata: Metadata = {
  title: "Pricing Plans | Shift Evidence",
  description: "Transparent, modular pre-migration assessment plans for infrastructure teams, MSPs, and partners planning VMware exits.",
};

const purchaseSignals = [
  {
    title: "Evidence before execution",
    body: "Start with RVTools and senior context before scope or architecture is locked.",
    icon: Radar,
    tone: "cyan",
  },
  {
    title: "Controlled onboarding",
    body: "Invoice and card checkout stay gated until account, access and fulfillment are confirmed.",
    icon: Lock,
    tone: "amber",
  },
  {
    title: "Human-grade advisory depth",
    body: "Professional and Blueprint plans move beyond parsing into planning and review.",
    icon: Brain,
    tone: "violet",
  },
] as const;

const purchaseStats = [
  ["3", "Core buying paths"],
  ["1", "Partner program"],
  ["1", "Technical review add-on"],
  ["0", "Production agents required"],
] as const;

export default function PricingPage() {
  const corePlans = marketingPlans.filter((plan) => plan.id !== "msp_partner");
  const partnerPlan = marketingPlans.find((plan) => plan.id === "msp_partner") ?? marketingPlans[marketingPlans.length - 1];

  return (
    <>
      <Navbar />
      <main className="pricing-page-shell">
        <section className="section pricing-page-hero">
          <div className="bg-mesh" />
          <div className="container pricing-hero-grid">
            <div className="pricing-hero-copy">
              <div className="pricing-brand-route" aria-label="VMware to Proxmox route">
                <span className="pricing-brand pricing-brand-vmware">VMware</span>
                <span className="pricing-route-arrow" aria-hidden="true">
                  <ArrowRight size={16} />
                </span>
                <span className="pricing-brand pricing-brand-proxmox">Proxmox</span>
              </div>
              <div className="badge badge-cyan">Pricing Models</div>
              <h1>Choose the right migration decision pack.</h1>
              <p className="pricing-hero-subtitle">
                Pricing is structured around how much advisory depth, technical scrutiny and planning your VMware exit
                actually needs.
              </p>
              <p className="pricing-hero-body">
                Start with a readiness checkpoint, move into a professional decision pack when stakeholder confidence is
                needed, or choose a blueprint when wave planning and technical review are already on the table.
              </p>

              <div className="pricing-signal-strip">
                {purchaseSignals.map(({ title, body, icon: Icon, tone }) => (
                  <article key={title} className="glass-card pricing-signal-card" data-tone={tone}>
                    <Icon size={18} />
                    <div>
                      <strong>{title}</strong>
                      <span>{body}</span>
                    </div>
                  </article>
                ))}
              </div>

              <div className="pricing-hero-actions">
                <Link href="#pricing-plans" className="btn btn-primary btn-glow">
                  Compare plans
                  <ArrowRight size={18} />
                </Link>
                <Link href="/sample-report" className="pricing-hero-action-card" data-tone="cyan">
                  <strong>View Sample Report</strong>
                  <span>See the premium deliverable before you purchase.</span>
                  <Eye size={16} />
                </Link>
                <Link href="/demo/workspace" className="pricing-hero-action-card" data-tone="violet">
                  <strong>Explore Sample Assessment</strong>
                  <span>Inspect the synthetic workspace behind the report.</span>
                  <ArrowRight size={16} />
                </Link>
                <Link href="/technical-review?source=pricing" className="pricing-hero-action-card" data-tone="amber">
                  <strong>Book Technical Review</strong>
                  <span>Talk through findings, scope and next-step assumptions.</span>
                  <ShieldCheck size={16} />
                </Link>
              </div>

              <p className="assessment-inline-note">
                {paymentOptionsCopy.cardCheckout} {paymentOptionsCopy.bankTransfer}
              </p>
              <p className="assessment-inline-note">
                Manual invoice requests are reviewed before fulfillment. Bank transfer is not an automatic transfer,
                balance action or instant fulfillment path.
              </p>
            </div>

            <aside className="glass-card pricing-hero-panel" aria-label="Pricing overview">
              <div className="demo-terminal-header">
                <span className="sr-mockup-dot red" />
                <span className="sr-mockup-dot yellow" />
                <span className="sr-mockup-dot green" />
                <strong>Purchase overview</strong>
              </div>
              <div className="pricing-hero-panel-body">
                <div className="pricing-hero-panel-title">
                  <span className="pricing-hero-panel-kicker">Decision path</span>
                  <h2>Three levels of buying confidence.</h2>
                  <p>Start with proof. Escalate only when the evidence justifies more planning depth.</p>
                </div>

                <div className="pricing-hero-panel-stats">
                  {purchaseStats.map(([value, label]) => (
                    <div key={label} className="pricing-hero-stat">
                      <strong>{value}</strong>
                      <span>{label}</span>
                    </div>
                  ))}
                </div>

                <div className="pricing-hero-ladder">
                  <div className="pricing-hero-ladder-step" data-tone="cyan">
                    <span>01</span>
                    <div>
                      <strong>Starter Readiness</strong>
                      <small>Fast checkpoint before budget or scope moves.</small>
                    </div>
                  </div>
                  <div className="pricing-hero-ladder-step" data-tone="amber">
                    <span>02</span>
                    <div>
                      <strong>Professional Assessment</strong>
                      <small>VM-by-VM decision pack with higher advisory depth.</small>
                    </div>
                  </div>
                  <div className="pricing-hero-ladder-step" data-tone="violet">
                    <span>03</span>
                    <div>
                      <strong>Migration Blueprint</strong>
                      <small>Wave planning, rollback expectations and review session.</small>
                    </div>
                  </div>
                </div>

                <div className="pricing-hero-panel-note">
                  <Receipt size={18} />
                  <p>
                    Checkout availability and access matching are resolved securely at runtime, so the commercial path
                    stays controlled while production onboarding remains safe.
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section id="pricing-plans" className="section shiftreadiness-section">
          <div className="container">
            <div className="shiftreadiness-section-heading pricing-section-heading">
              <div className="badge badge-cyan">Core Plans</div>
              <h2>Buy only the level of analysis, reporting and planning your environment actually needs.</h2>
              <p>
                Every plan keeps the same evidence-first methodology. What changes is the depth of advisory reasoning,
                report detail and migration planning structure layered on top.
              </p>
            </div>

            <div className="pricing-plan-grid">
              {corePlans.map((plan) => (
                <article key={plan.name} className={`glass-card pricing-plan-card pricing-plan-${plan.accent}`}>
                  <div className="pricing-plan-top">
                    <div className="pricing-plan-head">
                      <div>
                        <span className="pricing-plan-kicker">
                          {plan.accent === "core" ? "Entry point" : plan.accent === "pro" ? "Most complete assessment" : "Planning engagement"}
                        </span>
                        <h3>{plan.name}</h3>
                        <p>{plan.bestFor}</p>
                      </div>
                      <div className="pricing-plan-price-block">
                        <strong>{plan.price}</strong>
                        <span>{getBillingCadenceLabel(plan.billingCadence)}</span>
                      </div>
                    </div>

                    {plan.accent === "pro" && (
                      <div className="badge badge-premium pricing-plan-badge">
                        <Brain size={12} className="shield-blink" />
                        <span>Storage target and advisor depth included</span>
                      </div>
                    )}

                    <div className="pricing-plan-meta">
                      <span className="assessment-chip assessment-chip-neutral">{getBillingCadenceLabel(plan.billingCadence)}</span>
                      <span className="assessment-chip assessment-chip-good">
                        Recommended: {getPaymentOptionLabel(plan.recommendedPayment)}
                      </span>
                    </div>

                    <p className="pricing-plan-note">{plan.paymentNote}</p>
                  </div>

                  <div className="pricing-plan-columns">
                    <div className="pricing-plan-column">
                      <h4>Includes</h4>
                      <ul className="pricing-plan-list">
                        {plan.includes.map((item) => (
                          <li key={item}>
                            <Check size={14} />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pricing-plan-column pricing-plan-column-muted">
                      <h4>Does not include</h4>
                      <ul className="pricing-plan-list pricing-plan-list-muted">
                        {plan.excludes.map((item) => (
                          <li key={item}>
                            <Minus size={14} />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="pricing-plan-bottom">
                    {plan.upsell && <p className="pricing-plan-upsell">{plan.upsell}</p>}
                    <div className="pricing-plan-actions">
                      <a href={plan.cta.href} className="btn btn-primary btn-glow">
                        {plan.cta.label}
                        <ArrowRight size={16} />
                      </a>
                      <a href={plan.secondaryCta.href} className="btn btn-secondary">
                        {plan.secondaryCta.label}
                      </a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section shiftreadiness-section shiftreadiness-section-alt">
          <div className="container">
            <div className="glass-card pricing-partner-shell">
              <div className="pricing-partner-copy">
                <div className="badge badge-cyan">Service Providers</div>
                <h2>{partnerPlan.name}</h2>
                <p>{partnerPlan.bestFor}</p>
                <p className="pricing-partner-note">{partnerPlan.paymentNote}</p>

                <div className="pricing-partner-grid">
                  <div className="pricing-partner-column">
                    <h4>Included for partners</h4>
                    <ul className="pricing-plan-list">
                      {partnerPlan.includes.map((item) => (
                        <li key={item}>
                          <Check size={14} />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="pricing-partner-column pricing-plan-column-muted">
                    <h4>Not part of the program</h4>
                    <ul className="pricing-plan-list pricing-plan-list-muted">
                      {partnerPlan.excludes.map((item) => (
                        <li key={item}>
                          <Minus size={14} />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="pricing-partner-cta">
                <div className="pricing-partner-price">
                  <span>Partner route</span>
                  <strong>{partnerPlan.price}</strong>
                  <small>Reviewed business invoice path by default</small>
                </div>
                <div className="pricing-partner-actions">
                  <a href={partnerPlan.cta.href} className="btn btn-primary btn-glow">
                    {partnerPlan.cta.label}
                    <ArrowRight size={16} />
                  </a>
                  <a href={partnerPlan.secondaryCta.href} className="btn btn-secondary">
                    {partnerPlan.secondaryCta.label}
                  </a>
                </div>
              </div>
            </div>

            <p className="assessment-inline-note pricing-runtime-note">
              {paymentOptionsCopy.pricingNote} Checkout availability and access matching are resolved securely at runtime.
            </p>

            <article className="glass-card pricing-sample-bridge">
              <div>
                <div className="badge badge-cyan">Not ready to purchase yet?</div>
                <h2>Validate the value path with synthetic proof first.</h2>
                <p>
                  Open the Demo Workspace to see what each paid plan unlocks: synthetic evidence, risk scoring, Storage
                  Destination Readiness, migration waves and demo reports. Start with the quick replay if you want the
                  90-second version first.
                </p>
              </div>
              <div className="pricing-sample-actions">
                <a href="/demo/replay" className="pricing-inline-card" data-tone="violet">
                  <strong>Watch 90-second simulation</strong>
                  <span>See the guided flow from RVTools intake to the decision pack.</span>
                  <ArrowRight size={16} />
                </a>
                <a href="/demo/workspace" className="pricing-inline-card" data-tone="cyan">
                  <strong>Explore a Sample Assessment</strong>
                  <span>Inspect the synthetic workspace, scores and report layers.</span>
                  <ArrowRight size={16} />
                </a>
              </div>
            </article>
          </div>
        </section>

        <section className="section shiftreadiness-section pricing-addon-section">
          <div className="container">
            <div className="shiftreadiness-section-heading pricing-section-heading">
              <div className="badge badge-cyan">Modular Add-Ons</div>
              <h2>Enhance the report with specialized review instead of overbuying the base package.</h2>
              <p>
                Add-ons are meant to deepen interpretation and stakeholder alignment, not replace the core evidence and
                report methodology.
              </p>
            </div>

            <div className="pricing-addon-grid">
              {marketingAddOns.map((addon) => (
                <article key={addon.name} className="glass-card pricing-addon-card">
                  <div className="pricing-addon-head">
                    <div>
                      <span className="pricing-plan-kicker">Optional advisory layer</span>
                      <h3>{addon.name}</h3>
                      <p>{addon.bestFor}</p>
                    </div>
                    <div className="pricing-addon-price">
                      <strong>{addon.price}</strong>
                    </div>
                  </div>

                  <div className="pricing-addon-body">
                    <div className="pricing-plan-column">
                      <h4>Includes</h4>
                      <ul className="pricing-plan-list">
                        {addon.includes.map((item) => (
                          <li key={item}>
                            <Check size={14} />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pricing-plan-column pricing-plan-column-muted">
                      <h4>Not included</h4>
                      <ul className="pricing-plan-list pricing-plan-list-muted">
                        {addon.excludes.map((item) => (
                          <li key={item}>
                            <Minus size={14} />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {addon.upsell && <p className="pricing-plan-upsell">{addon.upsell}</p>}

                  <div className="pricing-addon-actions">
                    <a href={addon.cta.href} className="btn btn-secondary">
                      {addon.cta.label}
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section shiftreadiness-section demo-final-cta">
          <div className="container">
            <div className="glass-card sr-final-card pricing-final-card">
              <div>
                <div className="badge badge-cyan">Need a buying shortcut?</div>
                <h2>Use the sample report and technical review to choose your plan with less guesswork.</h2>
                <p>
                  If the difference between Starter, Professional and Blueprint still feels unclear, review the sample
                  report, then book a technical review and we can map the right commercial path to your environment.
                </p>
              </div>
              <div className="sr-final-actions">
                <Link href="/sample-report" className="btn btn-primary btn-glow">
                  View sample report
                  <Eye size={17} />
                </Link>
                <Link href="/technical-review?source=pricing" className="btn btn-secondary">
                  Book technical review
                  <ShieldCheck size={17} />
                </Link>
                <Link href="/sign-up" className="btn btn-secondary">
                  Start free assessment
                  <Sparkles size={17} />
                </Link>
                <Link href="/" className="btn btn-secondary">
                  Back to home
                  <Building2 size={17} />
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
