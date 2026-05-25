import { useState, useEffect, useRef } from "react";
import { ChevronDown, Globe } from "lucide-react";
import { LANGUAGE_OPTIONS, useLocale } from "../i18n";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const { locale, setLocale, t } = useLocale();
  const languageRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        languageRef.current &&
        !languageRef.current.contains(event.target as Node)
      ) {
        setIsLanguageOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsLanguageOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const currentLanguage =
    LANGUAGE_OPTIONS.find((option) => option.code === locale) ??
    LANGUAGE_OPTIONS[0];

  return (
    <header className={`navbar-wrapper ${isScrolled ? "navbar-scrolled" : ""}`}>
      <div className="container navbar-container">
        <a href="#" className="logo-container">
          <svg
            width="28"
            height="28"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="nav-brand-logo"
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

        <nav>
          <ul className="nav-links">
            <li>
              <a href="#savings" className="nav-link">
                {t("Savings Calculator")}
              </a>
            </li>
            <li>
              <a href="#features" className="nav-link">
                {t("Core Features")}
              </a>
            </li>
            <li>
              <a href="#comparison" className="nav-link">
                {t("VMware vs Proxmox")}
              </a>
            </li>
            <li>
              <a href="#process" className="nav-link">
                {t("Migration Pipeline")}
              </a>
            </li>
            <li>
              <div className="language-picker" ref={languageRef}>
                <button
                  type="button"
                  className="language-picker-trigger"
                  onClick={() => setIsLanguageOpen((open) => !open)}
                  aria-haspopup="menu"
                  aria-expanded={isLanguageOpen}
                  aria-label={t("Select language")}
                >
                  <Globe size={13} />
                  <span>{currentLanguage.label}</span>
                  <ChevronDown
                    size={13}
                    className={`language-picker-chevron ${isLanguageOpen ? "open" : ""}`}
                  />
                </button>

                {isLanguageOpen && (
                  <div className="language-picker-menu" role="menu">
                    <div className="language-picker-header">Language</div>
                    {LANGUAGE_OPTIONS.map((option) => (
                      <button
                        key={option.code}
                        type="button"
                        role="menuitemradio"
                        aria-checked={locale === option.code}
                        onClick={() => {
                          setIsLanguageOpen(false);
                          setLocale(option.code);
                        }}
                        className={`language-picker-option ${locale === option.code ? "active" : ""}`}
                      >
                        <span className="language-picker-label">{option.label}</span>
                        <span className="language-picker-code">
                          {option.code.toUpperCase()}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
