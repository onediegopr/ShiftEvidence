import type { Metadata } from "next";
import type { ReactNode } from "react";
import { GoogleTag } from "../components/analytics/GoogleTag";
import { StructuredData } from "../components/seo/StructuredData";
import { BRAND_PUBLIC_ASSETS, BRAND_WORDMARK } from "../lib/brandAssets";
import "../index.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.shiftevidence.com"),
  title: BRAND_WORDMARK,
  description: "Infrastructure readiness before you migrate.",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: BRAND_PUBLIC_ASSETS.favicon },
      { url: BRAND_PUBLIC_ASSETS.appIcon, type: "image/png", sizes: "512x512" },
    ],
    shortcut: BRAND_PUBLIC_ASSETS.favicon,
    apple: [{ url: BRAND_PUBLIC_ASSETS.appleIcon, type: "image/png", sizes: "180x180" }],
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
        <GoogleTag />
        <StructuredData />
        {children}
      </body>
    </html>
  );
}
