import { useState } from 'react';
import { Percent, AlertCircle } from 'lucide-react';

type LicenseTier = 'standard' | 'enterprise' | 'vcf';

export default function SavingsCalculator() {
  const [sockets, setSockets] = useState(16);
  const [vms, setVms] = useState(120);
  const [storage, setStorage] = useState(80); // in TB
  const [tier, setTier] = useState<LicenseTier>('enterprise');

  // Licensing Tier Cost mapping (Broadcom VMware estimates per socket / year)
  const vmwareRates: Record<LicenseTier, number> = {
    standard: 1800,
    enterprise: 3900,
    vcf: 8400, // VMware Cloud Foundation
  };

  // Proxmox VE Premium Support rate per socket / year (approx €1020 ~ $1150)
  const proxmoxSupportRate = 1150;

  // Calculation Logic
  const calcVmwareAnnual = () => {
    const baseLicense = sockets * vmwareRates[tier];
    const managementOverhead = vms * 120; // $120/VM/year support/vCenter
    const storageOverhead = storage * 45; // $45/TB/year storage license (vSAN)
    return baseLicense + managementOverhead + storageOverhead;
  };

  const calcProxmoxAnnual = () => {
    const baseSupport = sockets * proxmoxSupportRate;
    const storageSupport = storage * 10; // Ceph storage is free, basic Proxmox support covers it
    const managementOverhead = vms * 20; // Proxmox Backup Server/management support
    return baseSupport + storageSupport + managementOverhead;
  };

  const getMigrationServiceFee = () => {
    // Infrashift one-time fee: $250 per VM, with a minimum of $8,000
    const perVmFee = vms * 250;
    return Math.max(8000, perVmFee);
  };

  const vmwareAnnual = calcVmwareAnnual();
  const proxmoxAnnual = calcProxmoxAnnual();
  const migrationFee = getMigrationServiceFee();

  // 3-Year totals (VMware costs increase by 10% annually under new Broadcom terms)
  const vmware3Year = vmwareAnnual + (vmwareAnnual * 1.1) + (vmwareAnnual * 1.21);
  const proxmox3Year = (proxmoxAnnual * 3) + migrationFee;

  const total3YearSavings = vmware3Year - proxmox3Year;
  const savingsPercent = (total3YearSavings / vmware3Year) * 100;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <section id="savings" className="section" style={{ background: 'rgba(6, 9, 19, 0.2)' }}>
      <div className="container">
        <div className="text-center mb-8">
          <div className="badge badge-cyan">Return on Investment</div>
          <h2 className="mb-4">Calculate Your Cost Shift</h2>
          <p className="mx-auto" style={{ maxWidth: '650px' }}>
            Broadcom license consolidation has forced massive price hikes. Use our live modeler to
            estimate your cost structure difference shifting to Proxmox VE with InfraShift.
          </p>
        </div>

        <div className="glass-card calc-container">
          {/* Sliders Input Panel */}
          <div className="calc-inputs">
            {/* License Tier */}
            <div className="slider-group">
              <span className="slider-label">Current VMware License Tier</span>
              <div className="radio-group">
                <button
                  onClick={() => setTier('standard')}
                  className={`radio-btn ${tier === 'standard' ? 'active' : ''}`}
                >
                  vSphere Standard
                  <span style={{ display: 'block', fontSize: '0.75rem', opacity: 0.8, marginTop: '2px' }}>
                    ~ $1.8k/Socket/Yr
                  </span>
                </button>
                <button
                  onClick={() => setTier('enterprise')}
                  className={`radio-btn ${tier === 'enterprise' ? 'active' : ''}`}
                >
                  vSphere Ent. Plus
                  <span style={{ display: 'block', fontSize: '0.75rem', opacity: 0.8, marginTop: '2px' }}>
                    ~ $3.9k/Socket/Yr
                  </span>
                </button>
                <button
                  onClick={() => setTier('vcf')}
                  className={`radio-btn ${tier === 'vcf' ? 'active' : ''}`}
                >
                  Cloud Foundation (VCF)
                  <span style={{ display: 'block', fontSize: '0.75rem', opacity: 0.8, marginTop: '2px' }}>
                    ~ $8.4k/Socket/Yr
                  </span>
                </button>
              </div>
            </div>

            {/* Sockets Slider */}
            <div className="slider-group">
              <div className="slider-header">
                <span className="slider-label">Physical CPU Sockets</span>
                <span className="slider-value">{sockets} Sockets</span>
              </div>
              <input
                type="range"
                min="2"
                max="128"
                step="2"
                value={sockets}
                onChange={(e) => setSockets(Number(e.target.value))}
                className="custom-range"
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dark)' }}>
                Total active processor sockets across physical cluster hypervisors.
              </span>
            </div>

            {/* VMs Slider */}
            <div className="slider-group">
              <div className="slider-header">
                <span className="slider-label">Total Virtual Machines (VMs)</span>
                <span className="slider-value">{vms} VMs</span>
              </div>
              <input
                type="range"
                min="10"
                max="500"
                step="5"
                value={vms}
                onChange={(e) => setVms(Number(e.target.value))}
                className="custom-range"
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dark)' }}>
                Target workload VMs to be audited, backed up, and migrated.
              </span>
            </div>

            {/* Storage Slider */}
            <div className="slider-group">
              <div className="slider-header">
                <span className="slider-label">Storage Footprint (vSAN/SAN)</span>
                <span className="slider-value">{storage} TB</span>
              </div>
              <input
                type="range"
                min="5"
                max="500"
                step="5"
                value={storage}
                onChange={(e) => setStorage(Number(e.target.value))}
                className="custom-range"
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dark)' }}>
                Usable active raw storage volumes occupied by VM datasets.
              </span>
            </div>
          </div>

          {/* Results Comparison Panel */}
          <div className="calc-results">
            <div className="savings-summary">
              <div className="savings-main">
                <div className="savings-label">Estimated 3-Year Savings</div>
                <div className="savings-amount">{formatCurrency(total3YearSavings)}</div>
                <div className="badge badge-cyan" style={{ marginTop: '0.75rem', textTransform: 'none' }}>
                  <Percent size={12} style={{ marginRight: '4px' }} />
                  Saving {savingsPercent.toFixed(1)}% of your virtualization budget
                </div>
              </div>

              <div className="savings-grid">
                <div className="savings-item">
                  <span className="savings-item-lbl">VMware 3-Yr TCO (Est. Renewal)</span>
                  <span className="savings-item-val" style={{ color: '#f87171' }}>
                    {formatCurrency(vmware3Year)}
                  </span>
                </div>
                <div className="savings-item">
                  <span className="savings-item-lbl">Proxmox + InfraShift 3-Yr TCO</span>
                  <span className="savings-item-val" style={{ color: '#22d3ee' }}>
                    {formatCurrency(proxmox3Year)}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <div className="comparison-box">
                <AlertCircle size={18} className="text-cyan" style={{ flexShrink: 0 }} />
                <span>
                  <strong>Includes:</strong> Proxmox VE Premium Support (24/7 enterprise SLA) and the 
                  one-time InfraShift migration & auditing service fee ({formatCurrency(migrationFee)}). 
                  VMware calculation includes standard 10% annual escalation rates typical of Broadcom renewals.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
