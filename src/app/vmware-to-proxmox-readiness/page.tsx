import type { Metadata } from "next";
import ShiftReadinessPage from "../../views/ShiftReadinessPage";

export const metadata: Metadata = {
  title: "VMware to Proxmox Readiness | Shift Evidence",
  description:
    "Before migrating VMware to Proxmox, use evidence-based readiness analysis to understand cost, risk, storage assumptions and migration blockers.",
  alternates: {
    canonical: "https://www.shiftevidence.com/vmware-to-proxmox-readiness",
  },
};

export default function VMwareToProxmoxReadinessPage() {
  return <ShiftReadinessPage />;
}
