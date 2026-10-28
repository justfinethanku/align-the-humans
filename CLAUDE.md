@AGENTS.md

Ship order (install, tests, pull request, merge, deploy) is the Ship section of `AGENTS.md`.

Current product facts. `AGENTS.md` repeats them. If the two files disagree, trust the code cited here and update both.

- **Audience.** Two business partners or co-owners. The public site (`app/page.tsx`, `app/layout.tsx`, `components/homepage/FAQ.tsx`) is for people starting a company together, bringing someone into an existing one, or changing how they split the work and the money. It is the conversation before a lawyer drafts an agreement.
- **Repository.** Public: https://github.com/justfinethanku/align-the-humans
- **Framework.** Next.js `^16.4.3` and React `^19.3.1` (`package.json`).
- **Theme.** Light by default. `ThemeProvider` in `app/layout.tsx` sets `defaultTheme="light"` and `enableSystem={false}`. The root `<html>` has no `dark` class. Tailwind dark mode is class-based (`design-system/tailwind.preset.ts`). Marketing pages under `.site` set `color-scheme: light` (`components/site/site.css`).
- **AI.** OpenRouter via `@openrouter/ai-sdk-provider` and the Vercel AI SDK (`ai` 5.0.222). `@ai-sdk/anthropic` is not a dependency. `AI_MODELS.SONNET` in `app/lib/ai-config.ts` is `anthropic/claude-sonnet-4.6` (`AI_MODELS.HAIKU` is `anthropic/claude-haiku-4.5`). Routes call `resolveModel(promptConfig.model)`. The `prompts.model` column defaults to `anthropic/claude-sonnet-4.6` (`supabase/migrations/20260701130000_add_prompts_and_audit.sql`). Seed prompts in `app/lib/db/seed-prompts.ts` currently name `z-ai/glm-5.2`; `resolveModel` forwards a slug that already contains `/`. An empty or schema-invalid reply is retried once on that prompt model, then once on the other `AI_MODELS` slug (`fallbackModelFor`). Document generation does not call a model.
- **Schema.** `supabase/migrations` is the database schema. `plan_a.md` is an older specification.

Setup keys the app reads (full notes in AGENTS.md → Environment Variables): `OPEN_ROUTER_API_KEY` for AI generation, with `OPENROUTER_API_KEY` as the fallback; `AI_GATEWAY_API_KEY` for admin model discovery only; `RESEND_API_KEY`; `SUPABASE_AUTH_HOOK_SECRET`; optional `OPS_ALERT_EMAIL` for auth and Resend failure alerts.
