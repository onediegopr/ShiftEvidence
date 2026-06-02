# Synthetic Evidence Dataset Library

This directory contains deterministic, synthetic evidence packs for ShiftReadiness QA, demos, sample reports and parser regression tests.

## Safety

- No customer data.
- No production credentials.
- No secrets, tokens, cookies or environment variables.
- No private storage paths.
- No real internal network inventory.
- The files are safe for public demo and documentation usage.

## Included Modules

- RVTools-like CSV inventory.
- VMware enrichment JSON.
- Proxmox target JSON.
- Backup evidence JSON.
- Storage/SAN CSV.
- Application dependency CSV.
- Expected Migration Recommendation Plan gates.
- Expected summary metadata.

## Scenarios

- `northbridge-small-clean`: Northbridge Small Clean Pilot (pilot_ready, high confidence).
- `atlas-medium-mixed-risk`: Atlas Medium Mixed Risk (conditional_waves, medium confidence).
- `meridian-large-enterprise`: Meridian Large Enterprise (phased_assessment_required, medium confidence).
- `orion-no-backup`: Orion No Backup Evidence (blocked_until_backup_evidence, low confidence).
- `delta-target-insufficient`: Delta Target Insufficient (blocked_until_target_redesign, medium confidence).
- `apollo-storage-constrained`: Apollo Storage Constrained (conditional_after_storage_review, medium confidence).
- `helix-dependency-heavy`: Helix Dependency Heavy (blocked_until_dependency_mapping, low confidence).
- `phoenix-advanced-ready`: Phoenix Advanced Ready (advanced_waves_ready, high confidence).

## Regenerate

```bash
npm run synthetic:evidence
```
