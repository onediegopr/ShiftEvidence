import { headers } from "next/headers";
import Link from "next/link";
import { ArrowRight, Layers3, ShieldCheck, BarChart3, BookOpen, LogIn } from "lucide-react";
import { auth } from "../../lib/auth";
import SignOutButton from "../../components/auth/SignOutButton";
import { upsertUserProfileFromSession } from "../../server/user/userProfileService";
import { ensureDefaultWorkspace } from "../../server/workspace/workspaceService";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    await upsertUserProfileFromSession({
      userId: session.user.id,
      email: session.user.email,
      name: session.user.name,
      imageUrl: session.user.image ?? null,
      authProvider: "better-auth",
    });

    await ensureDefaultWorkspace({
      userId: session.user.id,
      userDisplayName: session.user.name,
    });
  }

  const name = session?.user?.name ?? "Readiness user";
  const email = session?.user?.email ?? "Connected account";

  return (
    <main className="dashboard-page">
      <section className="dashboard-hero glass-card">
        <div>
          <div className="badge badge-cyan">Dashboard</div>
          <h1>Welcome back, {name}.</h1>
          <p>{email}</p>
        </div>
        <SignOutButton className="btn btn-secondary dashboard-signout" />
      </section>

      <section className="dashboard-grid">
        <article className="glass-card dashboard-card">
          <Layers3 size={22} />
          <h2>Readiness workspace</h2>
          <p>Your private workspace for infrastructure readiness assessments.</p>
        </article>
        <article className="glass-card dashboard-card">
          <BarChart3 size={22} />
          <h2>Assessments</h2>
          <p>Create and manage VMware to Proxmox readiness assessments.</p>
          <Link href="/dashboard/assessments" className="dashboard-card-link">
            Open assessments <ArrowRight size={16} />
          </Link>
        </article>
        <article className="glass-card dashboard-card">
          <ShieldCheck size={22} />
          <h2>Cost / Risk Engine</h2>
          <p>Included in every assessment to estimate subscription delta, risk and complexity.</p>
        </article>
        <article className="glass-card dashboard-card">
          <BookOpen size={22} />
          <h2>Optional modules</h2>
          <p>Add Storage Destination Readiness only when target architecture needs deeper validation.</p>
        </article>
        <article className="glass-card dashboard-card">
          <LogIn size={22} />
          <h2>Reports</h2>
          <p>Free previews first. Paid reports later.</p>
        </article>
      </section>
    </main>
  );
}
