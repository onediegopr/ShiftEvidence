import type { Metadata } from "next";
import DemoWorkspacePage from "../../../components/demo/DemoWorkspacePage";

export const metadata: Metadata = {
  title: "Synthetic Readiness Workspace",
  description:
    "Read-only synthetic workspace preview for VMware to Proxmox readiness evidence and reports.",
  alternates: {
    canonical: "https://shiftevidence.com/demo/workspace",
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function DemoWorkspaceRoutePage() {
  return <DemoWorkspacePage />;
}
