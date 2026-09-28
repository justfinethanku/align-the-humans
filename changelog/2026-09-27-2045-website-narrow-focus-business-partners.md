# Website narrowed to business partners + "registration" redesign

**Keywords:** [POSITIONING] [REDESIGN] [DESIGN-SYSTEM] [MOTION] [IMAGERY] [SEO] [PRICING] [TEMPLATES] [COPY]

## What Changed

- **Positioning:** the public site now speaks only to two business partners or co-owners with a real commitment in front of them: starting a business together, bringing someone into the company, or changing how they already work. Couples, roommates, and chores are gone from every public surface.
- **Promise:** "Agree on the partnership before you commit to it." The product is sold as the step *before* the lawyer: answer separately, uncover different expectations and unspoken assumptions, and build a shared brief for legal review. It is never presented as a legal document product or a lawyer replacement.
- **New design system ("registration"):** each partner is one ink plate (cobalt `plate-a`, vermilion `plate-b`). Multiplied together they print as ink. "In register" means aligned, and colored fringes mean a hidden difference. Paper background, Archivo variable font (expanded width for display type), printer's crop marks around "proofs." Tokens live in `tailwind.config.ts` + `components/site/site.css`; marketing pages wrap in `.site` (always light).
- **Motion graphics (built in code):**
  - `PlateText`: headlines print in two inks that slide into register on load (the hero) or drift out of register (the "not like this" section).
  - `RegistrationMark`: the brand mark (logo, favicon, share image) settles into register on load.
  - `FiftyFifty`: a scroll-driven sticky piece. Two partners' "50/50" slide together into one crisp number. Then three assumptions (salary, existing clients, cutting back) print on top of each other illegibly and split apart into each partner's version. It ends on "Same split. Different deal."
  - Numbered steps print slightly misregistered; primary buttons carry plate fringes that close into register on hover.
  - All motion respects `prefers-reduced-motion` (the finished frame renders statically).
- **Imagery:** 6 new photoreal images (Grok Imagine 2K via OpenRouter; picked from 12): partners working apart in a studio (hero), starting together, bringing someone in, changing the deal, the brief on a lawyer's desk, and parting as friends. The 7 old images (couples, roommates, teams) were deleted. A new 1200×630 share image was rendered from HTML.
- **Pages:** homepage rebuilt (Hero, HiddenDifference, Situations, HowItWorks, WalkAway, Boundary, FAQ, PilotCTA). New `/example` page walks through a full fictional agency alignment: separate answers, what the comparison found, the resolution options weighed, the brief, and the alternate "don't partner" ending. Pricing, terms, privacy, login, and signup now share the paper theme.
- **Pricing:** the $12 / $19 / $59 ladder was replaced with a single `PILOT_OFFER` of $299 per pair. The in-app `UpgradeDialog` and the `/api/upgrade-interest` enum now use tier `partnership_pilot`. Migration `20260927120000_partnership_pilot_interest_tier.sql` widens the `upgrade_interest.tier` check constraint (legacy values stay valid).
- **SEO:** new titles and descriptions, business-partner keywords, OG/Twitter image, JSON-LD (Organization, WebApplication with the $299 offer and a BusinessAudience, a 4-step HowTo, and a new FAQPage), a rewritten `llms.txt`, a sitemap with `/example` added, `/example` whitelisted in middleware, and an `app/icon.svg` favicon.
- **App front door:** the template picker now leads with Partnership Terms and a new **Bringing Someone In** template (`new_partner`: role/authority, ownership, first-year pay, clients and existing work, expectations, and what happens if it isn't working), with matching focus areas in generate-questions. Roommate and other templates stay available lower in the list. Signup, clarity placeholders, and the dashboard tip no longer mention chores.

## Why

Jon adopted an outside review of positioning (2026-09-27): the broad "any two people, any decision" pitch diluted a product whose engine (independent answers, hidden-assumption and gap detection, focused resolution, a frozen signed snapshot) is strongest for business partners about to commit money, ownership, or real work. The review also said to lead with the alignment process, not a "founder-grade legal artifact"; to count "we shouldn't partner under these terms" as success; to test a paid $299-per-pair pilot instead of $12/$19; and to narrow the front door without deleting the rest of the engine.

## How

- Design plan first (tokens, type, layout, one bold idea), checked against generic AI-design defaults. Jon asked that the motion graphics be built directly (no Gemini/Veo), so all motion is React + CSS (multiply blend, scroll-progress hook, IntersectionObserver).
- Every product claim in the copy was checked against code: the analysis schema really returns hidden assumptions, gaps, and imbalances; partner answers really stay private until both submit. Two unsupported claims (recording reasons for changes, open questions in the brief) were cut.
- Verified in the in-app browser at 1440×900 and 375×812: scroll stages of the 50/50 piece, every section, the example, pricing, legal, and signup. JSON-LD blocks parse.

## Issues Encountered

- `fleet materialize --project` wrote all 214 fleet secrets into the worktree `.env` (no per-project scoping). It was deleted right away; the dev server got only the two public Supabase values via a scratchpad launcher.
- `next lint` fails in nested worktrees (it sees the parent repo's `.eslintrc.json` too). Lint was run with `npx eslint --no-eslintrc -c .eslintrc.json` instead, and it passed.
- The 50/50 piece needed measured heights (ResizeObserver) so the number starts centered and collapses without overlap on mobile.

## Dependencies

No new packages. Archivo is loaded through `next/font/google` with the `wdth` axis.

## Testing

`npm run type-check` passes. ESLint (repo config) is clean. `next build` passes. Visual QA was done at desktop and mobile sizes, with the console free of errors.

## Next Steps

- Run the pilot: recruit around 10 pairs (agency, consultancy, and studio partners first) and track invite acceptance, both-submitted rate, drop-off points, support needed, and whether the brief helps their lawyer.
- The free-first-alignment gate in the app still exists. Decide whether pilot pairs go through that free alignment or through a paid flow once billing is live.
- The Terms still carry a "final legal review pending" note and `[Jurisdiction]` placeholders. Resolve these before any paid launch.
- Consider holding back AI answer suggestions during answering until both partners have stated their own position, so the AI doesn't anchor them (flagged in the positioning review).
