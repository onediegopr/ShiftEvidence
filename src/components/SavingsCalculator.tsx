import { useState } from "react";
import Image from "next/image";
import {
  Percent,
  ChevronDown,
  ChevronUp,
  Server,
  Cpu,
  Monitor,
  TrendingDown,
  Calendar,
  ArrowRight,
  Info,
} from "lucide-react";
import vmwareLogo from "../../images/vmware.svg";
import proxmoxLogo from "../../images/proxmox.svg";
import {
  STATIC_EUR_USD_RATE,
  getLicensingPriceItem,
} from "../lib/licensing/pricingSource";
import { calculateLicensingComparison } from "../lib/licensing/licensingCostModel";


type VmwareTier = "standard" | "vvf" | "vcf";
type ProxmoxTier = "community" | "basic" | "standard" | "premium";

type FxStatus = "static";

function requirePrice(vendor: "vmware" | "proxmox", tier: string) {
  const item = getLicensingPriceItem(vendor, tier);
  if (!item) {
    throw new Error(`Missing central licensing price for ${vendor}/${tier}.`);
  }
  return item;
}

const VMWARE_PRICES = {
  standard: requirePrice("vmware", "standard"),
  vvf: requirePrice("vmware", "vvf"),
  vcf: requirePrice("vmware", "vcf"),
};

const PROXMOX_PRICES = {
  community: requirePrice("proxmox", "community"),
  basic: requirePrice("proxmox", "basic"),
  standard: requirePrice("proxmox", "standard"),
  premium: requirePrice("proxmox", "premium"),
};

const VMWARE_DEFAULTS: Record<
  VmwareTier,
  { label: string; price: number; sublabel: string }
> = {
  standard: {
    label: "vSphere Standard",
    price: VMWARE_PRICES.standard.normalizedUnitPrice.amount,
    sublabel: `$${VMWARE_PRICES.standard.normalizedUnitPrice.amount}/core/year`,
  },
  vvf: {
    label: "vSphere Foundation (VVF)",
    price: VMWARE_PRICES.vvf.normalizedUnitPrice.amount,
    sublabel: `$${VMWARE_PRICES.vvf.normalizedUnitPrice.amount}/core/year`,
  },
  vcf: {
    label: "Cloud Foundation (VCF)",
    price: VMWARE_PRICES.vcf.normalizedUnitPrice.amount,
    sublabel: `$${VMWARE_PRICES.vcf.normalizedUnitPrice.amount}/core/year`,
  },
};

const PROXMOX_DEFAULTS: Record<
  ProxmoxTier,
  { label: string; priceEur: number }
> = {
  community: {
    label: "Community",
    priceEur: PROXMOX_PRICES.community.unitPrice.amount,
  },
  basic: {
    label: "Basic",
    priceEur: PROXMOX_PRICES.basic.unitPrice.amount,
  },
  standard: {
    label: "Standard",
    priceEur: PROXMOX_PRICES.standard.unitPrice.amount,
  },
  premium: {
    label: "Premium",
    priceEur: PROXMOX_PRICES.premium.unitPrice.amount,
  },
};

const CORES_OPTIONS = [16, 24, 32, 48, 64];

export default function SavingsCalculator() {
  // --- Environment ---
  const [servers, setServers] = useState(8);
  const [socketsPerServer, setSocketsPerServer] = useState(2);
  const [coresPerSocket, setCoresPerSocket] = useState(24);

  // --- VMware ---
  const [vmwareTier, setVmwareTier] = useState<VmwareTier>("vvf");
  const [vmwarePricePerCore, setVmwarePricePerCore] = useState(
    VMWARE_DEFAULTS["vvf"].price,
  );

  // --- Proxmox ---
  const [proxmoxTier, setProxmoxTier] = useState<ProxmoxTier>("premium");
  const [proxmoxPriceEur, setProxmoxPriceEur] = useState(
    PROXMOX_DEFAULTS["premium"].priceEur,
  );

  // --- FX ---
  const usdPerEur = STATIC_EUR_USD_RATE.rate;
  const fxStatus: FxStatus = "static";

  // --- Options ---
  const [includeEscalation, setIncludeEscalation] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [showAssumptions, setShowAssumptions] = useState(false);

  // --- Workload context (informational only, does not affect licensing) ---
  const [vms, setVms] = useState(120);
  const [storage, setStorage] = useState(80);

  // ===================== CALCULATIONS =====================

  const calculation = calculateLicensingComparison({
    hosts: servers,
    socketsPerHost: socketsPerServer,
    coresPerSocket,
    vmwareTier,
    proxmoxTier,
    includeVmwareEscalation: includeEscalation,
    priceOverrides: {
      vmwareUnitPriceUsd: vmwarePricePerCore,
      proxmoxUnitPriceUsd: proxmoxPriceEur * usdPerEur,
    },
  });
  const totalSockets = calculation.vmware.sockets;
  const licensedCores = calculation.vmware.billableCores;
  const coresBumped = coresPerSocket < 16;

  // --- Annual ---
  const vmwareAnnual = calculation.vmware.annualCost.amount;
  const proxmoxAnnualUsd = calculation.proxmox.annualCost.amount;

  // --- 3-Year ---
  // Broadcom escalation: +10% YoY when enabled
  const escalationFactor = includeEscalation ? 1 + 1.1 + 1.21 : 3;
  const vmware3Year = calculation.comparison.projections.find((item) => item.years === 3)?.vmwareCost.amount ?? vmwareAnnual * escalationFactor;
  const proxmox3Year = calculation.comparison.projections.find((item) => item.years === 3)?.proxmoxCost.amount ?? proxmoxAnnualUsd * 3;

  // --- Savings ---
  const annualSavings = calculation.comparison.annualSavings.amount;
  const annualSavingsPercent = calculation.comparison.savingsPercent;
  const threeYearSavings = calculation.comparison.threeYearSavings.amount;
  const threeYearSavingsPercent = vmware3Year > 0 ? (threeYearSavings / vmware3Year) * 100 : 0;

  // Relative bar width: Proxmox bar proportional to VMware (max = 100%)
  const barProxmoxWidth =
    vmware3Year > 0
      ? Math.min(100, Math.round((proxmox3Year / vmware3Year) * 100))
      : 100;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US").format(val);
  };

  const selectVmwareTier = (tier: VmwareTier) => {
    setVmwareTier(tier);
    setVmwarePricePerCore(VMWARE_DEFAULTS[tier].price);
  };

  const selectProxmoxTier = (tier: ProxmoxTier) => {
    setProxmoxTier(tier);
    setProxmoxPriceEur(PROXMOX_DEFAULTS[tier].priceEur);
  };

  return (
    <section
      id="savings"
      className="section"
      style={{ background: "rgba(6, 9, 19, 0.2)" }}
    >
      <div className="container">
        {/* ========== SECTION HEADER ========== */}
        <div className="text-center mb-6">
          <div className="badge badge-cyan">Return on Investment</div>
          <h2 className="mb-4">Calculate your Licensing Impact</h2>
          <p className="mx-auto" style={{ maxWidth: "650px" }}>
            Compare modeled VMware and Proxmox subscription costs based on your
            environment size. All estimates in USD.
          </p>
        </div>

        {/* ========== COMPARISON HEADER ========== */}
        <div className="cmp-header">
          <div className="cmp-header-badge vmware">
            <Image src={vmwareLogo} alt="VMware Logo" width={24} height={24} className="cmp-logo-icon" />
            <span className="cmp-header-title">Current VMware Environment</span>
            <span className="cmp-header-sub">Legacy Subscription Model</span>
          </div>
          <div className="cmp-header-arrow">
            <ArrowRight size={28} />
          </div>
          <div className="cmp-header-badge proxmox">
            <Image src={proxmoxLogo} alt="Proxmox Logo" width={24} height={24} className="cmp-logo-icon" />
            <span className="cmp-header-title">Target Proxmox Environment</span>
            <span className="cmp-header-sub">Open Infrastructure Model</span>
          </div>
        </div>

        {/* ========== MAIN GRID ========== */}
        <div className="glass-card calc-container">
          {/* ========== LEFT PANEL: CURRENT VMWARE ENVIRONMENT ========== */}
          <div className="calc-inputs">
            {/* ---- VMware License Tier ---- */}
            <div className="slider-group">
              <span className="slider-label">
                <Image src={vmwareLogo} alt="VMware Logo" width={18} height={18} className="cmp-label-logo" style={{ display: "inline-block", marginRight: "6px", verticalAlign: "middle" }} />
                VMware License Tier
              </span>
              <div className="radio-group">
                {(Object.keys(VMWARE_DEFAULTS) as VmwareTier[]).map((tier) => (
                  <button
                    key={tier}
                    onClick={() => selectVmwareTier(tier)}
                    className={`radio-btn ${vmwareTier === tier ? "active" : ""}`}
                  >
                    {VMWARE_DEFAULTS[tier].label}
                    <span className="radio-sub">
                      {VMWARE_DEFAULTS[tier].sublabel}
                    </span>
                  </button>
                ))}
              </div>
              <div className="price-edit-row">
                <span className="price-edit-label">
                  Price per core/year (USD):
                </span>
                <div className="price-input-wrapper">
                  <span className="price-currency">$</span>
                  <input
                    type="number"
                    value={vmwarePricePerCore}
                    onChange={(e) =>
                      setVmwarePricePerCore(Number(e.target.value))
                    }
                    className="price-input"
                    min={0}
                    step={1}
                  />
                </div>
              </div>
            </div>

            {/* ---- Environment Size ---- */}
            <div className="slider-group">
              <span className="slider-label">
                <Cpu size={16} className="cmp-input-icon" color="#6366f1" />
                Environment Size
              </span>

              {/* Servers */}
              <div className="slider-header">
                <span className="slider-sub-label">
                  <Server
                    size={13}
                    className="cmp-input-icon"
                    color="var(--text-dark)"
                  />
                  Physical Servers / Nodes
                </span>
                <span className="slider-value">{servers}</span>
              </div>
              <input
                type="range"
                min="1"
                max="32"
                step="1"
                value={servers}
                onChange={(e) => setServers(Number(e.target.value))}
                className="custom-range"
              />

              {/* Sockets per server */}
              <div className="slider-header">
                <span className="slider-sub-label">
                  <Cpu
                    size={13}
                    className="cmp-input-icon"
                    color="var(--text-dark)"
                  />
                  CPU Sockets per Server
                </span>
                <span className="slider-value">{socketsPerServer}</span>
              </div>
              <input
                type="range"
                min="1"
                max="8"
                step="1"
                value={socketsPerServer}
                onChange={(e) => setSocketsPerServer(Number(e.target.value))}
                className="custom-range"
              />

              {/* Cores per socket */}
              <span className="slider-sub-label">
                <Cpu
                  size={13}
                  className="cmp-input-icon"
                  color="var(--text-dark)"
                />
                Cores per Socket
              </span>
              <div className="cores-group">
                {CORES_OPTIONS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCoresPerSocket(c)}
                    className={`core-btn ${coresPerSocket === c ? "active" : ""}`}
                  >
                    {c}
                  </button>
                ))}
              </div>

              {/* Calculated summary */}
              <div className="calc-summary">
                <div className="calc-summary-item">
                  <span>Total sockets</span>
                  <strong>{totalSockets}</strong>
                </div>
                <div className="calc-summary-item">
                  <span>Licensed Cores</span>
                  <strong>{licensedCores}</strong>
                  {coresBumped && (
                    <span className="calc-note">
                      16-core min per CPU applied
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* ---- Workload context (now visible by default) ---- */}
            <div className="slider-group">
              <span className="slider-label">
                <Monitor size={16} className="cmp-input-icon" color="#a855f7" />
                Workload Context
              </span>

              <div className="slider-header">
                <span className="slider-sub-label">Virtual Machines</span>
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

              <div className="slider-header" style={{ marginTop: "0.75rem" }}>
                <span className="slider-sub-label">Storage Footprint</span>
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
              <p className="workload-note">
                Workload metrics are for context only and do not affect
                licensing estimates.
              </p>
            </div>

            {/* ---- Advanced options ---- */}
            <button
              className="collapse-toggle"
              onClick={() => setShowOptions(!showOptions)}
            >
              <span>Advanced Options</span>
              {showOptions ? (
                <ChevronUp size={16} />
              ) : (
                <ChevronDown size={16} />
              )}
            </button>
            {showOptions && (
              <div className="options-panel">
                <label className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={includeEscalation}
                    onChange={(e) => setIncludeEscalation(e.target.checked)}
                  />
                    <span>
                      Include annual Broadcom escalation estimates (+10% YoY)
                    </span>
                </label>
                <p className="fx-note" style={{ marginTop: "0.75rem" }}>
                  FX conversion uses the central static assumption: {usdPerEur} USD per EUR
                  ({fxStatus}, {STATIC_EUR_USD_RATE.effectiveDate}).
                </p>
              </div>
            )}
          </div>

          {/* ========== RIGHT PANEL: TARGET PROXMOX COST MODEL ========== */}
          <div className="calc-results">
            {/* ---- Proxmox Subscription Tier ---- */}
            <div className="slider-group" style={{ marginBottom: "1.5rem" }}>
              <span className="slider-label">
                <Image src={proxmoxLogo} alt="Proxmox Logo" width={18} height={18} className="cmp-label-logo" style={{ display: "inline-block", marginRight: "6px", verticalAlign: "middle" }} />
                Proxmox Subscription Tier
              </span>
              <div className="radio-group proxmox-radio-group">
                {(Object.keys(PROXMOX_DEFAULTS) as ProxmoxTier[]).map(
                  (tier) => (
                    <button
                      key={tier}
                      onClick={() => selectProxmoxTier(tier)}
                      className={`radio-btn ${proxmoxTier === tier ? "active" : ""}`}
                    >
                      {PROXMOX_DEFAULTS[tier].label}
                      <span className="radio-sub">
                        {formatCurrency(
                          PROXMOX_DEFAULTS[tier].priceEur * usdPerEur,
                        )}
                        /skt/yr
                      </span>
                    </button>
                  ),
                )}
              </div>
              <p className="fx-note">
                Converted to USD with the central static FX assumption. Original
                Proxmox list prices remain modeled in EUR.
              </p>
            </div>

            {/* ---- Hero Savings Card ---- */}
            <div className="cmp-savings-hero">
              <div className="cmp-savings-hero-label">
                <TrendingDown size={14} color="#4ade80" />
                ESTIMATED SAVINGS
              </div>
              <div className="cmp-savings-hero-amount">
                {formatCurrency(Math.abs(threeYearSavings))}
              </div>
              <div className="cmp-savings-hero-sub">
                3-Year Subscription Delta
              </div>
              <div className="cmp-savings-hero-pct">
                <div
                  className="badge badge-cyan"
                  style={{ textTransform: "none" }}
                >
                  <Percent size={12} style={{ marginRight: "4px" }} />
                  {threeYearSavings >= 0 ? "Savings of " : "Cost increase of "}
                  {Math.abs(threeYearSavingsPercent).toFixed(1)}% on modeled
                  subscription costs
                </div>
              </div>

              {/* Annual delta inside hero */}
              <div className="cmp-savings-hero-annual">
                <Calendar size={14} />
                <span>{formatCurrency(annualSavings)} / year</span>
                <span className="cmp-annual-pct">
                  ({annualSavings >= 0 ? "-" : "+"}
                  {Math.abs(annualSavingsPercent).toFixed(1)}%)
                </span>
              </div>
            </div>

            {/* ---- Comparison Bars ---- */}
            <div className="cmp-savings-bar-section">
              <div className="cmp-savings-bar-label">
                Cost Comparison (3-Year)
              </div>
              <div className="cmp-savings-bar">
                <div className="cmp-bar-row vmware">
                  <div className="cmp-bar-inner">
                    <span>VMware</span>
                    <span>{formatCurrency(vmware3Year)}</span>
                  </div>
                </div>
                <div
                  className="cmp-bar-row proxmox"
                  style={{ width: `${barProxmoxWidth}%` }}
                >
                  <div className="cmp-bar-inner">
                    <span>Proxmox</span>
                    <span>{formatCurrency(proxmox3Year)}</span>
                  </div>
                </div>
              </div>
              {threeYearSavings > 0 && (
                <div className="cmp-bar-delta">
                  You save {formatCurrency(threeYearSavings)} over 3 years
                </div>
              )}
            </div>

            {/* ---- Breakdown ---- */}
            <div className="cmp-breakdown">
              <div className="cmp-breakdown-row vmware">
                <span className="cmp-br-label">VMware 3-Year Estimate</span>
                <span className="cmp-br-total">
                  {formatCurrency(vmware3Year)}
                </span>
                <span className="cmp-br-annual">
                  {formatCurrency(vmwareAnnual)}/yr
                </span>
              </div>
              <div className="cmp-breakdown-row proxmox">
                <span className="cmp-br-label">Proxmox 3-Year Estimate</span>
                <span className="cmp-br-total">
                  {formatCurrency(proxmox3Year)}
                </span>
                <span className="cmp-br-annual">
                  {formatCurrency(proxmoxAnnualUsd)}/yr
                </span>
              </div>
            </div>

            {/* ---- Assumptions (collapsible) ---- */}
            <button
              className="cmp-assumptions-toggle"
              onClick={() => setShowAssumptions(!showAssumptions)}
            >
              <Info size={13} />
              <span>View assumptions</span>
              {showAssumptions ? (
                <ChevronUp size={12} />
              ) : (
                <ChevronDown size={12} />
              )}
            </button>
            {showAssumptions && (
              <div className="cmp-assumptions-content">
                <p>
                  <strong>Assumptions:</strong> VMware pricing is modeled from
                  public reference pricing and licensed core calculations
                  (16-core minimum per physical CPU for VCF/VVF). Proxmox
                  pricing reflects the selected subscription tier, total CPU
                  sockets, and the central USD conversion metadata.
                  {includeEscalation &&
                    " VMware estimate includes 10% YoY Broadcom escalation."}
                </p>
                <p style={{ fontSize: "0.75rem", opacity: 0.7 }}>
                  Estimates compare modeled virtualization subscription costs
                  only. They do not include hardware, backup platforms,
                  migration services, internal labor, downtime risk, taxes,
                  currency fluctuations, or contract-specific discounts. All
                  figures in USD.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

