"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react";
import Navbar from "../../components/Navbar";

const NEUTRAL_MESSAGE = "If an account exists, we will send recovery instructions.";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/account-support/password-reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const payload = (await response.json()) as { message?: string };

      setMessage(payload.message ?? NEUTRAL_MESSAGE);
    } catch {
      setError("Unable to submit the request. Try again or contact support.");
    } finally {
      setIsSubmitting(false);
    }
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

          <div className="badge badge-cyan">Account recovery</div>
          <h1>Reset your password.</h1>
          <p>
            Enter your account email. If an account exists, recovery instructions will be sent or
            handled through the configured support flow.
          </p>

          <form onSubmit={onSubmit} className="auth-form">
            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                placeholder="you@company.com"
                className="form-input"
                autoComplete="email"
              />
            </label>
            {message ? <p className="auth-success" role="status" aria-live="polite">{message}</p> : null}
            {error ? <p className="auth-error" role="alert">{error}</p> : null}
            <button type="submit" className="btn btn-primary btn-glow" disabled={isSubmitting}>
              {isSubmitting ? "Submitting…" : "Send recovery instructions"}
              <ArrowRight size={16} />
            </button>
          </form>

          <div className="auth-footer">
            <span>
              <ShieldCheck size={16} /> We do not reveal whether an email exists
            </span>
            <Link href="/sign-in">
              <ArrowLeft size={14} /> Back to sign in
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
