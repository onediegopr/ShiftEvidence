import type { Metadata } from "next";
import DemoWorkspacePage from "../../components/demo/DemoWorkspacePage";

export const metadata: Metadata = {
  title: "Demo Workspace | Shift Evidence",
  description:
    "Explore a read-only synthetic VMware to Proxmox Demo Workspace before purchasing Shift Evidence.",
  alternates: {
    canonical: "https://shiftevidence.com/demo",
  },
};

export default function DemoPage() {
  return <DemoWorkspacePage />;
}
