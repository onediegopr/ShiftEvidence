import { useState, useEffect } from "react";
import { ArrowRight, Globe } from "lucide-react";
import vmwareLogo from "../../images/vmware.svg";
import { useLocale } from "../i18n";

interface NavbarProps {
  onOpenScanner: () => void;
}

export default function Navbar({ onOpenScanner }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const { locale, setLocale, t } = useLocale();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={`navbar-wrapper ${isScrolled ? "navbar-scrolled" : ""}`}>
      <div className="container navbar-container">
        <a href="#" className="logo-container">
          <img src={vmwareLogo} alt="" className="nav-brand-logo" />
          <span>Shift Evidence</span>
        </a>

        <nav>
          <ul className="nav-links">
            <li>
              <a href="#savings" className="nav-link">
                {t("Savings Calculator", "Calculadora de ahorro")}
              </a>
            </li>
            <li>
              <a href="#features" className="nav-link">
                {t("Core Features", "Funciones clave")}
              </a>
            </li>
            <li>
              <a href="#comparison" className="nav-link">
                {t("VMware vs Proxmox", "VMware vs Proxmox")}
              </a>
            </li>
            <li>
              <a href="#process" className="nav-link">
                {t("Migration Pipeline", "Pipeline de migraciÃ³n")}
              </a>
            </li>
            <li>
              <button
                type="button"
                onClick={() => setLocale(locale === "en" ? "es" : "en")}
                className="btn btn-secondary"
                style={{
                  padding: "0.45rem 0.9rem",
                  fontSize: "0.8rem",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.45rem",
                }}
                aria-label={t("Switch language", "Cambiar idioma")}
              >
                <Globe size={14} />
                <span aria-hidden="true">{locale === "en" ? "EN" : "ES"}</span>
                <span style={{ fontSize: "0.72rem", letterSpacing: "0.08em" }}>
                  {locale === "en" ? "English" : "EspaÃ±ol"}
                </span>
              </button>
            </li>
            <li>
              <button
                onClick={onOpenScanner}
                className="btn btn-secondary"
                style={{ padding: "0.5rem 1.25rem", fontSize: "0.85rem" }}
              >
                {t("Scan Cluster", "Escanear clÃºster")}
              </button>
            </li>
            <li>
              <button
                onClick={onOpenScanner}
                className="btn btn-primary btn-glow"
                style={{ padding: "0.5rem 1.25rem", fontSize: "0.85rem" }}
              >
                {t("Run Free Audit", "Ejecutar auditorÃ­a gratis")}
                <ArrowRight size={14} />
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
