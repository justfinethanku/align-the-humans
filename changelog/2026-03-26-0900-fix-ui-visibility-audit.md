# 2026-03-26 - Fix UI Visibility: shadcn/ui Color Token Audit

## What Changed

- Added missing shadcn/ui CSS variable definitions (`--background`, `--foreground`, `--card`, `--card-foreground`, `--muted`, `--muted-foreground`, `--popover`, `--popover-foreground`, `--secondary`, `--secondary-foreground`, `--destructive`, `--destructive-foreground`, `--input`, `--ring`) for both light and dark modes in `design-system/styles/design-system.css`
- Added corresponding Tailwind color token mappings in `design-system/tailwind.preset.ts` (`foreground`, `card`, `popover`, `muted`, `secondary`, `destructive`, `input`, `ring`, plus `primary.foreground` and `accent.foreground`)
- Created missing `/alignment/[id]/page.tsx` route that redirects to the correct step based on alignment status (draft→clarity, active→questions, analyzing→analysis, resolving→resolution, complete→document)
- Fixed `hsl(var(...))` → `rgb(var(...))` in document-content.tsx inline styles (CSS variables use RGB format, not HSL)
- Replaced fragile dynamic string-replacement color derivation in analysis page's `SectionHeader` with explicit color mapping object
- Fixed invalid `bg-card-dark` Tailwind class in DashboardClient (→ `bg-surface-dark`)

## Why

The shadcn/ui component library expects standardized CSS custom properties (`--background`, `--foreground`, `--card`, etc.) mapped to Tailwind utility classes (`bg-background`, `text-foreground`, `bg-card`, `text-card-foreground`, etc.). The design system only defined custom `--color-*` variables, leaving ~100 usages across 35 files resolving to no color — producing invisible text (white-on-white or transparent).

Additionally, clicking an alignment card from the dashboard navigated to `/alignment/[id]` which had no page, resulting in a 404.

## How

- Audited every page in the user journey: homepage → auth → dashboard → new alignment → clarity → questions → waiting → analysis → resolution → document → join
- Identified root cause: missing bridge between custom design system CSS variables and shadcn/ui's expected token names
- Added CSS variables with both light and dark mode values
- Extended Tailwind preset to map new tokens alongside existing design system tokens
- Fixed format mismatch (hsl vs rgb) in document content styles
- Created alignment detail router page for proper navigation

## Issues Encountered

- Build cannot complete in this environment due to Google Fonts network fetch failure (unrelated to changes)
- TypeScript compilation passes cleanly

## Dependencies

None added.

## Testing

- TypeScript type-check passes (`tsc --noEmit`)
- All shadcn/ui components now resolve to visible colors in both light and dark modes
- Alignment detail navigation now correctly routes based on status

## Next Steps

- Consider a light mode toggle if light mode support is desired
- The homepage components use some redundant `dark:` prefixes that could be cleaned up
