import type { Metadata } from "next";
import type { ReactNode } from "react";
import { JsonLd } from "../components/seo/JsonLd";
import { BRAND_PUBLIC_ASSETS, BRAND_WORDMARK } from "../lib/brandAssets";
import "../index.css";

const SITE_URL = "https://shiftevidence.com";
const DEFAULT_TITLE = `${BRAND_WORDMARK} | Proxmox Migration Readiness`;
const DEFAULT_DESCRIPTION =
  "Senior-grade VMware to Proxmox readiness before production migration. Shift Evidence turns RVTools inventory, storage destination evidence and senior project context into an evidence-based migration decision pack.";
const OG_DESCRIPTION =
  "VMware to Proxmox readiness assessment based on real infrastructure evidence: risk signals, evidence confidence, migration waves and decision-ready reports.";
const BRAND_LOGO_URL = `${SITE_URL}${BRAND_PUBLIC_ASSETS.webLogo}`;

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: BRAND_WORDMARK,
  url: `${SITE_URL}/`,
  logo: BRAND_LOGO_URL,
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  name: BRAND_WORDMARK,
  url: `${SITE_URL}/`,
  publisher: {
    "@id": `${SITE_URL}/#organization`,
  },
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: DEFAULT_TITLE,
    template: `%s | ${BRAND_WORDMARK}`,
  },
  description: DEFAULT_DESCRIPTION,
  icons: {
    icon: [
      { url: BRAND_PUBLIC_ASSETS.favicon },
      { url: BRAND_PUBLIC_ASSETS.appIcon, type: "image/png", sizes: "512x512" },
    ],
    shortcut: BRAND_PUBLIC_ASSETS.favicon,
    apple: [{ url: BRAND_PUBLIC_ASSETS.appleIcon, type: "image/png", sizes: "180x180" }],
  },
  openGraph: {
    type: "website",
    siteName: BRAND_WORDMARK,
    locale: "en_US",
    url: SITE_URL,
    title: DEFAULT_TITLE,
    description: OG_DESCRIPTION,
    images: [
      {
        url: BRAND_PUBLIC_ASSETS.webLogo,
        alt: `${BRAND_WORDMARK} logo`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description: "Evidence-based VMware to Proxmox readiness assessment before touching production.",
    images: [BRAND_PUBLIC_ASSETS.webLogo],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <JsonLd data={[organizationSchema, websiteSchema]} id="shift-evidence-global-schema" />
        {children}
      </body>
    </html>
  );
}
