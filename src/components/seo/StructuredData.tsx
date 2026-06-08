const siteUrl = "https://www.shiftevidence.com";

const structuredData = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteUrl}/#organization`,
    name: "Shift Evidence",
    url: siteUrl,
    logo: `${siteUrl}/brand/shift-evidence-icon-dark-transparent.png`,
    description:
      "Shift Evidence provides VMware to Proxmox pre-migration readiness assessments for companies, MSPs and Proxmox consultants.",
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    name: "Shift Evidence",
    url: siteUrl,
    publisher: {
      "@id": `${siteUrl}/#organization`,
    },
    inLanguage: "en",
  },
  {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${siteUrl}/#vmware-proxmox-readiness-service`,
    name: "VMware to Proxmox Readiness Assessment",
    serviceType: "Pre-migration readiness assessment",
    provider: {
      "@id": `${siteUrl}/#organization`,
    },
    areaServed: "Global",
    audience: [
      {
        "@type": "Audience",
        audienceType: "Infrastructure teams",
      },
      {
        "@type": "Audience",
        audienceType: "Managed service providers",
      },
      {
        "@type": "Audience",
        audienceType: "Proxmox consultants",
      },
    ],
    description:
      "Evidence-based readiness assessment that turns RVTools inventory, storage destination evidence and senior project context into a VMware to Proxmox migration readiness decision pack.",
    termsOfService: `${siteUrl}/security`,
  },
];

export function StructuredData() {
  return (
    <script
      type="application/ld+json"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
