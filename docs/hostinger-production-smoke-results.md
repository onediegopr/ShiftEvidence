# Hostinger Production Smoke Results

Date: 2026-05-26

## Status

Status: **PENDING REAL HOSTINGER EXECUTION**

No real Hostinger domain, app root, panel/SSH access, logs, or restart control were available from this environment. The results below are the required result matrix for the real smoke run.

Hito 9.2 status: stopped at initial audit. Do not convert any pending result to passed until the Hostinger Production Access Gate is completed and the real HTTPS domain is tested.

## Routes

| Area | Route | Expected | Result |
| --- | --- | --- | --- |
| Public | `/` | 200 | Pending |
| Public | `/shiftreadiness` | 200 | Pending |
| Public | `/sign-in` | 200 | Pending |
| Public | `/sign-up` | 200 | Pending |
| Protected | `/dashboard` without session | redirect/denied | Pending |
| Protected | `/dashboard/assessments` without session | redirect/denied | Pending |
| Admin | `/dashboard/admin/unlock-requests` without session | redirect/denied | Pending |
| Dashboard | `/dashboard` with session | 200 | Pending |
| Assessments | `/dashboard/assessments` | 200 | Pending |
| Assessment detail | `/dashboard/assessments/[id]` | 200 | Pending |
| Report preview | `/dashboard/assessments/[id]/report` | 200 | Pending |
| Admin | `/dashboard/admin/unlock-requests` as admin | 200 | Pending |
| Admin | `/dashboard/admin/unlock-requests` as non-admin | denied | Pending |

## Functional Smoke

Use fictitious test data only.

| Step | Expected | Result |
| --- | --- | --- |
| Create/login test user | Session created | Pending |
| Create assessment | Assessment visible | Pending |
| Manual intake | Saved | Pending |
| Cost/risk assumptions | Saved | Pending |
| Upload CSV/RVTools evidence | EvidenceFile visible | Pending |
| Secure evidence download | Downloads without exposing path | Pending |
| Parse RVTools/CSV | Parsed inventory visible | Pending |
| Generate risk insights | Risk overview + VM matrix visible | Pending |
| Open report preview | Report sections visible | Pending |
| Generate PDF Preview | Report record generated | Pending |
| Download PDF | Secure PDF download works | Pending |
| Soft-delete PDF | Download after delete fails safely | Pending |
| Create unlock request | Pending request visible | Pending |
| Admin approve/fulfill | Entitlement granted | Pending |
| Generate readiness report PDF | Works when entitlement exists | Pending |
| Review logs | No critical errors | Pending |

## Local Baseline Confirmed

- `npm run build`: OK
- `npm run start -- -p 3000`: OK
- Local `/`: 200
- Local `/shiftreadiness`: 200
- Local `/sign-in`: 200

## Notes

Do not mark this document as passed until the real Hostinger domain is tested.
