import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Password Recovery",
  description: "Recover access to a Shift Evidence account.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function ForgotPasswordLayout({ children }: { children: ReactNode }) {
  return children;
}
