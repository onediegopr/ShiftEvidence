# Documentation: Hito Marketing Landing 2 — Storage & Advisor Narrative Integration

## 1. Before vs After Narrative

* **Before**: The landing page was focused heavily on general parser and copilot claims without explaining what exact evidence was needed or highlighting the risk aspects of the VMware exit. The relationship between compute/licensing and storage target validation was vague, and the AI Advisor appeared as a generic chatbot helper.
* **After**: The narrative is centered around the core principle: *"Do not migrate inventory. Audit migration risk."* Shift Evidence is clearly presented as an evidence-based migration decision platform for VMware exits to Proxmox VE. The landing page now takes the reader on a cohesive journey:
  1. Broadcom renewal pressure creates urgency.
  2. Inventory size alone is not migration readiness.
  3. Real risks depend on compute, licensing, storage destinations, backup layers, and dependency gaps.
  4. Shift Evidence transforms exported configuration evidence into structured decision packs.
  5. The target storage destination is verified as a second confidence layer.
  6. The Senior Migration Advisor helps interpret the findings using the approved Project Memory Vault.
  7. The end result is a safer migration plan before production execution.

---

## 2. Hero Section Changes
* **Headline**: Changed to: `"Audit your VMware exit risk before production moves."`
* **Subheadline**: Changed to: `"Shift Evidence turns RVTools inventory, storage destination evidence and project context into a VMware → Proxmox readiness decision pack: risk signals, evidence confidence, storage readiness, migration waves, reports and a contextual Senior Migration Advisor."`
* **Trust Strip**: Set prominently to: `"No agents. No mandatory credentials. No production access. Starts with RVTools."`
* **CTAs**: Aligned with the unified pricing CTAs:
  * Primary: `"Start Free Assessment"` (triggers scanner signup)
  * Secondary: `"View Sample Report"` (points to `/sample-report`)
  * Tertiary / Subtle: `"Client login"` (points to `/client-login` style alias)

---

## 3. Restructured Landing Section Order
The landing page has been reordered into a logical, high-converting storytelling structure:
1. **Section 1: Hero** (Headline, Subhead, Trust Strip, Primary/Secondary/Tertiary CTAs, Migration Flow SVG Visual)
2. **Section 2: Pain / Problem** (`"VMware exits fail when teams migrate inventory instead of risk."` Explains Broadcom cost exposure, datastore hidden storage risk, unknown switch/network dependencies)
3. **Section 3: What Shift Evidence Does** (`"From exported evidence to migration decisions."` Explains readiness/confidence scores, storage destination risk, and wave-planning reports)
4. **Section 4: Three Pillars** (Pillar 1: Compute & Licensing, Pillar 2: Storage Target Validation, Pillar 3: AI Advisor + Project Memory Vault)
5. **Section 5: How It Works** (Step-by-step assessment timeline from RVTools intake to Advisor verification and Pro plan upgrades)
6. **Section 6: Deliverables** (Lists readiness scores, confidence indicators, risk matrices, checklists, and courtroom-ready PDFs)
7. **Section 7: Storage Readiness Section (Dedicated)** (Addresses NFS/SAN/ZFS/Ceph target suitability without credentials, including a terminal CLI snippet mockup)
8. **Section 8: Senior Advisor Section (Dedicated)** (Explains context-awareness and Project Memory Vault governance, including a sample Advisor conversation mockup)
9. **Section 9: Security / Trust Model** (Highlights agentless checks, secrets filtering, read-only exports, and private workspace constraints)
10. **Section 10: Pricing Preview** (Renders Free Readiness Check, Readiness Report, Readiness Report Pro, Migration Blueprint, MSP / Partner dynamically using `marketingPlans` from `pricingPlans.ts`)
11. **Section 11: Interactive FAQ** (Grouped by Product, Evidence, Storage, Advisor, Pricing, Support; category tab-switchable for scanability)
12. **Section 12: Final CTA** (Unified primary/secondary/tertiary CTAs under connecting hypervisor trust badges)

---

## 4. Storage Target Integration
* **Messaging**: Introduced target storage validation as a natural extension of pre-migration readiness. Highlighted target scenarios (ZFS, NFS, SAN, Ceph) and Proxmox Backup Server (PBS) support.
* **Claims Avoided**: Avoided active terms like *"automatic storage collector"*, *"definitive Ceph sizing"*, or *"direct cluster integration"*. Standardized on *"agentless target exports"*, *"suitability signals"*, and *"destination evidence confidence"*.
* **Visual**: Rendered a custom mock CLI terminal block illustrating target configuration analysis ($ `shiftevidence-cli storage-audit --target ceph`).

---

## 5. Senior Migration Advisor & Project Memory Vault Integration
* **Messaging**: Positioned the AI as a *"Contextual Senior Migration Advisor"* that relies strictly on assessment context, storage inputs, and approved Project Memory Vault decisions.
* **Claims Avoided**: Avoided claims of replacing human consultants or automated VM execution. Positioned as a read-only technical advisor.
* **Visual**: Rendered a mock message stream showing the Advisor suggesting memory locking optimizations for heavy DB workloads, alongside an approved/pending Memory Vault status block.

---

## 6. FAQ Alignment & Categories
FAQ was completely redesigned into an interactive tab-switchable interface grouped into 6 categories, answering all 24 required questions:
* **Product & Limits**: Scope boundaries, deliverables, target audience.
* **Evidence & Security**: RVTools-only support, vCenter-less operation, no-credentials security, handling missing info.
* **Storage Readiness**: Storage target evaluation, PBS validation, Ceph suitability, plan inclusion.
* **Senior Advisor**: AI limits, guardrails, Project Memory Vault role, human consultant boundaries.
* **Pricing & Billing**: Starting without cards, upgrades, billing support, Pro-plan feature map.
* **Support & Workspace**: Ticket tracking, support ticket routes, avoiding secrets.

---

## 7. Reusable Pricing Connection
* Integrated `marketingPlans` directly from `src/lib/pricingPlans.ts` inside the landing page.
* Highlighted the **Readiness Report Pro** plan with a visual premium badge: `“Storage & Advisor Integrated”` to make its connection to Storage analysis, the Senior Advisor, and the Project Memory Vault explicit.

---

## 8. Files Changed
* `src/components/Hero.tsx` (Hero badge, headline, subheadline, CTAs, trust strip)
* `src/views/LandingPage.tsx` (Homepage sections, Three Pillars, Storage/Advisor dedicated sections, Security model, FAQ categories, dynamic pricing preview)

---

## 9. Validations Completed
* **Prisma Validate**: Valid database schema check completed successfully.
* **TypeScript Typecheck**: Checked without errors (`tsc --noEmit` resolved).
* **ESLint Linting**: Lint run successfully with zero errors.
* **Vitest Suite**: All 296 tests passed successfully (including `landingStorageVisibility.test.ts` checking visibility assertions).
* **Next.js Production Build**: Compiled and optimized all 34 routes successfully without errors.

---

## 10. Risks & Next Steps
* **Gateways**: Billing relies on manual support routing and email requests. Do not attempt direct payment gateway connections yet.
* **Launch**: Pre-launch pages compile and route 200. Ensure client-login aliases redirect correctly to sign-in workspaces before open launch.
