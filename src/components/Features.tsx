import {
  ShieldCheck,
  ShieldAlert,
  Cpu,
  Database,
  RefreshCw,
  Archive,
  HardDrive,
  Boxes,
  DollarSign,
} from "lucide-react";
import { assetSrc } from "../lib/assetSrc";
import vmwareLogo from "../../images/vmware.svg";
import proxmoxLogo from "../../images/proxmox.svg";

const copy = {
  headline: "Why Enterprises Choose Shift Evidence",
  blurb:
    "Migrating core infrastructure should not feel like a leap of faith. Our specialized pipeline handles the complexity and keeps production data out of the blast radius.",
  f1: [
    "Pre-Flight Audit & Scan",
    "Our automated compatibility engine scans vSphere hosts, storage formats, and distributed networks, flagging migration bottlenecks before they happen.",
  ],
  f2: [
    "Automated VM Translation",
    "Converts VMDK virtual disks into Proxmox-native RAW or QCOW2 files. VirtIO drivers are injected automatically to avoid boot failures.",
  ],
  f3: [
    "Zero-Downtime Replication",
    "Synchronizes virtual machine blocks asynchronously in the background. Production systems keep running on VMware, with only a brief restart at final cutover.",
  ],
  f4: [
    "Instant Rollback Protection",
    "We operate in a strict read-only mode for VMware assets. If a migration anomaly appears, you can bring the source VMware cluster back immediately.",
  ],
  f5: [
    "Storage Architecture Setup",
    "We design and configure highly available target storage layers, aligning compute, network, and distributed storage topology with open standards.",
  ],
  f6: [
    "Backup Infrastructure Shift",
    "Save on Veeam licenses. We build and deploy Proxmox Backup Server (PBS) setups with deduplication, encryption, and incremental backup routines.",
  ],
  compHead: "Comparing architecture and costs",
  compBlurb:
    "Proxmox VE offers enterprise-grade virtualization with a modular, open architecture that reduces vendor lock-in.",
};

export default function Features() {
  const vmwareLogoSrc = assetSrc(vmwareLogo);
  const proxmoxLogoSrc = assetSrc(proxmoxLogo);

  return (
    <>
      <section id="features" className="section" style={{ position: "relative" }}>
        <div className="container">
          <div className="text-center mb-8">
            <div className="badge">Safe Shift System</div>
            <h2 className="mb-4">{copy.headline}</h2>
            <p className="mx-auto" style={{ maxWidth: "650px" }}>
              {copy.blurb}
            </p>
          </div>

          <div className="features-grid">
            <div className="glass-card feature-card glow-primary">
              <div className="feature-icon-wrapper">
                <ShieldCheck size={24} />
              </div>
              <h3 style={{ color: "white", fontSize: "1.25rem" }}>{copy.f1[0]}</h3>
              <p style={{ fontSize: "0.9rem" }}>{copy.f1[1]}</p>
            </div>
            <div className="glass-card feature-card glow-secondary">
              <div className="feature-icon-wrapper">
                <Cpu size={24} />
              </div>
              <h3 style={{ color: "white", fontSize: "1.25rem" }}>{copy.f2[0]}</h3>
              <p style={{ fontSize: "0.9rem" }}>{copy.f2[1]}</p>
            </div>
            <div className="glass-card feature-card glow-primary">
              <div className="feature-icon-wrapper">
                <RefreshCw size={24} />
              </div>
              <h3 style={{ color: "white", fontSize: "1.25rem" }}>{copy.f3[0]}</h3>
              <p style={{ fontSize: "0.9rem" }}>{copy.f3[1]}</p>
            </div>
            <div className="glass-card feature-card glow-secondary">
              <div className="feature-icon-wrapper">
                <ShieldAlert size={24} />
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
                <Archive size={24} />
              </div>
              <h3 style={{ color: "white", fontSize: "1.25rem" }}>{copy.f6[0]}</h3>
              <p style={{ fontSize: "0.9rem" }}>{copy.f6[1]}</p>
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
                  <th>Feature Capability</th>
                  <th className="col-vs">
                    <div className="cmp-th-brand">
                      <img src={vmwareLogoSrc} alt="" className="cmp-table-logo" />
                      VMware vSphere Suite
                    </div>
                  </th>
                  <th className="col-prox">
                    <div className="cmp-th-brand">
                      <img src={proxmoxLogoSrc} alt="" className="cmp-table-logo" />
                      Proxmox VE
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="cmp-feat">
                    <Cpu size={16} /> Hypervisor Foundation
                  </td>
                  <td className="col-vs">Proprietary Type-1 (ESXi)</td>
                  <td className="col-prox">
                    Open-Source Type-1 (KVM)
                    <span className="cmp-check">{"✓"}</span>
                  </td>
                </tr>
                <tr>
                  <td className="cmp-feat">
                    <Boxes size={16} /> Container Support
                  </td>
                  <td className="col-vs">Requires Tanzu (Extra Add-on)</td>
                  <td className="col-prox">
                    Built-in LXC Containers
                    <span className="cmp-check">{"✓"}</span>
                  </td>
                </tr>
                <tr>
                  <td className="cmp-feat">
                    <ShieldCheck size={16} /> High Availability & DRS
                  </td>
                  <td className="col-vs">Paid licensing tier required</td>
                  <td className="col-prox">
                    Included / Free (Corosync)
                    <span className="cmp-check">{"✓"}</span>
                  </td>
                </tr>
                <tr>
                  <td className="cmp-feat">
                    <HardDrive size={16} /> Storage Virtualization
                  </td>
                  <td className="col-vs">vSAN (Separate licensing fee)</td>
                  <td className="col-prox">
                    Ceph RBD / ZFS (Built-in)
                    <span className="cmp-check">{"✓"}</span>
                  </td>
                </tr>
                <tr>
                  <td className="cmp-feat">
                    <Archive size={16} /> Backup Infrastructure
                  </td>
                  <td className="col-vs">Veeam / Cohesity (Paid)</td>
                  <td className="col-prox">
                    Proxmox Backup Server (Free)
                    <span className="cmp-check">{"✓"}</span>
                  </td>
                </tr>
                <tr className="cmp-cost-row">
                  <td className="cmp-feat">
                    <DollarSign size={16} /> 3-Year Subscription Cost
                  </td>
                  <td className="col-vs">
                    <strong>High recurring cost</strong>
                    <span className="cmp-sub">Licensed per physical core</span>
                  </td>
                  <td className="col-prox">
                    <strong>Low per-socket pricing</strong>
                    <span className="cmp-sub">Up to 80% lower annual subscription costs</span>
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
