# ATH-23: README and agent docs match the public site and the AI stack

**Keywords:** [DOCS] [README] [AGENTS] [OPENROUTER] [THEME] [ATH-23]
**Session:** 2026-10-27, about 20:24 UTC
**Commit:** see the merge commit for the ATH-23 PR on `main`

## What Changed

- `README.md` addresses two business partners, says the GitHub repo is public, names Next.js `^16.4.3` and React `^19.3.1`, states the light default theme, and points schema readers at `supabase/migrations`.
- `CLAUDE.md` states those same facts next to the `@AGENTS.md` import.
- `AGENTS.md` no longer says dark mode by default or `@ai-sdk/anthropic` with Claude Sonnet 4.5. Generation is OpenRouter, with `AI_MODELS.SONNET` as `anthropic/claude-sonnet-4.6`.

## Why

Agents read these files first. The old tagline, private-repo line, Anthropic SDK, Sonnet 4.5 model id, dark default, and `plan_a.md` schema pointer described a product the code no longer is.

## How It Was Done

Each claim was checked against the current tree: `package.json`, `app/lib/ai-config.ts`, `app/layout.tsx`, `app/page.tsx`, `components/homepage/FAQ.tsx`, `design-system/tailwind.preset.ts`, `components/site/site.css`, `supabase/migrations`, `app/lib/db/seed-prompts.ts`, and `gh repo view` for visibility. Env-var names from ATH-12 were left as they are.

## Issues Encountered

`CLAUDE.md` is the `@AGENTS.md` import from FLEET-98, so the stale AI and theme sentences lived in `AGENTS.md`. Both files now state the facts. Seed prompts name `z-ai/glm-5.2` while `AI_MODELS.SONNET` and the `prompts.model` default are `anthropic/claude-sonnet-4.6`. The docs say both, because `resolveModel` forwards an existing OpenRouter slug.

## Dependencies

None.

## Testing

Docs-only. Confirmed the edited sentences against the files above. CI on the pull request runs lint, type-check, tests, and build.

## Next Steps

None for ATH-23. `plan_a.md` and `context/model-integrations.md` still describe the old model. The agent docs now say those files are stale.

## Impact Assessment

A new agent session should pick OpenRouter and `anthropic/claude-sonnet-4.6`, a light default theme, business-partner copy, and `supabase/migrations` for the schema.
