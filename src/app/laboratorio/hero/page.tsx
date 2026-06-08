import type { Metadata } from "next";
import { HeroLabPage } from "../../../components/heroLab/HeroLabPage";

type HeroLaboratoryPageProps = {
  searchParams?: Promise<{ capture?: string }> | { capture?: string };
};

export const metadata: Metadata = {
  title: "Hero Lab Preview",
  description: "Prototype landing hero visual for VMware to Proxmox readiness assessment positioning.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function HeroLaboratoryPage({ searchParams }: HeroLaboratoryPageProps) {
  const query = await Promise.resolve(searchParams);
  const captureMode = query?.capture === "1";

  return <HeroLabPage captureMode={captureMode} />;
}
