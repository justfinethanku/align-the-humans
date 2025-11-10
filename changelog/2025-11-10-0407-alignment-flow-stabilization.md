# 2025-11-10-0407 - alignment flow stabilization

**Keywords:** [ALIGNMENT] [AI] [SUPABASE] [UI] [PDF]
**Session:** Early morning (~90 min)
**Commit:** N/A

## What Changed
- Persist AI-generated templates by updating `alignments.template_id`, flipped the clarity flow to pass the selected seed, and redirected users to `/questions` instead of the non-existent `/answer` route.
- Rebuilt the questionnaire loader to pull questions from `alignment.template_id`, added curated fallbacks, and wired partner selection to Supabase when a real profile is chosen.
- Created `alignment_status_view` (with migration + types) and refactored `useDashboardData` to read derived UI statuses directly from the view instead of recomputing them client-side.
- Hardened the analysis/doc stages: the analysis page now auto-triggers the API server-side and reads camelCase result keys, document pages respect `/resolution`, require a template ID, and the canonical snapshot includes the question set.
- Implemented real PDF exports via `html2pdf.js`, added a types stub, and improved document sharing UX.
- Added quality-of-life corrections (status redirects, template metadata, partner data hydrations, lint cleanup) plus updated tests (`npm run lint`).

## Why
- Alignments could never progress because templates weren’t linked to records, clarity pushed to a dead route, and partner choices weren’t persisted.
- Dashboard status badges drifted from reality due to duplicated logic, analysis reports rendered empty, and document downloads were just `window.print()`.
- Signatures lacked canonical question context, making “signed” agreements unverifiable.

## How It Was Done
- Updated API routes (`generate-questions`, `submit-resolution`, `sign`) and client screens (clarity/questions/analysis/document) to use the new template + status plumbing and ensured Supabase rows are updated atomically.
- Added a migration + type updates for `alignment_status_view`, rewired the dashboard hook to query the view, and dropped the bespoke UI-status math.
- Introduced `html2pdf.js`, injected an element ID into `DocumentContent`, and replaced the download action with an actual PDF export pipeline.

## Issues Encountered
- ESLint flagged the unused fetch response in `ClarityForm`; resolved by removing the temporary variable after we stopped depending on it.

## Dependencies
- Added `html2pdf.js@0.10.1` for client-side PDF generation.

## Testing Notes
- `npm run lint`

## Next Steps
- Consider persisting partner invites for manual entries (emails) and hydrate the dashboard with additional partner metadata (avatars).
- Tighten analysis/document error messaging once generative retries are added.
