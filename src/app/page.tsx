import type { Metadata } from "next";
import LandingPage from "../views/LandingPage";

export const metadata: Metadata = {
  title: "Shift Evidence | VMware to Proxmox readiness",
  description:
    "Shift Evidence helps you understand cost, risk and architecture before moving from VMware to Proxmox.",
  alternates: {
    canonical: "https://www.shiftevidence.com/",
  },
};

export default function Page() {
  return <LandingPage />;
}
