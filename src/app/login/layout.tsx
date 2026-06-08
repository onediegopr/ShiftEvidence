import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Login",
  description: "Login redirect for Shift Evidence.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function LoginLayout({ children }: { children: ReactNode }) {
  return children;
}
