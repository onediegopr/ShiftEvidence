import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Reset access to a Shift Evidence account.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function ResetPasswordLayout({ children }: { children: ReactNode }) {
  return children;
}
