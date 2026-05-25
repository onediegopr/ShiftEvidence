import { useState } from "react";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import SavingsCalculator from "./components/SavingsCalculator";
import Features from "./components/Features";
import Process from "./components/Process";
import Footer from "./components/Footer";
import ReadinessValidator from "./components/ReadinessValidator";
import vmwareLogo from "../images/vmware.svg";
import proxmoxLogo from "../images/proxmox.svg";
import { useLocale } from "./i18n";
import {
  ArrowRight,
  ShieldCheck,
  HelpCircle,
  BarChart3,
  FileText,
  Shield,
} from "lucide-react";

export default function App() {
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const { t } = useLocale();

  const handleOpenScanner = () => setIsScannerOpen(true);
  const handleCloseScanner = () => setIsScannerOpen(false);

  const handleCtaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsScannerOpen(true);
  };

  return (
    <>
      {/* Scrollable Main Container */}
      <Navbar onOpenScanner={handleOpenScanner} />

      <main style={{ flexGrow: 1 }}>
        <Hero onOpenScanner={handleOpenScanner} />

        {/* Credibility Strip */}
        <section className="credibility-strip">
          <div className="bg-mesh"></div>
          <div className="container">
            <div className="credibility-header">
              <div className="badge badge-cyan">Methodology</div>
              <h2 className="credibility-title">
                {t(
                  "Enterprise VMware discipline, without production access.",
                  "Disciplina enterprise de VMware, sin acceso a producciÃ³n.",
                )}
              </h2>
              <p className="credibility-body">
                {t(
                  "This independent readiness methodology was developed by a former VMware Technical Account Manager and is designed to bring enterprise-grade risk review, evidence discipline and migration planning structure to VMware to Proxmox decisions.",
                  "Esta metodologÃ­a independiente de preparaciÃ³n fue desarrollada por un ex VMware Technical Account Manager y estÃ¡ diseÃ±ada para aportar revisiÃ³n de riesgo de nivel enterprise, disciplina de evidencias y una estructura de planificaciÃ³n de migraciÃ³n para decisiones de VMware a Proxmox.",
                )}
              </p>
            </div>

            <div className="credibility-cards">
              <div className="cred-card">
                <div className="cred-card-icon cred-icon-cyan">
                  <Shield size={22} />
                </div>
                <div className="cred-card-text">
                  <strong>
                    {t(
                      "Former VMware TAM-led methodology",
                      "MetodologÃ­a liderada por un ex VMware TAM",
                    )}
                  </strong>
                  <span>
                    {t(
                      "Built from real-world enterprise advisory experience, not guesswork.",
                      "Basada en experiencia real de asesorÃ­a enterprise, no en suposiciones.",
                    )}
                  </span>
                </div>
              </div>
              <div className="cred-card">
                <div className="cred-card-icon cred-icon-cyan">
                  <BarChart3 size={22} />
                </div>
                <div className="cred-card-text">
                  <strong>
                    {t(
                      "Evidence-based, not guess-based",
                      "Basada en evidencias, no en intuiciÃ³n",
                    )}
                  </strong>
                  <span>
                    {t(
                      "Every risk, gap and recommendation is backed by collected infrastructure evidence.",
                      "Cada riesgo, brecha y recomendaciÃ³n estÃ¡ respaldado por evidencias de infraestructura recolectadas.",
                    )}
                  </span>
                </div>
              </div>
              <div className="cred-card">
                <div className="cred-card-icon cred-icon-emerald">
                  <ShieldCheck size={22} />
                </div>
                <div className="cred-card-text">
                  <strong>{t("No production changes", "Sin cambios en producciÃ³n")}</strong>
                  <span>
                    {t(
                      "Read-only assessment. Zero agents, zero credentials, zero impact on running workloads.",
                      "AuditorÃ­a en solo lectura. Cero agentes, cero credenciales, cero impacto sobre las cargas en ejecuciÃ³n.",
                    )}
                  </span>
                </div>
              </div>
              <div className="cred-card">
                <div className="cred-card-icon cred-icon-cyan">
                  <FileText size={22} />
                </div>
                <div className="cred-card-text">
                  <strong>
                    {t(
                      "Executive + technical outputs",
                      "Entregables ejecutivos + tÃ©cnicos",
                    )}
                  </strong>
                  <span>
                    {t(
                      "Ready-to-share reports for both engineering teams and business stakeholders.",
                      "Informes listos para compartir con equipos tÃ©cnicos y con las Ã¡reas de negocio.",
                    )}
                  </span>
                </div>
              </div>
            </div>

            <div className="credibility-footer">
              <span className="credibility-disclaimer">
                {t(
                  "Independent methodology. Not affiliated with, endorsed by or certified by VMware/Broadcom.",
                  "MetodologÃ­a independiente. No afiliada, respaldada ni certificada por VMware/Broadcom.",
                )}
              </span>
            </div>
          </div>
        </section>

        <SavingsCalculator />

        <Features />

        <Process />

        {/* FAQ Section */}
        <section id="faq" className="section faq-section">
          <div className="container">
            <div className="text-center mb-8">
              <div className="badge badge-cyan">FAQ</div>
              <div className="faq-brands">
                <div className="faq-brand vmware">
                  <img src={vmwareLogo} alt="" className="faq-brand-logo" />
                  VMware
                </div>
                <ArrowRight size={16} className="cta-arrow" />
                <div className="faq-brand proxmox">
                  <img src={proxmoxLogo} alt="" className="faq-brand-logo" />
                  Proxmox
                </div>
              </div>
              <h2 className="mb-4">
                {t("Frequently Asked Questions", "Preguntas frecuentes")}
              </h2>
            </div>
            <div className="faq-list">
              <div className="faq-item">
                <div className="faq-q">
                  {t(
                    "Is this assessment certified by VMware or Proxmox?",
                    "Â¿Esta auditorÃ­a estÃ¡ certificada por VMware o Proxmox?",
                  )}
                </div>
                <div className="faq-a">
                  {t(
                    "No. This is an independent readiness assessment. It is not affiliated with, endorsed by or certified by VMware, Broadcom or Proxmox. The methodology was developed by a former VMware Technical Account Manager to bring enterprise-grade risk review and evidence discipline to VMware to Proxmox planning.",
                    "No. Esta es una auditorÃ­a independiente de preparaciÃ³n. No estÃ¡ afiliada, respaldada ni certificada por VMware, Broadcom ni Proxmox. La metodologÃ­a fue desarrollada por un ex VMware Technical Account Manager para aportar revisiÃ³n de riesgo de nivel enterprise y disciplina de evidencias a la planificaciÃ³n de VMware a Proxmox.",
                  )}
                </div>
              </div>
              <div className="faq-item">
                <div className="faq-q">
                  {t(
                    'What does "Former VMware TAM-led methodology" mean?',
                    'Â¿QuÃ© significa "MetodologÃ­a liderada por un ex VMware TAM"?',
                  )}
                </div>
                <div className="faq-a">
                  {t(
                    "It means the assessment structure was designed from real-world VMware enterprise advisory experience: evidence review, risk classification, migration readiness, gaps, executive communication and validation points. It does not mean VMware officially certifies or endorses the report.",
                    "Significa que la estructura de la auditorÃ­a fue diseÃ±ada a partir de experiencia real de asesorÃ­a enterprise en VMware: revisiÃ³n de evidencias, clasificaciÃ³n de riesgo, preparaciÃ³n de migraciÃ³n, brechas, comunicaciÃ³n ejecutiva y puntos de validaciÃ³n. No significa que VMware certifique o respalde oficialmente el informe.",
                  )}
                </div>
              </div>
              <div className="faq-item">
                <div className="faq-q">{t("Why does that matter?", "Â¿Por quÃ© importa?")}</div>
                <div className="faq-a">
                  {t(
                    "VMware to Proxmox migration is not only a technical import task. It requires risk prioritization, evidence quality review, workload classification, business continuity thinking and a clear plan for what should move first, what needs remediation and what should wait.",
                    "La migraciÃ³n de VMware a Proxmox no es solo una tarea tÃ©cnica de importaciÃ³n. Requiere priorizaciÃ³n de riesgos, revisiÃ³n de calidad de evidencias, clasificaciÃ³n de cargas, enfoque de continuidad de negocio y un plan claro sobre quÃ© debe moverse primero, quÃ© necesita remediaciÃ³n y quÃ© debe esperar.",
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Bottom Call-To-Action (CTA) Section */}
        <section
          className="section cta-section"
          style={{ background: "rgba(6, 9, 19, 0.4)" }}
        >
          <div className="bg-mesh"></div>
          <div
            className="glow-orb"
            style={{
              top: "20%",
              left: "20%",
              width: "350px",
              height: "350px",
              background: "rgba(184, 54, 59, 0.08)",
            }}
          ></div>
          <div
            className="glow-orb"
            style={{
              bottom: "10%",
              right: "15%",
              width: "300px",
              height: "300px",
              background: "rgba(229, 112, 0, 0.08)",
            }}
          ></div>

          <div className="container">
            <div className="glass-card cta-box">
              {/* Mini brand badges */}
              <div className="cta-brands">
                <div className="cta-brand vmware">
                  <img src={vmwareLogo} alt="" className="cta-brand-logo" />
                  VMware
                </div>
                <ArrowRight size={18} className="cta-arrow" />
                <div className="cta-brand proxmox">
                  <img src={proxmoxLogo} alt="" className="cta-brand-logo" />
                  Proxmox
                </div>
              </div>

              <h2 className="mb-2" style={{ color: "white" }}>
                {t("Assure Your Proxmox Shift", "AsegurÃ¡ tu salto a Proxmox")}
              </h2>
              <p className="cta-subtitle">
                <span className="cta-pain">
                  {t(
                    "Stop paying VMware renewal bills.",
                    "DejÃ¡ de pagar renovaciones de VMware.",
                  )}
                </span>{" "}
                {t(
                  "Run our pre-flight cluster check to receive a detailed compatibility scorecard and technical migration plan.",
                  "EjecutÃ¡ nuestro chequeo previo del clÃºster para recibir una tarjeta de compatibilidad detallada y un plan tÃ©cnico de migraciÃ³n.",
                )}
              </p>

              <form onSubmit={handleCtaSubmit} className="cta-form">
                <input
                  type="email"
                  placeholder={t("Enter corporate email", "IngresÃ¡ tu correo corporativo")}
                  required
                  className="form-input"
                />
                <button
                  type="submit"
                  className="btn btn-primary btn-glow cta-btn"
                >
                  {t("Initialize Scan", "Iniciar escaneo")}
                  <ArrowRight size={18} />
                </button>
              </form>

              <div className="cta-trust">
                <div className="cta-trust-item">
                  <ShieldCheck size={18} />
                  <span>{t("No ESXi agents required", "No requiere agentes ESXi")}</span>
                </div>
                <div className="cta-trust-item">
                  <HelpCircle size={18} />
                  <span>
                    {t(
                      "Read-only configuration check",
                      "Chequeo de configuraciÃ³n en solo lectura",
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {/* Interactive Scan Diagnostic Modal */}
      <ReadinessValidator isOpen={isScannerOpen} onClose={handleCloseScanner} />
    </>
  );
}
