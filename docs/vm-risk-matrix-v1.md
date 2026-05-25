# VM Risk Matrix v1

## Columns
- VM
- Power
- Guest OS
- CPU
- Memory MB
- Provisioned GB
- Used GB
- Datastore
- Host
- Risk
- Main reason
- Recommendation

## Filters
- Risk: all, info, low, medium, high, critical
- Power: all, powered on, powered off

## Ordering
- Highest severity first.
- Largest provisioned size first.
- VM name as tie breaker.

## Risk derivation
- Uses parsed VM risk level when present.
- Enriches with the highest severity VM finding for the entity.
- Falls back to powered off / parser signal wording when no finding exists.

## Limitations
- Limited sample only.
- No export yet.
- No bulk actions yet.
- No wave planning or definitive migration recommendation.
