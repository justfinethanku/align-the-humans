# 2025-11-10-0127 - design system assets

**Keywords:** [DESIGN] [TAILWIND] [STYLES] [PLANNING]
**Session:** Late night (~25 min)
**Commit:** N/A

## What Changed
- Added `design-system/tailwind.preset.ts` containing reusable Tailwind tokens (color scales, typography, shadows, animations) referenced by the HTML mocks.
- Added `design-system/styles/design-system.css` to define CSS variables for palette switching plus shared utility classes (`glass-card`, `particle-container`, etc.).
- Documented usage in `design-system/README.md` and updated the design section of `plan_a.md` to reference the preset/CSS import path.

## Why
- Having the Tailwind preset + CSS utilities checked into the repo means the eventual Next.js scaffold can adopt the exact design tokens from `page_design_templates/` without re-copying inline configs from each HTML file.

## How It Was Done
- Normalized the emerald/indigo/amber palettes into CSS variables and referenced them from the Tailwind preset using `rgb(var(--token) / <alpha-value>)` helpers.
- Ported bespoke styles (particle background, gradient borders, glass cards, Material Symbols settings) into layered CSS so they can be @imported once.
- Updated `plan_a.md` to mention the new resources and clarify that template-specific overrides should extend the shared preset.

## Issues Encountered
- None.

## Dependencies
- No new npm packages yet (installation will happen when Next.js is scaffolded).

## Testing Notes
- Not applicable until Tailwind builds run inside the future Next.js app.

## Next Steps
- When the app is scaffolded, include the preset via Tailwind’s `presets` option and import the CSS file in `app/globals.css`.

## Impact Assessment
- Developers now have a single source of truth for design tokens/utilities, reducing the manual copy/paste work from each HTML mock.

## Lessons Learned
- Converting design HTML snippets into Tailwind presets early speeds up implementation and keeps multiple pages on the same palette/typo system.
