import type { Metadata } from "next";
import SampleReportPage from "../../components/sample-report/SampleReportPage";

export const metadata: Metadata = {
  title: "VMware to Proxmox Readiness Sample Report",
  description:
    "Download a synthetic sample report showing readiness score, evidence confidence, VM risk matrix, storage readiness, Advisor notes, guided questions and migration waves.",
  alternates: {
    canonical: "https://shiftevidence.com/sample-report",
  },
};

export default function PublicSampleReportPage() {
  return <SampleReportPage />;
}
