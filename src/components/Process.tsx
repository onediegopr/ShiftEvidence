import {
  Search,
  RefreshCw,
  ShieldCheck,
  Rocket,
  BarChart3,
} from "lucide-react";
import { assetSrc } from "../lib/assetSrc";
import vmwareLogo from "../../images/vmware.svg";
import proxmoxLogo from "../../images/proxmox.svg";


export default function Process() {
  const vmwareLogoSrc = assetSrc(vmwareLogo);
  const proxmoxLogoSrc = assetSrc(proxmoxLogo);

  const steps = [
    {
      num: "01",
      icon: Search,
      title: "Analyze and map",
      duration: "Day 1 - 2",
      color: "#06b6d4",
      description:
        "You provide approved inventory and context evidence. ShiftReadiness analyzes CPU profiles, disk formats and virtual network associations to build a readiness map.",
      action: "Generate your migration readiness scorecard.",
      callout:
        "Advisor lens: the former VMware TAM-led methodology helps distinguish what can be automated, what must be validated and what should not move first.",
    },
    {
      num: "02",
      icon: RefreshCw,
      title: "Background preparation",
      duration: "Day 3 - 5",
      color: "#8b5cf6",
      description:
        "The report identifies target Proxmox design assumptions, storage decisions and preparation tasks that should be validated before execution.",
      action:
        "Plan required validations without touching production workloads.",
    },
    {
      num: "03",
      icon: ShieldCheck,
      title: "Sandbox verification",
      duration: "Day 6",
      color: "#f59e0b",
      description:
        "Use the findings to define pilot candidates and sandbox checks for drivers, partition layouts, dependencies and application health.",
      action:
        "Define pilot validation criteria before approving any production move.",
    },
    {
      num: "04",
      icon: Rocket,
      title: "Live cutover",
      duration: "Day 7 (window)",
      color: "#ea580c",
      description:
        "Plan workload-specific cutover windows, rollback conditions and owner approvals based on evidence quality and risk.",
      action:
        "Avoid unsupported downtime promises; use evidence to set realistic migration windows.",
    },
    {
      num: "05",
      icon: BarChart3,
      title: "PBS and Ceph tuning",
      duration: "Day 8+",
      color: "#10b981",
      description:
        "Capture target storage and backup validation tasks for ZFS, Ceph, SAN, NAS or Proxmox Backup Server designs.",
      action:
        "Turn readiness gaps into implementation and validation tasks.",
    },
  ];

  return (
    <section id="process" className="section pipeline-section">
      <div className="bg-mesh"></div>
      <div className="container">
        <div className="text-center mb-8">
          <div className="badge">Execution Pipeline</div>
          <h2 className="mb-4">From Readiness to Controlled Execution</h2>
          <p className="mx-auto" style={{ maxWidth: "750px" }}>
            Once your VMware environment has been assessed, Shift Evidence turns the findings into a staged execution pipeline: validate assumptions, design the Proxmox target, plan the migration waves, verify backups, execute controlled cutovers, and document every decision.
          </p>
        </div>

        {/* ======== PIPELINE ======== */}
        <div className="pipeline">
          {/* Endpoint: VMware */}
          <div className="pipeline-endpoint vmware">
            <img src={vmwareLogoSrc} alt="" className="pipeline-endpoint-logo" />
            VMware
          </div>

          {/* Steps */}
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={idx}
                className="pipeline-step"
                style={{ "--phase-color": step.color } as React.CSSProperties}
              >
                {/* Number node */}
                <div
                  className="pipeline-node"
                  style={{
                    color: step.color,
                    borderColor: step.color,
                  }}
                >
                  {step.num}
                </div>

                {/* Card */}
                <div className="pipeline-card glass-card">
                  {/* Header: icon + title + duration */}
                  <div className="pipeline-card-header">
                    <div
                      className="pipeline-icon"
                      style={{ color: step.color }}
                    >
                      <Icon size={20} />
                    </div>
                    <div className="pipeline-header-text">
                      <h4 className="pipeline-title">{step.title}</h4>
                      <span
                        className="pipeline-duration"
                        style={{
                          color: step.color,
                          background: `${step.color}18`,
                          borderColor: `${step.color}33`,
                        }}
                      >
                        {step.duration}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="pipeline-desc">{step.description}</p>

                  {/* Advisor Lens callout */}
                  {step.callout && (
                    <div className="pipeline-callout">{step.callout}</div>
                  )}

                  {/* Key Result */}
                  <div
                    className="pipeline-result"
                    style={{ borderLeftColor: step.color }}
                  >
                    <span className="pipeline-result-label">Key Result</span>
                    <span className="pipeline-result-text">{step.action}</span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Endpoint: Proxmox */}
          <div className="pipeline-endpoint proxmox">
            <img src={proxmoxLogoSrc} alt="" className="pipeline-endpoint-logo" />
            Proxmox
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "center", marginTop: "3.5rem" }}>
          <button
            onClick={() => {
              const el = document.getElementById("final-cta");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
            className="btn btn-secondary"
          >
            View Execution Methodology
          </button>
        </div>
      </div>
    </section>
  );
}
