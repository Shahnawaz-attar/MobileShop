# Copilot Instructions — MobileShop Template

> Read `/AGENTS.md` at project root for full context.

## Quick Rules

1. **TypeScript strict** — no `any`, ever
2. **Money = integer paise** — never float
3. **Server Components by default** — Client only when browser state needed
4. **Business logic** → `src/server/modules/*`
5. **Validate input** → Zod schemas
6. **No unused imports/variables**
7. **44px touch targets**, semantic HTML, keyboard accessible
8. **Never expose** private fields in public DTOs

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript 5 strict
- Tailwind CSS v4 + shadcn/ui
- Prisma 8 + PostgreSQL 16
- Import alias: `@/*` → `src/*`

## Do NOT suggest

- `any` type
- Axios, Lodash, Moment, Redux, Zustand
- MUI, Chakra, Bootstrap
- Redis, Algolia, GraphQL
- Cart, checkout, payment features
