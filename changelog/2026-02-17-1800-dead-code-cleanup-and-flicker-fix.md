# 2026-02-17 18:00 - Dead Code Cleanup & UI Flicker Fixes

## What Changed

### Dead Code Cleanup (~2,000 lines removed)
- **Deleted stale files:** `lib/database.types.ts` (436 lines, duplicate of `app/lib/`), `app/lib/env.ts` (159 lines, unused), `components/ui/tabs.tsx` (55 lines, unused)
- **Deleted test/example files:** `AddPartnerModal.example.tsx`, `PartnersList.test-example.tsx`, `DashboardHooksTest.tsx`, `test-generate-questions.ts`, `app/test-alignment-card/` (3 files)
- **Trimmed `app/lib/utils.ts`** from 363 to ~105 lines: removed unused `arrayUtils`, `objectUtils`, `validation`, `sleep`, `debounce`, `throttle`, `formatCurrency`, `formatNumber`, `generateId`, and unused dateUtils/stringUtils methods
- **Trimmed `app/lib/telemetry.ts`:** removed unused `withAITelemetry` and `devLog` functions
- **Trimmed `app/lib/resend.ts`:** removed unused `SUPPORT_EMAIL` export
- **Uninstalled 3 npm packages:** `@supabase/auth-helpers-nextjs`, `dotenv`, `@radix-ui/react-tabs`

### UI Flicker Fixes
- **Font loading:** Changed `display: 'swap'` to `display: 'optional'` in `app/layout.tsx` to prevent Flash of Unstyled Text (FOUT)
- **Tailwind alpha fix:** Fixed `design-system/tailwind.preset.ts` background/surface colors from hardcoded `/ 1` alpha to `<alpha-value>` placeholder so Tailwind opacity modifiers (`bg-surface-default/95`) actually work
- **Skeleton loading states:** Replaced all 4 `loading.tsx` files (root, dashboard, alignment/new, alignment/[id]) with skeleton UIs matching their page layouts instead of jarring full-screen spinners
- **Transition optimization:** Changed `transition-all` to `transition-[box-shadow,transform]` on template cards in `NewAlignmentClient.tsx`

## Why
- Dead code adds confusion and maintenance burden; 2,000 lines of unused code removed
- UI flickering was caused by compounding issues: font swap flash + spinner-to-content flash + broken backdrop-blur transparency + expensive CSS transitions

## Issues Encountered
- `html2pdf.js` was flagged as unused by static import scanning, but it uses dynamic `import()` syntax invisible to grep. Reinstalled after build failure.

## Testing
- `npm run build` passes with all changes
