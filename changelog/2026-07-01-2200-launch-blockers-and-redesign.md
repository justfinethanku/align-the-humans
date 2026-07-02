# 2026-07-01 22:00 - Launch Blockers Fixed + Full Public-Site Redesign

## What Changed

### Launch-blocker engineering pass (multi-agent workflow, adversarially verified)
- **RLS partner lockout fixed** — `supabase/migrations/20260701120000_fix_alignments_participant_rls.sql`: SECURITY DEFINER helpers (`is_alignment_participant()`, `is_platform_admin()`) restore participant + admin access to `alignments` without the mutual recursion that motivated the old creator-only policies. Confirmed live via Supabase MCP that prod had creator-only policies (invited partners fully locked out). **Migration not yet applied to prod.**
- **Auth flow completed** — created `app/auth/forgot-password` and `app/auth/reset-password` pages (previously dead links), wired `forgotPasswordAction`, `/auth/callback` now handles `token_hash`/`verifyOtp` alongside PKCE `?code=`, `NEXT_PUBLIC_SITE_URL` → `NEXT_PUBLIC_APP_URL`, open redirect (`//evil.com`) closed.
- **Security hardening** — `/api/auth/email` webhook signature now mandatory (was bypassable by omitting the header); per-user in-memory rate limiting on all 6 AI routes (`app/lib/rate-limit.ts`, `RateLimitError`); participant check on `clarity/suggest`; security headers + CSP-Report-Only in `next.config.js`.
- **Flow polish** — resolution round cap (`MAX_RESOLUTION_ROUNDS = 5`) with UI stall state; partner email search via admin client (was display-name-only); `scripts/set-admin.ts` admin bootstrap.
- **Hygiene** — dead test/seed artifacts removed; `plan_a.md` reconstructed; `supabase/migrations/` now tracked in git (entire `supabase/` dir was previously gitignored — no migration had ever been version-controlled).

### Full public-site redesign (Grok Build delegation, chunked; Claude spec/review)
- **Design system** — full shadcn semantic token set defined for `:root` + `.dark` (those tokens were referenced by every `components/ui/*` primitive but never defined — `bg-card`, `ring-ring` etc. compiled to nothing). New premium-cinematic palette: warm near-black grounds, amber/gold primary, muted teal secondary (replacing emerald/indigo). True light + dark modes via `next-themes` (dark default) with `ThemeToggle` in Header and auth layout. Manrope loaded as display face.
- **Homepage rebuilt section by section** with copy from a rhetorical-pipeline Foundation (single takeaway, but/therefore story spine, enter-on-pain):
  - Hero: cinematic generated photograph, "Agree on the hard things. / Without the fight."
  - New ProblemSection (tension photo, "Every hard conversation becomes a negotiation.")
  - FlowVisualization steps humanized (Answer alone → See where you already agree → Name the real conflicts → Resolve what matters → Sign it)
  - UseCases: four photographic audience cards (cofounders, couples, roommates, teams)
  - **All fabricated social proof removed** — 87%/10k+/70% stats section, invented testimonials, fake 4.9/247 `aggregateRating` JSON-LD, and the same claims in site metadata and `llms.txt`. Replaced with honest WhyItWorks section (no anchoring / neutral third brain / everything in writing).
  - CTASection copy, new Footer component, `/terms` + `/privacy` pages (plain-language drafts, labeled pending legal review) added to PUBLIC_ROUTES and sitemap.
- **Brand unified** to "Align the Humans" (header wordmark, titles, metadata; was split with "Human Alignment").
- **Imagery** — 8 images generated with GPT-5.4 Image 2 (premium-cinematic, amber/teal grade), web-optimized into `public/images/`; `og-image.jpg` created (og-image/logo had 404ed forever — repo had no `public/` dir).
- **Auth/join light-mode sweep** — forgot-password, reset-password, join page + client, join error/loading states off hardcoded dark hexes onto semantic tokens.

## Why
Repo had been stale ~4.5 months; goal is launch. Full review found the app live but with the core two-party flow broken in prod (RLS), password reset nonexistent, fabricated marketing claims, and a half-wired design system.

## How
Two-layer delegation: a Workflow (13 subagents, adversarial verify) for the launch blockers; then per-chunk Grok Build sessions in visible tmux (new `grok-visible-delegation` skill) with Claude writing specs, reviewing diffs, fixing forward, and committing. All copy locked via rhetorical-pipeline Foundation before any rendering.

## Issues Encountered
- Grok/xAI API wedged in retry loops 3× (evening flakiness); recovered via cancel+resume or process restart per the skill's escalation ladder. No work lost (specs in prompt files, edits on disk).
- `supabase/` was fully gitignored — migrations were never in version control until tonight.
- Fabricated stats appeared in 5 distinct places (stats section, testimonials, JSON-LD rating, site metadata, llms.txt).

## Dependencies
- Added: `next-themes`. Removed: none.

## Testing
- `npm run type-check`, `npm run lint`, `npm run build` pass after every chunk (verified independently of implementer claims).
- NOT yet done: visual review of both themes (next step), two-account prod smoke test (blocked on applying the RLS migration).

## Next Steps (launch gates, human-required)
1. Set `ANTHROPIC_API_KEY` + `NEXT_PUBLIC_APP_URL=https://alignthehumans.com` in Vercel (SITE_URL can be deleted).
2. Apply migration `20260701120000_fix_alignments_participant_rls.sql` to prod (idempotent).
3. Supabase dashboard → Auth → Hooks: confirm Send-Email hook → `/api/auth/email`, set `SUPABASE_AUTH_HOOK_SECRET`.
4. `npx tsx scripts/set-admin.ts <email>` for first admin.
5. Two-account end-to-end prod smoke test (the RLS fix is only proven when a real partner gets through the whole flow).
Non-blocking: Vercel KV for durable rate limiting; Drizzle prompts migration (seed fallback works); finalize legal pages ([Jurisdiction], support email); Supabase advisor items (SECURITY DEFINER RPCs callable by anon, mutable search_path fns, leaked-password protection off).
