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
  description: "Secure Stripe checkout routing for Shift Evidence plans.",
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
      return "Checkout is missing one or more server-side Stripe variables.";
    case "checkout_disabled":
      return "Checkout is temporarily disabled. Please request an invoice instead.";
    case "invalid_price":
      return "The configured Stripe Price ID is invalid.";
    case "live_not_approved":
      return "Stripe live checkout is intentionally disabled until owner approval.";
    case "stripe_key_mode_mismatch":
      return "Stripe checkout mode does not match the configured secret key mode. Verify Hostinger Stripe env vars and restart the server.";
    case "stripe_api_error":
      return "Stripe could not create a checkout session. Please request an invoice instead.";
    case "stripe_auth_error":
      return "Stripe authentication failed server-side. Please request an invoice while billing reviews the configuration.";
    case "stripe_price_invalid":
      return "The configured Stripe Price ID could not be used. Please request an invoice while billing reviews the configuration.";
    case "stripe_runtime_error":
      return "Stripe checkout hit a safe runtime error. Please request an invoice instead.";
    case "stripe_timeout":
      return "Stripe checkout timed out before returning a hosted checkout URL. Please request an invoice instead.";
    case "unsupported_plan":
      return "This checkout plan is not available.";
    case "not_eligible":
      return "This plan is invoice-only and does not support card checkout.";
    default:
      return null;
  }
}

function statusMessage(status: string | undefined) {
  switch (status) {
    case "success":
      return "Payment was completed in Stripe test checkout. Access may require manual verification and fulfillment before the assessment is unlocked.";
    case "cancelled":
      return "Checkout was cancelled. You can retry card checkout or contact billing support for an invoice.";
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
  const checkoutModeLabel = "stripe" in state && state.stripe?.mode === "live" ? "live mode" : "test mode";
  const checkoutError = errorMessage(query?.error);
  const checkoutStatus = statusMessage(query?.status);

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
                  Plan: {plan.displayName}. Provider: Stripe.
                  {checkoutReady
                    ? " Payment by card is processed securely by Stripe. Starting checkout creates a hosted Stripe Checkout session. Entitlements are still handled manually."
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
                <p>{checkoutReady ? `Server-side Stripe checkout is configured for ${checkoutModeLabel}.` : "Stripe is waiting for full configuration."}</p>
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
                    ? "The button below starts a server-side Stripe Checkout session and redirects you to the hosted checkout page. No entitlement is granted automatically after payment yet."
                    : "This route exists so checkout can be enabled centrally after credentials and Stripe Price IDs are added. Until then, use invoice or support follow-up."}
                </p>
              </div>
              {checkoutError ? (
                <p className="assessment-inline-note assessment-warning-note">{checkoutError}</p>
              ) : null}
              {checkoutStatus ? (
                <p className="assessment-inline-note assessment-warning-note">{checkoutStatus}</p>
              ) : null}

              <div className="assessment-status-row">
                <span className={`assessment-chip assessment-chip-${statusTone(state.status)}`}>
                  Stripe: {statusLabel(state.status)}
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
              <p className="assessment-inline-note" style={{ marginTop: "1rem" }}>
                Business invoice and bank transfer requests are handled through support. Refunds and access adjustments are reviewed manually.
              </p>
            </section>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
