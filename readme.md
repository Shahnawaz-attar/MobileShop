# MobileShop Template 1

> Pre-owned mobile phone shop website template — enterprise-grade, scalable, ready for per-customer deployment.

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.3.4 |
| Language | TypeScript (strict) | 5.x |
| React | React | 19.x |
| Styling | Tailwind CSS | v4 |
| Components | shadcn/ui (Base UI + Nova) | latest |
| Database | PostgreSQL | 16 |
| ORM | Prisma | 7.x (LTS) |
| Validation | Zod | latest |
| Font | Geist (self-hosted) | next/font |

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Create PostgreSQL user + database
sudo -u postgres psql -c "CREATE USER mobileshop WITH PASSWORD 'mobileshop2024' CREATEDB;"
sudo -u postgres psql -c "CREATE DATABASE mobileshop_db OWNER mobileshop;"
sudo -u postgres psql -d mobileshop_db -c "GRANT ALL ON SCHEMA public TO mobileshop;"

# 3. Copy env and configure
cp .env.example .env.local
# Edit .env.local with your values

# 4. Generate Prisma client + migrate + seed
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed

# 5. Run dev server
npm run dev
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run lint` | ESLint check |
| `npm run typecheck` | TypeScript check |
| `npm run check` | Both typecheck + lint |
| `npm run db:generate` | Regenerate Prisma client |
| `npm run db:migrate` | Run migrations (dev) |
| `npm run db:seed` | Seed database |
| `npm run db:studio` | Open Prisma Studio |

## Architecture

- **One database per shop** — no multi-tenant complexity
- **NOT ecommerce** — no cart, checkout, payments
- **Customer journey**: Browse → Inspect → WhatsApp enquiry → Visit shop
- See [AGENTS.md](./AGENTS.md) for full coding standards
- See [MobileShop.md](./MobileShop.md) for product specification
