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
  const { locale } = useLocale();
  const appCopy = {
    en: {
      methodology: "Methodology",
      credibilityTitle: "Enterprise VMware discipline, without production access.",
      credibilityBody:
        "This independent readiness methodology was developed by a former VMware Technical Account Manager and is designed to bring enterprise-grade risk review, evidence discipline and migration planning structure to VMware to Proxmox decisions.",
      formerTam: "Former VMware TAM-led methodology",
      formerTamBody: "Built from real-world enterprise advisory experience, not guesswork.",
      evidence: "Evidence-based, not guess-based",
      evidenceBody: "Every risk, gap and recommendation is backed by collected infrastructure evidence.",
      noProd: "No production changes",
      noProdBody: "Read-only assessment. Zero agents, zero credentials, zero impact on running workloads.",
      outputs: "Executive + technical outputs",
      outputsBody: "Ready-to-share reports for both engineering teams and business stakeholders.",
      disclaimer: "Independent methodology. Not affiliated with, endorsed by or certified by VMware/Broadcom.",
      faqTitle: "Frequently Asked Questions",
      q1: "Is this assessment certified by VMware or Proxmox?",
      a1: "No. This is an independent readiness assessment. It is not affiliated with, endorsed by or certified by VMware, Broadcom or Proxmox. The methodology was developed by a former VMware Technical Account Manager to bring enterprise-grade risk review and evidence discipline to VMware to Proxmox planning.",
      q2: 'What does "Former VMware TAM-led methodology" mean?',
      a2: "It means the assessment structure was designed from real-world VMware enterprise advisory experience: evidence review, risk classification, migration readiness, gaps, executive communication and validation points. It does not mean VMware officially certifies or endorses the report.",
      q3: "Why does that matter?",
      a3: "VMware to Proxmox migration is not only a technical import task. It requires risk prioritization, evidence quality review, workload classification, business continuity thinking and a clear plan for what should move first, what needs remediation and what should wait.",
      ctaTitle: "Assure Your Proxmox Shift",
      ctaPain: "Stop paying VMware renewal bills.",
      ctaBody: "Run our pre-flight cluster check to receive a detailed compatibility scorecard and technical migration plan.",
      ctaInput: "Enter corporate email",
      ctaBtn: "Initialize Scan",
      noAgents: "No ESXi agents required",
      readOnly: "Read-only configuration check",
      footerTag: "Platform",
      resourcesTag: "Resources",
      checklist: "Get Free Migration Checklist",
      footerText: "Stay updated on license saving calculators and pre-migration scripts.",
      copyright: "All rights reserved.",
      footerBottom: "Open-source infrastructure. Enterprise-grade migration readiness.",
      footerLegal:
        "Shift Evidence is an independent assessment service. It is not affiliated with, endorsed by or certified by VMware, Broadcom or Proxmox. VMware, Broadcom and Proxmox names may be trademarks of their respective owners and are used only to describe migration context and compatibility targets.",
    },
    de: {
      methodology: "Methodik",
      credibilityTitle: "Enterprise-Disziplin für VMware, ohne Produktionszugriff.",
      credibilityBody:
        "Diese unabhängige Readiness-Methodik wurde von einem ehemaligen VMware Technical Account Manager entwickelt und soll Enterprise-Risikoanalyse, Evidenz-Disziplin und Migrationsplanung in VMware-zu-Proxmox-Entscheidungen bringen.",
      formerTam: "Methodik eines ehemaligen VMware TAM",
      formerTamBody: "Auf Basis realer Enterprise-Consulting-Erfahrung, nicht auf Vermutungen.",
      evidence: "Evidenzbasiert statt gefühlsbasiert",
      evidenceBody: "Jedes Risiko, jede Lücke und jede Empfehlung ist durch gesammelte Infrastruktur-Evidenz belegt.",
      noProd: "Keine Produktionsänderungen",
      noProdBody: "Read-only-Assessment. Keine Agenten, keine Credentials, kein Einfluss auf laufende Workloads.",
      outputs: "Executive- und Technik-Outputs",
      outputsBody: "Berichte zum direkten Teilen für Engineering-Teams und Business-Stakeholder.",
      disclaimer: "Unabhängige Methodik. Nicht mit VMware/Broadcom verbunden, unterstützt oder zertifiziert.",
      faqTitle: "Häufige Fragen",
      q1: "Ist diese Bewertung von VMware oder Proxmox zertifiziert?",
      a1: "Nein. Dies ist eine unabhängige Readiness-Bewertung. Sie ist nicht mit VMware, Broadcom oder Proxmox verbunden, unterstützt oder zertifiziert. Die Methodik wurde von einem ehemaligen VMware Technical Account Manager entwickelt, um Enterprise-Risikoanalyse und Evidenz-Disziplin in die VMware-zu-Proxmox-Planung zu bringen.",
      q2: 'Was bedeutet "Methodik eines ehemaligen VMware TAM"?',
      a2: "Die Bewertungsstruktur wurde aus realer VMware-Enterprise-Beratungserfahrung entwickelt: Evidenzprüfung, Risikoklassifizierung, Migrationsbereitschaft, Lücken, Executive-Kommunikation und Validierungspunkte. Das bedeutet nicht, dass VMware den Bericht offiziell zertifiziert oder unterstützt.",
      q3: "Warum ist das wichtig?",
      a3: "Die Migration von VMware zu Proxmox ist nicht nur ein technischer Import. Sie braucht Risikopriorisierung, Evidenzqualität, Workload-Klassifizierung, Business-Continuity-Denken und einen klaren Plan, was zuerst migriert wird, was Remediation braucht und was warten soll.",
      ctaTitle: "Sichern Sie Ihren Proxmox-Umstieg",
      ctaPain: "Hören Sie auf, VMware-Verlängerungen zu bezahlen.",
      ctaBody: "Führen Sie unseren Pre-Flight-Cluster-Check aus, um eine detaillierte Kompatibilitäts-Scorecard und einen technischen Migrationsplan zu erhalten.",
      ctaInput: "Firmen-E-Mail eingeben",
      ctaBtn: "Scan starten",
      noAgents: "Keine ESXi-Agenten erforderlich",
      readOnly: "Read-only-Konfigurationscheck",
      footerTag: "Plattform",
      resourcesTag: "Ressourcen",
      checklist: "Kostenlose Migrations-Checkliste",
      footerText: "Bleiben Sie über Lizenzersparnis-Rechner und Pre-Migration-Skripte informiert.",
      copyright: "Alle Rechte vorbehalten.",
      footerBottom: "Open-Source-Infrastruktur. Enterprise-Readiness für Migrationen.",
      footerLegal:
        "Shift Evidence ist ein unabhängiger Assessment-Service. Er ist nicht mit VMware, Broadcom oder Proxmox verbunden, unterstützt oder zertifiziert. Die Namen VMware, Broadcom und Proxmox können Marken ihrer jeweiligen Eigentümer sein und werden nur verwendet, um den Migrationskontext und die Kompatibilitätsziele zu beschreiben.",
    },
    fr: {
      methodology: "Méthodologie",
      credibilityTitle: "Discipline enterprise VMware, sans accès à la production.",
      credibilityBody:
        "Cette méthodologie de readiness indépendante a été développée par un ancien VMware Technical Account Manager et vise à apporter revue de risque enterprise, discipline des preuves et structure de planification aux décisions VMware vers Proxmox.",
      formerTam: "Méthodologie menée par un ancien VMware TAM",
      formerTamBody: "Fondée sur une expérience réelle de conseil enterprise, pas sur des suppositions.",
      evidence: "Basée sur les preuves, pas sur l'intuition",
      evidenceBody: "Chaque risque, écart et recommandation est soutenu par des preuves d'infrastructure collectées.",
      noProd: "Aucun changement en production",
      noProdBody: "Audit en lecture seule. Aucun agent, aucune credential, aucun impact sur les workloads en cours.",
      outputs: "Livrables exécutifs et techniques",
      outputsBody: "Rapports prêts à partager pour les équipes d'ingénierie et les parties prenantes métier.",
      disclaimer: "Méthodologie indépendante. Non affiliée, approuvée ou certifiée par VMware/Broadcom.",
      faqTitle: "Questions fréquentes",
      q1: "Cette évaluation est-elle certifiée par VMware ou Proxmox ?",
      a1: "Non. Il s'agit d'une évaluation de readiness indépendante. Elle n'est pas affiliée, approuvée ou certifiée par VMware, Broadcom ou Proxmox. La méthodologie a été développée par un ancien VMware Technical Account Manager pour apporter revue de risque enterprise et discipline des preuves à la planification VMware vers Proxmox.",
      q2: 'Que signifie "méthodologie menée par un ancien VMware TAM" ?',
      a2: "Cela signifie que la structure d'évaluation a été conçue à partir d'une véritable expérience de conseil enterprise VMware : revue des preuves, classification du risque, préparation à la migration, écarts, communication exécutive et points de validation. Cela ne signifie pas que VMware certifie ou approuve officiellement le rapport.",
      q3: "Pourquoi est-ce important ?",
      a3: "La migration VMware vers Proxmox n'est pas qu'une tâche technique d'import. Elle exige priorisation des risques, revue de la qualité des preuves, classification des workloads, continuité d'activité et un plan clair pour ce qui doit partir en premier, ce qui nécessite une remédiation et ce qui doit attendre.",
      ctaTitle: "Sécurisez votre passage à Proxmox",
      ctaPain: "Arrêtez de payer les renouvellements VMware.",
      ctaBody: "Lancez notre vérification pré-vol du cluster pour obtenir une scorecard de compatibilité détaillée et un plan technique de migration.",
      ctaInput: "Entrez l'e-mail entreprise",
      ctaBtn: "Lancer le scan",
      noAgents: "Aucun agent ESXi requis",
      readOnly: "Vérification de configuration en lecture seule",
      footerTag: "Plateforme",
      resourcesTag: "Ressources",
      checklist: "Checklist de migration gratuite",
      footerText: "Restez informé des calculateurs d'économies de licences et des scripts de pré-migration.",
      copyright: "Tous droits réservés.",
      footerBottom: "Infrastructure open source. Readiness de migration niveau enterprise.",
      footerLegal:
        "Shift Evidence est un service d'évaluation indépendant. Il n'est pas affilié, approuvé ou certifié par VMware, Broadcom ou Proxmox. Les noms VMware, Broadcom et Proxmox peuvent être des marques de leurs propriétaires respectifs et sont utilisés uniquement pour décrire le contexte de migration et les objectifs de compatibilité.",
    },
    es: {
      methodology: "Metodología",
      credibilityTitle: "Disciplina enterprise de VMware, sin acceso a producción.",
      credibilityBody:
        "Esta metodología independiente de preparación fue desarrollada por un ex VMware Technical Account Manager y está diseñada para aportar revisión de riesgo de nivel enterprise, disciplina de evidencias y una estructura de planning de migration para decisiones de VMware a Proxmox.",
      formerTam: "Metodología liderada por un ex VMware TAM",
      formerTamBody: "Basada en experiencia real de asesoría enterprise, no en suposiciones.",
      evidence: "Basada en evidencias, no en intuición",
      evidenceBody: "Cada riesgo, brecha y recomendación está respaldado por evidencias de infraestructura recolectadas.",
      noProd: "No production changes",
      noProdBody: "Auditoría en solo lectura. Cero agentes, cero credenciales, cero impacto sobre las cargas en ejecución.",
      outputs: "Entregables ejecutivos + técnicos",
      outputsBody: "Informes listos para compartir con equipos técnicos y con las áreas de negocio.",
      disclaimer: "Metodología independiente. No afiliada, respaldada ni certificada por VMware/Broadcom.",
      faqTitle: "Preguntas frecuentes",
      q1: "¿Esta auditoría está certificada por VMware o Proxmox?",
      a1: "No. Esta es una auditoría independiente de preparación. No está afiliada, respaldada ni certificada por VMware, Broadcom ni Proxmox. La metodología fue desarrollada por un ex VMware Technical Account Manager para aportar revisión de riesgo de nivel enterprise y disciplina de evidencias a la planificación de VMware a Proxmox.",
      q2: '¿Qué significa "Metodología liderada por un ex VMware TAM"?',
      a2: "Significa que la estructura de la auditoría fue diseñada a partir de experiencia real de asesoría enterprise en VMware: revisión de evidencias, clasificación de riesgo, preparación de migración, brechas, comunicación ejecutiva y puntos de validación. No significa que VMware certifique o respalde oficialmente el informe.",
      q3: "¿Por qué eso importa?",
      a3: "La migración de VMware a Proxmox no es solo una tarea técnica de importación. Requiere priorización de riesgos, revisión de calidad de evidencias, clasificación de workloads, enfoque de continuidad de negocio y un plan claro sobre qué debe moverse primero, qué necesita remediación y qué debe esperar.",
      ctaTitle: "Asegura tu salto a Proxmox",
      ctaPain: "Dejá de pagar renovaciones de VMware.",
      ctaBody: "Ejecutá nuestro chequeo previo del cluster para recibir una tarjeta de compatibilidad detallada y un plan técnico de migración.",
      ctaInput: "Ingresá el email corporativo",
      ctaBtn: "Iniciar escaneo",
      noAgents: "No ESXi agents required",
      readOnly: "Chequeo de configuración en solo lectura",
      footerTag: "Plataforma",
      resourcesTag: "Recursos",
      checklist: "Checklist de migración gratis",
      footerText: "Mantenete al día con calculadoras de ahorro de licencias y scripts previos a la migración.",
      copyright: "Todos los derechos reservados.",
      footerBottom: "Infraestructura open source. Preparación de migración de nivel enterprise.",
      footerLegal:
        "Shift Evidence es un servicio de auditoría independiente. No está afiliado, respaldado ni certificado por VMware, Broadcom ni Proxmox. Los nombres VMware, Broadcom y Proxmox pueden ser marcas registradas de sus respectivos propietarios y se usan solo para describir el contexto de migración y los objetivos de compatibilidad.",
    },
    pt: {
      methodology: "Metodologia",
      credibilityTitle: "Disciplina enterprise VMware, sem acesso à produção.",
      credibilityBody:
        "Esta metodologia independente de readiness foi desenvolvida por um ex VMware Technical Account Manager e foi desenhada para trazer revisão de risco enterprise, disciplina de evidências e estrutura de planning de migration para decisões VMware para Proxmox.",
      formerTam: "Metodologia liderada por um ex VMware TAM",
      formerTamBody: "Baseada em experiência real de consultoria enterprise, não em suposições.",
      evidence: "Baseada em evidências, não em achismos",
      evidenceBody: "Cada risco, gap e recomendação é respaldado por evidências de infraestrutura coletadas.",
      noProd: "Sem mudanças em produção",
      noProdBody: "Auditoria em read-only. Zero agentes, zero credenciais, zero impacto nas workloads em execução.",
      outputs: "Entregáveis executivos e técnicos",
      outputsBody: "Relatórios prontos para compartilhar com equipes técnicas e stakeholders de negócio.",
      disclaimer: "Metodologia independente. Não afiliada, endossada ou certificada por VMware/Broadcom.",
      faqTitle: "Perguntas frequentes",
      q1: "Esta avaliação é certificada pela VMware ou Proxmox?",
      a1: "Não. Esta é uma avaliação de readiness independente. Não é afiliada, endossada ou certificada por VMware, Broadcom ou Proxmox. A metodologia foi desenvolvida por um ex VMware Technical Account Manager para trazer revisão de risco enterprise e disciplina de evidências ao planning VMware para Proxmox.",
      q2: 'O que significa "metodologia liderada por um ex VMware TAM"?',
      a2: "Significa que a estrutura da avaliação foi desenhada a partir de experiência real de consultoria enterprise em VMware: revisão de evidências, classificação de risco, preparação para migração, gaps, comunicação executiva e pontos de validação. Não significa que a VMware certifica ou endossa oficialmente o relatório.",
      q3: "Por que isso importa?",
      a3: "A migração VMware para Proxmox não é apenas uma tarefa técnica de importação. Ela exige priorização de riscos, revisão de qualidade de evidências, classificação de workloads, foco em continuidade de negócio e um plano claro sobre o que mover primeiro, o que precisa de remediação e o que deve esperar.",
      ctaTitle: "Garanta sua mudança para Proxmox",
      ctaPain: "Pare de pagar renovações VMware.",
      ctaBody: "Execute nosso check pré-voo do cluster para receber uma scorecard de compatibilidade detalhada e um plano técnico de migração.",
      ctaInput: "Digite o e-mail corporativo",
      ctaBtn: "Iniciar scan",
      noAgents: "Sem agentes ESXi",
      readOnly: "Verificação de configuração read-only",
      footerTag: "Plataforma",
      resourcesTag: "Recursos",
      checklist: "Checklist gratuito de migração",
      footerText: "Fique por dentro de calculadoras de economia de licenças e scripts pré-migração.",
      copyright: "Todos os direitos reservados.",
      footerBottom: "Infraestrutura open source. Readiness de migração nível enterprise.",
      footerLegal:
        "Shift Evidence é um serviço de avaliação independente. Não é afiliado, endossado ou certificado por VMware, Broadcom ou Proxmox. Os nomes VMware, Broadcom e Proxmox podem ser marcas registradas de seus respectivos proprietários e são usados apenas para descrever o contexto de migração e os objetivos de compatibilidade.",
    },
    it: {
      methodology: "Metodologia",
      credibilityTitle: "Disciplina enterprise VMware, senza accesso alla produzione.",
      credibilityBody:
        "Questa metodologia indipendente di readiness è stata sviluppata da un ex VMware Technical Account Manager ed è pensata per portare revisione del rischio enterprise, disciplina delle evidenze e struttura di planning di migration alle decisioni VMware verso Proxmox.",
      formerTam: "Metodologia guidata da un ex VMware TAM",
      formerTamBody: "Basata su esperienza reale di advisory enterprise, non su supposizioni.",
      evidence: "Basata sulle evidenze, non sulle ipotesi",
      evidenceBody: "Ogni rischio, gap e raccomandazione è supportato da evidenze infrastrutturali raccolte.",
      noProd: "Nessuna modifica in produzione",
      noProdBody: "Assessment read-only. Zero agenti, zero credenziali, zero impatto sui workload in esecuzione.",
      outputs: "Output executive e tecnici",
      outputsBody: "Report pronti da condividere con team tecnici e stakeholder business.",
      disclaimer: "Metodologia indipendente. Non affiliata, approvata o certificata da VMware/Broadcom.",
      faqTitle: "Domande frequenti",
      q1: "Questa valutazione è certificata da VMware o Proxmox?",
      a1: "No. Questa è una valutazione di readiness indipendente. Non è affiliata, approvata o certificata da VMware, Broadcom o Proxmox. La metodologia è stata sviluppata da un ex VMware Technical Account Manager per portare revisione del rischio enterprise e disciplina delle evidenze al planning VMware verso Proxmox.",
      q2: 'Cosa significa "metodologia guidata da un ex VMware TAM"?',
      a2: "Significa che la struttura della valutazione è stata progettata a partire da esperienza reale di advisory enterprise in VMware: revisione delle evidenze, classificazione del rischio, preparazione alla migrazione, gap, comunicazione executive e punti di validazione. Non significa che VMware certifichi o approvi ufficialmente il report.",
      q3: "Perché è importante?",
      a3: "La migrazione VMware verso Proxmox non è solo un task tecnico di importazione. Richiede prioritizzazione del rischio, revisione della qualità delle evidenze, classificazione dei workload, continuità operativa e un piano chiaro su cosa spostare per primo, cosa richiede remediation e cosa deve aspettare.",
      ctaTitle: "Assicura il tuo passaggio a Proxmox",
      ctaPain: "Smetti di pagare i rinnovi VMware.",
      ctaBody: "Esegui il nostro check pre-flight del cluster per ricevere una scorecard di compatibilità dettagliata e un piano tecnico di migrazione.",
      ctaInput: "Inserisci l'email aziendale",
      ctaBtn: "Avvia scan",
      noAgents: "Nessun agente ESXi richiesto",
      readOnly: "Verifica di configurazione read-only",
      footerTag: "Piattaforma",
      resourcesTag: "Risorse",
      checklist: "Checklist di migrazione gratuita",
      footerText: "Resta aggiornato su calcolatori di risparmio licenze e script pre-migrazione.",
      copyright: "Tutti i diritti riservati.",
      footerBottom: "Infrastruttura open source. Readiness di migrazione livello enterprise.",
      footerLegal:
        "Shift Evidence è un servizio di assessment indipendente. Non è affiliato, approvato o certificato da VMware, Broadcom o Proxmox. I nomi VMware, Broadcom e Proxmox possono essere marchi registrati dei rispettivi proprietari e sono usati solo per descrivere il contesto di migrazione e gli obiettivi di compatibilità.",
    },
  }[locale];

  const handleOpenScanner = () => setIsScannerOpen(true);
  const handleCloseScanner = () => setIsScannerOpen(false);

  const handleCtaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsScannerOpen(true);
  };

  return (
    <>
      {/* Scrollable Main Container */}
      <Navbar />

      <main style={{ flexGrow: 1 }}>
        <Hero onOpenScanner={handleOpenScanner} />

        {/* Credibility Strip */}
        <section className="credibility-strip">
          <div className="bg-mesh"></div>
          <div className="container">
            <div className="credibility-header">
              <div className="badge badge-cyan">{appCopy.methodology}</div>
              <h2 className="credibility-title">
                {appCopy.credibilityTitle}
              </h2>
              <p className="credibility-body">
                {appCopy.credibilityBody}
              </p>
            </div>

            <div className="credibility-cards">
              <div className="cred-card">
                <div className="cred-card-icon cred-icon-cyan">
                  <Shield size={22} />
                </div>
                <div className="cred-card-text">
                  <strong>
                    {appCopy.formerTam}
                  </strong>
                  <span>
                    {appCopy.formerTamBody}
                  </span>
                </div>
              </div>
              <div className="cred-card">
                <div className="cred-card-icon cred-icon-cyan">
                  <BarChart3 size={22} />
                </div>
                <div className="cred-card-text">
                  <strong>
                    {appCopy.evidence}
                  </strong>
                  <span>
                    {appCopy.evidenceBody}
                  </span>
                </div>
              </div>
              <div className="cred-card">
                <div className="cred-card-icon cred-icon-emerald">
                  <ShieldCheck size={22} />
                </div>
                <div className="cred-card-text">
                  <strong>{appCopy.noProd}</strong>
                  <span>
                    {appCopy.noProdBody}
                  </span>
                </div>
              </div>
              <div className="cred-card">
                <div className="cred-card-icon cred-icon-cyan">
                  <FileText size={22} />
                </div>
                <div className="cred-card-text">
                  <strong>
                    {appCopy.outputs}
                  </strong>
                  <span>
                    {appCopy.outputsBody}
                  </span>
                </div>
              </div>
            </div>

            <div className="credibility-footer">
              <span className="credibility-disclaimer">
                {appCopy.disclaimer}
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
              <h2 className="mb-4">{appCopy.faqTitle}</h2>
            </div>
            <div className="faq-list">
              <div className="faq-item">
                <div className="faq-q">
                  {appCopy.q1}
                </div>
                <div className="faq-a">
                  {appCopy.a1}
                </div>
              </div>
              <div className="faq-item">
                <div className="faq-q">
                  {appCopy.q2}
                </div>
                <div className="faq-a">
                  {appCopy.a2}
                </div>
              </div>
              <div className="faq-item">
                <div className="faq-q">{appCopy.q3}</div>
                <div className="faq-a">
                  {appCopy.a3}
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
                {appCopy.ctaTitle}
              </h2>
              <p className="cta-subtitle">
                <span className="cta-pain">
                  {appCopy.ctaPain}
                </span>{" "}
                {appCopy.ctaBody}
              </p>

              <form onSubmit={handleCtaSubmit} className="cta-form">
                <input
                  type="email"
                  placeholder={appCopy.ctaInput}
                  required
                  className="form-input"
                />
                <button
                  type="submit"
                  className="btn btn-primary btn-glow cta-btn"
                >
                  {appCopy.ctaBtn}
                  <ArrowRight size={18} />
                </button>
              </form>

              <div className="cta-trust">
                <div className="cta-trust-item">
                  <ShieldCheck size={18} />
                  <span>{appCopy.noAgents}</span>
                </div>
                <div className="cta-trust-item">
                  <HelpCircle size={18} />
                  <span>
                    {appCopy.readOnly}
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
