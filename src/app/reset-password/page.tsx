import Link from "next/link";
import Navbar from "../../components/Navbar";
import ResetPasswordForm from "./reset-password-form";

type ResetPasswordPageProps = {
  searchParams: Promise<{
    token?: string;
  }>;
};

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const { token = "" } = await searchParams;

  return (
    <>
      <Navbar />
      <main className="auth-page">
        <div className="auth-glow-1"></div>
        <div className="auth-glow-2"></div>

        <section className="auth-shell glass-card">
          <div className="auth-logo-header">
            <Link href="/" className="logo-container">
              <svg
                width="35"
                height="35"
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="nav-brand-logo"
                aria-hidden="true"
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
          </div>

          <div className="badge badge-cyan">Password reset</div>
          <h1>Choose a new password.</h1>
          <p>Use the recovery link you received to update your ShiftReadiness password.</p>

          <ResetPasswordForm token={token} />
        </section>
      </main>
    </>
  );
}
