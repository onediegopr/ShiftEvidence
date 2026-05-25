import type { Metadata } from "next";
import PlaceholderPage from "../../views/PlaceholderPage";

export const metadata: Metadata = {
  title: "Contact | Shift Evidence",
  description: "Contact Shift Evidence for readiness reviews and plan comparisons.",
};

export default function ContactPage() {
  return (
    <PlaceholderPage
      eyebrow="Contact"
      title="Technical review booking is not wired yet."
      body="This route will later connect to a review or contact flow. For now, compare plans or return to the landing page."
      primaryLabel="Compare plans"
      primaryHref="/shiftreadiness#pricing"
      secondaryLabel="Back to landing"
      secondaryHref="/"
    />
  );
}
