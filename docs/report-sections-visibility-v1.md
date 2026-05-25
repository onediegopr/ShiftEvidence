# Report Sections Visibility v1

## Config
`src/server/reports/reportSections.ts`

## Section model
Each section describes:
- key
- title
- description
- visibleInFree
- requirement
- whatYouGet
- whyItMatters
- ctaLabel
- planLabel

## Visibility levels
- `free`: visible in preview
- `preview`: visible but full content remains locked
- `locked`: hidden behind a plan or add-on boundary

## Required plans
- Free Preview
- Readiness Report
- Readiness Report Pro
- Storage Add-on
- Technical Review

## Limitations
- This is config-driven, not a billing engine.
- The visibility model is visual and educational.
- No plan purchase or entitlement mutation is performed in this milestone.
