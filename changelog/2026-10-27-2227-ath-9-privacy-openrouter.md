# ATH-9: privacy page names OpenRouter

**Keywords:** [PRIVACY] [OPENROUTER] [COPY] [ATH-9]
**Session:** 2026-10-27, about 22:27 UTC
**Commit:** see the ATH-9 pull request

## What Changed

- `app/privacy/page.tsx` names OpenRouter as the service that receives alignment responses for AI processing, and names Z.ai (GLM 5.2) and Anthropic Claude (Sonnet 4.6 or Haiku 4.5) as the models that path routes to.
- The same bullet no longer says those responses go to Anthropic Claude via the Vercel AI Gateway, and no longer says that path generates agreement documents.
- The page date is October 27, 2026.

## Why

The public privacy page is the promise partners read before they share answers. It still described the pre-July 1, 2026 path. Generation has gone through OpenRouter since commit `8164e18`. The Vercel AI Gateway remains in the code only for the admin model list.

## How It Was Done

Checked `origin/main` at `94f10ac` before editing. `app/privacy/page.tsx` still said "Anthropic Claude (via the Vercel AI Gateway)" and "Last updated: July 1, 2026". The file's last content change on main is `3eeac48` (September 27, 2026), which did not update that date or the processor name.

AI routes (`analyze`, `get-suggestion`, `resolve-conflicts`, `generate-questions`, `clarity/suggest`) call `resolveModel(promptConfig.model)`, which is `openrouter.chat` in `app/lib/ai-config.ts`. Every seed prompt those routes load uses `z-ai/glm-5.2` (`app/lib/db/seed-prompts.ts`); `getPrompt` falls back to the same slug. `resolveModel` forwards any slug that already contains `/`, maps a non-slug id to `anthropic/claude-sonnet-4.6` (or Haiku for the legacy Haiku id), and the `prompts.model` column default is `anthropic/claude-sonnet-4.6`. The admin prompt editor presets are GLM 5.2, Sonnet 4.6, and Haiku 4.5. `POST /api/alignment/generate-document` renders a deterministic template and does not call a model. `discoverModels()` still calls the Vercel AI Gateway, and only for the admin model catalog.

## Issues Encountered

None. Resend, Vercel hosting, and Supabase on the same list still match the app, so those bullets stayed.

## Dependencies

None.

## Testing

Privacy copy only. Lint, type-check, `npm test`, and a production build. The `/privacy` page was opened in a browser to confirm the new sentences render.

## Next Steps

Leave the pull request open for Jon (Fleet Handbook 8d). Do not merge until he has looked.

## Impact Assessment

Visitors to `/privacy` see the processor that actually receives alignment text. The live site changes only after this pull request merges.
