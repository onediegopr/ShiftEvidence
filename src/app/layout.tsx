import type { Metadata } from "next";
import type { ReactNode } from "react";
import { BRAND_PUBLIC_ASSETS, BRAND_WORDMARK } from "../lib/brandAssets";
import "../index.css";

export const metadata: Metadata = {
  title: BRAND_WORDMARK,
  description: "Infrastructure readiness before you migrate.",
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
      <body>{children}</body>
    </html>
  );
}
