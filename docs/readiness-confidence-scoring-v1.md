# Readiness and Confidence Scoring v1

## Inputs
- Parsed RVTools evidence status.
- Parsed inventory status.
- Parser warnings.
- Cost / Risk assumptions completeness.
- Risk finding severities.
- Storage readiness selection.

## Confidence score
- Manual only, no uploaded evidence: 30
- RVTools uploaded not parsed: 40
- RVTools parsed partial: 55
- RVTools parsed with VMs only: 60
- RVTools parsed with VMs + hosts + datastores: 70
- RVTools parsed + cost assumptions complete: 80
- RVTools parsed + cost assumptions + low warnings: 85

## Readiness score
- Starts at 100.
- Low findings subtract up to 10.
- Medium findings subtract up to 25.
- High findings subtract up to 40.
- Critical findings subtract 20 each.
- Missing cost assumptions subtract 10.
- Low confidence subtracts 5 to 10.
- High storage without Storage Destination Readiness subtracts 10.
- Missing or failed inventory subtracts 10.

## Risk level
- `low`: readiness >= 75
- `medium`: readiness >= 50
- `high`: readiness < 50

## Limitations
- This is preliminary and evidence-based.
- Confidence is intentionally capped below 100 in this milestone.
- The score is not a final migration certificate.
