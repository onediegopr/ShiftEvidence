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
          <svg className="migration-flow-svg" viewBox="0 0 500 400" xmlns="http://www.w3.org/2000/svg" style={{ overflow: 'visible' }}>
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
                <stop offset="0%" stopColor="rgba(239, 68, 68, 0.25)" />
                <stop offset="50%" stopColor="rgba(139, 92, 246, 0.45)" />
                <stop offset="100%" stopColor="rgba(6, 182, 212, 0.25)" />
              </linearGradient>

              {/* Glow Filters */}
              <filter id="glow" x="-25%" y="-25%" width="150%" height="150%">
                <feGaussianBlur stdDeviation="5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Grid Pattern in SVG Background */}
            <path d="M 0,0 L 500,0 M 0,50 L 500,50 M 0,100 L 500,100 M 0,150 L 500,150 M 0,200 L 500,200 M 0,250 L 500,250 M 0,300 L 500,300 M 0,350 L 500,350" stroke="rgba(255,255,255,0.015)" strokeWidth="1" />
            <path d="M 0,0 L 0,400 M 50,0 L 50,400 M 100,0 L 100,400 M 150,0 L 150,400 M 200,0 L 200,400 M 250,0 L 250,400 M 300,0 L 300,400 M 350,0 L 350,400 M 400,0 L 400,400 M 450,0 L 450,400" stroke="rgba(255,255,255,0.015)" strokeWidth="1" />

            {/* Connection Migration Tunnel */}
            <path d="M 80,200 Q 250,110 420,200" fill="none" stroke="url(#tunnelGrad)" strokeWidth="8" strokeLinecap="round" />
            <path d="M 80,200 Q 250,110 420,200" fill="none" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="2" strokeDasharray="5 5" />

            {/* VMware Source Rack Enclosure */}
            <g transform="translate(20, 140)">
              {/* Outer Enclosure */}
              <rect x="0" y="0" width="120" height="120" rx="10" fill="rgba(10, 12, 22, 0.9)" stroke="rgba(239, 68, 68, 0.4)" strokeWidth="1.5" />
              <rect x="0" y="0" width="120" height="120" rx="10" fill="none" stroke="#ef4444" strokeWidth="1.2" opacity="0.2" filter="url(#glow)" />
              
              {/* Header Titles */}
              <text x="60" y="20" fill="#ef4444" fontSize="10" fontWeight="800" textAnchor="middle" letterSpacing="0.05em">VMWARE</text>
              <text x="60" y="31" fill="rgba(255,255,255,0.4)" fontSize="7" fontWeight="600" textAnchor="middle">vSphere Cluster</text>
              
              {/* Server Blade 1 */}
              <g transform="translate(10, 42)">
                <rect x="0" y="0" width="100" height="18" rx="3" fill="#13141f" stroke="rgba(239, 68, 68, 0.15)" strokeWidth="1" />
                <circle cx="10" cy="9" r="2.5" fill="#ef4444">
                  <animate attributeName="opacity" values="1;0.4;1" dur="1s" repeatCount="indefinite" />
                </circle>
                <line x1="20" y1="9" x2="80" y2="9" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" strokeDasharray="2 2" />
                <rect x="86" y="6" width="6" height="6" fill="#ef4444" opacity="0.7" />
              </g>

              {/* Server Blade 2 */}
              <g transform="translate(10, 66)">
                <rect x="0" y="0" width="100" height="18" rx="3" fill="#13141f" stroke="rgba(239, 68, 68, 0.15)" strokeWidth="1" />
                <circle cx="10" cy="9" r="2.5" fill="#f59e0b">
                  <animate attributeName="opacity" values="0.4;1;0.4" dur="1.2s" repeatCount="indefinite" />
                </circle>
                <line x1="20" y1="9" x2="80" y2="9" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" strokeDasharray="2 2" />
                <rect x="86" y="6" width="6" height="6" fill="#f59e0b" opacity="0.7" />
              </g>

              {/* Server Blade 3 */}
              <g transform="translate(10, 90)">
                <rect x="0" y="0" width="100" height="18" rx="3" fill="#13141f" stroke="rgba(239, 68, 68, 0.15)" strokeWidth="1" />
                <circle cx="10" cy="9" r="2.5" fill="#ef4444">
                  <animate attributeName="opacity" values="1;0.4;1" dur="0.8s" repeatCount="indefinite" />
                </circle>
                <line x1="20" y1="9" x2="80" y2="9" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" strokeDasharray="2 2" />
                <rect x="86" y="6" width="6" height="6" fill="#ef4444" opacity="0.7" />
              </g>
            </g>

            {/* Proxmox Target Rack Enclosure */}
            <g transform="translate(360, 140)">
              {/* Outer Enclosure */}
              <rect x="0" y="0" width="120" height="120" rx="10" fill="rgba(10, 12, 22, 0.9)" stroke="rgba(6, 182, 212, 0.4)" strokeWidth="1.5" />
              <rect x="0" y="0" width="120" height="120" rx="10" fill="none" stroke="#06b6d4" strokeWidth="1.2" opacity="0.2" filter="url(#glow)" />
              
              {/* Header Titles */}
              <text x="60" y="20" fill="#06b6d4" fontSize="10" fontWeight="800" textAnchor="middle" letterSpacing="0.05em">PROXMOX VE</text>
              <text x="60" y="31" fill="rgba(255,255,255,0.4)" fontSize="7" fontWeight="600" textAnchor="middle">KVM / LXC Cluster</text>
              
              {/* Server Blade 1 */}
              <g transform="translate(10, 42)">
                <rect x="0" y="0" width="100" height="18" rx="3" fill="#0e131d" stroke="rgba(6, 182, 212, 0.15)" strokeWidth="1" />
                <circle cx="10" cy="9" r="2.5" fill="#10b981">
                  <animate attributeName="opacity" values="1;0.4;1" dur="1.5s" repeatCount="indefinite" />
                </circle>
                <line x1="20" y1="9" x2="75" y2="9" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" strokeDasharray="2 2" />
                <circle cx="84" cy="9" r="2" fill="#06b6d4" />
                <circle cx="91" cy="9" r="2" fill="#10b981" />
              </g>

              {/* Server Blade 2 */}
              <g transform="translate(10, 66)">
                <rect x="0" y="0" width="100" height="18" rx="3" fill="#0e131d" stroke="rgba(6, 182, 212, 0.15)" strokeWidth="1" />
                <circle cx="10" cy="9" r="2.5" fill="#10b981">
                  <animate attributeName="opacity" values="0.4;1;0.4" dur="1s" repeatCount="indefinite" />
                </circle>
                <line x1="20" y1="9" x2="75" y2="9" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" strokeDasharray="2 2" />
                <circle cx="84" cy="9" r="2" fill="#06b6d4" />
                <circle cx="91" cy="9" r="2" fill="#10b981" />
              </g>

              {/* Server Blade 3 */}
              <g transform="translate(10, 90)">
                <rect x="0" y="0" width="100" height="18" rx="3" fill="#0e131d" stroke="rgba(6, 182, 212, 0.15)" strokeWidth="1" />
                <circle cx="10" cy="9" r="2.5" fill="#10b981">
                  <animate attributeName="opacity" values="1;0.4;1" dur="1.2s" repeatCount="indefinite" />
                </circle>
                <line x1="20" y1="9" x2="75" y2="9" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" strokeDasharray="2 2" />
                <circle cx="84" cy="9" r="2" fill="#06b6d4" />
                <circle cx="91" cy="9" r="2" fill="#10b981" />
              </g>
            </g>

            {/* Infrashift Validator Shield in middle */}
            <g transform="translate(210, 80)">
              <circle cx="40" cy="40" r="34" fill="rgba(6, 9, 19, 0.95)" stroke="url(#shiftGrad)" strokeWidth="2" filter="url(#glow)" />
              
              {/* Scan Line Laser Beam */}
              <line x1="15" y1="40" x2="65" y2="40" stroke="#06b6d4" strokeWidth="1.5" opacity="0.8">
                <animate attributeName="y1" values="20;60;20" dur="3s" repeatCount="indefinite" />
                <animate attributeName="y2" values="20;60;20" dur="3s" repeatCount="indefinite" />
              </line>

              {/* Shield Icon SVG */}
              <path 
                d="M40 24L55 29.5V41C55 50.25 48.6 58.85 40 61C31.4 58.85 25 50.25 25 41V29.5L40 24Z" 
                fill="none" 
                stroke="#10b981" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />
              {/* Checkmark inside shield */}
              <path 
                d="M35 42.5L38.5 46L45 39.5" 
                stroke="#10b981" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />
              <text x="40" y="75" fill="rgba(255,255,255,0.7)" fontSize="8" fontWeight="600" textAnchor="middle">VERIFIED</text>
            </g>

            {/* Animated Nodes Traveling (VMs migrating as cards) */}
            
            {/* VM 1: DB workload */}
            <g>
              {/* Staging Dashboard Tag Container */}
              <rect x="-28" y="-10" width="56" height="20" rx="4" fill="rgba(8, 10, 18, 0.95)" stroke="#8b5cf6" strokeWidth="1.2" filter="url(#glow)" />
              
              {/* Database cylinder icon */}
              <ellipse cx="-19" cy="-4" rx="4" ry="1.5" fill="none" stroke="#a5b4fc" strokeWidth="0.8" />
              <path d="M -23,-4 v 3 c 0,0.8 1.8,1.2 4,1.2 s 4,-0.4 4,-1.2 v -3" fill="none" stroke="#a5b4fc" strokeWidth="0.8" />
              <path d="M -23,1 v 3 c 0,0.8 1.8,1.2 4,1.2 s 4,-0.4 4,-1.2 v -3" fill="none" stroke="#a5b4fc" strokeWidth="0.8" />
              
              {/* Tag Title */}
              <text x="8" y="3" fill="#a5b4fc" fontSize="7.5" fontWeight="700" textAnchor="middle" fontFamily="var(--font-mono)">PROD-DB</text>
              
              <animateMotion 
                path="M 80,200 Q 250,110 420,200" 
                dur="4.5s" 
                repeatCount="indefinite" 
                keyPoints="0;0.5;1"
                keyTimes="0;0.5;1"
              />
            </g>

            {/* VM 2: Web workload */}
            <g>
              {/* Tag Container */}
              <rect x="-28" y="-10" width="56" height="20" rx="4" fill="rgba(8, 10, 18, 0.95)" stroke="#06b6d4" strokeWidth="1.2" filter="url(#glow)" />
              
              {/* Web browser monitor icon */}
              <rect x="-23" y="-5" width="8" height="7" rx="1" fill="none" stroke="#22d3ee" strokeWidth="0.8" />
              <path d="M -20,2 L -20,4 M -21,4 L -19,4" stroke="#22d3ee" strokeWidth="0.8" />
              
              {/* Tag Title */}
              <text x="8" y="3" fill="#e0f2fe" fontSize="7.5" fontWeight="700" textAnchor="middle" fontFamily="var(--font-mono)">WEB-APP</text>
              
              <animateMotion 
                path="M 80,200 Q 250,110 420,200" 
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
              <rect x="-28" y="-10" width="56" height="20" rx="4" fill="rgba(8, 10, 18, 0.95)" stroke="#c084fc" strokeWidth="1.2" filter="url(#glow)" />
              
              {/* Connected node cluster icon */}
              <circle cx="-21" cy="-2" r="1" fill="#f3e8ff" />
              <circle cx="-16" cy="-5" r="1" fill="#f3e8ff" />
              <circle cx="-16" cy="1" r="1" fill="#f3e8ff" />
              <line x1="-21" y1="-2" x2="-16" y2="-5" stroke="#f3e8ff" strokeWidth="0.6" />
              <line x1="-21" y1="-2" x2="-16" y2="1" stroke="#f3e8ff" strokeWidth="0.6" />
              
              {/* Tag Title */}
              <text x="8" y="3" fill="#f3e8ff" fontSize="7.5" fontWeight="700" textAnchor="middle" fontFamily="var(--font-mono)">API-GW</text>
              
              <animateMotion 
                path="M 80,200 Q 250,110 420,200" 
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
