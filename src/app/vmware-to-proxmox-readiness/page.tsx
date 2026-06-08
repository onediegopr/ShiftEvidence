import type { Metadata } from "next";
import GoogleAdsLandingV2 from "../../components/googleAdsLanding/GoogleAdsLandingV2";
import { JsonLd } from "../../components/seo/JsonLd";

const canonicalUrl = "https://shiftevidence.com/vmware-to-proxmox-readiness";

export const metadata: Metadata = {
  title: "VMware to Proxmox Migration Readiness Assessment",
  description:
    "Before leaving VMware, know what can break. Assess VMware to Proxmox migration risk with RVTools-based evidence review, readiness scoring, VM risk matrix and migration waves.",
  alternates: {
    canonical: canonicalUrl,
  },
  robots: {
    index: true,
    follow: true,
  },
};

const readinessServiceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  "@id": `${canonicalUrl}#service`,
  name: "Proxmox Migration Readiness",
  serviceType: "VMware to Proxmox migration readiness assessment",
  provider: {
    "@id": "https://shiftevidence.com/#organization",
  },
  url: canonicalUrl,
  description:
    "Evidence-based readiness assessment for VMware to Proxmox migration planning, using RVTools inventory, project context and supporting evidence before production changes.",
};

export default function VMwareToProxmoxReadinessPage() {
  return (
    <>
      <JsonLd data={readinessServiceSchema} id="shift-evidence-readiness-service-schema" />
      <GoogleAdsLandingV2 />
    </>
  );
}
