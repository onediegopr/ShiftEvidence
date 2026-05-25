import LandingPage from "./views/LandingPage";
import ShiftReadinessPage from "./views/ShiftReadinessPage";
import PlaceholderPage from "./views/PlaceholderPage";

const getRoute = () => {
  if (typeof window === "undefined") return "/";
  return window.location.pathname.replace(/\/+$/, "");
};

export default function App() {
  const route = getRoute();

  if (route === "/shiftreadiness") {
    return <ShiftReadinessPage />;
  }

  if (route === "/sign-up") {
    return (
      <PlaceholderPage
        eyebrow="Placeholder"
        title="Free Readiness Check is coming next."
        body="This CTA will later connect to the assessment intake flow. For now, explore the ShiftReadiness product page or return to the main landing."
        primaryLabel="Explore ShiftReadiness"
        primaryHref="/shiftreadiness"
        secondaryLabel="Back to landing"
        secondaryHref="/"
      />
    );
  }

  if (route === "/contact") {
    return (
      <PlaceholderPage
        eyebrow="Placeholder"
        title="Technical review booking is not wired yet."
        body="This CTA will later connect to a contact or review flow. For now, review the ShiftReadiness pricing and product structure."
        primaryLabel="Compare plans"
        primaryHref="/shiftreadiness#pricing"
        secondaryLabel="Back to landing"
        secondaryHref="/"
      />
    );
  }

  return <LandingPage />;
}
