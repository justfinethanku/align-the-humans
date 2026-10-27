Rules: The Fleet Handbook is the only source of rules: https://linear.app/contentionmedia/document/the-fleet-handbook-f3713ba1f434

- Team page: [Align the Humans: team page](https://linear.app/contentionmedia/document/align-the-humans-team-page-aa017e44b3e5)
- Fleet Handbook: https://linear.app/contentionmedia/document/the-fleet-handbook-f3713ba1f434
- Operating system index: https://linear.app/contentionmedia/document/the-operating-system-index-of-rules-templates-and-sops-3766418ca97b

## GitHub-synced Linear issues
Some Linear issues are synced from GitHub issues. The sync overwrites edits made on the Linear side, and Linear comments can echo back to GitHub. Work these through GitHub: comment on the GitHub issue, link the PR with `Fixes #<n>`, and let the sync close the Linear copy when the PR merges. Merging the PR is fine.
(How-to, FLEET-144/151, ruled by Jon with Lex, Oct 27 2026.)

# AGENTS.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Human Alignment** is a Next.js 16 (`^16.4.3`) and React 19 (`^19.3.1`) web application for two business partners or co-owners. Each person answers independently. AI comparison surfaces different expectations, and the pair works toward a shared brief for their lawyer. The public site covers starting a business together, bringing someone into the company, or changing how they already work. It is the process before legal drafting. A lawyer drafts the operating agreement from the brief.

**Domain:** https://alignthehumans.com

**Repository:** https://github.com/justfinethanku/align-the-humans (public)

## Development Commands

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint CLI (flat config in eslint.config.mjs)
npm run type-check   # TypeScript check (tsc --noEmit)
npm test             # node --test cases for the auth email hook, partner search, rate limit, and ops alerts
npm start            # Run production build
```

## Environment Variables

Copy `.env.example` to `.env.local`. Required:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key (client-safe)
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (server-only)
- `OPEN_ROUTER_API_KEY` - OpenRouter key for AI generation. The app reads this name first and falls back to `OPENROUTER_API_KEY` when it is unset.
- `RESEND_API_KEY` - Resend API key for transactional email
- `SUPABASE_AUTH_HOOK_SECRET` - Standard Webhooks secret (`v1,whsec_...`) for the Supabase Send Email hook
- `OPS_ALERT_EMAIL` - Optional comma-separated inbox. A 401/500 from `/api/auth/email`, or a rejected Resend send, emails this address at most once per 15 minutes. Unset means log only.
- `INVITE_TOKEN_SECRET` - Secret for encrypting invite tokens (AES-256-GCM)
- `AI_GATEWAY_API_KEY` - Vercel AI Gateway key used only for admin model discovery, not generation (optional for local dev)

## Tech Stack

- **Framework:** Next.js `^16.4.3` (App Router, `app/` directory, Turbopack builds) with React `^19.3.1`, from `package.json`
- **Language:** TypeScript (strict mode, `@/*` path alias maps to project root)
- **Styling:** Tailwind CSS. Dark mode is opt-in via `darkMode: 'class'` (`design-system/tailwind.preset.ts`). The default theme is light: `ThemeProvider` in `app/layout.tsx` sets `defaultTheme="light"` and `enableSystem={false}`, and the root `<html>` has no `dark` class. Marketing pages under `.site` set `color-scheme: light` (`components/site/site.css`).
- **UI Components:** shadcn/ui in `components/ui/`
- **Backend:** Supabase (PostgreSQL + RLS + Realtime). Schema source of truth: `supabase/migrations`.
- **AI:** Vercel AI SDK (`ai` 5.0.222) through OpenRouter (`@openrouter/ai-sdk-provider`). `AI_MODELS.SONNET` is `anthropic/claude-sonnet-4.6` and `AI_MODELS.HAIKU` is `anthropic/claude-haiku-4.5` (`app/lib/ai-config.ts`). `@ai-sdk/anthropic` is not a dependency.
- **Forms:** react-hook-form + zod validation
- **Notifications:** sonner (toast)
- **Icons:** lucide-react

## Architecture

### Supabase Client Pattern

Two client factories, never use raw `@supabase/ssr` directly:
- **Server** (`app/lib/supabase-server.ts`): `await createServerClient()` for Server Components, Route Handlers, Server Actions. `createAdminClient()` (sync, no cookies) bypasses RLS: use it only for admin work, never for reads that should follow the caller's visibility. Auth helpers: `getCurrentUser()`, `requireAuth()`.
- **Browser** (`app/lib/supabase-browser.ts`): `createClient()` for Client Components and realtime subscriptions.

Both are typed via `Database` type from `app/lib/database.types.ts` (generated from Supabase schema).

### Database Helpers

`app/lib/db-helpers.ts` provides type-safe wrappers for all CRUD: `getUserAlignments()`, `getAlignmentDetail()`, `createAlignment()`, `saveResponse()`, `submitResponse()`, `saveAnalysis()`, `createSignature()`, etc. Always use these instead of raw Supabase queries when a helper exists.

### Error Hierarchy

`app/lib/errors.ts` defines a structured error system:
- `AppError` (base) → `ApiError`, `ValidationError`, `AuthError`, `AlignmentError`, `DatabaseError`, `AIError`
- All errors have `code`, `statusCode`, `details` and serialize to JSON via `toJSON()`
- `AlignmentError` has static factories: `.invalidTransition()`, `.incompleteParticipation()`, `.unauthorized()`, `.notFound()`
- Use `createErrorResponse(error)` in API routes to return standardized error responses

### Proxy (formerly middleware)

`proxy.ts` handles auth routing:
- Public routes: `/`, `/login`, `/signup`, `/auth/*`, `/join/*`
- Authenticated users hitting `/login` or `/signup` redirect to `/dashboard`
- Unauthenticated users hitting protected routes redirect to `/login?redirectTo=...`
- API routes (`/api/*`) and static files are skipped

### AI Integration

AI routes use the Vercel AI SDK. Analysis, question generation, and conflict resolution call `generateObject()` with Zod schemas. Clarity and per-topic suggestions call `generateText()`. An empty or schema-invalid reply is tried once more on `prompts.model`, then once on the other model in `AI_MODELS` (`fallbackModelFor` in `app/lib/ai-config.ts`: Haiku for short suggestions, Sonnet for structured generation). `POST /api/alignment/generate-document` does not call a model.
- `POST /api/alignment/analyze` - Compare responses, detect conflicts (uses `analysisSchema`)
- `POST /api/alignment/generate-questions` - AI-generate questions from clarity context
- `POST /api/alignment/resolve-conflicts` - Suggest compromises
- `POST /api/alignment/get-suggestion` - Get AI suggestion for a specific topic
- `POST /api/alignment/clarity/suggest` - AI-assisted form customization

`POST /api/alignment/generate-document` renders the agreement preview from stored answers (`app/lib/agreement-snapshots.ts`).

Provider: `resolveModel()` in `app/lib/ai-config.ts` returns an OpenRouter chat model (`createOpenRouter` from `@openrouter/ai-sdk-provider`). Routes pass `resolveModel(promptConfig.model)`. `AI_MODELS.SONNET` is `anthropic/claude-sonnet-4.6`. The `prompts.model` column defaults to that slug (`supabase/migrations/20260701130000_add_prompts_and_audit.sql`). Seed prompts in `app/lib/db/seed-prompts.ts` currently set `z-ai/glm-5.2`; a slug that already contains `/` is forwarded as-is. Analysis temperature defaults to 0.3 (`AI_DEFAULTS.analysis` and the `prompts.temperature` column default). Suggestion and clarity defaults are 0.7.

### Invite System

Partners join via shareable invite links (`/join/[token]`). Security model:
- Tokens are 256-bit random, base64url-encoded
- Only SHA-256 hashes stored in database (plus optional AES-256-GCM encrypted ciphertext for retrieval)
- Raw tokens returned only once at generation time
- Token utilities in `app/lib/invite-tokens.ts`

### Validation

`app/lib/schemas.ts` contains Zod schemas for all API contracts. `AlignmentQuestionSchema` is recursive (supports `followUps`). Template seeds validated via `TemplateSeedSchema`.

### Templates

`app/lib/templates.ts` has curated fallback templates (operating agreement, cofounder equity, roommate, marketing, business ops, custom). Used when AI generation fails. `templateRegistry` maps seed types to question arrays.

## Marketing Site Positioning

The public site (`/`, `/example`, `/pricing`, legal and auth pages) targets **two business partners or co-owners** facing a real commitment: starting a business together, bringing someone into the company, or changing how they already work. It sells the process that happens *before* legal drafting, never a replacement for a lawyer or a finished operating agreement. Pricing is a $299-per-pair pilot (`PILOT_OFFER` in `app/lib/monetization.ts`); billing is not live.

Design: "registration" — each partner is one ink plate (cobalt `plate-a`, vermilion `plate-b`); multiplied together they print as ink. Marketing pages wrap in `.site` (always light, Archivo variable font, tokens in `components/site/site.css` + `tailwind.config.ts`). The engine stays general-purpose; only the front door is narrow.

## Alignment Workflow

### Status State Machine
```
draft → active → analyzing → resolving → complete
```
Transitions enforced by `VALID_STATUS_TRANSITIONS` in `app/lib/types.ts`. Use `isValidStatusTransition()` to validate.

### 5-Phase Flow (Route Structure)
1. **New** (`/alignment/new`) - Create alignment, select template, invite partner
2. **Clarity** (`/alignment/[id]/clarity`) - AI-assisted topic refinement with `ClarityForm`
3. **Questions** (`/alignment/[id]/questions`) - Independent answering via `questionnaire-client`
4. **Analysis** (`/alignment/[id]/analysis`) - AI comparison and conflict detection
5. **Resolution** (`/alignment/[id]/resolution`) - Iterative conflict resolution with `resolution-form`
6. **Document** (`/alignment/[id]/document`) - Final agreement with signatures and PDF export

### Component Organization

```
components/
├── ui/              # shadcn/ui primitives (button, card, input, dialog, etc.)
├── homepage/        # Hero, HiddenDifference, Situations, HowItWorks, WalkAway, Boundary, FAQ, PilotCTA
├── site/            # Marketing design system: PlateText, RegistrationMark, motion/ (FiftyFifty scroll piece), site.css
├── dashboard/       # AlignmentCard, StatusBadge, PartnersList, AddPartnerModal
├── alignment/       # ShareLinkButton, InviteStatus
├── layout/          # Header
└── seo/             # HowToSchema, WebApplicationSchema (JSON-LD)
```

Page-specific client components live next to their pages (e.g., `app/alignment/[id]/resolution/resolution-form.tsx`).

### Custom Hooks

- `useDashboardData` - Fetches user's alignments, profiles
- `usePartners` - Partner list management
- `useAlignmentUpdates` - Supabase Realtime subscription for live alignment changes

## Database

The schema source of truth is `supabase/migrations`.

### Core Tables (8 + invitations)
`profiles`, `alignments`, `alignment_participants`, `alignment_responses`, `alignment_analyses`, `alignment_signatures`, `partners`, `templates`, `alignment_invitations`

### Migrations
Located in `supabase/migrations/`. Key migrations:
- `20251110051815_init_human_alignment.sql` - Base schema with RLS
- `20251110133651_add_alignment_invitations.sql` - Invite system
- `20250120120000_add_clarity_draft_and_invite_usage.sql` - Clarity draft + invite tracking

All tables have RLS enabled. Policies use `auth.uid()` to scope access.

### JSONB Fields
- `alignment_responses.answers` → `ResponseAnswers` (versioned, keyed by question ID)
- `alignment_analyses.summary` → `AnalysisSummary` (score, conflicts, agreements)
- `alignment_analyses.details` → `AnalysisDetails` (full AI output, token counts)
- `alignment_signatures.canonical_snapshot` → `CanonicalSnapshot` (frozen signed content with SHA-256 hash)
- `templates.content` → `TemplateContent` (questions array with AI hints)

## Critical References

- **`supabase/migrations/`** - Current database schema
- **`/plan_a.md`** (root) - Older specification with UI descriptions and API contracts. Current schema is `supabase/migrations`. Its model notes predate OpenRouter.
- **`/context/supabase_cli.md`** - Supabase CLI notes. The applied schema is `supabase/migrations`.
- **`/context/model-integrations.md`** - Older model notes. Generation uses OpenRouter as described above.

## Changelog

Session notes live in `/changelog/`:
- **Filename:** `YYYY-MM-DD-HHMM-descriptive-keywords.md`
- **Sections:** What Changed, Why, How, Issues Encountered, Dependencies, Testing, Next Steps
- A summary entry for that file goes in `/changelog/README`
- Format spec: `/changelog.md`

## Key Conventions

- Auth routes use route group: `app/(auth)/login`, `app/(auth)/signup` with shared layout
- Server Actions in `actions.ts` files next to pages (e.g., `app/(auth)/login/actions.ts`)
- Auth callback handled at `app/auth/callback/route.ts`
- `app/lib/telemetry.ts` provides `PerformanceTimer` and structured logging for AI operations
- XSS protection: `isomorphic-dompurify` for sanitizing AI-generated HTML content
- SEO: `robots.ts`, `sitemap.ts`, `llms.txt/route.ts` for machine-readable site info
- Partner responses are never exposed to the other party until both have submitted and analysis is complete

## Fleet

- Linear team: ATH. Work and status live in Linear.
- SOPs: Align the Humans SOP index: https://linear.app/contentionmedia/document/align-the-humans-sop-index-b96ebc9261ae
