import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BadgePercent, CircleAlert, CreditCard, FileText, ShieldCheck } from "lucide-react";
import { notFound } from "next/navigation";
import Navbar from "../../../../components/Navbar";
import Footer from "../../../../components/Footer";
import { getBillingPaymentOptionLabel } from "../../../../config/billing";
import { getBillingCheckoutRouteState } from "../../../../server/billing/billingConfiguration";

export const metadata: Metadata = {
  title: "Secure Checkout | Shift Evidence",
  description: "Secure Lemon Squeezy checkout routing for Shift Evidence plans.",
};

type BillingCheckoutPageProps = {
  params: Promise<{
    plan: string;
  }>;
  searchParams?: Promise<{
    error?: string;
    status?: string;
  }>;
};

function statusTone(status: string) {
  switch (status) {
    case "configured_but_disabled":
      return "warning";
    case "configured":
      return "good";
    case "invoice_only":
      return "neutral";
    case "not_configured":
      return "warning";
    default:
      return "neutral";
  }
}

function statusLabel(status: string) {
  switch (status) {
    case "configured_but_disabled":
      return "Configured, disabled";
    case "configured":
      return "Ready";
    case "invoice_only":
      return "Invoice only";
    case "not_configured":
      return "Not configured";
    default:
      return "Unavailable";
  }
}

function errorMessage(error: string | undefined) {
  switch (error) {
    case "not_configured":
      return "Checkout is missing one or more server-side Lemon Squeezy variables.";
    case "invalid_variant":
      return "The configured Lemon Squeezy variant ID is invalid.";
    case "lemon_api_error":
      return "Lemon Squeezy could not create a checkout session. Please request an invoice instead.";
    case "unsupported_plan":
      return "This checkout plan is not available.";
    default:
      return null;
  }
}

export default async function BillingCheckoutPage({ params, searchParams }: BillingCheckoutPageProps) {
  const { plan: planSlug } = await params;
  const query = await searchParams;
  const state = getBillingCheckoutRouteState(planSlug);

  if (!state.plan) {
    notFound();
  }

  const plan = state.plan;
  const checkoutReady = state.status === "configured";
  const checkoutError = errorMessage(query?.error);

  return (
    <>
      <Navbar />
      <main>
        <section className="section" style={{ paddingTop: "8rem" }}>
          <div className="container">
            <section className="dashboard-hero glass-card">
              <div>
                <div className="badge badge-cyan">Billing checkout</div>
                <h1>{state.headline}</h1>
                <p>{state.detail}</p>
                <p className="assessment-inline-note">
                  Plan: {plan.displayName}. Provider: Lemon Squeezy.
                  {checkoutReady
                    ? " Starting checkout creates a hosted Lemon Squeezy checkout session. Entitlements are still handled manually."
                    : " No checkout session, payment, order, webhook or entitlement is created here."}
                </p>
              </div>
              <div className="dashboard-hero-actions">
                <Link href="/pricing" className="btn btn-secondary">
                  <ArrowLeft size={16} />
                  Back to pricing
                </Link>
              </div>
            </section>

            <section className="assessment-summary-grid" style={{ marginTop: "2rem" }}>
              <article className="glass-card assessment-summary-card">
                <BadgePercent size={22} />
                <span className="assessment-summary-label">Selected plan</span>
                <strong>{plan.displayName}</strong>
                <p>{plan.priceLabel}</p>
              </article>
              <article className="glass-card assessment-summary-card">
                <CreditCard size={22} />
                <span className="assessment-summary-label">Card checkout</span>
                <strong>{checkoutReady ? "Ready" : plan.checkoutEligible ? "Prepared" : "Not eligible"}</strong>
                <p>{checkoutReady ? "Server-side Lemon checkout is configured." : "Lemon Squeezy is waiting for full configuration."}</p>
              </article>
              <article className="glass-card assessment-summary-card">
                <CircleAlert size={22} />
                <span className="assessment-summary-label">Runtime state</span>
                <strong>{statusLabel(state.status)}</strong>
                <p>{checkoutReady ? "Secrets stay server-only." : "No API keys or variant IDs are required for build."}</p>
              </article>
            </section>

            <section className="assessment-section glass-card" style={{ marginTop: "2rem" }}>
              <div className="assessment-section-title">
                <div className="assessment-section-eyebrow">
                  <ShieldCheck size={18} />
                  <span>Safe routing</span>
                </div>
                <h2>{checkoutReady ? "Continue to hosted checkout" : "No payment is active yet"}</h2>
                <p>
                  {checkoutReady
                    ? "The button below starts a server-side Lemon Squeezy checkout and redirects you to the hosted checkout page. No entitlement is granted automatically after payment yet."
                    : "This route exists so checkout can be enabled centrally after credentials and variant IDs are added. Until then, use invoice or support follow-up."}
                </p>
              </div>
              {checkoutError ? (
                <p className="assessment-inline-note assessment-warning-note">{checkoutError}</p>
              ) : null}

              <div className="assessment-status-row">
                <span className={`assessment-chip assessment-chip-${statusTone(state.status)}`}>
                  Lemon Squeezy: {statusLabel(state.status)}
                </span>
                {plan.paymentOptions.map((option) => (
                  <span key={option} className="assessment-chip assessment-chip-neutral">
                    {getBillingPaymentOptionLabel(option)}
                  </span>
                ))}
              </div>

              <div className="assessment-inline-actions" style={{ marginTop: "1.5rem" }}>
                {checkoutReady ? (
                  <form action={`/billing/checkout/${planSlug}/start`} method="post">
                    <button type="submit" className="btn btn-primary btn-glow">
                      <CreditCard size={16} />
                      Continue to secure checkout
                      <ArrowRight size={16} />
                    </button>
                  </form>
                ) : (
                  <Link href={plan.secondaryAction.href} className="btn btn-primary btn-glow">
                    <FileText size={16} />
                    {plan.secondaryAction.label}
                  </Link>
                )}
                <Link href="/support?category=billing_question" className="btn btn-secondary">
                  Contact billing support
                </Link>
              </div>
            </section>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
