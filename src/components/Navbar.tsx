"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { LogIn, Menu, Sparkles, X } from "lucide-react";
import { BRAND_PUBLIC_ASSETS, BRAND_WORDMARK } from "../lib/brandAssets";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
      <div className={`container navbar-container ${isMenuOpen ? "navbar-container-open" : ""}`}>
        <Link href="/" className="logo-container" onClick={() => setIsMenuOpen(false)}>
          <Image
            src={BRAND_PUBLIC_ASSETS.webLogo}
            alt={`${BRAND_WORDMARK} Logo`}
            width={40}
            height={40}
            className="nav-brand-logo"
            priority
          />
          <span>{BRAND_WORDMARK}</span>
        </Link>

        <button
          type="button"
          className="navbar-menu-toggle"
          aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={isMenuOpen}
          aria-controls="site-navigation"
          onClick={() => setIsMenuOpen((current) => !current)}
        >
          {isMenuOpen ? <X size={18} /> : <Menu size={18} />}
          <span>Menu</span>
        </button>

        <nav id="site-navigation" aria-label="Primary navigation">
          <ul className="nav-links">
            <li>
              <Link href="/" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                Product
              </Link>
            </li>
            <li>
              <Link href="/demo" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                Demo
              </Link>
            </li>
            <li>
              <Link href="/sample-report" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                Sample report
              </Link>
            </li>
            <li>
              <Link href="/pricing" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                Pricing
              </Link>
            </li>
            <li>
              <Link href="/partners" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                Partners
              </Link>
            </li>
            <li>
              <Link href="/about" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                About
              </Link>
            </li>
          </ul>
        </nav>

        <div className="navbar-actions">
          <Link href="/sign-up" className="nav-start-check" onClick={() => setIsMenuOpen(false)}>
            <Sparkles size={15} />
            Start assessment
          </Link>
          <Link href="/sign-in" className="nav-client-login" onClick={() => setIsMenuOpen(false)}>
            <LogIn size={15} />
            Client login
          </Link>
        </div>
      </div>
    </header>
  );
}
