# 2026-10-24 17:41 — Security: jsPDF, zod 4, DOMPurify (FLEET-39 sweep)

**Keywords:** [SECURITY] [DEPENDENCIES] [ZOD] [JSPDF] [DOMPURIFY] [AI-SDK]

## What Changed
- `jspdf` 4.1.0 → 4.2.1 (lockfile; under `html2pdf.js`). Fixes the critical jsPDF advisories (ATH-28).
- `dompurify` 3.3.1 → 3.4.17 (lockfile). `isomorphic-dompurify` stays pinned at 2.26.0, so `jsdom` 26.1.0 / `parse5` 7.3.0 are unchanged (ATH-7).
- `zod` ^3.25.76 → ^4.6.7, fixing GHSA-mrhx-c7xc-m3w5 (memory exhaustion from oversized arrays) (ATH-27).
- `ai` pinned exactly at `5.0.222` (was ^5.0.90). This brings `@ai-sdk/provider-utils` 3.0.30, past its advisory.
- `npm audit fix` lockfile bumps for postcss, nanoid, ws, source-map-js, uuid, fflate and others.
- Code changes for zod 4: `ZodError.errors` → `.issues` (5 places), and `z.record(v)` → `z.record(z.string(), v)` (2 places).

## Why
Vulnerability scan on 2026-10-24 (Linear ATH-27, ATH-28; older ATH-7).

## How
- `npm audit fix`, then `npm install --save-exact ai@5.0.222 zod@^4.6.7`.
- Why `ai` is pinned exactly: `npm audit fix` raised `ai` to 5.0.281. From ai 5.0.223 on, `@ai-sdk/provider-utils` (3.0.31+) depends on `undici` 5, which pulls in a vulnerable `@fastify/busboy`. 5.0.222 is the newest 5.x without that problem. Re-check before moving the pin.
- zod 4 `.uuid()` now enforces RFC 9562 variant bits. Every id column defaults to `gen_random_uuid()`, so real ids still pass.

## Issues Encountered
- Without Supabase env vars, a local `next build` fails at prerender (both before and after this change). Builds were run with placeholder env values.

## Dependencies
Upgraded as listed above. No new packages.

## Testing
- Lint, type-check, `npm test` (7/7) and build pass, with the same build warnings as before.
- A throwaway script tested the zod 4 schemas in `app/lib/schemas.ts` and the three `generateObject` schemas, using their real route source. It checked that they parse and reject correctly and that the AI SDK converts them to JSON Schema. It also checked that 500k bad elements against `.max(10)` produce 1 issue in 2 ms.
- Server-side `isomorphic-dompurify` loads via `require` (no ERR_REQUIRE_ESM) and strips script, onerror, javascript: URLs, mXSS and SVG payloads, while keeping the `class`/`id` markup.
- `npm audit --omit=dev`: 15 (2 critical, 6 high) → 2 (1 critical, 1 high). Both remaining are `next` 14 and the postcss bundled inside it (ATH-6, needs a Next major upgrade).

## Next Steps
- ATH-6: Next 14 → 15.5.28+/16.x (with React 19). This clears the last critical and the bundled postcss.
- After deploy, check the PDF export and the document route in production.
