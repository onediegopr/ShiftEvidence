import {
  ShieldCheck,
  ClipboardList,
  Activity,
  Brain,
  Database,
  Sliders,
  FileSpreadsheet,
  History,
  Briefcase,
  HardDrive,
  Boxes,
  DollarSign,
  Cpu,
} from "lucide-react";
import { assetSrc } from "../lib/assetSrc";
import vmwareLogo from "../../images/vmware.svg";
import proxmoxLogo from "../../images/proxmox.svg";

const copy = {
  headline: "Architected Across 9 Layers of Value",
  blurb:
    "We do not believe in push-button magic. A production VMware exit requires objective technical evidence, contextual risk intake, and editable financial templates.",
  f1: [
    "Objective Evidence Ingestion",
    "Safely import RVTools or CSV configuration exports. No production agents, no credentials, and 100% read-only.",
  ],
  f2: [
    "Contextual Intake Forms",
    "Capture what configuration sheets miss: workload criticality, application owners, maintenance windows, and risk appetite.",
  ],
  f3: [
    "Scoring Engine",
    "Convert scattered cluster statistics into standardized compatibility scores and migration complexity ranks.",
  ],
  f4: [
    "Guided Advisory AI",
    "A cognitive engine trained to spot nested switches, compute bottlenecks, and explain architectural validations.",
  ],
  f5: [
    "Agnostic Storage Modeling",
    "Validate SAN, NAS, or ZFS target capacities, with dedicated configurations highlighting high-performance Ceph cluster standards.",
  ],
  f6: [
    "Editable Assumptions",
    "No black-box calculations. Tweak hardware overcommit ratios, VM licensing costs, and storage profiles to match your context.",
  ],
  f7: [
    "Executive & Technical Reports",
    "Compile data-driven findings into professional, audit-ready PDF reports designed for executive approval.",
  ],
  f8: [
    "Data Lineage & Audit Trail",
    "Give stakeholders confidence. Track every recommendation directly back to its source configuration evidence.",
  ],
  f9: [
    "Partner & MSP Operations",
    "Equip your consulting team. A self-service workspace designed to deliver structured infrastructure audits.",
  ],
  compHead: "Market Landscape: How We Compare",
  compBlurb:
    "Traditional assessments fall short of providing a concrete, actionable roadmap. Shift Evidence bridges the gap between raw data parsing and senior human expertise.",
};

export default function Features() {
  const vmwareLogoSrc = assetSrc(vmwareLogo);
  const proxmoxLogoSrc = assetSrc(proxmoxLogo);

  return (
    <>
      <section id="features" className="section" style={{ position: "relative" }}>
        <div className="container">
          <div className="text-center mb-8">
            <div className="badge">Platform Value Model</div>
            <h2 className="mb-4">{copy.headline}</h2>
            <p className="mx-auto" style={{ maxWidth: "650px" }}>
              {copy.blurb}
            </p>
          </div>

          <div className="features-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
            <div className="glass-card feature-card glow-primary">
              <div className="feature-icon-wrapper">
                <ShieldCheck size={24} />
              </div>
              <h3 style={{ color: "white", fontSize: "1.25rem" }}>{copy.f1[0]}</h3>
              <p style={{ fontSize: "0.9rem" }}>{copy.f1[1]}</p>
            </div>
            <div className="glass-card feature-card glow-secondary">
              <div className="feature-icon-wrapper">
                <ClipboardList size={24} />
              </div>
              <h3 style={{ color: "white", fontSize: "1.25rem" }}>{copy.f2[0]}</h3>
              <p style={{ fontSize: "0.9rem" }}>{copy.f2[1]}</p>
            </div>
            <div className="glass-card feature-card glow-primary">
              <div className="feature-icon-wrapper">
                <Activity size={24} />
              </div>
              <h3 style={{ color: "white", fontSize: "1.25rem" }}>{copy.f3[0]}</h3>
              <p style={{ fontSize: "0.9rem" }}>{copy.f3[1]}</p>
            </div>
            <div className="glass-card feature-card glow-secondary">
              <div className="feature-icon-wrapper">
                <Brain size={24} />
              </div>
              <h3 style={{ color: "white", fontSize: "1.25rem" }}>{copy.f4[0]}</h3>
              <p style={{ fontSize: "0.9rem" }}>{copy.f4[1]}</p>
            </div>
            <div className="glass-card feature-card glow-primary">
              <div className="feature-icon-wrapper">
                <Database size={24} />
              </div>
              <h3 style={{ color: "white", fontSize: "1.25rem" }}>{copy.f5[0]}</h3>
              <p style={{ fontSize: "0.9rem" }}>{copy.f5[1]}</p>
            </div>
            <div className="glass-card feature-card glow-secondary">
              <div className="feature-icon-wrapper">
                <Sliders size={24} />
              </div>
              <h3 style={{ color: "white", fontSize: "1.25rem" }}>{copy.f6[0]}</h3>
              <p style={{ fontSize: "0.9rem" }}>{copy.f6[1]}</p>
            </div>
            <div className="glass-card feature-card glow-primary">
              <div className="feature-icon-wrapper">
                <FileSpreadsheet size={24} />
              </div>
              <h3 style={{ color: "white", fontSize: "1.25rem" }}>{copy.f7[0]}</h3>
              <p style={{ fontSize: "0.9rem" }}>{copy.f7[1]}</p>
            </div>
            <div className="glass-card feature-card glow-secondary">
              <div className="feature-icon-wrapper">
                <History size={24} />
              </div>
              <h3 style={{ color: "white", fontSize: "1.25rem" }}>{copy.f8[0]}</h3>
              <p style={{ fontSize: "0.9rem" }}>{copy.f8[1]}</p>
            </div>
            <div className="glass-card feature-card glow-primary">
              <div className="feature-icon-wrapper">
                <Briefcase size={24} />
              </div>
              <h3 style={{ color: "white", fontSize: "1.25rem" }}>{copy.f9[0]}</h3>
              <p style={{ fontSize: "0.9rem" }}>{copy.f9[1]}</p>
            </div>
          </div>
        </div>
      </section>

      <section id="comparison" className="section comparison-section">
        <div className="bg-mesh"></div>
        <div className="container">
          <div className="text-center mb-8">
            <div className="badge badge-cyan">Capability Matrix</div>
            <h2 className="mb-4">{copy.compHead}</h2>
            <p className="mx-auto" style={{ maxWidth: "650px" }}>
              {copy.compBlurb}
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
                    <FileSpreadsheet size={16} /> Raw Technical Parsers
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
    </>
  );
}
