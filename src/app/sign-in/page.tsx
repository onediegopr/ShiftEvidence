"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { authClient } from "../../lib/auth-client";
import { BRAND_PUBLIC_ASSETS, BRAND_WORDMARK } from "../../lib/brandAssets";
import Navbar from "../../components/Navbar";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const { error: authError } = await authClient.signIn.email({
      email,
      password,
      callbackURL: "/dashboard",
    });

    if (authError) {
      setError(authError.message ?? "Unable to sign in. Check your email and password, then try again.");
      setIsSubmitting(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

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

        <div className="badge badge-cyan">Sign in</div>
        <h1>Welcome back.</h1>
        <p>
          Access your Shift Evidence workspace, continue assessments, review reports,
          view recent support requests, and return to your migration advisor.
        </p>

        <form onSubmit={onSubmit} className="auth-form">
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
              spellCheck={false}
              placeholder="you@company.com"
              className="form-input"
            />
          </label>
          <label>
            <span className="auth-label-row">
              Password
              <Link href="/forgot-password">Forgot password?</Link>
            </span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              autoComplete="current-password"
              placeholder="Enter your password"
              className="form-input"
            />
          </label>
          {error ? <p className="auth-error" role="alert">{error}</p> : null}
          <button type="submit" className="btn btn-primary btn-glow" disabled={isSubmitting}>
            {isSubmitting ? "Signing in…" : "Sign in"}
            <ArrowRight size={16} />
          </button>
        </form>

        <div className="auth-footer">
          <span>
            <ShieldCheck size={16} /> Protected workspace access
          </span>
          <Link href="/sign-up">Create a new account</Link>
        </div>
      </section>
    </main>
    </>
  );
}
