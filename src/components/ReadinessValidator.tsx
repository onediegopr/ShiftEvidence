import { useState, useEffect, useRef, type CSSProperties } from "react";
import {
  X,
  ShieldCheck,
  Terminal,
  Server,
  Network,
  Layers,
  ArrowRight,
  Play,
  Check,
  FileText,
  UploadCloud,
} from "lucide-react";

interface ReadinessValidatorProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = "setup" | "scanning" | "results";
type LogType = "info" | "success" | "warn";
type EvidenceSource = "none" | "file" | "manual";

export default function ReadinessValidator({
  isOpen,
  onClose,
}: ReadinessValidatorProps) {
  const [currentStep, setCurrentStep] = useState<Step>("setup");
  const [evidenceSource, setEvidenceSource] = useState<EvidenceSource>("none");
  const [fileName, setFileName] = useState<string>("");
  const [setupSubStep, setSetupSubStep] = useState(1);
  const [logs, setLogs] = useState<string[]>([]);
  const [logType, setLogType] = useState<LogType[]>([]);

  // User manual setup selections
  const [storageType, setStorageType] = useState("san");
  const [networkType, setNetworkType] = useState("dvs");
  const [haRequired, setHaRequired] = useState(true);
  const [backupSystem, setBackupSystem] = useState("veeam");

  const consoleEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs terminal
  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Mock console log stream
  const startDiagnosticCheck = (source: EvidenceSource, uploadedName?: string) => {
    setCurrentStep("scanning");
    setLogs([]);
    setLogType([]);

    const activeFileName = uploadedName || fileName || "rvtools_export.xlsx";

    const mockLogs: Array<{ text: string; type: LogType }> = source === "file"
      ? [
          { text: "[INFO] Initializing Shift Evidence Audit Engine v2.1.0...", type: "info" },
          { text: `[INFO] Parsing uploaded RVTools inventory file: [${activeFileName}]...`, type: "info" },
          { text: "[INFO] vSphere Cluster metadata successfully parsed: 12 Hosts, 245 VMs.", type: "success" },
          { text: "[INFO] Scanning hypervisor CPU configurations... Intel Xeon Gold detected.", type: "info" },
          { text: "[INFO] Checking target VM hardware profiles... EVC compatibility verified.", type: "info" },
          { text: "[INFO] Evaluating VM storage allocations (84.2 TB total across 3 volumes)...", type: "info" },
          { text: "[INFO] SAN/NFS fiber channel multipathing configurations verified.", type: "success" },
          { text: "[WARN] VM vSAN datastore detected on cluster-2. Mapping to Ceph Cluster replica targets.", type: "warn" },
          { text: "[INFO] Mapping vSphere Distributed Switch port groups to target Linux OVS Bridges...", type: "info" },
          { text: "[INFO] Scanning active backup software integrations...", type: "info" },
          { text: "[INFO] Veeam Backup & Replication hooks detected. Pre-mapping to Proxmox Backup Server.", type: "success" },
          { text: "[INFO] Checking for High Availability (HA) cluster corosync readiness...", type: "info" },
          { text: "[SUCCESS] Inventory data validation completed. 0 execution-blocking errors.", type: "success" },
          { text: "[SUCCESS] Readiness scorecard and cost delta report compiled.", type: "success" }
        ]
      : [
          {
            text: "[INFO] Initializing Shift Evidence Audit Engine v2.1.0...",
            type: "info",
          },
          {
            text: "[INFO] Parsing manual guided intake configurations...",
            type: "info",
          },
          {
            text: `[INFO] Evaluating storage architecture: Target type is [${storageType.toUpperCase()}].`,
            type: "info",
          },
          storageType === "vsan"
            ? {
                text: "[WARN] VMware vSAN selected. Mapping to Proxmox VE Ceph Cluster storage topology...",
                type: "warn",
              }
            : {
                text: "[INFO] External SAN/NFS target selected. Storage volume mapping verified.",
                type: "success",
              },
          {
            text: `[INFO] Parsing network configuration... [${networkType === "dvs" ? "Distributed" : "Standard"}] Switch setup.`,
            type: "info",
          },
          networkType === "dvs"
            ? {
                text: "[WARN] vSphere Distributed Switch (dVS) requires mapping review for Proxmox Open vSwitch (OVS).",
                type: "warn",
              }
            : {
                text: "[INFO] Standard vSwitch maps cleanly to Linux Bridges (vmbr).",
                type: "success",
              },
          haRequired
            ? {
                text: "[INFO] High Availability enabled. Checking corosync cluster communication configuration...",
                type: "info",
              }
            : {
                text: "[INFO] HA disabled. Standalone host configuration prepared.",
                type: "info",
              },
          {
            text: `[INFO] Validating backup integration hooks... [${backupSystem.toUpperCase()}] integration analyzed.`,
            type: "info",
          },
          backupSystem === "veeam"
            ? {
                text: "[INFO] Veeam detected: Pre-mapping to Proxmox Backup Server (PBS) change-block tracking...",
                type: "success",
              }
            : {
                text: "[INFO] Custom backup script hooks flagged for custom migration staging.",
                type: "warn",
              },
          {
            text: "[SUCCESS] Manual configuration validation complete. 0 execution-blocking errors.",
            type: "success",
          },
          {
            text: "[SUCCESS] Readiness compatibility score calculated.",
            type: "success",
          },
        ];

    let currentLogIndex = 0;
    const interval = setInterval(() => {
      if (currentLogIndex < mockLogs.length) {
        const nextLog = mockLogs[currentLogIndex];
        setLogs((prev) => [...prev, nextLog.text]);
        setLogType((prev) => [...prev, nextLog.type]);
        currentLogIndex++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setCurrentStep("results");
        }, 800);
      }
    }, 250);
  };

  const getScore = () => {
    if (evidenceSource === "file") return 92; // Constant score for file upload mockup
    let score = 98;
    if (storageType === "vsan") score -= 5;
    if (networkType === "dvs") score -= 3;
    if (backupSystem === "other") score -= 4;
    return score;
  };

  const resetWizard = () => {
    setCurrentStep("setup");
    setEvidenceSource("none");
    setFileName("");
    setSetupSubStep(1);
    setLogs([]);
  };

  // Handler for simulated file upload
  const handleFileDropMock = () => {
    const mockFile = "rvtools_production_cluster.xlsx";
    setFileName(mockFile);
    setEvidenceSource("file");
    startDiagnosticCheck("file", mockFile);
  };

  const scoreStyle: CSSProperties = { "--score": getScore() } as CSSProperties;

  return (
    <div
      className="modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="glass-card modal-content"
        role="dialog"
        aria-modal="true"
        aria-labelledby="readiness-validator-title"
        onMouseDown={(event) => event.stopPropagation()}
        style={{ display: "flex", flexDirection: "column" }}
      >
        {/* Header */}
        <div className="wizard-header">
          <div
            style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
          >
            <Terminal className="text-cyan" size={24} />
            <h3 id="readiness-validator-title" className="wizard-title">
              Start Your VMware Readiness Assessment
            </h3>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close readiness assessment">
            <X size={20} />
          </button>
        </div>

        {/* Setup Phase */}
        {currentStep === "setup" && (
          <>
            <div className="wizard-body">
              {/* Option Selection: Step 1 */}
              {evidenceSource === "none" && (
                <div>
                  <p className="mb-6" style={{ fontSize: "0.95rem", lineHeight: "1.6" }}>
                    Upload your RVTools export or complete a guided intake to generate a preliminary evidence-backed view of cost exposure, migration complexity, storage dependencies, backup gaps, and Proxmox readiness.
                  </p>

                  <h4 className="mb-4" style={{ color: "white", fontSize: "1.1rem" }}>
                    Choose Your Evidence Source
                  </h4>

                  {/* Drag and Drop Zone Simulator */}
                  <div className="drag-drop-zone" onClick={handleFileDropMock}>
                    <div className="drag-drop-zone-icon">
                      <UploadCloud size={24} />
                    </div>
                    <div className="drag-drop-zone-text">
                      <h5>Upload RVTools / Inventory File</h5>
                      <p>Recommended for a faster, more accurate assessment.</p>
                      <span className="btn btn-secondary btn-sm" style={{ marginTop: "0.5rem", display: "inline-block" }}>
                        Select .xlsx Export
                      </span>
                    </div>
                  </div>

                  <div className="modal-divider">or</div>

                  {/* Manual Guided Intake Card */}
                  <button
                    className="intake-option-btn"
                    onClick={() => setEvidenceSource("manual")}
                  >
                    <div className="intake-option-btn-content">
                      <div className="intake-option-btn-icon">
                        <FileText size={22} />
                      </div>
                      <div className="intake-option-btn-text">
                        <strong>Manual Guided Intake</strong>
                        <span>Use this if you do not have an export available yet.</span>
                      </div>
                    </div>
                    <ArrowRight size={18} className="text-muted" />
                  </button>
                </div>
              )}

              {/* Manual Guided Intake Substeps */}
              {evidenceSource === "manual" && (
                <div>
                  {/* Step indicator */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "2rem",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        color: "var(--text-muted)",
                      }}
                    >
                      Step 2: Map Current Environment (Section {setupSubStep} of 3:{" "}
                      {setupSubStep === 1
                        ? "Compute & Storage"
                        : setupSubStep === 2
                          ? "Network Topology"
                          : "High Availability & Tooling"}
                      )
                    </span>
                    <div className="step-indicator">
                      <div
                        className={`step-dot ${setupSubStep >= 1 ? "active" : ""} ${setupSubStep > 1 ? "completed" : ""}`}
                      />
                      <div
                        className={`step-dot ${setupSubStep >= 2 ? "active" : ""} ${setupSubStep > 2 ? "completed" : ""}`}
                      />
                      <div
                        className={`step-dot ${setupSubStep >= 3 ? "active" : ""}`}
                      />
                    </div>
                  </div>

                  {/* Substep 1: Storage */}
                  {setupSubStep === 1 && (
                    <div>
                      <h4 className="mb-2" style={{ color: "white" }}>
                        Select VMware Storage Architecture
                      </h4>
                      <p className="mb-6" style={{ fontSize: "0.9rem" }}>
                        How are your current virtual machine files and virtual disks
                        hosted in the vSphere cluster?
                      </p>

                      <div className="options-grid">
                        <div
                          className={`option-card ${storageType === "san" ? "selected" : ""}`}
                          onClick={() => setStorageType("san")}
                        >
                          <span className="option-card-title">
                            <Server size={18} className="text-cyan" />
                            External SAN / NAS
                          </span>
                          <span className="option-card-desc">
                            Fibre Channel, iSCSI, or NFS shares connected to ESXi
                            hosts.
                          </span>
                        </div>

                        <div
                          className={`option-card ${storageType === "vsan" ? "selected" : ""}`}
                          onClick={() => setStorageType("vsan")}
                        >
                          <span className="option-card-title">
                            <Layers size={18} className="text-cyan" />
                            vSAN / Distributed Storage
                          </span>
                          <span className="option-card-desc">
                            Local host drives combined by VMware vSAN software
                            layer.
                          </span>
                        </div>

                        <div
                          className={`option-card ${storageType === "local" ? "selected" : ""}`}
                          onClick={() => setStorageType("local")}
                        >
                          <span className="option-card-title">
                            <Server size={18} className="text-cyan" />
                            Local Datastores
                          </span>
                          <span className="option-card-desc">
                            Independent storage pools inside single hypervisors
                            (LVM/ZFS).
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Substep 2: Networking */}
                  {setupSubStep === 2 && (
                    <div>
                      <h4 className="mb-2" style={{ color: "white" }}>
                        Select Network Switch Configuration
                      </h4>
                      <p className="mb-6" style={{ fontSize: "0.9rem" }}>
                        How are your VM port groups, VLAN taggings, and switch
                        adapters organized?
                      </p>

                      <div className="options-grid">
                        <div
                          className={`option-card ${networkType === "standard" ? "selected" : ""}`}
                          onClick={() => setNetworkType("standard")}
                        >
                          <span className="option-card-title">
                            <Network size={18} className="text-primary" />
                            vSphere Standard Switches
                          </span>
                          <span className="option-card-desc">
                            Traditional static network switches configured
                            individually per hypervisor.
                          </span>
                        </div>

                        <div
                          className={`option-card ${networkType === "dvs" ? "selected" : ""}`}
                          onClick={() => setNetworkType("dvs")}
                        >
                          <span className="option-card-title">
                            <Network size={18} className="text-primary" />
                            Distributed Switch (dVS)
                          </span>
                          <span className="option-card-desc">
                            Centralized virtual switches managing multi-host
                            configurations, VLANs, and policies.
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Substep 3: Advanced Options */}
                  {setupSubStep === 3 && (
                    <div>
                      <h4 className="mb-2" style={{ color: "white" }}>
                        Orchestration & Backup Tooling
                      </h4>
                      <p className="mb-6" style={{ fontSize: "0.9rem" }}>
                        Specify backup systems and high availability expectations
                        for your post-migration environment.
                      </p>

                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "1.5rem",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "1rem",
                            background: "rgba(255,255,255,0.02)",
                            borderRadius: "var(--radius-sm)",
                            border: "1px solid var(--border-color)",
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 600, color: "white" }}>
                              Automatic Failover (High Availability)
                            </div>
                            <div
                              style={{
                                fontSize: "0.8rem",
                                color: "var(--text-muted)",
                              }}
                            >
                              Proxmox cluster will coordinate automatic VM recovery
                              if a physical host fails.
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            checked={haRequired}
                            onChange={(e) => setHaRequired(e.target.checked)}
                            style={{
                              width: "20px",
                              height: "20px",
                              accentColor: "#6366f1",
                              cursor: "pointer",
                            }}
                          />
                        </div>

                        <div className="slider-group">
                          <span className="slider-label">
                            Current Backup Solution
                          </span>
                          <div className="radio-group">
                            <button
                              onClick={() => setBackupSystem("veeam")}
                              className={`radio-btn ${backupSystem === "veeam" ? "active" : ""}`}
                            >
                              Veeam Backup & Replication
                            </button>
                            <button
                              onClick={() => setBackupSystem("other")}
                              className={`radio-btn ${backupSystem === "other" ? "active" : ""}`}
                            >
                              Other API / Direct agent backups
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer buttons for Setup */}
            {evidenceSource === "manual" && (
              <div className="wizard-footer">
                <button
                  className="btn btn-secondary"
                  onClick={
                    setupSubStep === 1
                      ? () => setEvidenceSource("none") // Go back to step 1 evidence source choose
                      : () => setSetupSubStep((p) => p - 1)
                  }
                >
                  Back
                </button>

                {setupSubStep < 3 ? (
                  <button
                    className="btn btn-primary"
                    onClick={() => setSetupSubStep((p) => p + 1)}
                  >
                    Continue
                    <ArrowRight size={16} />
                  </button>
                ) : (
                  <button
                    className="btn btn-primary btn-glow"
                    onClick={() => startDiagnosticCheck("manual")}
                  >
                    Run Compatibility Scan
                    <Play size={16} />
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {/* Scanning Console Logs Phase */}
        {currentStep === "scanning" && (
          <div className="wizard-body text-center">
            <div className="scanner-container">
              <div className="scanner-loader">
                <div className="scanner-circle"></div>
                <div className="scanner-grid-overlay"></div>
              </div>
              <div>
                <h4 className="mb-2" style={{ color: "white" }}>
                  Analyzing Cluster Architecture…
                </h4>
                <p style={{ fontSize: "0.85rem" }}>
                  Evaluating compatibility profiles and configuration alignments.
                </p>
              </div>
            </div>

            <div className="console-box">
              {logs.map((log, index) => (
                <div
                  key={index}
                  className={`console-line ${logType[index] === "success" ? "success" : logType[index] === "warn" ? "warn" : ""}`}
                >
                  <span style={{ color: "#4b5563" }}>
                    [{new Date().toLocaleTimeString()}]
                  </span>
                  <span>{log}</span>
                </div>
              ))}
              <div ref={consoleEndRef} />
            </div>
          </div>
        )}

        {/* Results Scorecard Phase */}
        {currentStep === "results" && (
          <>
            <div className="wizard-body animate-fade-in">
              <div className="result-panel">
                <div className="score-hero">
                  <div
                    className="score-dial"
                    style={scoreStyle}
                  >
                    <span className="score-number">{getScore()}%</span>
                  </div>
                  <div className="score-text-content">
                    <div
                      className="badge"
                      style={{ margin: 0, width: "fit-content" }}
                    >
                      Assessed & Ready
                    </div>
                    <h4 style={{ color: "white", marginTop: "0.25rem" }}>
                      Generate Preliminary Findings
                    </h4>
                    <p style={{ fontSize: "0.85rem", lineHeight: "1.5" }}>
                      Shift Evidence templates mapped {getScore()}% of configuration patterns. Upload complete. No blockers found.
                    </p>
                  </div>
                </div>

                <div>
                  <h4
                    className="mb-4"
                    style={{ color: "white", fontSize: "1.1rem" }}
                  >
                    Readiness Score & Findings Summary
                  </h4>
                  <div className="recommendations-list">
                    {/* Migration blockers */}
                    <div className="recommendation-card ready">
                      <Check
                        className="recommendation-icon text-emerald"
                        size={18}
                      />
                      <div>
                        <div className="recommendation-title">
                          Migration Blockers: None Identified
                        </div>
                        <div className="recommendation-desc">
                          No incompatible virtual CPU flags, nested hypervisors, or unsupported SCSI controllers were detected.
                        </div>
                      </div>
                    </div>

                    {/* Cost exposure */}
                    <div className="recommendation-card ready">
                      <Check
                        className="recommendation-icon text-emerald"
                        size={18}
                      />
                      <div>
                        <div className="recommendation-title">
                          Cost Exposure: Estimated -70% Delta
                        </div>
                        <div className="recommendation-desc">
                          Transitioning to Proxmox VE subscription models will eliminate broadcom-style vCPU licensing surcharges.
                        </div>
                      </div>
                    </div>

                    {/* Storage dependencies */}
                    <div className="recommendation-card ready">
                      <Check
                        className="recommendation-icon text-emerald"
                        size={18}
                      />
                      <div>
                        <div className="recommendation-title">
                          Storage Dependencies: Auto-mapped
                        </div>
                        <div className="recommendation-desc">
                          {evidenceSource === "file" || storageType !== "vsan"
                            ? "External block storage mapping requires staged migration planning and validation."
                            : "VMware vSAN storage flagged for Proxmox Ceph design and replication planning review."}
                        </div>
                      </div>
                    </div>

                    {/* Evidence Gaps */}
                    <div className="recommendation-card ready">
                      <Check
                        className="recommendation-icon text-emerald"
                        size={18}
                      />
                      <div>
                        <div className="recommendation-title">
                          Evidence Gaps: None (Score Verified)
                        </div>
                        <div className="recommendation-desc">
                          {evidenceSource === "file" 
                            ? "RVTools data satisfies TAM methodology assessment parameters." 
                            : "Intake parameters verified. Custom PDF assessment model ready."}
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
                style={{
                  background:
                    "linear-gradient(135deg, #10b981 30%, #059669 100%)",
                  boxShadow: "0 4px 20px rgba(16, 185, 129, 0.3)",
                }}
              >
                <ShieldCheck size={18} />
                Get Full Readiness Report
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
