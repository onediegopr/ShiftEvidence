import { useState, useEffect } from "react";
import { ArrowRight } from "lucide-react";
import vmwareLogo from "../../images/vmware.svg";

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

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={`navbar-wrapper ${isScrolled ? "navbar-scrolled" : ""}`}>
      <div className="container navbar-container">
        <a href="#" className="logo-container">
          <img src={vmwareLogo} alt="" className="nav-brand-logo" />
          <span>Shift Evidence</span>
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
                style={{ padding: "0.5rem 1.25rem", fontSize: "0.85rem" }}
              >
                Scan Cluster
              </button>
            </li>
            <li>
              <button
                onClick={onOpenScanner}
                className="btn btn-primary btn-glow"
                style={{ padding: "0.5rem 1.25rem", fontSize: "0.85rem" }}
              >
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
