import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BadgeDollarSign, Building2, FileText, Landmark, ShieldCheck } from "lucide-react";
import { notFound } from "next/navigation";
import Footer from "../../../../components/Footer";
import Navbar from "../../../../components/Navbar";
import { getBillingCadenceLabel } from "../../../../config/billing";
import { getBillingInvoicePlanBySlug } from "../../../../server/billing/invoiceRequestService";
import { createBillingInvoiceRequestAction } from "./actions";

export const metadata: Metadata = {
  title: "Bank Transfer Invoice | Shift Evidence",
  description: "Manual invoice and bank transfer request flow for Shift Evidence plans.",
};

type BankTransferPageProps = {
  params: Promise<{
    plan: string;
  }>;
  searchParams?: Promise<{
    requested?: string;
    error?: string;
  }>;
};

export default async function BankTransferInvoicePage({ params, searchParams }: BankTransferPageProps) {
  const { plan: planSlug } = await params;
  const query = await searchParams;
  const plan = getBillingInvoicePlanBySlug(planSlug);

  if (!plan) {
    notFound();
  }

  const action = createBillingInvoiceRequestAction.bind(null, planSlug);
  const requestCreated = query?.requested === "1";

  return (
    <>
      <Navbar />
      <main>
        <section className="section" style={{ paddingTop: "8rem" }}>
          <div className="container">
            <section className="dashboard-hero glass-card">
              <div>
                <div className="badge badge-cyan">Bank transfer</div>
                <h1>Request a manual invoice</h1>
                <p>
                  Send billing details for {plan.displayName}. Shift Evidence reviews the request and sends payment
                  instructions manually for bank transfer.
                </p>
                <p className="assessment-inline-note">
                  Wise is used only as a manual bank transfer reference. No transfers, recipients, balances, card
                  payments or entitlements are automated in this flow.
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
                <BadgeDollarSign size={22} />
                <span className="assessment-summary-label">Selected plan</span>
                <strong>{plan.displayName}</strong>
                <p>{plan.priceLabel}</p>
              </article>
              <article className="glass-card assessment-summary-card">
                <Landmark size={22} />
                <span className="assessment-summary-label">Payment method</span>
                <strong>Bank transfer</strong>
                <p>{getBillingCadenceLabel(plan.cadence)} invoice handled manually.</p>
              </article>
              <article className="glass-card assessment-summary-card">
                <ShieldCheck size={22} />
                <span className="assessment-summary-label">Automation</span>
                <strong>Manual review</strong>
                <p>No financial automation or access grant is triggered.</p>
              </article>
            </section>

            <section className="assessment-section glass-card" style={{ marginTop: "2rem" }}>
              <div className="assessment-section-title">
                <div className="assessment-section-eyebrow">
                  <FileText size={18} />
                  <span>Invoice details</span>
                </div>
                <h2>Billing contact</h2>
                <p>
                  These details are used only to prepare a manual invoice and follow up with bank transfer
                  instructions.
                </p>
              </div>

              {requestCreated ? (
                <p className="assessment-inline-note assessment-success-note">
                  Invoice request received. Billing will review it manually before sending bank transfer instructions.
                </p>
              ) : null}
              {query?.error ? (
                <p className="assessment-inline-note assessment-warning-note">{query.error}</p>
              ) : null}

              <form action={action} className="support-form" style={{ marginTop: "1.5rem" }}>
                <div className="support-form-grid">
                  <label className="support-field">
                    <span>Contact name</span>
                    <input name="contactName" type="text" maxLength={288} required />
                  </label>
                  <label className="support-field">
                    <span>Billing email</span>
                    <input name="customerEmail" type="email" maxLength={320} required />
                  </label>
                  <label className="support-field">
                    <span>Company</span>
                    <input name="companyName" type="text" maxLength={216} required />
                  </label>
                  <label className="support-field">
                    <span>Country</span>
                    <input name="country" type="text" maxLength={288} />
                  </label>
                  <label className="support-field">
                    <span>Tax ID</span>
                    <input name="taxId" type="text" maxLength={288} />
                  </label>
                  <label className="support-field">
                    <span>Purchase order</span>
                    <input name="purchaseOrder" type="text" maxLength={288} />
                  </label>
                </div>
                <label className="support-field">
                  <span>Notes</span>
                  <textarea name="notes" maxLength={3600} rows={5} />
                </label>
                <label className="assessment-checkbox-row" style={{ marginTop: "1rem" }}>
                  <input name="manualInvoiceConsent" type="checkbox" value="accepted" required />
                  <span>
                    I understand this creates a manual invoice request only. Payment instructions and access review are
                    handled by the Shift Evidence billing admin.
                  </span>
                </label>
                <div className="assessment-inline-actions" style={{ marginTop: "1.5rem" }}>
                  <button type="submit" className="btn btn-primary btn-glow">
                    <Building2 size={16} />
                    Submit invoice request
                  </button>
                  <Link href={`/billing/checkout/${plan.checkoutSlug}`} className="btn btn-secondary">
                    Card checkout
                  </Link>
                </div>
              </form>
            </section>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}