import Link from "next/link";
import Image from "next/image";
import Navbar from "../../components/Navbar";
import { BRAND_PUBLIC_ASSETS, BRAND_WORDMARK } from "../../lib/brandAssets";
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
              <Image
                src={BRAND_PUBLIC_ASSETS.primaryLogo}
                alt={`${BRAND_WORDMARK} Logo`}
                width={35}
                height={35}
                className="nav-brand-logo"
                priority
              />
              <span>{BRAND_WORDMARK}</span>
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
