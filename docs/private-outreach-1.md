# Private Outreach 1

Fecha: 2026-06-05

## 1. Objetivo

Preparar el primer outreach privado controlado de Shift Evidence para conseguir conversaciones reales, feedback comercial, interes en piloto, validacion del mensaje y senales iniciales de willingness-to-pay.

Este hito no ejecuta campanas publicas, Ads, tracking, pagos reales, grants, entitlements, uploads reales ni piloto con datos reales.

## 2. Estado inicial

| Area | Estado inicial |
| --- | ---: |
| PRIVATE-OUTREACH-1 | 0% |
| Outreach readiness | 0% |
| Commercial readiness | 90% |
| Pilot readiness | 95% |
| Production readiness | 100% |
| Parser/upload safety | 88% |
| General technical | 99% |

Postura operativa:

- Production esta live en `https://www.shiftevidence.com`.
- Private outreach esta permitido con guardrails.
- Public launch masivo no esta aprobado.
- Live payment collection no esta aprobado.
- Billing sigue safe-off.
- Parser XLSX/RVTools tiene guardrails iniciales y queda limitado a private outreach / controlled pilot con consentimiento.

## 3. ICP privado

| Prospect type | Why relevant | Outreach angle | Desired next step |
| --- | --- | --- | --- |
| MSPs que atienden VMware | Ven dolor recurrente de Broadcom, costos y clientes que preguntan por alternativas | Convertir RVTools en assessment repetible para conversaciones de migracion | Demo corta y feedback sobre paquete MSP/Blueprint |
| Consultores Proxmox | Necesitan discovery estructurado antes de recomendar arquitectura o waves | Evidencia primero: riesgos, gaps, sizing y plan de oleadas antes de ejecutar | Review tecnico del sample report |
| Empresas medianas con VMware/Broadcom pain | Tienen presion de costos pero riesgo operativo si migran sin mapa claro | Antes de migrar, saber que puede romperse y que evidencia falta | Discovery call y demo guiada |
| Integradores de infraestructura | Pueden usarlo como pre-sales artifact o assessment de entrada | Reporte vendible y repetible para calificar oportunidades | Conversacion sobre white-label/MSP motion |
| Contactos conocidos de confianza | Pueden dar feedback honesto sin friccion comercial inicial | Pedir opinion brutal sobre claridad, confianza y objeciones | Call de 15 a 20 minutos |

No se documentan nombres, emails, empresas reales ni datos personales en este hito.

## 4. Oferta de outreach

Oferta principal:

- Discovery call corta.
- Demo guiada.
- Sample report.
- Revision conceptual sin subir datos reales.
- Posible piloto posterior con evidencia sintetica, anonimizada o explicitamente aprobada.

Mensaje central:

```text
Before migrating VMware to Proxmox, know what can break.
```

Como conversacion:

```text
Antes de que un equipo empiece una migracion VMware-to-Proxmox, Shift Evidence ayuda a identificar que workloads parecen seguros, cuales requieren revision y que evidencia falta para tomar una decision con mas confianza.
```

No vender como:

- Migration tool.
- Automatic migration.
- Guaranteed migration.
- Zero downtime.
- Guaranteed savings.
- Replacement for all consulting.

Vender como:

- Readiness assessment.
- Evidence-based risk discovery.
- RVTools-first.
- No agents.
- No production access.
- Missing evidence becomes part of the report.

## 5. Mensajes

### Empresa final

```text
Hi [Name],

I am opening controlled access to Shift Evidence, a VMware-to-Proxmox readiness assessment platform.

The idea is simple: before a team starts migrating, it should know which workloads look safe, which ones are risky, and what evidence is missing.

It starts with exported evidence such as RVTools. No agents, no production credentials, and no migration execution.

Would it be useful if I showed you a sample report or walked you through a short demo?
```

### MSP / consultor

```text
Hi [Name],

I am opening controlled access to Shift Evidence for MSPs and infrastructure consultants working around VMware-to-Proxmox migration planning.

It turns RVTools-style evidence into readiness scoring, VM risk classification, evidence gaps, Proxmox sizing and migration-wave planning.

I am looking for a few honest reviewers before broader rollout. No client data is needed for the first conversation; we can start with a demo and sample report.

Would you be open to a short review?
```

### Contacto conocido / friendly

```text
Hi [Name],

I have been building Shift Evidence, a productized VMware-to-Proxmox readiness assessment.

It does not migrate VMs. It helps identify risk before migration: what looks safe, what needs review, and what evidence is missing.

I am looking for blunt feedback from people who understand infrastructure. Could I show you the demo and sample report for 15 to 20 minutes?
```

## 6. Call script

Duracion objetivo: 15 a 20 minutos.

1. Contexto: preguntar que estan evaluando hoy, por ejemplo VMware exit, Proxmox, presion de costos o offering MSP.
2. Mostrar landing.
3. Mostrar demo replay.
4. Mostrar sample report.
5. Explicar readiness + confidence.
6. Explicar limites: no migration, no agents, no credentials, no production access.
7. Preguntar si el valor se entiende en menos de 5 minutos.
8. Preguntar que genera confianza.
9. Preguntar que genera duda.
10. Preguntar si pagarian por Starter, Professional o Blueprint/MSP.
11. Preguntar que necesitarian ver para probarlo con datos reales.
12. Preguntar que objecion tendria un cliente.
13. Cerrar con siguiente paso: feedback only, second call, synthetic pilot, anonymized pilot o paid assessment conversation.

## 7. Consent gate

Usar solo si el prospecto quiere enviar evidencia.

Antes de aceptar archivos:

- Confirmar owner/contacto.
- Confirmar que tiene derecho a compartir el archivo.
- Confirmar tipo de datos.
- Confirmar si esta anonimizado.
- Confirmar que no contiene passwords.
- Confirmar que no contiene secrets.
- Confirmar que no contiene private keys.
- Confirmar retencion.
- Confirmar cleanup.
- Confirmar que no se publicara.
- Confirmar que no se usara para training.
- Confirmar que no se compartira con terceros.

Si no hay consentimiento, no aceptar archivo.

Si hay consentimiento y dataset, pasar a `PILOT-EXECUTION-1` antes de procesar evidencia real.

## 8. Prospect list por tipo

| Slot | Prospect type | Status | Notes |
| --- | --- | --- | --- |
| 1 | MSP VMware | Pending selection | No real contact documented. |
| 2 | Proxmox consultant | Pending selection | No real contact documented. |
| 3 | Mid-market VMware operator | Pending selection | No real contact documented. |
| 4 | Infrastructure integrator | Pending selection | No real contact documented. |
| 5 | Friendly known contact | Pending selection | No real contact documented. |

No hay emails reales ni datos personales en este documento.

## 9. Criterios de exito

Outreach:

- 3 a 5 prospectos privados seleccionados manualmente.
- Mensajes enviados uno a uno, no masivos.
- Al menos 1 respuesta cualitativa.
- Al menos 1 call agendada o feedback asincronico util.

Mensaje:

- El prospecto entiende el valor en menos de 5 minutos.
- El sample report genera confianza o feedback accionable.
- El prospecto entiende que no es una herramienta de migracion automatica.

Comercial:

- Senal sobre Starter, Professional o Blueprint/MSP.
- Objeciones comerciales capturadas.
- Siguiente paso concreto definido.

Pilot:

- Si aparece dataset, consentimiento y scope, no procesar en este hito.
- Pasar a `PILOT-EXECUTION-1`.

## 10. Que NO se hara

- No campanas publicas.
- No Ads.
- No tracking.
- No scraping.
- No spam.
- No pagos reales.
- No checkout live.
- No grants automaticos.
- No entitlements reales.
- No pedir archivos sensibles de entrada.
- No aceptar RVTools real sin consentimiento previo.
- No datos reales en docs.
- No prometer migracion automatica.
- No prometer zero downtime.
- No prometer diagnostico 100%.
- No tocar DNS.
- No DB destructive.
- No migrations.
- No env changes.
- No secrets.

## 11. Execution status

Mensajes enviados: no.

Prospectos contactados: 0.

Replies: 0.

Next calls booked: 0.

Razon: este hito prepara la mocion y los guardrails. La ejecucion manual uno-a-uno queda para el owner.

## 12. Estado final

| Area | Estado final |
| --- | ---: |
| PRIVATE-OUTREACH-1 | 100% |
| Outreach readiness | 92% |
| Commercial readiness | 92% |
| Pilot readiness | 95% |
| Production readiness | 100% |
| Parser/upload safety | 88% |
| General technical | 99% |

## 13. Proximo paso

Recommended:

- Owner selects 3 to 5 real private prospects.
- Send one-to-one messages manually.
- Track replies without storing personal data in repo.
- If a prospect offers evidence, pause and start `PILOT-EXECUTION-1`.

Next hito options:

- `OUTREACH-FOLLOWUP-1` if replies arrive.
- `PILOT-EXECUTION-1` when prospect/dataset/consent exists.
- `STRIPE-LIVE-PAYMENT-FINAL-GATE-1` only if a real payment test is explicitly approved.

## 14. Follow-up: Outreach Execution 1

Fecha: 2026-06-05

`OUTREACH-EXECUTION-1` prepared a safe execution record and confirmed the owner-only manual sending rule:

- Messages prepared: 5.
- Messages sent by Codex: 0.
- Messages sent by owner reported in repo: 0.
- Replies recorded: 0.
- Calls booked: 0.
- Pilot-interested prospects recorded: 0.

No names, emails, phone numbers, company names, customer data, files or real evidence were stored in the repo.

Next action remains manual owner outreach followed by `OUTREACH-FOLLOWUP-1` if replies arrive.
