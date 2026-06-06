export type MethodologyBibleExtractionPart = {
  part: string;
  title: string;
  focus: string;
  linkedDomains: string[];
  linkedRuleCodes: string[];
  deliverables: string[];
  notes: string;
};

export const METHODOLOGY_BIBLE_EXTRACTION_PLAN: MethodologyBibleExtractionPart[] = [
  {
    part: "Parte 0",
    title: "Fundamentos y gobernanza",
    focus: "Definir lenguaje común, score dual, fuentes permitidas y límites de uso.",
    linkedDomains: ["Gobernanza, score dual y confianza"],
    linkedRuleCodes: ["SE-GOV-SCR-001", "SE-GOV-CONF-001", "SE-GOV-EVID-001"],
    deliverables: [
      "Glosario de términos",
      "Reglas de uso del score",
      "Guías de confianza y evidencia",
    ],
    notes: "Este bloque debe mantenerse estable para que Advisor, scoring y reportes no diverjan.",
  },
  {
    part: "Parte I",
    title: "Moat metodológico",
    focus: "Separar metodología propia, criterios de exclusión y señales de valor comercial.",
    linkedDomains: ["Gobernanza, score dual y confianza"],
    linkedRuleCodes: ["SE-GOV-SCR-001", "SE-GOV-CONF-001"],
    deliverables: ["Principios del moat", "Criterios de exclusión", "Mapa de valor"],
    notes: "Sirve para explicar por qué la consola interna no replica un escáner genérico.",
  },
  {
    part: "Parte II",
    title: "Sistema de scoring",
    focus: "Documentar el score readiness, el evidence score y el impacto de confianza.",
    linkedDomains: ["Gobernanza, score dual y confianza"],
    linkedRuleCodes: ["SE-GOV-SCR-001", "SE-GOV-CONF-001", "SE-GOV-EVID-001"],
    deliverables: ["Definición de score", "Pesos por hallazgo", "Banderas de bloqueo"],
    notes: "Debe poder traducirse a UI y a PDF sin perder trazabilidad.",
  },
  {
    part: "Parte III",
    title: "Recolección de evidencia y baselining",
    focus: "Normalizar insumos, versionar evidencias y definir baseline aceptado.",
    linkedDomains: ["VMware", "Aplicaciones y dependencias", "SAN y storage"],
    linkedRuleCodes: ["SE-VMW-BKP-001", "SE-VMW-STO-001", "SE-APP-DEP-001"],
    deliverables: ["Checklist de ingesta", "Baseline mínimo", "Matriz de evidencia"],
    notes: "Debe permitir comparar escenarios sin meter datos reales del cliente en la KB.",
  },
  {
    part: "Parte IV",
    title: "Evaluación VMware",
    focus: "Inventario, snapshots, backup restore, RAM y señales de riesgo VMware.",
    linkedDomains: ["VMware"],
    linkedRuleCodes: ["SE-VMW-STO-001", "SE-VMW-SNP-001", "SE-VMW-RAM-001", "SE-VMW-BKP-001", "SE-VMW-BKP-004"],
    deliverables: ["Checklist VMware", "Patrones de riesgo", "Criterios de bloqueo"],
    notes: "El restore test debe pesar más que una simple referencia de inventario.",
  },
  {
    part: "Parte V",
    title: "Evaluación Proxmox VE",
    focus: "Cluster, storage target, capacidad y preparación del destino.",
    linkedDomains: ["Proxmox VE", "Readiness del target"],
    linkedRuleCodes: ["SE-PVE-CLS-001", "SE-PVE-STO-001", "SE-TGT-CAP-001"],
    deliverables: ["Checklist PVE", "Gates de capacidad", "Señales de readiness"],
    notes: "Debe dejar claro cuándo el target está preparado y cuándo no.",
  },
  {
    part: "Parte VI",
    title: "SAN / Storage",
    focus: "Fabric, multipath, latencia, capacidad y resiliencia del storage compartido.",
    linkedDomains: ["SAN y storage"],
    linkedRuleCodes: ["SE-SAN-FAB-001", "SE-VMW-STO-001", "SE-PVE-STO-001"],
    deliverables: ["Mapa SAN", "Riesgos de performance", "Remediaciones de storage"],
    notes: "Es una de las bases más sensibles para scoring y cutover.",
  },
  {
    part: "Parte VII",
    title: "Networking",
    focus: "VLAN, MTU, routing, firewall y aislamiento operativo.",
    linkedDomains: ["Red y segmentacion"],
    linkedRuleCodes: ["SE-NET-L2-001", "SE-EXE-RLB-001"],
    deliverables: ["Checklist de red", "Gates de conectividad", "Patrones de bloqueo"],
    notes: "La red debe entrar como evidencia, no como supuesto.",
  },
  {
    part: "Parte VIII",
    title: "Aplicaciones y dependencias",
    focus: "Owners, dependencias funcionales, ventanas y sign-off.",
    linkedDomains: ["Aplicaciones y dependencias"],
    linkedRuleCodes: ["SE-APP-DEP-001", "SE-GOV-EVID-001"],
    deliverables: ["Mapa de dependencias", "Registro de owners", "Ventanas aprobadas"],
    notes: "Aquí se consolidan los riesgos de negocio, no solo los técnicos.",
  },
  {
    part: "Parte IX",
    title: "Readiness destino",
    focus: "Capacidad, performance, headroom y criterios de go/no-go.",
    linkedDomains: ["Readiness del target"],
    linkedRuleCodes: ["SE-TGT-CAP-001", "SE-GOV-SCR-001"],
    deliverables: ["Score del target", "Pruebas de carga", "Criterios de aceptación"],
    notes: "Debe servir para bloquear overclaiming de readiness.",
  },
  {
    part: "Parte X",
    title: "Ejecución de migración",
    focus: "Cutover, rollback, secuencia operativa y checklist post-cutover.",
    linkedDomains: ["Cutover y rollback", "Checklists operativos"],
    linkedRuleCodes: ["SE-EXE-RLB-001", "SE-GOV-EVID-001"],
    deliverables: ["Runbook de cutover", "Plan de rollback", "Checklist post-migración"],
    notes: "La ejecución no debe quedar atada a una promesa de cero downtime.",
  },
];

export function listMethodologyBibleExtractionPlan() {
  return [...METHODOLOGY_BIBLE_EXTRACTION_PLAN];
}

export function getMethodologyBibleExtractionPart(part: string) {
  return METHODOLOGY_BIBLE_EXTRACTION_PLAN.find((item) => item.part === part) ?? null;
}
