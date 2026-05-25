# Hostinger Foundation Notes

## Deployment target
- Node.js app deployable on Hostinger.

## Database
- Neon Postgres is the external database.
- Use `DATABASE_URL` for all runtime database access.

## Storage guidance
- Do not store uploads in `public`.
- Do not store uploads in build output.
- Do not rely on filesystem persistence for production uploads.
- Future storage path can use `HOSTINGER_STORAGE_ROOT` if a controlled local folder is needed.

## Auth and env
- `BETTER_AUTH_SECRET` is required.
- `BETTER_AUTH_URL` is required.
- `NEXT_PUBLIC_APP_URL` should match the deployed domain.
- Keep OAuth credentials optional until they are actually enabled.

## Operational notes
- Back up Neon before schema migrations.
- Keep the dashboard behind auth and do not expose it via sitemap.
- Use a real deployment database before turning on assessment writes.

