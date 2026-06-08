import type { Metadata } from "next";
import DemoWorkspacePage from "../../../components/demo/DemoWorkspacePage";

export const metadata: Metadata = {
  title: "Demo Workspace | Shift Evidence",
  description:
    "Explore a read-only synthetic VMware to Proxmox Demo Workspace with scenarios, scores and demo PDFs.",
  alternates: {
    canonical: "https://shiftevidence.com/demo/workspace",
  },
};

export default function DemoWorkspaceRoutePage() {
  return <DemoWorkspacePage />;
}
