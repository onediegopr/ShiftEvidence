import type { Metadata } from "next";
import GoogleAdsLandingV2 from "../../../components/googleAdsLanding/GoogleAdsLandingV2";

export const metadata: Metadata = {
  title: "Google Ads Landing V2 Lab",
  description:
    "Laboratory preview for a Google Ads-oriented VMware to Proxmox readiness landing page.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function GoogleAdsLandingV2LabPage() {
  return <GoogleAdsLandingV2 />;
}
