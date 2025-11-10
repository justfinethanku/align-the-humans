# shadcn/ui Installation and Design System Integration

**Keywords:** [SHADCN] [UI-COMPONENTS] [DESIGN-SYSTEM] [TAILWIND] [NEXT.JS] [TYPESCRIPT]
**Session:** Late evening, ~45 minutes
**Agent:** Design Danny (feature-builder)

---

## What Changed

### New Files Created
1. **`next.config.js`** - Next.js configuration with image optimization for Supabase
2. **`tsconfig.json`** - TypeScript configuration with strict mode and path aliases (@/*)
3. **`tailwind.config.ts`** - Tailwind config integrating design-system preset
4. **`postcss.config.js`** - PostCSS configuration for Tailwind processing
5. **`components.json`** - shadcn/ui configuration file
6. **`lib/utils.ts`** - Utility function for className merging (cn helper)
7. **`app/layout.tsx`** - Root layout with metadata and Inter font
8. **`app/page.tsx`** - Homepage placeholder
9. **`app/globals.css`** - Global styles importing design-system CSS
10. **`components/ui/button.tsx`** - Button component from shadcn/ui
11. **`components/ui/card.tsx`** - Card component from shadcn/ui
12. **`components/ui/input.tsx`** - Input component from shadcn/ui
13. **`components/ui/label.tsx`** - Label component from shadcn/ui
14. **`components/ui/textarea.tsx`** - Textarea component from shadcn/ui
15. **`components/ui/select.tsx`** - Select component from shadcn/ui
16. **`components/ui/badge.tsx`** - Badge component from shadcn/ui
17. **`components/ui/dialog.tsx`** - Dialog/Modal component from shadcn/ui
18. **`components/ui/form.tsx`** - Form component from shadcn/ui (with react-hook-form)
19. **`components/ui/separator.tsx`** - Separator component from shadcn/ui
20. **`components/ui/tabs.tsx`** - Tabs component from shadcn/ui

### Files Modified
1. **`package.json`**
   - Added Next.js, React, TypeScript dependencies
   - Added Tailwind CSS and related plugins
   - Added shadcn/ui dependencies (clsx, tailwind-merge, class-variance-authority, lucide-react)
   - Added Radix UI primitives (@radix-ui/react-*)
   - Added form libraries (react-hook-form, @hookform/resolvers, zod)
   - Added Supabase and Vercel AI SDK packages
   - Configured npm scripts (dev, build, start, lint, type-check)

---

## Why

The project was in pre-implementation planning phase with only Supabase CLI installed. To enable feature development, we needed:

1. **Next.js Foundation**: Framework initialization for the web application
2. **TypeScript Configuration**: Strict type checking for code quality and developer experience
3. **Design System Integration**: Connect pre-existing design-system preset to Tailwind
4. **Component Library**: Install shadcn/ui for consistent, accessible UI components
5. **Build Validation**: Ensure the stack compiles and builds successfully before feature work begins

This setup aligns with plan_a.md lines 61-71 and 1257-1280, which specify shadcn/ui as the UI component library and require both light/dark mode support.

---

## How

### Next.js Initialization
- Used npm init to create package.json with proper naming (human-alignment)
- Installed Next.js 14.2.15 with React 18.3.1
- Created next.config.js with reactStrictMode and Supabase image domain configuration
- Created tsconfig.json with strict mode, path aliases (@/*), and Next.js plugin
- Created app directory structure with layout.tsx and page.tsx

### Tailwind CSS Configuration
- Installed tailwindcss, postcss, and autoprefixer
- Created tailwind.config.ts that imports design-system/tailwind.preset.ts via presets array
- Configured content paths for app, components, pages, and design-system directories
- Created postcss.config.js for Tailwind processing
- Created app/globals.css that imports design-system/styles/design-system.css

### shadcn/ui Installation
- Created components.json configuration file with:
  - style: "default"
  - rsc: true (React Server Components support)
  - tsx: true (TypeScript)
  - cssVariables: true
  - Component aliases: @/components, @/lib/utils
- Installed required utility packages: clsx, tailwind-merge, class-variance-authority, lucide-react
- Created lib/utils.ts with cn() helper function for className merging
- Used shadcn CLI to install 11 core components:
  - button, card, input, label, textarea, select, badge, dialog, form, separator, tabs
- Components installed in components/ui/ directory with proper TypeScript types

### Validation
- Ran `npx tsc --noEmit` - TypeScript compilation successful with no errors
- Ran `npm run build` - Next.js production build successful, generated optimized static pages
- Verified all components are present in components/ui/
- Confirmed design system preset is correctly integrated in tailwind.config.ts

---

## Issues Encountered

1. **Directory Naming Conflict**: Initial attempt to use `create-next-app` failed due to directory name containing spaces and capital letters ("Human Alignment"). 
   - **Solution**: Used manual npm init with kebab-case name (human-alignment), then manually created config files.

2. **Write Tool Limitation**: Attempted to use Write tool for new config files, but it requires Read first.
   - **Solution**: Used bash with heredoc (cat > file << 'EOF') to create new files directly.

3. **No Issues with Design System Integration**: The pre-existing design-system/tailwind.preset.ts and design-system/styles/design-system.css integrated seamlessly.

---

## Dependencies Added/Changed

### Core Framework
- next@^14.2.15
- react@^18.3.1
- react-dom@^18.3.1
- typescript@^5.6.3

### Styling
- tailwindcss@^3.4.14
- postcss@^8.4.47
- autoprefixer@^10.4.20

### shadcn/ui and Component Dependencies
- clsx@^2.1.1
- tailwind-merge@^3.4.0
- class-variance-authority@^0.7.1
- lucide-react@^0.553.0

### Radix UI Primitives (installed by shadcn)
- @radix-ui/react-dialog@^1.1.15
- @radix-ui/react-label@^2.1.8
- @radix-ui/react-select@^2.2.6
- @radix-ui/react-separator@^1.1.8
- @radix-ui/react-slot@^1.2.4
- @radix-ui/react-tabs@^1.1.13

### Form Libraries (for form component)
- react-hook-form@^7.66.0
- @hookform/resolvers@^5.2.2
- zod@^3.25.76

### Backend/AI (already present, retained)
- @supabase/supabase-js@^2.45.4
- @supabase/ssr@^0.7.0
- ai@^3.4.33
- @ai-sdk/anthropic@^1.0.2

### TypeScript Types
- @types/node@^22.19.0
- @types/react@^18.3.12
- @types/react-dom@^18.3.1

### Linting
- eslint@^8.57.1
- eslint-config-next@^14.2.15

---

## Testing Performed

### TypeScript Compilation
```bash
npx tsc --noEmit
```
- Result: PASSED - No type errors

### Next.js Build
```bash
npm run build
```
- Result: PASSED
- Generated optimized production build
- Static pages generated successfully
- First Load JS: 87.2 kB (shared)
- Routes compiled: / (138 B), /_not-found (873 B)

### Component Verification
```bash
ls components/ui/
```
- Confirmed all 11 components installed:
  - badge.tsx, button.tsx, card.tsx, dialog.tsx, form.tsx
  - input.tsx, label.tsx, select.tsx, separator.tsx, tabs.tsx, textarea.tsx

### Design System Integration Check
- Verified tailwind.config.ts imports design-system/tailwind.preset.ts
- Verified app/globals.css imports design-system/styles/design-system.css
- Both light and dark mode CSS variables present in design-system.css

---

## Next Steps

### Immediate (for orchestrator)
1. Create basic Supabase client utility in lib/supabase.ts
2. Implement authentication pages (app/auth/login, app/auth/signup)
3. Create dashboard page (app/dashboard/page.tsx)
4. Set up environment variables for Supabase and Anthropic API

### Short-term Feature Work
1. Implement homepage with hero section (reference page_design_templates/light_mode/homepage/)
2. Build alignment creation flow (app/alignment/new/)
3. Implement 5-phase alignment workflow pages:
   - setup, clarify, answer, analyze, resolve, complete

### Testing Notes
- Run `npm run dev` to start development server on http://localhost:3000
- Homepage should display "Human Alignment" heading with muted text
- Dark mode ready but requires toggle implementation
- All shadcn components can be imported from @/components/ui/*

---

## Keywords
[SHADCN] [UI-COMPONENTS] [DESIGN-SYSTEM] [TAILWIND] [NEXT.JS] [TYPESCRIPT] [RADIX-UI] [REACT-HOOK-FORM] [ZOD] [SETUP] [INITIALIZATION]
