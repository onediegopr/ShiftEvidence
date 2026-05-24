import {
  ArrowRight,
  Search,
  RefreshCw,
  ShieldCheck,
  Rocket,
  BarChart3,
} from "lucide-react";

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

        {/* ======== PIPELINE TRACK ======== */}
        <div className="pipeline">
          {/* Endpoint: VMware */}
          <div className="pipeline-endpoint vmware">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <rect width="24" height="24" rx="5" fill="#b8363b" />
              <polygon points="12,4 5,19 9,19 12,11 15,19 19,19" fill="white" />
            </svg>
            <span>VMware</span>
          </div>

          {/* Cards */}
          <div className="pipeline-cards">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div key={idx} className="pipeline-step">
                  <div
                    className="pipeline-card glass-card"
                    style={
                      { "--phase-color": step.color } as React.CSSProperties
                    }
                  >
                    {/* Number + Icon header */}
                    <div className="pipeline-card-top">
                      <div
                        className="pipeline-icon"
                        style={{ color: step.color }}
                      >
                        <Icon size={20} />
                      </div>
                      <span
                        className="pipeline-num"
                        style={{ color: step.color }}
                      >
                        {step.num}
                      </span>
                    </div>

                    {/* Title */}
                    <h4 className="pipeline-title">{step.title}</h4>

                    {/* Duration badge */}
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

                    {/* Description */}
                    <p className="pipeline-desc">{step.description}</p>

                    {/* Key Result */}
                    <div
                      className="pipeline-result"
                      style={{ borderLeftColor: step.color }}
                    >
                      <span className="pipeline-result-label">Key Result</span>
                      <span className="pipeline-result-text">
                        {step.action}
                      </span>
                    </div>
                  </div>

                  {/* Arrow between cards (hide after last) */}
                  {idx < steps.length - 1 && (
                    <div className="pipeline-arrow">
                      <ArrowRight size={18} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Endpoint: Proxmox */}
          <div className="pipeline-endpoint proxmox">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <rect width="24" height="24" rx="5" fill="#e57000" />
              <circle
                cx="12"
                cy="12"
                r="6"
                fill="none"
                stroke="white"
                strokeWidth="2"
              />
              <circle cx="12" cy="12" r="2.5" fill="white" />
            </svg>
            <span>Proxmox</span>
          </div>
        </div>
      </div>
    </section>
  );
}
