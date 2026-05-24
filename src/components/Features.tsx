import { 
  ShieldCheck, ShieldAlert, Cpu, Database, RefreshCw, Archive 
} from 'lucide-react';

export default function Features() {
  return (
    <>
      {/* Features Grid Section */}
      <section id="features" className="section" style={{ position: 'relative' }}>
        <div className="container">
          <div className="text-center mb-8">
            <div className="badge">Safe Shift System</div>
            <h2 className="mb-4">Why Enterprises Choose Infrashift</h2>
            <p className="mx-auto" style={{ maxWidth: '650px' }}>
              Migrating core infrastructure shouldn't feel like a leap of faith. Our specialized pipeline
              handles the complexity and ensures zero risk to production data.
            </p>
          </div>

          <div className="features-grid">
            {/* Feature 1 */}
            <div className="glass-card feature-card glow-primary">
              <div className="feature-icon-wrapper">
                <ShieldCheck size={24} />
              </div>
              <h3 style={{ color: 'white', fontSize: '1.25rem' }}>Pre-Flight Audit & Scan</h3>
              <p style={{ fontSize: '0.9rem' }}>
                Our automated compatibility engine scans vSphere hosts, storage formats, and distributed
                networks, flagging potential migration bottlenecks before they happen.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="glass-card feature-card glow-secondary">
              <div className="feature-icon-wrapper">
                <Cpu size={24} />
              </div>
              <h3 style={{ color: 'white', fontSize: '1.25rem' }}>Automated VM Translation</h3>
              <p style={{ fontSize: '0.9rem' }}>
                Instantly converts VMDK virtual disks into Proxmox-native RAW or QCOW2 files. Automatically
                injects VirtIO drivers to prevent boot failures.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="glass-card feature-card glow-primary">
              <div className="feature-icon-wrapper">
                <RefreshCw size={24} />
              </div>
              <h3 style={{ color: 'white', fontSize: '1.25rem' }}>Zero-Downtime Replication</h3>
              <p style={{ fontSize: '0.9rem' }}>
                Sync virtual machine blocks asynchronously in the background. Keep your production systems
                running on VMware, only executing a brief restart during final cutover.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="glass-card feature-card glow-secondary">
              <div className="feature-icon-wrapper">
                <ShieldAlert size={24} />
              </div>
              <h3 style={{ color: 'white', fontSize: '1.25rem' }}>Instant Rollback Protection</h3>
              <p style={{ fontSize: '0.9rem' }}>
                We operate on a strict read-only mode for VMware assets. In the highly unlikely event of a
                migration anomaly, you can boot the source VMware cluster immediately.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="glass-card feature-card glow-primary">
              <div className="feature-icon-wrapper">
                <Database size={24} />
              </div>
              <h3 style={{ color: 'white', fontSize: '1.25rem' }}>Ceph Storage Setup</h3>
              <p style={{ fontSize: '0.9rem' }}>
                We design and configure highly available Proxmox storage layers (Ceph RBD) to replace expensive
                vSAN and proprietary storage controllers with open standards.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="glass-card feature-card glow-secondary">
              <div className="feature-icon-wrapper">
                <Archive size={24} />
              </div>
              <h3 style={{ color: 'white', fontSize: '1.25rem' }}>Backup Infrastructure Shift</h3>
              <p style={{ fontSize: '0.9rem' }}>
                Save on Veeam licenses. We build and deploy Proxmox Backup Server (PBS) setups, implementing
                deduplication, encryption, and incremental backup routines.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* VMware vs Proxmox Technical Table */}
      <section id="comparison" className="section comparison-section">
        <div className="bg-mesh"></div>
        <div className="container">
          <div className="text-center mb-8">
            <div className="badge badge-cyan">Feature Blueprint</div>
            <h2 className="mb-4">Comparing Architecture & Costs</h2>
            <p className="mx-auto" style={{ maxWidth: '650px' }}>
              Proxmox VE delivers equivalent enterprise-level virtualization capabilities with a modular,
              open architecture that frees your company from vendor lock-in.
            </p>
          </div>

          <div className="glass-card comparison-table-wrapper">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th>Feature Capability</th>
                  <th className="col-vs">VMware vSphere Suite</th>
                  <th className="col-prox">Proxmox VE + Infrashift</th>
                  <th>Infrashift Assurance</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ fontWeight: 600, color: 'white' }}>Hypervisor Foundation</td>
                  <td className="col-vs">Proprietary Type-1 (ESXi)</td>
                  <td className="col-prox">Open-Source Type-1 (KVM)</td>
                  <td className="col-check">Equivalent performance</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600, color: 'white' }}>Container Support</td>
                  <td className="col-vs">Requires Tanzu (Extra Addon)</td>
                  <td className="col-prox">Built-in LXC Containers</td>
                  <td className="col-check">Native Linux container virtualization</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600, color: 'white' }}>High Availability & DRS</td>
                  <td className="col-vs">Paid licensing tier required</td>
                  <td className="col-prox">Included / Free (Corosync)</td>
                  <td className="col-check">Configured automatically by Infrashift</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600, color: 'white' }}>Storage Virtualization</td>
                  <td className="col-vs">vSAN (Separate licensing fee)</td>
                  <td className="col-prox">Ceph RBD / ZFS (Built-in)</td>
                  <td className="col-check">Mapped to Ceph for high availability</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600, color: 'white' }}>Backup Infrastructure</td>
                  <td className="col-vs">Veeam/Cohesity (Paid licensing)</td>
                  <td className="col-prox">Proxmox Backup Server (Free)</td>
                  <td className="col-check">Includes PBS configuration & setup</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600, color: 'white' }}>3-Year TCO Cost Model</td>
                  <td className="col-vs" style={{ color: '#ef4444' }}>High recurring subscription per core</td>
                  <td className="col-prox" style={{ color: '#22d3ee' }}>One-time shift fee + low CPU support</td>
                  <td className="col-check" style={{ fontWeight: 800 }}>Save up to 80% TCO</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </>
  );
}
