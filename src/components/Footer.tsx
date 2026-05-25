import { ArrowRight } from "lucide-react";
import { useLocale } from "../i18n";

export default function Footer() {
  const { t, locale } = useLocale();
  const copy = {
    en: {
      brand: "Enterprise-grade VMware to Proxmox migration assessments. Fully automated checks, custom translation, and zero data loss, guaranteed.",
      platform: "Platform",
      resources: "Resources",
      checklist: "Get Free Migration Checklist",
      stay: "Stay updated on license saving calculators and pre-migration scripts.",
      copyright: "All rights reserved.",
      bottom: "Open-source infrastructure. Enterprise-grade migration readiness.",
      legal:
        "Shift Evidence is an independent assessment service. It is not affiliated with, endorsed by or certified by VMware, Broadcom or Proxmox. VMware, Broadcom and Proxmox names may be trademarks of their respective owners and are used only to describe migration context and compatibility targets.",
    },
    de: {
      brand: "Enterprise-taugliche VMware-zu-Proxmox-Migrationsbewertungen. Vollautomatische Checks, individuelle Übersetzung und garantiert kein Datenverlust.",
      platform: "Plattform",
      resources: "Ressourcen",
      checklist: "Kostenlose Migrations-Checkliste",
      stay: "Bleiben Sie über Lizenzersparnis-Rechner und Pre-Migration-Skripte informiert.",
      copyright: "Alle Rechte vorbehalten.",
      bottom: "Open-Source-Infrastruktur. Enterprise-Readiness für Migrationen.",
      legal:
        "Shift Evidence ist ein unabhängiger Assessment-Service. Er ist nicht mit VMware, Broadcom oder Proxmox verbunden, unterstützt oder zertifiziert. Die Namen VMware, Broadcom und Proxmox können Marken ihrer jeweiligen Eigentümer sein und werden nur verwendet, um den Migrationskontext und die Kompatibilitätsziele zu beschreiben.",
    },
    fr: {
      brand: "Évaluations de migration VMware vers Proxmox de niveau enterprise. Vérifications entièrement automatisées, traduction personnalisée et zéro perte de données garantie.",
      platform: "Plateforme",
      resources: "Ressources",
      checklist: "Checklist de migration gratuite",
      stay: "Restez informé des calculateurs d'économies de licences et des scripts de pré-migration.",
      copyright: "Tous droits réservés.",
      bottom: "Infrastructure open source. Readiness de migration niveau enterprise.",
      legal:
        "Shift Evidence est un service d'évaluation indépendant. Il n'est pas affilié, approuvé ou certifié par VMware, Broadcom ou Proxmox. Les noms VMware, Broadcom et Proxmox peuvent être des marques de leurs propriétaires respectifs et sont utilisés uniquement pour décrire le contexte de migration et les objectifs de compatibilité.",
    },
    es: {
      brand: "Auditorías enterprise de VMware a Proxmox. Chequeos totalmente automatizados, traducción personalizada y cero pérdida de datos, garantizado.",
      platform: "Plataforma",
      resources: "Recursos",
      checklist: "Checklist de migración gratis",
      stay: "Mantenete al día con calculadoras de ahorro de licencias y scripts previos a la migración.",
      copyright: "Todos los derechos reservados.",
      bottom: "Infraestructura open source. Preparación de migración de nivel enterprise.",
      legal:
        "Shift Evidence es un servicio de auditoría independiente. No está afiliado, respaldado ni certificado por VMware, Broadcom ni Proxmox. Los nombres VMware, Broadcom y Proxmox pueden ser marcas registradas de sus respectivos propietarios y se usan solo para describir el contexto de migración y los objetivos de compatibilidad.",
    },
    pt: {
      brand: "Avaliações enterprise de migração VMware para Proxmox. Verificações totalmente automatizadas, tradução personalizada e zero perda de dados, garantido.",
      platform: "Plataforma",
      resources: "Recursos",
      checklist: "Checklist gratuita de migração",
      stay: "Fique por dentro de calculadoras de economia de licenças e scripts pré-migração.",
      copyright: "Todos os direitos reservados.",
      bottom: "Infraestrutura open source. Readiness de migração nível enterprise.",
      legal:
        "Shift Evidence é um serviço de avaliação independente. Não é afiliado, endossado ou certificado por VMware, Broadcom ou Proxmox. Os nomes VMware, Broadcom e Proxmox podem ser marcas registradas de seus respectivos proprietários e são usados apenas para descrever o contexto de migração e os objetivos de compatibilidade.",
    },
    it: {
      brand: "Valutazioni enterprise di migrazione VMware verso Proxmox. Controlli totalmente automatizzati, traduzione personalizzata e zero perdita di dati, garantito.",
      platform: "Piattaforma",
      resources: "Risorse",
      checklist: "Checklist di migrazione gratuita",
      stay: "Resta aggiornato su calcolatori di risparmio licenze e script pre-migrazione.",
      copyright: "Tutti i diritti riservati.",
      bottom: "Infrastruttura open source. Readiness di migrazione livello enterprise.",
      legal:
        "Shift Evidence è un servizio di assessment indipendente. Non è affiliato, approvato o certificato da VMware, Broadcom o Proxmox. I nomi VMware, Broadcom e Proxmox possono essere marchi registrati dei rispettivi proprietari e sono usati solo per descrivere il contesto di migrazione e gli obiettivi di compatibilità.",
    },
  }[locale];
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(t(
      "Thank you! We will reach out to you with migration resources shortly.",
      "Gracias. Nos pondremos en contacto contigo pronto con recursos de migración.",
    ));
  };

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          {/* Brand Column */}
          <div className="footer-brand">
            <a
              href="#"
              className="logo-container"
              style={{ marginBottom: "0.5rem" }}
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle
                  cx="12"
                  cy="16"
                  r="8"
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="2.5"
                />
                <path
                  d="M12 16H24M24 16L20 12M24 16L20 20"
                  stroke="#8b5cf6"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>Shift Evidence</span>
            </a>
            <p style={{ fontSize: "0.85rem" }}>
              {copy.brand}
            </p>
          </div>

          {/* Quick Links */}
          <div className="footer-links-col">
            <h4 className="footer-links-title">{copy.platform}</h4>
            <ul className="footer-links-list">
              <li>
                <a href="#savings">{t("Savings Calculator")}</a>
              </li>
              <li>
                <a href="#features">{t("Core Features")}</a>
              </li>
              <li>
                <a href="#comparison">{t("VMware vs Proxmox")}</a>
              </li>
              <li>
                <a href="#process">{t("Migration Pipeline")}</a>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div className="footer-links-col">
            <h4 className="footer-links-title">{copy.resources}</h4>
            <ul className="footer-links-list">
              <li>
                <a href="#">{t("Subscription Cost Whitepaper")}</a>
              </li>
              <li>
                <a href="#">{t("Ceph Sizing Guide")}</a>
              </li>
              <li>
                <a href="#">{t("Proxmox Backup Server (PBS) Setup")}</a>
              </li>
              <li>
                <a href="#">{t("Broadcom Price Updates")}</a>
              </li>
            </ul>
          </div>

          {/* Newsletter / Contact */}
          <div className="footer-links-col">
            <h4 className="footer-links-title">{copy.checklist}</h4>
            <p style={{ fontSize: "0.85rem" }}>
              {copy.stay}
            </p>
            <form
              onSubmit={handleSubmit}
              className="cta-form"
              style={{ marginTop: "0.5rem", width: "100%", gap: "0.5rem" }}
            >
              <input
                type="email"
                placeholder={t("Enter work email")}
                required
                className="form-input"
                style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}
              />
              <button
                type="submit"
                className="btn btn-primary"
                style={{ padding: "0.5rem 1rem", borderRadius: "9999px" }}
              >
                <ArrowRight size={16} />
              </button>
            </form>
          </div>
        </div>

        <div className="footer-bottom">
          <span>
            &copy; {new Date().getFullYear()} Shift Evidence.{" "}
            {copy.copyright}
          </span>
          <span>{copy.bottom}</span>
        </div>

        <div className="footer-legal">
          <p>
            {copy.legal}
          </p>
        </div>
      </div>
    </footer>
  );
}
