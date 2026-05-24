import { useState, useEffect, useRef } from 'react';
import { 
  X, ShieldCheck, Terminal, Server, Network, Layers, 
  AlertTriangle, ArrowRight, Play, Check 
} from 'lucide-react';

interface ReadinessValidatorProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = 'setup' | 'scanning' | 'results';

export default function ReadinessValidator({ isOpen, onClose }: ReadinessValidatorProps) {
  const [currentStep, setCurrentStep] = useState<Step>('setup');
  const [setupSubStep, setSetupSubStep] = useState(1);
  const [logs, setLogs] = useState<string[]>([]);
  const [logType, setLogType] = useState<('info' | 'success' | 'warn')[]>([]);
  
  // User setup selections
  const [storageType, setStorageType] = useState('san');
  const [networkType, setNetworkType] = useState('dvs');
  const [haRequired, setHaRequired] = useState(true);
  const [backupSystem, setBackupSystem] = useState('veeam');

  const consoleEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs terminal
  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  if (!isOpen) return null;

  // Mock console log stream
  const startDiagnosticCheck = () => {
    setCurrentStep('scanning');
    setLogs([]);
    setLogType([]);

    const mockLogs = [
      { text: '[INFO] Initializing Infrashift Audit Engine v2.1.0...', type: 'info' },
      { text: '[INFO] Establishing connection to VMware API endpoints (simulation)...', type: 'info' },
      { text: '[INFO] Fetching cluster topology... 4 Hypervisor nodes found.', type: 'info' },
      { text: `[INFO] Evaluating storage architecture: Target type is [${storageType.toUpperCase()}].`, type: 'info' },
      storageType === 'vsan' 
        ? { text: '[WARN] VMware vSAN detected. Mapping to Proxmox VE Ceph Cluster storage topology...', type: 'warn' }
        : { text: '[INFO] External SAN/NFS target detected. Storage volume mapping verified.', type: 'success' },
      { text: `[INFO] Parsing virtual switch configurations... [${networkType === 'dvs' ? 'Distributed' : 'Standard'}] Switch found.`, type: 'info' },
      networkType === 'dvs'
        ? { text: '[WARN] vSphere Distributed Switch (dVS) requires mapping to Proxmox Open vSwitch (OVS) Bridges. Auto-converter configured.', type: 'warn' }
        : { text: '[INFO] Standard vSwitch maps cleanly to Linux Bridges (vmbr).', type: 'success' },
      { text: '[INFO] Checking VM CPU allocations... Checking EVC (Enhanced vMotion Compatibility) compatibility...', type: 'info' },
      { text: '[INFO] Scanning VM virtual disk layout... VMDK partitions verified.', type: 'info' },
      { text: '[INFO] Analyzing replication pipeline capacity for hot-migration...', type: 'info' },
      haRequired 
        ? { text: '[INFO] High Availability enabled. Checking corosync cluster communication configuration...', type: 'info' }
        : { text: '[INFO] HA disabled. Standalone host orchestration mapping prepared.', type: 'info' },
      { text: `[INFO] Validating backup integration hooks... [${backupSystem.toUpperCase()}] integration analyzed.`, type: 'info' },
      backupSystem === 'veeam' 
        ? { text: '[INFO] Veeam detected: Pre-mapping to Proxmox Backup Server (PBS) change-block tracking equivalents...', type: 'success' }
        : { text: '[INFO] Custom backup script hooks flagged for custom migration staging.', type: 'warn' },
      { text: '[INFO] Running configurations dry-run mapping rules...', type: 'info' },
      { text: '[SUCCESS] VM configuration parser: 0 execution-blocking errors.', type: 'success' },
      { text: '[SUCCESS] Conversion pipeline staging complete. Integrity check verified.', type: 'success' },
      { text: '[SUCCESS] Readiness compatibility score calculated.', type: 'success' },
    ];

    let currentLogIndex = 0;
    const interval = setInterval(() => {
      if (currentLogIndex < mockLogs.length) {
        const nextLog = mockLogs[currentLogIndex];
        setLogs(prev => [...prev, nextLog.text]);
        setLogType(prev => [...prev, nextLog.type as any]);
        currentLogIndex++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setCurrentStep('results');
        }, 800);
      }
    }, 280);
  };

  const getScore = () => {
    let score = 98;
    if (storageType === 'vsan') score -= 5;
    if (networkType === 'dvs') score -= 3;
    if (backupSystem === 'other') score -= 4;
    return score;
  };

  const resetWizard = () => {
    setCurrentStep('setup');
    setSetupSubStep(1);
    setLogs([]);
  };

  return (
    <div className="modal-overlay">
      <div className="glass-card modal-content" style={{ display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div className="wizard-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Terminal className="text-cyan" size={24} />
            <h3 className="wizard-title">Infrashift Migration Validator</h3>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Setup Phase */}
        {currentStep === 'setup' && (
          <>
            <div className="wizard-body">
              {/* Step indicator */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  Section {setupSubStep} of 3: {setupSubStep === 1 ? 'Compute & Storage' : setupSubStep === 2 ? 'Network Topology' : 'High Availability & Tooling'}
                </span>
                <div className="step-indicator">
                  <div className={`step-dot ${setupSubStep >= 1 ? 'active' : ''} ${setupSubStep > 1 ? 'completed' : ''}`} />
                  <div className={`step-dot ${setupSubStep >= 2 ? 'active' : ''} ${setupSubStep > 2 ? 'completed' : ''}`} />
                  <div className={`step-dot ${setupSubStep >= 3 ? 'active' : ''}`} />
                </div>
              </div>

              {/* Substep 1: Storage */}
              {setupSubStep === 1 && (
                <div>
                  <h4 className="mb-2" style={{ color: 'white' }}>Select VMware Storage Architecture</h4>
                  <p className="mb-6" style={{ fontSize: '0.9rem' }}>
                    How are your current virtual machine files and virtual disks hosted in the vSphere cluster?
                  </p>
                  
                  <div className="options-grid">
                    <div 
                      className={`option-card ${storageType === 'san' ? 'selected' : ''}`}
                      onClick={() => setStorageType('san')}
                    >
                      <span className="option-card-title">
                        <Server size={18} className="text-cyan" />
                        External SAN / NAS
                      </span>
                      <span className="option-card-desc">
                        Fibre Channel, iSCSI, or NFS shares connected to ESXi hosts.
                      </span>
                    </div>

                    <div 
                      className={`option-card ${storageType === 'vsan' ? 'selected' : ''}`}
                      onClick={() => setStorageType('vsan')}
                    >
                      <span className="option-card-title">
                        <Layers size={18} className="text-cyan" />
                        vSAN / Distributed Storage
                      </span>
                      <span className="option-card-desc">
                        Local host drives combined by VMware vSAN software layer.
                      </span>
                    </div>

                    <div 
                      className={`option-card ${storageType === 'local' ? 'selected' : ''}`}
                      onClick={() => setStorageType('local')}
                    >
                      <span className="option-card-title">
                        <Server size={18} className="text-cyan" />
                        Local Datastores
                      </span>
                      <span className="option-card-desc">
                        Independent storage pools inside single hypervisors (LVM/ZFS).
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Substep 2: Networking */}
              {setupSubStep === 2 && (
                <div>
                  <h4 className="mb-2" style={{ color: 'white' }}>Select Network Switch configuration</h4>
                  <p className="mb-6" style={{ fontSize: '0.9rem' }}>
                    How are your VM port groups, VLAN taggings, and switch adapters organized?
                  </p>

                  <div className="options-grid">
                    <div 
                      className={`option-card ${networkType === 'standard' ? 'selected' : ''}`}
                      onClick={() => setNetworkType('standard')}
                    >
                      <span className="option-card-title">
                        <Network size={18} className="text-primary" />
                        vSphere Standard Switches
                      </span>
                      <span className="option-card-desc">
                        Traditional static network switches configured individually per hypervisor.
                      </span>
                    </div>

                    <div 
                      className={`option-card ${networkType === 'dvs' ? 'selected' : ''}`}
                      onClick={() => setNetworkType('dvs')}
                    >
                      <span className="option-card-title">
                        <Network size={18} className="text-primary" />
                        Distributed Switch (dVS)
                      </span>
                      <span className="option-card-desc">
                        Centralized virtual switches managing multi-host configurations, VLANs, and policies.
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Substep 3: Advanced Options */}
              {setupSubStep === 3 && (
                <div>
                  <h4 className="mb-2" style={{ color: 'white' }}>Orchestration & Backup Tooling</h4>
                  <p className="mb-6" style={{ fontSize: '0.9rem' }}>
                    Specify backup systems and high availability expectations for your post-migration environment.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                      <div>
                        <div style={{ fontWeight: 600, color: 'white' }}>Automatic Failover (High Availability)</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Proxmox cluster will coordinate automatic VM recovery if a physical host fails.</div>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={haRequired} 
                        onChange={(e) => setHaRequired(e.target.checked)}
                        style={{ width: '20px', height: '20px', accentColor: '#6366f1', cursor: 'pointer' }}
                      />
                    </div>

                    <div className="slider-group">
                      <span className="slider-label">Current Backup Solution</span>
                      <div className="radio-group">
                        <button
                          onClick={() => setBackupSystem('veeam')}
                          className={`radio-btn ${backupSystem === 'veeam' ? 'active' : ''}`}
                        >
                          Veeam Backup & Replication
                        </button>
                        <button
                          onClick={() => setBackupSystem('other')}
                          className={`radio-btn ${backupSystem === 'other' ? 'active' : ''}`}
                        >
                          Other API / Direct agent backups
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer buttons for Setup */}
            <div className="wizard-footer">
              <button 
                className="btn btn-secondary" 
                onClick={setupSubStep === 1 ? onClose : () => setSetupSubStep(p => p - 1)}
              >
                {setupSubStep === 1 ? 'Cancel' : 'Back'}
              </button>
              
              {setupSubStep < 3 ? (
                <button 
                  className="btn btn-primary" 
                  onClick={() => setSetupSubStep(p => p + 1)}
                >
                  Continue
                  <ArrowRight size={16} />
                </button>
              ) : (
                <button 
                  className="btn btn-primary btn-glow" 
                  onClick={startDiagnosticCheck}
                >
                  Run Compatibility Scan
                  <Play size={16} />
                </button>
              )}
            </div>
          </>
        )}

        {/* Scanning Console Logs Phase */}
        {currentStep === 'scanning' && (
          <div className="wizard-body text-center">
            <div className="scanner-container">
              <div className="scanner-loader">
                <div className="scanner-circle"></div>
                <div className="scanner-grid-overlay"></div>
              </div>
              <div>
                <h4 className="mb-2" style={{ color: 'white' }}>Analyzing Cluster Architecture...</h4>
                <p style={{ fontSize: '0.85rem' }}>Evaluating compatibility profiles and configuration alignments.</p>
              </div>
            </div>

            <div className="console-box">
              {logs.map((log, index) => (
                <div 
                  key={index} 
                  className={`console-line ${logType[index] === 'success' ? 'success' : logType[index] === 'warn' ? 'warn' : ''}`}
                >
                  <span style={{ color: '#4b5563' }}>[{new Date().toLocaleTimeString()}]</span>
                  <span>{log}</span>
                </div>
              ))}
              <div ref={consoleEndRef} />
            </div>
          </div>
        )}

        {/* Results Scorecard Phase */}
        {currentStep === 'results' && (
          <>
            <div className="wizard-body">
              <div className="result-panel">
                <div className="score-hero">
                  <div className="score-dial" style={{ '--score': getScore() } as any}>
                    <span className="score-number">{getScore()}%</span>
                  </div>
                  <div className="score-text-content">
                    <div className="badge" style={{ margin: 0, width: 'fit-content' }}>Ready for Shift</div>
                    <h4 style={{ color: 'white', marginTop: '0.25rem' }}>Highly Compatible Setup</h4>
                    <p style={{ fontSize: '0.85rem' }}>
                      Infrashift's automated mapping templates cover {getScore()}% of your active configurations.
                      No blocking hardware issues or compatibility concerns were detected.
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="mb-4" style={{ color: 'white', fontSize: '1.1rem' }}>Pre-Flight Mapping Summary</h4>
                  <div className="recommendations-list">
                    {/* Storage recommendation */}
                    <div className="recommendation-card ready">
                      <Check className="recommendation-icon text-emerald" size={18} />
                      <div>
                        <div className="recommendation-title">Storage Compatibility: Verified</div>
                        <div className="recommendation-desc">
                          {storageType === 'vsan' 
                            ? 'vSAN storage will be auto-migrated using Proxmox Ceph RBD replication templates. Zero data translation loss assured.'
                            : 'FC/iSCSI storage interfaces map natively. Disk block converter (vmdk -> qcow2) will process VM files asynchronously without interrupting live hosts.'
                          }
                        </div>
                      </div>
                    </div>

                    {/* Network recommendation */}
                    <div className={`recommendation-card ${networkType === 'dvs' ? 'warning' : 'ready'}`}>
                      {networkType === 'dvs' ? (
                        <AlertTriangle className="recommendation-icon text-cyan" size={18} fill="none" />
                      ) : (
                        <Check className="recommendation-icon text-emerald" size={18} />
                      )}
                      <div>
                        <div className="recommendation-title">
                          Network Map: {networkType === 'dvs' ? 'Action Required (Automated)' : 'Verified'}
                        </div>
                        <div className="recommendation-desc">
                          {networkType === 'dvs'
                            ? 'vSphere Distributed Port Groups detected. Infrashift scripts will map these configurations to Proxmox Open vSwitch (OVS) bridges automatically during container staging.'
                            : 'Standard vSwitch maps natively to Linux bridge (vmbr0) devices on target Proxmox VE hypervisors.'
                          }
                        </div>
                      </div>
                    </div>

                    {/* Backup recommendation */}
                    <div className="recommendation-card ready">
                      <Check className="recommendation-icon text-emerald" size={18} />
                      <div>
                        <div className="recommendation-title">Backup Strategy: Planned</div>
                        <div className="recommendation-desc">
                          {backupSystem === 'veeam'
                            ? 'Infrashift automates the setup of Proxmox Backup Server (PBS), establishing backup schedules and datastores. Incremental backup structures are mapped cleanly.'
                            : 'Custom scripting hook mapped. Backup schedules will be configured on Proxmox VE API schedule lists.'
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer buttons for Results */}
            <div className="wizard-footer">
              <button className="btn btn-secondary" onClick={resetWizard}>
                Run Different Audit
              </button>
              <button 
                className="btn btn-primary btn-glow" 
                onClick={onClose}
                style={{ background: 'linear-gradient(135deg, #10b981 30%, #059669 100%)', boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)' }}
              >
                <ShieldCheck size={18} />
                Get Full Migration Plan
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
