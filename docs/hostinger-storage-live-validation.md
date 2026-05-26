# Hostinger Storage Live Validation

Date: 2026-05-26

## Status

Status: **PENDING REAL HOSTINGER EXECUTION**

Local `npm run storage:check` passed, but real Hostinger persistent storage was not available from this environment.

## Required Production Storage Root

Recommended shape:

```text
/home/<hostinger-user>/shiftreadiness-storage
```

Rules:

- must be absolute;
- must be outside the app build directory;
- must not be inside `.next`;
- must not be inside `public`;
- must not be inside `node_modules`;
- must survive deploys;
- must not be web-public.

## Live Validation Steps

On Hostinger:

```bash
mkdir -p /home/<hostinger-user>/shiftreadiness-storage
npm run storage:check
```

Then validate:

- folder exists;
- app user can create subfolders;
- app user can write a test file;
- app user can read it back;
- app user can delete it;
- uploads land under private storage;
- PDFs land under private storage;
- secure download endpoints do not expose physical paths.

## Local Result

Local `npm run storage:check`:

- storage root exists/created: OK
- write/read/delete: OK
- storage root absolute after resolution: OK

## Backup Recommendation

Back up Hostinger private storage separately from Neon. Database records contain relative paths and metadata; file recovery also requires the private storage tree.
