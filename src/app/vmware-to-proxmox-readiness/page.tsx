import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Brain,
  CheckCircle2,
  ClipboardCheck,
  Database,
  FileSpreadsheet,
  FileText,
  Layers3,
  Waves,
} from "lucide-react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { getPaymentOptionLabel, marketingPlans, paymentOptionsCopy } from "../../lib/pricingPlans";

export const metadata: Metadata = {
  title: "VMware to Proxmox Migration Readiness Assessment | Shift Evidence",
  description:
    "Understand VMware to Proxmox migration risk before execution: RVTools-based readiness, evidence gaps, Proxmox sizing, migration waves and executive-ready reports.",
  alternates: {
    canonical: "https://shiftevidence.com/vmware-to-proxmox-readiness",
  },
};

const trustBullets = [
  "Starts with RVTools",
  "No agents required",
  "No mandatory vCenter access",
  "No production changes",
  "Evidence-based scoring",
];

const steps = [
  {
    title: "Upload evidence",
    body: "Start with RVTools. Add context, backup, network or Proxmox target evidence when available.",
    icon: FileSpreadsheet,
  },
  {
    title: "Validate evidence quality",
    body: "The assessment separates confirmed findings, probable risks and missing information.",
    icon: ClipboardCheck,
  },
  {
    title: "Analyze migration risk",
    body: "Detect snapshots, storage issues, multi-NIC workloads, critical systems, backup gaps, network mapping gaps and sizing concerns.",
    icon: AlertTriangle,
  },
  {
    title: "Generate the decision pack",
    body: "Receive readiness score, confidence score, migration waves, Proxmox sizing, required validations and an executive-ready report.",
    icon: FileText,
  },
];

const outputs = [
  ["Executive Decision Report", FileText],
  ["Technical Assessment", ClipboardCheck],
  ["VM Risk Matrix", Layers3],
  ["Proxmox Sizing Preview", Database],
  ["Migration Wave Plan", Waves],
  ["Migration Recommendation Plan", ClipboardCheck],
  ["Evidence Missing Checklist", AlertTriangle],
  ["AI Advisory Notes", Brain],
  ["PDF Report", FileSpreadsheet],
] as const;

const evidenceSources = [
  ["RVTools export", "Required base evidence"],
  ["Technical context", "Required business context"],
  ["Backup export", "Optional high-value evidence"],
  ["Proxmox target export/API", "Optional destination validation"],
  ["Network/IPAM/diagram", "Optional network clarity"],
  ["CMDB/application list", "Optional dependency context"],
  ["Performance history", "Future/high-confidence sizing"],
];

const pricingPackages = marketingPlans.map((plan) => ({
  name: plan.name,
  price: plan.price,
  fit: plan.bestFor,
  payment: `${getPaymentOptionLabel(plan.recommendedPayment)} recommended`,
  includes: plan.includes.slice(0, 5).join(", ") + "...",
}));

const notAList = [
  "It is not a VM migration tool.",
  "It does not touch production.",
  "It does not guarantee zero downtime.",
  "It does not replace a pilot.",
  "It does not infer evidence that was not provided.",
  "It does not require agents for the base assessment.",
];

const faqs = [
  [
    "Do I need a credit card to start?",
    "No. You can review the demo and sample first, then choose a payment path. Stripe card checkout is used when configured, and manual invoice requests are available for business customers.",
  ],
  [
    "How do payments work?",
    paymentOptionsCopy.faq,
  ],
  [
    "Can I upgrade later?",
    "Yes. You can start with Starter Readiness and move into Professional Assessment, a scoped Blueprint, or an MSP Partner agreement when the business case is clear.",
  ],
  [
    "Is Storage Readiness included?",
    "Storage Destination Readiness is included in Professional Assessment and Blueprint-level work. It can use manual, agentless Proxmox/Ceph/PBS evidence to improve confidence.",
  ],
  [
    "Is the Senior Migration Advisor included?",
    "The Senior Migration Advisor is available in Professional Assessment, Blueprint and eligible MSP Partner agreements, where it can use assessment context, storage evidence and approved project memory to help explain findings and next steps.",
  ],
  [
    "Can MSPs or consultants use Shift Evidence with clients?",
    "Yes. Partner plans are designed for consultants, MSPs and integrators who need repeatable assessments, client-ready reports and a structured migration readiness workflow.",
  ],
  [
    "Can I request an invoice or billing support?",
    "Yes. Billing questions, invoices and enterprise purchasing requests can be routed through billing support.",
  ],
];

export default function VMwareToProxmoxReadinessPage() {
  return (
    <>
    <Navbar />
    <main className="shiftreadiness-page demo-page sales-offer-page">
      <section className="section demo-hero sales-hero">
        <div className="bg-mesh" />
        <div className="container sales-hero-grid">
          <div className="demo-hero-copy">
            <div className="badge badge-cyan">VMware -&gt; Proxmox readiness offer</div>
            <h1>VMware to Proxmox Migration Readiness Assessment</h1>
            <p className="demo-hero-subtitle">Before migrating VMware to Proxmox, know what can break.</p>
            <p className="demo-hero-body">
              ShiftReadiness turns VMware evidence into a professional migration decision pack: VM risk classification,
              Proxmox sizing, evidence gaps, migration waves, AI Advisory notes and executive-ready reports. It gives
              infrastructure teams, MSPs and consultants a stronger starting point before workshops, pilots or execution.
            </p>
            <div className="demo-badge-row sales-trust-row" aria-label="Readiness assessment operating boundaries">
              {trustBullets.map((bullet) => (
                <span key={bullet}>{bullet}</span>
              ))}
            </div>
            <div className="shiftreadiness-actions">
              <Link href="/sign-up" className="btn btn-primary btn-glow">
                Start readiness assessment
                <ArrowRight size={18} />
              </Link>
              <Link href="/demo/replay" className="btn btn-secondary">
                Watch 90-second simulation
              </Link>
              <Link href="/sample-report" className="btn btn-secondary">
                View full sample report
              </Link>
            </div>
          </div>

          <aside className="glass-card sales-hero-panel" aria-label="Assessment offer summary">
            <div className="demo-terminal-header">
              <span className="sr-mockup-dot red" />
              <span className="sr-mockup-dot yellow" />
              <span className="sr-mockup-dot green" />
              <strong>Assessment scope</strong>
            </div>
            <div className="sales-signal-list">
              <span>input: RVTools export + technical context</span>
              <span>output: readiness score + confidence score</span>
              <span>risk: snapshots / storage / network / backups / critical workloads</span>
              <span>deliverable: executive-ready PDF decision pack</span>
              <span>mode: planning assessment, no production changes</span>
            </div>
          </aside>
        </div>
      </section>

      <section className="section shiftreadiness-section">
        <div className="container sales-split">
          <div className="shiftreadiness-section-heading sales-left-heading">
            <div className="badge">The problem</div>
            <h2>Do not migrate VMware inventory. Migrate risk.</h2>
          </div>
          <article className="glass-card sales-copy-card">
            <p>
              Most migration projects start with the wrong question: &quot;Can we import the VM?&quot; The real question is:
              which workloads are safe, which are risky, what evidence is missing, and what must be prepared in Proxmox
              before production moves?
            </p>
          </article>
        </div>
      </section>

      <section className="section shiftreadiness-section shiftreadiness-section-alt">
        <div className="container">
          <div className="shiftreadiness-section-heading">
            <div className="badge badge-cyan">How it works</div>
            <h2>From VMware evidence to Proxmox migration decisions.</h2>
          </div>
          <div className="sales-step-grid">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <article key={step.title} className="glass-card sales-step-card">
                  <span>Step {index + 1}</span>
                  <Icon size={24} />
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section shiftreadiness-section">
        <div className="container sales-two-up">
          <article className="glass-card sample-report-inline-cta sales-mini-cta">
            <div>
              <div className="badge badge-cyan">Demo Workspace</div>
              <h2>See how a VMware export becomes a migration readiness plan.</h2>
              <p>
                Explore a synthetic Demo Workspace before starting your own assessment.
              </p>
            </div>
            <Link href="/demo/workspace" className="btn btn-primary btn-glow">
              Explore a Sample Assessment
              <ArrowRight size={18} />
            </Link>
          </article>

          <article className="glass-card sample-report-inline-cta sales-mini-cta">
            <div>
              <div className="badge badge-cyan">See the deliverable</div>
              <h2>View the premium public sample report v3.</h2>
              <p>
                The sample report shows the premium executive and technical output: scores, storage readiness,
                licensing exposure, risk findings, advisor examples, migration waves, blueprint decision language and next steps.
              </p>
            </div>
            <div className="sales-inline-actions">
              <Link href="/sample-report" className="btn btn-primary btn-glow">
                View full sample report
                <ArrowRight size={18} />
              </Link>
              <a
                href="/sample-reports/proxmox-migration-readiness-premium-sample-report-v3.pdf"
                className="btn btn-secondary"
                target="_blank"
                rel="noreferrer"
              >
                Download full sample PDF v3
              </a>
              <a
                href="/marketing/shift-evidence-product-brochure.pdf"
                className="btn btn-secondary"
                target="_blank"
                rel="noreferrer"
              >
                Product brochure
              </a>
              <a
                href="/marketing/migration-blueprint-overview.pdf"
                className="btn btn-secondary"
                target="_blank"
                rel="noreferrer"
              >
                Blueprint overview
              </a>
            </div>
          </article>
        </div>
      </section>

      <section className="section shiftreadiness-section shiftreadiness-section-alt">
        <div className="container">
          <div className="shiftreadiness-section-heading">
            <div className="badge">What you receive</div>
            <h2>A compact decision pack for executives and technical teams.</h2>
          </div>
          <div className="demo-output-grid sales-output-grid">
            {outputs.map(([title, Icon]) => (
              <article key={title} className="glass-card demo-output-card">
                <Icon size={22} />
                <h3>{title}</h3>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section shiftreadiness-section">
        <div className="container sales-two-up">
          <article className="glass-card sales-copy-card sales-conservative-card">
            <div className="badge badge-cyan">Evidence-based, not magic</div>
            <h2>Evidence-based. Transparent. Conservative.</h2>
            <p>
              We do not pretend to know what the evidence does not prove. Every assessment separates confirmed
              findings, probable risks and missing information.
            </p>
            <div className="demo-does-not-list">
              <span>
                <CheckCircle2 size={15} />
                Missing backup evidence becomes a report finding.
              </span>
              <span>
                <CheckCircle2 size={15} />
                Missing dependency mapping lowers confidence.
              </span>
              <span>
                <CheckCircle2 size={15} />
                Missing Proxmox target data limits sizing certainty.
              </span>
              <span>
                <CheckCircle2 size={15} />
                Missing performance data means sizing is based on allocation, not usage.
              </span>
            </div>
          </article>

          <article className="glass-card sales-copy-card">
            <div className="badge">Evidence sources</div>
            <h2>Start with RVTools. Add more evidence when you need higher confidence.</h2>
            <p>The base assessment can start with RVTools. Additional evidence improves confidence.</p>
            <div className="sales-evidence-grid">
              {evidenceSources.map(([source, note]) => (
                <div key={source}>
                  <strong>{source}</strong>
                  <span>{note}</span>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className="section shiftreadiness-section shiftreadiness-section-alt">
        <div className="container">
          <div className="shiftreadiness-section-heading">
            <div className="badge badge-cyan">Pricing preview</div>
            <h2>Simple packages for companies, consultants and MSPs.</h2>
            <p>
              Choose a package, then use Stripe card checkout when configured or request a reviewed manual invoice.
              {` ${paymentOptionsCopy.notActive}`}
            </p>
          </div>
          <div className="sales-pricing-grid">
            {pricingPackages.map((pkg) => (
              <article key={pkg.name} className="glass-card sales-pricing-card">
                <span>{pkg.name}</span>
                <strong>{pkg.price}</strong>
                <p>{pkg.fit}</p>
                <small>{pkg.payment}</small>
                <small>{pkg.includes}</small>
              </article>
            ))}
          </div>
          <div className="shiftreadiness-actions sales-centered-actions">
            <Link href="/sign-up" className="btn btn-primary btn-glow">
              Start readiness assessment
              <ArrowRight size={18} />
            </Link>
            <Link href="/shiftreadiness#pricing" className="btn btn-secondary">
              Compare Plans & Add-ons
            </Link>
            <Link href="/sample-report" className="btn btn-secondary">
              View Full Sample Report
            </Link>
          </div>
          <p className="sales-pricing-note">
            Submitting access or contact starts a manual review, not an instant purchase.
          </p>
        </div>
      </section>

      <section className="section shiftreadiness-section">
        <div className="container sales-two-up">
          <article className="glass-card demo-does-not-card sales-not-card">
            <div>
              <div className="badge">What this is not</div>
              <h2>Clear boundaries before you move production.</h2>
            </div>
            <div className="demo-does-not-list">
              {notAList.map((item) => (
                <span key={item}>
                  <CheckCircle2 size={15} />
                  {item}
                </span>
              ))}
            </div>
          </article>

          <article className="glass-card sales-copy-card">
            <div className="badge badge-cyan">FAQ</div>
            <h2>Common questions.</h2>
            <div className="sales-faq-list">
              {faqs.map(([question, answer]) => (
                <div key={question}>
                  <h3>{question}</h3>
                  <p>{answer}</p>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className="section shiftreadiness-section demo-final-cta">
        <div className="container">
          <div className="glass-card sr-final-card">
            <div>
              <div className="badge badge-cyan">Ready for your own evidence?</div>
              <h2>Before you move production, know what can break.</h2>
              <p>Start with exported evidence, review confidence gaps and use the output to plan a safer pilot.</p>
            </div>
            <div className="sr-final-actions">
              <Link href="/sign-up" className="btn btn-primary btn-glow">
                Start readiness assessment
                <ArrowRight size={18} />
              </Link>
              <Link href="/demo/workspace" className="btn btn-secondary">
                Explore a Sample Assessment
                <Waves size={17} />
              </Link>
              <Link href="/sample-report" className="btn btn-secondary">
                View full sample report
                <BarChart3 size={17} />
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
