import { ArrowRight } from "lucide-react";
import { useLocale } from "../i18n";

export default function Footer() {
  const { t } = useLocale();
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(t(
      "Thank you! We will reach out to you with migration resources shortly.",
      "Gracias. Nos pondremos en contacto contigo pronto con recursos de migraciÃ³n.",
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
              {t(
                "Enterprise-grade VMware to Proxmox migration assessments. Fully automated checks, custom translation, and zero data loss, guaranteed.",
                "AuditorÃ­as enterprise de VMware a Proxmox. Chequeos totalmente automatizados, traducciÃ³n personalizada y cero pÃ©rdida de datos, garantizado.",
              )}
            </p>
          </div>

          {/* Quick Links */}
          <div className="footer-links-col">
            <h4 className="footer-links-title">{t("Platform", "Plataforma")}</h4>
            <ul className="footer-links-list">
              <li>
                <a href="#savings">{t("Savings Calculator", "Calculadora de ahorro")}</a>
              </li>
              <li>
                <a href="#features">{t("Core Features", "Funciones clave")}</a>
              </li>
              <li>
                <a href="#comparison">{t("VMware vs Proxmox", "VMware vs Proxmox")}</a>
              </li>
              <li>
                <a href="#process">{t("Migration Pipeline", "Pipeline de migraciÃ³n")}</a>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div className="footer-links-col">
            <h4 className="footer-links-title">{t("Resources", "Recursos")}</h4>
            <ul className="footer-links-list">
              <li>
                <a href="#">{t("Subscription Cost Whitepaper", "Whitepaper de costos de suscripciÃ³n")}</a>
              </li>
              <li>
                <a href="#">{t("Ceph Sizing Guide", "GuÃ­a de dimensionamiento de Ceph")}</a>
              </li>
              <li>
                <a href="#">{t("Proxmox Backup Server (PBS) Setup", "ConfiguraciÃ³n de Proxmox Backup Server (PBS)")}</a>
              </li>
              <li>
                <a href="#">{t("Broadcom Price Updates", "Actualizaciones de precios de Broadcom")}</a>
              </li>
            </ul>
          </div>

          {/* Newsletter / Contact */}
          <div className="footer-links-col">
            <h4 className="footer-links-title">{t("Get Free Migration Checklist", "ObtenÃ© la checklist gratis de migraciÃ³n")}</h4>
            <p style={{ fontSize: "0.85rem" }}>
              {t(
                "Stay updated on license saving calculators and pre-migration scripts.",
                "Mantenete al dÃ­a con calculadoras de ahorro de licencias y scripts previos a la migraciÃ³n.",
              )}
            </p>
            <form
              onSubmit={handleSubmit}
              className="cta-form"
              style={{ marginTop: "0.5rem", width: "100%", gap: "0.5rem" }}
            >
              <input
                type="email"
                placeholder={t("Enter work email", "IngresÃ¡ tu email laboral")}
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
            {t("All rights reserved.", "Todos los derechos reservados.")}
          </span>
          <span>
            {t(
              "Open-source infrastructure. Enterprise-grade migration readiness.",
              "Infraestructura open source. PreparaciÃ³n de migraciÃ³n de nivel enterprise.",
            )}
          </span>
        </div>

        <div className="footer-legal">
          <p>
            {t(
              "Shift Evidence is an independent assessment service. It is not affiliated with, endorsed by or certified by VMware, Broadcom or Proxmox. VMware, Broadcom and Proxmox names may be trademarks of their respective owners and are used only to describe migration context and compatibility targets.",
              "Shift Evidence es un servicio de auditorÃ­a independiente. No estÃ¡ afiliado, respaldado ni certificado por VMware, Broadcom ni Proxmox. Los nombres VMware, Broadcom y Proxmox pueden ser marcas registradas de sus respectivos propietarios y se usan solo para describir el contexto de migraciÃ³n y los objetivos de compatibilidad.",
            )}
          </p>
        </div>
      </div>
    </footer>
  );
}
