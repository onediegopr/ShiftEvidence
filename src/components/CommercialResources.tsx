import { ArrowDownToLine, FileText, Layers3, ReceiptText, type LucideIcon } from "lucide-react";

type ResourceTone = "cyan" | "violet" | "amber";

type CommercialResource = {
  badge: string;
  title: string;
  description: string;
  bestFor: string;
  href: string;
  cta: string;
  tone: ResourceTone;
  Icon: LucideIcon;
};

const commercialResources: CommercialResource[] = [
  {
    badge: "1-page brief",
    title: "Product Brief",
    description: "A compact overview for first-pass executive or internal sharing.",
    bestFor: "Fast stakeholder orientation",
    href: "/marketing/shift-evidence-product-brief.pdf",
    cta: "Download brief",
    tone: "cyan",
    Icon: ReceiptText,
  },
  {
    badge: "Commercial PDF",
    title: "Product Brochure",
    description: "The broader Shift Evidence story: methodology, outputs and trust boundaries.",
    bestFor: "Sharing the full product overview",
    href: "/marketing/shift-evidence-product-brochure.pdf",
    cta: "Download brochure",
    tone: "violet",
    Icon: FileText,
  },
  {
    badge: "Blueprint PDF",
    title: "Migration Blueprint Overview",
    description: "Wave planning, validation gates, rollback framing and review-session context.",
    bestFor: "Planning deeper than assessment",
    href: "/marketing/migration-blueprint-overview.pdf",
    cta: "Download Blueprint overview",
    tone: "amber",
    Icon: Layers3,
  },
];

type CommercialResourcesProps = {
  eyebrow?: string;
  title?: string;
  copy?: string;
  featured?: "brief" | "brochure" | "blueprint";
  compact?: boolean;
};

function getFeaturedIndex(featured?: CommercialResourcesProps["featured"]) {
  if (featured === "brief") return 0;
  if (featured === "brochure") return 1;
  if (featured === "blueprint") return 2;
  return -1;
}

export default function CommercialResources({
  eyebrow = "Commercial resources",
  title = "Shareable PDFs for the buying conversation.",
  copy = "Use these downloadable assets to explain Shift Evidence, align stakeholders and separate readiness assessment from deeper migration planning.",
  featured,
  compact = false,
}: CommercialResourcesProps) {
  const featuredIndex = getFeaturedIndex(featured);

  return (
    <section className={`commercial-resources ${compact ? "commercial-resources-compact" : ""}`}>
      <div className="commercial-resources-head">
        <span className="badge badge-cyan">{eyebrow}</span>
        <h2>{title}</h2>
        <p>{copy}</p>
      </div>

      <div className="commercial-resource-grid">
        {commercialResources.map(({ badge, title, description, bestFor, href, cta, tone, Icon }, index) => (
          <a
            key={title}
            href={href}
            className={`commercial-resource-card ${index === featuredIndex ? "commercial-resource-card-featured" : ""}`}
            data-tone={tone}
            target="_blank"
            rel="noreferrer"
          >
            <span className="commercial-resource-orb" aria-hidden="true" />
            <span className="commercial-resource-cover" aria-hidden="true">
              <Icon size={26} />
              <strong>PDF</strong>
            </span>
            <span className="commercial-resource-meta">
              <span className="commercial-resource-badge">{badge}</span>
              <strong>{title}</strong>
              <span>{description}</span>
            </span>
            <span className="commercial-resource-fit">
              <small>Best for</small>
              {bestFor}
            </span>
            <span className="commercial-resource-cta">
              {cta}
              <ArrowDownToLine size={16} />
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}
