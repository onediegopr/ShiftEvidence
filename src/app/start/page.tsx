import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Start Assessment",
  description: "Start a Shift Evidence assessment.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function StartAssessmentPage() {
  redirect("/sign-up");
}
