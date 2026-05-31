# Hito Marketing-Pricing-1: Unified Pricing & Payment-Ready Funnel

Este documento detalla la arquitectura comercial oficial y unificada implementada en las páginas de marketing y los flujos públicos de **Shift Evidence** / **ShiftReadiness**.

## 1. Modelo de Precios Unificado (Pricing Model)

Se han eliminado las inconsistencias de precios y nombres de planes anteriores en la web comercial. Toda la plataforma está alineada bajo las siguientes definiciones:

### Planes Principales
1. **Free Readiness Check (USD 0)**
   - *Propósito*: Captura de leads inicial, validación técnica libre de fricciones.
   - *Incluye*: Carga de RVTools/CSV, cobertura de evidencia inicial, reporte resumido de inventario, preview de top risks.
   - *CTA*: `Start Free Assessment` -> Redirige al registro seguro ([/sign-up](file:///C:/Users/diego/OneDrive/PERSONAL/INFRASHIFT/infrashift/src/app/sign-up/page.tsx)).

2. **Readiness Report (USD 249)**
   - *Propósito*: Primer entregable de valor self-service para la toma de decisiones.
   - *Incluye*: Todo lo del plan Free, motor completo de Costes/Riesgos, reporte PDF descargable, assumptions editables, ahorros anuales y a 3 años.
   - *CTA*: `Unlock Readiness Report` -> Redirige al registro o flujo de upgrade.

3. **Readiness Report Pro (USD 690)**
   - *Propósito*: Producto principal recomendado para MSPs, consultores e infraestructuras complejas.
   - *Incluye*: Todo lo del Readiness Report, análisis de **Storage Destination Readiness**, señales de idoneidad Ceph, recolección agentless con scripts CLI, acceso al **Senior Migration Advisor** y al **Project Memory Vault**.
   - *CTA*: `Upgrade to Pro` -> Redirige al flujo de upgrade de la consola.

4. **Migration Blueprint (Desde USD 1,500 / Custom)**
   - *Propósito*: Acompañamiento consultivo avanzado.
   - *Incluye*: Todo lo de Pro, planificación de olas de migración (waves), selección de candidatos piloto, roadmap de remediación y marco de rollback.
   - *CTA*: `Request Migration Blueprint` -> Redirige a soporte con asunto pre-enrutado.

5. **MSP / Partner (Desde USD 399/mes)**
   - *Propósito*: Canal de ventas para integradores y consultores de Proxmox.
   - *Incluye*: Metodología reusable para clientes, PDFs de marca blanca (futuro), templates y workflow prioritario.
   - *CTA*: `Become a Partner` -> Redirige a la página de partners.

### Add-Ons Disponibles
- **Storage Destination Readiness (USD 290)**: Para assessments que requieran validar almacenamiento SAN/NAS/ZFS/Ceph sin comprar el plan Pro (incluido por defecto en Pro).
- **Technical Review Call (USD 390)**: Una llamada de revisión técnica con ingenieros expertos sobre los hallazgos del reporte.

---

## 2. Jerarquía del Sistema de CTAs

Se ha unificado el sistema de CTAs en todas las superficies públicas para evitar que compitan entre sí:
- **Principal (Funnel primario)**: `Start Free Assessment`
- **Unlock / Compra**: `Unlock Readiness Report` / `Upgrade to Pro`
- **Consultivo / Empresa**: `Request Migration Blueprint`
- **Partner / MSP**: `Become a Partner`
- **Usuario Recurrente**: `Client login` (posicionado como secundario en la barra de navegación y pie de página).

---

## 3. Integración de Soporte y FAQ de Pagos (Payment-Ready FAQ)

### Soporte de Billing
Se ha enlazado de forma coherente el email `billing@shiftevidence.com` y la categoría de soporte de billing (`billing_question`) en la página de precios, evitando enlaces caídos y facilitando la solicitud de facturas (*invoices*) y cotizaciones corporativas.

### FAQ de Billing implementadas en el Home y Sales Page
- **Q**: *Do I need a credit card to start?*
  - **A**: No, puedes comenzar gratis con el Readiness Check y actualizar cuando desees.
- **Q**: *What happens after I buy a report?*
  - **A**: Tu workspace se actualiza y el motor analiza tu inventario RVTools para entregar los resultados completos.
- **Q**: *Can I upgrade later?*
  - **A**: Sí, el flujo de upgrade en tu consola está siempre disponible.
- **Q**: *Are Storage Readiness & AI Advisor included?*
  - **A**: Sí, ambos están incluidos a partir del plan Pro o superior.

---

## 4. Qué se Eliminó y Qué se Preservó

### Eliminado / Corregido:
- Estructura de precios contradictoria antigua ($490 / $1500 / $3500) en `/vmware-to-proxmox-readiness`.
- Copias y textos provisionales de desarrollo del estilo: *"checkout not enabled"*, *"coming soon"*, o *"payment not implemented"*.
- claims exagerados de "historial de soporte ilimitado" en login/landing, sustituidos por el preciso `"view recent support requests"`.

### Preservado:
- Los gauges interactivos, calculadoras y mockups visuales.
- El modelo conceptual de evaluación libre de agentes (*agentless*), sin vCenter, 100% read-only.
- La distinción clara entre lo que el software calcula (readiness) y lo que no hace (migración física).

---

## 5. Conexión de Pasarelas en el Futuro (Future Billing Integration)

Para conectar Stripe o Paddle en el futuro sin reescribir la narrativa pública:
1. Reemplazar los links de redirección de los CTAs de pago (`/sign-up?plan=...`) por URLs dinámicas de sesión de checkout del backend.
2. La base de datos y los planes configurados en `src/lib/pricingPlans.ts` mapean directamente con los Product IDs y Price IDs de Stripe/Paddle correspondientes.
3. El frontend de usuario interpretará los claims de privilegios basados en el plan unificado de forma transparente.
