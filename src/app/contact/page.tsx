import type { Metadata } from "next";
import Link from "next/link";
import { LifeBuoy, Mail, Lock, ShieldCheck, ArrowRight } from "lucide-react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { SUPPORT_CONTACTS } from "../../server/support/supportRequestService";

export const metadata: Metadata = {
  title: "Contact | Shift Evidence",
  description: "Contact Shift Evidence support, billing, or partner routing.",
};

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <main>
        <section className="section" style={{ paddingTop: "8rem" }}>
          <div className="container">
            <div className="section-header" style={{ textAlign: "left", maxWidth: "860px" }}>
              <span className="badge badge-cyan">Contact</span>
              <h1>Contact Shift Evidence</h1>
              <p>
                For technical support, billing questions, assessment help, partner inquiries, or general
                questions, use the support page so your request reaches the right channel.
              </p>
            </div>

            <div className="assessment-preview-columns" style={{ marginTop: "2rem" }}>
              <section className="glass-card assessment-section" style={{ gridColumn: "span 2" }}>
                <div className="assessment-section-title">
                  <div className="assessment-section-eyebrow">
                    <LifeBuoy size={18} />
                    <span>Support Desk</span>
                  </div>
                  <h2>Online Support Request</h2>
                  <p>
                    Submit a support ticket directly. This ensures structured routing and faster response times.
                  </p>
                </div>
                <div className="assessment-inline-actions" style={{ marginTop: "1.5rem" }}>
                  <Link href="/support?category=general_question" className="btn btn-primary btn-glow">
                    Go to support
                    <ArrowRight size={16} />
                  </Link>
                  <Link href="/" className="btn btn-secondary">
                    Back to landing page
                  </Link>
                </div>
              </section>

              <aside className="glass-card assessment-section" id="inboxes">
                <div className="assessment-section-title">
                  <div className="assessment-section-eyebrow">
                    <Mail size={18} />
                    <span>Direct Inboxes</span>
                  </div>
                  <h2>Direct Email Paths</h2>
                  <p>You can also reach out to our specific inboxes depending on your inquiry:</p>
                </div>
                <ul className="assessment-bullet-list">
                  <li><Mail size={14} /> General: {SUPPORT_CONTACTS.info}</li>
                  <li><Lock size={14} /> Support: {SUPPORT_CONTACTS.support}</li>
                  <li><ShieldCheck size={14} /> Billing: {SUPPORT_CONTACTS.billing}</li>
                  <li><LifeBuoy size={14} /> Partners: {SUPPORT_CONTACTS.partners}</li>
                </ul>
              </aside>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
