import {
  Search,
  RefreshCw,
  ShieldCheck,
  Rocket,
  BarChart3,
} from "lucide-react";
import vmwareLogo from "../../images/vmware.svg";
import proxmoxLogo from "../../images/proxmox.svg";


export default function Process() {

  const steps = [
    {
      num: "01",
      icon: Search,
      title: "Analizar y mapear",
      duration: "Día 1 - 2",
      color: "#06b6d4",
      description:
        "Conectamos nuestro appliance de auditoría a tu API de vCenter. Analizamos perfiles de CPU, formatos de disco y asociaciones de red virtual, generando un plano completo de traducción.",
      action: "Genera tu scorecard personalizada de compatibilidad de migración.",
      callout:
        "Mirada de asesor: la metodología liderada por un ex VMware TAM ayuda a distinguir qué se puede automatizar, qué debe validarse y qué no debería moverse primero.",
    },
    {
      num: "02",
      icon: RefreshCw,
      title: "Preparación en segundo plano",
      duration: "Día 3 - 5",
      color: "#8b5cf6",
      description:
        "Configuramos el clúster destino de Proxmox. Nuestro convertidor replica discos virtuales de VM de forma asíncrona en segundo plano. Tus cargas VMware permanecen activas y sin cambios.",
      action:
        "Sincroniza bloques de datos progresivamente sin impacto en el tráfico de red.",
    },
    {
      num: "03",
      icon: ShieldCheck,
      title: "Verificación en sandbox",
      duration: "Día 6",
      color: "#f59e0b",
      description:
        "Arrancamos las máquinas virtuales migradas en una red de prueba aislada y sin ruteo. Verificamos integridad de drivers, layouts de particiones y salud de bases de datos antes del corte.",
      action:
        "Asegura una tasa de arranque exitosa del 100% en los hipervisores Proxmox destino.",
    },
    {
      num: "04",
      icon: Rocket,
      title: "Corte activo",
      duration: "Día 7 (ventana)",
      color: "#ea580c",
      description:
        "Apagamos de forma controlada la VM origen de VMware, sincronizamos los bloques delta finales (solo lleva minutos) y mapeamos el gateway de red al nuevo clúster Proxmox.",
      action:
        "Completa los cortes de VM con un downtime mínimo (normalmente <10 minutos).",
    },
    {
      num: "05",
      icon: BarChart3,
      title: "Ajuste fino de PBS y Ceph",
      duration: "Día 8+",
      color: "#10b981",
      description:
        "Optimizamos el cacheo de ZFS, definimos métricas de rendimiento de almacenamiento en Ceph y verificamos horarios de deduplicación incremental en Proxmox Backup Server.",
      action:
        "Traslada la gestión del sistema a las métricas del dashboard definidas por el cliente.",
    },
  ];

  return (
    <section id="process" className="section pipeline-section">
      <div className="bg-mesh"></div>
      <div className="container">
        <div className="text-center mb-8">
          <div className="badge">Pipeline de ejecución</div>
          <h2 className="mb-4">El pipeline de migración de Shift Evidence</h2>
          <p className="mx-auto" style={{ maxWidth: "650px" }}>
            We guarantee zero data loss and minimal system interruption by
            following a rigorous, step-by-step verification methodology.
          </p>
        </div>

        {/* ======== PIPELINE ======== */}
        <div className="pipeline">
          {/* Endpoint: VMware */}
          <div className="pipeline-endpoint vmware">
            <img src={vmwareLogo} alt="" className="pipeline-endpoint-logo" />
            VMware
          </div>

          {/* Steps */}
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={idx}
                className="pipeline-step"
                style={{ "--phase-color": step.color } as React.CSSProperties}
              >
                {/* Number node */}
                <div
                  className="pipeline-node"
                  style={{
                    color: step.color,
                    borderColor: step.color,
                  }}
                >
                  {step.num}
                </div>

                {/* Card */}
                <div className="pipeline-card glass-card">
                  {/* Header: icon + title + duration */}
                  <div className="pipeline-card-header">
                    <div
                      className="pipeline-icon"
                      style={{ color: step.color }}
                    >
                      <Icon size={20} />
                    </div>
                    <div className="pipeline-header-text">
                      <h4 className="pipeline-title">{step.title}</h4>
                      <span
                        className="pipeline-duration"
                        style={{
                          color: step.color,
                          background: `${step.color}18`,
                          borderColor: `${step.color}33`,
                        }}
                      >
                        {step.duration}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="pipeline-desc">{step.description}</p>

                  {/* Advisor Lens callout */}
                  {step.callout && (
                    <div className="pipeline-callout">{step.callout}</div>
                  )}

                  {/* Key Result */}
                  <div
                    className="pipeline-result"
                    style={{ borderLeftColor: step.color }}
                  >
                    <span className="pipeline-result-label">Key Result</span>
                    <span className="pipeline-result-text">{step.action}</span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Endpoint: Proxmox */}
          <div className="pipeline-endpoint proxmox">
            <img src={proxmoxLogo} alt="" className="pipeline-endpoint-logo" />
            Proxmox
          </div>
        </div>
      </div>
    </section>
  );
}
