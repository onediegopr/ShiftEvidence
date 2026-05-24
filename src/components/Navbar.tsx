import { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';

interface NavbarProps {
  onOpenScanner: () => void;
}

export default function Navbar({ onOpenScanner }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`navbar-wrapper ${isScrolled ? 'navbar-scrolled' : ''}`}>
      <div className="container navbar-container">
        <a href="#" className="logo-container">
          <svg
            width="32"
            height="32"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ overflow: 'visible' }}
          >
            {/* Proxmox-ish cyan circle */}
            <circle cx="12" cy="16" r="8" fill="none" stroke="#06b6d4" strokeWidth="2.5" />
            {/* Shift path */}
            <path
              d="M12 16H24M24 16L20 12M24 16L20 20"
              stroke="#8b5cf6"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="logo-shift-icon"
            />
            {/* VMware-ish orange ring on background */}
            <circle cx="12" cy="16" r="12" fill="none" stroke="rgba(239, 68, 68, 0.2)" strokeWidth="1" strokeDasharray="3 3" />
          </svg>
          <span>
            InfraShift<span className="text-cyan">.</span>
          </span>
        </a>

        <nav>
          <ul className="nav-links">
            <li>
              <a href="#savings" className="nav-link">
                Savings Calculator
              </a>
            </li>
            <li>
              <a href="#features" className="nav-link">
                Core Features
              </a>
            </li>
            <li>
              <a href="#comparison" className="nav-link">
                VMware vs Proxmox
              </a>
            </li>
            <li>
              <a href="#process" className="nav-link">
                Migration Pipeline
              </a>
            </li>
            <li>
              <button 
                onClick={onOpenScanner}
                className="btn btn-secondary"
                style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
              >
                Scan Cluster
              </button>
            </li>
            <li>
              <button onClick={onOpenScanner} className="btn btn-primary btn-glow" style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}>
                Run Free Audit
                <ArrowRight size={14} />
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
