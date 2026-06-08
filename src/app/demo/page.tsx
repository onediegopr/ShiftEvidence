import type { Metadata } from "next";
import DemoHubPage from "../../components/demo/DemoHubPage";

export const metadata: Metadata = {
  title: "Demos | Shift Evidence",
  description:
    "Choose a quick simulation or a read-only synthetic Demo Workspace before purchasing Shift Evidence.",
  alternates: {
    canonical: "https://www.shiftevidence.com/demo",
  },
};

export default function DemoPage() {
  return <DemoHubPage />;
}
