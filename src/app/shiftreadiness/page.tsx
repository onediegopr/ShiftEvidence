import type { Metadata } from "next";
import ShiftReadinessPage from "../../views/ShiftReadinessPage";

export const metadata: Metadata = {
  title: "ShiftReadiness | Infrastructure readiness before you migrate",
  description:
    "ShiftReadiness helps teams assess VMware to Proxmox cost, risk and target architecture before they migrate.",
  alternates: {
    canonical: "https://www.shiftevidence.com/shiftreadiness",
  },
};

export default function Page() {
  return <ShiftReadinessPage />;
}
