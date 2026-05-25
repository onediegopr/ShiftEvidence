# Inventory-driven Cost/Risk v1

## Source indicator
- `manual`: only manual intake / assumptions exist.
- `parsed_inventory`: parsed inventory exists and is used as the source of counts.
- `mixed`: parsed inventory plus manual cost assumptions.

## Behavior
- Parsed counts can inform vmCount, hostCount, datastoreCount, snapshotCount and storage footprint.
- Manual annual costs are not overwritten.
- Manual counts remain visible.
- Mismatch warnings are emitted when manual and parsed counts differ by more than 20%.

## What is not overwritten
- Annual VMware cost.
- Estimated Proxmox cost.
- Currency.
- Years.

## Warning cases
- Manual VM count differs from parsed VM count.
- Manual host count differs from parsed host count.
- Manual storage footprint differs from parsed storage footprint.

## Limitations
- This is still a preliminary signal.
- The inventory does not replace the manual assumptions.
- The product does not claim a final migration plan yet.
