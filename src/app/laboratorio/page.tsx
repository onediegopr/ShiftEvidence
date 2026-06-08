import type { Metadata } from "next";
import { MigrationReadinessLab } from "../../components/lab/MigrationReadinessLab";

type LaboratorioPageProps = {
  searchParams?: Promise<{ capture?: string }> | { capture?: string };
};

export const metadata: Metadata = {
  title: "Migration Readiness Lab",
  description: "See how raw VMware evidence becomes a Proxmox migration decision pack.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function LaboratorioPage({ searchParams }: LaboratorioPageProps) {
  const query = await Promise.resolve(searchParams);
  const captureMode = query?.capture === "1";

  return <MigrationReadinessLab captureMode={captureMode} />;
}
