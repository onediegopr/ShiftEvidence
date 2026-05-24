import { ChevronRight } from "lucide-react";

export default function Process() {
  const steps = [
    {
      num: "01",
      title: "Analyze & Map",
      duration: "Day 1 - 2",
      description:
        "We connect our audit appliance to your vCenter API. We scan CPU profiles, disk formats, and virtual network associations, generating a complete translation blueprint.",
      action: "Generates your custom Migration compatibility Scorecard.",
    },
    {
      num: "02",
      title: "Background Staging",
      duration: "Day 3 - 5",
      description:
        "We set up the Proxmox target host cluster. Our converter replicates VM virtual disks asynchronously in the background. Your VMware workloads remain active and untouched.",
      action:
        "Syncs data blocks progressively with zero impact on network traffic.",
    },
    {
      num: "03",
      title: "Sandboxed Verification",
      duration: "Day 6",
      description:
        "We boot the migrated virtual machines in an isolated, non-routing test network. We verify driver integrity, partition layouts, and database health before cutover.",
      action:
        "Assures a 100% successful boot rate on target Proxmox hypervisors.",
    },
    {
      num: "04",
      title: "Active Cutover",
      duration: "Day 7 (Window)",
      description:
        "We gracefully shutdown the source VMware VM, sync the final delta disk blocks (taking only minutes), and map the network gateway to the new Proxmox cluster.",
      action:
        "Completes VM cutovers with minimal downtime (usually <10 minutes).",
    },
    {
      num: "05",
      title: "PBS & Ceph Fine-Tuning",
      duration: "Day 8+",
      description:
        "We optimize ZFS caching, establish storage performance metrics on Ceph, and verify incremental deduplication schedules on Proxmox Backup Server.",
      action:
        "Switches system management to our client-defined dashboard metrics.",
    },
  ];

  return (
    <section id="process" className="section" style={{ position: "relative" }}>
      <div className="container">
        <div className="text-center mb-8">
          <div className="badge">Execution Pipeline</div>
          <h2 className="mb-4">The Shift Evidence Migration Pipeline</h2>
          <p className="mx-auto" style={{ maxWidth: "650px" }}>
            We guarantee zero data loss and minimal system interruption by
            following a rigorous, step-by-step verification methodology.
          </p>
        </div>

        <div className="steps-container">
          {steps.map((step, idx) => (
            <div key={idx} className="step-row">
              <div className="step-number-bubble">{step.num}</div>
              <div className="glass-card step-card glow-primary">
                <div className="step-meta">
                  <h3 style={{ color: "white", fontSize: "1.25rem" }}>
                    {step.title}
                  </h3>
                  <span className="step-duration">{step.duration}</span>
                </div>
                <p className="mb-4" style={{ fontSize: "0.95rem" }}>
                  {step.description}
                </p>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    fontSize: "0.85rem",
                    color: "hsl(var(--secondary))",
                    fontWeight: 600,
                  }}
                >
                  <ChevronRight size={14} />
                  <span>Key Result: {step.action}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
