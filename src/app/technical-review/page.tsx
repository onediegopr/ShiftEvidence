import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, FileText, ShieldCheck, Video } from "lucide-react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { createTechnicalReviewRequestAction } from "./actions";

export const metadata: Metadata = {
  title: "Technical Review | Shift Evidence",
  description: "Request a technical review of your readiness findings, assumptions, blockers, and next-step migration guidance.",
  alternates: {
    canonical: "https://shiftevidence.com/technical-review",
  },
};

type TechnicalReviewPageProps = {
  searchParams?: Promise<{ source?: string; sent?: string; error?: string }> | { source?: string; sent?: string; error?: string };
};

const sourceLabels: Record<string, string> = {
  demo_replay: "Replay walkthrough",
  pricing: "Pricing / add-on page",
  report: "Assessment report",
};

const reviewSignals = [
  "Walk through assumptions and blockers",
  "Review storage, wave and sizing concerns",
  "Clarify the next technical decision",
];

const reviewOutputs = [
  "Report walkthrough with human interpretation",
  "Challenge assumptions before internal sign-off",
  "Prioritize remediation and next-step sequencing",
];

export default async function TechnicalReviewPage({ searchParams }: TechnicalReviewPageProps) {
  const query = await Promise.resolve(searchParams);
  const source = typeof query?.source === "string" ? query.source : "direct";
  const sent = query?.sent === "1";
  const error = typeof query?.error === "string" ? decodeURIComponent(query.error) : null;
  const contextLabel = sourceLabels[source] ?? "Public site";
  const defaultMessage = `We would like a technical review of our readiness findings.\n\nCurrent stage: ${contextLabel}\nPrimary questions:\n- Assumptions we want reviewed:\n- Risks or blockers we want clarified:\n- Desired next step after the review:`;

  return (
    <>
      <Navbar />
      <main>
        <section className="section technical-review-page">
          <div className="container technical-review-shell">
            <div className="technical-review-hero">
              <div className="badge badge-cyan">Technical Review</div>
              <h1>Request a human review before you commit to the migration path.</h1>
              <p>
                Use this path when you already have findings, demo context or readiness questions and want a guided
                technical conversation about assumptions, blockers and next-step decisions.
              </p>
              <div className="technical-review-signal-strip" aria-label="Review scope">
                {reviewSignals.map((signal) => (
                  <span key={signal}>{signal}</span>
                ))}
              </div>
            </div>

            {sent ? (
              <div className="dashboard-banner dashboard-banner-success" role="status" aria-live="polite">
                Technical review request received. It has been routed to the internal priority queue and notified to info@shiftevidence.com.
              </div>
            ) : null}
            {error ? (
              <div className="dashboard-banner dashboard-banner-error" role="alert">
                {error}
              </div>
            ) : null}

            <div className="technical-review-grid">
              <section className="glass-card technical-review-form-card">
                <div className="technical-review-form-head">
                  <div className="assessment-section-eyebrow">
                    <Video size={18} />
                    <span>Request review</span>
                  </div>
                  <h2>Tell us what should be reviewed</h2>
                  <p>
                    This creates a support request specifically tagged for a technical review path. We will follow up
                    manually by email, and the internal notification is routed to info@shiftevidence.com.
                  </p>
                </div>

                <form action={createTechnicalReviewRequestAction} className="unlock-admin-form">
                  <input type="hidden" name="category" value="assessment_report_question" />
                  <input type="hidden" name="subject" value="Technical Review Call" />
                  <input type="hidden" name="context" value={`technical_review:${source}`} />
                  <input type="hidden" name="source" value={source} />

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
                    Current context
                    <input className="form-input" value={contextLabel} readOnly />
                  </label>
                  <label className="form-label" style={{ gridColumn: "1 / -1" }}>
                    What should we review?
                    <textarea
                      name="message"
                      required
                      className="form-input assessment-textarea"
                      defaultValue={defaultMessage}
                    />
                  </label>

                  <div className="technical-review-form-actions">
                    <button type="submit" className="btn btn-primary btn-glow">
                      Send Technical Review Request
                      <ArrowRight size={18} />
                    </button>
                    <Link
                      href={`/support?category=assessment_report_question&subject=${encodeURIComponent("Technical Review Call")}&message=${encodeURIComponent(defaultMessage)}`}
                      className="btn btn-secondary"
                    >
                      Open Generic Support Instead
                    </Link>
                  </div>
                </form>
              </section>

              <aside className="glass-card technical-review-info-card">
                <div className="technical-review-info-block">
                  <div className="assessment-section-eyebrow">
                    <FileText size={18} />
                    <span>What this includes</span>
                  </div>
                  <div className="technical-review-output-list">
                    {reviewOutputs.map((item) => (
                      <div key={item} className="technical-review-output-item">
                        <CheckCircle2 size={16} />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="technical-review-info-block">
                  <div className="assessment-section-eyebrow">
                    <ShieldCheck size={18} />
                    <span>Important boundaries</span>
                  </div>
                  <div className="technical-review-guardrail-list">
                    <span>No automated booking or calendar integration yet</span>
                    <span>No implementation or live migration execution</span>
                    <span>No request for credentials, tokens or production writes</span>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
