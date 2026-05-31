"use client";

import Link from "next/link";
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
        <Link href="/" className="logo-container">
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
        </Link>

        <nav>
          <ul className="nav-links">
            <li>
              <Link href="/#savings" className="nav-link">
                Savings Calculator
              </Link>
            </li>
            <li>
              <Link href="/#features" className="nav-link">
                Core Features
              </Link>
            </li>
            <li>
              <Link href="/#comparison" className="nav-link">
                VMware vs Proxmox
              </Link>
            </li>
            <li>
              <Link href="/#process" className="nav-link">
                Migration Pipeline
              </Link>
            </li>
          </ul>
        </nav>

        <div className="navbar-actions">
          <Link href="/client-login" className="nav-link">
            Client login
          </Link>
          <Link href="/sign-up" className="btn btn-secondary btn-sm shiftreadiness-nav-cta">
            Start Free Check
          </Link>
        </div>
      </div>
    </header>
  );
}
