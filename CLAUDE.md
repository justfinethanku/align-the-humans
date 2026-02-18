# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Human Alignment** is a Next.js 14 web application that facilitates mutual agreement between partners through AI-guided structured conversations. Two parties independently answer questions about a topic, then Claude AI analyzes responses, identifies conflicts, and guides iterative resolution toward consensus.

**Domain:** https://alignthehumans.com

## Development Commands

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint
npm run type-check   # TypeScript check (tsc --noEmit)
npm start            # Run production build
```

## Environment Variables

Copy `.env.example` to `.env.local`. Required:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key (client-safe)
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (server-only)
- `AI_GATEWAY_API_KEY` - Vercel AI Gateway key (optional for local dev)
- `INVITE_TOKEN_SECRET` - Secret for encrypting invite tokens (AES-256-GCM)

## Tech Stack

- **Framework:** Next.js 14 (App Router, `app/` directory)
- **Language:** TypeScript (strict mode, `@/*` path alias maps to project root)
- **Styling:** Tailwind CSS, dark mode by default (`<html class="dark">`)
- **UI Components:** shadcn/ui in `components/ui/`
- **Backend:** Supabase (PostgreSQL + RLS + Realtime)
- **AI:** Vercel AI SDK v5 (`ai` + `@ai-sdk/anthropic`) with Claude Sonnet 4.5
- **Forms:** react-hook-form + zod validation
- **Notifications:** sonner (toast)
- **Icons:** lucide-react

## Architecture

### Supabase Client Pattern

Two client factories, never use raw `@supabase/ssr` directly:
- **Server** (`app/lib/supabase-server.ts`): `createServerClient()` for Server Components, Route Handlers, Server Actions. Also `createAdminClient()` to bypass RLS. Auth helpers: `getCurrentUser()`, `requireAuth()`.
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

### Middleware

`middleware.ts` handles auth routing:
- Public routes: `/`, `/login`, `/signup`, `/auth/*`, `/join/*`
- Authenticated users hitting `/login` or `/signup` redirect to `/dashboard`
- Unauthenticated users hitting protected routes redirect to `/login?redirectTo=...`
- API routes (`/api/*`) and static files are skipped

### AI Integration

All AI endpoints use Vercel AI SDK with `generateObject()` (structured output with Zod schemas) rather than `streamText()`:
- `POST /api/alignment/analyze` - Compare responses, detect conflicts (uses `analysisSchema`)
- `POST /api/alignment/generate-questions` - AI-generate questions from clarity context
- `POST /api/alignment/resolve-conflicts` - Suggest compromises
- `POST /api/alignment/generate-document` - Generate agreement document
- `POST /api/alignment/get-suggestion` - Get AI suggestion for a specific topic
- `POST /api/alignment/clarity/suggest` - AI-assisted form customization

Model: `anthropic('claude-sonnet-4-5-20250929')`, temperature 0.3 for analysis, higher for creative suggestions.

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
├── homepage/        # Hero, FlowVisualization, StatsSection, UseCases, Testimonials, CTASection
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

- **`/plan_a.md`** (root) - Primary specification with complete UI descriptions, API contracts, and implementation strategy
- **`/context/supabase_cli.md`** - Database schema docs and CLI reference
- **`/context/model-integrations.md`** - Claude API reference and pricing

## Changelog Requirements

Every development session must create a changelog in `/changelog/`:
- **Filename:** `YYYY-MM-DD-HHMM-descriptive-keywords.md`
- **Sections:** What Changed, Why, How, Issues Encountered, Dependencies, Testing, Next Steps
- Also add a summary entry to `/changelog/README`
- See `/changelog.md` for full format spec

## Key Conventions

- Auth routes use route group: `app/(auth)/login`, `app/(auth)/signup` with shared layout
- Server Actions in `actions.ts` files next to pages (e.g., `app/(auth)/login/actions.ts`)
- Auth callback handled at `app/auth/callback/route.ts`
- `app/lib/telemetry.ts` provides `PerformanceTimer` and structured logging for AI operations
- XSS protection: `isomorphic-dompurify` for sanitizing AI-generated HTML content
- SEO: `robots.ts`, `sitemap.ts`, `llms.txt/route.ts` for machine-readable site info
- Partner responses are never exposed to the other party until both have submitted and analysis is complete
