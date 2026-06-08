import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Client Login",
  description: "Client login redirect for Shift Evidence.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function ClientLoginLayout({ children }: { children: ReactNode }) {
  return children;
}
