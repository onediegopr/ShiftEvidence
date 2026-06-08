import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Start Assessment",
  description: "Create a Shift Evidence workspace to start an assessment.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function SignUpLayout({ children }: { children: ReactNode }) {
  return children;
}
