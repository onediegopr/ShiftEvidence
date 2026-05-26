"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { authClient } from "../../lib/auth-client";
import Navbar from "../../components/Navbar";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const { error: authError } = await authClient.signUp.email({
      name,
      email,
      password,
      callbackURL: "/dashboard",
    });

    if (authError) {
      setError(authError.message ?? "Unable to create account.");
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

        <div className="badge badge-cyan">Sign up</div>
        <h1>Create your readiness workspace.</h1>
        <p>
          Set up a private workspace for assessments, risk modeling and future reporting.
        </p>

        <form onSubmit={onSubmit} className="auth-form">
          <label>
            Name
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              placeholder="Your name"
              className="form-input"
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              placeholder="you@company.com"
              className="form-input"
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              placeholder="Create a secure password"
              className="form-input"
            />
          </label>
          {error ? <p className="auth-error">{error}</p> : null}
          <button type="submit" className="btn btn-primary btn-glow" disabled={isSubmitting}>
            {isSubmitting ? "Creating account..." : "Create account"}
            <ArrowRight size={16} />
          </button>
        </form>

        <div className="auth-footer">
          <span>
            <ShieldCheck size={16} /> Cost / Risk Engine included
          </span>
          <Link href="/sign-in">Already have an account?</Link>
        </div>
      </section>
    </main>
    </>
  );
}
