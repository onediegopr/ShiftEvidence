import {
  ArrowRight,
  BarChart3,
  Check,
  Layers,
  Minus,
  Search,
  ShieldCheck,
} from "lucide-react";

const plans = [
  {
    name: "Free Readiness Check",
    price: "USD 0",
    bestFor: "Teams that want a first signal before committing budget.",
    accent: "free",
    cta: { label: "Start Free Readiness Check", href: "/sign-up" },
    includes: [
      "Limited RVTools / evidence intake",
      "Summarized inventory",
      "Basic readiness score",
      "General risk level",
      "Simple savings estimate",
      "Preliminary top risks",
      "Report preview",
      "Locked module visibility",
    ],
    excludes: [
      "Full downloadable report",
      "VM-by-VM matrix",
      "Editable assumptions",
      "Deep recommendations",
      "Storage Destination Readiness",
      "Target architecture recommendation",
      "Review call",
    ],
    upsell:
      "Unlock the full Readiness Report to see detailed cost/risk, prioritized recommendations and downloadable executive/technical output.",
  },
  {
    name: "Readiness Report",
    price: "From USD 249",
    bestFor: "Teams that need a complete migration readiness report before taking action.",
    accent: "core",
    cta: { label: "Unlock Readiness Report", href: "/sign-up" },
    includes: [
      "Complete VMware -> Proxmox readiness analysis",
      "Full Cost / Risk Engine",
      "Downloadable report",
      "Executive summary",
      "Technical summary",
      "Detailed scoring",
      "Editable assumptions",
      "Prioritized recommendations",
      "Full risk findings",
      "Evidence confidence",
      "Annual and 3-year savings",
      "Subscription delta",
    ],
    excludes: [
      "Deep Storage Destination Readiness",
      "SAN / NAS / ZFS / Ceph / Hybrid target recommendation",
      "Implementation design",
      "Migration runbook",
      "Review call",
      "Automatic migration",
    ],
    upsell:
      "Add Storage Destination Readiness if you need to validate the target architecture before committing to Proxmox.",
  },
  {
    name: "Readiness Report Pro",
    price: "From USD 690",
    bestFor: "MSPs, consultants and larger teams that need deeper technical segmentation.",
    accent: "pro",
    cta: { label: "Explore Pro Report", href: "/contact" },
    includes: [
      "Everything in Readiness Report",
      "VM-by-VM risk matrix",
      "Filters by criticality, size, host, cluster and datastore",
      "Migration complexity bands",
      "Workload group recommendations",
      "Remediation priority",
      "Advanced assumptions",
      "Executive and technical outputs",
      "Preparation for review call",
    ],
    excludes: [
      "Storage Destination Readiness unless bundled",
      "Final signed architecture design",
      "Implementation",
      "Production validation",
      "Managed migration",
      "Review call unless purchased",
    ],
    upsell:
      "Bundle Storage Readiness or book a Technical Review Call to turn the report into a migration decision plan.",
  },
];

const addOns = [
  {
    name: "Storage Destination Readiness",
    price: "From USD 290",
    bestFor:
      "Teams that need to understand whether their target storage architecture is reasonable before migration.",
    cta: { label: "Add Storage Readiness", href: "/contact" },
    includes: [
      "Current storage review",
      "Target storage architecture analysis",
      "Agnostic recommendation",
      "SAN / NAS / NFS / iSCSI / ZFS / Ceph / Hybrid scenarios",
      "Storage risk level",
      "Proxmox compatibility considerations",
      "Migration impact",
      "Additional report section",
    ],
    excludes: [
      "Final implementation design",
      "Production benchmark",
      "Hardware procurement",
      "Storage configuration",
      "Managed operation",
      "Guaranteed performance validation",
    ],
    upsell:
      "Storage is optional. Add it only when target architecture matters for this assessment.",
  },
  {
    name: "Technical Review Call",
    price: "From USD 390",
    bestFor: "Teams that want a human review of the readiness findings before making a decision.",
    cta: { label: "Book Technical Review", href: "/contact" },
    includes: [
      "Report walkthrough",
      "Risk discussion",
      "Assumptions review",
      "Prioritization",
      "Next-step recommendations",
    ],
    excludes: [
      "Implementation",
      "Migration execution",
      "Ongoing support",
      "Managed infrastructure",
      "Guaranteed outcome",
    ],
    upsell:
      "Use the call to align the report with your internal decision process and architecture review.",
  },
];

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
  return (
    <main className="shiftreadiness-page">
      <header className="shiftreadiness-topbar">
        <div className="container shiftreadiness-topbar-inner">
          <a href="/" className="shiftreadiness-brand">
            <span className="shiftreadiness-brand-mark">SR</span>
            <span>
              <strong>ShiftReadiness</strong>
              <small>Infrastructure readiness before you migrate.</small>
            </span>
          </a>
          <a href="/" className="shiftreadiness-backlink">
            Back to Shift Evidence
          </a>
        </div>
      </header>

      <section className="section shiftreadiness-hero">
        <div className="bg-mesh"></div>
        <div className="container shiftreadiness-hero-grid">
          <div className="shiftreadiness-hero-copy">
            <div className="badge badge-cyan">ShiftReadiness</div>
            <h1>
              Know your VMware {"->"} Proxmox cost, risk and readiness before you migrate.
            </h1>
            <p className="shiftreadiness-lead">
              Upload your RVTools export, validate your assumptions, estimate subscription delta,
              and decide whether your target infrastructure is ready - with optional Storage
              Destination Readiness when architecture matters.
            </p>
            <div className="shiftreadiness-actions">
              <a href="/sign-up" className="btn btn-primary btn-glow">
                Start Free Readiness Check
                <ArrowRight size={18} />
              </a>
              <a href="#pricing" className="btn btn-secondary">
                View plans and add-ons
              </a>
            </div>
            <p className="shiftreadiness-microcopy">
              No production access. No migration execution. No changes to your environment.
            </p>
          </div>

          <div className="shiftreadiness-hero-panel glass-card">
            <div className="shiftreadiness-panel-grid">
              <div className="shiftreadiness-panel-stat">
                <span>Included</span>
                <strong>Cost / Risk Engine</strong>
                <p>Always part of every assessment.</p>
              </div>
              <div className="shiftreadiness-panel-stat">
                <span>Optional</span>
                <strong>Storage Destination Readiness</strong>
                <p>Only when target architecture needs deeper validation.</p>
              </div>
              <div className="shiftreadiness-panel-stat">
                <span>Focus</span>
                <strong>Evidence before migration</strong>
                <p>Decision support for VMware exit planning.</p>
              </div>
              <div className="shiftreadiness-panel-stat">
                <span>Output</span>
                <strong>Readiness report</strong>
                <p>Executive and technical visibility in one package.</p>
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
                  <span>Minutes (Instant Preview)</span>
                </div>
                <div className="sr-comparison-metric sr-comparison-metric-cyan">
                  <label>Typical Cost</label>
                  <span>Free to $690</span>
                </div>
              </div>
              <ul className="sr-comparison-list sr-comparison-list-cyan">
                <li>
                  <Check size={16} />
                  <span>Automated evidence intake (RVTools/vSphere exports)</span>
                </li>
                <li>
                  <Check size={16} />
                  <span>Instant calculation of licensing delta & annual savings</span>
                </li>
                <li>
                  <Check size={16} />
                  <span>Standardized, executive-ready PDF report downloaded instantly</span>
                </li>
                <li>
                  <Check size={16} />
                  <span>Identify blockers, risks, and sizing issues before paying consultants</span>
                </li>
              </ul>
              <a href="/sign-up" className="btn btn-primary btn-glow">
                Generate your readiness view
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
              Start small, unlock the full report when needed, and add storage analysis only when
              the target architecture deserves deeper validation.
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
              <a href="#pricing" className="btn btn-secondary">
                Compare plans
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}



