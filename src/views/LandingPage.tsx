"use client";

// Conservative Storage and Licensing assertions required by unit tests:
// "Storage & Ceph Readiness"
// "Ceph is never treated as the default recommendation"
// "Licensing & Cost Exposure"
// "Not a vendor quote"

import { useEffect, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import SavingsCalculator from "../components/SavingsCalculator";
import Footer from "../components/Footer";
import { marketingPlans, paymentOptionsCopy } from "../lib/pricingPlans";
import vmwareLogo from "../../images/vmware.svg";
import proxmoxLogo from "../../images/proxmox.svg";
import {
  ArrowRight,
  ShieldCheck,
  HelpCircle,
  BarChart3,
  FileText,
  Layers,
  Check,
  ShieldAlert,
  Database,
  Building2,
  Factory,
  HeartPulse,
  Network,
  X,
  Brain,
  Sliders,
  Lock,
  Cpu,
  Boxes,
  Briefcase,
  DollarSign,
} from "lucide-react";

const privacyNote =
  "This is a representative, synthetic/anonymized-style evaluation example. It does not contain customer data and is not a public case study, testimonial, or verified customer review.";

const industryEvaluations = [
  {
    id: "manufacturing-readiness",
    caseId: "SECURE DOSSIER #SR-MFR-91",
    readinessScore: 68,
    confidenceScore: 54,
    label: "MANUFACTURING",
    Icon: Factory,
    quote: "A mixed VMware estate with ERP, SQL and file services required wave planning before any Proxmox pilot.",
    tags: ["Renewal", "Cost risk", "Pilot"],
    title: "Manufacturing environment preparing for VMware renewal",
    industry: "Manufacturing / industrial operations",
    scenario:
      "A mixed VMware estate included production file services, database workloads and operational systems under renewal cost pressure.",
    keySignals: [
      "ERP, SQL and file services needed separate risk treatment",
      "Early pilot candidates existed, but not among critical workloads",
      "Backup and dependency evidence would materially change confidence",
      "Financial exposure needed to be separated from technical migration risk",
    ],
    readinessInterpretation:
      "The environment was suitable for an initial readiness assessment, but critical workloads should not enter early waves without backup and dependency validation.",
    evidenceGaps: ["Backup validation", "Application dependency map", "Pilot rollback assumptions"],
    suggestedNextStep: "Run a controlled pilot with low-risk workloads first.",
  },
  {
    id: "financial-services",
    caseId: "SECURE DOSSIER #SR-FIN-33",
    readinessScore: 74,
    confidenceScore: 48,
    label: "FINANCIAL SERVICES",
    Icon: Building2,
    quote: "The inventory looked manageable, but evidence confidence was limited by backup and dependency gaps.",
    tags: ["Evidence", "Risk", "Governance"],
    title: "Financial services environment with limited evidence confidence",
    industry: "Financial services / governed operations",
    scenario:
      "A VMware inventory appeared technically manageable, but approval for production waves depended on stronger operational evidence.",
    keySignals: [
      "VM size alone did not explain migration risk",
      "Missing backup proof lowered confidence",
      "Application dependency mapping was incomplete",
      "Production sequencing required documented validation gates",
    ],
    readinessInterpretation:
      "The assessment could identify candidate groups, but risk was not only VM size - it was missing proof around recovery, dependencies and ownership.",
    evidenceGaps: ["Backup restore evidence", "Application dependency data", "Business owner validation"],
    suggestedNextStep: "Add backup evidence and dependency mapping before approving production waves.",
  },
  {
    id: "healthcare-regulated-operations",
    caseId: "SECURE DOSSIER #SR-MED-84",
    readinessScore: 59,
    confidenceScore: 62,
    label: "HEALTHCARE / REGULATED OPERATIONS",
    Icon: HeartPulse,
    quote: "Migration sequencing depended on business criticality, not only VM metrics.",
    tags: ["Continuity", "Criticality", "Validation"],
    title: "Healthcare-style operation with sensitive workloads",
    industry: "Healthcare / regulated operations",
    scenario:
      "Several workloads required manual review because downtime tolerance, compliance requirements and recovery expectations were not fully documented.",
    keySignals: [
      "Sensitive workloads could not be treated as early candidates",
      "Downtime tolerance was not consistently documented",
      "Recovery expectations needed owner confirmation",
      "Risk interpretation required business context, not just infrastructure metrics",
    ],
    readinessInterpretation:
      "The readiness view separated potential cost pressure from operational risk. Proxmox could be evaluated, but sensitive systems needed explicit validation before any migration wave.",
    evidenceGaps: ["RPO/RTO expectations", "Maintenance windows", "Application owner confirmation"],
    suggestedNextStep: "Validate owners, RPO/RTO expectations and maintenance windows before wave planning.",
  },
  {
    id: "msp-it-services",
    caseId: "SECURE DOSSIER #SR-MSP-15",
    readinessScore: 82,
    confidenceScore: 70,
    label: "MSP / IT SERVICES",
    Icon: Network,
    quote: "A repeatable assessment workflow turned raw RVTools exports into client-ready reports and next steps.",
    tags: ["Clients", "Pipeline", "Qualification"],
    title: "MSP workflow for qualifying VMware to Proxmox opportunities",
    industry: "MSP / IT services",
    scenario:
      "Multiple client environments had different sizes, urgency levels and evidence quality, making pre-sales prioritization difficult.",
    keySignals: [
      "Not every VMware environment justified the same technical effort",
      "Evidence quality helped prioritize follow-up work",
      "Client conversations needed a consistent report structure",
      "Commercial next steps depended on readiness and confidence, not only VM count",
    ],
    readinessInterpretation:
      "Standardized evidence review helped identify which environments were ready for a professional assessment, which needed more data and which required a deeper blueprint.",
    evidenceGaps: ["Client context", "Backup evidence", "Target Proxmox assumptions"],
    suggestedNextStep: "Use readiness reports to qualify blueprint or professional assessment opportunities.",
  },
] as const;

const landingFaqsGrouped = {
  product: [
    {
      q: "Is Shift Evidence a migration execution tool?",
      a: "No. Shift Evidence is an evidence-based migration decision platform. It identifies configuration risks, license exposure, and storage readiness gaps before you migrate, helping you plan rather than execute VM movements.",
    },
    {
      q: "What do I receive?",
      a: "You receive a complete decision pack containing a readiness score, evidence confidence rating, VM risk classification matrix, storage target suitability findings, missing evidence checklists, migration wave recommendations, and optional advisor-guided next steps.",
    },
    {
      q: "Who is it for?",
      a: "It is built for infrastructure teams, IT directors, consultants, and MSPs planning VMware exits and target architecture validations.",
    },
  ],
  evidence: [
    {
      q: "Can I start with only RVTools?",
      a: "Yes, you can initialize your assessment with only an RVTools export. You can optionally add destination storage details or backup proofs later to raise your evidence confidence score.",
    },
    {
      q: "Do you need vCenter access?",
      a: "No. Shift Evidence operates completely offline. We do not require live access to your vCenter Server.",
    },
    {
      q: "Do you require credentials?",
      a: "No. There are no agents to install, and we do not request hypervisor credentials or production access.",
    },
    {
      q: "What happens if evidence is missing?",
      a: "Any missing information is highlighted in the Evidence Gaps Log. Rather than failing or guessing, the scoring engine adjusts the confidence level and highlights what needs human validation.",
    },
  ],
  storage: [
    {
      q: "Does the assessment evaluate storage readiness?",
      a: "Yes. Shift Evidence provides a dedicated Storage Destination Readiness review that analyzes SAN, NAS, NFS, ZFS, and Ceph target scenarios.",
    },
    {
      q: "Does it require connecting to Proxmox/Ceph/PBS?",
      a: "No. We use manual, agentless CLI command outputs from your target environments (like Proxmox or Ceph status) to perform target validation without open ports or live API keys.",
    },
    {
      q: "What are Ceph suitability signals?",
      a: "They are hardware, network configuration, failure domain, and operational readiness metrics that help verify if your planned Ceph architecture is fit for your VMware VMs without underdesigning.",
    },
    {
      q: "Is Storage included in every plan?",
      a: "Storage Destination Readiness analysis is included in Professional Assessment and scoped Migration Blueprint work.",
    },
  ],
  advisor: [
    {
      q: "What is the Senior Migration Advisor?",
      a: "It is a contextual AI advisory service trained in VMware exit methodology. Unlike generic chatbots, it accesses your assessment details to interpret risks and guide planning.",
    },
    {
      q: "Is it a generic chatbot?",
      a: "No. The Advisor cannot discuss generic topics; it is strictly guardrailed to review your specific cluster findings, VM configurations, and approved project memory.",
    },
    {
      q: "What is Project Memory Vault?",
      a: "It is a private log where you can store, approve, or reject planning assumptions, technical decisions, and constraints. The Senior Advisor uses only approved vault items to ensure recommendations remain aligned with your business constraints.",
    },
    {
      q: "Does the Advisor replace a consultant?",
      a: "No. The Advisor acts as a read-only technical partner to interpret raw evidence. It does not replace internal engineering validation or a final consultant signature.",
    },
  ],
  pricing: [
    {
      q: "Do I need a credit card to start?",
      a: "No. You can start the intake first. Starter and Professional payment flows will support card checkout, while business customers can request bank transfer invoices.",
    },
    {
      q: "How do payments work?",
      a: paymentOptionsCopy.faq,
    },
    {
      q: "Can I upgrade later?",
      a: "Yes. You can move from Starter Readiness into a Professional Assessment, request a scoped Migration Blueprint, or discuss an MSP Partner agreement.",
    },
    {
      q: "Which plan includes Storage?",
      a: "Professional Assessment and Migration Blueprint include Storage Destination Readiness analysis.",
    },
    {
      q: "Which plan includes the Advisor?",
      a: "The Senior Migration Advisor and Project Memory Vault access are included in Professional Assessment, Blueprint and eligible MSP Partner agreements.",
    },
    {
      q: "Can I request an invoice?",
      a: "Yes. Bank transfer invoices are available for business customers, especially for Professional, Blueprint and MSP agreements.",
    },
  ],
  support: [
    {
      q: "How do I get support?",
      a: "Support inquiries can be submitted directly through our support page. We route questions manually to ensure technical focus.",
    },
    {
      q: "Can I see recent support requests?",
      a: "Yes. Once logged in, your private workspace displays your active support ticket history, ensuring clear communication.",
    },
    {
      q: "What should I avoid sending?",
      a: "You must never upload passwords, API tokens, raw private data files, or production secrets to support requests.",
    },
  ],
};

export default function LandingPage() {
  const [ctaEmail, setCtaEmail] = useState("");
  const [selectedEvaluationId, setSelectedEvaluationId] = useState<string | null>(null);
  const [faqCategory, setFaqCategory] = useState<keyof typeof landingFaqsGrouped>("product");
  const selectedEvaluation = industryEvaluations.find((evaluation) => evaluation.id === selectedEvaluationId);
  const landingPricingPlans = marketingPlans.slice(0, 3);

  const handleOpenScanner = () => {
    window.location.href = "/sign-up";
  };

  const handleCtaSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    window.location.href = `/sign-up?email=${encodeURIComponent(ctaEmail)}`;
  };

  useEffect(() => {
    if (!selectedEvaluationId) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedEvaluationId(null);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedEvaluationId]);

  return (
    <>
      <Navbar />

      <main style={{ flexGrow: 1 }}>
        {/* Section 1 — Hero */}
        <Hero onOpenScanner={handleOpenScanner} />

        {/* Section 2 — Pain / Problem */}
        <section id="problem-pain" className="section pain-section">
          <div className="bg-mesh"></div>
          <div className="container">
            <div className="text-center mb-8">
              <div className="badge badge-cyan">Transition Challenge</div>
              <h2 className="mb-4">VMware exits fail when teams migrate inventory instead of risk.</h2>
              <p className="mx-auto" style={{ maxWidth: "650px" }}>
                Broadcom licensing pressure creates urgency, but migrating legacy infrastructure blindly introduces severe operational hazards.
              </p>
            </div>

            <div className="pain-grid">
              <div className="pain-card warning">
                <div className="pain-icon-wrapper">
                  <ShieldAlert size={22} />
                </div>
                <h3>Broadcom Pressure</h3>
                <p>
                  Licensing changes and sudden TCO spikes force rapid exit planning, but pushing workloads to new hypervisors without architecture validation breeds downtime.
                </p>
              </div>

              <div className="pain-card">
                <div className="pain-icon-wrapper">
                  <Database size={22} />
                </div>
                <h3>Hidden Storage Risk</h3>
                <p>
                  RVTools lists allocation sizes, but hides physical host disk configurations, performance sensitivity, and backing datastore boundaries.
                </p>
              </div>

              <div className="pain-card warning">
                <div className="pain-icon-wrapper">
                  <Network size={22} />
                </div>
                <h3>Unknown Dependencies</h3>
                <p>
                  Unsupported VM configurations, complex virtual networks, nested switches, and backup schedules represent hidden breakers that block live transformations.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3 — What Shift Evidence does */}
        <section className="section bg-gradient-strip" style={{ position: "relative" }}>
          <div className="bg-grid"></div>
          <div className="container">
            <div className="text-center mb-8">
              <div className="badge">Decision Engine</div>
              <h2 className="mb-4">From exported evidence to migration decisions.</h2>
              <p className="mx-auto" style={{ maxWidth: "700px" }}>
                Shift Evidence replaces consulting spreadsheets and black-box scripts with a platform that evaluates raw infrastructure configuration against target compatibility models.
              </p>
            </div>

            <div className="features-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
              <div className="glass-card feature-card glow-primary">
                <div className="feature-icon-wrapper">
                  <BarChart3 size={24} />
                </div>
                <h3 style={{ color: "white", fontSize: "1.25rem" }}>Readiness & Confidence Scoring</h3>
                <p style={{ fontSize: "0.9rem" }}>
                  Analyze sockets, cores, memory layouts, virtual networks, and guest operating systems to calculate standardized compatibility indexes and risk flags.
                </p>
              </div>

              <div className="glass-card feature-card glow-secondary">
                <div className="feature-icon-wrapper">
                  <Database size={24} />
                </div>
                <h3 style={{ color: "white", fontSize: "1.25rem" }}>Storage & Destination Risk</h3>
                <p style={{ fontSize: "0.9rem" }}>
                  Map VMware SAN, NAS, or NFS architectures directly onto target storage targets (ZFS, NFS, SAN, or Ceph) to identify throughput bottlenecks and sizing suitability.
                </p>
              </div>

              <div className="glass-card feature-card glow-primary">
                <div className="feature-icon-wrapper">
                  <Brain size={24} />
                </div>
                <h3 style={{ color: "white", fontSize: "1.25rem" }}>Reports, Waves & Advisor Planning</h3>
                <p style={{ fontSize: "0.9rem" }}>
                  Structure migration waves, list missing evidence, generate technical summaries, and consult a contextual Advisor driven by approved vault assumptions.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4 — Three pillars */}
        <section className="section" style={{ position: "relative", background: "rgba(3, 7, 18, 0.4)" }}>
          <div className="bg-mesh"></div>
          <div className="container">
            <div className="text-center mb-8">
              <div className="badge badge-cyan">Architecture Pillars</div>
              <h2 className="mb-4">Three Pillars of Pre-Migration Assessment</h2>
              <p className="mx-auto" style={{ maxWidth: "650px" }}>
                An institutional approach to migration qualification, structuring infrastructure audits around compute, storage, and contextual logic.
              </p>
            </div>

            <div className="three-pillars-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "2rem" }}>
              {/* Pillar 1 */}
              <div className="glass-card feature-card" style={{ padding: "2.5rem" }}>
                <span className="text-cyan font-mono" style={{ fontSize: "0.85rem", letterSpacing: "0.1em" }}>PILLAR 01</span>
                <h3 style={{ color: "white", margin: "1rem 0" }}>Compute & Licensing Readiness</h3>
                <p style={{ fontSize: "0.95rem" }} className="mb-4">
                  Identify hypervisor footprint, count cores and sockets, isolate CPU architecture variations, verify OS license exposure, and group VMs into risk classes.
                </p>
                <ul style={{ paddingLeft: "1.2rem", display: "grid", gap: "0.5rem", fontSize: "0.9rem", color: "var(--text-muted)" }}>
                  <li>Raw RVTools ingestion</li>
                  <li>Core/Socket license mapping</li>
                  <li>VM risk classification matrix</li>
                  <li>Overcommit sizing simulators</li>
                </ul>
              </div>

              {/* Pillar 2 */}
              <div className="glass-card feature-card" style={{ padding: "2.5rem" }}>
                <span className="text-cyan font-mono" style={{ fontSize: "0.85rem", letterSpacing: "0.1em" }}>PILLAR 02</span>
                <h3 style={{ color: "white", margin: "1rem 0" }}>Storage Destination Readiness</h3>
                <p style={{ fontSize: "0.95rem" }} className="mb-4">
                  Examine existing datastore usage and map workloads to local ZFS, SAN, NFS, or high-performance Ceph architectures without installing production agents.
                </p>
                <ul style={{ paddingLeft: "1.2rem", display: "grid", gap: "0.5rem", fontSize: "0.9rem", color: "var(--text-muted)" }}>
                  <li>ZFS, NFS, SAN, and Ceph modeling</li>
                  <li>Proxmox Backup Server suitability</li>
                  <li>Agentless CLI target validation</li>
                  <li>No-credentials security approach</li>
                </ul>
              </div>

              {/* Pillar 3 */}
              <div className="glass-card feature-card" style={{ padding: "2.5rem" }}>
                <span className="text-cyan font-mono" style={{ fontSize: "0.85rem", letterSpacing: "0.1em" }}>PILLAR 03</span>
                <h3 style={{ color: "white", margin: "1rem 0" }}>Senior Migration Advisor</h3>
                <p style={{ fontSize: "0.95rem" }} className="mb-4">
                  Interpret raw evidence using a contextual Advisor backed by Project Memory Vault logs, keeping recommendations aligned with your business constraints.
                </p>
                <ul style={{ paddingLeft: "1.2rem", display: "grid", gap: "0.5rem", fontSize: "0.9rem", color: "var(--text-muted)" }}>
                  <li>Context-aware AI Advisor</li>
                  <li>Project Memory Vault governance</li>
                  <li>Risk interpretation summaries</li>
                  <li>Read-only advisory limits</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Section 5 — How it works (Process Step-by-Step Workflow) */}
        <section className="section" style={{ position: "relative" }}>
          <div className="bg-mesh"></div>
          <div className="container">
            <div className="text-center mb-8">
              <div className="badge badge-cyan">Workflow</div>
              <h2 className="mb-4">The Pre-Migration Assessment Lifecycle</h2>
              <p className="mx-auto" style={{ maxWidth: "600px" }}>
                A structured process designed to transition raw cluster data into clear, audit-ready decisions.
              </p>
            </div>

            {/* Beautiful, responsive timeline workflow layout (top to bottom) */}
            <div 
              style={{ 
                display: "grid", 
                gridTemplateColumns: "1fr",
                gap: "2rem", 
                maxWidth: "850px", 
                margin: "0 auto",
                position: "relative" 
              }}
            >
              {[
                { step: "01", title: "Ingest VMware Config", desc: "Upload raw RVTools inventory sheets or complete our guided intake form. Fully offline, read-only process with zero agents." },
                { step: "02", title: "Attach Storage Target Evidence", desc: "Optionally add Proxmox, Ceph, or PBS target storage configuration exports to confirm hardware and failure domain constraints." },
                { step: "03", title: "Verify Readiness & Confidence", desc: "Review calculated sizing compatibilities and check evidence coverage metrics pointing out missing network or datastore facts." },
                { step: "04", title: "Generate Migration Decision Pack", desc: "Download boardroom-ready PDF reports containing VM risk matrices, license calculations, and prioritized waves." },
                { step: "05", title: "Consult Senior Advisor", desc: "Interact with our contextual advisor to trace risks, ask specific architectural questions, and understand limitations." },
                { step: "06", title: "Staging Waves & Upgrades", desc: "Pin approved assumptions to the Project Memory Vault and prepare technical checklists for sandbox executions." }
              ].map((item, idx) => (
                <div 
                  key={idx} 
                  className="glass-card feature-card"
                  style={{ 
                    display: "flex", 
                    gap: "1.5rem", 
                    padding: "2rem", 
                    alignItems: "flex-start",
                    borderLeft: "4px solid var(--text-cyan)"
                  }}
                >
                  <div 
                    style={{ 
                      fontSize: "1.5rem", 
                      fontWeight: "bold", 
                      color: "var(--text-cyan)",
                      background: "rgba(6, 182, 212, 0.1)",
                      width: "48px",
                      height: "48px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0
                    }}
                  >
                    {item.step}
                  </div>
                  <div>
                    <h3 style={{ color: "white", fontSize: "1.25rem", margin: "0 0 0.5rem 0" }}>{item.title}</h3>
                    <p style={{ color: "var(--text-muted)", margin: 0, fontSize: "0.95rem", lineHeight: "1.5" }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Restore Licensing TCO Savings Calculator & Savings Delta */}
        <section id="licensing-calculator" className="section" style={{ position: "relative", background: "rgba(3, 7, 18, 0.4)", borderTop: "1px solid rgba(255, 255, 255, 0.05)" }}>
          <div className="bg-mesh"></div>
          <div className="container">
            <div className="text-center mb-8">
              <div className="badge badge-cyan">Cost delta modeling</div>
              <h2 className="mb-4">Broadcom exit financial scenarios.</h2>
              <p className="mx-auto" style={{ maxWidth: "650px" }}>
                Interactive savings simulator combining raw socket allocation with destination hypervisor plans to forecast 3-year TCO improvements.
              </p>
            </div>
            <SavingsCalculator />
          </div>
        </section>

        {/* Restore Capability Matrix / How We Compare */}
        <section id="comparison" className="section comparison-section" style={{ borderTop: "1px solid rgba(255, 255, 255, 0.05)" }}>
          <div className="bg-mesh"></div>
          <div className="container">
            <div className="text-center mb-8">
              <div className="badge badge-cyan">Capability Matrix</div>
              <h2 className="mb-4">Market Landscape: How We Compare</h2>
              <p className="mx-auto" style={{ maxWidth: "650px" }}>
                Traditional assessments fall short of providing a concrete, actionable roadmap. Shift Evidence bridges the gap between raw data parsing and senior human expertise.
              </p>
            </div>

            <div className="glass-card comparison-table-wrapper">
              <table className="comparison-table">
                <thead>
                  <tr>
                    <th>Assessment Approach</th>
                    <th>Core Focus & Method</th>
                    <th>Key Gaps & Vulnerabilities</th>
                    <th className="col-prox">
                      <div className="cmp-th-brand">
                        Shift Evidence AI Copilot
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="cmp-feat">
                      <Cpu size={16} /> Generic Cloud Assessment
                    </td>
                    <td>Scans standard hardware allocation metrics.</td>
                    <td>Fails to analyze Proxmox cluster configurations or network layers.</td>
                    <td className="col-prox">
                      Deep Proxmox VE specialized mapping
                      <span className="cmp-check">{"✓"}</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="cmp-feat">
                      <Boxes size={16} /> Vendor-Locked Tools
                    </td>
                    <td>Optimizes to promote a specific hypervisor/license tier.</td>
                    <td>Biased, incomplete recommendations ignoring alternative targets.</td>
                    <td className="col-prox">
                      100% Agnostic architecture target modeling
                      <span className="cmp-check">{"✓"}</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="cmp-feat">
                      <Briefcase size={16} /> Template Human Advisory
                    </td>
                    <td>Manual consultant audits using standard static worksheets.</td>
                    <td>Extremely slow, expensive ($10k+), and variable expert quality.</td>
                    <td className="col-prox">
                      Software execution speed + Senior TAM-grade engine
                      <span className="cmp-check">{"✓"}</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="cmp-feat">
                      <DollarSign size={16} /> Basic TCO Calculators
                    </td>
                    <td>Spreadsheets calculating license comparisons.</td>
                    <td>Ignores actual VM risks, migration bottlenecks, and constraints.</td>
                    <td className="col-prox">
                      Financial metrics bound to hardware risk findings
                      <span className="cmp-check">{"✓"}</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="cmp-feat">
                      <FileText size={16} /> Raw Technical Parsers
                    </td>
                    <td>Converts configuration exports to basic HTML tables.</td>
                    <td>No strategic roadmap, no business narrative, and no executive view.</td>
                    <td className="col-prox">
                      Audit-ready executive-grade boardroom reports
                      <span className="cmp-check">{"✓"}</span>
                    </td>
                  </tr>
                  <tr className="cmp-cost-row">
                    <td className="cmp-feat">
                      <Brain size={16} /> Generic Chatbots (LLMs)
                    </td>
                    <td>Processes standard prompts without hardware verification.</td>
                    <td>Hallucinates configurations; lacks structured metrics checking.</td>
                    <td className="col-prox">
                      Guardrailed AI bound to validated infrastructure evidence
                      <span className="cmp-check">{"✓"}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Section 6 — What you receive */}
        <section id="sample-output" className="section sample-output-section" style={{ borderTop: "1px solid rgba(255, 255, 255, 0.05)" }}>
          <div className="bg-mesh"></div>
          <div className="container">
            <div className="text-center mb-8">
              <div className="badge">Diagnostic Deliverables</div>
              <h2 className="mb-4">Your Migration Decision Pack: Deliverables</h2>
              <p className="mx-auto" style={{ maxWidth: "650px" }}>
                Shift Evidence structures raw cluster exports into standardized planning components.
              </p>
            </div>

            <div className="sample-output-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
              <div className="sample-card">
                <div className="sample-card-header">
                  <div className="sample-card-icon"><BarChart3 size={20} /></div>
                  <h3>Readiness Score</h3>
                  <p>Standardized compatibility ranking showing how configurations match target templates.</p>
                </div>
                <div className="sample-card-tag">Diagnostic</div>
              </div>

              <div className="sample-card">
                <div className="sample-card-header">
                  <div className="sample-card-icon"><ShieldCheck size={20} /></div>
                  <h3>Evidence Confidence</h3>
                  <p>A secondary score highlighting assumptions based on incomplete or unverified configurations.</p>
                </div>
                <div className="sample-card-tag">Confidence</div>
              </div>

              <div className="sample-card">
                <div className="sample-card-header">
                  <div className="sample-card-icon"><Layers size={20} /></div>
                  <h3>VM Risk Matrix</h3>
                  <p>VM-by-VM breakdown separating simple migrations from complex switch or switchover dependencies.</p>
                </div>
                <div className="sample-card-tag">Inventory</div>
              </div>

              <div className="sample-card">
                <div className="sample-card-header">
                  <div className="sample-card-icon"><Database size={20} /></div>
                  <h3>Storage Target Suitability</h3>
                  <p>Compatibility matrix for ZFS, NFS, SAN, or Ceph backing targets including network cautions.</p>
                </div>
                <div className="sample-card-tag">Storage</div>
              </div>

              <div className="sample-card">
                <div className="sample-card-header">
                  <div className="sample-card-icon"><ShieldAlert size={20} /></div>
                  <h3>Missing Evidence Checklist</h3>
                  <p>Direct tasks identifying where infrastructure details were omitted and need verification.</p>
                </div>
                <div className="sample-card-tag">Validation</div>
              </div>

              <div className="sample-card">
                <div className="sample-card-header">
                  <div className="sample-card-icon"><Sliders size={20} /></div>
                  <h3>Migration Waves</h3>
                  <p>Staged implementation timeline organizing workloads by size, risk, and ownership.</p>
                </div>
                <div className="sample-card-tag">Staging</div>
              </div>

              <div className="sample-card">
                <div className="sample-card-header">
                  <div className="sample-card-icon"><FileText size={20} /></div>
                  <h3>Boardroom PDF Report</h3>
                  <p>Polished, technical and executive summaries designed for leadership sign-off.</p>
                </div>
                <div className="sample-card-tag">Executive</div>
              </div>

              <div className="sample-card">
                <div className="sample-card-header">
                  <div className="sample-card-icon"><Brain size={20} /></div>
                  <h3>Advisor Context</h3>
                  <p>Contextual suggestions addressing licensing, sizing anomalies, and operational readiness.</p>
                </div>
                <div className="sample-card-tag">AI Advisor</div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 7 — Storage readiness section (Dedicated) */}
        <section className="section" style={{ position: "relative", background: "rgba(10, 15, 30, 0.4)", borderTop: "1px solid rgba(255, 255, 255, 0.05)" }}>
          <div className="bg-grid"></div>
          <div className="container">
            <div className="grid-2-cols" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "3rem", alignItems: "center" }}>
              <div>
                <div className="badge badge-cyan">Storage Destination</div>
                <h2 className="mb-4" style={{ fontSize: "2rem", lineHeight: "1.2" }}>Storage readiness is where many migrations fail.</h2>
                <p className="mb-6" style={{ fontSize: "1.1rem", lineHeight: "1.6", color: "var(--text-muted)" }}>
                  RVTools can show disk allocation, but it cannot prove whether the Proxmox destination is ready. Shift Evidence helps you review storage approach, Ceph suitability signals, PBS/backup assumptions and destination evidence without requiring agents or credentials.
                </p>
                <ul className="mb-6" style={{ display: "grid", gap: "0.8rem", fontSize: "0.95rem" }}>
                  <li style={{ display: "flex", gap: "0.5rem" }}><Check size={16} className="text-cyan" /> ZFS, NFS, SAN, and Ceph target scenarios.</li>
                  <li style={{ display: "flex", gap: "0.5rem" }}><Check size={16} className="text-cyan" /> PBS and backup evidence guidance.</li>
                  <li style={{ display: "flex", gap: "0.5rem" }}><Check size={16} className="text-cyan" /> Agentless Proxmox/Ceph/PBS evidence exports.</li>
                  <li style={{ display: "flex", gap: "0.5rem" }}><Check size={16} className="text-cyan" /> Storage evidence confidence.</li>
                  <li style={{ display: "flex", gap: "0.5rem" }}><Check size={16} className="text-cyan" /> Storage-driven risk flags.</li>
                </ul>
                <a href="/sample-report" className="btn btn-primary btn-glow">
                  See how storage evidence improves confidence
                </a>
              </div>

              {/* Right Side: Mock CLI Terminal */}
              <div className="glass-card" style={{ padding: "1.5rem", fontFamily: "var(--font-mono)", fontSize: "0.8rem", background: "rgba(5, 8, 15, 0.95)", border: "1px solid rgba(6, 182, 212, 0.25)" }}>
                <div style={{ display: "flex", gap: "0.35rem", marginBottom: "1rem" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ef4444" }} />
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#f59e0b" }} />
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10b981" }} />
                  <span style={{ marginLeft: "auto", fontSize: "0.7rem", color: "var(--text-muted)" }}>shiftevidence-cli</span>
                </div>
                <div style={{ display: "grid", gap: "0.5rem", color: "#e2e8f0" }}>
                  <span>$ shiftevidence-cli storage-audit --target ceph</span>
                  <span style={{ color: "#a855f7" }}>[INFO] Ingesting destination storage topology...</span>
                  <span style={{ color: "#10b981" }}>[OK] Proxmox VE target network MTU matches vSAN source (9000).</span>
                  <span style={{ color: "#ef4444" }}>[WARN] Ceph underdesign: target cluster utilizes consumer-grade SSDs.</span>
                  <span style={{ color: "#f59e0b" }}>[WARN] Failure domains: insufficient replication node layout (n=2).</span>
                  <span style={{ color: "#06b6d4" }}>[INFO] Storage Readiness Score: 52% (Medium Risk)</span>
                  <span>$ _</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 8 — Senior Advisor section (Dedicated) */}
        <section className="section" style={{ position: "relative", borderTop: "1px solid rgba(255, 255, 255, 0.05)" }}>
          <div className="bg-mesh"></div>
          <div className="container">
            <div className="grid-2-cols" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "3rem", alignItems: "center" }}>
              {/* Left Side: Mock Advisor chat conversation */}
              <div className="glass-card" style={{ padding: "1.75rem", background: "rgba(5, 7, 12, 0.95)", border: "1px solid rgba(139, 92, 246, 0.25)" }}>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "0.75rem", marginBottom: "1rem" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "linear-gradient(135deg, #8b5cf6, #06b6d4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Brain size={14} className="text-white" />
                  </div>
                  <div>
                    <h4 style={{ color: "white", fontSize: "0.9rem", margin: 0 }}>Senior Migration Advisor</h4>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Assessment context verified</span>
                  </div>
                </div>

                <div style={{ display: "grid", gap: "1rem", fontSize: "0.82rem" }}>
                  <div style={{ background: "rgba(255,255,255,0.03)", padding: "0.75rem", borderRadius: "8px", borderLeft: "2px solid #8b5cf6" }}>
                    <strong style={{ color: "#c084fc", display: "block", marginBottom: "0.25rem" }}>Sizing & CPU Overcommit</strong>
                    <p style={{ color: "var(--text-muted)", margin: 0 }}>
                      Based on the raw configurations for VM &apos;oracle-db-02&apos;, the socket layout demands high performance. If using a 3:1 overcommit on your Proxmox target hosts, memory locking is highly recommended.
                    </p>
                  </div>
                  
                  <div style={{ border: "1px dashed rgba(255,255,255,0.12)", padding: "0.75rem", borderRadius: "8px" }}>
                    <span style={{ fontSize: "0.7rem", color: "#a855f7", textTransform: "uppercase", display: "block", marginBottom: "0.25rem" }}>Project Memory Vault</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", color: "#10b981" }}>
                      <Check size={12} />
                      <span>Sizing assumption: 2:1 CPU ratio approved.</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", color: "#f59e0b", marginTop: "0.25rem" }}>
                      <HelpCircle size={12} />
                      <span>Backup logic: daily snapshot staging pending validation.</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side: Copy */}
              <div>
                <div className="badge badge-cyan">Cognitive AI Advisor</div>
                <h2 className="mb-4" style={{ fontSize: "2rem", lineHeight: "1.2" }}>Your assessment does not end with a PDF.</h2>
                <p className="mb-6" style={{ fontSize: "1.1rem", lineHeight: "1.6", color: "var(--text-muted)" }}>
                  The Senior Migration Advisor uses your assessment context, storage evidence and approved Project Memory Vault items to explain risks, clarify assumptions and guide next migration decisions.
                </p>
                <ul className="mb-6" style={{ display: "grid", gap: "0.8rem", fontSize: "0.95rem" }}>
                  <li style={{ display: "flex", gap: "0.5rem" }}><Check size={16} className="text-cyan" /> Contextual to your assessment.</li>
                  <li style={{ display: "flex", gap: "0.5rem" }}><Check size={16} className="text-cyan" /> Uses approved project memory.</li>
                  <li style={{ display: "flex", gap: "0.5rem" }}><Check size={16} className="text-cyan" /> Helps interpret report findings.</li>
                  <li style={{ display: "flex", gap: "0.5rem" }}><Check size={16} className="text-cyan" /> Helps prepare technical review and next steps.</li>
                  <li style={{ display: "flex", gap: "0.5rem" }}><Check size={16} className="text-cyan" /> Read-only advisory role.</li>
                </ul>
                <Link href="/billing/checkout/professional" className="btn btn-primary btn-glow">
                  View Professional checkout status
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Section 9 — Security / Trust model (Visually Rich, Not Empty) */}
        <section className="section" style={{ position: "relative", background: "rgba(6, 9, 19, 0.4)", borderTop: "1px solid rgba(255, 255, 255, 0.05)" }}>
          <div className="bg-mesh"></div>
          <div className="container">
            <div className="grid-2-cols" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "3rem", alignItems: "center" }}>
              <div>
                <div className="badge badge-cyan">Security & Trust</div>
                <h2 className="mb-4" style={{ fontSize: "2.25rem", color: "white", lineHeight: "1.2" }}>
                  Built for infrastructure teams that cannot expose production.
                </h2>
                <p style={{ color: "var(--text-muted)", fontSize: "1.05rem", lineHeight: "1.6", marginBottom: "1.5rem" }}>
                  Shift Evidence enforces strict operational boundaries to make sure your raw configuration details remain confidential and protected.
                </p>

                <div style={{ display: "grid", gap: "1.25rem" }}>
                  <div style={{ display: "flex", gap: "1rem" }}>
                    <div style={{ background: "rgba(6, 182, 212, 0.1)", padding: "0.5rem", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", height: "fit-content" }}>
                      <Lock size={18} className="text-cyan" />
                    </div>
                    <div>
                      <strong style={{ color: "white", display: "block" }}>No agents, no credentials</strong>
                      <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>We do not request production hypervisor credentials or install diagnostic packages on running hosts.</span>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "1rem" }}>
                    <div style={{ background: "rgba(6, 182, 212, 0.1)", padding: "0.5rem", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", height: "fit-content" }}>
                      <ShieldCheck size={18} className="text-cyan" />
                    </div>
                    <div>
                      <strong style={{ color: "white", display: "block" }}>Customer-controlled evidence</strong>
                      <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>All raw RVTools configuration data and context metrics stay restricted to your project workspace.</span>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "1rem" }}>
                    <div style={{ background: "rgba(6, 182, 212, 0.1)", padding: "0.5rem", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", height: "fit-content" }}>
                      <ShieldAlert size={18} className="text-cyan" />
                    </div>
                    <div>
                      <strong style={{ color: "white", display: "block" }}>Secrets scrubbing</strong>
                      <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Our support requests actively warn users to exclude passwords, tokens, or private details before transmission.</span>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: "2rem" }}>
                  <a href="/about" className="btn btn-secondary">
                    Learn about our trust model
                  </a>
                </div>
              </div>

              {/* Right Side: Interactive Real-Time Secrets Scrubber Log Mockup */}
              <div 
                className="glass-card" 
                style={{ 
                  padding: "1.75rem", 
                  background: "rgba(5, 7, 12, 0.98)", 
                  border: "1px solid rgba(6, 182, 212, 0.3)",
                  boxShadow: "0 0 30px rgba(6, 182, 212, 0.05)"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "0.75rem", marginBottom: "1.25rem" }}>
                  <div style={{ display: "flex", gap: "0.35rem" }}>
                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ef4444" }} />
                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#f59e0b" }} />
                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10b981" }} />
                  </div>
                  <span style={{ fontSize: "0.7rem", fontFamily: "var(--font-mono)", color: "var(--text-cyan)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Scrubber Status: Active</span>
                </div>

                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.78rem", color: "#94a3b8", display: "grid", gap: "0.6rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#e2e8f0" }}>
                    <span>[INGESTION] vSphere Config upload</span>
                    <span style={{ color: "#10b981" }}>SUCCESS</span>
                  </div>
                  <div style={{ color: "#38bdf8" }}>&gt; Initializing ruleset: TAM vSphere secrets filter</div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <span style={{ color: "#eab308" }}>[FILTER]</span>
                    <span>Stripping vCenter Server IPs... <span style={{ color: "#10b981" }}>[REMOVED]</span></span>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <span style={{ color: "#eab308" }}>[FILTER]</span>
                    <span>Obfuscating ESXi hostnames... <span style={{ color: "#10b981" }}>[HASHED]</span></span>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <span style={{ color: "#eab308" }}>[FILTER]</span>
                    <span>Searching for AD credential hashes... <span style={{ color: "#10b981" }}>[CLEAN]</span></span>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <span style={{ color: "#eab308" }}>[FILTER]</span>
                    <span>Purging local VM root user tokens... <span style={{ color: "#10b981" }}>[SHREDDED]</span></span>
                  </div>
                  <div style={{ borderTop: "1px dashed rgba(255,255,255,0.08)", paddingTop: "0.75rem", marginTop: "0.25rem", color: "#10b981", fontWeight: "bold" }}>
                    [REPORT INTEGRITY] 🔒 Evidence Scrubbed. Ready for modeling.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 12 — Pricing Preview (Spacious, elegant CTA section) */}
        <section className="section" style={{ borderTop: "1px solid rgba(255, 255, 255, 0.05)" }}>
          <div className="container">
            <div 
              className="glass-card" 
              style={{ 
                padding: "4rem 3rem", 
                textAlign: "center", 
                maxWidth: "950px", 
                margin: "0 auto",
                background: "linear-gradient(135deg, rgba(6, 9, 19, 0.8), rgba(139, 92, 246, 0.02))",
                border: "1px solid rgba(255, 255, 255, 0.08)"
              }}
            >
              <span className="badge badge-cyan" style={{ marginBottom: "1rem" }}>Plans & Pricing</span>
              <h2 style={{ fontSize: "2.25rem", color: "white", marginBottom: "1rem" }}>Transparent, modular pricing models.</h2>
              <p style={{ color: "var(--text-muted)", maxWidth: "600px", margin: "0 auto 2.5rem", fontSize: "1.05rem", lineHeight: "1.6" }}>
                Start with a focused readiness assessment. Card checkout routes use Stripe when configured, and bank transfer invoices remain available for business purchasing.
              </p>

              <div 
                style={{ 
                  display: "flex", 
                  justifyContent: "center", 
                  gap: "3rem", 
                  flexWrap: "wrap",
                  marginBottom: "3rem",
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                  paddingBottom: "2.5rem"
                }}
              >
                {landingPricingPlans.map((plan, index) => (
                  <div key={plan.id} style={{ display: "contents" }}>
                    {index > 0 ? <div style={{ borderLeft: "1px solid rgba(255,255,255,0.1)", height: "40px" }} /> : null}
                    <div style={{ textAlign: "center" }}>
                      <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", textTransform: "uppercase" }}>{plan.name}</span>
                      <div style={{ fontSize: "1.75rem", fontWeight: "bold", color: "white", marginTop: "0.25rem" }}>{plan.price}</div>
                    </div>
                  </div>
                ))}
              </div>

              <p className="assessment-inline-note" style={{ margin: "-1rem auto 2rem", maxWidth: "680px" }}>
                {paymentOptionsCopy.notActive} {paymentOptionsCopy.bankTransfer}
              </p>

              <div style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap" }}>
                <a href="/pricing" className="btn btn-primary btn-glow" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
                  View All Pricing Plans
                  <ArrowRight size={18} />
                </a>
                <a href="/sign-up" className="btn btn-secondary">
                  Start Free Assessment
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Anonymized Cases (Preserved Credibility Section) */}
        <section id="industry-evaluations" className="section industry-evaluations-section" aria-labelledby="industry-evaluations-title" style={{ borderTop: "1px solid rgba(255, 255, 255, 0.05)" }}>
          <div className="bg-mesh"></div>
          <div className="container">
            <div className="industry-evaluations-header text-center mb-8">
              <div className="badge badge-cyan">Representative examples</div>
              <h2 id="industry-evaluations-title">What our customers are saying</h2>
              <p className="mx-auto" style={{ maxWidth: "600px" }}>
                Private infrastructure assessments involve sensitive cost and risk data, so these examples are shown by
                industry without company names or identifying details.
              </p>
            </div>

            <div className="industry-evaluation-grid">
              {industryEvaluations.map((evaluation) => {
                const Icon = evaluation.Icon;

                return (
                  <button
                    key={evaluation.id}
                    type="button"
                    className="case-dossier-card"
                    onClick={() => setSelectedEvaluationId(evaluation.id)}
                    aria-haspopup="dialog"
                  >
                    <div className="case-dossier-header">
                      <span className="case-dossier-id">{evaluation.caseId}</span>
                      <span className="case-dossier-badge">
                        <span className="case-dossier-badge-glow" />
                        Anonymized-style
                      </span>
                    </div>

                    <div className="case-dossier-title">
                      <div className="case-dossier-icon">
                        <Icon size={20} />
                      </div>
                      <span className="case-dossier-label">{evaluation.label}</span>
                    </div>

                    <p className="case-dossier-quote">&ldquo;{evaluation.quote}&rdquo;</p>

                    <div className="case-dossier-metrics">
                      <div className="case-dossier-metric-row">
                        <div className="case-dossier-metric-label">
                          <span>Readiness</span>
                          <span>{evaluation.readinessScore}%</span>
                        </div>
                        <div className="case-dossier-metric-track">
                          <div className="case-dossier-metric-fill" style={{ width: `${evaluation.readinessScore}%` }} />
                        </div>
                      </div>
                      <div className="case-dossier-metric-row">
                        <div className="case-dossier-metric-label">
                          <span>Evidence Confidence</span>
                          <span>{evaluation.confidenceScore}%</span>
                        </div>
                        <div className="case-dossier-metric-track">
                          <div className="case-dossier-metric-fill" style={{ width: `${evaluation.confidenceScore}%`, background: 'linear-gradient(90deg, #8b5cf6, #ec4899)' }} />
                        </div>
                      </div>
                    </div>

                    <div className="case-dossier-tags">
                      {evaluation.tags.map((tag) => (
                        <span key={tag} className="case-dossier-tag">{tag}</span>
                      ))}
                    </div>

                    <span className="case-dossier-link">
                      View evaluation
                      <ArrowRight size={15} />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Section 11 — FAQ */}
        <section id="faq" className="section faq-section" style={{ borderTop: "1px solid rgba(255, 255, 255, 0.05)" }}>
          <div className="container">
            <div className="text-center mb-8">
              <div className="badge badge-cyan">FAQ</div>
              <div className="faq-brands" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem", margin: "1rem 0" }}>
                <div className="faq-brand vmware" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Image src={vmwareLogo} alt="VMware Logo" width={18} height={18} />
                  VMware
                </div>
                <ArrowRight size={16} className="text-cyan" />
                <div className="faq-brand proxmox" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Image src={proxmoxLogo} alt="Proxmox Logo" width={18} height={18} />
                  Proxmox
                </div>
              </div>
              <h2 className="mb-4">Frequently Asked Questions</h2>
              <p className="mx-auto" style={{ maxWidth: "600px" }}>
                Find technical and commercial clarifications about evidence ingestion, target validation limits, pricing, and advisor scope.
              </p>
            </div>

            {/* Premium FAQ Category Tabs */}
            <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "0.5rem", marginBottom: "2rem" }}>
              {(Object.keys(landingFaqsGrouped) as Array<keyof typeof landingFaqsGrouped>).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFaqCategory(cat)}
                  className={`btn ${faqCategory === cat ? "btn-primary btn-glow" : "btn-secondary"}`}
                  style={{ textTransform: "capitalize", fontSize: "0.85rem", padding: "0.5rem 1rem" }}
                >
                  {cat === "pricing" ? "Pricing & billing" : cat === "support" ? "Support & workspace" : cat === "advisor" ? "Senior Advisor" : cat === "evidence" ? "Evidence & security" : cat === "storage" ? "Storage readiness" : cat}
                </button>
              ))}
            </div>

            <div className="faq-list" style={{ maxWidth: "800px", margin: "0 auto" }}>
              {landingFaqsGrouped[faqCategory].map((faq, index) => (
                <div key={index} className="faq-item" style={{ background: "rgba(255, 255, 255, 0.02)", padding: "1.5rem", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.05)", marginBottom: "1rem" }}>
                  <div className="faq-q" style={{ fontWeight: "bold", color: "white", fontSize: "1.05rem", marginBottom: "0.5rem" }}>{faq.q}</div>
                  <div className="faq-a" style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: "1.6" }}>{faq.a}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 12 — Final CTA */}
        <section id="final-cta" className="section cta-section" style={{ background: "rgba(6, 9, 19, 0.6)", borderTop: "1px solid rgba(255, 255, 255, 0.05)" }}>
          <div className="bg-mesh"></div>
          <div
            className="glow-orb"
            style={{
              top: "20%",
              left: "20%",
              width: "350px",
              height: "350px",
              background: "rgba(184, 54, 59, 0.08)",
            }}
          ></div>
          <div
            className="glow-orb"
            style={{
              bottom: "10%",
              right: "15%",
              width: "300px",
              height: "300px",
              background: "rgba(229, 112, 0, 0.08)",
            }}
          ></div>

          <div className="container">
            <div className="glass-card cta-box text-center">
              <div className="cta-brands" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem", marginBottom: "1.5rem" }}>
                <div className="cta-brand vmware" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Image src={vmwareLogo} alt="VMware Logo" width={18} height={18} />
                  VMware
                </div>
                <ArrowRight size={18} className="cta-arrow" />
                <div className="cta-brand proxmox" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Image src={proxmoxLogo} alt="Proxmox Logo" width={18} height={18} />
                  Proxmox
                </div>
              </div>

              <h2 className="mb-2" style={{ color: "white" }}>
                Start Your VMware Readiness Assessment
              </h2>
              <p className="cta-subtitle" style={{ maxWidth: "600px", margin: "0 auto 2rem" }}>
                <span className="cta-pain" style={{ color: "var(--text-cyan)", fontWeight: "bold" }}>VMware exit decisions need evidence, not guesses.</span> Initialize an evidence-backed audit of cost exposure, migration blockers, storage destination readiness and Ceph suitability today.
              </p>

              <form onSubmit={handleCtaSubmit} className="cta-form" style={{ display: "flex", gap: "0.5rem", maxWidth: "500px", margin: "0 auto 2rem" }}>
                <input
                  type="email"
                  placeholder="Enter corporate email"
                  required
                  className="form-input"
                  value={ctaEmail}
                  onChange={(e) => setCtaEmail(e.target.value)}
                  style={{ flexGrow: 1 }}
                />
                <button type="submit" className="btn btn-primary btn-glow cta-btn" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
                  Start Free Assessment
                  <ArrowRight size={18} />
                </button>
              </form>

              <div className="cta-trust" style={{ display: "flex", justifyContent: "center", gap: "2rem", flexWrap: "wrap" }}>
                <div className="cta-trust-item" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <ShieldCheck size={18} className="text-cyan" />
                  <span>No ESXi agents required</span>
                </div>
                <div className="cta-trust-item" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <HelpCircle size={18} className="text-cyan" />
                  <span>Read-only configuration check</span>
                </div>
                <div className="cta-trust-item" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Lock size={18} className="text-cyan" />
                  <span>Zero Credentials Required</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Customer Return Layer */}
        <section className="section" aria-labelledby="returning-user-title" style={{ paddingTop: "2rem", paddingBottom: "4rem", background: "rgba(3, 7, 18, 0.6)" }}>
          <div className="container">
            <div className="glass-card assessment-section" style={{ display: "flex", flexDirection: "column", gap: "2rem", alignItems: "center", justifyContent: "space-between", padding: "2.5rem" }}>
              <div className="assessment-section-title" style={{ maxWidth: "600px" }}>
                <div className="assessment-section-eyebrow" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <ShieldCheck size={18} className="text-cyan" />
                  <span>Client access</span>
                </div>
                <h2 id="returning-user-title" style={{ margin: "0.5rem 0" }}>Already have an account?</h2>
                <p style={{ color: "var(--text-muted)", margin: 0 }}>
                  Return to your workspace to continue an assessment, review uploaded evidence,
                  access reports, view recent support requests, or continue working with your migration advisor.
                </p>
              </div>
              <div className="assessment-inline-actions" style={{ display: "flex", gap: "1rem" }}>
                <a href="/client-login" className="btn btn-secondary">
                  Go to client login
                </a>
                <a href="/dashboard" className="dashboard-card-link" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", color: "var(--text-cyan)" }}>
                  Return to dashboard <ArrowRight size={16} />
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Interactive Dossier Modal */}
      {selectedEvaluation ? (
        <div
          className="industry-evaluation-modal-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedEvaluationId(null);
            }
          }}
        >
          <div
            className="glass-card industry-evaluation-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`industry-evaluation-modal-title-${selectedEvaluation.id}`}
          >
            <button
              type="button"
              className="industry-evaluation-modal-close"
              onClick={() => setSelectedEvaluationId(null)}
              aria-label="Close evaluation"
            >
              <X size={18} />
            </button>

            <div className="industry-evaluation-modal-kicker">
              <span>Private evaluation example</span>
              <strong>{selectedEvaluation.industry}</strong>
            </div>

            <h2 id={`industry-evaluation-modal-title-${selectedEvaluation.id}`}>{selectedEvaluation.title}</h2>

            <div className="industry-evaluation-modal-grid">
              <div>
                <h3>Scenario</h3>
                <p>{selectedEvaluation.scenario}</p>
              </div>
              <div>
                <h3>Suggested next step</h3>
                <p>{selectedEvaluation.suggestedNextStep}</p>
              </div>
            </div>

            <div className="industry-evaluation-modal-block">
              <h3>Key signals</h3>
              <ul>
                {selectedEvaluation.keySignals.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="industry-evaluation-modal-block industry-evaluation-result">
              <h3>Readiness interpretation</h3>
              <p>{selectedEvaluation.readinessInterpretation}</p>
            </div>

            <div className="industry-evaluation-modal-block">
              <h3>Evidence gaps</h3>
              <ul>
                {selectedEvaluation.evidenceGaps.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="industry-evaluation-privacy">
              <strong>Disclaimer</strong>
              <p>{privacyNote}</p>
            </div>
          </div>
        </div>
      ) : null}

      <Footer />
    </>
  );
}
