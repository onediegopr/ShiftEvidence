import type { Metadata } from "next";
import SampleReportPage from "../../components/sample-report/SampleReportPage";

export const metadata: Metadata = {
  title: "Premium Sample Readiness Report | Shift Evidence",
  description:
    "Preview a premium synthetic VMware to Proxmox readiness report: storage readiness, licensing exposure, continuity risk, advisor Q&A, memory decisions, VM matrix and migration waves.",
  alternates: {
    canonical: "https://shiftevidence.com/sample-report",
  },
};

export default function PublicSampleReportPage() {
  return <SampleReportPage />;
}
