"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react";

export default function ResetPasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setMessage(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match. Re-enter both fields and try again.");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/account-support/password-reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const payload = (await response.json()) as { ok?: boolean; message?: string };

      if (!response.ok || !payload.ok) {
        setError(payload.message ?? "Unable to reset password. Request a new reset link and try again.");
        return;
      }

      setPassword("");
      setConfirmPassword("");
      setMessage(payload.message ?? "Password updated. You can sign in now.");
    } catch {
      setError("Unable to reset password. Request a new reset link and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <>
        <p className="auth-error" role="alert">This reset link is missing a token. Request a new recovery link.</p>
        <div className="auth-footer">
          <span>
            <ShieldCheck size={16} /> Request a new recovery link
          </span>
          <Link href="/forgot-password">
            <ArrowLeft size={14} /> Request reset
          </Link>
        </div>
      </>
    );
  }

  if (message) {
    return (
      <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
        <div style={{
          width: "48px",
          height: "48px",
          borderRadius: "50%",
          background: "rgba(16, 185, 129, 0.1)",
          border: "1px solid rgba(16, 185, 129, 0.2)",
          color: "#10b981",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 1.5rem auto"
        }}>
          <ShieldCheck size={24} />
        </div>
        <h3 style={{ color: "white", marginBottom: "0.5rem" }}>Password updated successfully!</h3>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "2rem" }} role="status" aria-live="polite">
          {message}
        </p>
        <Link href="/sign-in" className="btn btn-primary btn-glow" style={{ justifyContent: "center" }}>
          Sign In Now
          <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  return (
    <>
      <form onSubmit={onSubmit} className="auth-form">
        <label>
          New password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={8}
            maxLength={128}
            placeholder="Enter a new password"
            className="form-input"
            autoComplete="new-password"
          />
        </label>
        <label>
          Confirm password
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
            minLength={8}
            maxLength={128}
            placeholder="Confirm your new password"
            className="form-input"
            autoComplete="new-password"
          />
        </label>
        {error ? <p className="auth-error" role="alert">{error}</p> : null}
        <button type="submit" className="btn btn-primary btn-glow" disabled={isSubmitting}>
          {isSubmitting ? "Updating…" : "Update password"}
          <ArrowRight size={16} />
        </button>
      </form>

      <div className="auth-footer">
        <span>
          <ShieldCheck size={16} /> Reset links expire and can be used once
        </span>
        <Link href="/sign-in">
          <ArrowLeft size={14} /> Back to sign in
        </Link>
      </div>
    </>
  );
}
