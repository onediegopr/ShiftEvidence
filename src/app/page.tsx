import type { Metadata } from "next";
import { JsonLd } from "../components/seo/JsonLd";
import LandingPage from "../views/LandingPage";

export const metadata: Metadata = {
  title: "VMware to Proxmox Readiness Assessment",
  description:
    "Senior-grade VMware to Proxmox readiness before touching production. Turn RVTools inventory, storage destination evidence and project context into risk signals, evidence confidence, migration waves and decision-ready reports.",
  alternates: {
    canonical: "https://shiftevidence.com/",
  },
};

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  "@id": "https://shiftevidence.com/#proxmox-migration-readiness",
  name: "Proxmox Migration Readiness",
  serviceType: "VMware to Proxmox migration readiness assessment",
  provider: {
    "@id": "https://shiftevidence.com/#organization",
  },
  url: "https://shiftevidence.com/",
  description:
    "Evidence-based VMware to Proxmox readiness assessment and migration planning support before production migration.",
};

export default function Page() {
  return (
    <>
      <JsonLd data={serviceSchema} id="shift-evidence-home-service-schema" />
      <LandingPage />
    </>
  );
}
