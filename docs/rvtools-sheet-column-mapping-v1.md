# RVTools Sheet and Column Mapping v1

## Expected sheet roles
- VM inventory: `vInfo`, `VMs`, `vMachine`, or similar
- Hosts: `vHost`, `Hosts`, `vHosts`
- Datastores: `vDatastore`, `Datastores`, `vDatastores`
- Snapshots: `vSnapshot`, `Snapshots`, `vSnapshots`

## Header normalization
- Trim whitespace.
- Lowercase the header.
- Collapse repeated spaces.
- Treat underscores, hyphens and dots as separators.

## Alias strategy
- The parser uses tolerant aliases per field.
- Missing columns do not fail the entire parse.
- The parser keeps raw JSON for traceability.

## Current aliases
- VM fields: VM, Name, Powerstate, Guest OS, CPUs, Memory, Disks, Provisioned, Used, NICs, Tools, Datastore, Cluster, Host
- Host fields: Host, Cluster, CPU Model, CPU sockets, Cores, Memory, Version
- Datastore fields: Name, Type, Capacity, Used, Free, Usage %
- Snapshot fields: VM, Snapshot, Created, Size

## Limitations
- RVTools exports differ across versions.
- Some units are guessed from headers.
- A missing sheet becomes a warning instead of a hard failure when other inventory data exists.
- Unknown sheets are ignored.
