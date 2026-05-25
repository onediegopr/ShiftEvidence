import { useState, useEffect } from "react";
export default function Navbar() {
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
          <svg
            width="40"
            height="40"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="nav-brand-logo"
            aria-hidden="true"
          >
            <circle
              cx="12"
              cy="16"
              r="8"
              fill="none"
              stroke="#06b6d4"
              strokeWidth="2.5"
            />
            <path
              d="M12 16H24M24 16L20 12M24 16L20 20"
              stroke="#8b5cf6"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
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
          </ul>
        </nav>
      </div>
    </header>
  );
}
