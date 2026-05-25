import {
  Search,
  RefreshCw,
  ShieldCheck,
  Rocket,
  BarChart3,
} from "lucide-react";
import vmwareLogo from "../../images/vmware.svg";
import proxmoxLogo from "../../images/proxmox.svg";

export default function Process() {
  const steps = [
    {
      num: "01",
      icon: Search,
      title: "Analyze & Map",
      duration: "Day 1 - 2",
      color: "#06b6d4",
      description:
        "We connect our audit appliance to your vCenter API. We scan CPU profiles, disk formats, and virtual network associations, generating a complete translation blueprint.",
      action: "Generates your custom Migration compatibility Scorecard.",
      callout:
        "Advisor Lens: Former VMware TAM-led methodology helps distinguish what can be automated, what must be validated, and what should not move first.",
    },
    {
      num: "02",
      icon: RefreshCw,
      title: "Background Staging",
      duration: "Day 3 - 5",
      color: "#8b5cf6",
      description:
        "We set up the Proxmox target host cluster. Our converter replicates VM virtual disks asynchronously in the background. Your VMware workloads remain active and untouched.",
      action:
        "Syncs data blocks progressively with zero impact on network traffic.",
    },
    {
      num: "03",
      icon: ShieldCheck,
      title: "Sandboxed Verification",
      duration: "Day 6",
      color: "#f59e0b",
      description:
        "We boot the migrated virtual machines in an isolated, non-routing test network. We verify driver integrity, partition layouts, and database health before cutover.",
      action:
        "Assures a 100% successful boot rate on target Proxmox hypervisors.",
    },
    {
      num: "04",
      icon: Rocket,
      title: "Active Cutover",
      duration: "Day 7 (Window)",
      color: "#ea580c",
      description:
        "We gracefully shutdown the source VMware VM, sync the final delta disk blocks (taking only minutes), and map the network gateway to the new Proxmox cluster.",
      action:
        "Completes VM cutovers with minimal downtime (usually <10 minutes).",
    },
    {
      num: "05",
      icon: BarChart3,
      title: "PBS & Ceph Fine-Tuning",
      duration: "Day 8+",
      color: "#10b981",
      description:
        "We optimize ZFS caching, establish storage performance metrics on Ceph, and verify incremental deduplication schedules on Proxmox Backup Server.",
      action:
        "Switches system management to our client-defined dashboard metrics.",
    },
  ];

  return (
    <section id="process" className="section pipeline-section">
      <div className="bg-mesh"></div>
      <div className="container">
        <div className="text-center mb-8">
          <div className="badge">Execution Pipeline</div>
          <h2 className="mb-4">The Shift Evidence Migration Pipeline</h2>
          <p className="mx-auto" style={{ maxWidth: "650px" }}>
            We guarantee zero data loss and minimal system interruption by
            following a rigorous, step-by-step verification methodology.
          </p>
        </div>

        {/* ======== PIPELINE ======== */}
        <div className="pipeline">
          {/* Endpoint: VMware */}
          <div className="pipeline-endpoint vmware">
            <img src={vmwareLogo} alt="" className="pipeline-endpoint-logo" />
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
            <img src={proxmoxLogo} alt="" className="pipeline-endpoint-logo" />
            Proxmox
          </div>
        </div>
      </div>
    </section>
  );
}
