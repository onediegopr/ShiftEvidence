# Hito Storage-Collector-Spec-1 — Agentless Proxmox / Ceph / PBS Evidence Collection Spec

## 1. Objective & Product Rationale
The purpose of this milestone is to add an optional, agentless technical layer allowing users to collect infrastructure evidence from their destination Proxmox Virtual Environment (PVE), Ceph storage cluster, and Proxmox Backup Server (PBS).

This approach empowers technical users to upload high-confidence metadata to improve the assessment reports and advisor recommendations, while adhering to absolute platform principles:
- **No agents**: No code or binaries are installed on production systems.
- **No credentials requested**: The platform does not ask for or store passwords, SSH keys, or API tokens.
- **Customer-controlled**: Users execute commands manually in their infrastructure, review the output, and explicitly decide what files to upload.
- **Read-only exports**: All suggested commands perform non-destructive, read-only telemetry and configuration dump tasks.

## 2. Implemented UI Placement
The specification has been built directly inside the client assessment storage dashboard:
- **File modified**: [StorageDestinationReadinessPanel.tsx](file:///C:/Users/diego/OneDrive/PERSONAL/INFRASHIFT/infrashift/src/components/assessments/StorageDestinationReadinessPanel.tsx)
- **Position**: Located directly between the Ceph Suitability evaluation panel and the Storage Additional Evidence uploader.
- **Details**:
  - Divided into 6 structured blocks using glassmorphic panels and standard monospace syntax blocks.
  - Prominently states the optional nature of the collection to prevent user friction.

## 3. Included Commands

### 1. Proxmox Cluster Evidence
Exports node status and resource allocation:
```bash
pvesh get /cluster/resources --output-format json > proxmox-cluster-resources.json
pvesh get /nodes --output-format json > proxmox-nodes.json
pvesh get /cluster/status --output-format json > proxmox-cluster-status.json
```

### 2. Proxmox Storage Evidence
Dumps backend storage definitions and node connections:
```bash
pvesh get /storage --output-format json > proxmox-storage-config.json
pvesh get /cluster/resources --type storage --output-format json > proxmox-storage-resources.json
pvesh get /nodes/<NODE_NAME>/storage --output-format json > proxmox-node-storage.json
```

### 3. Ceph Evidence
Captures cluster telemetry, pools, Mon/OSD layouts, and capacities:
```bash
ceph status --format json > ceph-status.json
ceph df --format json > ceph-df.json
ceph osd tree --format json > ceph-osd-tree.json
ceph osd df --format json > ceph-osd-df.json
ceph health detail --format json > ceph-health-detail.json
ceph mon dump --format json > ceph-mon-dump.json
ceph osd pool ls detail --format json > ceph-pools-detail.json
```

### 4. Proxmox Backup Server (PBS) Guidance
Recommends exporting capacity, backup groups, job parameters, and verification records:
- Output filename: `pbs-datastores.json`
- Telemetry: Datastore space, retention rules, verify tasks, sync jobs.

## 4. Security Model & Redaction Warning
- **Warning Banner**: Embedded a bold, dashed warning card advising users never to upload keys, passwords, private tokens, or database URLs.
- **Sanitization**: Integrates with the existing `sanitizeStorageContextForAi` system which scans text block uploads.

## 5. Administrative Console Additions
- **File modified**: [src/app/dashboard/admin/page.tsx](file:///C:/Users/diego/OneDrive/PERSONAL/INFRASHIFT/infrashift/src/app/dashboard/admin/page.tsx)
- **Feature**: Within the Admin Storage/Ceph assessment tracking table, the file count column now analyzes the uploaded evidence types:
  - If target files (`ceph_status`, `ceph_df`, `ceph_osd_tree`, or `pbs_backup_info`) are found, it highlights: `✓ Destination evidence uploaded (N)` in cyan.
  - If other files exist but no destination metadata is found, it states: `Manual collector evidence expected`.
  - If no files are attached, it reports: `No destination collector evidence uploaded`.

## 6. What was NOT Implemented
- No changes to DB schemas or database tables.
- No automated collector agent or backend CLI runner.
- No storage TCO calculation engine modifications.
- No PDF report generation rewrites.

## 7. Future Collector Roadmap

### Phase 2A — Completion Center Storage Consolidation
- Unify completion rules in `AssessmentStorageDestinationReadiness` instead of splitting between it and `StorageReadinessInput` legacy models.
- Maintain legacy schemas for backward compatibility without destructive migrations.

### Phase 2B — Storage Evidence Classification Hardening
- Expand database enums to support first-class file types like `proxmox_cluster_resources` and `pbs_datastores` when a structured schema migration phase is scheduled.
- Add client-side parsing previews to check for structural JSON compliance before sending metadata to the API.

### Phase 2C — Optional Collector CLI Script
- Create a downloadable shell script (e.g. `collect-proxmox-evidence.sh`) that users can review, run locally in their terminal, inspect the JSON output bundle, and upload manually as a single zip/tarball file.

### Phase 2D — PDF Incremental Evidence Summary
- Incorporate uploaded Proxmox/Ceph/PBS metadata counts and parsed file summaries directly in the Storage Destination Readiness PDF section.

### Phase 2E — Admin Storage Evidence Details
- Enable administrators to see specific file timestamps, raw metadata preview blocks (e.g. node names, Ceph status fields) in the admin console with verified key sanitization to prevent leaks.

## 8. Validation Results
All technical checks completed successfully:
- Prisma Schema Validation: **Passed**
- TypeScript Typecheck: **Passed**
- ESLint checks: **Passed**
- Vitest Unit Tests: **Passed** (278/278 tests)
- Next.js Production Build: **Passed**
