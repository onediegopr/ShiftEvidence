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
5. **Section 5: How It Works** (A vertical, premium timeline detailing the 6 assessment phases from ingestion to staging)
6. **Section 6: Savings Calculator** (Interactive cost delta modeling showing licensing savings delta)
7. **Section 7: Capability Matrix** (Capability Matrix: Shift Evidence AI Copilot compared to cloud assessments, human advisors, and generic chatbots)
8. **Section 8: Deliverables** (Lists readiness scores, confidence indicators, VM risk indices, and courtroom-ready PDFs)
9. **Section 9: Storage Readiness Section (Dedicated)** (Addresses NFS/SAN/ZFS/Ceph target suitability without credentials, including a terminal CLI snippet mockup)
10. **Section 10: Senior Advisor Section (Dedicated)** (Explains context-awareness and Project Memory Vault governance, including a sample Advisor conversation mockup)
11. **Section 11: Security & Trust Baseline** (Highlights agentless checks, secrets scrubbing console visual showing obfuscation logs, and private workspace constraints)
12. **Section 12: Pricing Callout CTA** (Clean, spacious layout with key prices linking to the new dedicated pricing page `/pricing`)
13. **Section 13: Interactive FAQ** (Grouped by Product, Evidence, Storage, Advisor, Pricing, Support; category tab-switchable for scanability)
14. **Section 14: Final CTA** (Unified primary/secondary/tertiary CTAs under connecting hypervisor trust badges)

---

## 4. Dedicated Pricing Page (`/pricing`)
* We created a new dedicated page `/pricing` (`src/app/pricing/page.tsx`) mapping all 5 plans (Free, Report, Report Pro, Blueprint, MSP/Partner) and the 2 add-ons dynamically using `marketingPlans` and `marketingAddOns` from `pricingPlans.ts`.
* The layout is designed to be extremely spacious and clear (2 cards per line plus full-width highlight cards) avoiding compressed or overloaded layouts.

---

## 5. Security & Trust Baseline Panel
* Enriched the security section on the home page with an interactive secrets scrub console visual simulating real-time obfuscation logs (e.g. Hostnames hash-masked, credential hashes cleared, secrets deleted).

---

## 6. Files Changed
* `src/components/Hero.tsx` (Hero badge, headline, subheadline, CTAs, trust strip)
* `src/views/LandingPage.tsx` (Homepage sections, Savings Calculator restored, Capability Matrix restored, process workflow timeline, enriched security console, simplified pricing CTA block)
* `src/app/pricing/page.tsx` (New spacious dedicated page listing all plans and add-ons)

---

## 7. Validations Completed
* **Prisma Validate**: Valid database schema check completed successfully.
* **TypeScript Typecheck**: Checked without errors (`tsc --noEmit` resolved).
* **ESLint Linting**: Lint run successfully with zero errors.
* **Vitest Suite**: All 296 tests passed successfully.
* **Next.js Production Build**: Compiled and optimized all 34 routes successfully without errors.
