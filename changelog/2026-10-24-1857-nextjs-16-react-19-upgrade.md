# Next.js 14 → 16 and React 18 → 19 (ATH-6)

**Keywords:** [SECURITY] [DEPENDENCIES] [NEXTJS] [REACT] [ESLINT] [TURBOPACK]
**Session:** 2026-10-24, evening
**Branch:** `jon/ath-6-upgrade-nextjs-14-past-critical-and-high-advisories`

## What Changed
- `next` ^14.2.15 (14.2.35 installed) → ^16.4.3. `react` / `react-dom` ^18.3.1 → ^19.3.1, plus `@types/react` / `@types/react-dom` 19.
- `eslint` 8 → 9 and `eslint-config-next` 14 → 16.4.3. `next lint` was removed in Next 16, so `npm run lint` is now `eslint .`, with a flat config in `eslint.config.mjs`. `.eslintrc.json` is deleted.
- Async request APIs (Next 15+ removed the synchronous versions):
  - `createServerClient()` and `createAdminClient()` in `app/lib/supabase-server.ts` are now `async` (`await cookies()`). All 43 call sites now `await` them. Local `ReturnType<typeof createX>` aliases became `Awaited<ReturnType<...>>`.
  - In the login and signup actions, `getClientIp()` and `authRateLimitKey()` are now async (`await headers()`).
  - `alignment/new/page.tsx` awaits `searchParams`. Every other page already took `params` as a Promise.
- `middleware.ts` → `proxy.ts`, with the function renamed `proxy`. This is the official codemod; the logic and matcher are unchanged.
- `app/llms.txt/route.ts` exports `dynamic = 'force-static'`. Next 15 stopped caching GET route handlers by default, and this keeps it static as it was on 14.
- React 19 type fixes: `useRef` now needs an initial value (ClarityForm), ref props are typed `RefObject<T | null>` (site motion hooks), and `JSX.Element` → `React.JSX.Element`.
- `api/alignment/join`: removed the `request.ip` fallback, which no longer exists on `NextRequest`. On Vercel, `x-forwarded-for` is always set, so this fallback was never reached.
- `package.json`: removed `"type": "commonjs"`, an `npm init` leftover. Turbopack (the default bundler in 16) refuses to build ESM source under it. Node's default is CommonJS anyway.
- Changes made after code review:
  - Login and signup use `useActionState` from `react` instead of the deprecated `react-dom` `useFormState`.
  - Helpers now take the exported `SupabaseServerClient` / `SupabaseAdminClient` types, replacing local aliases.
  - Removed the duplicate ESLint ignore list.
  - Updated "Next.js 14" / "Middleware" wording in `plan_a.md`, `.cursor/install.sh`, `proxy.ts` and `supabase-server.ts`.
- `tsconfig.json`: Next rewrote it during the build (`jsx: react-jsx`, `target`, `.next/dev/types`).

## Why
ATH-6. `npm audit --omit=dev` showed `next` 14.2.35 as critical (image optimizer RCE, Server Components and Server Actions DoS, SSRF, cache poisoning and more) and the `postcss` bundled inside it as high. There is no patched 14.x. Jon approved the upgrade on 2026-10-24.

## How It Was Done
- Version choice: probed both targets in a scratch copy of the lockfile.
  - Next 15.5.28 + React 19 clears the Next critical, but still leaves the bundled `postcss` high (2 findings).
  - Next 16.4.3 gets `npm audit --omit=dev` to 0.
  - The extra work from 15 to 16 is small: the ESLint CLI, Turbopack builds and the proxy rename. 15 already brings the async APIs and React 19. So 16 was chosen.
- Ran the official codemods (`@next/codemod@16.4.3`): `next-async-request-api`, `next-lint-to-eslint-cli`, `middleware-to-proxy`. The async codemod left `UnsafeUnwrapped*` casts in three places. Those throw at runtime in 16, so they were replaced with real `await`s.
- `authRateLimitKey` interpolates the IP into a string. If only `getClientIp` had gone async, the key would have silently become `"...:ip:[object Promise]"` (tsc doesn't flag that), and every user would share one rate-limit bucket. It was made async too.
- `eslint-config-next` 16 brings in `eslint-plugin-react-hooks` 7 and its React Compiler rules. Three of them flagged 11 existing patterns: setState in a mount effect, a hoisted function used in an effect, and JSX inside try/catch in a server component. None is a bug, and the app doesn't use the compiler, so those three rules are off in `eslint.config.mjs`. Six warnings remain visible, all of them `window.location.href = '/'` in error boundaries (intentional full reloads) plus one unused disable comment.
- ESLint stays on 9 (maintenance line) because the plugins in `eslint-config-next` don't support 10 yet.

## Issues Encountered
- The first Next 16 build failed on `"type": "commonjs"` (see above).
- A local `next build` needs Supabase env values to prerender, both before and after. Builds were run with placeholder values.

## Dependencies
next 16.4.3, react / react-dom 19.3.1, @types/react / @types/react-dom 19, eslint 9.39.5, eslint-config-next 16.4.3. No new direct dependencies.

## Testing Notes
- Before (main at f9802d9): lint clean, tsc clean, `npm test` 7/7, build passes, `npm audit --omit=dev` 2 findings (1 critical, 1 high).
- After: lint 0 errors / 6 warnings, tsc clean, `npm test` 7/7, build passes, `npm audit --omit=dev` **0**. The full audit including dev tools went from 8 to 4; the 4 left are dev-only (glob, Tailwind 3's postcss-selector-parser).
- The static/dynamic route split matches Next 14 exactly: the same 14 static routes.
- Local `next start` smoke test:
  - `/`, `/pricing`, `/example`, `/login`, `/llms.txt`, `/robots.txt` and `/sitemap.xml` return 200.
  - `/dashboard` with no session returns 307 to `/login?redirectTo=%2Fdashboard`.
  - GET `/api/alignment/generate-document` returns 405 JSON.
  - POST `/api/alignment/generate-questions` with no session returns 401 JSON.
  - `/_next/image` serves the hero JPEG.
  - The security headers and report-only CSP are present.
- Not tested: signed-in flows (PDF export, live AI generation), because this machine has no login.

## Next Steps
- The proxy now runs on the Node.js runtime (Edge on 14). It makes the same single `auth.getUser()` round trip per page request. Compare production TTFB after the deploy.
- Pre-existing issues the review found near this change. They are separate from this upgrade and are filed as their own tickets:
  - The clarity page's status `redirect()` is swallowed by its try/catch, so users land on `/dashboard`. Fix: `unstable_rethrow`.
  - `createAdminClient` reads user cookies, so its `.from()` queries run as the user, not the service role.
  - The email IIFEs in `sign` / `analyze` should use `after()`.
- `next/image` `priority` is deprecated in 16 in favour of `preload`. It still works and was left as is.
- Once logged in on production, check a full journey, especially the PDF export and one live `generateObject` call.
- Optional: adopt the React Compiler rules one at a time, and move Tailwind 3 → 4 to clear the remaining dev-only audit findings.

## Impact Assessment
The last production audit findings are cleared. Users should see no change in behaviour.
