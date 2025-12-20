# Gamify Toolkit App - AI Agent Instructions

## Project Overview

Shopify embedded app for embedding WebGL games into merchant storefronts. Built with **React Router v7** (migrated from Remix) + **Shopify App Bridge** + **Prisma/SQLite**.

## Architecture

```
app/                    → React Router admin dashboard (TypeScript)
├── routes/app.*.tsx    → Authenticated admin pages (games, layouts, stats, settings)
├── routes/api.*.tsx    → Public API endpoints for storefront
├── shopify.server.ts   → Shopify auth config (exports: authenticate, login, etc.)
└── db.server.ts        → Singleton Prisma client

extensions/gamify-toolkit-extension/   → Theme App Extension (Liquid)
├── blocks/*.liquid     → App blocks for storefront (webgl_game.liquid is main)
└── snippets/           → Reusable Liquid partials

prisma/schema.prisma    → Models: Session, Game, GameAnalytics, AppSettings, InputLayout
```

## Key Patterns

### Route Authentication
All `app.*.tsx` routes require Shopify admin authentication:
```tsx
import { authenticate } from "../shopify.server";
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  // session.shop is the store domain
};
```

### API Routes (Storefront-Accessible)
Routes in `api.*.tsx` are public endpoints called from Liquid blocks. Must return `Response` objects with CORS headers:
```tsx
return new Response(JSON.stringify(data), {
  headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
});
```

### UI Components
Admin UI uses **Shopify App Bridge web components** (not Polaris React):
- `<s-page>`, `<s-section>`, `<s-button>`, `<s-text-field>`, `<s-stack>`, `<s-link>`
- Navigation in [app/routes/app.tsx](app/routes/app.tsx) uses `<s-app-nav>` with `<s-link>`

### Prisma Usage
Always filter by `shop` (multi-tenant):
```tsx
await prisma.game.findMany({ where: { shop: session.shop } });
```

### Theme Extension Blocks
Blocks are modular (5 companion blocks) due to Shopify's 6-setting limit per block. See [BLOCKS_USAGE_GUIDE.md](BLOCKS_USAGE_GUIDE.md). Main game block: `webgl_game.liquid`. Companion blocks link via `Target Game ID` setting.

## Developer Commands

```bash
npm run dev              # Start dev server (shopify app dev)
npm run build            # Build for production
npm run setup            # prisma generate && prisma migrate deploy
npm run typecheck        # Type checking
npx prisma migrate dev   # Create new migration
npx prisma studio        # DB browser
shopify app deploy       # Deploy to Shopify
```

## Data Flow

1. **Admin** → Games CRUD at `/app/games` → stores in `Game` table
2. **Storefront** → Liquid blocks render games → call `/api/track` for analytics
3. **Analytics** → Daily aggregates in `GameAnalytics`, controlled by `AppSettings`

## File Naming Conventions

- Routes: `app.{feature}._index.tsx` (nested under app layout)
- API: `api.{resource}.tsx`
- Webhooks: `webhooks.{topic}.tsx`
- Liquid blocks: `{feature}.liquid` in `extensions/*/blocks/`

## Important Notes

- Database is SQLite (`prisma/dev.sqlite`) - works for single instance deployments
- `InputLayout.elements` stores JSON as string - parse when reading
- Liquid blocks use inline `<style>` and `<script>` (no external assets for simplicity)
- Shopify CLI manages tunneling and env vars during dev
