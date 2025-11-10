# 2025-11-10-0122 - design source sync

**Keywords:** [PLANNING] [DESIGN] [TAILWIND] [DOCS]
**Session:** Late night (~15 min)
**Commit:** N/A

## What Changed
- Added a "Design Source of Truth" section to `plan_a.md` detailing how to use the `page_design_templates` packages (code.html + screen.png) and how to port Tailwind configs/styles into the Next.js project.
- Updated every feature section to reference the exact template paths so implementers know which `code.html` file to translate into React components.

## Why
- We want the provided HTML/Tailwind mockups to be the canonical spec so the built UI matches the screenshots exactly, without guessing on spacing or colors.

## How It Was Done
- Documented the translation workflow (copy Tailwind config, break markup into components, preserve class names) and linked each page to its corresponding template folder.

## Issues Encountered
- None.

## Dependencies
- No dependency changes.

## Testing Notes
- Not applicable—planning/doc update only.

## Next Steps
- When scaffolding the Next.js app, import the Tailwind theme overrides and start converting the template HTML into components per the new section.

## Impact Assessment
- Everyone now shares the same reference for UI implementation, reducing rework once development begins.

## Lessons Learned
- Bundling code+image templates is only useful if we explicitly point builders to them; documenting the workflow removes ambiguity.
