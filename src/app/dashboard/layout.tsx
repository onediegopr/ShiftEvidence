import type { ReactNode } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "../../lib/auth";
import { isAdminEmail } from "../../server/admin/adminAuth";
import SignOutButton from "../../components/auth/SignOutButton";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  const showAdminLink = isAdminEmail(session.user.email);

  return (
    <>
      <header className="dashboard-nav-wrapper">
        <div className="dashboard-nav-container">
          <div style={{ display: "flex", alignItems: "center", gap: "2.5rem" }}>
            <Link href="/dashboard" className="logo-container" style={{ fontSize: "1.2rem" }}>
              <svg
                width="30"
                height="30"
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="nav-brand-logo"
                aria-hidden="true"
                style={{ width: "30px", height: "30px" }}
              >
                <circle
                  cx="12"
                  cy="16"
                  r="8"
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="2.5"
                />
                <path
                  d="M12 16H24M24 16L20 12M24 16L20 20"
                  stroke="#8b5cf6"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>Shift Evidence</span>
            </Link>

            <nav>
              <ul className="dashboard-nav-menu">
                <li>
                  <Link href="/dashboard" className="dashboard-nav-link">
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard/assessments" className="dashboard-nav-link">
                    Assessments
                  </Link>
                </li>
                {showAdminLink && (
                  <li>
                    <Link href="/dashboard/admin" className="dashboard-nav-link" style={{ color: "#22d3ee" }}>
                      Panel de Administración
                    </Link>
                  </li>
                )}
              </ul>
            </nav>
          </div>

          <div className="dashboard-nav-right">
            <span className="dashboard-user-badge">
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#06b6d4" }}></span>
              {session.user.email}
            </span>
            <SignOutButton className="btn btn-secondary dashboard-nav-signout" />
          </div>
        </div>
      </header>
      {children}
    </>
  );
}
