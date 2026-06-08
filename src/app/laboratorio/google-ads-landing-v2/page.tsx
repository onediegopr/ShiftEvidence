import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Google Ads Landing V2 Lab Redirect",
  description:
    "Redirects to the published VMware to Proxmox readiness landing page.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function GoogleAdsLandingV2LabPage() {
  redirect("/vmware-to-proxmox-readiness");
}
