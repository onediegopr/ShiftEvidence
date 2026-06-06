import { headers } from "next/headers";
import Link from "next/link";
import { ArrowRight, Plus, Layers3, ShieldCheck, BarChart3, FileText, ClipboardList, Database, LifeBuoy } from "lucide-react";
import { auth } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
import { upsertUserProfileFromSession } from "../../server/user/userProfileService";
import { ensureDefaultWorkspace } from "../../server/workspace/workspaceService";
import { listAssessmentsForCurrentWorkspace } from "../../server/assessments/assessmentService";
import { isAdminEmail } from "../../server/admin/adminAuth";
import { getLifecycleStatus } from "./assessments/page";
import { SUPPORT_CATEGORY_OPTIONS } from "../../server/support/supportConfig";
import { createDashboardSupportRequestAction } from "./support/actions";

type DashboardPageProps = {
  searchParams?: Promise<{ support?: string; supportError?: string }> | { support?: string; supportError?: string };
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const query = await Promise.resolve(searchParams);
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

  const assessments = session
    ? await listAssessmentsForCurrentWorkspace({
        userId: session.user.id,
      })
    : [];

  const name = session?.user?.name ?? "Readiness user";
  const email = session?.user?.email ?? "Connected account";
  const isAdmin = isAdminEmail(email);
  const supportSent = query?.support === "sent";
  const supportError = query?.supportError ? decodeURIComponent(query.supportError) : null;

  const userSupportRequests = session
    ? await prisma.supportRequest.findMany({
        where: {
          userId: session.user.id,
        },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          assessment: { select: { id: true, title: true } },
        },
      })
    : [];

  // Calculate statistics
  const totalAssessments = assessments.length;
  let activeEvidenceFilesCount = 0;
  let totalReportsCount = 0;

  assessments.forEach((assessment) => {
    activeEvidenceFilesCount += assessment.evidenceFiles.filter((file) => file.deletedAt === null).length;
    totalReportsCount += assessment.reports.filter((r) => r.deletedAt === null).length;
  });

  // Sort assessments by updatedAt desc and take the top 3
  const recentAssessments = [...assessments]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 3);

  return (
    <main className="dashboard-page">
      <section className="dashboard-hero glass-card">
        <div>
          <div className="badge badge-cyan">Workspace center</div>
          <h1>Welcome back, {name}.</h1>
          <p className="text-muted">Manage your infrastructure assessments, upload evidence and review readiness reports.</p>
        </div>
        <Link href="/dashboard/assessments/new" className="btn btn-primary btn-glow">
          <Plus size={16} />
          New assessment
        </Link>
      </section>

      {isAdmin && (
        <section className="dashboard-banner dashboard-banner-success" role="status" aria-live="polite" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <ClipboardList size={20} style={{ color: "#38bdf8" }} />
            <div>
              <strong style={{ color: "white" }}>Internal console active</strong>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-muted)" }}>
                You have administrative access to the internal operations center and manual requests.
              </p>
            </div>
          </div>
          <Link href="/dashboard/admin" className="btn btn-secondary btn-sm" style={{ border: "1px solid rgba(255, 255, 255, 0.15)", borderRadius: "6px" }}>
            Open internal console
          </Link>
        </section>
      )}

      {/* Workspace Statistics Grid */}
      <section className="assessment-summary-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        <article className="glass-card assessment-summary-card">
          <BarChart3 size={24} className="text-cyan" />
          <span className="assessment-summary-label">Assessments</span>
          <strong>{totalAssessments}</strong>
          <p>Total assessments in workspace</p>
        </article>
        <article className="glass-card assessment-summary-card">
          <ShieldCheck size={24} className="text-emerald" />
          <span className="assessment-summary-label">Evidence Files</span>
          <strong>{activeEvidenceFilesCount}</strong>
          <p>Active RVTools/CSV files uploaded</p>
        </article>
        <article className="glass-card assessment-summary-card">
          <FileText size={24} style={{ color: "#8b5cf6" }} />
          <span className="assessment-summary-label">Generated Reports</span>
          <strong>{totalReportsCount}</strong>
          <p>Readiness reports compiled</p>
        </article>
      </section>

      {supportSent ? (
        <div className="dashboard-banner dashboard-banner-success" role="status" aria-live="polite">
          Support request received. We will review it and follow up through your account email.
        </div>
      ) : null}
      {supportError ? (
        <div className="dashboard-banner dashboard-banner-error" role="alert">
          {supportError}
        </div>
      ) : null}

      <section className="assessment-section glass-card">
        <div className="assessment-section-title">
          <div className="assessment-section-eyebrow">
            <LifeBuoy size={18} />
            <span>Support</span>
          </div>
          <h2>Need help with this workspace?</h2>
          <p>Send a short request from your dashboard. Do not include passwords, tokens, secrets, or raw private files.</p>
        </div>
        <form action={createDashboardSupportRequestAction} className="unlock-admin-form">
          <label className="form-label">
            Category
            <select name="category" className="form-input" defaultValue="general_question">
              {SUPPORT_CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="form-label">
            Subject
            <input name="subject" required className="form-input" placeholder="Short summary" />
          </label>
          <label className="form-label" style={{ gridColumn: "1 / -1" }}>
            Message
            <textarea name="message" required className="form-input assessment-textarea" placeholder="What should we review?" />
          </label>
          <button type="submit" className="btn btn-secondary">
            Contact support
          </button>
          <Link href="/support" className="dashboard-card-link">
            Open public support page <ArrowRight size={16} />
          </Link>
        </form>

        {/* Support Request History */}
        <div style={{ marginTop: "2rem", borderTop: "1px solid var(--border-color)", paddingTop: "1.5rem" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 600, color: "white", marginBottom: "1rem" }}>Your recent support requests</h3>
          {userSupportRequests.length === 0 ? (
            <p className="text-muted" style={{ fontSize: "0.9rem" }}>No support requests yet.</p>
          ) : (
            <div className="assessment-table-wrap">
              <table className="assessment-table" style={{ fontSize: "0.85rem" }}>
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Date</th>
                    <th>Context</th>
                  </tr>
                </thead>
                <tbody>
                  {userSupportRequests.map((req) => (
                    <tr key={req.id}>
                      <td style={{ fontWeight: 500, color: "white" }}>{req.subject}</td>
                      <td>{SUPPORT_CATEGORY_OPTIONS.find(o => o.value === req.category)?.label ?? req.category}</td>
                      <td>
                        <span className={`assessment-chip assessment-chip-${
                          req.status === "resolved" || req.status === "closed" ? "good" :
                          req.status === "triage" || req.status === "waiting_on_user" ? "warning" : "neutral"
                        }`}>
                          {req.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td>
                        <span className={`assessment-chip assessment-chip-${
                          req.priority === "urgent" || req.priority === "high" ? "danger" : "neutral"
                        }`}>
                          {req.priority}
                        </span>
                      </td>
                      <td className="text-muted">{new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit", year: "numeric" }).format(new Date(req.createdAt))}</td>
                      <td>
                        {req.assessment ? (
                          <Link href={`/dashboard/assessments/${req.assessment.id}`} className="dashboard-card-link" style={{ fontSize: "0.8rem", margin: 0 }}>
                            {req.assessment.title}
                          </Link>
                        ) : "Workspace"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* Recent Activity or Empty State */}
      <section className="assessment-section glass-card">
        <div className="assessment-section-title">
          <div className="assessment-section-eyebrow">
            <Layers3 size={18} />
            <span>Recent Activity</span>
          </div>
          <h2>Recent assessments</h2>
          <p>Resume your migration assessments or upload evidence to proceed.</p>
        </div>

        {totalAssessments === 0 ? (
          <div className="dashboard-empty" style={{ maxWidth: "100%", padding: "2rem 0", display: "flex", flexDirection: "column", alignItems: "center", justifyItems: "center", width: "100%" }}>
            <p className="text-muted" style={{ margin: "0 0 1rem 0" }}>No assessments found in this workspace.</p>
            <Link href="/dashboard/assessments/new" className="btn btn-secondary">
              Create your first assessment
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1rem" }}>
            {recentAssessments.map((assessment) => {
              const lifecycle = getLifecycleStatus(assessment);
              return (
                <div key={assessment.id} className="glass-card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.25rem 1.5rem", border: "1px solid var(--border-color)", borderRadius: "12px", background: "rgba(255, 255, 255, 0.01)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
                    <div style={{ background: "rgba(6, 182, 212, 0.08)", padding: "0.75rem", borderRadius: "10px", border: "1px solid rgba(6, 182, 212, 0.15)", color: "#06b6d4" }}>
                      <Database size={20} />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, color: "white", fontSize: "1.05rem", fontWeight: 600 }}>{assessment.title}</h3>
                      <p style={{ margin: "0.2rem 0 0 0", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                        {assessment.clientLabel ? assessment.clientLabel : "No client label"} &bull; Last updated {new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit", year: "numeric" }).format(new Date(assessment.updatedAt))}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
                    <span className={`assessment-chip assessment-chip-${lifecycle.tone}`}>
                      {lifecycle.label}
                    </span>
                    <Link href={`/dashboard/assessments/${assessment.id}`} className="btn btn-secondary btn-sm" style={{ border: "1px solid var(--border-color)" }}>
                      Resume
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              );
            })}

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.5rem" }}>
              <Link href="/dashboard/assessments" className="dashboard-card-link">
                View all assessments <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
