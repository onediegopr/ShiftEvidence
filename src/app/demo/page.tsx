import type { Metadata } from "next";
import MigrationReadinessReplay from "../../components/demo/MigrationReadinessReplay";

export const metadata: Metadata = {
  title: "Migration Readiness Replay | Shift Evidence",
  description:
    "Watch a simulated VMware to Proxmox readiness replay and see how evidence becomes a migration decision pack.",
  alternates: {
    canonical: "https://shiftevidence.com/demo",
  },
};

export default function DemoPage() {
  return <MigrationReadinessReplay />;
}
