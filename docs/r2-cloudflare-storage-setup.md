# Cloudflare R2 Storage Setup

## Status

- Account access: configured
- R2 subscription: active
- Buckets created: yes
- Bucket privacy: private by default
- Runtime integration: implemented in code, not yet turned on by default
- Preview smoke: completed successfully
- Authenticated upload/download smoke: service-level preview smoke completed successfully

## Account Details

- Account ID: `8b20549eb4e7a21130c7161dbe23b6d7`
- S3 endpoint: `https://8b20549eb4e7a21130c7161dbe23b6d7.r2.cloudflarestorage.com`

## Buckets

- Preview bucket: `shift-evidence-preview-evidence`
- Production bucket: `shift-evidence-prod-evidence`

## API Tokens

- Preview token: created with `Object Read & Write` scoped to the preview bucket only
- Production token: created with `Object Read & Write` scoped to the production bucket only
- Secrets: shown once in Cloudflare and copied manually by the user

## Current App Storage State

- The application can now read and write through a shared storage facade.
- The default runtime remains local filesystem fallback unless `STORAGE_DRIVER=r2` is set.
- The local mode still uses `HOSTINGER_STORAGE_ROOT` with a fallback to `./storage`.
- R2 mode uses the preview/prod buckets created in Cloudflare.

## Next Step

- Continue with authenticated browser upload/download smoke or Vercel preview env config.
- Keep the filesystem implementation as a safe fallback until the adapter is in place and smoke-tested.

## Safety Notes

- Do not commit secrets or token values.
- Do not move private storage into `public/`.
- Do not point production storage at `.next` or `node_modules`.
