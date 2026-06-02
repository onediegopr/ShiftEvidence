"use client";

import Link from "next/link";
import Image from "next/image";
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
          <Image
            src="/brand/shift-evidence-icon-dark-transparent.png"
            alt="Shift Evidence Logo"
            width={40}
            height={40}
            className="nav-brand-logo"
            priority
          />
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
