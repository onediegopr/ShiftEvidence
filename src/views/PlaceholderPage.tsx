import { ArrowRight } from "lucide-react";

type PlaceholderPageProps = {
  title: string;
  eyebrow: string;
  body: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
};

export default function PlaceholderPage({
  title,
  eyebrow,
  body,
  primaryLabel,
  primaryHref,
  secondaryLabel,
  secondaryHref,
}: PlaceholderPageProps) {
  return (
    <main className="shiftreadiness-page">
      <section className="section shiftreadiness-hero">
        <div className="container">
          <div className="glass-card placeholder-card">
            <div className="badge badge-cyan">{eyebrow}</div>
            <h1>{title}</h1>
            <p className="shiftreadiness-lead">{body}</p>
            <div className="shiftreadiness-actions">
              <a href={primaryHref} className="btn btn-primary btn-glow">
                {primaryLabel}
                <ArrowRight size={18} />
              </a>
              <a href={secondaryHref} className="btn btn-secondary">
                {secondaryLabel}
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
