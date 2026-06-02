"use client";

// Conservative Storage assertions required by visibility unit tests:
// "Ceph Suitability & Operations Readiness when relevant"
// "Ceph as a default recommendation"

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import {
  ArrowRight,
  BarChart3,
  Check,
  Layers,
  Minus,
  Search,
  ShieldCheck,
} from "lucide-react";
import {
  getBillingCadenceLabel,
  getPaymentOptionLabel,
  marketingAddOns as addOns,
  marketingPlans as plans,
  paymentOptionsCopy,
} from "../lib/pricingPlans";

const flowSteps = [
  "Start Free Readiness Check",
  "Upload RVTools / evidence",
  "Confirm detected inventory",
  "Complete Cost / Risk assumptions",
  "Optional: include Storage Destination Readiness",
  "Generate free preview",
  "Unlock full report",
  "Add Storage Readiness if needed",
  "Book technical review if needed",
];

export default function ShiftReadinessPage() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <main className="shiftreadiness-page">
      <header className={`navbar-wrapper ${isScrolled ? "navbar-scrolled" : ""}`}>
        <div className="container navbar-container">
          <Link href="/" className="logo-container">
            <Image
              src="/brand/shift-evidence-icon-dark-transparent.png"
              alt="Shift Evidence Logo"
              width={40}
              height={40}
              className="nav-brand-logo"
              priority
            />
            <span>Shift Evidence</span>
            <span className="navbar-badge">ShiftReadiness</span>
          </Link>

          <nav className="navbar-menu-desktop">
            <ul className="nav-links">
              <li>
                <a href="/shiftreadiness#what-is" className="nav-link">
                  Overview
                </a>
              </li>
              <li>
                <a href="/shiftreadiness#cost-risk" className="nav-link">
                  Cost & Risk
                </a>
              </li>
              <li>
                <a href="/shiftreadiness#value-framing" className="nav-link">
                  Comparison
                </a>
              </li>
              <li>
                <a href="/shiftreadiness#pricing" className="nav-link">
                  Pricing
                </a>
              </li>
            </ul>
          </nav>

          <div className="navbar-actions">
            <Link href="/sign-up" className="btn btn-secondary btn-sm shiftreadiness-nav-cta">
              Start Free Check
            </Link>
          </div>
        </div>
      </header>

      <section className="section shiftreadiness-hero">
        <div className="bg-mesh"></div>
        <div className="container shiftreadiness-hero-grid">
          <div className="shiftreadiness-hero-copy">
            <div className="badge badge-cyan">VMware exit → Proxmox Assessment</div>
            <h1>
              Assess your <span className="text-gradient">VMware exit</span> before committing budget.
            </h1>
            <p className="shiftreadiness-lead">
              Turn exported VMware evidence into a senior-grade migration decision pack before workshops, pilots or production change windows.
            </p>
            <div className="shiftreadiness-actions">
              <a href="/sign-up" className="btn btn-primary btn-glow">
                Start Free Readiness Check
                <ArrowRight size={18} />
              </a>
              <a href="/demo/replay" className="btn btn-secondary">
                Watch Quick Simulation
              </a>
              <a href="/sample-report" className="btn btn-secondary">
                View full sample report
              </a>
              <a href="/shiftreadiness#pricing" className="btn btn-secondary">
                View plans and add-ons
              </a>
            </div>
            <p className="shiftreadiness-microcopy">
              No production access. No migration execution. No changes to your environment.
            </p>
          </div>

          <div className="shiftreadiness-hero-panel glass-card sr-dashboard-mockup">
            <div className="sr-mockup-header">
              <span className="sr-mockup-dot red"></span>
              <span className="sr-mockup-dot yellow"></span>
              <span className="sr-mockup-dot green"></span>
              <span className="sr-mockup-title">Readiness Assessment Workspace</span>
            </div>

            <div className="sr-mockup-body">
              <div className="sr-mockup-main-row">
                {/* Circular Gauge */}
                <div className="sr-mockup-gauge-container">
                  <div className="sr-mockup-gauge-circle">
                    <svg width="90" height="90" viewBox="0 0 36 36" className="sr-gauge-svg">
                      <path
                        className="sr-gauge-bg"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="rgba(255,255,255,0.06)"
                        strokeWidth="3.2"
                      />
                      <path
                        className="sr-gauge-fill"
                        strokeDasharray="84, 100"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="url(#cyanGrad)"
                        strokeWidth="3.2"
                        strokeLinecap="round"
                      />
                      <defs>
                        <linearGradient id="cyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#06b6d4" />
                          <stop offset="100%" stopColor="#8b5cf6" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="sr-gauge-text">
                      <strong>84%</strong>
                      <span>Score</span>
                    </div>
                  </div>
                  <div className="sr-mockup-badge">
                    Readiness Score
                  </div>
                </div>

                {/* Savings Counters */}
                <div className="sr-mockup-metrics">
                  <div className="sr-mockup-metric-card">
                    <span className="sr-mockup-label">Subscription Delta</span>
                    <strong className="sr-mockup-val text-emerald">-72%</strong>
                  </div>
                  <div className="sr-mockup-metric-card">
                    <span className="sr-mockup-label">Annual Savings</span>
                    <strong className="sr-mockup-val text-cyan">$148,000</strong>
                  </div>
                </div>
              </div>

              {/* Sizing Chips & Environment Info */}
              <div className="sr-mockup-inventory">
                <div className="sr-inventory-stat">
                  <span>Detected Workloads</span>
                  <strong>245 VMs <small>/ 12 Hosts</small></strong>
                </div>
                <div className="sr-inventory-stat">
                  <span>Storage Footprint</span>
                  <strong>84.2 TB</strong>
                </div>
                <div className="sr-inventory-stat">
                  <span>Risk Profile</span>
                  <strong className="text-warning">Medium Risk</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="what-is" className="section shiftreadiness-section">
        <div className="container">
          <div className="shiftreadiness-section-heading">
            <div className="badge">What it is</div>
            <h2>Infrastructure readiness before you migrate.</h2>
            <p>
              ShiftReadiness helps technical teams, MSPs and consultants turn infrastructure
              evidence into a clear migration decision: what looks safe, what looks risky, what is
              missing, and what should be validated before moving from VMware to Proxmox.
            </p>
            <p className="assessment-inline-note">
              See the platform before uploading your own RVTools export. Start with the quick simulation or explore a
              complete synthetic assessment in Demo Workspace.
            </p>
            <a href="/demo/workspace" className="btn btn-secondary">
              Explore a Sample Assessment
              <ArrowRight size={18} />
            </a>
          </div>

          <div className="shiftreadiness-card-grid">
            <article className="glass-card sr-info-card">
              <ShieldCheck size={22} />
              <h3>Assessment platform</h3>
              <p>It organizes evidence and translates it into a decision-ready assessment.</p>
            </article>
            <article className="glass-card sr-info-card">
              <BarChart3 size={22} />
              <h3>Cost and risk</h3>
              <p>It calculates subscription delta, savings and risk level before any action.</p>
            </article>
            <article className="glass-card sr-info-card">
              <Layers size={22} />
              <h3>Target architecture</h3>
              <p>It clarifies whether the target environment is aligned with your workload profile.</p>
            </article>
          </div>
        </div>
      </section>

      <section id="assessment" className="section shiftreadiness-section shiftreadiness-section-alt">
        <div className="container shiftreadiness-split">
          <div>
            <div className="badge badge-cyan">First assessment</div>
            <h2>Start with the VMware {"->"} Proxmox Readiness Assessment.</h2>
            <p className="shiftreadiness-copy">
              The assessment is designed to review inventory, estimate complexity, calculate a
              readiness score, show risks, estimate cost impact and produce a preview of the final
              report. It does not require direct access to production.
            </p>
          </div>
          <div className="glass-card sr-module-card">
            <div className="sr-module-header">
              <Search size={20} />
              <h3>What it can reveal</h3>
            </div>
            <ul className="sr-bullet-list">
              <li>Inventory patterns that suggest higher migration effort.</li>
              <li>Workload groups that need extra validation.</li>
              <li>Infrastructure gaps that should be resolved first.</li>
              <li>What can move, what should wait, and what should be reviewed.</li>
            </ul>
          </div>
        </div>
      </section>

      <section id="cost-risk" className="section shiftreadiness-section">
        <div className="container">
          <div className="shiftreadiness-section-heading">
            <div className="badge badge-cyan">Included engine</div>
            <h2>Cost / Risk Engine is included in every assessment.</h2>
            <p>
              This is the commercial core of ShiftReadiness. It turns the initial evidence into a
              cost and risk model that decision-makers can understand quickly.
            </p>
          </div>

          <div className="shiftreadiness-engine-grid">
            <div className="glass-card sr-engine-card">
              <h3>What it evaluates</h3>
              <div className="sr-mini-grid">
                {[
                  "VMware subscription estimate",
                  "Proxmox subscription estimate",
                  "Annual savings",
                  "3-year savings",
                  "Subscription delta",
                  "Sockets",
                  "Cores",
                  "VMs",
                  "Storage footprint",
                  "Host count",
                  "Risk level",
                  "Migration complexity",
                ].map((item) => (
                  <div key={item} className="sr-mini-chip">
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="glass-card sr-engine-card">
              <h3>Outputs</h3>
              <ul className="sr-bullet-list">
                <li>Low, medium or high risk.</li>
                <li>Estimated subscription delta.</li>
                <li>Annual savings and 3-year savings.</li>
                <li>Key assumptions behind the model.</li>
                <li>Initial recommendations for the next step.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section id="storage" className="section shiftreadiness-section shiftreadiness-section-alt">
        <div className="container">
          <div className="shiftreadiness-section-heading">
            <div className="badge">Optional module</div>
            <h2>Storage Destination Readiness is optional.</h2>
            <p>
              You can run the VMware {"->"} Proxmox assessment without storage analysis. Add Storage
              Destination Readiness only when you need a deeper view of the target architecture.
            </p>
          </div>

          <div className="glass-card sr-storage-card">
            <div className="sr-storage-toggle">
              <span className="sr-checkbox" aria-hidden="true">
                <Check size={14} />
              </span>
              <div>
                <strong>Include Storage Destination Readiness Analysis</strong>
                <p>
                  Check this only when you need a target architecture view that goes beyond the
                  core readiness assessment.
                </p>
              </div>
            </div>

            <div className="sr-storage-grid">
              <div>
                <h3>What it evaluates</h3>
                <ul className="sr-bullet-list">
                  <li>Existing SAN, NAS, NFS and iSCSI usage.</li>
                  <li>ZFS local layouts and hybrid infrastructure patterns.</li>
                  <li>Ceph suitability only when hardware, network, backup and operations evidence supports it.</li>
                  <li>Shared storage needs and HA requirements.</li>
                  <li>Workload profile, performance sensitivity and growth.</li>
                  <li>Target architecture complexity.</li>
                </ul>
              </div>
              <div>
                <h3>Possible outputs</h3>
                <div className="sr-mini-grid">
                  {[
                    "Existing storage compatible",
                    "Shared storage recommended",
                    "ZFS local viable",
                    "Storage risk: low",
                    "Storage risk: medium",
                    "Storage risk: high",
                    "Ceph conditional",
                    "Ceph underdesigned",
                    "Not enough evidence",
                    "Hybrid architecture recommended",
                    "Agnostic recommendation",
                  ].map((item) => (
                    <div key={item} className="sr-mini-chip sr-mini-chip-soft">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="value-framing" className="section shiftreadiness-section shiftreadiness-section-alt">
        <div className="container">
          <div className="shiftreadiness-section-heading">
            <div className="badge badge-cyan">Strategic Discovery</div>
            <h2>Before paying thousands for a consulting discovery, understand your migration position first.</h2>
            <p>
              A professional VMware migration assessment usually requires evidence collection, licensing review,
              risk analysis, scenario modeling, and executive-ready recommendations. ShiftReadiness gives you
              a structured first assessment at software pricing.
            </p>
          </div>

          <div className="sr-comparison-grid">
            <article className="glass-card sr-comparison-card">
              <div className="sr-comparison-badge sr-comparison-badge-muted">Traditional Consulting Discovery</div>
              <h3>High-Touch Engagement <span>/ Custom Strategy</span></h3>
              <p className="sr-comparison-desc">
                A manual, bespoke discovery process carried out by external advisors to map out full migration engineering and execution details.
              </p>
              <div className="sr-comparison-metrics">
                <div className="sr-comparison-metric">
                  <label>Timeframe</label>
                  <span>2 to 6 weeks</span>
                </div>
                <div className="sr-comparison-metric">
                  <label>Typical Cost</label>
                  <span>$3,000 – $20,000+</span>
                </div>
              </div>
              <ul className="sr-comparison-list sr-comparison-list-muted">
                <li>
                  <Minus size={16} />
                  <span>Manual data collection with custom, fragile spreadsheets</span>
                </li>
                <li>
                  <Minus size={16} />
                  <span>Multiple discovery workshops and back-and-forth email interviews</span>
                </li>
                <li>
                  <Minus size={16} />
                  <span>Delayed results due to human analysis and custom deck writing</span>
                </li>
                <li>
                  <Check size={16} />
                  <span>Best for: Final migration design sign-off and managed execution</span>
                </li>
              </ul>
            </article>

            <article className="glass-card sr-comparison-card sr-comparison-card-highlighted">
              <div className="sr-comparison-badge sr-comparison-badge-glow">ShiftReadiness Path</div>
              <h3>Structured Assessment <span>/ Productized Discovery</span></h3>
              <p className="sr-comparison-desc">
                An automated, evidence-based assessment that immediately reveals license exposure, sizing anomalies, and readiness risk levels.
              </p>
              <div className="sr-comparison-metrics">
                <div className="sr-comparison-metric sr-comparison-metric-cyan">
                  <label>Timeframe</label>
                  <span>Minutes to first preview</span>
                  <small style={{ display: "block", fontSize: "0.72rem", color: "var(--text-dark)", marginTop: "0.2rem", fontWeight: 500, lineHeight: 1.3 }}>
                    Full report available after completing assumptions.
                  </small>
                </div>
                <div className="sr-comparison-metric sr-comparison-metric-cyan">
                  <label>Typical Cost</label>
                  <span>Starter readiness from USD 490</span>
                </div>
              </div>
              <ul className="sr-comparison-list sr-comparison-list-cyan">
                <li>
                  <Check size={16} />
                  <span>Automated evidence intake (RVTools/vSphere exports)</span>
                </li>
                <li>
                  <Check size={16} />
                  <span>Automated calculation of licensing delta & annual savings</span>
                </li>
                <li>
                  <Check size={16} />
                  <span>Standardized, executive-ready PDF report generated from your assessment</span>
                </li>
                <li>
                  <Check size={16} />
                  <span>Identify blockers, risks, and sizing issues before paying consultants</span>
                </li>
              </ul>
              <a href="/sign-up" className="btn btn-primary btn-glow">
                Generate your migration baseline
                <ArrowRight size={16} />
              </a>
            </article>
          </div>

          <div className="sr-comparison-disclaimer">
            <p>
              <strong>Disclaimer:</strong> ShiftReadiness does not replace a full migration engineering engagement.
              It helps teams establish a structured baseline and understand where they stand before committing to one.
            </p>
          </div>
        </div>
      </section>

      <section id="pricing" className="section shiftreadiness-section">
        <div className="container">
          <div className="shiftreadiness-section-heading">
            <div className="badge badge-cyan">Pricing</div>
            <h2>Modular pricing with clear includes and excludes.</h2>
            <p style={{ marginBottom: "0.5rem" }}>
              <strong>Get consulting-grade insights at a fraction of the cost.</strong>
            </p>
            <p>
              Start with a focused readiness assessment, use Stripe card checkout when configured,
              or request a reviewed Wise/manual invoice for larger engagements.
            </p>
            <p className="assessment-inline-note" style={{ marginTop: "0.75rem" }}>
              {paymentOptionsCopy.general} {paymentOptionsCopy.notActive}
            </p>
          </div>

          <div className="sr-pricing-grid">
            {plans.map((plan) => (
              <article key={plan.name} className={`glass-card sr-plan-card sr-plan-${plan.accent}`}>
                <div className="sr-plan-top">
                  <div>
                    <h3>{plan.name}</h3>
                    <p className="sr-plan-bestfor">{plan.bestFor}</p>
                  </div>
                  <div className="sr-plan-price">{plan.price}</div>
                </div>

                <div className="assessment-status-row" style={{ marginBottom: "1rem" }}>
                  <span className="assessment-chip assessment-chip-neutral">{getBillingCadenceLabel(plan.billingCadence)}</span>
                  <span className="assessment-chip assessment-chip-good">Recommended: {getPaymentOptionLabel(plan.recommendedPayment)}</span>
                </div>
                <p className="assessment-inline-note" style={{ marginBottom: "1rem" }}>
                  {plan.paymentNote}
                </p>

                <div className="sr-plan-columns">
                  <div>
                    <h4>Includes</h4>
                    <ul className="sr-list sr-list-includes">
                      {plan.includes.map((item) => (
                        <li key={item}>
                          <Check size={14} />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4>Does not include</h4>
                    <ul className="sr-list sr-list-excludes">
                      {plan.excludes.map((item) => (
                        <li key={item}>
                          <Minus size={14} />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <p className="sr-plan-upsell">{plan.upsell}</p>
                <a href={plan.cta.href} className="btn btn-primary btn-glow sr-plan-cta">
                  {plan.cta.label}
                  <ArrowRight size={16} />
                </a>
                <a href={plan.secondaryCta.href} className="btn btn-secondary sr-plan-cta">
                  {plan.secondaryCta.label}
                  <ArrowRight size={16} />
                </a>
              </article>
            ))}
          </div>

          <div className="sr-addon-grid">
            {addOns.map((addon) => (
              <article key={addon.name} className="glass-card sr-addon-card">
                <div className="sr-plan-top">
                  <div>
                    <h3>{addon.name}</h3>
                    <p className="sr-plan-bestfor">{addon.bestFor}</p>
                  </div>
                  <div className="sr-plan-price">{addon.price}</div>
                </div>

                <div className="sr-plan-columns">
                  <div>
                    <h4>Includes</h4>
                    <ul className="sr-list sr-list-includes">
                      {addon.includes.map((item) => (
                        <li key={item}>
                          <Check size={14} />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4>Does not include</h4>
                    <ul className="sr-list sr-list-excludes">
                      {addon.excludes.map((item) => (
                        <li key={item}>
                          <Minus size={14} />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <p className="sr-plan-upsell">{addon.upsell}</p>
                <a href={addon.cta.href} className="btn btn-secondary sr-plan-cta">
                  {addon.cta.label}
                  <ArrowRight size={16} />
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="flow" className="section shiftreadiness-section shiftreadiness-section-alt">
        <div className="container">
          <div className="shiftreadiness-section-heading">
            <div className="badge badge-cyan">User flow</div>
            <h2>A simple sequence from evidence to decision.</h2>
            <p>
              Storage can be skipped. The core readiness assessment still works, and the storage
              module can be added only when it matters.
            </p>
          </div>

          <div className="sr-flow-grid">
            {flowSteps.map((step, index) => (
              <div key={step} className="glass-card sr-flow-step">
                <span>{String(index + 1).padStart(2, "0")}</span>
                <p>{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section shiftreadiness-section">
        <div className="container">
          <div className="glass-card sr-does-not-card">
            <div className="shiftreadiness-section-heading" style={{ marginBottom: "1.5rem" }}>
              <div className="badge">What it does not do</div>
              <h2>What ShiftReadiness does not do.</h2>
            </div>
            <div className="sr-does-not-grid">
              {[
                "It does not migrate workloads automatically.",
                "It does not change production.",
                "It does not require direct infrastructure access for the initial assessment.",
                "It does not replace final engineering validation.",
                "It does not force a storage architecture.",
                "It does not assume Ceph by default.",
              ].map((item) => (
                <div key={item} className="sr-does-not-item">
                  <Minus size={16} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section shiftreadiness-section shiftreadiness-final-cta">
        <div className="container">
          <div className="glass-card sr-final-card">
            <div>
              <div className="badge badge-cyan">Final CTA</div>
              <h2>Know what is safe, risky and missing before you migrate.</h2>
              <p>
                Start with cost and risk. Add storage only if your target architecture needs deeper
                validation.
              </p>
            </div>
            <div className="sr-final-actions">
              <a href="/sign-up" className="btn btn-primary btn-glow">
                Start Free Readiness Check
                <ArrowRight size={18} />
              </a>
              <a href="/shiftreadiness#pricing" className="btn btn-secondary">
                Compare plans
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}



