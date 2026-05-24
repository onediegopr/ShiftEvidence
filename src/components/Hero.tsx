import { Shield, ArrowRight, DollarSign, Check } from 'lucide-react';

interface HeroProps {
  onOpenScanner: () => void;
}

export default function Hero({ onOpenScanner }: HeroProps) {
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="section" style={{ paddingTop: '9rem', paddingBottom: '6rem' }}>
      <div className="bg-mesh"></div>
      <div className="bg-grid"></div>
      <div className="glow-orb" style={{ top: '20%', left: '10%', width: '400px', height: '400px', background: 'rgba(99, 102, 241, 0.15)' }}></div>
      <div className="glow-orb" style={{ bottom: '10%', right: '5%', width: '350px', height: '350px', background: 'rgba(6, 182, 212, 0.12)', animationDelay: '-5s' }}></div>

      <div className="container">
        <div className="hero-grid">
          <div>
            <div className="badge badge-premium">
              <span className="badge-pulse-dot"></span>
              <Shield size={13} className="text-emerald" />
              <span>Pre-Migration Auditing | 100% Agentless & Compatibility Verified</span>
            </div>
            <h1 className="hero-title">
              Ditch <span className="brand-vmware">VMware</span> Licensing Hikes.<br />
              Shift to <span className="brand-proxmox">Proxmox</span><br />
              with Confidence.
            </h1>
            <div className="hero-description-group">
              <p className="text-muted">
                Broadcom’s VMware licensing changes are forcing companies, MSPs and infrastructure teams to rethink their VMware strategy. Infrashift helps you plan the move before production is touched — whether you are assessing your own environment or preparing a client migration.
              </p>
            </div>
          </div>

        <div className="hero-visual">
          <svg className="migration-flow-svg" viewBox="0 0 600 400" xmlns="http://www.w3.org/2000/svg" style={{ overflow: 'visible', width: '100%', maxWidth: '500px' }}>
            <defs>
              {/* Gradients */}
              <linearGradient id="vmwareGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#1d4ed8" />
              </linearGradient>
              <linearGradient id="proxmoxGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ea580c" />
                <stop offset="100%" stopColor="#ff781f" />
              </linearGradient>
              <linearGradient id="shiftGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#a855f7" />
                <stop offset="50%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
              <linearGradient id="vmwareBg" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#080c18" />
                <stop offset="100%" stopColor="#03050a" />
              </linearGradient>
              <linearGradient id="proxmoxBg" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#140b06" />
                <stop offset="100%" stopColor="#060302" />
              </linearGradient>
              <linearGradient id="tunnelGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(239, 68, 68, 0.4)" />
                <stop offset="45%" stopColor="rgba(139, 92, 246, 0.7)" />
                <stop offset="55%" stopColor="rgba(139, 92, 246, 0.7)" />
                <stop offset="100%" stopColor="rgba(16, 185, 129, 0.4)" />
              </linearGradient>

              {/* Glow Filters */}
              <filter id="glow" x="-25%" y="-25%" width="150%" height="150%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <filter id="strongGlow" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="8" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Grid Pattern in SVG Background */}
            <path d="M 0,0 L 600,0 M 0,50 L 600,50 M 0,100 L 600,100 M 0,150 L 600,150 M 0,200 L 600,200 M 0,250 L 600,250 M 0,300 L 600,300 M 0,350 L 600,350" stroke="rgba(255,255,255,0.015)" strokeWidth="1" />
            <path d="M 0,0 L 0,400 M 50,0 L 50,400 M 100,0 L 100,400 M 150,0 L 150,400 M 200,0 L 200,400 M 250,0 L 250,400 M 300,0 L 300,400 M 350,0 L 350,400 M 400,0 L 400,400 M 450,0 L 450,400 M 500,0 L 500,400 M 550,0 L 550,400" stroke="rgba(255,255,255,0.015)" strokeWidth="1" />

            {/* 3 Migration Track Lanes */}
            
            {/* Lane 1: Database (Y: 234 -> 195 -> 234) */}
            <path d="M 90,234 C 180,234 220,195 300,195 C 380,195 420,234 510,234" fill="none" stroke="rgba(168, 85, 247, 0.12)" strokeWidth="5" strokeLinecap="round" />
            <path d="M 90,234 C 180,234 220,195 300,195 C 380,195 420,234 510,234" fill="none" stroke="rgba(255, 255, 255, 0.04)" strokeWidth="1" strokeDasharray="3 3" />
            {/* Database Lane active flow pulses */}
            <path d="M 90,234 C 180,234 220,195 300,195 C 380,195 420,234 510,234" fill="none" stroke="rgba(168, 85, 247, 0.5)" strokeWidth="1.5" strokeDasharray="8 30" strokeLinecap="round">
              <animate attributeName="stroke-dashoffset" values="150;0" dur="4s" repeatCount="indefinite" />
            </path>

            {/* Lane 2: Compute / Web (Y: 178 -> 195 -> 178) */}
            <path d="M 90,178 C 180,178 220,195 300,195 C 380,195 420,178 510,178" fill="none" stroke="rgba(6, 182, 212, 0.12)" strokeWidth="5" strokeLinecap="round" />
            <path d="M 90,178 C 180,178 220,195 300,195 C 380,195 420,178 510,178" fill="none" stroke="rgba(255, 255, 255, 0.04)" strokeWidth="1" strokeDasharray="3 3" />
            {/* Compute Lane active flow pulses */}
            <path d="M 90,178 C 180,178 220,195 300,195 C 380,195 420,178 510,178" fill="none" stroke="rgba(6, 182, 212, 0.5)" strokeWidth="1.5" strokeDasharray="8 30" strokeLinecap="round">
              <animate attributeName="stroke-dashoffset" values="150;0" dur="3.5s" repeatCount="indefinite" />
            </path>

            {/* Lane 3: Storage / Rollback loop (Y: 289 -> 195 -> loops back to 289) */}
            <path d="M 90,289 C 180,289 220,195 300,195 C 220,195 200,340 90,289" fill="none" stroke="rgba(239, 68, 68, 0.08)" strokeWidth="5" strokeLinecap="round" />
            <path d="M 90,289 C 180,289 220,195 300,195 C 220,195 200,340 90,289" fill="none" stroke="rgba(255, 255, 255, 0.03)" strokeWidth="1" strokeDasharray="3 3" />
            {/* Rollback Lane active flow pulses */}
            <path d="M 90,289 C 180,289 220,195 300,195 C 220,195 200,340 90,289" fill="none" stroke="rgba(239, 68, 68, 0.4)" strokeWidth="1.5" strokeDasharray="8 30" strokeLinecap="round">
              <animate attributeName="stroke-dashoffset" values="200;0" dur="5s" repeatCount="indefinite" />
            </path>

            {/* VMware Source Rack Enclosure (X: 10, Y: 65, W: 160, H: 260) */}
            <g transform="translate(10, 65)">
              {/* Outer Enclosure with double border and glow */}
              <rect x="0" y="0" width="160" height="260" rx="12" fill="url(#vmwareBg)" stroke="#1d4ed8" strokeWidth="2" />
              <rect x="0" y="0" width="160" height="260" rx="12" fill="none" stroke="#3b82f6" strokeWidth="1" opacity="0.3" filter="url(#glow)" />
              
              {/* Vertical Side Rails with mount holes */}
              <line x1="6" y1="0" x2="6" y2="260" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />
              <line x1="154" y1="0" x2="154" y2="260" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />
              <line x1="6" y1="0" x2="6" y2="260" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeDasharray="1 8" />
              <line x1="154" y1="0" x2="154" y2="260" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeDasharray="1 8" />

              {/* Header Title & Status */}
              <g transform="translate(80, 20)">
                <text x="0" y="0" fill="#60a5fa" fontSize="10" fontWeight="800" textAnchor="middle" letterSpacing="0.08em">VMWARE vSPHERE</text>
                <text x="0" y="9" fill="#ef4444" fontSize="6.5" fontWeight="600" textAnchor="middle" letterSpacing="0.05em">LEGACY INFRASTRUCTURE</text>
                <circle cx="-62" cy="-4" r="3" fill="#ef4444">
                  <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite" />
                </circle>
              </g>
              
              {/* Bay 1: Network (Y: 36) */}
              <g transform="translate(12, 36)">
                <rect x="0" y="0" width="136" height="46" rx="4" fill="#05070e" stroke="rgba(59, 130, 246, 0.25)" strokeWidth="1" />
                <text x="8" y="10" fill="rgba(255, 255, 255, 0.4)" fontSize="6" fontWeight="bold">BAY 01 | NETWORK (vSwitch)</text>
                
                {/* Ports */}
                <g transform="translate(8, 16)">
                  {Array.from({ length: 8 }).map((_, idx) => (
                    <g key={idx} transform={`translate(${idx * 15}, 0)`}>
                      <rect x="0" y="0" width="10" height="9" rx="1.5" fill="#111827" stroke="rgba(59, 130, 246, 0.4)" strokeWidth="0.8" />
                      {/* Port lights */}
                      <circle cx="5" cy="-2.5" r="1" fill={idx % 3 === 0 ? "#ef4444" : "#f59e0b"}>
                        <animate attributeName="opacity" values="1;0.2;1" dur={`${1 + (idx % 3) * 0.4}s`} repeatCount="indefinite" />
                      </circle>
                    </g>
                  ))}
                </g>
                {/* Legacy wiring visualization */}
                <path d="M 18,25 C 25,38 45,38 52,25 M 63,25 C 70,38 90,38 97,25" fill="none" stroke="rgba(239, 68, 68, 0.35)" strokeWidth="1" />
              </g>

              {/* Bay 2: Compute (Y: 88) */}
              <g transform="translate(12, 88)">
                <rect x="0" y="0" width="136" height="50" rx="4" fill="#05070e" stroke="rgba(59, 130, 246, 0.25)" strokeWidth="1" />
                <text x="8" y="10" fill="rgba(255, 255, 255, 0.4)" fontSize="6" fontWeight="bold">BAY 02 | COMPUTE (ESXi Nodes)</text>
                
                {/* Node 1 */}
                <g transform="translate(8, 14)">
                  <rect x="0" y="0" width="120" height="13" rx="2" fill="#0a0f1d" stroke="rgba(59, 130, 246, 0.15)" strokeWidth="0.8" />
                  <circle cx="8" cy="6.5" r="2" fill="#ef4444" />
                  <rect x="22" y="5" width="40" height="3" rx="1" fill="#1e293b" />
                  <rect x="22" y="5" width="34" height="3" rx="1" fill="#ef4444" /> {/* 85% Load */}
                  {/* Rotating fan */}
                  <g transform="translate(108, 6.5)">
                    <circle r="4.5" fill="none" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="0.8" />
                    <path d="M -3.5,0 L 3.5,0 M 0,-3.5 L 0,3.5" stroke="rgba(239, 68, 68, 0.5)" strokeWidth="1" strokeLinecap="round">
                      <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="1.2s" repeatCount="indefinite" />
                    </path>
                  </g>
                </g>

                {/* Node 2 */}
                <g transform="translate(8, 31)">
                  <rect x="0" y="0" width="120" height="13" rx="2" fill="#0a0f1d" stroke="rgba(59, 130, 246, 0.15)" strokeWidth="0.8" />
                  <circle cx="8" cy="6.5" r="2" fill="#f59e0b" />
                  <rect x="22" y="5" width="40" height="3" rx="1" fill="#1e293b" />
                  <rect x="22" y="5" width="28" height="3" rx="1" fill="#f59e0b" /> {/* 70% Load */}
                  {/* Rotating fan */}
                  <g transform="translate(108, 6.5)">
                    <circle r="4.5" fill="none" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="0.8" />
                    <path d="M -3.5,0 L 3.5,0 M 0,-3.5 L 0,3.5" stroke="rgba(255, 255, 255, 0.3)" strokeWidth="1" strokeLinecap="round">
                      <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="1.8s" repeatCount="indefinite" />
                    </path>
                  </g>
                </g>
              </g>

              {/* Bay 3: Databases / BBDD (Y: 144) */}
              <g transform="translate(12, 144)">
                <rect x="0" y="0" width="136" height="50" rx="4" fill="#05070e" stroke="rgba(59, 130, 246, 0.25)" strokeWidth="1" />
                <text x="8" y="10" fill="rgba(255, 255, 255, 0.4)" fontSize="6" fontWeight="bold">BAY 03 | DATABASES (SQL / Oracle)</text>
                
                {/* DB Cylinder 1 */}
                <g transform="translate(25, 26)">
                  <ellipse cx="0" cy="-8" rx="8" ry="2.2" fill="#1e293b" stroke="#f87171" strokeWidth="0.8" />
                  <path d="M -8,-8 v 10 c 0,1.2 3.5,2.2 8,2.2 s 8,-1 8,-2.2 v -10" fill="#0f172a" stroke="#f87171" strokeWidth="0.8" />
                  <line x1="-8" y1="-3" x2="8" y2="-3" stroke="rgba(248, 113, 113, 0.5)" strokeWidth="0.6" />
                  <line x1="-8" y1="1" x2="8" y2="1" stroke="rgba(248, 113, 113, 0.5)" strokeWidth="0.6" />
                  <circle cx="0" cy="5" r="1.2" fill="#ef4444" />
                </g>
                
                {/* DB Cylinder 2 */}
                <g transform="translate(70, 26)">
                  <ellipse cx="0" cy="-8" rx="8" ry="2.2" fill="#1e293b" stroke="#94a3b8" strokeWidth="0.8" />
                  <path d="M -8,-8 v 10 c 0,1.2 3.5,2.2 8,2.2 s 8,-1 8,-2.2 v -10" fill="#0f172a" stroke="#94a3b8" strokeWidth="0.8" />
                  <line x1="-8" y1="-3" x2="8" y2="-3" stroke="rgba(255, 255, 255, 0.2)" strokeWidth="0.6" />
                  <line x1="-8" y1="1" x2="8" y2="1" stroke="rgba(255, 255, 255, 0.2)" strokeWidth="0.6" />
                  <circle cx="0" cy="5" r="1.2" fill="#94a3b8" />
                </g>

                {/* DB Cylinder 3 */}
                <g transform="translate(111, 26)">
                  <ellipse cx="0" cy="-8" rx="8" ry="2.2" fill="#1e293b" stroke="#f87171" strokeWidth="0.8" />
                  <path d="M -8,-8 v 10 c 0,1.2 3.5,2.2 8,2.2 s 8,-1 8,-2.2 v -10" fill="#0f172a" stroke="#f87171" strokeWidth="0.8" />
                  <line x1="-8" y1="-3" x2="8" y2="-3" stroke="rgba(248, 113, 113, 0.5)" strokeWidth="0.6" />
                  <line x1="-8" y1="1" x2="8" y2="1" stroke="rgba(248, 113, 113, 0.5)" strokeWidth="0.6" />
                  <circle cx="0" cy="5" r="1.2" fill="#ef4444" />
                </g>
              </g>

              {/* Bay 4: Storage (Y: 200) */}
              <g transform="translate(12, 200)">
                <rect x="0" y="0" width="136" height="48" rx="4" fill="#05070e" stroke="rgba(59, 130, 246, 0.25)" strokeWidth="1" />
                <text x="8" y="10" fill="rgba(255, 255, 255, 0.4)" fontSize="6" fontWeight="bold">BAY 04 | STORAGE (vSAN / VMFS)</text>
                
                {/* Legacy disks */}
                <g transform="translate(8, 14)">
                  {Array.from({ length: 4 }).map((_, idx) => (
                    <g key={idx} transform={`translate(${idx * 30}, 0)`}>
                      <rect x="0" y="0" width="24" height="24" rx="2" fill="#0c1226" stroke="rgba(59, 130, 246, 0.2)" strokeWidth="0.8" />
                      <line x1="4" y1="6" x2="20" y2="6" stroke="rgba(239, 68, 68, 0.4)" strokeWidth="1" />
                      <line x1="4" y1="12" x2="20" y2="12" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                      <line x1="4" y1="18" x2="20" y2="18" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                      <circle cx="18" cy="18" r="1.5" fill="#ef4444">
                        <animate attributeName="opacity" values="1;0.3;1" dur={`${0.8 + idx * 0.3}s`} repeatCount="indefinite" />
                      </circle>
                    </g>
                  ))}
                </g>
              </g>
            </g>

            {/* Proxmox Target Rack Enclosure (X: 430, Y: 65, W: 160, H: 260) */}
            <g transform="translate(430, 65)">
              {/* Outer Enclosure with orange border and glow */}
              <rect x="0" y="0" width="160" height="260" rx="12" fill="url(#proxmoxBg)" stroke="#ea580c" strokeWidth="2" />
              <rect x="0" y="0" width="160" height="260" rx="12" fill="none" stroke="#ff781f" strokeWidth="1" opacity="0.3" filter="url(#glow)" />
              
              {/* Vertical Side Rails with mount holes */}
              <line x1="6" y1="0" x2="6" y2="260" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />
              <line x1="154" y1="0" x2="154" y2="260" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />
              <line x1="6" y1="0" x2="6" y2="260" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeDasharray="1 8" />
              <line x1="154" y1="0" x2="154" y2="260" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeDasharray="1 8" />

              {/* Header Title with Proxmox Chevron Logo & Status */}
              <g transform="translate(80, 20)">
                {/* Brand Chevron Logo */}
                <path d="M -66,-10 L -60,-5 L -66,0 L -63,0 L -57,-5 L -63,-10 Z" fill="#ea580c" />
                <path d="M -58,-2 L -52,-2 L -52,0 L -58,0 Z" fill="#ea580c" />

                <text x="6" y="0" fill="#f97316" fontSize="10" fontWeight="800" textAnchor="middle" letterSpacing="0.08em">PROXMOX VE</text>
                <text x="6" y="9" fill="#10b981" fontSize="6.5" fontWeight="600" textAnchor="middle" letterSpacing="0.05em">OPEN SOURCE CLUSTER</text>
                <circle cx="68" cy="-4" r="3" fill="#10b981">
                  <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" />
                </circle>
              </g>
              
              {/* Bay 1: Network (Y: 36) */}
              <g transform="translate(12, 36)">
                <rect x="0" y="0" width="136" height="46" rx="4" fill="#090605" stroke="rgba(234, 88, 12, 0.25)" strokeWidth="1" />
                <text x="8" y="10" fill="rgba(255, 255, 255, 0.4)" fontSize="6" fontWeight="bold">BAY 01 | NETWORK (SDN / Bridges)</text>
                
                {/* Ports */}
                <g transform="translate(8, 16)">
                  {Array.from({ length: 8 }).map((_, idx) => (
                    <g key={idx} transform={`translate(${idx * 15}, 0)`}>
                      <rect x="0" y="0" width="10" height="9" rx="1.5" fill="#111827" stroke="rgba(234, 88, 12, 0.4)" strokeWidth="0.8" />
                      {/* Port lights - Green for active SDN */}
                      <circle cx="5" cy="-2.5" r="1" fill="#10b981">
                        <animate attributeName="opacity" values="1;0.2;1" dur={`${0.6 + (idx % 2) * 0.3}s`} repeatCount="indefinite" />
                      </circle>
                    </g>
                  ))}
                </g>
                {/* SDN active link animation */}
                <path d="M 12,28 L 124,28" stroke="rgba(16, 185, 129, 0.3)" strokeWidth="1.2" strokeDasharray="4 8">
                  <animate attributeName="stroke-dashoffset" values="12;0" dur="1.5s" repeatCount="indefinite" />
                </path>
              </g>

              {/* Bay 2: Compute (Y: 88) */}
              <g transform="translate(12, 88)">
                <rect x="0" y="0" width="136" height="50" rx="4" fill="#090605" stroke="rgba(234, 88, 12, 0.25)" strokeWidth="1" />
                <text x="8" y="10" fill="rgba(255, 255, 255, 0.4)" fontSize="6" fontWeight="bold">BAY 02 | COMPUTE (KVM & LXC Core)</text>
                
                {/* Node 1 */}
                <g transform="translate(8, 14)">
                  <rect x="0" y="0" width="120" height="13" rx="2" fill="#100b08" stroke="rgba(234, 88, 12, 0.15)" strokeWidth="0.8" />
                  <circle cx="8" cy="6.5" r="2" fill="#10b981" />
                  <rect x="22" y="5" width="40" height="3" rx="1" fill="#1e293b" />
                  <rect x="22" y="5" width="18" height="3" rx="1" fill="#10b981" /> {/* 45% Load - Optimized */}
                  {/* Rotating fan */}
                  <g transform="translate(108, 6.5)">
                    <circle r="4.5" fill="none" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="0.8" />
                    <path d="M -3.5,0 L 3.5,0 M 0,-3.5 L 0,3.5" stroke="rgba(16, 185, 129, 0.6)" strokeWidth="1" strokeLinecap="round">
                      <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="2s" repeatCount="indefinite" />
                    </path>
                  </g>
                </g>

                {/* Node 2 */}
                <g transform="translate(8, 31)">
                  <rect x="0" y="0" width="120" height="13" rx="2" fill="#100b08" stroke="rgba(234, 88, 12, 0.15)" strokeWidth="0.8" />
                  <circle cx="8" cy="6.5" r="2" fill="#10b981" />
                  <rect x="22" y="5" width="40" height="3" rx="1" fill="#1e293b" />
                  <rect x="22" y="5" width="12" height="3" rx="1" fill="#10b981" /> {/* 30% Load */}
                  {/* Rotating fan */}
                  <g transform="translate(108, 6.5)">
                    <circle r="4.5" fill="none" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="0.8" />
                    <path d="M -3.5,0 L 3.5,0 M 0,-3.5 L 0,3.5" stroke="rgba(16, 185, 129, 0.6)" strokeWidth="1" strokeLinecap="round">
                      <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="2.5s" repeatCount="indefinite" />
                    </path>
                  </g>
                </g>
              </g>

              {/* Bay 3: Databases / BBDD (Y: 144) */}
              <g transform="translate(12, 144)">
                <rect x="0" y="0" width="136" height="50" rx="4" fill="#090605" stroke="rgba(234, 88, 12, 0.25)" strokeWidth="1" />
                <text x="8" y="10" fill="rgba(255, 255, 255, 0.4)" fontSize="6" fontWeight="bold">BAY 03 | CONTAINERS (Optimized DBs)</text>
                
                {/* Optimized DB Container 1 */}
                <g transform="translate(25, 26)">
                  <rect x="-10" y="-12" width="20" height="20" rx="3" fill="#0c1817" stroke="#10b981" strokeWidth="1.2" />
                  <path d="M -6,-6 h 12 M -6,-2 h 12 M -6,2 h 6" stroke="rgba(16, 185, 129, 0.5)" strokeWidth="0.8" />
                  <circle cx="5" cy="2" r="1.5" fill="#10b981">
                    <animate attributeName="opacity" values="1;0.3;1" dur="1.2s" repeatCount="indefinite" />
                  </circle>
                </g>
                
                {/* Optimized DB Container 2 */}
                <g transform="translate(70, 26)">
                  <rect x="-10" y="-12" width="20" height="20" rx="3" fill="#0c1817" stroke="#10b981" strokeWidth="1.2" />
                  <path d="M -6,-6 h 12 M -6,-2 h 12 M -6,2 h 6" stroke="rgba(16, 185, 129, 0.5)" strokeWidth="0.8" />
                  <circle cx="5" cy="2" r="1.5" fill="#10b981">
                    <animate attributeName="opacity" values="0.3;1;0.3" dur="1s" repeatCount="indefinite" />
                  </circle>
                </g>

                {/* Optimized DB Container 3 */}
                <g transform="translate(111, 26)">
                  <rect x="-10" y="-12" width="20" height="20" rx="3" fill="#0c1817" stroke="#10b981" strokeWidth="1.2" />
                  <path d="M -6,-6 h 12 M -6,-2 h 12 M -6,2 h 6" stroke="rgba(16, 185, 129, 0.5)" strokeWidth="0.8" />
                  <circle cx="5" cy="2" r="1.5" fill="#10b981">
                    <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite" />
                  </circle>
                </g>
              </g>

              {/* Bay 4: Storage (Y: 200) */}
              <g transform="translate(12, 200)">
                <rect x="0" y="0" width="136" height="48" rx="4" fill="#090605" stroke="rgba(234, 88, 12, 0.25)" strokeWidth="1" />
                <text x="8" y="10" fill="rgba(255, 255, 255, 0.4)" fontSize="6" fontWeight="bold">BAY 04 | STORAGE (Ceph / ZFS Mirror)</text>
                
                {/* Ceph mesh network diagram */}
                <g transform="translate(8, 12)">
                  <path d="M 20,10 L 60,25 L 100,10 L 20,10" fill="none" stroke="rgba(16, 185, 129, 0.3)" strokeWidth="1" strokeDasharray="2 2" />
                  <circle cx="20" cy="10" r="3.5" fill="#ea580c" stroke="#10b981" strokeWidth="1" />
                  <circle cx="60" cy="25" r="3.5" fill="#ea580c" stroke="#10b981" strokeWidth="1" />
                  <circle cx="100" cy="10" r="3.5" fill="#ea580c" stroke="#10b981" strokeWidth="1" />
                  
                  {/* Glowing core activity dots */}
                  <circle cx="20" cy="10" r="1" fill="#fff"><animate attributeName="opacity" values="0.2;1;0.2" dur="1.2s" repeatCount="indefinite" /></circle>
                  <circle cx="60" cy="25" r="1" fill="#fff"><animate attributeName="opacity" values="1;0.2;1" dur="1s" repeatCount="indefinite" /></circle>
                  <circle cx="100" cy="10" r="1" fill="#fff"><animate attributeName="opacity" values="0.2;1;0.2" dur="1.5s" repeatCount="indefinite" /></circle>
                </g>
              </g>
            </g>

            {/* Infrashift Validator Core (Center: X=300, Y=195) - 50% LARGER */}
            <g transform="translate(300, 195)">
              {/* Outer Scanning Radar Waves */}
              <circle cx="0" cy="0" r="62" fill="none" stroke="url(#shiftGrad)" strokeWidth="3" opacity="0.3">
                <animate attributeName="r" values="62;95" dur="2.4s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.6;0" dur="2.4s" repeatCount="indefinite" />
              </circle>
              <circle cx="0" cy="0" r="62" fill="none" stroke="#22d3ee" strokeWidth="1.5" opacity="0.2">
                <animate attributeName="r" values="62;112" dur="3.6s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.4;0" dur="3.6s" repeatCount="indefinite" />
              </circle>

              {/* Rotating Digital Dials */}
              <circle cx="0" cy="0" r="72" fill="none" stroke="url(#shiftGrad)" strokeWidth="1" strokeDasharray="12 8 20 6" opacity="0.65">
                <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="14s" repeatCount="indefinite" />
              </circle>
              <circle cx="0" cy="0" r="80" fill="none" stroke="#22d3ee" strokeWidth="0.8" strokeDasharray="6 12 18 8" opacity="0.5">
                <animateTransform attributeName="transform" type="rotate" from="360" to="0" dur="10s" repeatCount="indefinite" />
              </circle>

              {/* Main Core Body */}
              <circle cx="0" cy="0" r="62" fill="rgba(8, 12, 30, 0.96)" stroke="url(#shiftGrad)" strokeWidth="2.5" filter="url(#strongGlow)" />
              
              {/* Sub-Sector Grid Background */}
              <line x1="-50" y1="0" x2="50" y2="0" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
              <line x1="0" y1="-50" x2="0" y2="18" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
              
              {/* Sector 1: AUDIT Sector (Top) */}
              <text x="0" y="-46" fill="#c084fc" fontSize="7" fontWeight="bold" textAnchor="middle" letterSpacing="0.08em">AUDITING</text>
              <text x="0" y="-37" fill="rgba(255,255,255,0.4)" fontSize="5" fontWeight="bold" textAnchor="middle" letterSpacing="0.05em">VERIFICATION MATRIX</text>
              
              {/* Sector 2: VERIFY Sector (Middle scanner) */}
              <g transform="translate(0, -10)">
                {/* Shield Outline */}
                <path 
                  d="M 0,-16 L 14,-11 V 2 C 14,10 7,18 0,20 C -7,18 -14,10 -14,2 V -11 Z" 
                  fill="none" 
                  stroke="#10b981" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                />
                <path 
                  d="M -5,1 L -1,4.5 L 6 -2" 
                  stroke="#10b981" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                />
              </g>

              {/* Sweeping Laser Beam across the scan sector */}
              <line x1="-52" y1="0" x2="52" y2="0" stroke="#22d3ee" strokeWidth="2.5" opacity="0.85" filter="url(#glow)">
                <animate attributeName="y1" values="-34;16;-34" dur="2s" repeatCount="indefinite" />
                <animate attributeName="y2" values="-34;16;-34" dur="2s" repeatCount="indefinite" />
              </line>

              {/* Outer LED status rings */}
              <circle cx="-62" cy="0" r="2.2" fill="#c084fc"><animate attributeName="opacity" values="1;0.2;1" dur="1.2s" repeatCount="indefinite" /></circle>
              <circle cx="62" cy="0" r="2.2" fill="#22d3ee"><animate attributeName="opacity" values="0.2;1;0.2" dur="1.2s" repeatCount="indefinite" /></circle>
              <circle cx="0" cy="-62" r="2.2" fill="#10b981"><animate attributeName="opacity" values="1;0.3;1" dur="0.8s" repeatCount="indefinite" /></circle>
              <circle cx="0" cy="62" r="2.2" fill="#ef4444"><animate attributeName="opacity" values="0.3;1;0.3" dur="1.5s" repeatCount="indefinite" /></circle>

              {/* Sector 3: DECISION Sector (Bottom) */}
              <line x1="-54" y1="18" x2="54" y2="18" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8" strokeDasharray="3 3" />
              
              {/* Decision 1: Rollback Console (Left) */}
              <g transform="translate(-4, 0)">
                <rect x="-48" y="24" width="46" height="24" rx="4" fill="#1b0c0f" stroke="#ef4444" strokeWidth="0.8" />
                <text x="-25" y="34" fill="#f87171" fontSize="6.5" fontWeight="bold" textAnchor="middle">ROLLBACK</text>
                {/* Flash LED */}
                <circle cx="-40" cy="39" r="1.8" fill="#ef4444">
                  <animate attributeName="opacity" values="1;0.2;1" dur="0.6s" repeatCount="indefinite" />
                </circle>
                {/* Bouncing Back Arrow */}
                <path d="M -13,39 L -19,39 L -16,36 M -16,42 L -19,39" fill="none" stroke="#ef4444" strokeWidth="1" strokeLinecap="round" />
              </g>

              {/* Decision 2: Approve Console (Right) */}
              <g transform="translate(4, 0)">
                <rect x="2" y="24" width="46" height="24" rx="4" fill="#081812" stroke="#10b981" strokeWidth="0.8" />
                <text x="25" y="34" fill="#34d399" fontSize="6.5" fontWeight="bold" textAnchor="middle">APPROVE</text>
                {/* Flash LED */}
                <circle cx="10" cy="39" r="1.8" fill="#10b981">
                  <animate attributeName="opacity" values="1;0.2;1" dur="0.6s" repeatCount="indefinite" />
                </circle>
                {/* approved route arrow */}
                <path d="M 37,39 L 43,39 L 40,36 M 40,42 L 43,39" fill="none" stroke="#10b981" strokeWidth="1" strokeLinecap="round" />
              </g>
            </g>

            {/* Animated Nodes Traveling (VMs migrating as cards) */}
            
            {/* VM 1: DB workload (Approved database lane) */}
            <g>
              {/* Card Container - Color morphs */}
              <rect x="-40" y="-14" width="80" height="28" rx="6" fill="rgba(8, 10, 20, 0.95)" stroke="#ef4444" strokeWidth="1.2" filter="url(#glow)">
                <animate attributeName="stroke" dur="6s" begin="0s" repeatCount="indefinite" values="#ef4444; #ef4444; #8b5cf6; #10b981; #10b981" keyTimes="0; 0.35; 0.5; 0.65; 1" />
              </rect>
              
              {/* Database cylinder icon with animated color */}
              <g transform="translate(-5, 0)">
                <ellipse cx="-20" cy="-5" rx="5" ry="1.6" fill="none" stroke="#ef4444" strokeWidth="0.9">
                  <animate attributeName="stroke" dur="6s" begin="0s" repeatCount="indefinite" values="#ef4444; #ef4444; #c084fc; #34d399; #34d399" keyTimes="0; 0.35; 0.5; 0.65; 1" />
                </ellipse>
                <path d="M -25,-5 v 5 C -25,1.2 -22.8,2 -20,2 C -17.2,2 -15,1.2 -15,0.8 v -5" fill="none" stroke="#ef4444" strokeWidth="0.9">
                  <animate attributeName="stroke" dur="6s" begin="0s" repeatCount="indefinite" values="#ef4444; #ef4444; #c084fc; #34d399; #34d399" keyTimes="0; 0.35; 0.5; 0.65; 1" />
                </path>
                <path d="M -25,0 v 5 C -25,6.2 -22.8,7 -20,7 C -17.2,7 -15,6.2 -15,5.8 v -5" fill="none" stroke="#ef4444" strokeWidth="0.9">
                  <animate attributeName="stroke" dur="6s" begin="0s" repeatCount="indefinite" values="#ef4444; #ef4444; #c084fc; #34d399; #34d399" keyTimes="0; 0.35; 0.5; 0.65; 1" />
                </path>
              </g>
              
              {/* Tag Title with animated color */}
              <text x="14" y="3" fill="#f87171" fontSize="8.5" fontWeight="900" textAnchor="middle" fontFamily="var(--font-mono)">
                <animate attributeName="fill" dur="6s" begin="0s" repeatCount="indefinite" values="#f87171; #f87171; #e9d5ff; #34d399; #34d399" keyTimes="0; 0.35; 0.5; 0.65; 1" />
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
              <rect x="-40" y="-14" width="80" height="28" rx="6" fill="rgba(8, 10, 20, 0.95)" stroke="#ef4444" strokeWidth="1.2" filter="url(#glow)">
                <animate attributeName="stroke" dur="6s" begin="2s" repeatCount="indefinite" values="#ef4444; #ef4444; #8b5cf6; #10b981; #10b981" keyTimes="0; 0.35; 0.5; 0.65; 1" />
              </rect>
              
              {/* Web browser monitor icon with animated color */}
              <g transform="translate(-5, 0)">
                <rect x="-25" y="-8" width="11" height="9" rx="1.5" fill="none" stroke="#ef4444" strokeWidth="0.9">
                  <animate attributeName="stroke" dur="6s" begin="2s" repeatCount="indefinite" values="#ef4444; #ef4444; #c084fc; #34d399; #34d399" keyTimes="0; 0.35; 0.5; 0.65; 1" />
                </rect>
                <path d="M -20,1 v 4 M -23,5 h 6" stroke="#ef4444" strokeWidth="0.9">
                  <animate attributeName="stroke" dur="6s" begin="2s" repeatCount="indefinite" values="#ef4444; #ef4444; #c084fc; #34d399; #34d399" keyTimes="0; 0.35; 0.5; 0.65; 1" />
                </path>
              </g>
              
              {/* Tag Title with animated color */}
              <text x="14" y="3" fill="#f87171" fontSize="8.5" fontWeight="900" textAnchor="middle" fontFamily="var(--font-mono)">
                <animate attributeName="fill" dur="6s" begin="2s" repeatCount="indefinite" values="#f87171; #f87171; #e9d5ff; #34d399; #34d399" keyTimes="0; 0.35; 0.5; 0.65; 1" />
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
              <rect x="-40" y="-14" width="80" height="28" rx="6" fill="rgba(8, 10, 20, 0.95)" stroke="#ef4444" strokeWidth="1.2" filter="url(#glow)">
                <animate attributeName="stroke" dur="6s" begin="4s" repeatCount="indefinite" values="#ef4444; #ef4444; #f59e0b; #ef4444; #ef4444" keyTimes="0; 0.35; 0.52; 0.7; 1" />
                <animate attributeName="fill" dur="6s" begin="4s" repeatCount="indefinite" values="rgba(8, 10, 20, 0.95);rgba(8, 10, 20, 0.95);rgba(239, 68, 68, 0.18);rgba(239, 68, 68, 0.08);rgba(8, 10, 20, 0.95)" keyTimes="0; 0.35; 0.52; 0.7; 1" />
              </rect>
              
              {/* Disk Stack Icon with alert animation */}
              <g transform="translate(-5, 0)">
                <ellipse cx="-20" cy="-5" rx="5" ry="1.6" fill="none" stroke="#ef4444" strokeWidth="0.9">
                  <animate attributeName="stroke" dur="6s" begin="4s" repeatCount="indefinite" values="#ef4444; #ef4444; #f59e0b; #ef4444; #ef4444" keyTimes="0; 0.35; 0.52; 0.7; 1" />
                </ellipse>
                <path d="M -25,-5 v 5 C -25,1.2 -22.8,2 -20,2 C -17.2,2 -15,1.2 -15,0.8 v -5" fill="none" stroke="#ef4444" strokeWidth="0.9">
                  <animate attributeName="stroke" dur="6s" begin="4s" repeatCount="indefinite" values="#ef4444; #ef4444; #f59e0b; #ef4444; #ef4444" keyTimes="0; 0.35; 0.52; 0.7; 1" />
                </path>
              </g>
              
              {/* Alternating Text Layers based on travel position */}
              
              {/* Outgoing stage: LEGACY-SAN */}
              <text x="14" y="3" fill="#f87171" fontSize="8" fontWeight="900" textAnchor="middle" fontFamily="var(--font-mono)">
                <animate attributeName="opacity" dur="6s" begin="4s" repeatCount="indefinite" values="1;1;0;0;0;0" keyTimes="0; 0.35; 0.4; 0.7; 0.75; 1" />
                LEGACY-SAN
              </text>
              
              {/* Auditing Core stage: AUDIT FAIL */}
              <text x="14" y="3" fill="#ef4444" fontSize="8" fontWeight="900" textAnchor="middle" fontFamily="var(--font-mono)">
                <animate attributeName="opacity" dur="6s" begin="4s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0; 0.35; 0.4; 0.68; 0.72; 1" />
                <animate attributeName="fill" dur="6s" begin="4s" repeatCount="indefinite" values="#ef4444;#f59e0b;#ef4444" keyTimes="0; 0.5; 1" />
                AUDIT FAIL
              </text>
              
              {/* Return stage: REJECTED */}
              <text x="14" y="3" fill="#f87171" fontSize="8" fontWeight="900" textAnchor="middle" fontFamily="var(--font-mono)">
                <animate attributeName="opacity" dur="6s" begin="4s" repeatCount="indefinite" values="0;0;0;0;1;1" keyTimes="0; 0.68; 0.72; 0.8; 0.85; 1" />
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
          </svg>
          
          <div className="hero-description-group" style={{ maxWidth: '500px', marginTop: '1.5rem', marginBottom: '1.5rem', textAlign: 'center' }}>
            <p className="text-muted" style={{ fontSize: '0.95rem', lineHeight: '1.5', margin: '0 0 0.8rem 0' }}>
              The platform turns RVTools exports, backup evidence, configuration data and Proxmox target information into a comprehensive VMware → Proxmox readiness audit report.
            </p>
            <p className="text-muted" style={{ fontSize: '0.95rem', lineHeight: '1.5', margin: 0 }}>
              It analyzes the migration from multiple angles: workload risk, infrastructure sizing, backup gaps, storage and network complexity, missing evidence, migration waves, no-go items and executive decision criteria.
            </p>
          </div>

          <div className="hero-actions">
            <button onClick={onOpenScanner} className="btn btn-primary btn-glow">
              Audit Your Cluster
              <ArrowRight size={18} />
            </button>
            <button onClick={() => scrollToSection('savings')} className="btn btn-secondary">
              Calculate Savings
              <DollarSign size={18} className="text-cyan" />
            </button>
          </div>
        </div>
      </div>

      {/* Transition Callout Bar */}
      <div className="hero-bottom-callout">
        <div className="hero-callout-info">
          <span className="hero-callout-tag">Migration Assurance</span>
          <p className="hero-callout-text">
            Before you migrate, quote, or deliver a Proxmox project, get a clear audit-style report that shows what <span className="highlight-ready">looks ready</span>, what <span className="highlight-validation">needs validation</span>, and what <span className="highlight-danger">should not move yet</span>.
          </p>
        </div>
        
        <div className="hero-callout-card">
          <div className="hero-callout-card-title">
            <div className="hero-callout-card-dot"></div>
            <span className="hero-callout-card-label">100% Agentless Security</span>
          </div>
          <div className="hero-callout-list">
            <div className="hero-callout-item">
              <div className="callout-icon-box check-animated-1">
                <Check size={12} className="check-svg" />
              </div>
              <div className="item-text">
                <strong className="text-white">Start with RVTools</strong>
                <span className="text-muted-sm">Simply upload your VMware config export</span>
              </div>
            </div>
            <div className="hero-callout-item">
              <div className="callout-icon-box check-animated-2">
                <Check size={12} className="check-svg" />
              </div>
              <div className="item-text">
                <strong className="text-white">No Agents Required</strong>
                <span className="text-muted-sm">Zero performance impact on VM hosts</span>
              </div>
            </div>
            <div className="hero-callout-item">
              <div className="callout-icon-box check-animated-3">
                <Check size={12} className="check-svg" />
              </div>
              <div className="item-text">
                <strong className="text-white">Zero Credentials & Production Access</strong>
                <span className="text-muted-sm">Audit your cluster with zero data exposure risk</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);
}
