"use client";

import { useState, useEffect, useRef, type CSSProperties, type FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { authClient } from "../../lib/auth-client";
import { trackStartAssessmentConversion } from "../../lib/analytics";
import { createOnboardingAssessmentAction } from "./actions";
import vmwareLogo from "../../../images/vmware.svg";
import proxmoxLogo from "../../../images/proxmox.svg";
import {
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
  Mail,
  Building,
  User,
  Lock,
  Download
} from "lucide-react";

type Step = "setup" | "scanning" | "results" | "download";
type LogType = "info" | "success" | "warn";
type EvidenceSource = "none" | "file" | "manual";

const readEmailParam = () => {
  if (typeof window === "undefined") {
    return "";
  }

  return new URLSearchParams(window.location.search).get("email") ?? "";
};

const signupJourneySteps = [
  "Create workspace",
  "Add evidence",
  "Review readiness",
];

const signupTrustSignals = [
  "No agents required",
  "No production access",
  "Evidence-based readiness",
];

const signupPreviewMetrics = [
  { label: "Readiness score", value: "92%", detail: "Synthetic preview benchmark", accent: "cyan" },
  { label: "Evidence confidence", value: "High", detail: "Missing signals surfaced early", accent: "indigo" },
  { label: "Wave blockers", value: "3", detail: "Storage, dVS and backup review", accent: "amber" },
];

const signupValueCards = [
  {
    title: "Cluster sizing and capacity map",
    copy: "Analyze workload counts, CPU, memory and storage distribution before building migration waves.",
    accent: "cyan",
    Icon: Layers,
  },
  {
    title: "Storage and network compatibility",
    copy: "Surface vSAN to Ceph complexity, dVS mapping rules and destination readiness assumptions.",
    accent: "indigo",
    Icon: Network,
  },
  {
    title: "Broadcom cost delta modeling",
    copy: "Estimate licensing pressure and compare the VMware exit path against Proxmox scenarios.",
    accent: "emerald",
    Icon: ShieldCheck,
  },
];

export default function SignUpPage() {
  // Signup states
  const [isRegistered, setIsRegistered] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const emailParam = readEmailParam();
    if (!emailParam) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      setEmail(emailParam);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  const [company, setCompany] = useState("");
  const [clusterSize, setClusterSize] = useState("< 50 VMs");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [reportInfoMessage, setReportInfoMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Controlled preview states
  const [currentStep, setCurrentStep] = useState<Step>("setup");
  const [evidenceSource, setEvidenceSource] = useState<EvidenceSource>("none");
  const [fileName, setFileName] = useState<string>("");
  const [setupSubStep, setSetupSubStep] = useState(1);
  const [logs, setLogs] = useState<{ message: string; type: LogType }[]>([]);

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

  const handleSignUpSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Call real Better Auth signup
    const { error: authError } = await authClient.signUp.email({
      name: fullName,
      email: email,
      password: password,
      callbackURL: "/dashboard",
    });

    if (authError) {
      setError(authError.message ?? "Unable to create account. Check your details and try again.");
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
    trackStartAssessmentConversion({
      source: "sign_up",
    });
    setIsRegistered(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const [isCreatingAssessment, setIsCreatingAssessment] = useState(false);

  const handleEnterWorkspace = async () => {
    setIsCreatingAssessment(true);
    setError(null);

    try {
      const result = await createOnboardingAssessmentAction({
        company,
        storageType: evidenceSource === "manual" ? storageType : undefined,
        networkType: evidenceSource === "manual" ? networkType : undefined,
        haRequired: evidenceSource === "manual" ? haRequired : undefined,
        backupSystem: evidenceSource === "manual" ? backupSystem : undefined,
      });

      window.location.href = `/dashboard/assessments/${result.assessmentId}`;
    } catch {
      setError("Unable to initialize workspace. Please try again.");
      setIsCreatingAssessment(false);
    }
  };

  // Synthetic preview log stream for onboarding orientation only.
  const startDiagnosticCheck = (source: EvidenceSource, uploadedName?: string) => {
    setCurrentStep("scanning");
    setLogs([]);

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
          { text: "[INFO] Inventory data validation completed for this synthetic preview.", type: "success" },
          { text: "[SUCCESS] Readiness preview and evidence gap checklist compiled.", type: "success" }
        ]
      : [
          { text: "[INFO] Initializing Shift Evidence Audit Engine v2.1.0...", type: "info" },
          { text: "[INFO] Parsing manual guided intake configurations...", type: "info" },
          { text: `[INFO] Evaluating storage architecture: Target type is [${storageType.toUpperCase()}].`, type: "info" },
          storageType === "vsan"
            ? { text: "[WARN] VMware vSAN selected. Mapping to Proxmox VE Ceph Cluster storage topology...", type: "warn" }
            : { text: "[INFO] External SAN/NFS target selected. Storage volume mapping verified.", type: "success" },
          { text: `[INFO] Parsing network configuration... [${networkType === "dvs" ? "Distributed" : "Standard"}] Switch setup.`, type: "info" },
          networkType === "dvs"
            ? { text: "[WARN] vSphere Distributed Switch (dVS) requires mapping review for Proxmox Open vSwitch (OVS).", type: "warn" }
            : { text: "[INFO] Standard vSwitch maps cleanly to Linux Bridges (vmbr).", type: "success" },
          haRequired
            ? { text: "[INFO] High Availability enabled. Checking corosync cluster communication configuration...", type: "info" }
            : { text: "[INFO] HA disabled. Standalone host configuration prepared.", type: "info" },
          { text: `[INFO] Validating backup integration hooks... [${backupSystem.toUpperCase()}] integration analyzed.`, type: "info" },
          backupSystem === "veeam"
            ? { text: "[INFO] Veeam detected: Pre-mapping to Proxmox Backup Server (PBS) change-block tracking...", type: "success" }
            : { text: "[INFO] Custom backup script hooks flagged for custom migration staging.", type: "warn" },
          { text: "[INFO] Manual configuration preview complete for this controlled example.", type: "success" },
          { text: "[SUCCESS] Readiness preview calculated with assumptions clearly separated.", type: "success" }
        ];

    let currentLogIndex = 0;
    const interval = setInterval(() => {
      if (currentLogIndex < mockLogs.length) {
        const nextLog = mockLogs[currentLogIndex];
        setLogs((prev) => [...prev, { message: nextLog.text, type: nextLog.type }]);
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
    if (evidenceSource === "file") return 92;
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

  const handleFileDropMock = () => {
    const mockFile = "synthetic-readiness-inventory.xlsx";
    setFileName(mockFile);
    setEvidenceSource("file");
    startDiagnosticCheck("file", mockFile);
  };

  const scoreStyle: CSSProperties = { "--score": getScore() } as CSSProperties;
  const useModernSignupExperience = signupPreviewMetrics.length > 0;

  return (
    <main className="shiftreadiness-page" style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Navbar />

      <div
        className="container signup-stage"
        style={{
          flexGrow: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "6rem 0.5rem 4rem 0.5rem",
        }}
      >
        {!isRegistered ? (
          /* SPLIT SIGNUP PAGE */
          <div
            className="signup-split-layout"
            style={{
              display: "grid",
              gridTemplateColumns: "1.02fr 0.98fr",
              gap: "3.2rem",
              width: "100%",
              maxWidth: "1320px",
              margin: "0 auto",
            }}
          >
            {useModernSignupExperience ? (
              <>
                <div className="glass-card signup-form-panel" style={{ padding: "3rem 2.5rem" }}>
                  <div className="signup-route-line" aria-hidden="true">
                    <span className="signup-route-pill signup-route-pill-vmware">
                      <Image src={vmwareLogo} alt="" width={16} height={16} />
                      VMware
                    </span>
                    <span className="signup-route-arrow">
                      <ArrowRight size={14} />
                    </span>
                    <span className="signup-route-pill signup-route-pill-proxmox">
                      <Image src={proxmoxLogo} alt="" width={16} height={16} />
                      Proxmox
                    </span>
                  </div>

                  <div className="badge badge-cyan" style={{ marginBottom: "1rem" }}>
                    Step 1: Create workspace
                  </div>
                  <h1 className="mb-2 signup-form-title" style={{ color: "white", fontSize: "clamp(2rem, 4vw, 3.4rem)", lineHeight: 1.05 }}>
                    Create your Shift Evidence workspace
                  </h1>
                  <p className="text-muted mb-6 signup-form-copy" style={{ fontSize: "0.95rem" }}>
                    Start a controlled VMware-to-Proxmox readiness assessment. Upload evidence only after scope, consent and data handling expectations are clear.
                  </p>

                  <div className="signup-journey-strip" aria-hidden="true">
                    {signupJourneySteps.map((step, index) => (
                      <span key={step}>
                        <strong>{index + 1}</strong>
                        {step}
                      </span>
                    ))}
                  </div>

                  <form onSubmit={handleSignUpSubmit} className="signup-form-stack" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                    <div className="signup-form-section">
                      <div className="signup-section-head">
                        <span>Workspace details</span>
                        <p>Set the account owner and the first assessment scope before evidence upload begins.</p>
                      </div>

                      <div className="form-group-custom" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        <label htmlFor="fullname" style={{ fontSize: "0.85rem", fontWeight: 600, color: "white" }}>
                          Full Name
                        </label>
                        <div className="signup-input-shell" style={{ position: "relative" }}>
                          <User
                            size={18}
                            className="signup-input-icon"
                            style={{
                              position: "absolute",
                              left: "1rem",
                              top: "50%",
                              transform: "translateY(-50%)",
                              color: "var(--text-muted)",
                            }}
                          />
                          <input
                            id="fullname"
                            type="text"
                            placeholder="e.g. Jane Doe"
                            required
                            maxLength={288}
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="form-input"
                            style={{ paddingLeft: "2.75rem", width: "100%" }}
                          />
                        </div>
                      </div>

                      <div className="form-group-custom" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        <label htmlFor="email" style={{ fontSize: "0.85rem", fontWeight: 600, color: "white" }}>
                          Work Email
                        </label>
                        <div className="signup-input-shell" style={{ position: "relative" }}>
                          <Mail
                            size={18}
                            className="signup-input-icon"
                            style={{
                              position: "absolute",
                              left: "1rem",
                              top: "50%",
                              transform: "translateY(-50%)",
                              color: "var(--text-muted)",
                            }}
                          />
                          <input
                            id="email"
                            type="email"
                            placeholder="name@company.com"
                            required
                            maxLength={320}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="form-input"
                            style={{ paddingLeft: "2.75rem", width: "100%" }}
                          />
                        </div>
                      </div>

                      <div
                        className="signup-form-grid"
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "1rem",
                        }}
                      >
                        <div className="form-group-custom" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                          <label htmlFor="company" style={{ fontSize: "0.85rem", fontWeight: 600, color: "white" }}>
                            Company Name
                          </label>
                          <div className="signup-input-shell" style={{ position: "relative" }}>
                            <Building
                              size={18}
                              className="signup-input-icon"
                              style={{
                                position: "absolute",
                                left: "1rem",
                                top: "50%",
                                transform: "translateY(-50%)",
                                color: "var(--text-muted)",
                              }}
                            />
                            <input
                              id="company"
                              type="text"
                              placeholder="Enterprise Inc."
                              required
                              maxLength={216}
                              value={company}
                              onChange={(e) => setCompany(e.target.value)}
                              className="form-input"
                              style={{ paddingLeft: "2.75rem", width: "100%" }}
                            />
                          </div>
                        </div>

                        <div className="form-group-custom" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                          <label htmlFor="cluster-size" style={{ fontSize: "0.85rem", fontWeight: 600, color: "white" }}>
                            Cluster Size
                          </label>
                          <select
                            id="cluster-size"
                            value={clusterSize}
                            onChange={(e) => setClusterSize(e.target.value)}
                            className="form-input signup-select-input"
                            style={{ width: "100%", height: "45px", background: "rgba(10, 15, 30, 0.8)", border: "1px solid var(--border-color)", color: "white" }}
                          >
                            <option value="< 50 VMs">Under 50 VMs</option>
                            <option value="50-200 VMs">50 - 200 VMs</option>
                            <option value="200-1000 VMs">200 - 1,000 VMs</option>
                            <option value="1000+ VMs">1,000+ VMs</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="signup-form-section">
                      <div className="signup-section-head">
                        <span>Secure access</span>
                        <p>Create the first login for your private assessment workspace.</p>
                      </div>

                      <div className="form-group-custom" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        <label htmlFor="password" style={{ fontSize: "0.85rem", fontWeight: 600, color: "white" }}>
                          Password
                        </label>
                        <div className="signup-input-shell" style={{ position: "relative" }}>
                          <Lock
                            size={18}
                            className="signup-input-icon"
                            style={{
                              position: "absolute",
                              left: "1rem",
                              top: "50%",
                              transform: "translateY(-50%)",
                              color: "var(--text-muted)",
                            }}
                          />
                          <input
                            id="password"
                            type="password"
                            placeholder="Create a secure password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="form-input"
                            style={{ paddingLeft: "2.75rem", width: "100%" }}
                          />
                        </div>
                      </div>
                    </div>

                    {error ? (
                      <p className="auth-error" role="alert" style={{ color: "var(--accent-red)", fontSize: "0.85rem", margin: 0 }}>
                        {error}
                      </p>
                    ) : null}

                    <button
                      type="submit"
                      className="btn btn-primary btn-glow signup-submit-btn"
                      disabled={isSubmitting}
                      style={{ marginTop: "1rem", width: "100%", justifyContent: "center" }}
                    >
                      {isSubmitting ? "Creating account..." : "Create account and start assessment"}
                      <ArrowRight size={18} />
                    </button>
                  </form>

                  <div className="signup-trust-strip">
                    {signupTrustSignals.map((item) => (
                      <span key={item} className="signup-trust-pill">
                        <ShieldCheck size={14} className="text-cyan" />
                        {item}
                      </span>
                    ))}
                  </div>

                  <div className="signup-secondary-row">
                    <span>Already have an account?</span>
                    <Link href="/sign-in" className="signup-link-inline">Go to sign in</Link>
                  </div>
                </div>

                <div className="signup-info-panel">
                  <div className="glass-card signup-preview-panel">
                    <div className="signup-preview-header">
                      <span>Assessment preview</span>
                      <strong>What your workspace unlocks</strong>
                    </div>

                    <div className="signup-preview-route" aria-hidden="true">
                      <span className="signup-preview-route-pill signup-preview-route-pill-vmware">
                        <Image src={vmwareLogo} alt="" width={16} height={16} />
                        VMware estate
                      </span>
                      <span className="signup-preview-route-arrow">
                        <ArrowRight size={14} />
                      </span>
                      <span className="signup-preview-route-pill signup-preview-route-pill-proxmox">
                        <Image src={proxmoxLogo} alt="" width={16} height={16} />
                        Proxmox target
                      </span>
                    </div>

                    <div className="signup-preview-metrics">
                      {signupPreviewMetrics.map((metric) => (
                        <div key={metric.label} className={`signup-preview-metric signup-preview-metric-${metric.accent}`}>
                          <strong>{metric.value}</strong>
                          <span>{metric.label}</span>
                          <small>{metric.detail}</small>
                        </div>
                      ))}
                    </div>

                    <div className="signup-preview-log">
                      <div className="signup-preview-log-head">
                        <Terminal size={16} />
                        <span>Assessment signal</span>
                      </div>
                      <div className="signup-preview-line">
                        <span>[OK]</span>
                        RVTools-ready intake and guided context capture
                      </div>
                      <div className="signup-preview-line">
                        <span>[MAP]</span>
                        Storage destination and network translation review
                      </div>
                      <div className="signup-preview-line">
                        <span>[PACK]</span>
                        Decision-ready PDF, wave notes and advisor context
                      </div>
                    </div>

                    <div className="signup-preview-footer">
                      <span>Agentless</span>
                      <span>Senior context</span>
                      <span>Audit-ready output</span>
                    </div>
                  </div>

                  <div className="glass-card signup-benefits-panel">
                    <div className="signup-benefits-head">
                      <h4>What you get in the first workspace</h4>
                      <p>Your free assessment is designed to prove readiness value before deeper migration planning starts.</p>
                    </div>

                    <div className="signup-benefit-list">
                      {signupValueCards.map(({ title, copy, accent, Icon }) => (
                        <div key={title} className={`signup-benefit-item signup-benefit-item-${accent}`}>
                          <div className="signup-benefit-icon">
                            <Icon size={18} />
                          </div>
                          <div>
                            <h5>{title}</h5>
                            <p>{copy}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="glass-card signup-proof-panel">
                    <div className="signup-proof-quote">
                      "The Shift Evidence validator gave our platform team the exact evidence we needed to justify our migration path to management. No guesses, just data."
                    </div>
                    <div className="signup-proof-meta">
                      <strong>Lead Infrastructure Architect</strong>
                      <span>Global Finance SaaS</span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
            {/* Left: Registration Form */}
            <div className="glass-card" style={{ padding: "3rem 2.5rem" }}>
              <div className="badge badge-cyan" style={{ marginBottom: "1rem" }}>
                Step 1: Create workspace
              </div>
              <h1 className="mb-2" style={{ color: "white", fontSize: "clamp(2rem, 4vw, 3.4rem)", lineHeight: 1.05 }}>
                Create your Shift Evidence workspace
              </h1>
              <p className="text-muted mb-6" style={{ fontSize: "0.95rem" }}>
                Start a controlled VMware-to-Proxmox readiness assessment. Upload evidence only after scope, consent and data handling expectations are clear.
              </p>

              <form onSubmit={handleSignUpSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <div className="form-group-custom" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <label htmlFor="fullname" style={{ fontSize: "0.85rem", fontWeight: 600, color: "white" }}>
                    Full Name
                  </label>
                  <div style={{ position: "relative" }}>
                    <User
                      size={18}
                      style={{
                        position: "absolute",
                        left: "1rem",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "var(--text-muted)",
                      }}
                    />
                    <input
                      id="fullname"
                      type="text"
                      placeholder="e.g. Jane Doe"
                      required
                      maxLength={288}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="form-input"
                      style={{ paddingLeft: "2.75rem", width: "100%" }}
                    />
                  </div>
                </div>

                <div className="form-group-custom" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <label htmlFor="email" style={{ fontSize: "0.85rem", fontWeight: 600, color: "white" }}>
                    Work Email
                  </label>
                  <div style={{ position: "relative" }}>
                    <Mail
                      size={18}
                      style={{
                        position: "absolute",
                        left: "1rem",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "var(--text-muted)",
                      }}
                    />
                    <input
                      id="email"
                      type="email"
                      placeholder="name@company.com"
                      required
                      maxLength={320}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="form-input"
                      style={{ paddingLeft: "2.75rem", width: "100%" }}
                    />
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "1rem",
                  }}
                >
                  <div className="form-group-custom" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <label htmlFor="company" style={{ fontSize: "0.85rem", fontWeight: 600, color: "white" }}>
                      Company Name
                    </label>
                    <div style={{ position: "relative" }}>
                      <Building
                        size={18}
                        style={{
                          position: "absolute",
                          left: "1rem",
                          top: "50%",
                          transform: "translateY(-50%)",
                          color: "var(--text-muted)",
                        }}
                      />
                      <input
                        id="company"
                        type="text"
                        placeholder="Enterprise Inc."
                        required
                        maxLength={216}
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        className="form-input"
                        style={{ paddingLeft: "2.75rem", width: "100%" }}
                      />
                    </div>
                  </div>

                  <div className="form-group-custom" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <label htmlFor="cluster-size" style={{ fontSize: "0.85rem", fontWeight: 600, color: "white" }}>
                      Cluster Size
                    </label>
                    <select
                      id="cluster-size"
                      value={clusterSize}
                      onChange={(e) => setClusterSize(e.target.value)}
                      className="form-input"
                      style={{ width: "100%", height: "45px", background: "rgba(10, 15, 30, 0.8)", border: "1px solid var(--border-color)", color: "white" }}
                    >
                      <option value="< 50 VMs">Under 50 VMs</option>
                      <option value="50-200 VMs">50 - 200 VMs</option>
                      <option value="200-1000 VMs">200 - 1,000 VMs</option>
                      <option value="1000+ VMs">1,000+ VMs</option>
                    </select>
                  </div>
                </div>

                <div className="form-group-custom" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <label htmlFor="password" style={{ fontSize: "0.85rem", fontWeight: 600, color: "white" }}>
                    Password
                  </label>
                  <div style={{ position: "relative" }}>
                    <Lock
                      size={18}
                      style={{
                        position: "absolute",
                        left: "1rem",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "var(--text-muted)",
                      }}
                    />
                    <input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="form-input"
                      style={{ paddingLeft: "2.75rem", width: "100%" }}
                    />
                  </div>
                </div>

                {error ? (
                  <p className="auth-error" role="alert" style={{ color: "var(--accent-red)", fontSize: "0.85rem", margin: 0 }}>
                    {error}
                  </p>
                ) : null}

                <button
                  type="submit"
                  className="btn btn-primary btn-glow"
                  disabled={isSubmitting}
                  style={{ marginTop: "1rem", width: "100%", justifyContent: "center" }}
                >
                  {isSubmitting ? "Creating account..." : "Create account and start assessment"}
                  <ArrowRight size={18} />
                </button>
              </form>

              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: "1.5rem",
                  marginTop: "1.5rem",
                  fontSize: "0.8rem",
                  color: "var(--text-muted)",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                  <ShieldCheck size={14} className="text-cyan" />
                  No agents required
                </span>
                <span>•</span>
                <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                  <ShieldCheck size={14} className="text-cyan" />
                  No production access required
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                  <ShieldCheck size={14} className="text-cyan" />
                  Evidence-based readiness
                </span>
                <Link href="/sign-in" className="text-cyan" style={{ textDecoration: "underline" }}>Already have an account?</Link>
              </div>
            </div>

            {/* Right: Benefits & Testimonials */}
            <div
              className="signup-info-panel"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.5rem",
                justifyContent: "center",
              }}
            >
              <div className="glass-card" style={{ padding: "2rem" }}>
                <h4 style={{ color: "white", marginBottom: "1rem", fontSize: "1.1rem" }}>
                  What you get with your free assessment:
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  <div style={{ display: "flex", gap: "1rem" }}>
                    <div
                      style={{
                        background: "rgba(6, 182, 212, 0.1)",
                        borderRadius: "8px",
                        padding: "0.5rem",
                        display: "flex",
                        alignItems: "center",
                        height: "fit-content",
                      }}
                    >
                      <Layers size={20} className="text-cyan" />
                    </div>
                    <div>
                      <h5 style={{ color: "white", margin: 0, fontSize: "0.95rem" }}>Cluster Sizing & Capacity Map</h5>
                      <p className="text-muted" style={{ fontSize: "0.85rem", margin: "0.25rem 0 0 0" }}>
                        Analyzes your workload counts, CPU, RAM and VM storage distributions.
                      </p>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "1rem" }}>
                    <div
                      style={{
                        background: "rgba(139, 92, 246, 0.1)",
                        borderRadius: "8px",
                        padding: "0.5rem",
                        display: "flex",
                        alignItems: "center",
                        height: "fit-content",
                      }}
                    >
                      <Server size={20} style={{ color: "#8b5cf6" }} />
                    </div>
                    <div>
                      <h5 style={{ color: "white", margin: 0, fontSize: "0.95rem" }}>Storage & Network Compatibility</h5>
                      <p className="text-muted" style={{ fontSize: "0.85rem", margin: "0.25rem 0 0 0" }}>
                        Identifies complex vSAN to Ceph conversions and Distributed Switch (dVS) mapping rules.
                      </p>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "1rem" }}>
                    <div
                      style={{
                        background: "rgba(16, 185, 129, 0.1)",
                        borderRadius: "8px",
                        padding: "0.5rem",
                        display: "flex",
                        alignItems: "center",
                        height: "fit-content",
                      }}
                    >
                      <ShieldCheck size={20} className="text-emerald" />
                    </div>
                    <div>
                      <h5 style={{ color: "white", margin: 0, fontSize: "0.95rem" }}>Broadcom Licensing Cost Delta</h5>
                      <p className="text-muted" style={{ fontSize: "0.85rem", margin: "0.25rem 0 0 0" }}>
                        Estimates your exact licensing savings when transitioning to Proxmox VE.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div
                className="glass-card"
                style={{
                  padding: "1.5rem 2rem",
                  borderLeft: "4px solid var(--accent-cyan)",
                  background: "rgba(6, 182, 212, 0.02)",
                }}
              >
                <p
                  style={{
                    fontSize: "0.85rem",
                    fontStyle: "italic",
                    lineHeight: "1.5",
                    margin: 0,
                  }}
                >
                  "The Shift Evidence validator gave our platform team the exact evidence we needed to justify our migration path to management. No guesses, just data."
                </p>
                <div style={{ marginTop: "0.75rem", fontSize: "0.8rem" }}>
                  <strong style={{ color: "white" }}>- Lead Infrastructure Architect</strong>
                  <span className="text-muted" style={{ marginLeft: "0.25rem" }}>
                    | Global Finance SaaS
                  </span>
                </div>
              </div>
            </div>
              </>
            )}
          </div>
        ) : (
          /* INTEGRATED READINESS SCANNER INLINE */
          <div
            className="glass-card"
            style={{
              width: "100%",
              maxWidth: "850px",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div className="wizard-header">
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <Terminal className="text-cyan" size={24} />
                <h3 className="wizard-title" style={{ margin: 0 }}>
                  Ready to Run Assessment
                </h3>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--text-muted)",
                    background: "rgba(255, 255, 255, 0.05)",
                    padding: "0.25rem 0.75rem",
                    borderRadius: "20px",
                    border: "1px solid var(--border-color)",
                  }}
                >
                  Logged in as <strong style={{ color: "white" }}>{email}</strong>
                </div>
                <button
                  onClick={handleEnterWorkspace}
                  disabled={isCreatingAssessment}
                  className="btn btn-secondary btn-sm"
                  style={{
                    fontSize: "0.8rem",
                    padding: "0.3rem 0.8rem",
                    borderRadius: "6px",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.35rem"
                  }}
                >
                  {isCreatingAssessment ? "Loading..." : "Go to Workspace"} <ArrowRight size={12} />
                </button>
              </div>
            </div>

            {/* Setup Step */}
            {currentStep === "setup" && (
              <>
                <div className="wizard-body">
                  {evidenceSource === "none" && (
                    <div>
                      <p className="mb-6" style={{ fontSize: "0.95rem", lineHeight: "1.6" }}>
                        Welcome, <strong>{fullName || "User"}</strong>! Choose how you would like to supply your VMware cluster evidence. We will parse it through the TAM-led audit engine to build your assessment.
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
                          <span
                            className="btn btn-secondary btn-sm"
                            style={{ marginTop: "0.5rem", display: "inline-block" }}
                          >
                            Select .xlsx Export
                          </span>
                        </div>
                      </div>

                      <div className="modal-divider">or</div>

                      {/* Manual Guided Intake Card */}
                      <button className="intake-option-btn" onClick={() => setEvidenceSource("manual")}>
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
                        <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-muted)" }}>
                          Step 2: Map Current Environment (Section {setupSubStep} of 3:{" "}
                          {setupSubStep === 1
                            ? "Compute & Storage"
                            : setupSubStep === 2
                              ? "Network Topology"
                              : "High Availability & Tooling"}
                          )
                        </span>
                        <div className="step-indicator">
                          <div className={`step-dot ${setupSubStep >= 1 ? "active" : ""} ${setupSubStep > 1 ? "completed" : ""}`} />
                          <div className={`step-dot ${setupSubStep >= 2 ? "active" : ""} ${setupSubStep > 2 ? "completed" : ""}`} />
                          <div className={`step-dot ${setupSubStep >= 3 ? "active" : ""}`} />
                        </div>
                      </div>

                      {/* Substep 1: Storage */}
                      {setupSubStep === 1 && (
                        <div>
                          <h4 className="mb-2" style={{ color: "white" }}>
                            Select VMware Storage Architecture
                          </h4>
                          <p className="mb-6" style={{ fontSize: "0.9rem" }}>
                            How are your virtual machine files and virtual disks hosted?
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
                                Fibre Channel, iSCSI, or NFS shares connected to ESXi hosts.
                              </span>
                            </div>

                            <div
                              className={`option-card ${storageType === "vsan" ? "selected" : ""}`}
                              onClick={() => setStorageType("vsan")}
                            >
                              <span className="option-card-title">
                                <Layers size={18} className="text-purple" />
                                VMware vSAN (Software-Defined)
                              </span>
                              <span className="option-card-desc">
                                Local ESXi NVMe/SSD drives combined into a shared cluster datastore.
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Substep 2: Network */}
                      {setupSubStep === 2 && (
                        <div>
                          <h4 className="mb-2" style={{ color: "white" }}>
                            Choose Network vSwitch Config
                          </h4>
                          <p className="mb-6" style={{ fontSize: "0.9rem" }}>
                            How are virtual networks managed across your ESXi host cluster?
                          </p>

                          <div className="options-grid">
                            <div
                              className={`option-card ${networkType === "dvs" ? "selected" : ""}`}
                              onClick={() => setNetworkType("dvs")}
                            >
                              <span className="option-card-title">
                                <Network size={18} style={{ color: "#8b5cf6" }} />
                                Distributed Switch (dVS)
                              </span>
                              <span className="option-card-desc">
                                Centrally managed vCenter switch configuration spanning all hosts.
                              </span>
                            </div>

                            <div
                              className={`option-card ${networkType === "standard" ? "selected" : ""}`}
                              onClick={() => setNetworkType("standard")}
                            >
                              <span className="option-card-title">
                                <Server size={18} className="text-cyan" />
                                Standard Switch (vSS)
                              </span>
                              <span className="option-card-desc">
                                Locally managed host-level vSwitches configured independently.
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Substep 3: Tooling */}
                      {setupSubStep === 3 && (
                        <div>
                          <h4 className="mb-4" style={{ color: "white" }}>
                            High Availability & Secondary Tooling
                          </h4>

                          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                            <div>
                              <label style={{ color: "white", fontSize: "0.9rem", display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>
                                Is VMware HA (High Availability) required?
                              </label>
                              <div style={{ display: "flex", gap: "1rem" }}>
                                <button
                                  type="button"
                                  className={`btn ${haRequired ? "btn-primary btn-glow" : "btn-secondary"}`}
                                  onClick={() => setHaRequired(true)}
                                >
                                  Yes, require HA
                                </button>
                                <button
                                  type="button"
                                  className={`btn ${!haRequired ? "btn-primary btn-glow" : "btn-secondary"}`}
                                  onClick={() => setHaRequired(false)}
                                >
                                  No, standalone is fine
                                </button>
                              </div>
                            </div>

                            <div>
                              <label style={{ color: "white", fontSize: "0.9rem", display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>
                                Primary Backup Provider
                              </label>
                              <div className="options-grid" style={{ marginTop: 0 }}>
                                <div
                                  className={`option-card ${backupSystem === "veeam" ? "selected" : ""}`}
                                  onClick={() => setBackupSystem("veeam")}
                                >
                                  <span className="option-card-title" style={{ fontSize: "0.95rem" }}>
                                    Veeam Backup & Replication
                                  </span>
                                </div>
                                <div
                                  className={`option-card ${backupSystem === "other" ? "selected" : ""}`}
                                  onClick={() => setBackupSystem("other")}
                                >
                                  <span className="option-card-title" style={{ fontSize: "0.95rem" }}>
                                    Other / Script-based Backup
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Setup Footer */}
                {evidenceSource === "manual" && (
                  <div className="wizard-footer">
                    <button
                      className="btn btn-secondary"
                      onClick={
                        setupSubStep === 1
                          ? () => setEvidenceSource("none")
                          : () => setSetupSubStep((p) => p - 1)
                      }
                    >
                      Back
                    </button>

                    {setupSubStep < 3 ? (
                      <button className="btn btn-primary" onClick={() => setSetupSubStep((p) => p + 1)}>
                        Continue
                        <ArrowRight size={16} />
                      </button>
                    ) : (
                      <button className="btn btn-primary btn-glow" onClick={() => startDiagnosticCheck("manual")}>
                        Run Compatibility Scan
                        <Play size={16} />
                      </button>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Scanning Terminal Logs Step */}
            {currentStep === "scanning" && (
              <div className="wizard-body text-center">
                <div className="scanner-container" style={{ margin: "2rem 0" }}>
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

                <div className="console-box" style={{ textAlign: "left" }}>
                  {logs.map(({ message, type }, index) => (
                    <div
                      key={index}
                      className={`console-line ${type === "success" ? "success" : type === "warn" ? "warn" : ""}`}
                    >
                      <span style={{ color: "#4b5563" }}>[{new Date().toLocaleTimeString()}] </span>
                      <span>{message}</span>
                    </div>
                  ))}
                  <div ref={consoleEndRef} />
                </div>
              </div>
            )}

            {/* Results Scorecard Step */}
            {currentStep === "results" && (
              <>
                <div className="wizard-body animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                  <div className="result-panel">
                    <div className="score-hero">
                      <div className="score-dial" style={scoreStyle}>
                        <span className="score-number">{getScore()}%</span>
                      </div>
                      <div className="score-text-content">
                        <div className="badge" style={{ margin: 0, width: "fit-content" }}>
                          Synthetic readiness preview
                        </div>
                        <h4 style={{ color: "white", marginTop: "0.5rem" }}>
                          Preliminary evidence readiness
                        </h4>
                        <p style={{ fontSize: "0.85rem", lineHeight: "1.5" }}>
                          Based on mapped parameters, this preview estimates a {getScore()}% readiness signal for planning. It does not execute migration or guarantee outcome.
                        </p>
                      </div>
                    </div>

                    <div>
                      <h4 className="mb-4" style={{ color: "white", fontSize: "1.1rem" }}>
                        Scorecard Findings Summary
                      </h4>
                      <div className="recommendations-list">
                        <div className="recommendation-card ready">
                          <Check className="recommendation-icon text-emerald" size={18} />
                          <div>
                            <div className="recommendation-title">No critical blockers detected in preview</div>
                            <div className="recommendation-desc">
                              No critical compatibility flags were detected in this synthetic example. Real findings depend on approved evidence.
                            </div>
                          </div>
                        </div>

                        <div className="recommendation-card ready">
                          <Check className="recommendation-icon text-emerald" size={18} />
                          <div>
                            <div className="recommendation-title">Cost delta: planning estimate</div>
                            <div className="recommendation-desc">
                              Cost exposure is modeled as an estimate and should be validated against current contracts and scope.
                            </div>
                          </div>
                        </div>

                        <div className="recommendation-card ready">
                          <Check className="recommendation-icon text-emerald" size={18} />
                          <div>
                            <div className="recommendation-title">Storage Targets: Configured</div>
                            <div className="recommendation-desc">
                              {evidenceSource === "file" || storageType !== "vsan"
                                ? "External block storage mapping requires staged migration planning and validation."
                                : "VMware vSAN storage flagged for Proxmox Ceph design and replication planning review."}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="wizard-footer">
                  <button className="btn btn-secondary" onClick={resetWizard}>
                    Run Different Audit
                  </button>
                  <button
                    className="btn btn-primary btn-glow"
                    onClick={() => setCurrentStep("download")}
                    style={{
                      background: "linear-gradient(135deg, #10b981 30%, #059669 100%)",
                      boxShadow: "0 4px 20px rgba(16, 185, 129, 0.3)",
                    }}
                  >
                    <ShieldCheck size={18} />
                    Request assessment package
                  </button>
                </div>
              </>
            )}

            {/* Final Download/Success Step */}
            {currentStep === "download" && (
              <div className="wizard-body text-center" style={{ padding: "4rem 2rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem" }}>
                <div
                  style={{
                    background: "rgba(16, 185, 129, 0.1)",
                    border: "1px solid rgba(16, 185, 129, 0.2)",
                    borderRadius: "50%",
                    padding: "1.25rem",
                    display: "inline-flex",
                    justifyContent: "center",
                    alignItems: "center",
                    color: "#10b981",
                    marginBottom: "1rem",
                  }}
                >
                  <ShieldCheck size={48} />
                </div>
                <h2 style={{ color: "white", margin: 0 }}>Readiness Preview Prepared</h2>
                <p className="text-muted" style={{ maxWidth: "550px", fontSize: "0.95rem", lineHeight: "1.6" }}>
                  Your preliminary VMware to Proxmox readiness preview is ready. Full reports and downloads are generated from the authenticated workspace after evidence review.
                </p>

                <div
                  className="glass-card"
                  style={{
                    width: "100%",
                    maxWidth: "500px",
                    padding: "1.5rem",
                    background: "rgba(255, 255, 255, 0.02)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    textAlign: "left",
                    marginTop: "1rem",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <FileText className="text-cyan" size={32} />
                    <div>
                      <strong style={{ color: "white", display: "block", fontSize: "0.9rem" }}>
                        Shift_Evidence_Report_{company.replace(/\s+/g, "_") || "Readiness"}.pdf
                      </strong>
                      <span className="text-muted" style={{ fontSize: "0.8rem" }}>
                        PDF Report • {evidenceSource === "file" ? "RVTools Data" : "Intake Data"} • {getScore()}% score
                      </span>
                    </div>
                  </div>
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ display: "flex", gap: "0.5rem", alignItems: "center", border: "1px solid var(--border-color)" }}
                    onClick={() =>
                      setReportInfoMessage(
                        "Full PDF downloads are available inside the authenticated workspace after evidence review.",
                      )
                    }
                  >
                    <Download size={16} />
                    Download info
                  </button>
                </div>
                {reportInfoMessage ? (
                  <p
                    className="auth-success"
                    role="status"
                    aria-live="polite"
                    style={{ marginTop: "0.75rem", maxWidth: "500px", width: "100%" }}
                  >
                    {reportInfoMessage}
                  </p>
                ) : null}

                <div className="shiftreadiness-actions" style={{ marginTop: "2rem", display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
                  <button
                    onClick={handleEnterWorkspace}
                    disabled={isCreatingAssessment}
                    className="btn btn-primary btn-glow"
                    style={{ background: "linear-gradient(135deg, #06b6d4 30%, #0891b2 100%)", boxShadow: "0 4px 20px rgba(6, 182, 212, 0.3)" }}
                  >
                    {isCreatingAssessment ? "Initializing Workspace..." : "Enter Active Workspace"}
                    <ArrowRight size={16} />
                  </button>
                  <Link href="/shiftreadiness" className="btn btn-secondary">
                    Compare Professional Plans
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}
