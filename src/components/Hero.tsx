import { Shield, ArrowRight, DollarSign } from 'lucide-react';

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

      <div className="container hero-grid">
        <div>
          <div className="badge">
            <Shield size={14} className="text-emerald" />
            100% Audited & Secure Migration
          </div>
          <h1 className="hero-title">
            Ditch VMware Licensing Hikes.<br />
            <span className="text-gradient">Shift to Proxmox</span><br />
            with Zero Risk.
          </h1>
          <p className="hero-description text-muted">
            The Broadcom VMware license increases are hitting enterprises hard. Infrashift automates
            pre-migration checks, configurations mapping, and zero-downtime cutovers to Proxmox VE.
            <strong> Save up to 80% on infrastructure overhead</strong> while assuring absolute safety.
          </p>
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

        <div className="hero-visual">
          <svg className="migration-flow-svg" viewBox="0 0 600 400" xmlns="http://www.w3.org/2000/svg" style={{ overflow: 'visible', width: '100%', maxWidth: '580px' }}>
            <defs>
              {/* Gradients */}
              <linearGradient id="vmwareGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f87171" />
                <stop offset="100%" stopColor="#ef4444" />
              </linearGradient>
              <linearGradient id="proxmoxGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#22d3ee" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
              <linearGradient id="shiftGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#c084fc" />
                <stop offset="100%" stopColor="#6366f1" />
              </linearGradient>
              <linearGradient id="tunnelGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(239, 68, 68, 0.3)" />
                <stop offset="50%" stopColor="rgba(139, 92, 246, 0.5)" />
                <stop offset="100%" stopColor="rgba(6, 182, 212, 0.3)" />
              </linearGradient>

              {/* Glow Filters */}
              <filter id="glow" x="-25%" y="-25%" width="150%" height="150%">
                <feGaussianBlur stdDeviation="5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Grid Pattern in SVG Background */}
            <path d="M 0,0 L 600,0 M 0,50 L 600,50 M 0,100 L 600,100 M 0,150 L 600,150 M 0,200 L 600,200 M 0,250 L 600,250 M 0,300 L 600,300 M 0,350 L 600,350" stroke="rgba(255,255,255,0.015)" strokeWidth="1" />
            <path d="M 0,0 L 0,400 M 50,0 L 50,400 M 100,0 L 100,400 M 150,0 L 150,400 M 200,0 L 200,400 M 250,0 L 250,400 M 300,0 L 300,400 M 350,0 L 350,400 M 400,0 L 400,400 M 450,0 L 450,400 M 500,0 L 500,400 M 550,0 L 550,400" stroke="rgba(255,255,255,0.015)" strokeWidth="1" />

            {/* Connection Migration Tunnel */}
            <path d="M 85,180 Q 300,70 515,180" fill="none" stroke="url(#tunnelGrad)" strokeWidth="10" strokeLinecap="round" />
            <path d="M 85,180 Q 300,70 515,180" fill="none" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="2.5" strokeDasharray="6 6" />

            {/* VMware Source Rack Enclosure (Bigger & Detailed) */}
            <g transform="translate(10, 100)">
              {/* Outer Enclosure */}
              <rect x="0" y="0" width="150" height="160" rx="10" fill="rgba(8, 10, 18, 0.95)" stroke="rgba(239, 68, 68, 0.5)" strokeWidth="1.5" />
              <rect x="0" y="0" width="150" height="160" rx="10" fill="none" stroke="#ef4444" strokeWidth="1.5" opacity="0.2" filter="url(#glow)" />
              
              {/* Vertical Side Rails */}
              <line x1="6" y1="0" x2="6" y2="160" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" />
              <line x1="144" y1="0" x2="144" y2="160" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" />

              {/* Header Titles */}
              <text x="75" y="18" fill="#ef4444" fontSize="10.5" fontWeight="900" textAnchor="middle" letterSpacing="0.08em">VMWARE CLUSTER</text>
              <text x="75" y="28" fill="rgba(255,255,255,0.4)" fontSize="7.5" fontWeight="600" textAnchor="middle">vSphere ESXi Nodes</text>
              
              {/* Server Blade 1 */}
              <g transform="translate(12, 38)">
                <rect x="0" y="0" width="126" height="32" rx="4" fill="#0f101a" stroke="rgba(239, 68, 68, 0.2)" strokeWidth="1" />
                
                {/* Animated Rotating Fan */}
                <g transform="translate(18, 16)">
                  <circle r="9" fill="none" stroke="rgba(239, 68, 68, 0.3)" strokeWidth="1" strokeDasharray="3 3" />
                  <path d="M -8,0 L 8,0 M 0,-8 L 0,8" stroke="rgba(239, 68, 68, 0.6)" strokeWidth="1.5" strokeLinecap="round">
                    <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="2s" repeatCount="indefinite" />
                  </path>
                </g>

                {/* Status LED */}
                <circle cx="36" cy="16" r="3" fill="#ef4444">
                  <animate attributeName="opacity" values="1;0.4;1" dur="1s" repeatCount="indefinite" />
                </circle>

                {/* Grid vents */}
                <line x1="48" y1="12" x2="100" y2="12" stroke="rgba(255,255,255,0.06)" strokeWidth="2" strokeDasharray="2 2" />
                <line x1="48" y1="20" x2="100" y2="20" stroke="rgba(255,255,255,0.06)" strokeWidth="2" strokeDasharray="2 2" />
                
                {/* Active interfaces */}
                <rect x="110" y="10" width="8" height="12" rx="1" fill="#ef4444" opacity="0.8" />
              </g>

              {/* Server Blade 2 */}
              <g transform="translate(12, 76)">
                <rect x="0" y="0" width="126" height="32" rx="4" fill="#0f101a" stroke="rgba(239, 68, 68, 0.2)" strokeWidth="1" />
                
                {/* Rotating Fan */}
                <g transform="translate(18, 16)">
                  <circle r="9" fill="none" stroke="rgba(239, 68, 68, 0.3)" strokeWidth="1" strokeDasharray="3 3" />
                  <path d="M -8,0 L 8,0 M 0,-8 L 0,8" stroke="rgba(239, 68, 68, 0.6)" strokeWidth="1.5" strokeLinecap="round">
                    <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="2s" repeatCount="indefinite" />
                  </path>
                </g>

                {/* Status LED */}
                <circle cx="36" cy="16" r="3" fill="#f59e0b">
                  <animate attributeName="opacity" values="0.4;1;0.4" dur="1.2s" repeatCount="indefinite" />
                </circle>

                {/* Vents */}
                <line x1="48" y1="12" x2="100" y2="12" stroke="rgba(255,255,255,0.06)" strokeWidth="2" strokeDasharray="2 2" />
                <line x1="48" y1="20" x2="100" y2="20" stroke="rgba(255,255,255,0.06)" strokeWidth="2" strokeDasharray="2 2" />
                
                {/* Interfaces */}
                <rect x="110" y="10" width="8" height="12" rx="1" fill="#f59e0b" opacity="0.8" />
              </g>

              {/* Server Blade 3 */}
              <g transform="translate(12, 114)">
                <rect x="0" y="0" width="126" height="32" rx="4" fill="#0f101a" stroke="rgba(239, 68, 68, 0.2)" strokeWidth="1" />
                
                {/* Rotating Fan */}
                <g transform="translate(18, 16)">
                  <circle r="9" fill="none" stroke="rgba(239, 68, 68, 0.3)" strokeWidth="1" strokeDasharray="3 3" />
                  <path d="M -8,0 L 8,0 M 0,-8 L 0,8" stroke="rgba(239, 68, 68, 0.6)" strokeWidth="1.5" strokeLinecap="round">
                    <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="2s" repeatCount="indefinite" />
                  </path>
                </g>

                {/* Status LED */}
                <circle cx="36" cy="16" r="3" fill="#ef4444">
                  <animate attributeName="opacity" values="1;0.4;1" dur="0.8s" repeatCount="indefinite" />
                </circle>

                {/* Vents */}
                <line x1="48" y1="12" x2="100" y2="12" stroke="rgba(255,255,255,0.06)" strokeWidth="2" strokeDasharray="2 2" />
                <line x1="48" y1="20" x2="100" y2="20" stroke="rgba(255,255,255,0.06)" strokeWidth="2" strokeDasharray="2 2" />
                
                {/* Interfaces */}
                <rect x="110" y="10" width="8" height="12" rx="1" fill="#ef4444" opacity="0.8" />
              </g>
            </g>

            {/* Proxmox Target Rack Enclosure (Bigger & Detailed) */}
            <g transform="translate(440, 100)">
              {/* Outer Enclosure */}
              <rect x="0" y="0" width="150" height="160" rx="10" fill="rgba(8, 10, 18, 0.95)" stroke="rgba(6, 182, 212, 0.5)" strokeWidth="1.5" />
              <rect x="0" y="0" width="150" height="160" rx="10" fill="none" stroke="#06b6d4" strokeWidth="1.5" opacity="0.2" filter="url(#glow)" />
              
              {/* Vertical Side Rails */}
              <line x1="6" y1="0" x2="6" y2="160" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" />
              <line x1="144" y1="0" x2="144" y2="160" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" />

              {/* Header Titles */}
              <text x="75" y="18" fill="#06b6d4" fontSize="10.5" fontWeight="900" textAnchor="middle" letterSpacing="0.08em">PROXMOX VE</text>
              <text x="75" y="28" fill="rgba(255,255,255,0.4)" fontSize="7.5" fontWeight="600" textAnchor="middle">KVM / LXC Cluster</text>
              
              {/* Server Blade 1 */}
              <g transform="translate(12, 38)">
                <rect x="0" y="0" width="126" height="32" rx="4" fill="#0b0e17" stroke="rgba(6, 182, 212, 0.2)" strokeWidth="1" />
                
                {/* Rotating Fan */}
                <g transform="translate(18, 16)">
                  <circle r="9" fill="none" stroke="rgba(6, 182, 212, 0.3)" strokeWidth="1" strokeDasharray="3 3" />
                  <path d="M -8,0 L 8,0 M 0,-8 L 0,8" stroke="rgba(6, 182, 212, 0.6)" strokeWidth="1.5" strokeLinecap="round">
                    <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="2s" repeatCount="indefinite" />
                  </path>
                </g>

                {/* Status LED */}
                <circle cx="36" cy="16" r="3" fill="#10b981">
                  <animate attributeName="opacity" values="1;0.4;1" dur="1.5s" repeatCount="indefinite" />
                </circle>

                {/* Vents */}
                <line x1="48" y1="12" x2="90" y2="12" stroke="rgba(255,255,255,0.06)" strokeWidth="2" strokeDasharray="2 2" />
                <line x1="48" y1="20" x2="90" y2="20" stroke="rgba(255,255,255,0.06)" strokeWidth="2" strokeDasharray="2 2" />
                
                {/* Ceph cluster storage indicators */}
                <circle cx="106" cy="16" r="2" fill="#06b6d4" />
                <circle cx="114" cy="16" r="2" fill="#10b981" />
              </g>

              {/* Server Blade 2 */}
              <g transform="translate(12, 76)">
                <rect x="0" y="0" width="126" height="32" rx="4" fill="#0b0e17" stroke="rgba(6, 182, 212, 0.2)" strokeWidth="1" />
                
                {/* Rotating Fan */}
                <g transform="translate(18, 16)">
                  <circle r="9" fill="none" stroke="rgba(6, 182, 212, 0.3)" strokeWidth="1" strokeDasharray="3 3" />
                  <path d="M -8,0 L 8,0 M 0,-8 L 0,8" stroke="rgba(6, 182, 212, 0.6)" strokeWidth="1.5" strokeLinecap="round">
                    <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="2s" repeatCount="indefinite" />
                  </path>
                </g>

                {/* Status LED */}
                <circle cx="36" cy="16" r="3" fill="#10b981">
                  <animate attributeName="opacity" values="0.4;1;0.4" dur="1s" repeatCount="indefinite" />
                </circle>

                {/* Vents */}
                <line x1="48" y1="12" x2="90" y2="12" stroke="rgba(255,255,255,0.06)" strokeWidth="2" strokeDasharray="2 2" />
                <line x1="48" y1="20" x2="90" y2="20" stroke="rgba(255,255,255,0.06)" strokeWidth="2" strokeDasharray="2 2" />
                
                {/* Ceph Storage */}
                <circle cx="106" cy="16" r="2" fill="#06b6d4" />
                <circle cx="114" cy="16" r="2" fill="#10b981" />
              </g>

              {/* Server Blade 3 */}
              <g transform="translate(12, 114)">
                <rect x="0" y="0" width="126" height="32" rx="4" fill="#0b0e17" stroke="rgba(6, 182, 212, 0.2)" strokeWidth="1" />
                
                {/* Rotating Fan */}
                <g transform="translate(18, 16)">
                  <circle r="9" fill="none" stroke="rgba(6, 182, 212, 0.3)" strokeWidth="1" strokeDasharray="3 3" />
                  <path d="M -8,0 L 8,0 M 0,-8 L 0,8" stroke="rgba(6, 182, 212, 0.6)" strokeWidth="1.5" strokeLinecap="round">
                    <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="2s" repeatCount="indefinite" />
                  </path>
                </g>

                {/* Status LED */}
                <circle cx="36" cy="16" r="3" fill="#10b981">
                  <animate attributeName="opacity" values="1;0.4;1" dur="1.2s" repeatCount="indefinite" />
                </circle>

                {/* Vents */}
                <line x1="48" y1="12" x2="90" y2="12" stroke="rgba(255,255,255,0.06)" strokeWidth="2" strokeDasharray="2 2" />
                <line x1="48" y1="20" x2="90" y2="20" stroke="rgba(255,255,255,0.06)" strokeWidth="2" strokeDasharray="2 2" />
                
                {/* Ceph Storage */}
                <circle cx="106" cy="16" r="2" fill="#06b6d4" />
                <circle cx="114" cy="16" r="2" fill="#10b981" />
              </g>
            </g>

            {/* Infrashift Validator Shield in middle (Bigger) */}
            <g transform="translate(250, 70)">
              <circle cx="50" cy="50" r="42" fill="rgba(6, 9, 19, 0.95)" stroke="url(#shiftGrad)" strokeWidth="2.2" filter="url(#glow)" />
              
              {/* Scan Line Laser Beam */}
              <line x1="20" y1="50" x2="80" y2="50" stroke="#06b6d4" strokeWidth="2" opacity="0.8">
                <animate attributeName="y1" values="25;75;25" dur="3s" repeatCount="indefinite" />
                <animate attributeName="y2" values="25;75;25" dur="3s" repeatCount="indefinite" />
              </line>

              {/* Shield Icon SVG */}
              <path 
                d="M50 30L68 36.5V51C68 62.25 60 72.85 50 75C40 72.85 32 62.25 32 51V36.5L50 30Z" 
                fill="none" 
                stroke="#10b981" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />
              {/* Checkmark inside shield */}
              <path 
                d="M44 52.5L48 56L56 48.5" 
                stroke="#10b981" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />
              <text x="50" y="90" fill="rgba(255,255,255,0.7)" fontSize="8.5" fontWeight="700" textAnchor="middle">VERIFIED</text>
            </g>

            {/* Animated Nodes Traveling (VMs migrating as cards - Bigger) */}
            
            {/* VM 1: DB workload */}
            <g>
              {/* Staging Dashboard Tag Container */}
              <rect x="-34" y="-12" width="68" height="24" rx="4" fill="rgba(6, 8, 16, 0.95)" stroke="#8b5cf6" strokeWidth="1.2" filter="url(#glow)" />
              
              {/* Database cylinder icon */}
              <ellipse cx="-22" cy="-5" rx="5" ry="1.8" fill="none" stroke="#a5b4fc" strokeWidth="0.9" />
              <path d="M -27,-5 v 4 c 0,1 2.2,1.8 5,1.8 s 5,-0.8 5,-1.8 v -4" fill="none" stroke="#a5b4fc" strokeWidth="0.9" />
              <path d="M -27,1 v 4 c 0,1 2.2,1.8 5,1.8 s 5,-0.8 5,-1.8 v -4" fill="none" stroke="#a5b4fc" strokeWidth="0.9" />
              
              {/* Tag Title */}
              <text x="10" y="3" fill="#a5b4fc" fontSize="8" fontWeight="800" textAnchor="middle" fontFamily="var(--font-mono)">PROD-DB</text>
              
              <animateMotion 
                path="M 85,180 Q 300,70 515,180" 
                dur="4.5s" 
                repeatCount="indefinite" 
                keyPoints="0;0.5;1"
                keyTimes="0;0.5;1"
              />
            </g>

            {/* VM 2: Web workload */}
            <g>
              {/* Tag Container */}
              <rect x="-34" y="-12" width="68" height="24" rx="4" fill="rgba(6, 8, 16, 0.95)" stroke="#06b6d4" strokeWidth="1.2" filter="url(#glow)" />
              
              {/* Web browser monitor icon */}
              <rect x="-27" y="-7" width="10" height="9" rx="1.5" fill="none" stroke="#22d3ee" strokeWidth="0.9" />
              <path d="M -22,2 L -22,5 M -25,5 L -19,5" stroke="#22d3ee" strokeWidth="0.9" />
              
              {/* Tag Title */}
              <text x="10" y="3" fill="#e0f2fe" fontSize="8" fontWeight="800" textAnchor="middle" fontFamily="var(--font-mono)">WEB-APP</text>
              
              <animateMotion 
                path="M 85,180 Q 300,70 515,180" 
                dur="4.5s" 
                begin="1.5s"
                repeatCount="indefinite" 
                keyPoints="0;0.5;1"
                keyTimes="0;0.5;1"
              />
            </g>

            {/* VM 3: API Gateway workload */}
            <g>
              {/* Tag Container */}
              <rect x="-34" y="-12" width="68" height="24" rx="4" fill="rgba(6, 8, 16, 0.95)" stroke="#c084fc" strokeWidth="1.2" filter="url(#glow)" />
              
              {/* Connected node cluster icon */}
              <circle cx="-25" cy="-2" r="1.5" fill="#f3e8ff" />
              <circle cx="-20" cy="-6" r="1.5" fill="#f3e8ff" />
              <circle cx="-20" cy="2" r="1.5" fill="#f3e8ff" />
              <line x1="-25" y1="-2" x2="-20" y2="-6" stroke="#f3e8ff" strokeWidth="0.7" />
              <line x1="-25" y1="-2" x2="-20" y2="2" stroke="#f3e8ff" strokeWidth="0.7" />
              
              {/* Tag Title */}
              <text x="10" y="3" fill="#f3e8ff" fontSize="8" fontWeight="800" textAnchor="middle" fontFamily="var(--font-mono)">API-GW</text>
              
              <animateMotion 
                path="M 85,180 Q 300,70 515,180" 
                dur="4.5s" 
                begin="3s"
                repeatCount="indefinite" 
                keyPoints="0;0.5;1"
                keyTimes="0;0.5;1"
              />
            </g>
          </svg>
        </div>
      </div>
    </section>
  );
}
