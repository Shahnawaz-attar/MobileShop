# Deployment

One master repo → one Vercel project + one database per shop.

## Environment

Set at least:

```
DATABASE_URL=
AUTH_SECRET=          # openssl rand -base64 32
NEXT_PUBLIC_APP_URL=  # https://your-domain  (no /phones, no trailing slash)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
ANALYTICS_SALT=       # openssl rand -hex 16
ALLOW_SEED=false
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:owner@shop.com
```

`NEXT_PUBLIC_*` is baked in at **build** time. After changing `NEXT_PUBLIC_APP_URL` or `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, redeploy. Generate keys with `npx web-push generate-vapid-keys`.

## Database

```
npx prisma migrate deploy
```

Never `prisma db push` on production.

Production seed must stay off (`ALLOW_SEED=false`).

## Vercel

1. Import the GitHub repo
2. Paste env vars
3. Production branch `main`
4. Custom domain + HTTPS

## Backups (paying shops)

- Enable Neon/Postgres **scheduled backups** (or nightly dump)
- Keep a written restore: create DB → `pg_restore` / Neon PITR → `prisma migrate deploy` → point `DATABASE_URL` → smoke-test login + one product
- Restore once on a staging copy before you rely on it

A backup that has never been restored is only a hope.

## Git push (developers)

Do not put `GITHUB_TOKEN` on Vercel. Local only: `.env.git` from `.env.git.example`, then `git push origin main` (classic PAT with `repo` scope).
