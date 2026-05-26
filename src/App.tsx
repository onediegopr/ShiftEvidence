import LandingPage from "./views/LandingPage";
import ShiftReadinessPage from "./views/ShiftReadinessPage";
import PlaceholderPage from "./views/PlaceholderPage";
import SignUpPage from "./views/SignUpPage";

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
    return <SignUpPage />;
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
