import type { Metadata } from "next";
import SampleReportPage from "../../components/sample-report/SampleReportPage";

export const metadata: Metadata = {
  title: "Sample Readiness Report | Shift Evidence",
  description:
    "Preview a synthetic VMware to Proxmox readiness report: scores, evidence gaps, VM risk matrix, sizing, waves and AI Advisory notes.",
  alternates: {
    canonical: "https://shiftevidence.com/sample-report",
  },
};

export default function PublicSampleReportPage() {
  return <SampleReportPage />;
}
