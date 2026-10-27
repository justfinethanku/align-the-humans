# 2026-10-27-2245 - ATH-38 AI empty reply recovery

**Keywords:** [AI] [OPENROUTER] [RETRY] [FALLBACK] [ATH-38]
**Session:** Oct 27, 2026, evening
**Commit:** 1a640ae2ec18c1d765f6a4c84262ccb6174ff98c

### What Changed
- Empty or schema-invalid model output is retried once on the prompt's model, then once on the other model named in `AI_MODELS`.
- Clarity suggestions, inline suggestions, analysis, question generation, and conflict resolution use that path.
- When it still fails, the API message is "The AI didn't return a usable answer. Please try again." Clarity, the questionnaire, and resolution show that message.
- Unit tests cover an empty reply, a schema-invalid object, and the user-facing message.

### Why
Production `POST /api/alignment/clarity/suggest` returned 502 when `z-ai/glm-5.2` sent an empty reply. The same call had succeeded 30 seconds earlier. The route treated one empty reply as a hard failure, and the page showed "Failed to fetch suggestions".

### How It Was Done
The primary model stays `prompts.model` via `resolveModel`. There is no new database column. `fallbackModelFor` picks Haiku for short suggestions and Sonnet for structured generation, or the other slug when the prompt already uses the preferred one. `generate-document` does not call a model, so it is unchanged.

### Issues Encountered
None during the recovery implementation.

### Dependencies
No package changes.

### Testing Notes
`npm test` covers the empty-reply and schema-invalid cases with an injected generator. Lint, type-check, and the production build are part of CI.

### Next Steps
Confirm the Vercel production deployment after merge. No migration to apply.

### Impact Assessment
A transient empty reply costs one extra model call, and a model that keeps returning nothing costs one call to the alternate model, before the user is asked to try again.

### Lessons Learned
The AI SDK retries HTTP failures. It does not retry a 200 with an empty body. That case has to be handled in the app.
