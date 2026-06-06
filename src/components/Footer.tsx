"use client";

import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { BRAND_PUBLIC_ASSETS, BRAND_WORDMARK } from "../lib/brandAssets";

export default function Footer() {
  const [newsletterStatus, setNewsletterStatus] = useState<string | null>(null);
  const copy = {
    brand:
      "Enterprise-grade VMware to Proxmox readiness assessments. Evidence review, custom analysis, and data-loss risk guidance before migration.",
    product: "Product",
    demos: "Demos",
    commercial: "Commercial",
    trust: "Trust & Account",
    checklist: "Get Free Migration Checklist",
    stay: "Stay updated on license saving calculators and pre-migration scripts.",
    copyright: "All rights reserved.",
    bottom: "Open-source infrastructure. Enterprise-grade migration readiness.",
    legal:
      "Shift Evidence is an independent assessment service. It is not affiliated with, endorsed by or certified by VMware, Broadcom or Proxmox. VMware, Broadcom and Proxmox names may be trademarks of their respective owners and are used only to describe migration context and compatibility targets.",
  } as const;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setNewsletterStatus("Thank you. We will reach out with migration readiness resources shortly.");
  };

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link
              href="/"
              className="logo-container"
              style={{ marginBottom: "0.5rem" }}
            >
              <Image
                src={BRAND_PUBLIC_ASSETS.webLogo}
                alt={`${BRAND_WORDMARK} Logo`}
                width={28}
                height={28}
              />
              <span>{BRAND_WORDMARK}</span>
            </Link>
            <p style={{ fontSize: "0.85rem" }}>{copy.brand}</p>
          </div>

          <div className="footer-links-col">
            <h4 className="footer-links-title">{copy.product}</h4>
            <ul className="footer-links-list">
              <li>
                <Link href="/#problem-pain">How it works</Link>
              </li>
              <li>
                <Link href="/#sample-output">Sample output</Link>
              </li>
              <li>
                <Link href="/#licensing-calculator">Calculator</Link>
              </li>
              <li>
                <Link href="/#comparison">Comparison</Link>
              </li>
              <li>
                <Link href="/#faq">FAQ</Link>
              </li>
            </ul>
          </div>

          <div className="footer-links-col">
            <h4 className="footer-links-title">{copy.demos}</h4>
            <ul className="footer-links-list">
              <li>
                <Link href="/demo">Demo hub</Link>
              </li>
              <li>
                <Link href="/demo/replay">Replay demo</Link>
              </li>
              <li>
                <Link href="/demo/workspace">Demo workspace</Link>
              </li>
              <li>
                <Link href="/sample-report">Sample report</Link>
              </li>
            </ul>
          </div>

          <div className="footer-links-col">
            <h4 className="footer-links-title">{copy.commercial}</h4>
            <ul className="footer-links-list">
              <li>
                <Link href="/pricing">Pricing</Link>
              </li>
              <li>
                <Link href="/partners">Partners / MSP</Link>
              </li>
              <li>
                <Link href="/technical-review">Technical review</Link>
              </li>
              <li>
                <Link href="/support?category=billing_question">Billing support</Link>
              </li>
            </ul>
          </div>

          <div className="footer-links-col">
            <h4 className="footer-links-title">{copy.trust}</h4>
            <ul className="footer-links-list">
              <li>
                <Link href="/security">Security</Link>
              </li>
              <li>
                <Link href="/about">About</Link>
              </li>
              <li>
                <Link href="/support">Support</Link>
              </li>
              <li>
                <Link href="/contact">Contact</Link>
              </li>
              <li>
                <Link href="/sign-in">Client login</Link>
              </li>
            </ul>
          </div>

          <div className="footer-links-col">
            <h4 className="footer-links-title">{copy.checklist}</h4>
            <p style={{ fontSize: "0.85rem" }}>{copy.stay}</p>
            <form
              onSubmit={handleSubmit}
              className="cta-form"
              style={{ marginTop: "0.5rem", width: "100%", gap: "0.5rem" }}
            >
              <input
                type="email"
                name="workEmail"
                autoComplete="email"
                placeholder="you@company.com"
                required
                className="form-input"
                style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}
              />
              <button
                type="submit"
                className="btn btn-primary"
                style={{ padding: "0.5rem 1rem", borderRadius: "9999px" }}
                aria-label="Request migration readiness resources"
              >
                <ArrowRight size={16} />
              </button>
            </form>
            {newsletterStatus ? (
              <p className="auth-success" role="status" aria-live="polite" style={{ marginTop: "0.75rem" }}>
                {newsletterStatus}
              </p>
            ) : null}
          </div>
        </div>

        <div className="footer-bottom">
          <span>
            &copy; {new Date().getFullYear()} Shift Evidence. {copy.copyright}
          </span>
          <span>{copy.bottom}</span>
        </div>

        <div className="footer-legal">
          <p>{copy.legal}</p>
        </div>
      </div>
    </footer>
  );
}
