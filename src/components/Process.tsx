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
      title: "Analyze and map",
      duration: "Day 1 - 2",
      color: "#06b6d4",
      description:
        "We connect our audit appliance to your vCenter API. We analyze CPU profiles, disk formats and virtual network associations, generating a complete translation map.",
      action: "Generate your custom migration compatibility scorecard.",
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
        "We configure the target Proxmox cluster. Our converter replicates VM virtual disks asynchronously in the background. Your VMware workloads remain active and unchanged.",
      action:
        "Synchronize data blocks progressively without impacting network traffic.",
    },
    {
      num: "03",
      icon: ShieldCheck,
      title: "Sandbox verification",
      duration: "Day 6",
      color: "#f59e0b",
      description:
        "We boot the migrated virtual machines in an isolated, unrouted test network. We verify driver integrity, partition layouts and database health before cutover.",
      action:
        "Ensure a 100% successful boot rate on the target Proxmox hypervisors.",
    },
    {
      num: "04",
      icon: Rocket,
      title: "Live cutover",
      duration: "Day 7 (window)",
      color: "#ea580c",
      description:
        "We gracefully shut down the source VMware VM, synchronize the final delta blocks (only minutes) and remap the network gateway to the new Proxmox cluster.",
      action:
        "Complete VM cutovers with minimal downtime (typically <10 minutes).",
    },
    {
      num: "05",
      icon: BarChart3,
      title: "PBS and Ceph tuning",
      duration: "Day 8+",
      color: "#10b981",
      description:
        "We optimize ZFS caching, define storage performance metrics in Ceph and verify incremental deduplication schedules in Proxmox Backup Server.",
      action:
        "Move system management to the customer-defined dashboard metrics.",
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
