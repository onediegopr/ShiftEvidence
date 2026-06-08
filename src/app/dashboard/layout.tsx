import type { ReactNode } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { auth } from "../../lib/auth";
import { BRAND_PUBLIC_ASSETS, BRAND_WORDMARK } from "../../lib/brandAssets";
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
              <Image
                src={BRAND_PUBLIC_ASSETS.webLogo}
                alt={`${BRAND_WORDMARK} Logo`}
                width={30}
                height={30}
                className="nav-brand-logo"
                priority
              />
              <span>{BRAND_WORDMARK}</span>
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
              {session.user.name ?? "Usuario"}
            </span>
            <SignOutButton className="btn btn-secondary dashboard-nav-signout" />
          </div>
        </div>
      </header>
      {children}
    </>
  );
}
