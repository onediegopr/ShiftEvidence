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
  const { t } = useLocale();
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
              {t(
                "Why Enterprises Choose Shift Evidence",
                "Por qué las empresas eligen Shift Evidence",
              )}
            </h2>
            <p className="mx-auto" style={{ maxWidth: "650px" }}>
              {t(
                "Migrating core infrastructure shouldn't feel like a leap of faith. Our specialized pipeline handles the complexity and ensures zero risk to production data.",
                "Migrar infraestructura crítica no debería sentirse como un salto de fe. Nuestro pipeline especializado maneja la complejidad y asegura cero riesgo para los datos de producción.",
              )}
            </p>
          </div>

          <div className="features-grid">
            {/* Feature 1 */}
            <div className="glass-card feature-card glow-primary">
              <div className="feature-icon-wrapper">
                <ShieldCheck size={24} />
              </div>
              <h3 style={{ color: "white", fontSize: "1.25rem" }}>
                {t("Pre-Flight Audit & Scan", "Auditoría y escaneo previos")}
              </h3>
              <p style={{ fontSize: "0.9rem" }}>
                {t(
                  "Our automated compatibility engine scans vSphere hosts, storage formats, and distributed networks, flagging potential migration bottlenecks before they happen.",
                "Nuestro motor automatizado de compatibilidad analiza hosts vSphere, storage formats y distributed networks, detectando posibles cuellos de botella de migración antes de que ocurran.",
                )}
              </p>
            </div>

            {/* Feature 2 */}
            <div className="glass-card feature-card glow-secondary">
              <div className="feature-icon-wrapper">
                <Cpu size={24} />
              </div>
              <h3 style={{ color: "white", fontSize: "1.25rem" }}>
                {t("Automated VM Translation", "Traducción automatizada de VMs")}
              </h3>
              <p style={{ fontSize: "0.9rem" }}>
                {t(
                  "Instantly converts VMDK virtual disks into Proxmox-native RAW or QCOW2 files. Automatically injects VirtIO drivers to prevent boot failures.",
                "Convierte al instante discos virtuales VMDK a archivos RAW o QCOW2 nativos de Proxmox. Inyecta automáticamente drivers VirtIO para evitar fallos de arranque.",
                )}
              </p>
            </div>

            {/* Feature 3 */}
            <div className="glass-card feature-card glow-primary">
              <div className="feature-icon-wrapper">
                <RefreshCw size={24} />
              </div>
              <h3 style={{ color: "white", fontSize: "1.25rem" }}>
                {t("Zero-Downtime Replication", "Replicación sin interrupción")}
              </h3>
              <p style={{ fontSize: "0.9rem" }}>
                {t(
                  "Sync virtual machine blocks asynchronously in the background. Keep your production systems running on VMware, only executing a brief restart during final cutover.",
                "Sincroniza bloques de virtual machines asíncronamente en segundo plano. Mantené los systems de production ejecutándose en VMware y solo ejecutá un reinicio breve durante el corte final.",
                )}
              </p>
            </div>

            {/* Feature 4 */}
            <div className="glass-card feature-card glow-secondary">
              <div className="feature-icon-wrapper">
                <ShieldAlert size={24} />
              </div>
              <h3 style={{ color: "white", fontSize: "1.25rem" }}>
                {t("Instant Rollback Protection", "Protección de rollback instantánea")}
              </h3>
              <p style={{ fontSize: "0.9rem" }}>
                {t(
                  "We operate on a strict read-only mode for VMware assets. In the highly unlikely event of a migration anomaly, you can boot the source VMware cluster immediately.",
                "Operamos en modo estricto de solo lectura sobre los activos VMware. En el improbable caso de una anomalía de migración, podés arrancar inmediatamente el cluster VMware origen.",
                )}
              </p>
            </div>

            {/* Feature 5 */}
            <div className="glass-card feature-card glow-primary">
              <div className="feature-icon-wrapper">
                <Database size={24} />
              </div>
              <h3 style={{ color: "white", fontSize: "1.25rem" }}>
                {t("Ceph Storage Setup", "Ceph Storage Setup")}
              </h3>
              <p style={{ fontSize: "0.9rem" }}>
                {t(
                  "We design and configure highly available Proxmox storage layers (Ceph RBD) to replace expensive vSAN and proprietary storage controllers with open standards.",
                "Diseñamos y configuramos capas de storage Proxmox altamente disponibles (Ceph RBD) para reemplazar vSAN costoso y controladores propietarios por estándares abiertos.",
                )}
              </p>
            </div>

            {/* Feature 6 */}
            <div className="glass-card feature-card glow-secondary">
              <div className="feature-icon-wrapper">
                <Archive size={24} />
              </div>
              <h3 style={{ color: "white", fontSize: "1.25rem" }}>
                {t("Backup Infrastructure Shift", "Cambio de infraestructura de backup")}
              </h3>
              <p style={{ fontSize: "0.9rem" }}>
                {t(
                  "Save on Veeam licenses. We build and deploy Proxmox Backup Server (PBS) setups, implementing deduplication, encryption, and incremental backup routines.",
                "Ahorrá en licencias de Veeam. Construimos y desplegamos entornos Proxmox Backup Server (PBS), implementando deduplicación, cifrado y rutinas de backup incremental.",
                )}
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
            <h2 className="mb-4">Comparing architecture and costs</h2>
            <p className="mx-auto" style={{ maxWidth: "650px" }}>
              Proxmox VE offers enterprise-grade virtualization capabilities with a modular, open architecture that frees your company from vendor lock-in.
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
