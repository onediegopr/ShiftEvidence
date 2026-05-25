# Inventory UI v1

## Location
- `/dashboard/assessments/[id]`

## States
- No RVTools uploaded
- RVTools uploaded but not parsed
- Parsing in progress
- Parsed inventory available
- Parsing failed

## Summary cards
- VMs
- Hosts
- Datastores
- Snapshots
- Powered on / powered off
- Total provisioned
- Total used

## Tables
- VM sample
- Host sample
- Datastore sample
- Snapshot sample

## Warnings
- Sheet detection warnings
- Missing sheet warnings
- Row-level parse warnings

## Principles
- Keep the UI preliminary.
- Show only a limited sample for performance.
- Make missing evidence visible.
- Make parser warnings obvious but not alarming.
