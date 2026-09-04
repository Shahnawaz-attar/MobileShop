# AGENTS.md — Kartik V2
## Pre-Owned Mobile Shop Website — Productized, One-Shop-Per-Deployment Architecture

> **Authoritative build specification.**
>
> This version intentionally supersedes the earlier shared-database multi-tenant architecture.
> The business model is:
>
> **ONE MASTER CODEBASE → ONE DEPLOYMENT + ONE DATABASE + ONE ADMIN per shop.**
>
> Reuse the same code/template for every customer. Never fork the business logic into unrelated codebases.
>
> Read this file before coding. Build one phase at a time. Do not ask an AI coding agent to "build the whole app" in one shot.

### Core business model

Each paying shop gets:

- its own deployment/project
- its own PostgreSQL database
- its own admin login
- its own environment/secrets
- its own images/media account or isolated media namespace
- ideally its own domain
- its own customer-owned accounts where practical

The code remains the same reusable master template.

```text
                    MASTER TEMPLATE
             Next.js + TypeScript + Prisma
                         │
          ┌──────────────┼──────────────┐
          ↓              ↓              ↓
       SHOP A          SHOP B         SHOP C
      deployment      deployment     deployment
          │              │              │
        DB A           DB B           DB C
          │              │              │
       Admin A        Admin B        Admin C
```

### Why this architecture is deliberate

For the first ~50–100 low-ticket shops, isolation and handover matter more than squeezing every last database resource into one shared system.

Separate databases give:

- simpler security reasoning
- no cross-shop data leakage class
- easier customer handover
- easier backup/restore per customer
- one shop cannot consume another shop's database quota
- customer can leave without a tenant migration
- debugging is dramatically easier
- a customer's database can eventually move to their own paid account
- the website remains a productized template rather than a fragile SaaS platform

This is **not universally superior**. At hundreds/thousands of shops, a shared SaaS control plane may become cheaper operationally. Do not prematurely build that complexity.

### Golden rule

**Never create a new codebase for every customer.**

Create one master repo and deploy that same application repeatedly with different:

- `DATABASE_URL`
- shop seed/configuration
- deployment
- domain
- media credentials/namespace
- secrets



---

# 1. WHAT WE ARE BUILDING

A premium, mobile-first digital catalogue and trust website for Indian pre-owned mobile shops.

The site is **not an ecommerce store**.

Primary customer journey:

```text
Google / WhatsApp / QR / Instagram
          ↓
      Shop website
          ↓
 browse phones → inspect honest details
          ↓
   Enquire on WhatsApp
          ↓
       shop owner
```

No cart, checkout, payment, customer account, wishlist, POS, accounting, or order management in V1.

## Users

### Shop owner

Non-technical, usually Android, often standing at the counter.

The owner's critical workflow:

> Add phone → photos → price → condition → publish → share → mark sold.

If this takes more than ~90 seconds for a normal listing, the product is failing.

### Buyer

Mobile-first, often low/mid-range Android, sometimes iPhone, frequently coming from WhatsApp.

The buyer needs:

- real photos
- honest condition
- battery information
- warranty information
- box/accessories information
- price
- availability
- shop trust
- location
- one-tap WhatsApp enquiry

## Product value proposition

**DISCOVERY + CATALOGUE + TRUST + WHATSAPP CONTACT**

The website's job is to make a local shop look trustworthy and make its live stock easy to discover.

## Business KPI

The most important operational KPI is:

**Are owners keeping SOLD stock accurate?**

Therefore "Mark as sold" is more important than advanced analytics or AI.



---

# 2. STACK — FREE-FIRST, COMMERCIAL-SAFE

Use boring, proven technology. Free does not mean "use every free tool".

| Concern | Choice | Purpose |
|---|---|---|
| App | Next.js App Router + React + TypeScript strict | Full-stack web app |
| Styling | Tailwind CSS | Fast, consistent UI |
| Components | shadcn/ui + lucide-react | Accessible primitives |
| Database | PostgreSQL on Neon | Relational catalogue |
| ORM | Prisma | Type-safe DB access |
| Auth | Auth.js Credentials + JWT/session cookie | Owner login |
| Validation | Zod | Input boundaries |
| Forms | React Hook Form | Mobile-friendly forms |
| Images | Cloudinary | Upload, transform, CDN |
| Search | PostgreSQL `tsvector` + `pg_trgm` | Search without Algolia |
| QR | `qrcode` | Shop QR |
| PWA | Serwist or equivalent stable PWA tooling | Install/offline shell |
| Analytics | Own `AnalyticsEvent` table | Zero SaaS analytics bill |
| Error monitoring | Sentry | Production errors |
| Email | Resend, only if needed | Password/reset/system email |
| CI | GitHub Actions | Tests/build/lint |
| Tests | Vitest + Testing Library + Playwright | Quality |
| Dates | date-fns | Date handling |
| Deployment | Cloudflare Workers/OpenNext or customer-owned suitable host | Commercial deployment |
| Demo | Vercel Hobby only for personal/demo use, subject to current terms | Fast pitching |

### Current free-tier strategy

Treat provider limits as **quotas, not guarantees**. Verify current terms before onboarding a paying customer.

- Neon is attractive for isolated customer databases because each shop can have its own project/database. Neon has a usage-based Free plan; limits can change, so never hard-code old numbers into product logic.
- Cloudinary's current Free plan provides monthly credits covering transformations/storage/bandwidth. Use aggressive image optimisation so normal shops stay tiny.
- Cloudflare Workers currently has a Free plan with daily request/CPU limits. Keep the application portable so a customer can move to paid hosting if needed.
- Resend currently has a Free plan suitable for low-volume transactional email, but do not make email a required V1 dependency.
- Sentry is useful for production failures; if the free allowance is exhausted, the site must continue working.

### Important commercial rule

**Customer ownership is preferred.**

For a paying customer:

```text
Customer owns:
  domain
  deployment account/project
  database account/project
  primary business email

You:
  build/setup
  configure
  deploy
  maintain if they pay for support
```

Do not create fake/dummy customer accounts and pretend they are permanent ownership.

### Forbidden dependencies

Do not add these unless a later requirement proves they are necessary:

- Redux/Zustand/Jotai/MobX
- Axios
- Lodash
- Moment
- MUI/Chakra/Bootstrap
- CSS-in-JS
- Redis
- Algolia/Elasticsearch
- GraphQL
- microservices
- Kubernetes
- Kafka
- event sourcing
- AI agents
- AI chatbot
- vector DB
- LangChain
- payment gateways
- ecommerce frameworks

The project is valuable because it solves the shop's real problem, not because it contains fashionable infrastructure.



---

# 3. ABSOLUTE RULES

Violating these is a bug.

1. TypeScript strict. No `any`.
2. Money is integer paise in the database.
3. Never use floating point for money.
4. All external input is validated with Zod.
5. Server Components by default.
6. Client Components only where interaction genuinely requires browser state.
7. Pages and Route Handlers stay thin:
   `parse → authorize → call service → format`.
8. Business logic belongs in `src/server/modules/*`.
9. Prisma access belongs in server code only.
10. Public DTOs/mappers must never expose private fields.
11. Never expose password hashes, private notes, stock references, raw analytics, or internal metadata.
12. Admin authorization is checked inside every mutation/action, not only middleware.
13. Cross-user access returns 404 where appropriate.
14. Never fabricate testimonials, ratings, trust badges, shop history, review counts, or stock.
15. A product marked SOLD must immediately lose its WhatsApp/Call purchase CTA.
16. A RESERVED product must not be presented as normally available.
17. `publishedAt` is set when first published and never invented.
18. Discount percentage is derived from MRP and selling price; never stored.
19. Full IMEI numbers are never stored.
20. Only optional private `deviceRefLast4` may exist.
21. Do not build a searchable used-IMEI database.
22. Image uploads must be size-limited and MIME-checked.
23. Remove EXIF/GPS metadata from customer/shop images where the media provider supports it.
24. Never proxy large image bytes through the Next.js server.
25. Use `next/image` and responsive Cloudinary transforms.
26. Accessibility: semantic HTML, keyboard access, visible focus, 44px touch targets, useful alt text.
27. No fake loading delays or artificial animations.
28. No business-critical data should depend on a third-party SaaS API unnecessarily.
29. If a free service disappears, core catalogue data must remain portable.
30. Prefer simple PostgreSQL queries over adding another infrastructure product.


---

# 4. NEVER BUILD THESE 

Cart · checkout · payments · customer accounts · wishlist · orders · POS · accounting · purchase registers · payroll · complex CRM · live chat widget · AI chatbot · image-to-3D/GLB generation · full campaign/offer engine · configurable condition taxonomy · customer-submitted reviews · microservices · Kubernetes · event sourcing.

## Explicit product decisions

### A. No AI image-to-3D

Used-phone trust depends on honest condition disclosure.

A generated 3D model can invent geometry and hide scratches/dents that were never photographed.

If 360° is ever needed, use real turntable photographs.

### B. No FCM push in V1

V1 uses:

- WhatsApp share
- WhatsApp Status/share pack
- QR code
- SEO
- PWA installability

If push is built later, manual sending only and strictly rate-limited.

### C. No full IMEI

Only:

```text
deviceRefLast4
```

private and optional.

### D. No complex offer engine

Use:

- MRP strikethrough
- derived saving badge
- one site-wide announcement banner

### E. No fake review SEO

Testimonials are owner-entered and visibly labelled as shop-provided customer feedback.

Do not emit `Review` or `AggregateRating` structured data for these owner-controlled testimonials.



---

# 5. ARCHITECTURE — ONE SHOP PER DEPLOYMENT

## The final architecture

```text
                     MASTER REPOSITORY
                            │
          ┌─────────────────┼─────────────────┐
          ↓                 ↓                 ↓
       Customer A        Customer B        Customer C
       deployment        deployment        deployment
          │                 │                 │
       DB A              DB B              DB C
          │                 │                 │
       Admin A           Admin B           Admin C
          │                 │                 │
     Domain A           Domain B           Domain C
```

Every deployment contains exactly one shop.

### Consequence

There is **NO tenant isolation layer in V1**.

Do not add:

- `shopId` to every Product/Media/Announcement row
- Prisma `$extends` tenant filtering
- request `shopId`
- cross-tenant queries
- tenant-aware repositories
- shared customer database

Those belong to a future SaaS architecture, not this productized deployment model.

## Database model

One deployment:

```text
Next.js
   │
Prisma
   │
PostgreSQL DB for ONE SHOP
   ├── Shop
   ├── User
   ├── Product
   ├── Media
   ├── Announcement
   ├── Testimonial
   └── AnalyticsEvent
```

## Why separate DBs

1. Security boundary is physical/logical at the database level.
2. Customer handover is straightforward.
3. Backups are per customer.
4. One customer's bad query cannot expose another customer's rows.
5. One customer's growth does not consume another customer's DB quota.
6. Database deletion/restore is isolated.
7. Customer can eventually own the DB project/account.

## Reuse strategy

Do NOT duplicate business logic.

Use:

```text
kartik-template/
  src/
  prisma/
  public/
  tests/
```

For a new shop:

```text
copy template
→ create customer DB
→ configure env
→ seed shop
→ deploy
→ connect domain
→ hand over credentials
```

The source remains one master template.

## Optional future provisioning layer

Only after the first several manual deployments are proven should you automate:

```text
scripts/provision-shop
scripts/seed-shop
scripts/check-env
scripts/create-backup
```

Do not build a SaaS provisioning control plane before customers exist.


---

# 6. FOLDER STRUCTURE

```text
kartik/
├── AGENTS.md
├── .github/
│   └── workflows/
│       └── ci.yml
├── docs/
│   ├── 00_PRODUCT_ANALYSIS.md
│   ├── 01_ONBOARDING.md
│   └── 02_DEPLOYMENT.md
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── public/
│   ├── icons/
│   ├── manifest.webmanifest
│   └── offline.html
├── scripts/
│   ├── check-env.ts
│   ├── seed-shop.ts
│   └── verify-production.ts
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   ├── not-found.tsx
│   │   ├── error.tsx
│   │   ├── page.tsx
│   │   ├── phones/
│   │   │   ├── page.tsx
│   │   │   └── [productSlug]/page.tsx
│   │   ├── about/page.tsx
│   │   ├── admin/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── login/page.tsx
│   │   │   ├── phones/
│   │   │   ├── shop/page.tsx
│   │   │   ├── announcements/page.tsx
│   │   │   ├── testimonials/page.tsx
│   │   │   ├── qr/page.tsx
│   │   │   └── insights/page.tsx
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts
│   │       ├── events/route.ts
│   │       ├── media/sign/route.ts
│   │       └── qr.png/route.ts
│   ├── components/
│   │   ├── ui/
│   │   ├── public/
│   │   ├── admin/
│   │   └── shared/
│   ├── server/
│   │   ├── db/
│   │   │   └── client.ts
│   │   ├── auth/
│   │   │   ├── config.ts
│   │   │   ├── session.ts
│   │   │   └── guards.ts
│   │   └── modules/
│   │       ├── catalog/
│   │       ├── shop/
│   │       ├── media/
│   │       ├── analytics/
│   │       └── notify/
│   ├── lib/
│   │   ├── money.ts
│   │   ├── slug.ts
│   │   ├── whatsapp.ts
│   │   ├── conditions.ts
│   │   ├── battery.ts
│   │   ├── hours.ts
│   │   ├── rate-limit.ts
│   │   ├── seo.ts
│   │   ├── image.ts
│   │   └── env.ts
│   ├── types/
│   └── middleware.ts
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── .env.example
├── package.json
└── README.md
```

Important: there is deliberately no `tenant.ts`.


---

# 7. DATABASE SCHEMA — SINGLE SHOP DATABASE

Because every deployment has one shop, do **not** add `shopId` to tenant-owned tables.

```prisma
enum Role {
  OWNER
}

enum Condition {
  LIKE_NEW
  EXCELLENT
  GOOD
  FAIR
}

enum Availability {
  DRAFT
  AVAILABLE
  RESERVED
  SOLD
}

enum BatteryType {
  PERCENTAGE
  RATED
  UNKNOWN
}

enum BatteryRating {
  GOOD
  AVERAGE
  NEEDS_REPLACEMENT
}

enum MediaKind {
  FRONT
  BACK
  SIDE
  SCREEN
  SCREEN_OFF
  CAMERA
  BATTERY_SCREEN
  BOX
  ACCESSORY
  DAMAGE
  OTHER
}

enum EventType {
  PAGE_VIEW
  PRODUCT_VIEW
  WHATSAPP_CLICK
  CALL_CLICK
  SEARCH
  DIRECTIONS_CLICK
  SHARE_CLICK
  QR_SCAN
}

model Shop {
  id            String   @id @default(cuid())
  slug          String   @unique
  name          String
  tagline       String?
  about         String?  @db.Text
  logoUrl       String?
  coverUrl      String?
  phone         String
  whatsapp      String
  email         String?
  addressLine1  String
  addressLine2  String?
  city          String
  state         String
  pincode       String
  lat           Float?
  lng           Float?
  mapsUrl       String?
  instagram     String?
  facebook      String?
  hours         Json
  yearsInBiz    Int?
  trustBadges   Json
  policies      Json
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

}

model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String
  name         String
  role         Role     @default(OWNER)
  lastLoginAt  DateTime?
  createdAt    DateTime @default(now())

}

model Brand {
  id        String @id @default(cuid())
  name      String @unique
  slug      String @unique
  logoUrl   String?
  sortOrder Int @default(0)

  models   PhoneModel[]
  products Product[]
}

model PhoneModel {
  id          String @id @default(cuid())
  brandId     String
  name        String
  slug        String
  releaseYear Int?
  specs       Json?

  brand    Brand    @relation(fields: [brandId], references: [id])
  products Product[]

  @@unique([brandId, slug])
  @@index([brandId])
}

model Product {
  id               String       @id @default(cuid())
  slug             String       @unique
  brandId          String
  modelId          String?
  title            String
  variant          String?
  storageGb        Int?
  ramGb            Int?
  colour           String?

  pricePaise       Int
  mrpPaise         Int?

  condition        Condition
  conditionNotes   String?      @db.Text

  batteryType      BatteryType  @default(UNKNOWN)
  batteryPct       Int?
  batteryRating    BatteryRating?
  batteryNote      String?

  warrantyMonths   Int?
  warrantyNote     String?

  hasBox           Boolean      @default(false)
  hasCharger       Boolean      @default(false)
  hasCable         Boolean      @default(false)
  otherAccessories String[]

  simType          String?
  networkNote      String?
  osVersion       String?
  specs            Json?
  description      String?      @db.Text

  availability     Availability @default(DRAFT)
  isFeatured       Boolean      @default(false)
  publishedAt      DateTime?
  soldAt           DateTime?

  deviceRefLast4   String?      @db.Text
  internalNotes    String?      @db.Text
  purchasedAt      DateTime?

  searchText       String?
  viewCount        Int          @default(0)

  createdAt        DateTime     @default(now())
  updatedAt        DateTime     @updatedAt

  brand    Brand      @relation(fields: [brandId], references: [id])
  model    PhoneModel? @relation(fields: [modelId], references: [id])
  media    Media[]

  @@index([availability, publishedAt(sort: Desc)])
  @@index([availability, pricePaise])
  @@index([brandId, availability])
  @@index([isFeatured, availability])
}

model Media {
  id         String    @id @default(cuid())
  productId  String?
  kind       MediaKind @default(OTHER)
  publicId   String
  url        String
  width      Int?
  height     Int?
  blurhash   String?
  alt        String?
  sortOrder  Int       @default(0)
  createdAt  DateTime  @default(now())

  product Product? @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@index([productId, sortOrder])
}

model Announcement {
  id        String @id @default(cuid())
  title     String
  body      String?
  ctaLabel  String?
  ctaHref   String?
  startsAt  DateTime?
  endsAt    DateTime?
  isActive  Boolean @default(true)

  @@index([isActive, endsAt])
}

model Testimonial {
  id           String   @id @default(cuid())
  customerName String
  text         String   @db.Text
  isPublished  Boolean  @default(true)
  sortOrder    Int      @default(0)
  createdAt    DateTime @default(now())

  @@index([isPublished, sortOrder])
}

model AnalyticsEvent {
  id          String    @id @default(cuid())
  type        EventType
  productId   String?
  meta        Json?
  sessionHash String?
  createdAt   DateTime  @default(now())

  @@index([type, createdAt])
  @@index([productId, type])
}
```

## Singleton database rule

This database belongs to exactly one shop deployment.

Application code should use:

```text
getShop()
```

and treat the single `Shop` row as the deployment's identity.

Do not introduce a tenant discriminator later "just in case". If the business eventually becomes a shared SaaS, that should be a deliberate V2/V3 architecture migration.

## Required migration

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX product_search_gin
ON "Product"
USING GIN (to_tsvector('simple', coalesce("searchText", '')));

CREATE INDEX product_search_trgm
ON "Product"
USING GIN ("searchText" gin_trgm_ops);
```

## Schema invariants

- `searchText` rebuilt on every product write.
- `publishedAt` set only on first transition to AVAILABLE.
- `soldAt` set when SOLD; cleared if reverted.
- slug = title + storage + colour + short random suffix.
- discount displayed only when >=5%.
- private fields are mapper-protected.
- hard delete is allowed only for DRAFT.
- SOLD is the historical state; do not delete sold listings casually.


---

# 8. AUTHENTICATION AND SECURITY

Each deployment has one shop.

### V1

- Auth.js Credentials provider.
- Password hash using bcrypt/Argon2.
- HttpOnly + Secure + SameSite=Lax cookie.
- Owner role only.
- No public signup.
- No customer accounts.
- Login rate limit: 5 attempts / 15 minutes per IP + email.
- Generic invalid-login message.
- `requireOwner()` must be called inside every admin mutation.
- No platform-admin role in the customer deployment.

### Why no PLATFORM_ADMIN?

Because each customer is intentionally isolated.

Your operational/admin platform is your development/provisioning process, not part of the customer's production application.

If a future SaaS control plane is built, it gets its own database and service.

### Password recovery

V1 can use an operator-assisted reset.

V2 may add password-reset email using Resend or a similar transactional email provider.

Do not make a third-party email provider mandatory just to boot the app.


---

# 9. SERVER MODULES

## catalog

```text
listPublicProducts(filters)
getPublicProduct(slug)
listRecentlySold(limit)
getRelatedProducts(productId, limit)
listAdminProducts(filters)
createProduct(input)
updateProduct(id, input)
setAvailability(id, availability)
duplicateProduct(id)
deleteProduct(id)
```

Filters:

```ts
{
  q?: string
  brandSlug?: string
  minPaise?: number
  maxPaise?: number
  condition?: Condition[]
  storageGb?: number[]
}
```

Sort:

```text
newest
price_asc
price_desc
```

Cursor pagination only.

Public listing:

```text
AVAILABLE + RESERVED
```

Sold appears only in the recently-sold/social-proof area.

## shop

```text
getShop()
updateShop(input)
listTestimonials()
listActiveAnnouncement()
```

## media

```text
signUpload()
attachMedia()
reorderMedia()
deleteMedia()
setPrimary()
```

Rules:

- max 8 images/product
- client downscale to <=1600px
- server verifies upload result/signature
- MIME sniffing where applicable
- no image proxy through application server
- Cloudinary transformation/CDN delivery
- no EXIF/GPS leakage where supported

## analytics

```text
track(type, productId?, meta?)
getSummary(range)
```

Store:

- page views
- product views
- WhatsApp clicks
- call clicks
- search
- directions
- share
- QR scans

Do not store raw IP addresses.

Use a daily salted session hash.

## notify

V1:

```text
typed no-op stub only
```

No FCM implementation.


---

# 10. CORE LIBRARIES

## money.ts

```ts
formatINR(paise: number): string
rupeesToPaise(r: number): number
discountPercent(pricePaise: number, mrpPaise?: number): number | null
```

## whatsapp.ts

Build a pure `wa.me` URL.

Message should include:

- shop
- phone title
- storage
- price
- product URL
- "Is it still available?"

Validate the shop WhatsApp number.

Keep the message short enough to be useful when forwarded.

## conditions.ts

Fixed taxonomy:

```text
LIKE_NEW
EXCELLENT
GOOD
FAIR
```

Never allow each shop to invent its own condition system in V1.

## battery.ts

Three honest states:

```text
PERCENTAGE → Battery health 92%
RATED      → Battery: Good / Average / Needs replacement
UNKNOWN    → Battery health: Not measured
```

Never render `0%` when unknown.

For iPhones, encourage a battery-health screenshot tagged `BATTERY_SCREEN`.

## image.ts

Centralise:

- allowed formats
- maximum file size
- maximum image count
- responsive transformation presets
- alt text rules
- safe filename/public-id generation

## rate-limit.ts

Use a small interface:

```text
RateLimiter
  check(key, limit, window)
```

Start with in-memory implementation for a single deployment.

If a later deployment needs distributed rate limiting, swap the implementation without changing business services.

## env.ts

Validate environment variables at startup with Zod.

Fail fast with a readable error listing missing/invalid variables.


---

# 11. PUBLIC WEBSITE

## Home `/`

Order:

1. Header
2. Hero with shop name/tagline/live stock count
3. Search
4. Announcement
5. Latest arrivals
6. Browse by brand
7. Featured phones
8. Why buy from us
9. Testimonials, clearly labelled
10. Recently sold
11. Visit us
12. Sticky WhatsApp
13. Footer

Every optional section disappears when empty.

Never create fake content just to fill a section.

## Browse `/phones`

All filter state lives in URL search params.

Filters:

- Brand
- Price
- Condition
- Storage

Sorts:

- Newest
- Low to High
- High to Low

Use cursor pagination and a `Load more` button.

Search:

- PostgreSQL full-text search
- trigram typo tolerance

Examples:

```text
iphone15
iphone 15
smasung
oneplus 12r
```

## Product detail `/phones/[productSlug]`

This is the highest-value page.

Include:

- real image gallery
- title
- model
- storage/RAM/colour
- price
- MRP/savings when applicable
- availability
- condition
- battery
- warranty
- box/charger/cable
- condition notes
- specs
- shop trust
- related phones
- WhatsApp CTA
- Call CTA
- sticky mobile action bar

If SOLD:

```text
This phone is sold
[See similar phones]
[Ask about similar on WhatsApp]
```

Do not leave a misleading enquiry button.

## About

- shop story
- years in business if supplied
- address
- hours
- directions
- contacts
- owner-configured policies
- real shop photos


---

# 12. ADMIN DASHBOARD

Design for a one-handed mid-range Android.

Use plain language.

Good:

```text
Add a phone
Mark as sold
Your shop details
Customer interest
Share on WhatsApp
```

Bad:

```text
CRUD
tenant
entity
mutation
repository
```

## Dashboard

Show:

- live phones
- views this week
- WhatsApp clicks
- phones needing attention
- oldest live listings
- missing photos
- drafts
- top viewed products

## Product list

Each row:

- thumbnail
- title
- price
- availability

Status chip opens a quick action:

```text
Available
Reserved
Sold
```

No confirmation modal for normal "Mark as sold".

Undo via toast.

## Add/Edit

Photos first.

Essentials:

- brand
- model
- title
- price
- storage
- condition

Optional:

- battery
- warranty
- colour
- RAM
- box
- charger
- cable
- description
- internal notes

Requirements:

- camera-capable upload
- client downscale
- drag reorder
- primary image
- image kind
- progress
- retry
- local draft autosave
- inline Zod validation
- numeric keypad for price
- price sanity warning

After publish:

```text
Published successfully
[Share on WhatsApp]
[Add another]
```

## Shop settings

- logo
- name
- tagline
- phone
- WhatsApp
- address
- hours
- map link
- social links
- trust badges
- policies
- store photos

Include a "Send yourself a WhatsApp test" workflow.

## QR

Generate:

```text
https://customer-domain/something?utm_source=qr
```

or the root shop URL.

Use QR error correction H and a clear printed CTA.

## Insights

7/30-day toggle.

Show:

- visits
- product views
- WhatsApp clicks
- calls
- top phones
- top searches
- top brands
- QR scans

Prefer useful sentences over vanity charts.


---

# 13. API AND DATA FLOW

Prefer Server Actions for admin mutations.

Prefer Server Components for public reads.

Use Route Handlers only where an actual HTTP endpoint is required.

## Public endpoints

```text
GET /api/products
GET /api/qr.png
POST /api/events
```

Exact routes may differ if a cleaner Next.js route structure is used.

## Admin

```text
POST /api/media/sign
```

Everything else should normally be Server Actions.

## Action pipeline

Every admin action:

```text
requireOwner()
→ Zod parse
→ business service
→ database transaction if needed
→ revalidateTag/revalidatePath
→ typed result
```

## Error codes

```text
UNAUTHORIZED
NOT_FOUND
VALIDATION_ERROR
RATE_LIMITED
UPLOAD_FAILED
INTERNAL
```

Never return:

- stack traces
- SQL
- Prisma errors
- secrets
- internal file paths


---

# 14. UI / VISUAL SYSTEM

The result must look like a modern consumer-tech product, not a generic local-business template.

## Visual principles

- near-black + white
- one strong accent
- WhatsApp green only for WhatsApp actions
- restrained semantic colours
- generous whitespace
- real photography
- no visual clutter

## Product cards

Maximum five major data points:

1. image
2. title/storage
3. price
4. condition
5. one optional badge

## Motion

- 150–200ms
- opacity/transform only
- respects reduced motion
- no parallax
- no scroll-jacking
- no animation overload

## Accessibility

- 44px minimum interactive target
- keyboard navigation
- visible focus
- semantic headings
- labels
- useful alt text
- WCAG AA contrast

## Mobile

Primary target:

```text
360–430px viewport
mid-range Android
mobile data
```

Never design desktop first and "make it responsive later".


---

# 15. PERFORMANCE BUDGET

Targets:

- LCP < 2.5s
- CLS < 0.1
- INP < 200ms
- product page JS <= 120 KB gzipped
- browse JS <= 100 KB gzipped
- Lighthouse mobile Performance >= 90
- Accessibility >= 95
- SEO >= 95

Rules:

- `next/image`
- responsive Cloudinary transformations
- self-hosted `next/font`
- no interactive map on first load
- no giant client bundle
- no unnecessary state library
- no giant icon library import
- no autoplay video hero
- no third-party chat widget
- no blocking analytics script

Measure on a simulated mid-tier Android/4G profile.



---

# 16. PWA

The PWA is an enhancement, not the source of truth.

Caching:

```text
App shell              → cache
CSS/JS/fonts/icons     → cache
Images                 → CacheFirst
Catalogue lists        → NetworkFirst
Product details        → NetworkOnly
Admin                  → NEVER CACHE
```

If a stale list is shown:

> Showing a saved copy — prices and availability may have changed.

Never present stale product availability as live.

Offline page should show:

- shop name
- phone
- WhatsApp
- address


---

# 17. SEO + SHARING

SEO is a major value proposition because the shop is paying for discovery.

## Metadata

Shop:

```text
{Shop} — Second Hand Mobile Phones in {City}
```

Product:

```text
Used {title} {storage} ({condition}) - {price} | {Shop}
```

## Structured data

Shop:

- LocalBusiness
- address
- phone
- geo
- opening hours
- sameAs

Product:

- Product
- Offer
- UsedCondition
- availability
- priceCurrency INR

Do NOT emit owner-controlled Review/AggregateRating markup.

## Open Graph

Product OG image should use the real primary photo and clear price/title overlay.

This is important because WhatsApp is a major distribution channel.

## Sitemap

Include:

- home
- about
- browse
- currently relevant product pages

Do not create an enormous sitemap for sold/deleted junk.

## Canonical URLs

Every public page has one canonical URL.



---

# 18. HIGH-VALUE FREE TOOLS — USE SELECTIVELY

The objective is not "maximum number of tools".

The objective is:

> **maximum customer value with minimum recurring cost and operational risk.**

## Tier A — strongly recommended

### 1. Neon PostgreSQL

Use one Neon project/database per customer where practical.

Why:

- PostgreSQL
- simple Prisma integration
- isolated customer DB
- easy backup/restore strategy
- good fit for low-volume catalogues

Do not assume today's Free limits are permanent.

### 2. Cloudinary

Use for all shop/product images.

Use:

```text
f_auto
q_auto:good
dpr_auto
responsive width
```

Keep originals controlled and delivery optimised.

### 3. Cloudflare

Use as the production hosting/CDN option where the current Next.js/OpenNext compatibility is acceptable.

Benefits:

- CDN
- edge delivery
- free-tier entry point
- no bandwidth surprise from traditional VM hosting in many scenarios

Keep deployment portable.

### 4. Sentry

Use for:

- server exceptions
- client exceptions
- failed Server Actions
- deployment regressions

Every error should include useful context such as:

```text
shop slug
product id
route
release
```

Never include passwords, tokens, raw IPs, or private notes.

### 5. Resend — optional

Only add when email has a real job:

- password reset
- system notification
- onboarding confirmation

Do not build a marketing-email platform.

Resend's current Free plan is useful for low-volume transactional email, but customer-specific domains can become a paid constraint. For a ₹6k website, WhatsApp should remain the primary communication channel.

## Tier B — free tools that improve development

### GitHub

Use:

- private repository
- branch protection
- Issues
- Actions
- Dependabot/Renovate if useful
- release tags

### Playwright

Use real mobile journeys, especially:

```text
browse → product → WhatsApp
owner login → add → publish
mark sold → CTA disappears
```

### Lighthouse CI

Make performance a regression gate.

### Browser DevTools

Use network throttling and CPU throttling before declaring a page "fast".

### Google Search Console

For each customer who owns the domain, connect Search Console where possible.

This turns the website from "just a page" into a measurable local-discovery asset.

### Google Business Profile

Do not scrape reviews or fake ratings.

Instead, help the shop link its official Business Profile and website.

A future premium onboarding service can include:

- website URL placement
- correct business name/address/phone consistency
- UTM-tagged website links
- local SEO basics

## Tier C — optional tools, only when proven necessary

### PostHog

Potentially useful if product analytics outgrows the local `AnalyticsEvent` table.

Do NOT add it in V1.

### Better Stack / equivalent

Potentially useful for uptime/incident monitoring.

Do NOT add five monitoring products when Sentry + a simple uptime check is enough.

### Cloudflare Turnstile

Use only if public forms are introduced later.

Do not add CAPTCHA to the current WhatsApp-only conversion flow.

### Resend

Already covered above; only if email becomes necessary.

## Tools deliberately rejected

Do not add:

- Algolia
- Elasticsearch
- Redis
- Pinecone
- Weaviate
- LangChain
- OpenAI API
- Gemini API
- AI chatbot
- vector database
- Kafka

These are not bad technologies. They are simply not justified by the current product.



---

# 19. FEATURES THAT MAKE THE WEBSITE MORE VALUABLE

These are the features that can increase the customer's perceived ROI without creating a giant SaaS product.

## A. WhatsApp-first sharing

Every product should have:

```text
Share on WhatsApp
Copy link
```

Generated message:

```text
📱 iPhone 13 128GB
₹32,999
Excellent condition

See photos/details:
<url>

Available at <shop>
```

Keep it short.

## B. QR marketing kit

Give the owner:

- QR PNG
- printable A5 QR
- "Scan to see today's stock"
- optional counter QR
- optional packaging/sticker QR

This makes the website useful offline too.

## C. Shareable product cards

Generate a clean product image/card for WhatsApp Status.

This is high-value because shop owners already use WhatsApp as their marketing channel.

## D. Honest condition explainer

Show:

```text
Like New
Excellent
Good
Fair
```

with standardised descriptions.

This is a trust feature and a platform differentiator.

## E. Battery verification

For iPhones:

> "Battery health verified by photo"

when a battery screenshot exists.

Do not claim verification from a manually typed percentage.

## F. Recently sold

A small sold strip creates evidence that the shop actually moves stock.

No enquiry CTA.

## G. Live stock count

Hero:

> "18 phones available right now"

Derived from the database.

## H. Customer-interest analytics

Show the owner:

> "Your iPhone 13 was viewed 42 times and received 8 WhatsApp taps this week."

This is much more valuable than generic page-view charts.

## I. Listing-age warnings

If a product stays live >30 days:

> "Still available?"

This directly attacks catalogue staleness.

## J. Missing-data warnings

Dashboard can say:

- 4 phones missing photos
- 2 phones missing warranty information
- 3 phones live for 30+ days

This improves catalogue quality without requiring the owner to understand analytics.

## K. Local SEO basics

Per shop:

- city in title
- area/location in copy
- LocalBusiness schema
- accurate NAP
- sitemap
- canonical URLs
- Search Console onboarding

Never stuff keywords unnaturally.

## L. Fast trust page

A buyer should quickly find:

- years in business, if real
- address
- hours
- phone
- WhatsApp
- warranty policy
- exchange policy, if real
- store photos
- owner-provided trust badges

No invented claims.



---

# 20. CUSTOMER ONBOARDING — PRODUCTIZED SERVICE

The ₹6,000 website should be a repeatable operation, not a custom software project.

## Before deployment

Collect:

1. Shop name
2. Owner name
3. WhatsApp number
4. Phone number
5. Address
6. Google Maps link
7. Opening hours
8. Logo, if available
9. 5–10 shop photos
10. 10–20 initial phone listings
11. Warranty/exchange policy
12. Instagram/Facebook links
13. Real testimonials only if they choose to provide them

## Accounts

Prefer:

```text
customer email → customer-owned deployment
customer email → customer-owned database
customer email → customer-owned domain
```

If you temporarily create/setup something on their behalf:

- document ownership
- change recovery email
- hand over credentials
- remove your personal recovery methods
- never retain access secretly

## Handover checklist

Before calling the site "delivered":

- change demo password
- test WhatsApp
- test Call button
- verify address
- verify hours
- verify domain
- verify SSL
- verify mobile layout
- verify 3G/4G load
- verify product OG preview
- verify QR scan
- verify sold flow
- verify owner can log in
- give owner simple instructions



---

# 21. TESTING

## Unit

Test:

- `formatINR`
- `discountPercent`
- `buildEnquiryUrl`
- invalid WhatsApp number
- URL encoding
- battery formatting
- condition labels
- hours / midnight
- slug generation
- searchText
- availability transitions
- publishedAt/soldAt
- image validation

## Integration

Mandatory:

1. auth guard
2. private-field mapper test
3. product CRUD
4. search/filter correctness
5. cursor pagination
6. availability transitions
7. upload validation
8. announcement date rules

Because there is one database per deployment, there is no tenant-isolation test.

Instead, test that:

- an OWNER can only access their own deployment's data
- unauthenticated users cannot mutate admin data
- public DTOs never contain private fields

## E2E

### Journey 1 — buyer

```text
home
→ Apple filter
→ Excellent filter
→ product
→ WhatsApp
```

Assert the `wa.me` URL contains correct:

- number
- title
- price
- product URL

### Journey 2 — owner

```text
login
→ add phone
→ upload 2 images
→ publish
→ public page
```

### Journey 3 — sold

```text
admin
→ mark sold
→ public page
→ Sold state
→ WhatsApp CTA gone
```

Run at:

```text
390 × 844
```

Also test offline fallback.

## Performance

Lighthouse is a hard gate for production releases.

Do not chase arbitrary coverage percentages.

Prioritise:

- money
- auth
- privacy
- availability
- image upload
- WhatsApp conversion
- performance


---

# 22. DEPLOYMENT

## Per-shop deployment

Recommended lifecycle:

```text
MASTER REPO
   ↓
new customer deployment
   ↓
customer database
   ↓
seed one shop
   ↓
configure env
   ↓
deploy
   ↓
custom domain
   ↓
handover
```

## Environment

```env
DATABASE_URL=""
AUTH_SECRET=""
NEXT_PUBLIC_APP_URL=""

CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=""

SENTRY_DSN=""
NEXT_PUBLIC_SENTRY_DSN=""

ANALYTICS_SALT=""

ALLOW_SEED="false"
```

Do not put secrets in `NEXT_PUBLIC_*`.

## Database

Production:

```text
prisma migrate deploy
```

Never:

```text
prisma db push
```

for a production database.

## Backups

For every paying shop:

- scheduled database backup
- retention policy
- documented restore process
- manual restore test before relying on it

A backup that has never been restored is only a hope.

## Hosting recommendation

For early commercial deployments, prefer a platform that:

- permits commercial usage
- supports Next.js reliably
- has predictable free/low-cost limits
- allows customer ownership
- allows migration

Cloudflare Workers/OpenNext is one candidate.

Oracle Always-Free VM can be useful for a more traditional Node deployment, but introduces more DevOps responsibility.

Do not choose infrastructure solely because it is "free".


---

# 23. FAILURE POINTS

| Failure | Mitigation |
|---|---|
| Owner forgets sold status | One-tap sold + listing-age warning |
| Empty catalogue | Onboard 20+ initial phones with owner |
| Wrong WhatsApp | E.164 validation + self-test |
| Huge images | Client resize + Cloudinary |
| Fake battery claim | Battery screenshot verification affordance |
| Stale availability | Product detail NetworkOnly |
| Price typo | Median-based sanity warning |
| Poor SEO | Metadata + schema + sitemap + Search Console onboarding |
| Customer cannot find location | Maps link + address + hours |
| Customer doesn't trust shop | Real photos + policies + standard condition language |
| Cloudinary quota pressure | Per-shop upload caps + compression |
| Database failure | Per-shop backup/restore |
| Owner forgets password | Admin reset process; email reset later |
| Bot analytics | crawler filtering + session hashing |
| Customer leaves | customer-owned accounts + portable DB |


---

# 24. ROADMAP

## V1 — sellable product

Build:

- premium public home
- browse/search/filter
- product detail
- WhatsApp conversion
- owner dashboard
- add/edit/duplicate/sold
- Cloudinary images
- shop settings
- testimonials
- announcement
- QR
- analytics
- PWA
- SEO
- security
- tests
- deployment docs

## V1.1 — high ROI improvements

Only after real shops use V1:

- WhatsApp Status share pack
- printable counter QR kit
- better product OG cards
- listing-age reminders
- missing-information checklist
- Search Console onboarding guide
- simple local SEO report
- better analytics sentences

## V2 — only after demand

Possible:

- FCM push
- 360 real-photo viewer
- enquiry log
- saved searches
- magic-link login
- STAFF role
- custom subdomains
- accessories catalogue
- Hindi/Kannada UI

## V3 — only if many shops pay

Possible:

- cross-shop search
- exchange/valuation calculator
- verified Google Business Profile review integration
- AI-assisted descriptions
- social-post automation
- billing/subscriptions
- self-serve onboarding

Do not build these because they sound impressive. Build them because paying shops repeatedly ask for them.


---

# 25. BUILD ORDER

| Phase | Build | Acceptance |
|---|---|---|
| 1 | Scaffold + Tailwind + Prisma + env + schema + seed | App boots, DB migrates, seed works |
| 2 | Auth + admin shell | Owner login works |
| 3 | Media upload | 2–8 images upload/reorder/delete |
| 4 | Product CRUD | Add phone in <90s |
| 5 | Product detail + WhatsApp | Correct `wa.me` |
| 6 | Browse/search/filter/sort | URL-driven and server rendered |
| 7 | Home + About | Premium real-shop presentation |
| 8 | Shop settings + announcement + testimonials | Owner controls content |
| 9 | Analytics + insights | WhatsApp/product interest visible |
| 10 | SEO + OG + sitemap | Search/share quality |
| 11 | PWA | Install + safe caching |
| 12 | QR | Printed QR works |
| 13 | Security + performance + docs | Production-ready |
| 14 | First real shop onboarding | Owner can use without training |

Build product detail before polishing the homepage.

The product detail page teaches us what information actually matters.


---

# 26. SEED DATA

Demo shop:

```text
Shree Mobiles
Ranibennur, Karnataka
slug: shree-mobiles
```

Seed:

- 9 major brands
- ~40 phone models
- 20–24 products
- mixed conditions
- mixed battery states
- a few sold products
- a few featured products
- realistic timestamps
- realistic demo testimonials clearly labelled as demo
- demo announcement

Never show demo content to a paying customer without replacing it.

Demo credentials must be changed before production.

Production seed must refuse to run unless explicitly enabled.


---

# 27. DEFINITION OF DONE

A feature is not done until it has:

- TypeScript strict
- no `any`
- Zod validation
- loading state
- empty state
- error state
- mobile verification at 360px+
- 44px touch targets
- alt text
- at least one meaningful test
- no console errors
- no layout shift
- no accidental private data exposure
- acceptable Lighthouse performance

## Final acceptance test

A real shop owner, using their own Android with no training, can:

```text
login
→ add phone
→ add photos
→ publish
→ share
→ mark sold
```

in under ~90 seconds for a normal listing.

A buyer on a mobile 4G connection can:

```text
open website
→ find phone
→ inspect details
→ tap WhatsApp
```

without creating an account or installing an app.

## Final product principle

**Do not build a bigger website. Build a website that makes the shop sell more phones and look more trustworthy.**
