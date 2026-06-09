"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { LogIn, Sparkles } from "lucide-react";
import { BRAND_PUBLIC_ASSETS, BRAND_WORDMARK } from "../lib/brandAssets";
import { trackStartAssessmentClick } from "../lib/analytics";

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
            src={BRAND_PUBLIC_ASSETS.webLogo}
            alt={`${BRAND_WORDMARK} Logo`}
            width={40}
            height={40}
            className="nav-brand-logo"
            priority
          />
          <span>{BRAND_WORDMARK}</span>
        </Link>

        <nav>
          <ul className="nav-links">
            <li>
              <Link href="/" className="nav-link">
                Product
              </Link>
            </li>
            <li>
              <Link href="/demo" className="nav-link">
                Demo
              </Link>
            </li>
            <li>
              <Link href="/sample-report" className="nav-link">
                Sample report
              </Link>
            </li>
            <li>
              <Link href="/pricing" className="nav-link">
                Pricing
              </Link>
            </li>
            <li>
              <Link href="/partners" className="nav-link">
                Partners
              </Link>
            </li>
            <li>
              <Link href="/about" className="nav-link">
                About
              </Link>
            </li>
          </ul>
        </nav>

        <div className="navbar-actions">
          <Link
            href="/sign-up"
            className="nav-start-check"
            onClick={() => trackStartAssessmentClick({ source: "navbar" })}
          >
            <Sparkles size={15} />
            Start assessment
          </Link>
          <Link href="/sign-in" className="nav-client-login">
            <LogIn size={15} />
            Client login
          </Link>
        </div>
      </div>
    </header>
  );
}
