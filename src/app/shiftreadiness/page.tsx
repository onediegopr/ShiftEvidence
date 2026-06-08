import type { Metadata } from "next";
import ShiftReadinessPage from "../../views/ShiftReadinessPage";

export const metadata: Metadata = {
  title: "ShiftReadiness Legacy Readiness Page",
  description:
    "ShiftReadiness helps teams assess VMware to Proxmox cost, risk and target architecture before they migrate.",
  alternates: {
    canonical: "https://shiftevidence.com/shiftreadiness",
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function Page() {
  return <ShiftReadinessPage />;
}
