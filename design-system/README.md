# Design System Starter

This folder packages the reusable Tailwind configuration + global styles extracted from the `page_design_templates/` HTML mocks. Drop these files into the Next.js app once it is scaffolded so that every page matches the provided designs.

## Files

- `tailwind.preset.ts` – Tailwind preset exporting the shared tokens (colors, fonts, radii, shadows, animations). Import it from your app-level `tailwind.config.ts` via `presets: [require('./design-system/tailwind.preset').default]` once Tailwind is installed.
- `styles/design-system.css` – Base stylesheet that defines CSS variables for the palettes (`:root`, `.theme-emerald`, `.theme-indigo`, etc.), registers bespoke components (`.glass-card`, `.metric-card`) and utilities (`.particle-container`, `.gradient-border`). Add `import '../design-system/styles/design-system.css'` inside your global layout after scaffolding.

## Usage

1. **Scaffold Next.js + Tailwind** as usual (`npx create-next-app@latest --ts --tailwind`).
2. Replace the generated `tailwind.config.ts` content with:
   ```ts
   import type { Config } from 'tailwindcss';
   import preset from './design-system/tailwind.preset';

   const config: Config = {
     content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
     darkMode: 'class',
     presets: [preset],
   };

   export default config;
   ```
3. In `app/globals.css`, import the design system stylesheet before other layers:
   ```css
   @import '../design-system/styles/design-system.css';
   ```
4. Wrap sections/pages with `.theme-emerald`, `.theme-indigo`, or `.theme-amber` classes whenever you need a different primary palette.
5. Use the utilities defined in the CSS (`glass-card`, `particle-container`, etc.) directly in your JSX to replicate the HTML mocks.

## Extending

- Add new palettes by extending the CSS variables and calling `createScale('--color-new')` in the preset.
- If a specific template introduces bespoke CSS, place it under `@layer components` or `@layer utilities` inside `styles/design-system.css` so it stays centralized.
