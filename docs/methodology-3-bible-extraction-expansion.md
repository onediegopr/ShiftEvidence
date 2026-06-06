# METHODOLOGY-3: Full Bible Extraction Expansion

This hito expands the internal Methodology Knowledge Base from the small v2.1 seed into a much larger, deterministic catalog that is still safe to render locally and still read-only by default.

## What changed

- Active rules expanded from 16 to 69.
- Active knowledge chunks expanded from 11 to 33.
- Topics expanded from 13 to 36.
- Coverage now spans governance, VMware, Proxmox VE, SAN/storage, networking, applications, target readiness, security, execution, remediation, and operational checklists in a much broader way.

## What is new in the seed

- More governance coverage for trace, gates, overrides, debt acceptance and claim safety.
- More VMware coverage for CPU, hosts, network, vHealth, licensing, snapshots and backup scope.
- More Proxmox VE coverage for KVM/QEMU, LXC, Ceph, network and PBS/restore proof.
- More SAN/storage coverage for multipath, capacity runway, cache protection and replication.
- More networking coverage for LACP, MLAG, MTU, routing, NAT, overlay and capacity.
- More application coverage for stateful systems, shared services, fixed IP integrations and SLA owners.
- More target readiness coverage for compute, storage, network, backup, HA/DR parity and synthetic tests.
- More security coverage for access boundaries, secrets, immutable backup and audit logs.
- More execution coverage for smoke tests, performance degradation, integration failures, wave sequencing and hypercare closure.
- More remediation and checklist coverage so the console can speak about accepted debt and control gates in a safer way.

## Bridge prep

- `buildMethodologyAdvisorContext` prepares a controlled advisor bridge behind a feature flag.
- `buildMethodologyReportContext` prepares a report/PDF bridge as a helper only.
- Neither helper changes the live Advisor or PDF runtime automatically.
- No external embeddings, vector DB, or production DB dependency was added.

## Claim safety

- The claim validator now recognizes more unsafe wording.
- It also suggests safe alternatives and records the related methodology concept.
- It still behaves as an advisory-only helper.

## Safety rules

- No production deploy.
- No payments, Stripe, Wise, DNS, Hostinger, or Vercel cutover.
- No DB migrations or DB productiva changes.
- No secrets or customer data.
- No automatic scoring changes.
- No automatic runtime wiring for Advisor or PDF.

## Next step

- `METHODOLOGY-3-PUSH-CONTROLLED` if the local commit is ready.
- After that, the next decision is whether to focus on production environment prep or a controlled pilot.

