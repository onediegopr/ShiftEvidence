import {
  ShieldCheck,
  ShieldAlert,
  Cpu,
  Database,
  RefreshCw,
  Archive,
  HardDrive,
  Boxes,
  DollarSign,
} from "lucide-react";
import vmwareLogo from "../../images/vmware.svg";
import proxmoxLogo from "../../images/proxmox.svg";
import { useLocale } from "../i18n";

export default function Features() {
  const { t, locale } = useLocale();
  const copy = {
    en: {
      headline: "Why Enterprises Choose Shift Evidence",
      blurb:
        "Migrating core infrastructure shouldn't feel like a leap of faith. Our specialized pipeline handles the complexity and ensures zero risk to production data.",
      f1: ["Pre-Flight Audit & Scan", "Our automated compatibility engine scans vSphere hosts, storage formats, and distributed networks, flagging potential migration bottlenecks before they happen."],
      f2: ["Automated VM Translation", "Instantly converts VMDK virtual disks into Proxmox-native RAW or QCOW2 files. Automatically injects VirtIO drivers to prevent boot failures."],
      f3: ["Zero-Downtime Replication", "Sync virtual machine blocks asynchronously in the background. Keep your production systems running on VMware, only executing a brief restart during final cutover."],
      f4: ["Instant Rollback Protection", "We operate on a strict read-only mode for VMware assets. In the highly unlikely event of a migration anomaly, you can boot the source VMware cluster immediately."],
      f5: ["Ceph Storage Setup", "We design and configure highly available Proxmox storage layers (Ceph RBD) to replace expensive vSAN and proprietary storage controllers with open standards."],
      f6: ["Backup Infrastructure Shift", "Save on Veeam licenses. We build and deploy Proxmox Backup Server (PBS) setups, implementing deduplication, encryption, and incremental backup routines."],
      compHead: "Comparing architecture and costs",
      compBlurb:
        "Proxmox VE offers enterprise-grade virtualization capabilities with a modular, open architecture that frees your company from vendor lock-in.",
    },
    de: {
      headline: "Warum Unternehmen Shift Evidence wählen",
      blurb:
        "Die Migration kritischer Infrastruktur sollte sich nicht wie ein Sprung ins Ungewisse anfühlen. Unsere spezialisierte Pipeline bewältigt die Komplexität und stellt null Risiko für Produktionsdaten sicher.",
      f1: ["Vorab-Audit & Scan", "Unsere automatische Kompatibilitäts-Engine scannt vSphere-Hosts, Storage-Formate und verteilte Networks und markiert potenzielle Migrationsengpässe frühzeitig."],
      f2: ["Automatische VM-Translation", "Konvertiert VMDK-Disks sofort in Proxmox-native RAW- oder QCOW2-Dateien. VirtIO-Driver werden automatisch injiziert, um Boot-Fehler zu verhindern."],
      f3: ["Replikation ohne Downtime", "Synchronisiert VM-Blocks asynchron im Hintergrund. Produktivsysteme laufen auf VMware weiter, nur der finale Cutover benötigt einen kurzen Restart."],
      f4: ["Sofortiger Rollback-Schutz", "Wir arbeiten strikt im Read-only-Modus auf VMware-Assets. Im unwahrscheinlichen Fall einer Anomalie können Sie den VMware-Cluster sofort wieder starten."],
      f5: ["Ceph Storage Setup", "Wir entwerfen und konfigurieren hochverfügbare Proxmox-Storage-Layer (Ceph RBD), um teures vSAN und proprietäre Storage-Controller durch offene Standards zu ersetzen."],
      f6: ["Backup-Infrastrukturwechsel", "Sparen Sie bei Veeam-Lizenzen. Wir bauen und betreiben Proxmox Backup Server (PBS) mit Deduplikation, Verschlüsselung und inkrementellen Backup-Routinen."],
      compHead: "Architektur und Kosten vergleichen",
      compBlurb:
        "Proxmox VE bietet Virtualisierungsfunktionen auf Enterprise-Niveau mit einer modularen, offenen Architektur, die Sie vom Vendor Lock-in befreit.",
    },
    fr: {
      headline: "Pourquoi les entreprises choisissent Shift Evidence",
      blurb:
        "Migrer une infrastructure critique ne devrait pas ressembler à un saut dans le vide. Notre pipeline spécialisé gère la complexité et garantit zéro risque pour les données de production.",
      f1: ["Audit & scan pré-vol", "Notre moteur de compatibilité automatique analyse les hôtes vSphere, les formats de stockage et les réseaux distribués, et signale les goulots d'étranglement potentiels avant qu'ils n'apparaissent."],
      f2: ["Translation automatique des VM", "Convertit instantanément les disques virtuels VMDK en fichiers RAW ou QCOW2 natifs de Proxmox. Les drivers VirtIO sont injectés automatiquement pour éviter les échecs de démarrage."],
      f3: ["Réplication sans interruption", "Synchronise les blocs des machines virtuelles de manière asynchrone en arrière-plan. Les systèmes de production restent sur VMware, avec seulement un redémarrage bref lors du cutover final."],
      f4: ["Protection de rollback instantané", "Nous opérons en mode strictement lecture seule sur les actifs VMware. Dans le cas improbable d'une anomalie, vous pouvez redémarrer immédiatement le cluster source VMware."],
      f5: ["Configuration du stockage Ceph", "Nous concevons et configurons des couches de stockage Proxmox hautement disponibles (Ceph RBD) pour remplacer vSAN coûteux et les contrôleurs propriétaires par des standards ouverts."],
      f6: ["Changement d'infrastructure de backup", "Réduisez les licences Veeam. Nous construisons et déployons des environnements Proxmox Backup Server (PBS) avec déduplication, chiffrement et backups incrémentaux."],
      compHead: "Comparer l'architecture et les coûts",
      compBlurb:
        "Proxmox VE offre des capacités de virtualisation de niveau enterprise avec une architecture modulaire et ouverte qui vous libère du vendor lock-in.",
    },
    es: {
      headline: "Por qué las empresas eligen Shift Evidence",
      blurb:
        "Migrar infraestructura crítica no debería sentirse como un salto de fe. Nuestro pipeline especializado maneja la complejidad y asegura cero riesgo para los datos de producción.",
      f1: ["Auditoría y escaneo previos", "Nuestro motor automatizado de compatibilidad analiza hosts vSphere, storage formats y distributed networks, detectando posibles cuellos de botella de migración antes de que ocurran."],
      f2: ["Traducción automatizada de VMs", "Convierte al instante discos virtuales VMDK a archivos RAW o QCOW2 nativos de Proxmox. Inyecta automáticamente drivers VirtIO para evitar fallos de arranque."],
      f3: ["Replicación sin interrupción", "Sincroniza bloques de virtual machines asíncronamente en segundo plano. Mantené los systems de production ejecutándose en VMware y solo ejecutá un reinicio breve durante el corte final."],
      f4: ["Protección de rollback instantánea", "Operamos en modo estricto de solo lectura sobre los activos VMware. En el improbable caso de una anomalía de migración, podés arrancar inmediatamente el cluster VMware origen."],
      f5: ["Ceph Storage Setup", "Diseñamos y configuramos capas de storage Proxmox altamente disponibles (Ceph RBD) para reemplazar vSAN costoso y controladores propietarios por estándares abiertos."],
      f6: ["Cambio de infraestructura de backup", "Ahorrá en licencias de Veeam. Construimos y desplegamos entornos Proxmox Backup Server (PBS), implementando deduplicación, cifrado y rutinas de backup incremental."],
      compHead: "Comparando arquitectura y costos",
      compBlurb:
        "Proxmox VE ofrece capacidades de virtualización equivalentes a nivel enterprise con una arquitectura modular y abierta que libera a tu empresa del vendor lock-in.",
    },
    pt: {
      headline: "Por que as empresas escolhem o Shift Evidence",
      blurb:
        "Migrar infraestrutura crítica não deveria parecer um salto no escuro. Nosso pipeline especializado lida com a complexidade e garante zero risco para os dados de produção.",
      f1: ["Auditoria e scan pré-voo", "Nosso motor automático de compatibilidade analisa hosts vSphere, storage formats e distributed networks, marcando potenciais gargalos de migração antes que aconteçam."],
      f2: ["Translation automatizada de VMs", "Converte instantaneamente discos virtuais VMDK em arquivos RAW ou QCOW2 nativos do Proxmox. Drivers VirtIO são injetados automaticamente para evitar falhas de boot."],
      f3: ["Replication sem downtime", "Sincroniza blocos de máquinas virtuais de forma assíncrona em segundo plano. Os sistemas de produção continuam no VMware, com apenas um restart breve no cutover final."],
      f4: ["Proteção de rollback instantâneo", "Operamos em modo estrito de read-only sobre os ativos VMware. No caso improvável de uma anomalia, você pode iniciar imediatamente o cluster VMware de origem."],
      f5: ["Ceph Storage Setup", "Projetamos e configuramos camadas de storage Proxmox altamente disponíveis (Ceph RBD) para substituir vSAN caro e controladores proprietários por standards abertos."],
      f6: ["Mudança de infraestrutura de backup", "Reduza custos com licenças Veeam. Construímos e implantamos Proxmox Backup Server (PBS) com deduplicação, criptografia e rotinas de backup incremental."],
      compHead: "Comparando arquitetura e custos",
      compBlurb:
        "Proxmox VE oferece capacidades de virtualização em nível enterprise com uma arquitetura modular e aberta que remove o vendor lock-in.",
    },
    it: {
      headline: "Perché le aziende scelgono Shift Evidence",
      blurb:
        "Migrare infrastrutture critiche non dovrebbe sembrare un salto nel vuoto. Il nostro pipeline specializzato gestisce la complessità e garantisce zero rischio per i dati di produzione.",
      f1: ["Audit & scan pre-flight", "Il nostro motore di compatibilità automatico analizza host vSphere, storage formats e distributed networks, segnalando i possibili colli di bottiglia prima che si presentino."],
      f2: ["Translation automatica delle VM", "Converte istantaneamente i dischi virtuali VMDK in file RAW o QCOW2 nativi di Proxmox. I driver VirtIO vengono iniettati automaticamente per evitare boot failure."],
      f3: ["Replication senza downtime", "Sincronizza i blocchi delle macchine virtuali in modo asincrono in background. I sistemi di produzione restano su VMware, con un breve restart solo nel cutover finale."],
      f4: ["Protezione rollback istantanea", "Operiamo in modalità strictly read-only sugli asset VMware. Nel caso improbabile di un'anomalia, puoi avviare subito il cluster VMware di origine."],
      f5: ["Ceph Storage Setup", "Progettiamo e configuriamo layer di storage Proxmox altamente disponibili (Ceph RBD) per sostituire vSAN costoso e controller proprietari con standard aperti."],
      f6: ["Cambio dell'infrastruttura di backup", "Riduci i costi delle licenze Veeam. Costruiamo e distribuiamo Proxmox Backup Server (PBS) con deduplica, crittografia e backup incrementali."],
      compHead: "Confronto tra architettura e costi",
      compBlurb:
        "Proxmox VE offre capacità di virtualizzazione di livello enterprise con un'architettura modulare e aperta che libera la tua azienda dal vendor lock-in.",
    },
  }[locale];
  return (
    <>
      {/* Features Grid Section */}
      <section
        id="features"
        className="section"
        style={{ position: "relative" }}
      >
        <div className="container">
          <div className="text-center mb-8">
            <div className="badge">Safe Shift System</div>
            <h2 className="mb-4">
              {copy.headline}
            </h2>
            <p className="mx-auto" style={{ maxWidth: "650px" }}>
              {copy.blurb}
            </p>
          </div>

          <div className="features-grid">
            {/* Feature 1 */}
            <div className="glass-card feature-card glow-primary">
              <div className="feature-icon-wrapper">
                <ShieldCheck size={24} />
              </div>
              <h3 style={{ color: "white", fontSize: "1.25rem" }}>
                {copy.f1[0]}
              </h3>
              <p style={{ fontSize: "0.9rem" }}>
                {copy.f1[1]}
              </p>
            </div>

            {/* Feature 2 */}
            <div className="glass-card feature-card glow-secondary">
              <div className="feature-icon-wrapper">
                <Cpu size={24} />
              </div>
              <h3 style={{ color: "white", fontSize: "1.25rem" }}>
                {copy.f2[0]}
              </h3>
              <p style={{ fontSize: "0.9rem" }}>
                {copy.f2[1]}
              </p>
            </div>

            {/* Feature 3 */}
            <div className="glass-card feature-card glow-primary">
              <div className="feature-icon-wrapper">
                <RefreshCw size={24} />
              </div>
              <h3 style={{ color: "white", fontSize: "1.25rem" }}>
                {copy.f3[0]}
              </h3>
              <p style={{ fontSize: "0.9rem" }}>
                {copy.f3[1]}
              </p>
            </div>

            {/* Feature 4 */}
            <div className="glass-card feature-card glow-secondary">
              <div className="feature-icon-wrapper">
                <ShieldAlert size={24} />
              </div>
              <h3 style={{ color: "white", fontSize: "1.25rem" }}>
                {copy.f4[0]}
              </h3>
              <p style={{ fontSize: "0.9rem" }}>
                {copy.f4[1]}
              </p>
            </div>

            {/* Feature 5 */}
            <div className="glass-card feature-card glow-primary">
              <div className="feature-icon-wrapper">
                <Database size={24} />
              </div>
              <h3 style={{ color: "white", fontSize: "1.25rem" }}>
                {copy.f5[0]}
              </h3>
              <p style={{ fontSize: "0.9rem" }}>
                {copy.f5[1]}
              </p>
            </div>

            {/* Feature 6 */}
            <div className="glass-card feature-card glow-secondary">
              <div className="feature-icon-wrapper">
                <Archive size={24} />
              </div>
              <h3 style={{ color: "white", fontSize: "1.25rem" }}>
                {copy.f6[0]}
              </h3>
              <p style={{ fontSize: "0.9rem" }}>
                {copy.f6[1]}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* VMware vs Proxmox Technical Table */}
      <section id="comparison" className="section comparison-section">
        <div className="bg-mesh"></div>
        <div className="container">
          <div className="text-center mb-8">
            <div className="badge badge-cyan">Capability Matrix</div>
            <h2 className="mb-4">{copy.compHead}</h2>
            <p className="mx-auto" style={{ maxWidth: "650px" }}>
              {copy.compBlurb}
            </p>
          </div>

          <div className="glass-card comparison-table-wrapper">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th>{t("Feature Capability", "Feature Capability")}</th>
                  <th className="col-vs">
                    <div className="cmp-th-brand">
                      <img src={vmwareLogo} alt="" className="cmp-table-logo" />
                      {t("VMware vSphere Suite", "VMware vSphere Suite")}
                    </div>
                  </th>
                  <th className="col-prox">
                    <div className="cmp-th-brand">
                      <img src={proxmoxLogo} alt="" className="cmp-table-logo" />
                      Proxmox VE
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="cmp-feat">
                    <Cpu size={16} /> {t("Hypervisor Foundation", "Base del hipervisor")}
                  </td>
                  <td className="col-vs">{t("Proprietary Type-1 (ESXi)", "Tipo 1 propietario (ESXi)")}</td>
                  <td className="col-prox">
                    {t("Open-Source Type-1 (KVM)", "Tipo 1 open source (KVM)")}
                    <span className="cmp-check">✓</span>
                  </td>
                </tr>
                <tr>
                  <td className="cmp-feat">
                    <Boxes size={16} /> {t("Container Support", "Soporte de contenedores")}
                  </td>
                  <td className="col-vs">{t("Requires Tanzu (Extra Add-on)", "Requiere Tanzu (add-on extra)")}</td>
                  <td className="col-prox">
                    {t("Built-in LXC Containers", "Contenedores LXC integrados")}
                    <span className="cmp-check">✓</span>
                  </td>
                </tr>
                <tr>
                  <td className="cmp-feat">
                    <ShieldCheck size={16} /> {t("High Availability & DRS", "Alta disponibilidad y DRS")}
                  </td>
                  <td className="col-vs">{t("Paid licensing tier required", "Requiere licencia paga")}</td>
                  <td className="col-prox">
                    {t("Included / Free (Corosync)", "Incluido / gratis (Corosync)")}
                    <span className="cmp-check">✓</span>
                  </td>
                </tr>
                <tr>
                  <td className="cmp-feat">
                    <HardDrive size={16} /> {t("Storage Virtualization", "Storage Virtualization")}
                  </td>
                  <td className="col-vs">{t("vSAN (Separate licensing fee)", "vSAN (licencia separada)")}</td>
                  <td className="col-prox">
                    {t("Ceph RBD / ZFS (Built-in)", "Ceph RBD / ZFS (integrado)")}
                    <span className="cmp-check">✓</span>
                  </td>
                </tr>
                <tr>
                  <td className="cmp-feat">
                    <Archive size={16} /> {t("Backup Infrastructure", "Infraestructura de backup")}
                  </td>
                  <td className="col-vs">{t("Veeam / Cohesity (Paid)", "Veeam / Cohesity (pago)")}</td>
                  <td className="col-prox">
                    {t("Proxmox Backup Server (Free)", "Proxmox Backup Server (gratis)")}
                    <span className="cmp-check">✓</span>
                  </td>
                </tr>
                <tr className="cmp-cost-row">
                  <td className="cmp-feat">
                    <DollarSign size={16} /> {t("3-Year Subscription Cost", "Costo de suscripción a 3 años")}
                  </td>
                  <td className="col-vs">
                    <strong>{t("High recurring cost", "Alto costo recurrente")}</strong>
                    <span className="cmp-sub">{t("Licensed per physical core", "Licenciado por núcleo físico")}</span>
                  </td>
                  <td className="col-prox">
                    <strong>{t("Low per-socket pricing", "Bajo costo por socket")}</strong>
                    <span className="cmp-sub">
                      {t("Up to 80% lower annual subscription costs", "Hasta 80% menos en suscripciones anuales")}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </>
  );
}
