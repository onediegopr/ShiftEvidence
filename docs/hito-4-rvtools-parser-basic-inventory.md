# Hito 4 - RVTools Parser Basic + Inventory Extraction

## Objetivo
Convert RVTools/XLSX/CSV evidence into a preliminary inventory that can be reviewed inside the assessment detail.

## Alcance
- Read private evidence files from secure local storage.
- Detect RVTools-like sheets and CSV headers.
- Extract basic VMs, hosts, datastores and snapshots.
- Persist parsed rows and inventory summary in Neon.
- Update evidence processing status.
- Surface parser warnings and a limited inventory UI.
- Keep the parser tolerant and partial by design.

## What changed
- Added RVTools parsing services.
- Added parsed inventory Prisma models.
- Added an inventory section to the assessment detail page.
- Added parse actions and safe reparse behavior.
- Added parser warnings and evidence confidence labels.

## What it does not do
- It does not generate a final migration report.
- It does not do wave planning.
- It does not do Proxmox sizing.
- It does not implement deep Storage Readiness.
- It does not replace Cost / Risk Engine assumptions.

## Routes
- `/dashboard/assessments/[id]`
- parse action through the assessment evidence actions

## Validation
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npx prisma validate`
- `npx prisma generate`
- `npx prisma migrate dev --name hito_4_rvtools_parser_inventory`

## Smoke test result
- RVTools-like XLSX workbook parsed successfully.
- Parsed VM, host, datastore and snapshot counts were persisted.
- Evidence status moved to `parsed`.

## Risks
- Column coverage is still basic.
- RVTools layouts can vary across exports.
- Parser warnings are expected on incomplete sheets.
- A future milestone should harden mapping and add deeper inventory intelligence.

## Rollback
- Remove parser services and parsed inventory models.
- Revert the inventory section from the assessment detail page.
- Revert the Hito 4 migration if needed in a safe environment.

## Next milestone
- `HITO 5 - Inventory-driven Cost/Risk + VM Risk Matrix`
