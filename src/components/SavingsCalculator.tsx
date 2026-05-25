import { useState, useEffect } from "react";
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


type VmwareTier = "standard" | "vvf" | "vcf";
type ProxmoxTier = "community" | "basic" | "standard" | "premium";

type FxStatus = "loading" | "live" | "fallback";

const VMWARE_DEFAULTS: Record<
  VmwareTier,
  { label: string; price: number; sublabel: string }
> = {
  standard: { label: "vSphere Standard", price: 50, sublabel: "$50/core/year" },
  vvf: {
    label: "vSphere Foundation (VVF)",
    price: 135,
    sublabel: "$135/core/year",
  },
  vcf: {
    label: "Cloud Foundation (VCF)",
    price: 350,
    sublabel: "$350/core/year",
  },
};

const PROXMOX_DEFAULTS: Record<
  ProxmoxTier,
  { label: string; priceEur: number }
> = {
  community: { label: "Community", priceEur: 120 },
  basic: { label: "Basic", priceEur: 370 },
  standard: { label: "Standard", priceEur: 550 },
  premium: { label: "Premium", priceEur: 1100 },
};

const CORES_OPTIONS = [16, 24, 32, 48, 64];
const FX_FALLBACK_EUR_PER_USD = 1.16;
const FX_FALLBACK_USD_PER_EUR = 1 / FX_FALLBACK_EUR_PER_USD;
const FX_RATE_URL =
  "https://api.frankfurter.dev/v1/latest?base=EUR&symbols=USD";

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
  const [usdPerEur, setUsdPerEur] = useState(FX_FALLBACK_USD_PER_EUR);
  const [fxStatus, setFxStatus] = useState<FxStatus>("loading");

  // --- Options ---
  const [includeEscalation, setIncludeEscalation] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [showAssumptions, setShowAssumptions] = useState(false);

  // --- Workload context (informational only, does not affect licensing) ---
  const [vms, setVms] = useState(120);
  const [storage, setStorage] = useState(80);

  // Sync price defaults when tier changes
  useEffect(() => {
    setVmwarePricePerCore(VMWARE_DEFAULTS[vmwareTier].price);
  }, [vmwareTier]);

  useEffect(() => {
    setProxmoxPriceEur(PROXMOX_DEFAULTS[proxmoxTier].priceEur);
  }, [proxmoxTier]);

  useEffect(() => {
    const controller = new AbortController();

    const loadFxRate = async () => {
      try {
        const response = await fetch(FX_RATE_URL, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`FX request failed with ${response.status}`);
        }

        const data: { rates?: { USD?: number } } = await response.json();
        const liveRate = data.rates?.USD;

        if (typeof liveRate !== "number" || !Number.isFinite(liveRate)) {
          throw new Error("FX response missing USD rate");
        }

        setUsdPerEur(liveRate);
        setFxStatus("live");
      } catch {
        if (!controller.signal.aborted) {
          setUsdPerEur(FX_FALLBACK_USD_PER_EUR);
          setFxStatus("fallback");
        }
      }
    };

    loadFxRate();

    return () => controller.abort();
  }, []);

  // ===================== CALCULATIONS =====================

  const totalSockets = servers * socketsPerServer;
  // VMware licenses physical cores with a 16-core minimum per CPU socket
  const licensedCores =
    servers * socketsPerServer * Math.max(coresPerSocket, 16);
  const coresBumped = coresPerSocket < 16;

  // --- Annual ---
  const vmwareAnnual = licensedCores * vmwarePricePerCore;
  const proxmoxPriceUsd = proxmoxPriceEur * usdPerEur;
  const proxmoxAnnualUsd = totalSockets * proxmoxPriceUsd;

  // --- 3-Year ---
  // Broadcom escalation: +10% YoY when enabled
  const escalationFactor = includeEscalation ? 1 + 1.1 + 1.21 : 3;
  const vmware3Year = vmwareAnnual * escalationFactor;
  const proxmox3Year = proxmoxAnnualUsd * 3;

  // --- Savings ---
  const annualSavings = vmwareAnnual - proxmoxAnnualUsd;
  const annualSavingsPercent =
    vmwareAnnual > 0 ? (annualSavings / vmwareAnnual) * 100 : 0;
  const threeYearSavings = vmware3Year - proxmox3Year;
  const threeYearSavingsPercent =
    vmware3Year > 0 ? (threeYearSavings / vmware3Year) * 100 : 0;

  // Relative bar width: Proxmox bar proportional to VMware (max = 100%)
  const barProxmoxWidth =
    vmware3Year > 0
      ? Math.min(100, Math.round((proxmox3Year / vmware3Year) * 100))
      : 100;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(val);
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
          <div className="badge badge-cyan">Retorno de inversión</div>
          <h2 className="mb-4">Calculá el impacto de tu licenciamiento</h2>
          <p className="mx-auto" style={{ maxWidth: "650px" }}>
            Compare modeled VMware and Proxmox subscription costs based on your
            environment size. All estimates in USD.
          </p>
        </div>

        {/* ========== COMPARISON HEADER ========== */}
        <div className="cmp-header">
          <div className="cmp-header-badge vmware">
            <img src={vmwareLogo} alt="" className="cmp-logo-icon" />
            <span className="cmp-header-title">Entorno VMware actual</span>
            <span className="cmp-header-sub">Modelo de suscripción heredado</span>
          </div>
          <div className="cmp-header-arrow">
            <ArrowRight size={28} />
          </div>
          <div className="cmp-header-badge proxmox">
            <img src={proxmoxLogo} alt="" className="cmp-logo-icon" />
            <span className="cmp-header-title">Entorno destino Proxmox</span>
            <span className="cmp-header-sub">Modelo de infraestructura abierta</span>
          </div>
        </div>

        {/* ========== MAIN GRID ========== */}
        <div className="glass-card calc-container">
          {/* ========== LEFT PANEL: CURRENT VMWARE ENVIRONMENT ========== */}
          <div className="calc-inputs">
            {/* ---- Nivel de licencia VMware ---- */}
            <div className="slider-group">
              <span className="slider-label">
                <img src={vmwareLogo} alt="" className="cmp-label-logo" />
                Nivel de licencia VMware
              </span>
              <div className="radio-group">
                {(Object.keys(VMWARE_DEFAULTS) as VmwareTier[]).map((tier) => (
                  <button
                    key={tier}
                    onClick={() => setVmwareTier(tier)}
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
                  Precio por núcleo/año (USD):
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

            {/* ---- Tamaño del entorno ---- */}
            <div className="slider-group">
              <span className="slider-label">
                <Cpu size={16} className="cmp-input-icon" color="#6366f1" />
                Tamaño del entorno
              </span>

              {/* Servers */}
              <div className="slider-header">
                <span className="slider-sub-label">
                  <Server
                    size={13}
                    className="cmp-input-icon"
                    color="var(--text-dark)"
                  />
                  Servidores físicos / nodos
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
                  Sockets de CPU por servidor
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
                Núcleos por socket
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
                  <span>Sockets totales</span>
                  <strong>{totalSockets}</strong>
                </div>
                <div className="calc-summary-item">
                  <span>Núcleos licenciados</span>
                  <strong>{licensedCores}</strong>
                  {coresBumped && (
                    <span className="calc-note">
                      Se aplicó mínimo de 16 núcleos por CPU
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* ---- Contexto de cargas (now visible by default) ---- */}
            <div className="slider-group">
              <span className="slider-label">
                <Monitor size={16} className="cmp-input-icon" color="#a855f7" />
                Contexto de cargas
              </span>

              <div className="slider-header">
                <span className="slider-sub-label">Máquinas virtuales</span>
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
                <span className="slider-sub-label">Huella de almacenamiento</span>
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

            {/* ---- Opciones avanzadas ---- */}
            <button
              className="collapse-toggle"
              onClick={() => setShowOptions(!showOptions)}
            >
              <span>Opciones avanzadas</span>
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
                    Incluir estimaciones de escalada anual de Broadcom (+10% interanual)
                  </span>
                </label>
                <p className="fx-note" style={{ marginTop: "0.75rem" }}>
                  La conversión de FX es automática. Fuente actual: {" "}
                  {fxStatus === "live" ? "live feed" : "fallback rate"}.
                </p>
              </div>
            )}
          </div>

          {/* ========== RIGHT PANEL: TARGET PROXMOX COST MODEL ========== */}
          <div className="calc-results">
            {/* ---- Nivel de suscripción Proxmox ---- */}
            <div className="slider-group" style={{ marginBottom: "1.5rem" }}>
              <span className="slider-label">
                <img src={proxmoxLogo} alt="" className="cmp-label-logo" />
                Nivel de suscripción Proxmox
              </span>
              <div className="radio-group proxmox-radio-group">
                {(Object.keys(PROXMOX_DEFAULTS) as ProxmoxTier[]).map(
                  (tier) => (
                    <button
                      key={tier}
                      onClick={() => setProxmoxTier(tier)}
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
                Converted automatically to USD from a live FX feed, with a
                fixed fallback if the feed is unavailable.
              </p>
            </div>

            {/* ---- Hero Savings Card ---- */}
            <div className="cmp-savings-hero">
              <div className="cmp-savings-hero-label">
                <TrendingDown size={14} color="#4ade80" />
                AHORRO ESTIMADO
              </div>
              <div className="cmp-savings-hero-amount">
                {formatCurrency(Math.abs(threeYearSavings))}
              </div>
              <div className="cmp-savings-hero-sub">
                Delta de suscripción a 3 años
              </div>
              <div className="cmp-savings-hero-pct">
                <div
                  className="badge badge-cyan"
                  style={{ textTransform: "none" }}
                >
                  <Percent size={12} style={{ marginRight: "4px" }} />
                  {threeYearSavings >= 0 ? "Ahorro de " : "Aumento de costo de "}
                  {Math.abs(threeYearSavingsPercent).toFixed(1)}% on modeled
                  subscription costs
                </div>
              </div>

              {/* Annual delta inside hero */}
              <div className="cmp-savings-hero-annual">
                <Calendar size={14} />
                <span>{formatCurrency(annualSavings)} / año</span>
                <span className="cmp-annual-pct">
                  ({annualSavings >= 0 ? "-" : "+"}
                  {Math.abs(annualSavingsPercent).toFixed(1)}%)
                </span>
              </div>
            </div>

            {/* ---- Comparison Bars ---- */}
            <div className="cmp-savings-bar-section">
              <div className="cmp-savings-bar-label">
                Comparación de costos (3 años)
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
                  Ahorrás {formatCurrency(threeYearSavings)} en 3 años
                </div>
              )}
            </div>

            {/* ---- Breakdown ---- */}
            <div className="cmp-breakdown">
              <div className="cmp-breakdown-row vmware">
                <span className="cmp-br-label">Estimación VMware a 3 años</span>
                <span className="cmp-br-total">
                  {formatCurrency(vmware3Year)}
                </span>
                <span className="cmp-br-annual">
                  {formatCurrency(vmwareAnnual)}/yr
                </span>
              </div>
              <div className="cmp-breakdown-row proxmox">
                <span className="cmp-br-label">Estimación Proxmox a 3 años</span>
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
              <span>Ver supuestos</span>
              {showAssumptions ? (
                <ChevronUp size={12} />
              ) : (
                <ChevronDown size={12} />
              )}
            </button>
            {showAssumptions && (
              <div className="cmp-assumptions-content">
                <p>
                  <strong>Supuestos:</strong> VMware pricing is modeled from
                  public reference pricing and licensed core calculations
                  (16-core minimum per physical CPU for VCF/VVF). Proxmox
                  pricing reflects the selected subscription tier, total CPU
                  sockets, and automatic USD conversion.
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

