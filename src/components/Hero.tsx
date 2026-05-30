import { Shield, ArrowRight, Check, FileText } from "lucide-react";
import { assetSrc } from "../lib/assetSrc";
import vmwareLogo from "../../images/vmware.svg";
import proxmoxLogo from "../../images/proxmox.svg";

interface HeroProps {
  onOpenScanner: () => void;
}

export default function Hero({ onOpenScanner }: HeroProps) {
  const vmwareLogoSrc = assetSrc(vmwareLogo);
  const proxmoxLogoSrc = assetSrc(proxmoxLogo);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      className="section hero-section"
    >
      <div className="bg-mesh"></div>
      <div className="bg-grid"></div>
      <div
        className="glow-orb"
        style={{
          top: "20%",
          left: "10%",
          width: "400px",
          height: "400px",
          background: "rgba(99, 102, 241, 0.15)",
        }}
      ></div>
      <div
        className="glow-orb"
        style={{
          bottom: "10%",
          right: "5%",
          width: "350px",
          height: "350px",
          background: "rgba(6, 182, 212, 0.12)",
          animationDelay: "-5s",
        }}
      ></div>

      <div className="container">
        <div className="hero-grid">
          <div>
            <div className="badge badge-premium">
              <Shield size={13} className="shield-blink" />
              <span>
                Cognitive Advisory Copilot | 100% Agentless & Enterprise Verified
              </span>
            </div>
            <h1 className="hero-title">
              Not a parser. The first
              <br />
              AI-powered <span className="text-gradient">Senior Copilot</span>
              <br />
              for VMware exits.
            </h1>
            <div className="hero-description-group">
              <p className="text-muted">
                Go beyond basic calculators and scripts. Shift Evidence is a guided advisory engine
                that combines raw configuration evidence with smart contextual intake to simulate a
                principal architect review.
              </p>
              <p className="text-muted">
                Our platform provides fully storage-agnostic modeling, optimized for high-performance Ceph
                targets and compatible with SAN, NAS, or ZFS environments.
              </p>
            </div>
          </div>

          <div className="hero-visual">
            <svg
              className="migration-flow-svg"
              viewBox="0 0 600 400"
              xmlns="http://www.w3.org/2000/svg"
              style={{ overflow: "visible", width: "100%", maxWidth: "700px" }}
            >
              <defs>
                {/* Gradients */}
                <linearGradient
                  id="vmwareGrad"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#1d4ed8" />
                </linearGradient>
                <linearGradient
                  id="proxmoxGrad"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#ea580c" />
                  <stop offset="100%" stopColor="#ff781f" />
                </linearGradient>
                <linearGradient
                  id="shiftGrad"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#a855f7" />
                  <stop offset="50%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
                <linearGradient id="vmwareBg" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#080c18" />
                  <stop offset="100%" stopColor="#03050a" />
                </linearGradient>
                <linearGradient
                  id="proxmoxBg"
                  x1="0%"
                  y1="0%"
                  x2="0%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#140b06" />
                  <stop offset="100%" stopColor="#060302" />
                </linearGradient>
                <linearGradient
                  id="tunnelGrad"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop offset="0%" stopColor="rgba(239, 68, 68, 0.4)" />
                  <stop offset="45%" stopColor="rgba(139, 92, 246, 0.7)" />
                  <stop offset="55%" stopColor="rgba(139, 92, 246, 0.7)" />
                  <stop offset="100%" stopColor="rgba(16, 185, 129, 0.4)" />
                </linearGradient>
                <linearGradient
                  id="storageTopologyGrad"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop offset="0%" stopColor="rgba(249, 115, 22, 0.2)" />
                  <stop offset="45%" stopColor="rgba(16, 185, 129, 0.75)" />
                  <stop offset="100%" stopColor="rgba(34, 211, 238, 0.45)" />
                </linearGradient>
                <linearGradient
                  id="engineSweepGrad"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop offset="0%" stopColor="rgba(34, 211, 238, 0)" />
                  <stop offset="50%" stopColor="rgba(34, 211, 238, 0.9)" />
                  <stop offset="100%" stopColor="rgba(168, 85, 247, 0)" />
                </linearGradient>

                {/* Glow Filters */}
                <filter id="glow" x="-25%" y="-25%" width="150%" height="150%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <filter
                  id="strongGlow"
                  x="-40%"
                  y="-40%"
                  width="180%"
                  height="180%"
                >
                  <feGaussianBlur stdDeviation="8" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Grid Pattern in SVG Background */}
              <path
                d="M 0,0 L 600,0 M 0,50 L 600,50 M 0,100 L 600,100 M 0,150 L 600,150 M 0,200 L 600,200 M 0,250 L 600,250 M 0,300 L 600,300 M 0,350 L 600,350"
                stroke="rgba(255,255,255,0.015)"
                strokeWidth="1"
              />
              <path
                d="M 0,0 L 0,400 M 50,0 L 50,400 M 100,0 L 100,400 M 150,0 L 150,400 M 200,0 L 200,400 M 250,0 L 250,400 M 300,0 L 300,400 M 350,0 L 350,400 M 400,0 L 400,400 M 450,0 L 450,400 M 500,0 L 500,400 M 550,0 L 550,400"
                stroke="rgba(255,255,255,0.015)"
                strokeWidth="1"
              />

              {/* Conceptual layer labels */}
              <g opacity="0.76">
                <text
                  x="90"
                  y="48"
                  fill="rgba(96, 165, 250, 0.9)"
                  fontSize="7"
                  fontWeight="800"
                  textAnchor="middle"
                  letterSpacing="0.14em"
                >
                  SOURCE INFRASTRUCTURE
                </text>
                <text
                  x="300"
                  y="48"
                  fill="rgba(192, 132, 252, 0.95)"
                  fontSize="7"
                  fontWeight="800"
                  textAnchor="middle"
                  letterSpacing="0.14em"
                >
                  ASSESSMENT ENGINE
                </text>
                <text
                  x="510"
                  y="48"
                  fill="rgba(249, 115, 22, 0.92)"
                  fontSize="7"
                  fontWeight="800"
                  textAnchor="middle"
                  letterSpacing="0.14em"
                >
                  TARGET ARCHITECTURE
                </text>
              </g>

              {/* Intelligent transformation lanes */}

              {/* Lane 1: Database (Y: 234 -> 195 -> 234) */}
              <path
                d="M 90,234 C 180,234 220,195 300,195 C 380,195 420,234 510,234"
                fill="none"
                stroke="rgba(168, 85, 247, 0.12)"
                strokeWidth="5"
                strokeLinecap="round"
              />
              <path
                d="M 90,234 C 180,234 220,195 300,195 C 380,195 420,234 510,234"
                fill="none"
                stroke="rgba(255, 255, 255, 0.04)"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              {/* Database Lane active flow pulses */}
              <path
                d="M 90,234 C 180,234 220,195 300,195 C 380,195 420,234 510,234"
                fill="none"
                stroke="rgba(168, 85, 247, 0.5)"
                strokeWidth="1.5"
                strokeDasharray="8 30"
                strokeLinecap="round"
              >
                <animate
                  attributeName="stroke-dashoffset"
                  values="150;0"
                  dur="4s"
                  repeatCount="indefinite"
                />
              </path>

              {/* Lane 2: Compute / Web (Y: 178 -> 195 -> 178) */}
              <path
                d="M 90,178 C 180,178 220,195 300,195 C 380,195 420,178 510,178"
                fill="none"
                stroke="rgba(6, 182, 212, 0.12)"
                strokeWidth="5"
                strokeLinecap="round"
              />
              <path
                d="M 90,178 C 180,178 220,195 300,195 C 380,195 420,178 510,178"
                fill="none"
                stroke="rgba(255, 255, 255, 0.04)"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              {/* Compute Lane active flow pulses */}
              <path
                d="M 90,178 C 180,178 220,195 300,195 C 380,195 420,178 510,178"
                fill="none"
                stroke="rgba(6, 182, 212, 0.5)"
                strokeWidth="1.5"
                strokeDasharray="8 30"
                strokeLinecap="round"
              >
                <animate
                  attributeName="stroke-dashoffset"
                  values="150;0"
                  dur="3.5s"
                  repeatCount="indefinite"
                />
              </path>

              {/* Lane 3: Storage / Rollback loop (Y: 289 -> 195 -> loops back to 289) */}
              <path
                d="M 90,289 C 180,289 220,195 300,195 C 220,195 200,340 90,289"
                fill="none"
                stroke="rgba(239, 68, 68, 0.08)"
                strokeWidth="5"
                strokeLinecap="round"
              />
              <path
                d="M 90,289 C 180,289 220,195 300,195 C 220,195 200,340 90,289"
                fill="none"
                stroke="rgba(255, 255, 255, 0.03)"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              {/* Rollback Lane active flow pulses */}
              <path
                d="M 90,289 C 180,289 220,195 300,195 C 220,195 200,340 90,289"
                fill="none"
                stroke="rgba(239, 68, 68, 0.4)"
                strokeWidth="1.5"
                strokeDasharray="8 30"
                strokeLinecap="round"
              >
                <animate
                  attributeName="stroke-dashoffset"
                  values="200;0"
                  dur="5s"
                  repeatCount="indefinite"
                />
              </path>

              {/* Branching validation paths for dependency and topology analysis */}
              <g opacity="0.78">
                <path
                  d="M 155,126 C 214,108 236,130 300,158 C 364,130 388,108 445,126"
                  fill="none"
                  stroke="rgba(34, 211, 238, 0.18)"
                  strokeWidth="1.1"
                  strokeDasharray="2 8"
                  strokeLinecap="round"
                >
                  <animate attributeName="stroke-dashoffset" values="60;0" dur="6s" repeatCount="indefinite" />
                </path>
                <path
                  d="M 154,250 C 214,270 236,248 300,232 C 364,248 388,270 446,250"
                  fill="none"
                  stroke="rgba(16, 185, 129, 0.18)"
                  strokeWidth="1.1"
                  strokeDasharray="2 9"
                  strokeLinecap="round"
                >
                  <animate attributeName="stroke-dashoffset" values="0;66" dur="7s" repeatCount="indefinite" />
                </path>
                {[0, 1, 2].map((idx) => (
                  <circle key={`route-packet-${idx}`} r="2.2" fill={idx === 1 ? "#10b981" : "#22d3ee"} filter="url(#glow)">
                    <animateMotion
                      path={
                        idx === 0
                          ? "M 155,126 C 214,108 236,130 300,158 C 364,130 388,108 445,126"
                          : idx === 1
                            ? "M 154,250 C 214,270 236,248 300,232 C 364,248 388,270 446,250"
                            : "M 90,178 C 180,178 220,195 300,195 C 380,195 420,178 510,178"
                      }
                      dur={`${5.8 + idx * 0.7}s`}
                      begin={`${idx * 0.9}s`}
                      repeatCount="indefinite"
                    />
                  </circle>
                ))}
              </g>

              {/* VMware Source Rack Enclosure (X: 10, Y: 65, W: 160, H: 260) */}
              <g transform="translate(10, 65)">
                {/* Outer Enclosure with double border and glow */}
                <rect
                  x="0"
                  y="0"
                  width="160"
                  height="260"
                  rx="12"
                  fill="url(#vmwareBg)"
                  stroke="#1d4ed8"
                  strokeWidth="2"
                />
                <rect
                  x="0"
                  y="0"
                  width="160"
                  height="260"
                  rx="12"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="1"
                  opacity="0.3"
                  filter="url(#glow)"
                />

                {/* Vertical Side Rails with mount holes */}
                <line
                  x1="6"
                  y1="0"
                  x2="6"
                  y2="260"
                  stroke="rgba(255,255,255,0.12)"
                  strokeWidth="1.5"
                />
                <line
                  x1="154"
                  y1="0"
                  x2="154"
                  y2="260"
                  stroke="rgba(255,255,255,0.12)"
                  strokeWidth="1.5"
                />
                <line
                  x1="6"
                  y1="0"
                  x2="6"
                  y2="260"
                  stroke="rgba(255,255,255,0.3)"
                  strokeWidth="1.5"
                  strokeDasharray="1 8"
                />
                <line
                  x1="154"
                  y1="0"
                  x2="154"
                  y2="260"
                  stroke="rgba(255,255,255,0.3)"
                  strokeWidth="1.5"
                  strokeDasharray="1 8"
                />

                {/* Header Title & Status */}
                <g transform="translate(80, 20)">
                  <text
                    x="0"
                    y="0"
                    fill="#60a5fa"
                    fontSize="10"
                    fontWeight="800"
                    textAnchor="middle"
                    letterSpacing="0.08em"
                  >
                    VMWARE vSPHERE
                  </text>
                  <text
                    x="0"
                    y="9"
                    fill="#ef4444"
                    fontSize="6.5"
                    fontWeight="600"
                    textAnchor="middle"
                    letterSpacing="0.05em"
                  >
                    LEGACY INFRASTRUCTURE
                  </text>
                  <image
                    href={vmwareLogoSrc}
                    x="-67"
                    y="-10"
                    width="11"
                    height="11"
                    opacity="1"
                  >
                    <animate
                      attributeName="opacity"
                      values="1;0.35;1"
                      dur="1.5s"
                      repeatCount="indefinite"
                    />
                  </image>
                </g>

                {/* Bay 1: Network (Y: 36) */}
                <g transform="translate(12, 36)">
                  <rect
                    x="0"
                    y="0"
                    width="136"
                    height="46"
                    rx="4"
                    fill="#05070e"
                    stroke="rgba(59, 130, 246, 0.25)"
                    strokeWidth="1"
                  />
                  <text
                    x="8"
                    y="10"
                    fill="rgba(255, 255, 255, 0.4)"
                    fontSize="6"
                    fontWeight="bold"
                  >
                    BAY 01 | NETWORK + DEPENDENCIES
                  </text>

                  {/* Ports */}
                  <g transform="translate(8, 16)">
                    {Array.from({ length: 8 }).map((_, idx) => (
                      <g key={idx} transform={`translate(${idx * 15}, 0)`}>
                        <rect
                          x="0"
                          y="0"
                          width="10"
                          height="9"
                          rx="1.5"
                          fill="#111827"
                          stroke="rgba(59, 130, 246, 0.4)"
                          strokeWidth="0.8"
                        />
                        {/* Port lights */}
                        <circle
                          cx="5"
                          cy="-2.5"
                          r="1"
                          fill={idx % 3 === 0 ? "#ef4444" : "#f59e0b"}
                        >
                          <animate
                            attributeName="opacity"
                            values="1;0.2;1"
                            dur={`${1 + (idx % 3) * 0.4}s`}
                            repeatCount="indefinite"
                          />
                        </circle>
                      </g>
                    ))}
                  </g>
                  {/* Legacy wiring visualization */}
                  <path
                    d="M 18,25 C 25,38 45,38 52,25 M 63,25 C 70,38 90,38 97,25"
                    fill="none"
                    stroke="rgba(239, 68, 68, 0.35)"
                    strokeWidth="1"
                  />
                </g>

                {/* Bay 2: Compute (Y: 88) */}
                <g transform="translate(12, 88)">
                  <rect
                    x="0"
                    y="0"
                    width="136"
                    height="50"
                    rx="4"
                    fill="#05070e"
                    stroke="rgba(59, 130, 246, 0.25)"
                    strokeWidth="1"
                  />
                  <text
                    x="8"
                    y="10"
                    fill="rgba(255, 255, 255, 0.4)"
                    fontSize="6"
                    fontWeight="bold"
                  >
                    BAY 02 | ESXi COMPUTE NODES
                  </text>

                  {/* Node 1 */}
                  <g transform="translate(8, 14)">
                    <rect
                      x="0"
                      y="0"
                      width="120"
                      height="13"
                      rx="2"
                      fill="#0a0f1d"
                      stroke="rgba(59, 130, 246, 0.15)"
                      strokeWidth="0.8"
                    />
                    <circle cx="8" cy="6.5" r="2" fill="#ef4444" />
                    <rect
                      x="22"
                      y="5"
                      width="40"
                      height="3"
                      rx="1"
                      fill="#1e293b"
                    />
                    <rect
                      x="22"
                      y="5"
                      width="34"
                      height="3"
                      rx="1"
                      fill="#ef4444"
                    />{" "}
                    {/* 85% Load */}
                    {/* Rotating fan */}
                    <g transform="translate(108, 6.5)">
                      <circle
                        r="4.5"
                        fill="none"
                        stroke="rgba(255, 255, 255, 0.1)"
                        strokeWidth="0.8"
                      />
                      <path
                        d="M -3.5,0 L 3.5,0 M 0,-3.5 L 0,3.5"
                        stroke="rgba(239, 68, 68, 0.5)"
                        strokeWidth="1"
                        strokeLinecap="round"
                      >
                        <animateTransform
                          attributeName="transform"
                          type="rotate"
                          from="0"
                          to="360"
                          dur="1.2s"
                          repeatCount="indefinite"
                        />
                      </path>
                    </g>
                  </g>

                  {/* Node 2 */}
                  <g transform="translate(8, 31)">
                    <rect
                      x="0"
                      y="0"
                      width="120"
                      height="13"
                      rx="2"
                      fill="#0a0f1d"
                      stroke="rgba(59, 130, 246, 0.15)"
                      strokeWidth="0.8"
                    />
                    <circle cx="8" cy="6.5" r="2" fill="#f59e0b" />
                    <rect
                      x="22"
                      y="5"
                      width="40"
                      height="3"
                      rx="1"
                      fill="#1e293b"
                    />
                    <rect
                      x="22"
                      y="5"
                      width="28"
                      height="3"
                      rx="1"
                      fill="#f59e0b"
                    />{" "}
                    {/* 70% Load */}
                    {/* Rotating fan */}
                    <g transform="translate(108, 6.5)">
                      <circle
                        r="4.5"
                        fill="none"
                        stroke="rgba(255, 255, 255, 0.1)"
                        strokeWidth="0.8"
                      />
                      <path
                        d="M -3.5,0 L 3.5,0 M 0,-3.5 L 0,3.5"
                        stroke="rgba(255, 255, 255, 0.3)"
                        strokeWidth="1"
                        strokeLinecap="round"
                      >
                        <animateTransform
                          attributeName="transform"
                          type="rotate"
                          from="0"
                          to="360"
                          dur="1.8s"
                          repeatCount="indefinite"
                        />
                      </path>
                    </g>
                  </g>
                </g>

                {/* Bay 3: Databases / BBDD (Y: 144) */}
                <g transform="translate(12, 144)">
                  <rect
                    x="0"
                    y="0"
                    width="136"
                    height="50"
                    rx="4"
                    fill="#05070e"
                    stroke="rgba(59, 130, 246, 0.25)"
                    strokeWidth="1"
                  />
                  <text
                    x="8"
                    y="10"
                    fill="rgba(255, 255, 255, 0.4)"
                    fontSize="6"
                    fontWeight="bold"
                  >
                    BAY 03 | WORKLOADS + DATASTORES
                  </text>

                  {/* DB Cylinder 1 */}
                  <g transform="translate(25, 26)">
                    <ellipse
                      cx="0"
                      cy="-8"
                      rx="8"
                      ry="2.2"
                      fill="#1e293b"
                      stroke="#f87171"
                      strokeWidth="0.8"
                    />
                    <path
                      d="M -8,-8 v 10 c 0,1.2 3.5,2.2 8,2.2 s 8,-1 8,-2.2 v -10"
                      fill="#0f172a"
                      stroke="#f87171"
                      strokeWidth="0.8"
                    />
                    <line
                      x1="-8"
                      y1="-3"
                      x2="8"
                      y2="-3"
                      stroke="rgba(248, 113, 113, 0.5)"
                      strokeWidth="0.6"
                    />
                    <line
                      x1="-8"
                      y1="1"
                      x2="8"
                      y2="1"
                      stroke="rgba(248, 113, 113, 0.5)"
                      strokeWidth="0.6"
                    />
                    <circle cx="0" cy="5" r="1.2" fill="#ef4444" />
                  </g>

                  {/* DB Cylinder 2 */}
                  <g transform="translate(70, 26)">
                    <ellipse
                      cx="0"
                      cy="-8"
                      rx="8"
                      ry="2.2"
                      fill="#1e293b"
                      stroke="#94a3b8"
                      strokeWidth="0.8"
                    />
                    <path
                      d="M -8,-8 v 10 c 0,1.2 3.5,2.2 8,2.2 s 8,-1 8,-2.2 v -10"
                      fill="#0f172a"
                      stroke="#94a3b8"
                      strokeWidth="0.8"
                    />
                    <line
                      x1="-8"
                      y1="-3"
                      x2="8"
                      y2="-3"
                      stroke="rgba(255, 255, 255, 0.2)"
                      strokeWidth="0.6"
                    />
                    <line
                      x1="-8"
                      y1="1"
                      x2="8"
                      y2="1"
                      stroke="rgba(255, 255, 255, 0.2)"
                      strokeWidth="0.6"
                    />
                    <circle cx="0" cy="5" r="1.2" fill="#94a3b8" />
                  </g>

                  {/* DB Cylinder 3 */}
                  <g transform="translate(111, 26)">
                    <ellipse
                      cx="0"
                      cy="-8"
                      rx="8"
                      ry="2.2"
                      fill="#1e293b"
                      stroke="#f87171"
                      strokeWidth="0.8"
                    />
                    <path
                      d="M -8,-8 v 10 c 0,1.2 3.5,2.2 8,2.2 s 8,-1 8,-2.2 v -10"
                      fill="#0f172a"
                      stroke="#f87171"
                      strokeWidth="0.8"
                    />
                    <line
                      x1="-8"
                      y1="-3"
                      x2="8"
                      y2="-3"
                      stroke="rgba(248, 113, 113, 0.5)"
                      strokeWidth="0.6"
                    />
                    <line
                      x1="-8"
                      y1="1"
                      x2="8"
                      y2="1"
                      stroke="rgba(248, 113, 113, 0.5)"
                      strokeWidth="0.6"
                    />
                    <circle cx="0" cy="5" r="1.2" fill="#ef4444" />
                  </g>
                </g>

                {/* Bay 4: Storage (Y: 200) */}
                <g transform="translate(12, 200)">
                  <rect
                    x="0"
                    y="0"
                    width="136"
                    height="48"
                    rx="4"
                    fill="#05070e"
                    stroke="rgba(59, 130, 246, 0.25)"
                    strokeWidth="1"
                  />
                  <text
                    x="8"
                    y="10"
                    fill="rgba(255, 255, 255, 0.4)"
                    fontSize="6"
                    fontWeight="bold"
                  >
                    BAY 04 | LEGACY STORAGE TOPOLOGY
                  </text>

                  {/* Legacy disks */}
                  <g transform="translate(8, 14)">
                    {Array.from({ length: 4 }).map((_, idx) => (
                      <g key={idx} transform={`translate(${idx * 30}, 0)`}>
                        <rect
                          x="0"
                          y="0"
                          width="24"
                          height="24"
                          rx="2"
                          fill="#0c1226"
                          stroke="rgba(59, 130, 246, 0.2)"
                          strokeWidth="0.8"
                        />
                        <line
                          x1="4"
                          y1="6"
                          x2="20"
                          y2="6"
                          stroke="rgba(239, 68, 68, 0.4)"
                          strokeWidth="1"
                        />
                        <line
                          x1="4"
                          y1="12"
                          x2="20"
                          y2="12"
                          stroke="rgba(255,255,255,0.15)"
                          strokeWidth="1"
                        />
                        <line
                          x1="4"
                          y1="18"
                          x2="20"
                          y2="18"
                          stroke="rgba(255,255,255,0.15)"
                          strokeWidth="1"
                        />
                        <circle cx="18" cy="18" r="1.5" fill="#ef4444">
                          <animate
                            attributeName="opacity"
                            values="1;0.3;1"
                            dur={`${0.8 + idx * 0.3}s`}
                            repeatCount="indefinite"
                          />
                        </circle>
                      </g>
                    ))}
                  </g>
                </g>

                {/* Source telemetry and dependency traces */}
                <g opacity="0.92">
                  <rect
                    x="28"
                    y="28"
                    width="104"
                    height="9"
                    rx="4.5"
                    fill="rgba(15, 23, 42, 0.72)"
                    stroke="rgba(96, 165, 250, 0.28)"
                    strokeWidth="0.7"
                  />
                  <text
                    x="80"
                    y="35"
                    fill="rgba(147, 197, 253, 0.86)"
                    fontSize="5.4"
                    fontWeight="800"
                    textAnchor="middle"
                    letterSpacing="0.08em"
                  >
                    vCENTER INVENTORY
                  </text>
                  <path
                    d="M 80,37 V 82 M 80,138 V 144 M 80,194 V 200"
                    fill="none"
                    stroke="rgba(34, 211, 238, 0.3)"
                    strokeWidth="0.8"
                    strokeDasharray="2 5"
                  >
                    <animate attributeName="stroke-dashoffset" values="0;-28" dur="4.8s" repeatCount="indefinite" />
                  </path>
                  <path
                    d="M 25,74 C 52,91 104,91 134,74 M 28,186 C 62,171 98,171 132,186"
                    fill="none"
                    stroke="rgba(239, 68, 68, 0.25)"
                    strokeWidth="0.8"
                    strokeDasharray="3 7"
                    strokeLinecap="round"
                  >
                    <animate attributeName="stroke-dashoffset" values="44;0" dur="5.5s" repeatCount="indefinite" />
                  </path>
                  {[
                    { x: 136, y: 78, label: "CPU" },
                    { x: 132, y: 132, label: "RAM" },
                    { x: 134, y: 191, label: "IO" },
                  ].map((alert, idx) => (
                    <g key={`source-alert-${alert.label}`} transform={`translate(${alert.x}, ${alert.y})`}>
                      <path d="M 0,-4 L 4,4 H -4 Z" fill="rgba(239, 68, 68, 0.16)" stroke="#ef4444" strokeWidth="0.7">
                        <animate attributeName="opacity" values="0.45;1;0.45" dur={`${1.4 + idx * 0.35}s`} repeatCount="indefinite" />
                      </path>
                      <text x="-7" y="12" fill="rgba(248, 113, 113, 0.65)" fontSize="4.3" fontWeight="800">
                        {alert.label}
                      </text>
                    </g>
                  ))}
                </g>
              </g>

              {/* Proxmox Target Rack Enclosure (X: 430, Y: 65, W: 160, H: 260) */}
              <g transform="translate(430, 65)">
                {/* Outer Enclosure with orange border and glow */}
                <rect
                  x="0"
                  y="0"
                  width="160"
                  height="260"
                  rx="12"
                  fill="url(#proxmoxBg)"
                  stroke="#ea580c"
                  strokeWidth="2"
                />
                <rect
                  x="0"
                  y="0"
                  width="160"
                  height="260"
                  rx="12"
                  fill="none"
                  stroke="#ff781f"
                  strokeWidth="1"
                  opacity="0.3"
                  filter="url(#glow)"
                />

                {/* Vertical Side Rails with mount holes */}
                <line
                  x1="6"
                  y1="0"
                  x2="6"
                  y2="260"
                  stroke="rgba(255,255,255,0.12)"
                  strokeWidth="1.5"
                />
                <line
                  x1="154"
                  y1="0"
                  x2="154"
                  y2="260"
                  stroke="rgba(255,255,255,0.12)"
                  strokeWidth="1.5"
                />
                <line
                  x1="6"
                  y1="0"
                  x2="6"
                  y2="260"
                  stroke="rgba(255,255,255,0.3)"
                  strokeWidth="1.5"
                  strokeDasharray="1 8"
                />
                <line
                  x1="154"
                  y1="0"
                  x2="154"
                  y2="260"
                  stroke="rgba(255,255,255,0.3)"
                  strokeWidth="1.5"
                  strokeDasharray="1 8"
                />

                {/* Header Title with Proxmox Chevron Logo & Status */}
                <g transform="translate(80, 20)">
                  <image
                    href={proxmoxLogoSrc}
                    x="-70"
                    y="-6"
                    width="10"
                    height="10"
                    opacity="1"
                  >
                    <animate
                      attributeName="opacity"
                      values="1;0.35;1"
                      dur="1s"
                      repeatCount="indefinite"
                    />
                  </image>

                  <text
                    x="6"
                    y="0"
                    fill="#f97316"
                    fontSize="10"
                    fontWeight="800"
                    textAnchor="middle"
                    letterSpacing="0.08em"
                  >
                    PROXMOX VE
                  </text>
                  <text
                    x="6"
                    y="9"
                    fill="#10b981"
                    fontSize="6.5"
                    fontWeight="600"
                    textAnchor="middle"
                    letterSpacing="0.05em"
                  >
                    TARGET ARCHITECTURE
                  </text>
                </g>

                {/* Bay 1: Network (Y: 36) */}
                <g transform="translate(12, 36)">
                  <rect
                    x="0"
                    y="0"
                    width="136"
                    height="46"
                    rx="4"
                    fill="#090605"
                    stroke="rgba(234, 88, 12, 0.25)"
                    strokeWidth="1"
                  />
                  <text
                    x="8"
                    y="10"
                    fill="rgba(255, 255, 255, 0.4)"
                    fontSize="6"
                    fontWeight="bold"
                  >
                    BAY 01 | NETWORK FABRIC
                  </text>

                  {/* Ports */}
                  <g transform="translate(8, 16)">
                    {Array.from({ length: 8 }).map((_, idx) => (
                      <g key={idx} transform={`translate(${idx * 15}, 0)`}>
                        <rect
                          x="0"
                          y="0"
                          width="10"
                          height="9"
                          rx="1.5"
                          fill="#111827"
                          stroke="rgba(234, 88, 12, 0.4)"
                          strokeWidth="0.8"
                        />
                        {/* Port lights - Green for active SDN */}
                        <circle cx="5" cy="-2.5" r="1" fill="#10b981">
                          <animate
                            attributeName="opacity"
                            values="1;0.2;1"
                            dur={`${0.6 + (idx % 2) * 0.3}s`}
                            repeatCount="indefinite"
                          />
                        </circle>
                      </g>
                    ))}
                  </g>
                  {/* SDN active link animation */}
                  <path
                    d="M 12,28 L 124,28"
                    stroke="rgba(16, 185, 129, 0.3)"
                    strokeWidth="1.2"
                    strokeDasharray="4 8"
                  >
                    <animate
                      attributeName="stroke-dashoffset"
                      values="12;0"
                      dur="1.5s"
                      repeatCount="indefinite"
                    />
                  </path>
                </g>

                {/* Bay 2: Compute (Y: 88) */}
                <g transform="translate(12, 88)">
                  <rect
                    x="0"
                    y="0"
                    width="136"
                    height="50"
                    rx="4"
                    fill="#090605"
                    stroke="rgba(234, 88, 12, 0.25)"
                    strokeWidth="1"
                  />
                  <text
                    x="8"
                    y="10"
                    fill="rgba(255, 255, 255, 0.4)"
                    fontSize="6"
                    fontWeight="bold"
                  >
                    BAY 02 | COMPUTE LAYER (KVM / LXC)
                  </text>

                  {/* Node 1 */}
                  <g transform="translate(8, 14)">
                    <rect
                      x="0"
                      y="0"
                      width="120"
                      height="13"
                      rx="2"
                      fill="#100b08"
                      stroke="rgba(234, 88, 12, 0.15)"
                      strokeWidth="0.8"
                    />
                    <circle cx="8" cy="6.5" r="2" fill="#10b981" />
                    <rect
                      x="22"
                      y="5"
                      width="40"
                      height="3"
                      rx="1"
                      fill="#1e293b"
                    />
                    <rect
                      x="22"
                      y="5"
                      width="18"
                      height="3"
                      rx="1"
                      fill="#10b981"
                    />{" "}
                    {/* 45% Load - Optimized */}
                    {/* Rotating fan */}
                    <g transform="translate(108, 6.5)">
                      <circle
                        r="4.5"
                        fill="none"
                        stroke="rgba(255, 255, 255, 0.1)"
                        strokeWidth="0.8"
                      />
                      <path
                        d="M -3.5,0 L 3.5,0 M 0,-3.5 L 0,3.5"
                        stroke="rgba(16, 185, 129, 0.6)"
                        strokeWidth="1"
                        strokeLinecap="round"
                      >
                        <animateTransform
                          attributeName="transform"
                          type="rotate"
                          from="0"
                          to="360"
                          dur="2s"
                          repeatCount="indefinite"
                        />
                      </path>
                    </g>
                  </g>

                  {/* Node 2 */}
                  <g transform="translate(8, 31)">
                    <rect
                      x="0"
                      y="0"
                      width="120"
                      height="13"
                      rx="2"
                      fill="#100b08"
                      stroke="rgba(234, 88, 12, 0.15)"
                      strokeWidth="0.8"
                    />
                    <circle cx="8" cy="6.5" r="2" fill="#10b981" />
                    <rect
                      x="22"
                      y="5"
                      width="40"
                      height="3"
                      rx="1"
                      fill="#1e293b"
                    />
                    <rect
                      x="22"
                      y="5"
                      width="12"
                      height="3"
                      rx="1"
                      fill="#10b981"
                    />{" "}
                    {/* 30% Load */}
                    {/* Rotating fan */}
                    <g transform="translate(108, 6.5)">
                      <circle
                        r="4.5"
                        fill="none"
                        stroke="rgba(255, 255, 255, 0.1)"
                        strokeWidth="0.8"
                      />
                      <path
                        d="M -3.5,0 L 3.5,0 M 0,-3.5 L 0,3.5"
                        stroke="rgba(16, 185, 129, 0.6)"
                        strokeWidth="1"
                        strokeLinecap="round"
                      >
                        <animateTransform
                          attributeName="transform"
                          type="rotate"
                          from="0"
                          to="360"
                          dur="2.5s"
                          repeatCount="indefinite"
                        />
                      </path>
                    </g>
                  </g>
                </g>

                {/* Bay 3: Databases / BBDD (Y: 144) */}
                <g transform="translate(12, 144)">
                  <rect
                    x="0"
                    y="0"
                    width="136"
                    height="50"
                    rx="4"
                    fill="#090605"
                    stroke="rgba(234, 88, 12, 0.25)"
                    strokeWidth="1"
                  />
                  <text
                    x="8"
                    y="10"
                    fill="rgba(255, 255, 255, 0.4)"
                    fontSize="6"
                    fontWeight="bold"
                  >
                    BAY 03 | WORKLOAD LAYER (OPTIMIZED)
                  </text>

                  {/* Optimized DB Container 1 */}
                  <g transform="translate(25, 26)">
                    <rect
                      x="-10"
                      y="-12"
                      width="20"
                      height="20"
                      rx="3"
                      fill="#0c1817"
                      stroke="#10b981"
                      strokeWidth="1.2"
                    />
                    <path
                      d="M -6,-6 h 12 M -6,-2 h 12 M -6,2 h 6"
                      stroke="rgba(16, 185, 129, 0.5)"
                      strokeWidth="0.8"
                    />
                    <circle cx="5" cy="2" r="1.5" fill="#10b981">
                      <animate
                        attributeName="opacity"
                        values="1;0.3;1"
                        dur="1.2s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  </g>

                  {/* Optimized DB Container 2 */}
                  <g transform="translate(70, 26)">
                    <rect
                      x="-10"
                      y="-12"
                      width="20"
                      height="20"
                      rx="3"
                      fill="#0c1817"
                      stroke="#10b981"
                      strokeWidth="1.2"
                    />
                    <path
                      d="M -6,-6 h 12 M -6,-2 h 12 M -6,2 h 6"
                      stroke="rgba(16, 185, 129, 0.5)"
                      strokeWidth="0.8"
                    />
                    <circle cx="5" cy="2" r="1.5" fill="#10b981">
                      <animate
                        attributeName="opacity"
                        values="0.3;1;0.3"
                        dur="1s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  </g>

                  {/* Optimized DB Container 3 */}
                  <g transform="translate(111, 26)">
                    <rect
                      x="-10"
                      y="-12"
                      width="20"
                      height="20"
                      rx="3"
                      fill="#0c1817"
                      stroke="#10b981"
                      strokeWidth="1.2"
                    />
                    <path
                      d="M -6,-6 h 12 M -6,-2 h 12 M -6,2 h 6"
                      stroke="rgba(16, 185, 129, 0.5)"
                      strokeWidth="0.8"
                    />
                    <circle cx="5" cy="2" r="1.5" fill="#10b981">
                      <animate
                        attributeName="opacity"
                        values="1;0.3;1"
                        dur="1.5s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  </g>
                </g>

                {/* Bay 4: Storage (Y: 200) */}
                <g transform="translate(12, 200)">
                  <rect
                    x="0"
                    y="0"
                    width="136"
                    height="48"
                    rx="4"
                    fill="#090605"
                    stroke="rgba(234, 88, 12, 0.25)"
                    strokeWidth="1"
                  />
                  <text
                    x="8"
                    y="10"
                    fill="rgba(255, 255, 255, 0.4)"
                    fontSize="6"
                    fontWeight="bold"
                  >
                    BAY 04 | CEPH CLUSTERED RING + PBS
                  </text>

                  {/* Clustered Ceph Storage Replication Ring */}
                  <g transform="translate(0, 0)">
                    {/* Ring Connection Lines */}
                    <path
                      d="M 68,14 L 44,27 L 92,27 Z"
                      fill="none"
                      stroke="rgba(16, 185, 129, 0.4)"
                      strokeWidth="1"
                      strokeDasharray="3 3"
                    >
                      <animate
                        attributeName="stroke-dashoffset"
                        values="30;0"
                        dur="3s"
                        repeatCount="indefinite"
                      />
                    </path>

                    {/* PBS Backup Target Connector */}
                    <path
                      d="M 68,27 V 37"
                      fill="none"
                      stroke="rgba(16, 185, 129, 0.5)"
                      strokeWidth="0.8"
                      strokeDasharray="2 2"
                    />

                    {/* OSD Nodes */}
                    {[
                      { x: 68, y: 14, label: "OSD-01" },
                      { x: 44, y: 27, label: "OSD-02" },
                      { x: 92, y: 27, label: "OSD-03" },
                    ].map((node, idx) => (
                      <g key={`ceph-node-${node.label}`} transform={`translate(${node.x}, ${node.y})`}>
                        <circle
                          r="4.2"
                          fill="rgba(16, 185, 129, 0.12)"
                          stroke="#10b981"
                          strokeWidth="1.2"
                          filter="url(#glow)"
                        >
                          <animate
                            attributeName="r"
                            values="3.8;4.8;3.8"
                            dur={`${2 + idx * 0.3}s`}
                            repeatCount="indefinite"
                          />
                        </circle>
                        <circle r="1.2" fill="#34d399">
                          <animate
                            attributeName="opacity"
                            values="0.4;1;0.4"
                            dur={`${1 + idx * 0.2}s`}
                            repeatCount="indefinite"
                          />
                        </circle>
                        <text
                          x="0"
                          y={node.y === 14 ? "-7" : "10"}
                          fill="rgba(226, 232, 240, 0.72)"
                          fontSize="3.8"
                          fontWeight="800"
                          textAnchor="middle"
                        >
                          {node.label}
                        </text>
                      </g>
                    ))}

                    {/* PBS Backup target block */}
                    <g transform="translate(53, 37)">
                      <rect
                        x="0"
                        y="0"
                        width="30"
                        height="7"
                        rx="1.5"
                        fill="#0c1814"
                        stroke="#10b981"
                        strokeWidth="0.8"
                      />
                      <text
                        x="15"
                        y="5"
                        fill="#10b981"
                        fontSize="4"
                        fontWeight="900"
                        textAnchor="middle"
                        letterSpacing="0.05em"
                      >
                        PBS TARGET
                      </text>
                    </g>
                  </g>
                </g>

                {/* Target architecture health and routing overlay */}
                <g opacity="0.9">
                  <path
                    d="M 24,82 C 60,112 100,112 136,82 M 25,190 C 58,176 102,176 136,190"
                    fill="none"
                    stroke="rgba(16, 185, 129, 0.26)"
                    strokeWidth="0.9"
                    strokeDasharray="3 7"
                    strokeLinecap="round"
                  >
                    <animate attributeName="stroke-dashoffset" values="0;-44" dur="5.6s" repeatCount="indefinite" />
                  </path>
                  <rect
                    x="25"
                    y="28"
                    width="110"
                    height="9"
                    rx="4.5"
                    fill="rgba(6, 18, 15, 0.76)"
                    stroke="rgba(16, 185, 129, 0.28)"
                    strokeWidth="0.7"
                  />
                  <text
                    x="80"
                    y="35"
                    fill="rgba(52, 211, 153, 0.9)"
                    fontSize="5.2"
                    fontWeight="900"
                    textAnchor="middle"
                    letterSpacing="0.1em"
                  >
                    HA READY | BALANCED
                  </text>
                  {[
                    { x: 135, y: 74 },
                    { x: 134, y: 130 },
                    { x: 135, y: 191 },
                  ].map((point, idx) => (
                    <g key={`target-validated-${idx}`} transform={`translate(${point.x}, ${point.y})`}>
                      <circle r="4.4" fill="rgba(16, 185, 129, 0.08)" stroke="#10b981" strokeWidth="0.8">
                        <animate attributeName="opacity" values="0.45;1;0.45" dur={`${1.8 + idx * 0.35}s`} repeatCount="indefinite" />
                      </circle>
                      <path d="M -2,0.2 L -0.4,2 L 2.6,-2" fill="none" stroke="#10b981" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" />
                    </g>
                  ))}
                </g>
              </g>

              {/* Shift Evidence Assessment & Verification Engine */}
              <g transform="translate(300, 195)">
                <g transform="scale(1.1)">
                {/* Outer Scanning Radar Waves */}
                <circle
                  cx="0"
                  cy="0"
                  r="66"
                  fill="none"
                  stroke="url(#shiftGrad)"
                  strokeWidth="3"
                  opacity="0.3"
                >
                  <animate
                    attributeName="r"
                    values="66;101"
                    dur="2.4s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.6;0"
                    dur="2.4s"
                    repeatCount="indefinite"
                  />
                </circle>
                <circle
                  cx="0"
                  cy="0"
                  r="66"
                  fill="none"
                  stroke="#22d3ee"
                  strokeWidth="1.5"
                  opacity="0.2"
                >
                  <animate
                    attributeName="r"
                    values="66;119"
                    dur="3.6s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.4;0"
                    dur="3.6s"
                    repeatCount="indefinite"
                  />
                </circle>

                {/* Rotating Digital Dials */}
                <circle
                  cx="0"
                  cy="0"
                  r="78"
                  fill="none"
                  stroke="url(#shiftGrad)"
                  strokeWidth="1"
                  strokeDasharray="12 8 20 6"
                  opacity="0.65"
                >
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from="0"
                    to="360"
                    dur="14s"
                    repeatCount="indefinite"
                  />
                </circle>
                <circle
                  cx="0"
                  cy="0"
                  r="86"
                  fill="none"
                  stroke="#22d3ee"
                  strokeWidth="0.8"
                  strokeDasharray="6 12 18 8"
                  opacity="0.5"
                >
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from="360"
                    to="0"
                    dur="10s"
                    repeatCount="indefinite"
                  />
                </circle>

                {/* Orbital validation nodes */}
                <g opacity="0.9">
                  {[
                    { x: -74, y: -28, c: "#22d3ee" },
                    { x: 74, y: -28, c: "#a855f7" },
                    { x: -78, y: 30, c: "#10b981" },
                    { x: 78, y: 30, c: "#10b981" },
                  ].map((node, idx) => (
                    <g key={`engine-orbit-${idx}`} transform={`translate(${node.x}, ${node.y})`}>
                      <circle r="5.8" fill="rgba(8, 12, 30, 0.88)" stroke={node.c} strokeWidth="0.9" filter="url(#glow)">
                        <animate attributeName="r" values="5;6.2;5" dur={`${3 + idx * 0.4}s`} repeatCount="indefinite" />
                      </circle>
                      <circle r="1.7" fill={node.c}>
                        <animate attributeName="opacity" values="0.35;1;0.35" dur={`${1.4 + idx * 0.25}s`} repeatCount="indefinite" />
                      </circle>
                    </g>
                  ))}
                  <path
                    d="M -74,-28 C -38,-68 38,-68 74,-28 M -78,30 C -40,70 40,70 78,30"
                    fill="none"
                    stroke="rgba(148, 163, 184, 0.16)"
                    strokeWidth="0.8"
                    strokeDasharray="3 8"
                  >
                    <animate attributeName="stroke-dashoffset" values="40;0" dur="8s" repeatCount="indefinite" />
                  </path>
                </g>

                {/* Main Core Body */}
                <circle
                  cx="0"
                  cy="0"
                  r="68"
                  fill="rgba(8, 12, 30, 0.96)"
                  stroke="url(#shiftGrad)"
                  strokeWidth="2.5"
                  filter="url(#strongGlow)"
                />

                {/* Sub-Sector Grid Background */}
                <line
                  x1="-50"
                  y1="0"
                  x2="50"
                  y2="0"
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth="1"
                />
                <line
                  x1="0"
                  y1="-50"
                  x2="0"
                  y2="18"
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth="1"
                />

                {/* Sector 1: AUDIT Sector (Top) */}
                <text
                  x="0"
                  y="-52"
                  fill="#c084fc"
                  fontSize="8"
                  fontWeight="bold"
                  textAnchor="middle"
                  letterSpacing="0.08em"
                >
                  ASSESSMENT
                </text>
                <text
                  x="0"
                  y="-42"
                  fill="rgba(255,255,255,0.4)"
                  fontSize="6"
                  fontWeight="bold"
                  textAnchor="middle"
                  letterSpacing="0.05em"
                >
                  INTELLIGENCE MATRIX
                </text>

                {/* Compact validation matrix */}
                <g transform="translate(-47, -34)" opacity="0.92">
                  {[
                    { y: 0, w: 34, c: "#22d3ee" },
                    { y: 8, w: 44, c: "#a855f7" },
                    { y: 16, w: 38, c: "#10b981" },
                  ].map((bar, idx) => (
                    <g key={`matrix-bar-${idx}`}>
                      <rect x="0" y={bar.y} width="54" height="3.8" rx="1.9" fill="rgba(15, 23, 42, 0.9)" />
                      <rect x="0" y={bar.y} width={bar.w} height="3.8" rx="1.9" fill={bar.c}>
                        <animate attributeName="width" values={`${bar.w - 7};${bar.w};${bar.w - 7}`} dur={`${2.8 + idx * 0.35}s`} repeatCount="indefinite" />
                      </rect>
                    </g>
                  ))}
                </g>
                <g transform="translate(20, -34)" opacity="0.9">
                  {["MAP", "RISK", "HA"].map((label, idx) => (
                    <g key={`engine-chip-${label}`} transform={`translate(0, ${idx * 9})`}>
                      <rect x="0" y="0" width="32" height="6.4" rx="3.2" fill="rgba(6, 12, 24, 0.84)" stroke={idx === 1 ? "rgba(168, 85, 247, 0.45)" : "rgba(34, 211, 238, 0.4)"} strokeWidth="0.5" />
                      <text x="16" y="4.7" fill="rgba(226, 232, 240, 0.72)" fontSize="4.2" fontWeight="900" textAnchor="middle">
                        {label}
                      </text>
                    </g>
                  ))}
                </g>

                {/* Sector 2: VERIFY Sector (Middle scanner) */}
                <g transform="translate(0, -10)">
                  <circle
                    cx="0"
                    cy="0"
                    r="21"
                    fill="rgba(8, 12, 30, 0.28)"
                    filter="url(#glow)"
                  >
                    <animate
                      attributeName="r"
                      values="19;22.5;19"
                      dur="4.4s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values="0.24;0.56;0.24"
                      dur="4.4s"
                      repeatCount="indefinite"
                    />
                  </circle>
                  <g>
                    <animateTransform
                      attributeName="transform"
                      type="translate"
                      values="0 0; 0.6 0; 0 0; -0.6 0; 0 0"
                      dur="6s"
                      repeatCount="indefinite"
                    />
                    <g>
                      <animateTransform
                        attributeName="transform"
                        type="rotate"
                        values="-0.6 0 0; 0.6 0 0; -0.6 0 0"
                        dur="8s"
                        repeatCount="indefinite"
                      />
                      <g transform="scale(2.8)">
                        <circle
                          cx="-4"
                          cy="0"
                          r="7.2"
                          fill="none"
                          stroke="#22d3ee"
                          strokeWidth="2"
                        />
                        <path
                          d="M -8,0 H 8"
                          fill="none"
                          stroke="#8b5cf6"
                          strokeWidth="2.4"
                          strokeLinecap="round"
                        />
                        <path
                          d="M 3,-3 L 8,0 L 3,3"
                          fill="none"
                          stroke="#8b5cf6"
                          strokeWidth="2.4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <animateTransform
                            attributeName="transform"
                            type="translate"
                            values="-2 0; 2 0; -2 0"
                            dur="2.1s"
                            repeatCount="indefinite"
                          />
                        </path>
                      <circle cx="-8" cy="0" r="1.6" fill="#22d3ee">
                        <animate
                          attributeName="opacity"
                          values="1;0.35;1"
                          dur="1.8s"
                          repeatCount="indefinite"
                        />
                      </circle>
                        <g transform="translate(0, -4)">
                          <path
                            d="M -5.5,1 H 5.5"
                            fill="none"
                            stroke="rgba(34, 211, 238, 0.5)"
                            strokeWidth="1.2"
                            strokeDasharray="2 4"
                          >
                            <animate
                              attributeName="stroke-dashoffset"
                              values="0;-10"
                              dur="1.8s"
                              repeatCount="indefinite"
                            />
                          </path>
                        </g>
                      </g>
                    </g>
                  </g>
                </g>

                {/* Sweeping Laser Beam across the scan sector */}
                <line
                  x1="-52"
                  y1="0"
                  x2="52"
                  y2="0"
                  stroke="url(#engineSweepGrad)"
                  strokeWidth="3.2"
                  opacity="0.82"
                  filter="url(#glow)"
                >
                  <animate
                    attributeName="y1"
                    values="-34;16;-34"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="y2"
                    values="-34;16;-34"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                </line>

                {/* Outer LED status rings */}
                <circle cx="-62" cy="0" r="2.2" fill="#c084fc">
                  <animate
                    attributeName="opacity"
                    values="1;0.2;1"
                    dur="1.2s"
                    repeatCount="indefinite"
                  />
                </circle>
                <circle cx="62" cy="0" r="2.2" fill="#22d3ee">
                  <animate
                    attributeName="opacity"
                    values="0.2;1;0.2"
                    dur="1.2s"
                    repeatCount="indefinite"
                  />
                </circle>
                <circle cx="0" cy="-62" r="2.2" fill="#10b981">
                  <animate
                    attributeName="opacity"
                    values="1;0.3;1"
                    dur="0.8s"
                    repeatCount="indefinite"
                  />
                </circle>
                <circle cx="0" cy="62" r="2.2" fill="#ef4444">
                  <animate
                    attributeName="opacity"
                    values="0.3;1;0.3"
                    dur="1.5s"
                    repeatCount="indefinite"
                  />
                </circle>

                {/* Sector 3: DECISION Sector (Bottom) */}
                <line
                  x1="-54"
                  y1="20"
                  x2="58"
                  y2="20"
                  stroke="rgba(255,255,255,0.15)"
                  strokeWidth="0.8"
                  strokeDasharray="3 3"
                />

                {/* Decision 1: rollback simulation status */}
                <g transform="translate(-4, 0)">
                  <rect
                    x="-48"
                    y="22"
                    width="52"
                    height="26"
                    rx="4"
                    fill="rgba(31, 12, 24, 0.88)"
                    stroke="#a855f7"
                    strokeWidth="0.8"
                  />
                  <text
                    x="-22"
                    y="33"
                    fill="#c084fc"
                    fontSize="6.4"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    SIMULATE
                  </text>
                  {/* Flash LED */}
                  <circle cx="-40" cy="39" r="1.9" fill="#a855f7">
                    <animate
                      attributeName="opacity"
                      values="1;0.35;1"
                      dur="1.1s"
                      repeatCount="indefinite"
                    />
                  </circle>
                  {/* rollback simulation loop */}
                  <path
                    d="M -12,39 C -17,35 -22,36 -24,40 M -24,40 L -20,39 M -24,40 L -22,36"
                    fill="none"
                    stroke="#c084fc"
                    strokeWidth="1"
                    strokeLinecap="round"
                  />
                </g>

                {/* Decision 2: readiness status */}
                <g transform="translate(4, 0)">
                  <rect
                    x="2"
                    y="22"
                    width="52"
                    height="26"
                    rx="4"
                    fill="#081812"
                    stroke="#10b981"
                    strokeWidth="0.8"
                  />
                  <text
                    x="28"
                    y="33"
                    fill="#34d399"
                    fontSize="6.8"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    READY
                  </text>
                  {/* Flash LED */}
                  <circle cx="10" cy="39" r="1.9" fill="#10b981">
                    <animate
                      attributeName="opacity"
                      values="1;0.2;1"
                      dur="0.6s"
                      repeatCount="indefinite"
                    />
                  </circle>
                  {/* approved route arrow */}
                  <path
                    d="M 37,39 L 43,39 L 40,36 M 40,42 L 43,39"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="1"
                    strokeLinecap="round"
                  />
                </g>
              </g>

              {/* Engine status tags */}
              <g opacity="0.92">
                {[
                  { x: -118, y: -84, text: "COMPATIBLE", c: "#22d3ee", w: 82 },
                  { x: 36, y: -84, text: "VERIFIED", c: "#10b981", w: 68 },
                  { x: -118, y: 82, text: "TCO SAVINGS", c: "#10b981", w: 76 },
                  { x: 24, y: 82, text: "BROADCOM FREE", c: "#ea580c", w: 84 },
                ].map((tag, idx) => (
                  <g key={`engine-status-${tag.text}`} transform={`translate(${tag.x}, ${tag.y})`}>
                    <rect
                      x="0"
                      y="0"
                      width={tag.w}
                      height="16"
                      rx="7"
                      fill="rgba(8, 12, 30, 0.82)"
                      stroke={tag.c}
                      strokeWidth="0.75"
                      opacity="0.75"
                    >
                      <animate attributeName="opacity" values="0.55;0.9;0.55" dur={`${3.8 + idx * 0.4}s`} repeatCount="indefinite" />
                    </rect>
                    <text
                      x={tag.w / 2}
                      y="10.5"
                      fill={tag.c}
                      fontSize="6.1"
                      fontWeight="900"
                      textAnchor="middle"
                      letterSpacing="0.04em"
                    >
                      {tag.text}
                    </text>
                  </g>
                ))}
              </g>
              </g>

              {/* Animated Nodes Traveling (VMs migrating as cards) */}

              {/* VM 1: DB workload (Approved database lane) */}
              <g>
                {/* Card Container - Color morphs */}
                <rect
                  x="-40"
                  y="-14"
                  width="80"
                  height="28"
                  rx="6"
                  fill="rgba(8, 10, 20, 0.95)"
                  stroke="#ef4444"
                  strokeWidth="1.2"
                  filter="url(#glow)"
                >
                  <animate
                    attributeName="stroke"
                    dur="6s"
                    begin="0s"
                    repeatCount="indefinite"
                    values="#ef4444; #ef4444; #8b5cf6; #10b981; #10b981"
                    keyTimes="0; 0.35; 0.5; 0.65; 1"
                  />
                </rect>

                {/* Database cylinder icon with animated color */}
                <g transform="translate(-5, 0)">
                  <ellipse
                    cx="-20"
                    cy="-5"
                    rx="5"
                    ry="1.6"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="0.9"
                  >
                    <animate
                      attributeName="stroke"
                      dur="6s"
                      begin="0s"
                      repeatCount="indefinite"
                      values="#ef4444; #ef4444; #c084fc; #34d399; #34d399"
                      keyTimes="0; 0.35; 0.5; 0.65; 1"
                    />
                  </ellipse>
                  <path
                    d="M -25,-5 v 5 C -25,1.2 -22.8,2 -20,2 C -17.2,2 -15,1.2 -15,0.8 v -5"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="0.9"
                  >
                    <animate
                      attributeName="stroke"
                      dur="6s"
                      begin="0s"
                      repeatCount="indefinite"
                      values="#ef4444; #ef4444; #c084fc; #34d399; #34d399"
                      keyTimes="0; 0.35; 0.5; 0.65; 1"
                    />
                  </path>
                  <path
                    d="M -25,0 v 5 C -25,6.2 -22.8,7 -20,7 C -17.2,7 -15,6.2 -15,5.8 v -5"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="0.9"
                  >
                    <animate
                      attributeName="stroke"
                      dur="6s"
                      begin="0s"
                      repeatCount="indefinite"
                      values="#ef4444; #ef4444; #c084fc; #34d399; #34d399"
                      keyTimes="0; 0.35; 0.5; 0.65; 1"
                    />
                  </path>
                </g>

                {/* Tag Title with animated color */}
                <text
                  x="14"
                  y="3"
                  fill="#f87171"
                  fontSize="8.5"
                  fontWeight="900"
                  textAnchor="middle"
                  fontFamily="var(--font-mono)"
                >
                  <animate
                    attributeName="fill"
                    dur="6s"
                    begin="0s"
                    repeatCount="indefinite"
                    values="#f87171; #f87171; #e9d5ff; #34d399; #34d399"
                    keyTimes="0; 0.35; 0.5; 0.65; 1"
                  />
                  PROD-DB
                </text>

                <animateMotion
                  path="M 90,234 C 180,234 220,195 300,195 C 380,195 420,234 510,234"
                  dur="6s"
                  begin="0s"
                  repeatCount="indefinite"
                  keyPoints="0;0.5;1"
                  keyTimes="0;0.5;1"
                />
              </g>

              {/* VM 2: Web workload (Approved compute lane) */}
              <g>
                {/* Card Container - Color morphs */}
                <rect
                  x="-40"
                  y="-14"
                  width="80"
                  height="28"
                  rx="6"
                  fill="rgba(8, 10, 20, 0.95)"
                  stroke="#ef4444"
                  strokeWidth="1.2"
                  filter="url(#glow)"
                >
                  <animate
                    attributeName="stroke"
                    dur="6s"
                    begin="2s"
                    repeatCount="indefinite"
                    values="#ef4444; #ef4444; #8b5cf6; #10b981; #10b981"
                    keyTimes="0; 0.35; 0.5; 0.65; 1"
                  />
                </rect>

                {/* Web browser monitor icon with animated color */}
                <g transform="translate(-5, 0)">
                  <rect
                    x="-25"
                    y="-8"
                    width="11"
                    height="9"
                    rx="1.5"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="0.9"
                  >
                    <animate
                      attributeName="stroke"
                      dur="6s"
                      begin="2s"
                      repeatCount="indefinite"
                      values="#ef4444; #ef4444; #c084fc; #34d399; #34d399"
                      keyTimes="0; 0.35; 0.5; 0.65; 1"
                    />
                  </rect>
                  <path
                    d="M -20,1 v 4 M -23,5 h 6"
                    stroke="#ef4444"
                    strokeWidth="0.9"
                  >
                    <animate
                      attributeName="stroke"
                      dur="6s"
                      begin="2s"
                      repeatCount="indefinite"
                      values="#ef4444; #ef4444; #c084fc; #34d399; #34d399"
                      keyTimes="0; 0.35; 0.5; 0.65; 1"
                    />
                  </path>
                </g>

                {/* Tag Title with animated color */}
                <text
                  x="14"
                  y="3"
                  fill="#f87171"
                  fontSize="8.5"
                  fontWeight="900"
                  textAnchor="middle"
                  fontFamily="var(--font-mono)"
                >
                  <animate
                    attributeName="fill"
                    dur="6s"
                    begin="2s"
                    repeatCount="indefinite"
                    values="#f87171; #f87171; #e9d5ff; #34d399; #34d399"
                    keyTimes="0; 0.35; 0.5; 0.65; 1"
                  />
                  WEB-APP
                </text>

                <animateMotion
                  path="M 90,178 C 180,178 220,195 300,195 C 380,195 420,178 510,178"
                  dur="6s"
                  begin="2s"
                  repeatCount="indefinite"
                  keyPoints="0;0.5;1"
                  keyTimes="0;0.5;1"
                />
              </g>

              {/* VM 3: Storage / Incompatible Workload (Rejected storage lane loops back to VMware) */}
              <g>
                {/* Card Container - Color morphs to alert flashing inside core, then stays red on return */}
                <rect
                  x="-40"
                  y="-14"
                  width="80"
                  height="28"
                  rx="6"
                  fill="rgba(8, 10, 20, 0.95)"
                  stroke="#ef4444"
                  strokeWidth="1.2"
                  filter="url(#glow)"
                >
                  <animate
                    attributeName="stroke"
                    dur="6s"
                    begin="4s"
                    repeatCount="indefinite"
                    values="#ef4444; #ef4444; #f59e0b; #ef4444; #ef4444"
                    keyTimes="0; 0.35; 0.52; 0.7; 1"
                  />
                  <animate
                    attributeName="fill"
                    dur="6s"
                    begin="4s"
                    repeatCount="indefinite"
                    values="rgba(8, 10, 20, 0.95);rgba(8, 10, 20, 0.95);rgba(239, 68, 68, 0.18);rgba(239, 68, 68, 0.08);rgba(8, 10, 20, 0.95)"
                    keyTimes="0; 0.35; 0.52; 0.7; 1"
                  />
                </rect>

                {/* Disk Stack Icon with alert animation */}
                <g transform="translate(-5, 0)">
                  <ellipse
                    cx="-20"
                    cy="-5"
                    rx="5"
                    ry="1.6"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="0.9"
                  >
                    <animate
                      attributeName="stroke"
                      dur="6s"
                      begin="4s"
                      repeatCount="indefinite"
                      values="#ef4444; #ef4444; #f59e0b; #ef4444; #ef4444"
                      keyTimes="0; 0.35; 0.52; 0.7; 1"
                    />
                  </ellipse>
                  <path
                    d="M -25,-5 v 5 C -25,1.2 -22.8,2 -20,2 C -17.2,2 -15,1.2 -15,0.8 v -5"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="0.9"
                  >
                    <animate
                      attributeName="stroke"
                      dur="6s"
                      begin="4s"
                      repeatCount="indefinite"
                      values="#ef4444; #ef4444; #f59e0b; #ef4444; #ef4444"
                      keyTimes="0; 0.35; 0.52; 0.7; 1"
                    />
                  </path>
                </g>

                {/* Alternating Text Layers based on travel position */}

                {/* Outgoing stage: LEGACY-SAN */}
                <text
                  x="14"
                  y="3"
                  fill="#f87171"
                  fontSize="8"
                  fontWeight="900"
                  textAnchor="middle"
                  fontFamily="var(--font-mono)"
                >
                  <animate
                    attributeName="opacity"
                    dur="6s"
                    begin="4s"
                    repeatCount="indefinite"
                    values="1;1;0;0;0;0"
                    keyTimes="0; 0.35; 0.4; 0.7; 0.75; 1"
                  />
                  LEGACY-SAN
                </text>

                {/* Auditing Core stage: AUDIT FAIL */}
                <text
                  x="14"
                  y="3"
                  fill="#ef4444"
                  fontSize="8"
                  fontWeight="900"
                  textAnchor="middle"
                  fontFamily="var(--font-mono)"
                >
                  <animate
                    attributeName="opacity"
                    dur="6s"
                    begin="4s"
                    repeatCount="indefinite"
                    values="0;0;1;1;0;0"
                    keyTimes="0; 0.35; 0.4; 0.68; 0.72; 1"
                  />
                  <animate
                    attributeName="fill"
                    dur="6s"
                    begin="4s"
                    repeatCount="indefinite"
                    values="#ef4444;#f59e0b;#ef4444"
                    keyTimes="0; 0.5; 1"
                  />
                  AUDIT FAIL
                </text>

                {/* Return stage: REJECTED */}
                <text
                  x="14"
                  y="3"
                  fill="#f87171"
                  fontSize="8"
                  fontWeight="900"
                  textAnchor="middle"
                  fontFamily="var(--font-mono)"
                >
                  <animate
                    attributeName="opacity"
                    dur="6s"
                    begin="4s"
                    repeatCount="indefinite"
                    values="0;0;0;0;1;1"
                    keyTimes="0; 0.68; 0.72; 0.8; 0.85; 1"
                  />
                  REJECTED
                </text>

                <animateMotion
                  path="M 90,289 C 180,289 220,195 300,195 C 220,195 200,340 90,289"
                  dur="6s"
                  begin="4s"
                  repeatCount="indefinite"
                  keyPoints="0;0.5;1"
                  keyTimes="0;0.5;1"
                />
              </g>

              {/* Senior AI Advisor Floating Terminal Console Card */}
              <g transform="translate(210, 290)">
                {/* Terminal Background */}
                <rect
                  x="0"
                  y="0"
                  width="180"
                  height="45"
                  rx="6"
                  fill="#030712"
                  fillOpacity="0.88"
                  stroke="url(#shiftGrad)"
                  strokeWidth="1.2"
                  filter="url(#glow)"
                >
                  <animate
                    attributeName="stroke-opacity"
                    values="0.6;1;0.6"
                    dur="3s"
                    repeatCount="indefinite"
                  />
                </rect>

                {/* Cognitive Brain Icon */}
                <g transform="translate(10, 8)" strokeWidth="0.8">
                  <rect x="0" y="0" width="12" height="12" rx="2" fill="none" stroke="#a855f7" />
                  <circle cx="6" cy="6" r="3" fill="#a855f7" opacity="0.3">
                    <animate attributeName="r" values="2;4;2" dur="2s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="6" cy="6" r="1" fill="#a855f7" />
                </g>

                {/* Console Header */}
                <text
                  x="28"
                  y="17"
                  fill="rgba(34, 211, 238, 0.9)"
                  fontSize="5.2"
                  fontWeight="bold"
                  fontFamily="var(--font-mono)"
                  letterSpacing="0.05em"
                >
                  SENIOR AI ADVISOR | CONTEXT CAPTURE
                </text>

                {/* Blinking Prompt Cursor */}
                <rect x="142" y="13" width="1.5" height="4.5" fill="#22d3ee">
                  <animate attributeName="opacity" values="1;0;1" dur="0.8s" repeatCount="indefinite" />
                </rect>

                {/* Diagnostic Line 1 */}
                <text
                  x="10"
                  y="29"
                  fill="rgba(255, 255, 255, 0.85)"
                  fontSize="4.8"
                  fontWeight="bold"
                  fontFamily="var(--font-mono)"
                >
                  <animate
                    attributeName="opacity"
                    values="1;0;1"
                    dur="6s"
                    repeatCount="indefinite"
                    keyTimes="0;0.5;1"
                  />
                  &gt; SCANNING: WORKLOAD CONFIGURATION EVIDENCE
                </text>

                {/* Diagnostic Line 2 */}
                <g>
                  <animate
                    attributeName="opacity"
                    values="0;1;0"
                    dur="6s"
                    repeatCount="indefinite"
                    keyTimes="0;0.5;1"
                  />
                  <text
                    x="10"
                    y="38"
                    fill="#ef4444"
                    fontSize="4.8"
                    fontWeight="bold"
                    fontFamily="var(--font-mono)"
                  >
                    &gt; ALERT: INCOMPATIBLE LEGACY SAN. ROUTING CEPH...
                  </text>
                </g>
              </g>
            </svg>

            <div className="badge badge-tam" style={{ marginBottom: "0" }}>
              <Shield size={12} />
              <span>Former VMware TAM-led readiness methodology</span>
            </div>

            <div
              className="hero-description-group"
              style={{
                maxWidth: "620px",
                marginTop: "1.5rem",
                marginBottom: "1.5rem",
                textAlign: "center",
              }}
            >
              <p
                className="text-muted"
                style={{ fontSize: "1rem", lineHeight: "1.6", margin: 0 }}
              >
                It analyzes the migration from multiple angles: workload risk,
                infrastructure sizing, backup gaps, storage and network
                complexity, missing evidence, migration waves, no-go items and
                executive decision criteria.
              </p>
            </div>

            <div className="hero-actions">
              <button onClick={onOpenScanner} className="btn btn-primary btn-glow">
                Audit Your Cluster
                <ArrowRight size={18} />
              </button>
              <button
                onClick={() => scrollToSection("sample-output")}
                className="btn btn-secondary"
              >
                View Sample Report
                <FileText size={18} className="text-cyan" />
              </button>
            </div>
          </div>
        </div>

        {/* Transition Callout Bar */}
        <div className="hero-bottom-callout">
          <div className="hero-callout-info">
            <span className="hero-callout-tag">Migration Assurance</span>
            <p className="hero-callout-text">
              Before you migrate, quote, or deliver a Proxmox project, get a
              clear audit-style report that shows what{" "}
              <span className="highlight-ready">looks ready</span>, what{" "}
              <span className="highlight-validation">needs validation</span>,
              and what{" "}
              <span className="highlight-danger">should not move yet</span>.
            </p>
          </div>

          <div className="hero-callout-card">
            <div className="hero-callout-card-title">
              <div className="hero-callout-card-dot"></div>
              <span className="hero-callout-card-label">
                100% Agentless Security
              </span>
            </div>
            <div className="hero-callout-list">
              <div className="hero-callout-item">
                <div className="callout-icon-box check-animated-1">
                  <Check size={12} className="check-svg" />
                </div>
                <div className="item-text">
                  <strong className="text-white">Start with RVTools</strong>
                  <span className="text-muted-sm">
                    Simply upload your VMware config export
                  </span>
                </div>
              </div>
              <div className="hero-callout-item">
                <div className="callout-icon-box check-animated-2">
                  <Check size={12} className="check-svg" />
                </div>
                <div className="item-text">
                  <strong className="text-white">No Agents Required</strong>
                  <span className="text-muted-sm">
                    Zero performance impact on VM hosts
                  </span>
                </div>
              </div>
              <div className="hero-callout-item">
                <div className="callout-icon-box check-animated-3">
                  <Check size={12} className="check-svg" />
                </div>
                <div className="item-text">
                  <strong className="text-white">
                    Zero Credentials & Production Access
                  </strong>
                  <span className="text-muted-sm">
                    Audit your cluster with zero data exposure risk
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
