# Hito Storage-Collector-Spec-1B — Visibility Smoke for Agentless Storage Guidance

## 1. Real Render Points
The agentless storage evidence collection guidance is rendered in the following views:
- **Primary Tab**: Inside the **Storage** tab (`?tab=storage`) of the assessment workspace (compiled in the [StorageDestinationReadinessPanel.tsx](file:///C:/Users/diego/OneDrive/PERSONAL/INFRASHIFT/infrashift/src/components/assessments/StorageDestinationReadinessPanel.tsx) component). It sits directly below the Ceph evaluation boundaries card and above the Additional Evidence uploader form.
- **Administration Table**: Inside `/dashboard/admin` under the `Storage/Ceph` active assessments tracking table. It dynamically inspects files and marks the assessment as `✓ Destination evidence uploaded (N)` in cyan if Ceph/PBS files exist, or alerts if `Manual collector evidence expected`.

## 2. Visual Diagnosis & Hotfix Rationale
The user reported not noticing the new UI components. Investigation revealed two minor UX visibility obstacles:
1. **Evidence Upload Tab Overlap**: When technical users intend to upload files, they naturally navigate to the **Evidence Upload** (`?tab=evidence`) tab first. The Proxmox/Ceph/PBS collector guidance was previously only displayed in the **Storage** tab.
2. **Basics Tab Legacy Text**: The **Intake & Basics** tab contained a legacy text warning stating: *"Storage readiness inputs will be expanded in a later milestone."* This gave the false impression that the module was not yet active.

### Implemented Hotfixes:
- **`src/app/dashboard/assessments/[id]/page.tsx` (basics tab)**: Replaced the legacy milestone warning with: *"Storage Destination Readiness is active. You can now configure target details and copy agentless commands in the Storage tab."*
- **`src/app/dashboard/assessments/[id]/page.tsx` (evidence tab)**: Wrapped the Evidence history list and appended a dashed cyan border helper card (`💡 Proxmox, Ceph & PBS evidence`) pointing users directly to the **Storage** tab for read-only CLI command dumps.

## 3. Expected Text Verification
The following strings are confirmed to be present in the compiled HTML layouts:
- `Optional destination evidence` (Yes, inside the Storage tab)
- `Proxmox cluster evidence` (Yes, inside the Storage tab)
- `Proxmox storage evidence` (Yes, inside the Storage tab)
- `Ceph evidence` (Yes, inside the Storage tab)
- `Proxmox Backup Server` (Yes, inside the Storage tab)
- `pvesh get /cluster/resources` (Yes, inside monospace blocks)
- `ceph status --format json` (Yes, inside monospace blocks)
- `ceph df --format json` (Yes, inside monospace blocks)
- `Do not upload passwords` (Yes, inside the security notice card)
- `no agents` (Yes, inside the collector intro copy)
- `read-only` (Yes, inside instructions and warnings)

## 4. Technical Validation Results
All validations passed cleanly:
- **Prisma Validate**: Validated schema compatibility.
- **TypeScript Compile**: Verified no types errors (`tsc --noEmit`).
- **Linter**: Clean ESLint check (resolved a typescript `no-explicit-any` warning).
- **Unit Tests**: Passed 278 tests successfully (Vitest).
- **Production Build**: Successfully compiled optimized Next.js assets (`next build`).
