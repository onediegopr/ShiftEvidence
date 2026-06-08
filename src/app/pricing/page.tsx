import type { Metadata } from "next";
import Link from "next/link";
import { Fragment } from "react";
import {
  ArrowRight,
  Brain,
  Building2,
  Check,
  CheckCircle2,
  Eye,
  Lock,
  Minus,
  X,
  Radar,
  Receipt,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import CommercialResources from "../../components/CommercialResources";
import {
  getBillingCadenceLabel,
  marketingAddOns,
  marketingPlans,
  paymentOptionsCopy,
} from "../../lib/pricingPlans";

export const metadata: Metadata = {
  title: "Pricing Plans | Shift Evidence",
  description: "Transparent, modular pre-migration assessment plans for infrastructure teams, MSPs, and partners planning VMware exits.",
  alternates: {
    canonical: "https://www.shiftevidence.com/pricing",
  },
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

type ComparisonTone = "included" | "limited" | "premium" | "excluded";
type ComparisonPlanId = "starter_readiness" | "professional_assessment" | "migration_blueprint";

type ComparisonCell = {
  label: string;
  tone: ComparisonTone;
};

type ComparisonRow = {
  feature: string;
  values: Record<ComparisonPlanId, ComparisonCell>;
};

const comparisonPlanMeta: Record<
  ComparisonPlanId,
  {
    tag: string;
    summary: string;
    question: string;
    deliverable: string;
    buyingMoment: string;
  }
> = {
  starter_readiness: {
    tag: "Fastest checkpoint",
    summary: "Best when you need proof before budget, scope, or deeper migration work.",
    question: "Should we go deeper?",
    deliverable: "Readiness checkpoint",
    buyingMoment: "Before scope",
  },
  professional_assessment: {
    tag: "Recommended",
    summary: "Assessment depth: prove risk, cost exposure and VM-level readiness before planning.",
    question: "What is risky?",
    deliverable: "Decision pack",
    buyingMoment: "Before approval",
  },
  migration_blueprint: {
    tag: "Planning-led",
    summary: "Planning depth: convert assessment findings into waves, rollback paths and execution gates.",
    question: "How do we move?",
    deliverable: "Migration plan",
    buyingMoment: "Before execution",
  },
};

const planComparisonSections = [
  {
    title: "Decision difference",
    rows: [
      {
        feature: "Primary question answered",
        values: {
          starter_readiness: { label: "Should we go deeper?", tone: "limited" },
          professional_assessment: { label: "What is risky?", tone: "premium" },
          migration_blueprint: { label: "How do we move?", tone: "included" },
        },
      },
      {
        feature: "Main deliverable",
        values: {
          starter_readiness: { label: "Readiness checkpoint", tone: "limited" },
          professional_assessment: { label: "Decision pack", tone: "premium" },
          migration_blueprint: { label: "Migration plan", tone: "included" },
        },
      },
      {
        feature: "Best buying moment",
        values: {
          starter_readiness: { label: "Before scope", tone: "limited" },
          professional_assessment: { label: "Before approval", tone: "premium" },
          migration_blueprint: { label: "Before execution", tone: "included" },
        },
      },
    ] satisfies ComparisonRow[],
  },
  {
    title: "Assessment foundation",
    rows: [
      {
        feature: "Evidence-led intake and readiness checkpoint",
        values: {
          starter_readiness: { label: "Included", tone: "included" },
          professional_assessment: { label: "Included", tone: "included" },
          migration_blueprint: { label: "Included", tone: "included" },
        },
      },
      {
        feature: "RVTools ingestion and guided evidence review",
        values: {
          starter_readiness: { label: "Included", tone: "included" },
          professional_assessment: { label: "Included", tone: "included" },
          migration_blueprint: { label: "Included", tone: "included" },
        },
      },
      {
        feature: "Client workspace for evidence and report delivery",
        values: {
          starter_readiness: { label: "Included", tone: "included" },
          professional_assessment: { label: "Included", tone: "included" },
          migration_blueprint: { label: "Included", tone: "included" },
        },
      },
      {
        feature: "Missing-data checklist before deeper scope",
        values: {
          starter_readiness: { label: "Included", tone: "included" },
          professional_assessment: { label: "Included", tone: "included" },
          migration_blueprint: { label: "Included", tone: "included" },
        },
      },
    ] satisfies ComparisonRow[],
  },
  {
    title: "Analysis depth",
    rows: [
      {
        feature: "Licensing and readiness analysis depth",
        values: {
          starter_readiness: { label: "Initial signal", tone: "limited" },
          professional_assessment: { label: "Full review", tone: "premium" },
          migration_blueprint: { label: "Full review", tone: "premium" },
        },
      },
      {
        feature: "Storage Destination Readiness coverage",
        values: {
          starter_readiness: { label: "Not included", tone: "excluded" },
          professional_assessment: { label: "Included", tone: "included" },
          migration_blueprint: { label: "Included", tone: "included" },
        },
      },
      {
        feature: "Senior Migration Advisor depth",
        values: {
          starter_readiness: { label: "Not included", tone: "excluded" },
          professional_assessment: { label: "Included", tone: "included" },
          migration_blueprint: { label: "Included", tone: "included" },
        },
      },
      {
        feature: "Project Memory Vault and retained advisory context",
        values: {
          starter_readiness: { label: "Not included", tone: "excluded" },
          professional_assessment: { label: "Included", tone: "included" },
          migration_blueprint: { label: "Included", tone: "included" },
        },
      },
      {
        feature: "VM-by-VM migration risk matrix",
        values: {
          starter_readiness: { label: "Not included", tone: "excluded" },
          professional_assessment: { label: "Included", tone: "included" },
          migration_blueprint: { label: "Included", tone: "included" },
        },
      },
    ] satisfies ComparisonRow[],
  },
  {
    title: "Deliverables and planning",
    rows: [
      {
        feature: "Report sophistication",
        values: {
          starter_readiness: { label: "Basic assessment", tone: "limited" },
          professional_assessment: { label: "Executive + technical", tone: "premium" },
          migration_blueprint: { label: "Decision pack", tone: "premium" },
        },
      },
      {
        feature: "Prioritized remediation recommendations",
        values: {
          starter_readiness: { label: "Not included", tone: "excluded" },
          professional_assessment: { label: "Included", tone: "included" },
          migration_blueprint: { label: "Included", tone: "included" },
        },
      },
      {
        feature: "Migration wave planning",
        values: {
          starter_readiness: { label: "Not included", tone: "excluded" },
          professional_assessment: { label: "Not included", tone: "excluded" },
          migration_blueprint: { label: "Included", tone: "included" },
        },
      },
      {
        feature: "Pilot candidate selection",
        values: {
          starter_readiness: { label: "Not included", tone: "excluded" },
          professional_assessment: { label: "Not included", tone: "excluded" },
          migration_blueprint: { label: "Included", tone: "included" },
        },
      },
      {
        feature: "Rollback framework",
        values: {
          starter_readiness: { label: "Not included", tone: "excluded" },
          professional_assessment: { label: "Not included", tone: "excluded" },
          migration_blueprint: { label: "Included", tone: "included" },
        },
      },
      {
        feature: "Technical review session",
        values: {
          starter_readiness: { label: "Not included", tone: "excluded" },
          professional_assessment: { label: "Not included", tone: "excluded" },
          migration_blueprint: { label: "Included", tone: "included" },
        },
      },
      {
        feature: "Migration day checklist and remediation roadmap",
        values: {
          starter_readiness: { label: "Not included", tone: "excluded" },
          professional_assessment: { label: "Not included", tone: "excluded" },
          migration_blueprint: { label: "Included", tone: "included" },
        },
      },
      {
        feature: "Best fit",
        values: {
          starter_readiness: { label: "Early validation", tone: "limited" },
          professional_assessment: { label: "Decision-ready", tone: "premium" },
          migration_blueprint: { label: "Execution planning", tone: "included" },
        },
      },
    ] satisfies ComparisonRow[],
  },
] as const;

export default function PricingPage() {
  const corePlans = marketingPlans.filter((plan) => plan.id !== "msp_partner");
  const partnerPlan = marketingPlans.find((plan) => plan.id === "msp_partner") ?? marketingPlans[marketingPlans.length - 1];
  const comparisonPlans = corePlans.filter(
    (plan): plan is (typeof corePlans)[number] & { id: ComparisonPlanId } =>
      plan.id === "starter_readiness" || plan.id === "professional_assessment" || plan.id === "migration_blueprint",
  );

  const renderComparisonCell = (value: ComparisonCell) => {
    const Icon = value.tone === "excluded" ? X : CheckCircle2;

    return (
      <span className={`pricing-compare-value pricing-compare-value-${value.tone}`}>
        <Icon size={15} />
        <span>{value.label}</span>
      </span>
    );
  };

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

        <section className="section shiftreadiness-section pricing-resource-section">
          <div className="container">
            <CommercialResources
              eyebrow="Buyer enablement"
              title="Give stakeholders the right PDF for the right conversation."
              copy="A short brief, a full product brochure and a Blueprint overview help buyers separate readiness assessment from deeper migration planning."
              featured="blueprint"
            />
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

                    <p className="pricing-plan-note">{plan.paymentNote}</p>

                    {plan.id === "starter_readiness" || plan.id === "professional_assessment" || plan.id === "migration_blueprint" ? (
                      <div className="pricing-plan-decision-strip">
                        <div>
                          <span>Answers</span>
                          <strong>{comparisonPlanMeta[plan.id].question}</strong>
                        </div>
                        <div>
                          <span>Delivers</span>
                          <strong>{comparisonPlanMeta[plan.id].deliverable}</strong>
                        </div>
                        <div>
                          <span>Use when</span>
                          <strong>{comparisonPlanMeta[plan.id].buyingMoment}</strong>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="pricing-plan-columns">
                    <div className="pricing-plan-column">
                      <h4>Included at this level</h4>
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
                      <h4>Not included at this level</h4>
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

            <div className="pricing-compare-shell">
              <div className="pricing-compare-head">
                <div>
                  <div className="badge badge-cyan">Plan Comparison</div>
                  <h3>Compare the plans without reading every card.</h3>
                  <p>
                    A cleaner view of what changes between a readiness checkpoint, a decision-grade assessment and a
                    planning engagement.
                  </p>
                </div>
              </div>

              <div className="pricing-compare-table-wrap">
                <table className="pricing-compare-table">
                  <thead>
                    <tr>
                      <th scope="col">Capability</th>
                      {comparisonPlans.map((plan) => (
                        <th
                          key={plan.id}
                          scope="col"
                          className={
                            plan.id === "professional_assessment"
                              ? "pricing-compare-col-highlight"
                              : plan.id === "migration_blueprint"
                                ? "pricing-compare-col-blueprint"
                                : undefined
                          }
                        >
                          <div className="pricing-compare-plan-head">
                            <span className={`pricing-compare-plan-tag pricing-compare-plan-tag-${plan.accent}`}>
                              {comparisonPlanMeta[plan.id].tag}
                            </span>
                            <strong>{plan.name}</strong>
                            <span>{plan.price}</span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {planComparisonSections.map((section, sectionIndex) => (
                      <Fragment key={section.title}>
                        <tr
                          key={`${section.title}-section`}
                          className="pricing-compare-section-row"
                          data-section-tone={
                            sectionIndex === 0
                              ? "decision"
                              : sectionIndex === 1
                                ? "foundation"
                                : sectionIndex === 2
                                  ? "analysis"
                                  : "planning"
                          }
                        >
                          <th scope="rowgroup" colSpan={comparisonPlans.length + 1}>
                            <span>{section.title}</span>
                          </th>
                        </tr>
                        {section.rows.map((row) => (
                          <tr key={`${section.title}-${row.feature}`}>
                            <th scope="row" className="pricing-compare-feature-cell">
                              <span>{row.feature}</span>
                            </th>
                            {comparisonPlans.map((plan) => (
                              <td
                                key={`${row.feature}-${plan.id}`}
                                className={
                                  plan.id === "professional_assessment"
                                    ? "pricing-compare-col-highlight"
                                    : plan.id === "migration_blueprint"
                                      ? "pricing-compare-col-blueprint"
                                      : undefined
                                }
                              >
                                {renderComparisonCell(row.values[plan.id])}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </Fragment>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <th scope="row" className="pricing-compare-feature-cell pricing-compare-footer-label">
                        Next step
                      </th>
                      {comparisonPlans.map((plan) => (
                        <td
                          key={`cta-${plan.id}`}
                          className={
                            plan.id === "professional_assessment"
                              ? "pricing-compare-col-highlight"
                              : plan.id === "migration_blueprint"
                                ? "pricing-compare-col-blueprint"
                                : undefined
                          }
                        >
                          <div className="pricing-compare-footer-card">
                            <small>{comparisonPlanMeta[plan.id].tag}</small>
                            <a href={plan.cta.href} className="btn btn-secondary btn-sm pricing-compare-footer-btn">
                              {plan.cta.label}
                            </a>
                          </div>
                        </td>
                      ))}
                    </tr>
                  </tfoot>
                </table>
              </div>

              <p className="pricing-compare-note">
                Blueprint is the only tier that adds migration planning structure, rollback framing and a technical
                review session. Professional is the deepest assessment tier before planning engagement begins.
              </p>
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
