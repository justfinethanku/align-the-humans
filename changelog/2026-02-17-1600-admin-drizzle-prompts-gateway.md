# 2026-02-17-1600 - Admin Dashboard, Drizzle ORM, Prompt System, AI Gateway

## What Changed

### Phase 1 Completion: Core Bug Fixes & Email Flow
- Wired invite email sending in `generate-invite/route.ts` (fire-and-forget pattern with Resend)
- Fixed `supabase.auth.admin.getUserById()` in analyze and sign routes to use `createAdminClient()` (admin API requires service role key)
- Added centralized AI model config in `ai-config.ts` with `resolveModel()` function
- Added status transition validation to alignment update helpers

### Phase 2: Drizzle ORM Integration
- Installed `drizzle-orm`, `drizzle-kit`, `postgres` packages
- Created Drizzle schema (`app/lib/db/schema.ts`) for all 9 existing tables + 3 new tables (prompts, prompt_versions, admin_audit_log)
- Created migration SQL (`drizzle/0001_add_prompts_and_audit.sql`)
- Created Drizzle query functions (`app/lib/db/queries.ts`) parallel to existing `db-helpers.ts`
- Created Drizzle-inferred types (`app/lib/db/types.ts`)
- Hybrid architecture: Drizzle for CRUD (bypasses RLS), Supabase for auth/realtime

### Phase 3: Prompt Management System
- Extracted 10 AI prompts from 6 route files into seed data (`app/lib/db/seed-prompts.ts`)
- Created prompt loader (`app/lib/prompts.ts`) with 5-minute in-memory cache, DB-first with seed fallback
- `renderPrompt()` for `{{variable}}` template substitution
- Wired all 6 AI endpoint routes to load config from prompt system (model, temperature, maxTokens)

### Phase 4: Admin Dashboard
- Admin layout with sidebar navigation and `is_admin` auth check
- Dashboard page with stats cards (total users, alignments, active, complete)
- Users page with table listing all profiles with role badges
- Alignments page with status-colored badges and alignment listing
- Prompt management: list page showing all 10 prompts, detail page with `{{variable}}` highlighting
- System page with active model config, environment status, and AI Gateway model discovery

### AI Gateway Model Discovery
- `discoverModels()` and `discoverAnthropicModels()` functions in `ai-config.ts`
- 10-minute cached `fetch()` to `GET https://ai-gateway.vercel.sh/v1/models`
- Graceful fallback to hardcoded defaults when gateway is unavailable
- Admin API route: `GET /api/admin/models` with provider filter parameter
- System admin page renders discovered models grouped by provider

### Domain Fix
- Updated all references from `humanalignment.app` to `alignthehumans.com` across layout, robots, sitemap, llms.txt, and SEO schemas

## Why
- Drizzle ORM provides type-safe database queries with better DX than raw Supabase client
- Prompt management system decouples AI config from code, enabling hot-reload without deploys
- Admin dashboard gives visibility into users, alignments, and AI configuration
- AI Gateway model discovery removes need to hardcode model IDs

## How
- Used `timestamp(name, { withTimezone: true, mode: 'string' })` helper for Drizzle's timestamptz columns
- Prompt system uses dynamic imports to avoid loading Drizzle on every module import
- Admin auth: middleware redirects unauthenticated users, layout checks `is_admin` flag
- AI Gateway: direct REST `fetch()` with no extra SDK dependencies (OpenAI not needed)

## Issues Encountered
1. `timestamptz` not exported from `drizzle-orm/pg-core` - solved with helper function
2. `supabase.auth.admin.getUserById()` fails without service role key - switched to `createAdminClient()`
3. `unknown && JSX.Element` not assignable to `ReactNode` in React 19 strict types - switched to ternary pattern
4. Background agents created pages with double `min-h-screen bg-zinc-950 p-8` (conflicting with admin layout) - cleaned up

## Dependencies Added
- `drizzle-orm` - Drizzle ORM core
- `drizzle-kit` - Drizzle migrations/introspection CLI
- `postgres` - PostgreSQL driver for Drizzle

## Testing
- `npm run build` passes after each phase
- All 6 AI endpoint routes verified compiling with prompt system
- Admin pages render server-side (no client components needed)

## Files Changed (Key)
- `app/lib/ai-config.ts` - Centralized models + AI Gateway discovery
- `app/lib/db/schema.ts` - Complete Drizzle schema
- `app/lib/db/queries.ts` - Drizzle query functions
- `app/lib/db/seed-prompts.ts` - 10 prompt seeds
- `app/lib/prompts.ts` - Prompt loader with cache
- `app/admin/` - Full admin dashboard (7 pages)
- `app/api/admin/models/route.ts` - Model discovery API
- `drizzle/0001_add_prompts_and_audit.sql` - Migration for new tables

## Next Steps
- Run migration against production Supabase database
- Seed prompts table from `seed-prompts.ts`
- Set first admin user's `is_admin` flag to `true`
- Add prompt editing capability to admin UI
- Deploy and verify AI Gateway model discovery with production key
