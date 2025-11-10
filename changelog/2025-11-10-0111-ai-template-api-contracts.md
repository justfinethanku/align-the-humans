# 2025-11-10-0111 - AI template + API contract updates

**Keywords:** [PLANNING] [AI] [API] [NEXTJS]
**Session:** Late night (~40 min)
**Commit:** N/A (uncommitted working tree)

## What Changed
- Expanded `plan_a.md` to replace static question templates with an AI-generated flow, including a strict `AlignmentQuestion` schema, persistence/versioning guidance, sanitized reuse strategy, and a monitoring/tuning loop.
- Added concrete request/response contracts and error semantics for each planned AI endpoint (`generate-questions`, `analyze`, `resolve-conflicts`, `generate-document`, `get-suggestion`) plus telemetry guidance.

## Why
- We want the alignment experience to feel personalized, so templates must be generated from user intent rather than fixed seed data.
- Clear API contracts prevent frontend/backend drift once the Next.js app is scaffolded and make it easier to reason about Supabase writes and AI usage limits.

## How It Was Done
- Reworked the “Templates for questions” section of `plan_a.md` to describe the intent-capture pipeline, schema validation, Supabase storage model, fallback curated templates, and quality feedback loop.
- Documented JSON payloads, response envelopes, failure codes, and telemetry expectations for each `/api/alignment/*` route, emphasizing consistent `data`/`error` wrappers.

## Issues Encountered
- None—changes were documentation-only.

## Dependencies
- No new packages or environment changes; work stays within planning docs.

## Testing Notes
- Not applicable (plan-level updates only).

## Next Steps
- Scaffold the Next.js 14 app, wire Supabase + Vercel AI SDK, and implement the documented endpoints using the new schemas.
- Define the status vocabulary mapping so UI badges line up with Supabase enums.

## Impact Assessment
- The plan now captures how AI-generated question templates will be validated, stored, reused, and monitored, reducing ambiguity for implementation.
- API contracts ensure future work can proceed without rehashing payload structure.

## Lessons Learned
- Even in early planning, locking down schema shapes and API envelopes avoids confusion later and makes it easier to add observability from day one.
