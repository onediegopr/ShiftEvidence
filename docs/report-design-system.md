# Report Design System

## Version

- Design system version: `REPORTS-UX-1`

## A. Report Types

- Starter Readiness Report
- Professional Assessment Report
- Migration Blueprint Report
- MSP White-label Report
- Public Sample Report
- Deep Technical Report

## B. Common Report Page Architecture

1. Cover
2. Executive Command Center
3. Decision Summary
4. Evidence Coverage
5. Readiness + Confidence Scores
6. Migration Readiness Radar
7. Top Risks
8. VM Classification
9. Storage Readiness
10. Network Readiness
11. Backup Readiness
12. Proxmox Target Readiness
13. Migration Waves
14. Pilot Candidates
15. Hold / No-Go Items
16. Required Validations
17. Recommended Next Steps
18. Appendix / Assumptions / Methodology

## C. Visual Components

- Score Card
- Dual Score Card
- Evidence Badge
- Severity Badge
- Insight Card
- Risk Card
- Missing Evidence Card
- Decision Box
- Risk Heatmap
- Migration Readiness Radar / Spider Chart
- Wave Timeline
- VM Archetype Card
- Evidence Coverage Matrix
- Proxmox Target Blueprint Diagram
- Before / After Block
- Action Plan Table
- Assumptions Box
- Methodology Note

## D. Copy Rules

Every important finding should follow this sequence:

`Finding -> Evidence -> Why it matters -> Recommendation -> Owner/action`

### Weak

`Backup evidence missing.`

### Premium

`No backup evidence was provided for this assessment. This reduces confidence for production-critical workloads because RPO/RTO and restore readiness cannot be validated. Recommendation: validate restore points before including critical systems in production migration waves. Owner/action: infrastructure owner to confirm restore readiness before wave approval.`

## E. Page Title Rules

Avoid generic titles such as:

- Storage Analysis
- Backup Evidence
- Network

Prefer conclusion-based titles such as:

- Backup evidence is missing, reducing confidence for critical workloads
- Two storage signals require validation before Wave 1
- Network mapping is partial; multi-NIC workloads require review

## F. Color Semantics

Decorative colors must not be introduced without meaning.

| Semantic | Meaning |
| --- | --- |
| Critical | Immediate blocker or severe execution risk |
| High | Strong risk requiring validation or remediation |
| Medium | Material issue that can change sequencing or scope |
| Low | Lower-impact issue or manageable caveat |
| Info | Contextual signal, advisory or methodology note |
| Missing Evidence | Evidence required to defend a decision is absent |
| Partial Evidence | Some evidence exists, but not enough for strong confidence |
| Confirmed Evidence | Evidence is present and validated enough for current scope |
| Unknown / Not Provided | No defensible status can be inferred |

## Implementation Rules

1. Separate readiness and confidence everywhere the report makes a decision.
2. Missing evidence is a first-class finding, not a hidden limitation.
3. No section should imply guaranteed migration success.
4. No section should claim zero downtime unless explicit pilot proof exists.
5. Report components should be reusable across starter, professional, blueprint and demo outputs.
6. Typed adapters should sit on top of existing data models instead of replacing them.

## Code Foundation Introduced In REPORTS-UX-1

- `src/server/reports/reportDesignSystem.ts`
- `src/server/reports/reportNarrativeCopy.ts`
- `src/server/reports/reportNarrativeModel.ts`
- `src/server/reports/reportChartModels.ts`
- `src/server/reports/reportExecutiveCommandCenter.ts`

These files define the reusable narrative and chart/data layer for later report upgrades.
