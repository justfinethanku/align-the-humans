Rules: The Fleet Handbook is the only source of rules: https://linear.app/contentionmedia/document/the-fleet-handbook-f3713ba1f434

- Team page: [Align the Humans: team page](https://linear.app/contentionmedia/document/align-the-humans-team-page-aa017e44b3e5)
- Fleet Handbook: https://linear.app/contentionmedia/document/the-fleet-handbook-f3713ba1f434
- Operating system index: https://linear.app/contentionmedia/document/the-operating-system-index-of-rules-templates-and-sops-3766418ca97b

## GitHub-synced Linear issues
Some Linear issues are synced from GitHub issues. The sync overwrites edits made on the Linear side, and Linear comments can echo back to GitHub. Work these through GitHub: comment on the GitHub issue, link the PR with `Fixes #<n>`, and let the sync close the Linear copy when the PR merges. Merging the PR is fine.
(How-to, FLEET-144/151, ruled by Jon with Lex, Oct 27 2026.)

# AGENTS.md

Ship order for any coding agent. Product facts are in `CLAUDE.md`. Human setup is in `README.md`. Production deploys, previews, migrations, and rollback are in `docs/deploy.md`. The sections after Ship are the map of the code.

## Ship

Commands below are the scripts in `package.json` and the steps in `.github/workflows/ci.yml` and `.github/workflows/e2e.yml`. Do not commit secrets. Env values stay in `.env.local` (gitignored). Names are listed under Environment Variables and in `.env.example`.

### Install

CI uses Node 22 (`.github/workflows/ci.yml`). The repo has no `.nvmrc` and no `engines` field. README's local prerequisite is Node.js 20.9 or newer.

```bash
npm ci
```

That is the install CI runs. README's first-time setup also documents `npm install`.

### Lint, types, unit tests, and build

Same order as the `ci` job:

```bash
npm run lint        # eslint .
npm run type-check  # tsc --noEmit
npm test            # node --test; files listed below
npm run build       # next build
```

`npm test` typechecks each group with `tsc`, then runs `node --test` on:

- `app/api/auth/email/hook.test.ts`
- `app/lib/partner-search.test.ts`
- `app/lib/rate-limit.test.ts`
- `app/lib/ops-alert.test.ts`
- `app/lib/ai-recovery.test.ts`
- `app/lib/api-error-message.test.ts`

`npm run build` needs `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `INVITE_TOKEN_SECRET` set. The CI build step sets placeholder strings for those four names. They are compile stand-ins. A local build reads `.env.local`.

### End-to-end

```bash
npx playwright install --with-deps chromium
npm run test:e2e
```

`npm run test:e2e` is `node tests/e2e/run.mjs`. It starts the local Supabase stack, resets that database to `supabase/migrations`, and runs `tests/e2e/core-journey.spec.ts` in Chromium. The journey is invite, join, answer, analyze, sign, and a PDF. Accounts are made up for the run. The model is stubbed. Docker is required, because the runner starts that Supabase stack. Playwright builds the app and serves it on port 3100, and it does not reuse a server that is already running (`playwright.config.ts`).

`.github/workflows/e2e.yml` runs this on every pull request to `main` and every push to `main`. The job name is `e2e`: `npm ci` (Node 22), `npx playwright install --with-deps chromium`, then `npm run test:e2e`. That job name is the status-check context.

`docs/testing-runbook.md` is the manual journey. `E2E_TEST_PLAN.md` was removed.

### Run locally

```bash
cp .env.example .env.local
npm run dev     # http://localhost:3000
npm start       # serves the production build from npm run build
```

What each key is for: `README.md` (Getting Started) and `.env.example`.

### Pull request

1. Branch from `main` and open a pull request into `main`. The repo has no pull request template. `README.md` says to open an issue or a pull request.
2. `.github/workflows/ci.yml` runs on every pull request to `main` and on every push to `main`. The job name is `ci`. Steps: `npm ci` (Node 22), `npm run lint`, `npm run type-check`, `npm test`, `npm run build`. The workflow says branch protection and rulesets on `main` should require the `ci` status-check context.
3. `.github/workflows/e2e.yml` runs on the same events. The job name is `e2e`. It is a separate check from `ci`.
4. The Vercel GitHub integration adds a preview deployment and a commit status named `Vercel`. Pull request 25 also had `Vercel Preview Comments`. Whether every pull request has that third check is unknown; see `docs/deploy.md`.
5. Merge when `ci` and `e2e` are green and the Vercel preview status has completed. `docs/deploy.md` records that a read of classic branch protection returned 403 and the ruleset list was empty, so whether GitHub itself blocks a red check was not confirmed. Treat a red `ci`, a red `e2e`, or a failed Vercel preview as a stop.

### Merge and deploy

Merging the pull request pushes `main`. The Vercel GitHub integration publishes that push to production (project `align-the-humans`; domains and rollback in `docs/deploy.md`). `.github/workflows/ci.yml` does not call the Vercel CLI. On the push checked in `docs/deploy.md`, the production deployment finished while `ci` was still running. The push is what deploys.

The app deploy does not apply SQL. Migrations are a separate step, documented in `docs/deploy.md`.

## Project Overview

**Human Alignment** is a Next.js 16 (`^16.4.3`) and React 19 (`^19.3.1`) web application for two business partners or co-owners. Each person answers independently. AI comparison surfaces different expectations, and the pair works toward a shared brief for their lawyer. The public site covers starting a business together, bringing someone into the company, or changing how they already work. It is the process before legal drafting. A lawyer drafts the operating agreement from the brief.

**Domain:** https://alignthehumans.com

**Repository:** https://github.com/justfinethanku/align-the-humans (public)

## Development Commands

Install, lint, type-check, `npm test`, `npm run test:e2e`, build, local run, pull request, and merge are in [Ship](#ship) above. `README.md` lists the same scripts for humans.

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

## Cursor Cloud

The saved environment points to `.cursor/environment.json`. Setup and retest
are in `docs/testing-runbook.md` under Cursor Cloud. In a Bash shell, source
`.cursor/runtime.sh` before npm commands to select the pinned Node version.
The existing installer generates `.env.local` from injected variables; use an
isolated local Supabase stack for stateful tests, never real customer data.
