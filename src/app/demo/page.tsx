import type { Metadata } from "next";
import DemoHubPage from "../../components/demo/DemoHubPage";

export const metadata: Metadata = {
  title: "Migration Readiness Demo",
  description:
    "Explore synthetic Shift Evidence demos for VMware to Proxmox readiness, replay walkthroughs and read-only evidence workspaces.",
  alternates: {
    canonical: "https://shiftevidence.com/demo",
  },
};

export default function DemoPage() {
  return <DemoHubPage />;
}
