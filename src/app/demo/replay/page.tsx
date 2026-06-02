import type { Metadata } from "next";
import MigrationReadinessReplay from "../../../components/demo/MigrationReadinessReplay";

export const metadata: Metadata = {
  title: "Migration Readiness Replay | Shift Evidence",
  description:
    "Watch a synthetic no-login simulation showing how VMware evidence becomes a Proxmox readiness decision pack.",
  alternates: {
    canonical: "https://shiftevidence.com/demo/replay",
  },
};

export default function DemoReplayPage() {
  return <MigrationReadinessReplay />;
}
