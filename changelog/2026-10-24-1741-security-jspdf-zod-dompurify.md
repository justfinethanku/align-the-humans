# Security: jsPDF, zod 4, DOMPurify (FLEET-39 sweep)

**Keywords:** [SECURITY] [DEPENDENCIES] [ZOD] [JSPDF] [DOMPURIFY] [AI-SDK]
**Session:** 2026-10-24, afternoon, about 1.5 hours
**Commit:** `74e7712` (upgrade), plus a follow-up commit on branch `sec/fleet-39-jspdf-zod` (review fixes)

## What Changed
- `jspdf` 4.1.0 → 4.2.1 (lockfile only; it's under `html2pdf.js`). Fixes the critical jsPDF advisories (ATH-28).
- `dompurify` 3.3.1 → 3.4.17 (lockfile only). `isomorphic-dompurify` stays pinned at 2.26.0, so `jsdom` 26.1.0 and `parse5` 7.3.0 are unchanged (ATH-7).
- `zod` ^3.25.76 → ^4.6.7, fixing GHSA-mrhx-c7xc-m3w5 (memory exhaustion from oversized arrays) (ATH-27).
- `ai` pinned at exactly `5.0.222` (was ^5.0.90). This brings `@ai-sdk/provider-utils` 3.0.30, past its advisory.
- Other `npm audit fix` changes, all inside existing caret ranges:
  - `resend` 6.9.2 → 6.34.1. This drops `svix` and `uuid` and adds `standardwebhooks`. The app only calls `new Resend().emails.send` (`app/lib/resend.ts`).
  - `supabase` CLI (dev) 2.54.11 → 2.122.0.
  - Transitive: postcss, nanoid, ws, source-map-js, fflate, plus the eslint/glob tooling.
- Code changes for zod 4:
  - `ZodError.errors` → `.issues` (5 places).
  - `z.record(v)` → `z.record(z.string(), v)` in `app/lib/schemas.ts`.
  - In the generate-questions `generateObject` schema, `metadata` is now an explicit object (`category`, `placeholder`, `min`, `max`, all optional).
  - Removed an unused `AlignmentQuestionSchema` import.

## Why
Vulnerability scan on 2026-10-24: Linear ATH-27 and ATH-28, plus the older ATH-7.

## How It Was Done
- Ran `npm audit fix`, then `npm install --save-exact ai@5.0.222 zod@^4.6.7`.
- Why `ai` is pinned exactly: `npm audit fix` raised `ai` to 5.0.281. From ai 5.0.223 on, `@ai-sdk/provider-utils` (3.0.31+) depends on `undici` 5, which pulls in a vulnerable `@fastify/busboy`. No fixed 2.x busboy exists, so an override isn't clean. 5.0.222 is the newest clean 5.x. If you move the pin, re-run `npm audit`.
- Why `metadata` is an explicit object: with zod 4, provider-utils 3.0.30 adds `additionalProperties: false` to every object, records included. A `z.record` would tell the model that metadata must be empty (OpenRouter sends `strict: true`). Listing the keys the questionnaire reads avoids that.
- zod 4's `.uuid()` now enforces RFC 9562 variant bits. Every id column defaults to `gen_random_uuid()`, so real ids still pass.

## Issues Encountered
- The first `npm audit fix` swapped one advisory for another (`ai` → undici/busboy). This was fixed with the exact pin above.
- The zod 4 record behaviour described above was caught in code review. Type-check and the schema-conversion check both passed without catching it.
- Without Supabase env vars, a local `next build` fails at prerender, both before and after this change. Builds were run with placeholder env values.

## Dependencies
See What Changed. Only zod moved a major version. No new direct dependencies.

## Testing Notes
- Lint, type-check, `npm test` (7/7) and `next build` pass, with the same build warnings as `main`.
- A throwaway script tested the shared schemas and the three `generateObject` schemas, using their real route source, under zod 4:
  - Parsing, the refine on choice questions, recursive followUps, rejection of bad uuids, and `.issues`/`.format()` all behave as before.
  - The AI SDK produces JSON Schema for all three.
  - 500k bad elements against `.max(10)` give 1 issue in 2 ms.
  - The metadata JSON Schema now lists its four keys.
- Server-side `isomorphic-dompurify` loads via `require` (no ERR_REQUIRE_ESM). It strips script, onerror, javascript: URLs, mXSS and SVG payloads, and keeps the document's `class`/`id` markup.
- Vercel preview: the homepage returns 200, and `/api/alignment/generate-document` (which loads `isomorphic-dompurify`) returns its own 405, so the module loaded. No runtime errors.
- Not tested: a live AI call, or the PDF export in a browser.

## Next Steps
- ATH-6: upgrade Next 14 to 15.5.28+ or 16.x (with React 19). That clears the last critical advisory and the postcss bundled inside Next.
- After deploying, check on production: the document route, the PDF export, and one live `generateObject` call (generate-questions or analyze).
- Optional: remove `@hookform/resolvers` (nothing imports it), and make generate-questions use `safeParse` so bad input returns a 400 instead of a 500.

## Impact Assessment
`npm audit --omit=dev` went from 15 findings (2 critical, 6 high) to 2. Both remaining findings are `next` 14, tracked in ATH-6. Users should see no change.

## Lessons Learned
- Run `npm audit` again after `npm audit fix`. A caret-range bump can bring in a new advisory.
- A JSON Schema that converts without errors isn't proof it's right. Read what it actually tells the model.
