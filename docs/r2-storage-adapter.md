# Cloudflare R2 Storage Adapter

## Status

- Adapter implemented: yes
- Local filesystem fallback: yes
- Evidence uploads: supported
- Report PDFs: supported
- Preview/prod bucket routing: supported

## Driver Selection

The app now reads storage through a single backend selector:

- `STORAGE_DRIVER=local`
- `STORAGE_DRIVER=r2`

If `STORAGE_DRIVER` is unset, the application keeps using the local filesystem fallback.

## Local Filesystem Mode

When `STORAGE_DRIVER=local`, uploads and generated PDFs continue to use the existing filesystem layout under `HOSTINGER_STORAGE_ROOT` with a fallback to `./storage`.

This mode preserves the current development behavior and keeps the existing relative paths stored in the database unchanged.

## R2 Mode

When `STORAGE_DRIVER=r2`, the app writes the same logical object keys to Cloudflare R2 instead of the local disk.

R2 configuration variables:

- `R2_ACCOUNT_ID`
- `R2_S3_ENDPOINT`
- `R2_BUCKET_PREVIEW`
- `R2_BUCKET_PROD`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`

Bucket routing:

- `VERCEL_ENV=production` uses `R2_BUCKET_PROD`
- any non-production runtime uses `R2_BUCKET_PREVIEW`

## Path Safety

The adapter rejects:

- absolute paths
- parent directory traversal
- empty storage path segments
- malformed Windows-style escape paths

This applies to both evidence files and PDF report files.

## Implementation Notes

- Evidence uploads still go through `src/server/evidence/localStorageService.ts`
- Report generation still goes through `src/server/reports/reportStorageService.ts`
- Both modules now use a shared storage facade in `src/server/evidence/storageService.ts`
- S3-compatible calls use the AWS SDK v3 client with `PutObject`, `GetObject`, `HeadObject`, and `DeleteObject`

## Safety Notes

- No secrets are stored in the repo
- No public bucket access is assumed
- The adapter keeps the same `relativePath` database contract
- Local disk remains available as a safe fallback for development and tests

