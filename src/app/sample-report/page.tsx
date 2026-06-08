import type { Metadata } from "next";
import SampleReportPage from "../../components/sample-report/SampleReportPage";

export const metadata: Metadata = {
  title: "Premium Sample Readiness Report v3 | Shift Evidence",
  description:
    "Preview the latest premium synthetic VMware to Proxmox readiness report: storage readiness, licensing exposure, continuity risk, advisor Q&A, memory decisions, VM matrix and migration waves.",
  alternates: {
    canonical: "https://www.shiftevidence.com/sample-report",
  },
};

export default function PublicSampleReportPage() {
  return <SampleReportPage />;
}
