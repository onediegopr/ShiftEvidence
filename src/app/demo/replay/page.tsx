import type { Metadata } from "next";
import DemoReplayExperience from "../../../components/demoReplay/DemoReplayPage";

type DemoReplayPageProps = {
  searchParams?: Promise<{ capture?: string }> | { capture?: string };
};

export const metadata: Metadata = {
  title: "Migration Readiness Replay | Shift Evidence",
  description:
    "Watch a synthetic replay showing how VMware evidence becomes a Proxmox migration readiness decision pack.",
  alternates: {
    canonical: "https://shiftevidence.com/demo/replay",
  },
};

export default async function DemoReplayPage({ searchParams }: DemoReplayPageProps) {
  const query = await Promise.resolve(searchParams);
  const captureMode = query?.capture === "1";

  return <DemoReplayExperience captureMode={captureMode} />;
}
