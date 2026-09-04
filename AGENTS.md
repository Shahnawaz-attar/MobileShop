# AGENTS.md — MobileShop Template

> **Read this file before writing any code.**
> This is the authoritative context file for all AI coding agents (Copilot, Antigravity, Cursor, etc.)

---

## Project Overview

**MobileShop** is a productized, premium website template for Indian pre-owned mobile phone shops.

- **Architecture**: One master codebase → one deployment + one database + one admin per shop
- **NOT ecommerce**: No cart, checkout, payments, customer accounts
- **Customer journey**: Browse → Inspect → WhatsApp enquiry → Visit shop
- **Business KPI**: "Are owners keeping SOLD stock accurate?"
- **Target user**: Non-technical shop owner on mid-range Android

---

## Tech Stack (September 2026 — Latest Stable)

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.x |
| Language | TypeScript (strict) | 5.x |
| React | React | 19.x |
| Styling | Tailwind CSS | v4 |
| Components | shadcn/ui + lucide-react | latest |
| Database | PostgreSQL | 16 |
| ORM | Prisma | 7.x (LTS) |
| Auth | Auth.js (Credentials + JWT) | latest |
| Validation | Zod | latest |
| Forms | React Hook Form | latest |
| Images | Cloudinary | CDN |
| Font | Inter (self-hosted via next/font) | — |
| Dates | date-fns | latest |

---

## Coding Standards

### TypeScript
- `strict: true` — no exceptions
- **Never use `any`** — create proper types or use `unknown` with type guards
- All external input validated with Zod schemas
- Export types from `src/types/`

### Architecture
- **Server Components by default** — Client Components only when browser state is required
- **Pages/Route Handlers are thin**: `parse → authorize → call service → format`
- **Business logic** lives in `src/server/modules/*` — never in pages or components
- **Prisma access** is server-only — never import Prisma in client components
- **Public DTOs/mappers** must never expose private fields

### Money
- **Integer paise in database** — never floating point
- `pricePaise: number` and `mrpPaise: number`
- Use `formatINR()` from `src/lib/money.ts` for display
- Discount percentage is always **derived**, never stored

### Naming
- Files: `kebab-case.ts` for utils, `PascalCase.tsx` for components
- Variables/functions: `camelCase`
- Types/Interfaces: `PascalCase`
- Constants: `SCREAMING_SNAKE_CASE`
- Database enums: `SCREAMING_SNAKE_CASE`

### Imports
- Use `@/*` path alias (maps to `src/*`)
- No unused imports — ever
- No unused variables — ever
- Group imports: external → internal → types

### Components
- Keep components focused and reusable
- Use semantic HTML
- 44px minimum touch targets
- Keyboard accessible with visible focus
- Useful alt text on all images
- No fake loading delays or artificial animations

### Security
- Never expose: password hashes, private notes, stock references, raw analytics, internal metadata
- `requireOwner()` checked inside every admin mutation
- Never store full IMEI numbers
- Never fabricate testimonials, ratings, trust badges

### Performance
- `next/image` for all images
- Self-hosted fonts via `next/font`
- No giant client bundles
- No unnecessary state libraries
- Target: LCP < 2.5s, CLS < 0.1, INP < 200ms

---

## Folder Structure

```
mobile-shop-template-1/
├── AGENTS.md                    # This file — AI context
├── MobileShop.md                # Full product specification
├── .github/
│   └── copilot-instructions.md  # VS Code Copilot rules
├── prisma/
│   ├── schema.prisma            # Database schema
│   ├── migrations/              # Migration history
│   └── seed.ts                  # Demo data seeder
├── src/
│   ├── app/                     # Next.js App Router pages
│   │   ├── layout.tsx           # Root layout (fonts, meta, SW)
│   │   ├── globals.css          # Global styles + Tailwind
│   │   ├── not-found.tsx        # 404 page
│   │   ├── error.tsx            # Error boundary
│   │   ├── (website)/           # Public storefront route group
│   │   │   ├── layout.tsx       # Shared navbar + footer + WhatsApp CTA
│   │   │   ├── page.tsx         # Homepage (hero, brands, featured, etc.)
│   │   │   └── phones/
│   │   │       ├── page.tsx     # Browse/search/filter page
│   │   │       ├── [productSlug]/page.tsx  # Product detail
│   │   │       └── components/  # CatalogueFilters, SortSelect, etc.
│   │   ├── admin/               # Admin panel (separate layout)
│   │   │   ├── layout.tsx
│   │   │   ├── login/page.tsx
│   │   │   └── (dashboard)/     # Authenticated admin pages
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts
│   │       ├── events/route.ts
│   │       └── media/sign/route.ts
│   ├── components/
│   │   ├── ui/                  # shadcn/ui primitives
│   │   ├── public/              # PublicNavbar, PublicFooter
│   │   ├── admin/               # Admin dashboard components
│   │   └── shared/              # CustomSelect, SearchInput, FadeIn
│   ├── server/
│   │   ├── db/
│   │   │   └── client.ts        # Prisma singleton client
│   │   ├── auth/                # Auth config, guards
│   │   └── modules/
│   │       ├── catalog/         # Product CRUD + queries + actions
│   │       ├── shop/            # Shop settings + testimonials
│   │       ├── media/           # Image upload + management
│   │       ├── analytics/       # Event tracking + summaries
│   │       └── notify/          # Notification stubs
│   ├── lib/
│   │   ├── env.ts               # Zod-validated env vars
│   │   ├── money.ts             # INR formatting, paise conversion
│   │   ├── slug.ts              # Product slug generation
│   │   ├── whatsapp.ts          # wa.me URL builder
│   │   ├── utils.ts             # cn() helper
│   │   └── constants.ts         # App-wide constants
│   ├── types/
│   │   └── index.ts             # Shared TypeScript types
│   └── middleware.ts            # Next.js middleware
├── .env.example                 # Documented env template
├── .env.local                   # Local dev values (gitignored)
└── package.json
```

---

## Database Conventions

- Single shop per database — no `shopId` on tenant tables
- Use `getShop()` to retrieve the singleton Shop row
- `searchText` rebuilt on every product write
- `publishedAt` set only on first transition to AVAILABLE
- `soldAt` set when SOLD; cleared if reverted
- Slug = title + storage + colour + short random suffix
- Hard delete only for DRAFT products
- SOLD is historical — never casually delete sold listings

---

## Forbidden

Do NOT add these unless explicitly required by a future spec:
- Redux / Zustand / Jotai / MobX
- Axios (use native fetch)
- Lodash / Moment
- MUI / Chakra / Bootstrap / CSS-in-JS
- Redis / Algolia / Elasticsearch
- GraphQL / microservices / Kubernetes
- AI agents / chatbots / vector DBs / LangChain
- Payment gateways / ecommerce frameworks
- Cart / checkout / customer accounts / wishlist

---

## Progress Tracker

### Phase 1 — Scaffold & Foundation ✅ COMPLETE
- [x] AGENTS.md + copilot-instructions.md created
- [x] Next.js 16.3.4 project (package.json, next.config.ts, tsconfig.json)
- [x] TypeScript strict (noUncheckedIndexedAccess, noUnusedLocals, noUnusedParameters)
- [x] shadcn/ui initialized (Base UI + Nova preset + Geist font)
- [x] Folder structure created (all modules, lib, types, app)
- [x] Prisma 7 schema (9 models, 8 enums, proper indexes)
- [x] prisma.config.ts (Prisma 7 driver adapter pattern)
- [x] PostgreSQL mobileshop_db created (user: mobileshop)
- [x] Migration applied (20260902074356_init)
- [x] Database seeded (9 brands, 30 models, 20 products, 3 testimonials, 1 announcement)
- [x] Environment validation (Zod) — src/lib/env.ts
- [x] Core libs (money.ts, constants.ts, utils.ts)
- [x] Prisma client singleton with @prisma/adapter-pg
- [x] Seed script — prisma/seed.ts
- [x] Minimal pages (layout, home, not-found, error)
- [x] ESLint flat config (typescript-eslint)
- [x] **Verified**: `tsc --noEmit` ✅ | `eslint` ✅ | `npm run dev` ✅

### Phase 2 — Auth + Admin Shell ✅ COMPLETE
- [x] Auth.js v5 Credentials provider (bcryptjs, JWT strategy)
- [x] Owner login page (/admin/login)
- [x] LoginForm client component (useActionState, progressive enhancement)
- [x] Admin layout + dashboard shell (sidebar, stats from DB)
- [x] `requireOwner()` guard (redirect unauthenticated, throw for non-OWNER)
- [x] Login/logout server actions (Zod validated, ActionResult pattern)
- [x] API route handler (/api/auth/[...nextauth])
- [x] **Verified**: Login ✅ | Dashboard stats ✅ | Sidebar nav ✅

### Phase 4 — Product CRUD ✅ COMPLETE
- [x] Catalog service module (`src/server/modules/catalog/index.ts`)
  - `listAdminProducts`, `getAdminProduct`, `createProduct`, `updateProduct`, `setAvailability`, `deleteProduct` (DRAFT-only), `duplicateProduct`, `listBrands`, `listModels`
  - Invariants: `searchText` rebuilt on write, `publishedAt` on first AVAILABLE, `soldAt` on SOLD, slug = title+storage+colour+suffix (deduplicated)
- [x] Catalog server actions (`catalog/actions.ts`) — `requireOwner()` + `ActionResult` + revalidate
- [x] `slug.ts` utility (`buildProductSlug`, `slugify`, `randomSuffix`) — dedupes storage/colour already in title
- [x] **Device type support** — `DeviceType` enum (PHONE/TABLET/OTHER) + `deviceType` field; form conditionally shows storage/RAM/battery for phones & tablets only
- [x] Types: `AdminProductCard`, `AdminProductDetail`, `CreateProductInput`, `UpdateProductInput`, `BrandOption`, `ModelOption`, `DeviceType`
- [x] Admin products list page (`/admin/products`) — tabs (All/Available/Reserved/Sold/Drafts), thumbnails, price, status chips, device type label
- [x] `ProductListClient` — Mark sold / Back to available quick actions + delete (DRAFT only) + undo toast (real revert)
- [x] `ProductForm` client component — device type selector, brand/model cascading dropdowns, numeric price input, sanity warning, battery/warranty/box toggles, internal notes
- [x] Add page (`/admin/products/new`) + Edit page (`/admin/products/[id]/edit`)
- [x] **Dark theme by default** — `.dark` class on `<html>`, `ThemeToggle` in sidebar, localStorage persistence
- [x] **Cursor pagination UI** — "Load more" button with `nextCursor` (server-side, 20/page)
- [x] **Admin mobile nav** — `AdminMobileNav` bottom bar (Home/Products/Shop/Insights/Sign out), visible below `lg`, 44px+ targets
- [x] **PWA foundation** — `manifest.webmanifest`, SVG icons (192/512/maskable), `sw.js` (network-first catalogue, cache-first assets, NEVER cache admin), `offline.html`, SW registration
- [x] **Dashboard insights** — missing-photos warning, stale 30+ day listings, top-viewed products (spec §12 + §19I/J)
- [x] Seed includes tablets (iPad, Galaxy Tab) + other device (Apple Watch)
- [x] **Verified**: `tsc --noEmit` ✅ | `eslint` ✅ | `next build` ✅ | E2E create + mark-sold/undo ✅
- [ ] **Pending**: Image upload UI (needs Cloudinary config — media module already stubbed in Phase 3)

### Phase 5 — Product Detail + WhatsApp ✅ COMPLETE
- [x] Implemented `getPublicProduct` excluding DRAFT products securely.
- [x] Product Detail Page (`/phones/[productSlug]`) Server Component.
- [x] Cloudinary `ProductGallery` client component with swipeable UI.
- [x] Sticky WhatsApp CTA with pre-filled message generator (`src/lib/whatsapp.ts`).
- [x] Real-time analytics view tracking (`Product.viewCount` and `AnalyticsEvent`) via Server Action.
- [x] Configured `res.cloudinary.com` in `next.config.ts`.

### Phase 6 — Browse/Search/Filter/Sort ✅ COMPLETE
- [x] `/phones` page — Server Component with URL-driven filters (brand, condition, price range)
- [x] `CatalogueFilters` — Sidebar filter panel with brand checkboxes, condition checkboxes, price range input
- [x] `SortSelect` — Custom dropdown using `CustomSelect` component (Newest / Price Asc / Price Desc)
- [x] `SearchInput` — Real-time debounced search (400ms) with `router.replace` (no page reloads)
- [x] `LoadMoreCatalogue` — Cursor-based pagination ("Load more" button)
- [x] All client components wrapped in `<Suspense>` boundaries for production build compatibility
- [x] All filter state lives in URL search params (spec §11)
- [x] **Verified**: `tsc --noEmit` ✅ | `eslint` ✅ | `next build` ✅

### Phase 7 — Home + Premium UI ✅ COMPLETE
- [x] **Route Group Architecture** — All public pages moved to `src/app/(website)/` with dedicated layout
- [x] `(website)/layout.tsx` — Shared header (announcement banner + navbar), footer, WhatsApp CTA
- [x] **Homepage sections** (spec §11): Hero, Search, Latest Arrivals, Browse by Brand, Featured Phones, Why Buy From Us, Testimonials (horizontal snap slider), Recently Sold, Visit Us
- [x] **Hero section** — Grid + ambient glow background (City Masjid inspired), search bar, live stock count
- [x] **Premium Navbar** — Sticky, blur backdrop, real-time search, black CTA button
- [x] **Premium Footer** — Dark theme (`#0a0a0a`), structured columns, trust badges, glow border
- [x] **FadeIn component** — Zero-dependency `IntersectionObserver` scroll animations
- [x] **CustomSelect** — Reusable dropdown replacing all native `<select>` (mobile-friendly)
- [x] **Design system** — Consistent palette (black + `#fbfbfd` + slate), Geist font, no rainbow colors
- [x] **Code audit** — Removed dead `PublicLayoutWrapper.tsx`, fixed 7 dummy `href="#"` links, removed non-functional newsletter form, converted all internal `<a>` to Next.js `<Link>` (no page reloads)
- [x] **Verified**: `tsc --noEmit` ✅ | `eslint` ✅ | `next build` ✅ | Zero dummy links ✅

### Phase 3 — Media Upload ⬜ NOT STARTED
- [ ] Cloudinary signed upload (sign route `/api/media/sign`)
- [ ] Image upload UI on product add/edit page
- [ ] Client-side downscale to ≤1600px
- [ ] Drag reorder, primary image selection
- [ ] Image kind labels (FRONT, BACK, SCREEN, etc.)
- [ ] Max 8 images per product
- [ ] MIME validation + progress bar + retry
- [ ] **Blocked on**: Cloudinary API credentials in `.env`

### Phase 8 — Shop Settings + Announcement + Testimonials ⬜ NOT STARTED
- [ ] Shop settings admin page (logo, name, tagline, phone, WhatsApp, address, hours, maps, social links, trust badges, policies)
- [ ] `getShop()` / `updateShop()` in shop module
- [ ] Announcement admin CRUD
- [ ] Testimonials admin CRUD
- [ ] Homepage sections pull from Shop DB (currently hardcoded text)
- [ ] WhatsApp number from Shop settings (currently placeholder in layout)
- [ ] Store address from Shop DB (currently placeholder)
- [ ] "Send yourself a WhatsApp test" workflow

### Phase 9–14 — See MobileShop.md Section 25

---

## For AI Agents

When generating code for this project:
1. Always check this file first for conventions
2. Never introduce dependencies from the Forbidden list
3. Always use proper TypeScript types — no `any`
4. Money is always integer paise in the database
5. Server Components by default
6. Business logic in `src/server/modules/*`
7. Validate all input with Zod
8. Keep components clean — no unused imports/variables
9. Follow the folder structure exactly
10. Update the Progress Tracker when completing tasks

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
