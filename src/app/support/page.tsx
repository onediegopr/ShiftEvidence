import type { Metadata } from "next";
import Link from "next/link";
import { LifeBuoy, Lock, Mail, ShieldCheck } from "lucide-react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { SUPPORT_CATEGORY_OPTIONS, SUPPORT_CONTACTS } from "../../server/support/supportRequestService";
import { createPublicSupportRequestAction } from "./actions";

export const metadata: Metadata = {
  title: "Support | Shift Evidence",
  description: "Contact Shift Evidence support for assessment, privacy, security, and partner questions.",
};

type SupportPageProps = {
  searchParams?: Promise<{ sent?: string; error?: string; category?: string }> | { sent?: string; error?: string; category?: string };
};

export default async function SupportPage({ searchParams }: SupportPageProps) {
  const query = await Promise.resolve(searchParams);
  const sent = query?.sent === "1";
  const error = query?.error ? decodeURIComponent(query.error) : null;
  const defaultCategory = SUPPORT_CATEGORY_OPTIONS.some((item) => item.value === query?.category)
    ? query?.category
    : "general_question";

  return (
    <>
      <Navbar />
      <main>
        <section className="section" style={{ paddingTop: "8rem" }}>
          <div className="container">
            <div className="section-header" style={{ textAlign: "left", maxWidth: "860px" }}>
              <span className="badge badge-cyan">Support</span>
              <h1>Get help with assessments, reports, privacy, security, or partner questions.</h1>
              <p>
                Send a concise request without secrets, passwords, tokens, or raw private files. We use
                your message to route the request and follow up through the email you provide.
              </p>
            </div>

            {sent ? (
              <div className="dashboard-banner dashboard-banner-success" role="status" aria-live="polite">
                Support request received. We will review it and follow up by email.
              </div>
            ) : null}
            {error ? (
              <div className="dashboard-banner dashboard-banner-error" role="alert">
                {error}
              </div>
            ) : null}

            <div className="assessment-preview-columns" style={{ marginTop: "2rem" }}>
              <section className="glass-card assessment-section" style={{ gridColumn: "span 2" }}>
                <div className="assessment-section-title">
                  <div className="assessment-section-eyebrow">
                    <LifeBuoy size={18} />
                    <span>Request support</span>
                  </div>
                  <h2>Tell us what you need</h2>
                  <p>Keep the request focused on the assessment or account question. Do not include credentials.</p>
                </div>
                <form action={createPublicSupportRequestAction} className="unlock-admin-form">
                  <label className="form-label">
                    Category
                    <select name="category" className="form-input" defaultValue={defaultCategory}>
                      {SUPPORT_CATEGORY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="form-label">
                    Work email
                    <input name="contactEmail" type="email" required className="form-input" placeholder="you@company.com" />
                  </label>
                  <label className="form-label">
                    Name
                    <input name="contactName" className="form-input" placeholder="Your name" />
                  </label>
                  <label className="form-label">
                    Company
                    <input name="companyName" className="form-input" placeholder="Company or organization" />
                  </label>
                  <label className="form-label">
                    Subject
                    <input name="subject" required className="form-input" placeholder="Short summary" />
                  </label>
                  <label className="form-label" style={{ gridColumn: "1 / -1" }}>
                    Message
                    <textarea name="message" required className="form-input assessment-textarea" placeholder="What should we review?" />
                  </label>
                  <button type="submit" className="btn btn-primary btn-glow">
                    Send request
                  </button>
                </form>
              </section>

              <aside className="glass-card assessment-section" id="security">
                <div className="assessment-section-title">
                  <div className="assessment-section-eyebrow">
                    <ShieldCheck size={18} />
                    <span>Contact paths</span>
                  </div>
                  <h2>Direct inboxes</h2>
                  <p>Use the form for normal requests or email the relevant inbox for routing.</p>
                </div>
                <ul className="assessment-bullet-list">
                  <li><Mail size={14} /> General inquiries: {SUPPORT_CONTACTS.info}</li>
                  <li><Lock size={14} /> Support: {SUPPORT_CONTACTS.support}</li>
                  <li><ShieldCheck size={14} /> Billing questions: {SUPPORT_CONTACTS.billing}</li>
                  <li id="partners"><LifeBuoy size={14} /> Partners: {SUPPORT_CONTACTS.partners}</li>
                </ul>
                <p className="assessment-inline-note">
                  There is no live chat, attachment upload, automated SLA, or billing provider workflow in this support layer.
                </p>
                <Link href="/about" className="dashboard-card-link">
                  Learn about the trust model
                </Link>
              </aside>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
